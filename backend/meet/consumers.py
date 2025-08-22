import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.shortcuts import get_object_or_404
from django.utils import timezone
from channels.db import database_sync_to_async
from .models import Room, Invitation, Message
from django.contrib.auth.models import User

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Handle both room_name and room_id URL parameters
        self.room_name = self.scope['url_route']['kwargs'].get('room_name')
        self.room_id = self.scope['url_route']['kwargs'].get('room_id')
        self.room_group_name = None  # Initialize to avoid AttributeError
        
        user = self.scope["user"]

        print(f"WebSocket connection attempt for room_name: {self.room_name}, room_id: {self.room_id}")
        print(f"User: {user}, Authenticated: {user.is_authenticated}")

        if not user.is_authenticated:
            print("User not authenticated, closing connection")
            await self.close()
            return
        
        try:
            # Get room either by name or ID
            if self.room_id:
                room = await self.get_room_by_id(self.room_id)
            elif self.room_name:
                room = await self.get_room_by_name(self.room_name)
            else:
                raise Exception("No room identifier provided")
                
            invitation = await self.get_valid_invitation(user, room)
            print(f"Valid invitation found: {invitation}")
            
            # Create group name using room ID (same as in tasks.py)
            self.room_group_name = f'chat_{str(room.id).replace("-", "_")[:50]}'
            
        except Exception as e:
            print(f"Invitation validation failed: {e}")
            await self.close()
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        print(f"WebSocket connection accepted for user {user.email} in room {room.name}")

        # Load and send previous messages upon connection
        messages = await self.get_room_messages(room)
        for message_data in messages:
            await self.send(text_data=json.dumps({
                'message': message_data['content'],
                'username': message_data['user_email'],  # Use pre-fetched email
                'timestamp': message_data['timestamp']
            }))


    async def disconnect(self, close_code):
        # Only try to leave group if room_group_name was set
        if hasattr(self, 'room_group_name') and self.room_group_name:
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_content = text_data_json['message']
        user = self.scope['user']
        
        # Get room either by name or ID
        if self.room_id:
            room = await self.get_room_by_id(self.room_id)
        elif self.room_name:
            room = await self.get_room_by_name(self.room_name)
        else:
            return  # No room identifier
        
        # Save the message to the database
        await self.save_message(user, room, message_content)

        # Broadcast the message to the group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message_content,
                'username': user.email,  # Use email instead of username
                'timestamp': timezone.now().isoformat()
            }
        )


    async def chat_message(self, event):
        message = event['message']
        username = event['username']
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'username': username,
        }))

    async def movie_started(self, event):
        """Handle movie started notification"""
        await self.send(text_data=json.dumps({
            'type': 'movie_started',
            'message': event['message'],
            'movie_title': event['movie_title'],
            'started_at': event['started_at']
        }))

    async def movie_stopped(self, event):
        """Handle movie stopped notification"""
        await self.send(text_data=json.dumps({
            'type': 'movie_stopped',
            'message': event['message'],
            'movie_title': event['movie_title'],
            'stopped_at': event['stopped_at']
        }))

    @database_sync_to_async
    def get_valid_invitation(self, user, room):
        # Allow room creator to always join
        if room.creator == user:
            print(f"Room creator {user.email} joining room {room.name}")
            return True
            
        # For invited users, check for valid invitation (can be used or unused)
        try:
            invitation = Invitation.objects.filter(
                invited_user=user, 
                room=room, 
                expires_at__gte=timezone.now()
            ).first()
            if invitation:
                print(f"Valid invitation found for {user.email} in room {room.name}")
                return invitation
            else:
                print(f"No valid invitation found for {user.email} in room {room.name}")
                raise Exception("No valid invitation")
        except Exception as e:
            print(f"Invitation check failed: {e}")
            raise

    @database_sync_to_async
    def get_room_by_name(self, room_name):
        return Room.objects.get(name=room_name)

    @database_sync_to_async
    def get_room_by_id(self, room_id):
        return Room.objects.get(id=room_id)

    @database_sync_to_async
    def get_room_messages(self, room):
        # Fetch up to the last 50 messages for the chat history with user info
        messages = room.messages.select_related('user').order_by('-timestamp')[:50]
        return [
            {
                'content': msg.content,
                'user_email': msg.user.email,
                'timestamp': msg.timestamp.isoformat()
            }
            for msg in messages
        ]

    @database_sync_to_async
    def save_message(self, user, room, content):
        Message.objects.create(user=user, room=room, content=content)
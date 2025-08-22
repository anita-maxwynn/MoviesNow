# livekit/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils.crypto import get_random_string
from .models import Room, Invitation
from django.conf import settings
from .utils import generate_livekit_token

User = get_user_model()

class WaitingRoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.user = self.scope['user']

        # Group name for the waiting room
        self.group_name = f"waiting_room_{self.room_id}"

        # Check if invited
        invited = await self.is_invited(self.room_id, self.user.email)
        if not invited:
            await self.close(code=4001)  # custom code: not invited
            return

        # Accept connection
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Notify owner that someone joined waiting room
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "waiting.room.join",
                "user_email": self.user.email,
            }
        )

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # Called when owner approves user
    async def receive(self, text_data):
        data = json.loads(text_data)

        if data.get("action") == "approve" and self.user.is_authenticated:
            # Only creator can approve
            if await self.is_creator(self.room_id, self.user.id):
                approved_email = data["email"]

                # Get room info for token generation
                room = await self.get_room(self.room_id)
                
                # Issue LiveKit token
                token = await self.issue_livekit_token(approved_email, room.livekit_room_name)
                # Notify specific user
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        "type": "waiting.room.approved",
                        "email": approved_email,
                        "token": token,
                    }
                )

    # Broadcast when new user joins
    async def waiting_room_join(self, event):
        await self.send(text_data=json.dumps({
            "event": "user_joined",
            "user_email": event["user_email"]
        }))

    # Broadcast when someone approved
    async def waiting_room_approved(self, event):
        if event["email"] == self.user.email:
            await self.send(text_data=json.dumps({
                "event": "approved",
                "token": event["token"]
            }))

    # DB checks
    @database_sync_to_async
    def is_invited(self, room_id, email):
        return Invitation.objects.filter(room_id=room_id, email=email).exists()

    @database_sync_to_async
    def is_creator(self, room_id, user_id):
        return Room.objects.filter(id=room_id, creator_id=user_id).exists()

    @database_sync_to_async
    def get_room(self, room_id):
        return Room.objects.get(id=room_id)

    @database_sync_to_async
    def issue_livekit_token(self, email, room_name):
        inv = Invitation.objects.get(room__livekit_room_name=room_name, email=email)

        # Use the utility function to generate token
        jwt_token = generate_livekit_token(room_name=room_name, identity=email)

        # Save in DB
        inv.livekit_token = jwt_token
        inv.accepted = True
        inv.save()

        return jwt_token
    
    

# livekit/consumers.py
class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.user = self.scope['user']

        # Check if this user was approved (already has a LiveKit token)
        invited = await self.is_approved(self.room_id, self.user.email)
        if not invited:
            await self.close(code=4003)  # not approved
            return

        self.group_name = f"chat_{self.room_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        msg = data.get("message")

        # Broadcast message to the group
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "chat.message",
                "user": self.user.email,
                "message": msg,
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "user": event["user"],
            "message": event["message"]
        }))

    @database_sync_to_async
    def is_approved(self, room_id, email):
        return Invitation.objects.filter(room_id=room_id, email=email, accepted=True).exists()

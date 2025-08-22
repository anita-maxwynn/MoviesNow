from rest_framework import serializers
from .models import Room, Invitation, ChatMessage



class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['id', 'name', 'scheduled_time', 'duration_minutes', 'selected_movie']

class InvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invitation
        fields = ['id', 'email', 'room', 'invite_token', 'accepted']

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['room', 'user', 'message', 'timestamp']
from rest_framework import serializers
from django.utils import timezone
from .models import Room, Invitation
from movie.serializers import MovieSerializer

class RoomSerializer(serializers.ModelSerializer):
    movie_details = MovieSerializer(source='movie', read_only=True)
    creator_email = serializers.CharField(source='creator.email', read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Room
        fields = [
            'id', 'name', 'creator', 'creator_email', 'created_at', 
            'meet_datetime', 'invite_duration_minutes', 'max_participants', 'is_private',
            'movie', 'movie_details', 'movie_started', 'movie_start_time', 'movie_end_time',
            'is_active'
        ]
        read_only_fields = ['creator', 'created_at', 'movie_started', 'movie_start_time', 'movie_end_time', 'is_active']

class InvitationSerializer(serializers.ModelSerializer):
    room = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True)
    
    class Meta:
        model = Invitation
        fields = ['id', 'room', 'invited_user', 'status', 'is_used', 'expires_at', 'created_at']
        read_only_fields = ['is_used', 'expires_at', 'created_at']
    
    def get_room(self, obj):
        return {
            'id': str(obj.room.id),
            'name': obj.room.name,
            'creator_email': obj.room.creator.email
        }
    
    def get_status(self, obj):
        if obj.is_used:
            return 'accepted'
        elif obj.expires_at and obj.expires_at < timezone.now():
            return 'expired'
        else:
            return 'pending'
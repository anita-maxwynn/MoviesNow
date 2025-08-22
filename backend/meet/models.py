from django.db import models
from django.conf import settings
from django.utils import timezone
from movie.models import Movie
import uuid
from django.db import models
from django.contrib.auth import get_user_model
from datetime import datetime, timedelta
from django.utils import timezone
from movie.models import Movie

User = get_user_model()

class Room(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_rooms')
    created_at = models.DateTimeField(auto_now_add=True)
    meet_datetime = models.DateTimeField()  # When the meeting is scheduled
    invite_duration_minutes = models.IntegerField(default=30)
    max_participants = models.IntegerField(default=10)
    is_private = models.BooleanField(default=False)
    
    # Movie-related fields
    movie = models.ForeignKey(Movie, on_delete=models.SET_NULL, null=True, blank=True)
    movie_started = models.BooleanField(default=False)
    movie_start_time = models.DateTimeField(null=True, blank=True)
    movie_end_time = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} by {self.creator.email}"
    
    @property
    def is_active(self):
        """Check if the room is currently active"""
        now = timezone.now()
        return (self.meet_datetime <= now and 
                (not self.movie_end_time or self.movie_end_time >= now))
    
    def start_movie(self):
        """Start the movie playback"""
        if self.movie and not self.movie_started:
            self.movie_started = True
            self.movie_start_time = timezone.now()
            if self.movie.duration_minutes:
                self.movie_end_time = self.movie_start_time + timedelta(minutes=self.movie.duration_minutes)
            self.save()
    
    def stop_movie(self):
        """Stop the movie playback"""
        self.movie_started = False
        self.movie_end_time = timezone.now()
        self.save()

class Invitation(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='invitations')
    invited_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='invitations_received')
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=False, blank=False)

    def __str__(self):
        return f"Invite for {self.invited_user.email} to {self.room.name}"
    
class Message(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('timestamp',)

    def __str__(self):
        return f'{self.user.username}: {self.content}'
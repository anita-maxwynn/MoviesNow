from django.db import models
from django.utils import timezone
from django.conf import settings
from movie.models import Movie
import uuid
# class Movie(models.Model):
#     title = models.CharField(max_length=255)
#     description = models.TextField(blank=True)
#     movie_file = models.FileField(upload_to='movies/')
#     thumbnail = models.ImageField(upload_to='movie_thumbnails/', blank=True, null=True)
#     duration_minutes = models.IntegerField(help_text="Movie duration in minutes")
#     genre = models.CharField(max_length=100, blank=True)
#     release_year = models.IntegerField(blank=True, null=True)
#     uploaded_by = models.ForeignKey(
#         settings.AUTH_USER_MODEL,  # or settings.AUTH_USER_MODEL
#         on_delete=models.CASCADE,
#         limit_choices_to={'is_staff': True}
#     )
#     created_at = models.DateTimeField(auto_now_add=True)
#     is_active = models.BooleanField(default=True)
#     rating = models.FloatField(default=0.0, help_text="Average rating of the movie")
#     hls_path = models.CharField(max_length=500, blank=True, null=True)
#     conversion_status = models.CharField(
#         max_length=20,
#         choices=[
#             ('pending', 'Pending'),
#             ('processing', 'Processing'),
#             ('completed', 'Completed'),
#             ('failed', 'Failed')
#         ],
#         default='pending'
#     )

#     def __str__(self):
#         return self.title

#     class Meta:
#         ordering = ['-created_at']

# class MovieReview(models.Model):
#     movie = models.ForeignKey(Movie, on_delete=models.CASCADE)
#     user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
#     rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
#     comment = models.TextField(blank=True)

#     def __str__(self):
#         return f"Review for {self.movie.title} by {self.user.email}"

class Room(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # or settings.AUTH_USER_MODEL
        on_delete=models.CASCADE
    )
    livekit_room_name = models.CharField(max_length=255)
    scheduled_time = models.DateTimeField()
    duration_minutes = models.IntegerField(default=60)
    selected_movie = models.ForeignKey(Movie, on_delete=models.CASCADE, null=True, blank=True, help_text="Movie selected from admin-uploaded collection")
    is_active = models.BooleanField(default=False)
    
    # Status tracking for tasks
    bot_status = models.CharField(
        max_length=20,
        choices=[
            ('inactive', 'Inactive'),
            ('starting', 'Starting'),
            ('active', 'Active'),
            ('stopped', 'Stopped'),
            ('failed', 'Failed')
        ],
        default='inactive'
    )
    
    def __str__(self):
        return self.name

    @property
    def is_expired(self):
        return timezone.now() > self.scheduled_time + timezone.timedelta(minutes=self.duration_minutes)


class Invitation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    email = models.EmailField()
    accepted = models.BooleanField(default=False)
    invite_token = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return f"{self.email} ({self.room.name})"


class ChatMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email}: {self.message[:20]}"

    class Meta:
        ordering = ['timestamp']
        
        

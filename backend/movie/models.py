from django.db import models
from django.utils import timezone
from django.conf import settings
import uuid
# Create your models here.
class Movie(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    movie_file = models.FileField(upload_to='movies/')
    thumbnail = models.ImageField(upload_to='movie_thumbnails/', blank=True, null=True)
    duration_minutes = models.IntegerField(help_text="Movie duration in minutes")
    genre = models.CharField(max_length=100, blank=True)
    release_year = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    rating = models.FloatField(default=0.0, help_text="Average rating of the movie")
    hls_path = models.CharField(max_length=500, blank=True, null=True)
    conversion_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('processing', 'Processing'),
            ('completed', 'Completed'),
            ('failed', 'Failed')
        ],
        default='pending'
    )

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']

class MovieReview(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField(blank=True)

    def __str__(self):
        return f"Review for {self.movie.title} by {self.user.email}"
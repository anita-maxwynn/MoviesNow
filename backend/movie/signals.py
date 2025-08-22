# signals.py
import os
from django.db.models.signals import post_save,post_delete
from django.dispatch import receiver
from django.db.models import Avg
from .models import Movie, MovieReview
from .tasks import convert_movie_to_hls

@receiver(post_save, sender=Movie)
def trigger_hls_conversion(sender, instance, created, **kwargs):
    """Automatically trigger HLS conversion when a new movie is uploaded"""
    if created and instance.movie_file:
        # Call Celery task asynchronously to convert to HLS
        convert_movie_to_hls.delay(instance.id)

@receiver([post_save, post_delete], sender=MovieReview)
def update_movie_rating(sender, instance, **kwargs):
    movie = instance.movie
    avg_rating = movie.moviereview_set.aggregate(avg=Avg('rating'))['avg'] or 0
    movie.rating = avg_rating
    movie.save(update_fields=['rating'])


import shutil

@receiver(post_delete, sender=Movie)
def delete_hls_files(sender, instance, **kwargs):
    if instance.hls_path:
        hls_dir = os.path.dirname(instance.hls_path)
        if os.path.exists(hls_dir):
            shutil.rmtree(hls_dir, ignore_errors=True)

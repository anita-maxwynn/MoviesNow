# # signals.py
# from django.db.models.signals import post_save
# from django.dispatch import receiver
# from .models import Movie
# from .tasks import convert_movie_to_hls

# @receiver(post_save, sender=Movie)
# def trigger_hls_conversion(sender, instance, created, **kwargs):
#     """Automatically trigger HLS conversion when a new movie is uploaded"""
#     if created and instance.movie_file:
#         # Call Celery task asynchronously to convert to HLS
#         convert_movie_to_hls.delay(instance.id)

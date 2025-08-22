from celery import shared_task
from .models import Movie
import os
from django.conf import settings
import subprocess
import logging

logger = logging.getLogger(__name__)

@shared_task
def convert_movie_to_hls(movie_id):
    try:
        movie = Movie.objects.get(id=movie_id)
        movie.conversion_status = 'processing'
        movie.save(update_fields=['conversion_status'])

        if not movie.movie_file:
            movie.conversion_status = 'failed'
            movie.save(update_fields=['conversion_status'])
            return "No movie file"

        movie_path = movie.movie_file.path
        hls_folder = f"{movie_path}_hls"
        os.makedirs(hls_folder, exist_ok=True)

        result = subprocess.run([
            "ffmpeg", "-i", movie_path,
            "-c:v", "h264", "-c:a", "aac",
            "-f", "hls", "-hls_time", "10",
            "-hls_list_size", "0",
            f"{hls_folder}/movie.m3u8"
        ], capture_output=True, text=True)

        if result.returncode != 0:
            logger.error(result.stderr)
            raise Exception(result.stderr)

        movie.hls_path = f"{hls_folder}/movie.m3u8"
        movie.conversion_status = 'completed'
        movie.save(update_fields=['hls_path', 'conversion_status'])
        return "HLS conversion done"

    except Movie.DoesNotExist:
        return "Movie not found"
    except Exception as e:
        logger.error(f"HLS conversion failed: {str(e)}")
        try:
            movie = Movie.objects.get(id=movie_id)
            movie.conversion_status = 'failed'
            movie.save(update_fields=['conversion_status'])
        except:
            pass
        return f"Conversion failed: {str(e)}"


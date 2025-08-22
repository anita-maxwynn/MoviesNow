from rest_framework import serializers
from .models import Movie, MovieReview
from django.conf import settings
import os

class MovieSerializer(serializers.ModelSerializer):
    hls_path = serializers.SerializerMethodField()
    
    class Meta:
        model = Movie
        fields = [
            'id', 'title', 'description', 'movie_file', 'thumbnail', 
            'duration_minutes', 'genre', 'release_year', 
            'created_at', 'is_active', 'conversion_status', 'hls_path'
        ]
        read_only_fields = ['id',  'created_at', 'conversion_status']
    
    def get_hls_path(self, obj):
        """Convert absolute HLS path to relative media URL"""
        if not obj.hls_path:
            return None
        
        # Check if it's already a URL
        if obj.hls_path.startswith('http://') or obj.hls_path.startswith('https://'):
            return obj.hls_path
        
        # If it's an absolute path, convert to relative media path
        if obj.hls_path.startswith('/'):
            # Find the media directory in the path
            media_dir = str(settings.MEDIA_ROOT)
            if obj.hls_path.startswith(media_dir):
                # Get the relative path from media root
                relative_path = os.path.relpath(obj.hls_path, media_dir)
                return f"{settings.MEDIA_URL}{relative_path}"
            else:
                # Try to find /media/ in the path
                media_index = obj.hls_path.find('/media/')
                if media_index != -1:
                    return obj.hls_path[media_index:]
        
        # If it's already a relative path, just add media URL
        return f"{settings.MEDIA_URL}{obj.hls_path}"
        


class MovieReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovieReview
        fields = [
            'id', 'movie', 'user', 'rating', 'comment'
        ]
        read_only_fields = ['id', 'user']
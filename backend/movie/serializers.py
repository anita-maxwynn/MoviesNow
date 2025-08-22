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
    user_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    
    class Meta:
        model = MovieReview
        fields = [
            'id', 'movie', 'user', 'user_name', 'user_email', 'rating', 'comment'
        ]
        read_only_fields = ['id', 'user', 'user_name', 'user_email']
    
    def get_user_name(self, obj):
        """Get user's display name"""
        if hasattr(obj.user, 'name') and obj.user.name:
            return obj.user.name
        elif hasattr(obj.user, 'first_name') and obj.user.first_name:
            return f"{obj.user.first_name} {getattr(obj.user, 'last_name', '')}".strip()
        else:
            return obj.user.email.split('@')[0]  # Use email prefix as fallback
    
    def get_user_email(self, obj):
        """Get user's email"""
        return obj.user.email
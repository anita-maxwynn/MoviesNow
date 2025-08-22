from django.contrib import admin
from .models import Movie, MovieReview

# Register your models here.

class MovieAdmin(admin.ModelAdmin):
    list_display = ['title', 'duration_minutes', 'release_year',  'created_at', 'is_active']
    search_fields = ['title', 'description', 'genre']
    list_filter = ['is_active', 'release_year', 'genre', 'conversion_status']
    # raw_id_fields = ['uploaded_by']

admin.site.register(Movie, MovieAdmin)
class MovieReviewAdmin(admin.ModelAdmin):
    list_display = ['movie', 'user', 'rating']
    search_fields = ['movie__title', 'user__email']
    list_filter = ['rating']

admin.site.register(MovieReview, MovieReviewAdmin)
from django.urls import path,include
from rest_framework.routers import DefaultRouter
from .views import MovieViewSet, MovieReviewViewSet

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'movies', MovieViewSet)
router.register(r'movie-reviews', MovieReviewViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
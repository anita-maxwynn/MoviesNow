from django.shortcuts import render
from .models import Movie, MovieReview
from .serializers import MovieSerializer, MovieReviewSerializer
# Create your views here.
from .permissions import IsAuthenticatedOrAdminEdit,IsOwnerOrReadOnly
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
class MovieViewSet(viewsets.ModelViewSet):
    queryset = Movie.objects.all()
    serializer_class = MovieSerializer
    permission_classes = [IsAuthenticatedOrAdminEdit]


class MovieReviewViewSet(viewsets.ModelViewSet):
    queryset = MovieReview.objects.all()
    serializer_class = MovieReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        """Filter reviews by movie if movie parameter is provided"""
        queryset = MovieReview.objects.all()
        movie_id = self.request.query_params.get('movie', None)
        if movie_id is not None:
            queryset = queryset.filter(movie=movie_id)
        return queryset.order_by('-id')
    
    def perform_create(self, serializer):
        """Automatically set the user when creating a review"""
        serializer.save(user=self.request.user)
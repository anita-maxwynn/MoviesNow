from django.shortcuts import render
from .models import Movie, MovieReview
from .serializers import MovieSerializer, MovieReviewSerializer
# Create your views here.
from .permissions import IsAuthenticatedOrAdminEdit,IsOwnerOrReadOnly
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
class MovieViewSet(viewsets.ModelViewSet):
    queryset = Movie.objects.all()
    serializer_class = MovieSerializer
    permission_classes = [IsAuthenticatedOrAdminEdit]


class MovieReviewViewSet(viewsets.ModelViewSet):
    queryset = MovieReview.objects.all()
    serializer_class = MovieReviewSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        """Automatically set the user when creating a review"""
        serializer.save(user=self.request.user)
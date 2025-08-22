from rest_framework import viewsets, generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from livekit import api
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import Room, Invitation
from .serializers import RoomSerializer, InvitationSerializer

User = get_user_model()

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all().order_by('-created_at')
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Automatically set the creator to the current user
        serializer.save(creator=self.request.user)

class CreateInvitation(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        room_id = request.data.get('room')
        invited_email = request.data.get('invited_user')

        room = get_object_or_404(Room, pk=room_id)
        
        if room.creator != request.user:
            return Response({'error': 'You do not have permission to invite users to this room.'},
                            status=status.HTTP_403_FORBIDDEN)
        
        invited_user = get_object_or_404(User, email=invited_email)
        
        # Use the invite_duration_minutes from the Room model
        expires_at = timezone.now() + timedelta(minutes=room.invite_duration_minutes)
        
        Invitation.objects.create(
            room=room,
            invited_user=invited_user,
            expires_at=expires_at
        )
        return Response({'message': 'Invitation sent successfully!'}, status=status.HTTP_201_CREATED)


class UserInvitationsList(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = InvitationSerializer
    
    def get_queryset(self):
        return Invitation.objects.filter(invited_user=self.request.user, is_used=False)


class AcceptInvitation(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, invitation_id, *args, **kwargs):
        invitation = get_object_or_404(Invitation, pk=invitation_id, invited_user=request.user, is_used=False)
        
        # Check if invitation has expired
        if invitation.expires_at < timezone.now():
            return Response({'error': 'This invitation has expired.'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Mark invitation as used
        invitation.is_used = True
        invitation.save()
        
        return Response({'message': 'Invitation accepted successfully!'}, 
                       status=status.HTTP_200_OK)

class GetLiveKitToken(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        room_id = request.data.get('roomId')
        participant_name = request.user.email

        room = get_object_or_404(Room, id=room_id)

        # Check if user is the room creator or has a valid invitation
        if room.creator == request.user:
            # Room creator can always join
            pass
        else:
            # Check for a valid invitation (either unused or previously accepted by this user)
            try:
                invitation = Invitation.objects.get(
                    room=room,
                    invited_user=request.user,
                    expires_at__gte=timezone.now()
                )
                # If invitation is not used yet, mark it as used
                if not invitation.is_used:
                    invitation.is_used = True
                    invitation.save()
            except Invitation.DoesNotExist:
                return Response({'error': 'You do not have a valid invitation to this room.'},
                                status=status.HTTP_403_FORBIDDEN)

        # Generate the LiveKit access token with specific grants
        grants = api.VideoGrants(
            room_join=True,
            room=room.name,  # Use room.name for the LiveKit room name
            can_publish=True,
            can_subscribe=True,
        )

        token = api.AccessToken(settings.LIVEKIT_API_KEY, settings.LIVEKIT_API_SECRET)
        token.with_identity(participant_name)
        token.with_grants(grants)
        
        jwt_token = token.to_jwt()
        
        return Response({'token': jwt_token})
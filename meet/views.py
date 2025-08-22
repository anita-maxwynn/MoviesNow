from rest_framework import viewsets, generics, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils.crypto import get_random_string
from django.db.models import Q

from .models import Room, Invitation, ChatMessage
from .serializers import RoomSerializer, InvitationSerializer, ChatMessageSerializer
from .tasks import send_invite_email, start_movie_bot, stop_movie_bot
from .utils import generate_livekit_token


# ---------------- Room ViewSet ----------------
class RoomViewSet(viewsets.ModelViewSet):
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """User can only see their rooms or rooms they’re invited to"""
        invited_room_ids = Invitation.objects.filter(
            email=self.request.user.email
        ).values_list("room_id", flat=True)
        return Room.objects.filter(
            Q(creator=self.request.user) | Q(id__in=invited_room_ids)
        ).distinct()

    def perform_create(self, serializer):
        """Auto-generate livekit room name"""
        user_identifier = self.request.user.email.split("@")[0]
        livekit_room_name = f"{user_identifier}_{get_random_string(8)}"
        serializer.save(creator=self.request.user, livekit_room_name=livekit_room_name)

    @action(detail=True, methods=["get"])
    def info(self, request, pk=None):
        """Get room info"""
        room = self.get_object()
        return Response({
            "room_id": room.id,
            "room_name": room.name,
            "creatorEmail": room.creator.email,
            "userEmail": request.user.email,
            "scheduled_time": room.scheduled_time.isoformat() if room.scheduled_time else None,
            "duration_minutes": room.duration_minutes,
            "livekit_room_name": room.livekit_room_name,
            "is_active": room.is_active,
            "selected_movie": room.selected_movie.title if room.selected_movie else None,
            "bot_status": room.bot_status,
            "is_expired": room.is_expired,
        })

    @action(detail=True, methods=["get"])
    def waiting_list(self, request, pk=None):
        """Get waiting list (all invitations)"""
        invitations = Invitation.objects.filter(room=self.get_object())
        data = [
            {"email": inv.email,
             "status": "approved" if inv.accepted else "pending",
             "livekitToken": getattr(inv, "livekit_token", None)}
            for inv in invitations
        ]
        return Response(data)


# ---------------- Invitations ----------------
class InviteUsersView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, room_id):
        try:
            room = Room.objects.get(id=room_id, creator=request.user)
        except Room.DoesNotExist:
            return Response({"error": "Room not found or not yours"}, status=404)

        emails = request.data.get("emails", [])
        if not emails:
            return Response({"error": "No emails provided"}, status=400)

        invites = []
        for email in emails:
            token = get_random_string(32)
            inv = Invitation.objects.create(room=room, email=email, invite_token=token)
            invites.append(inv)

            link = f"http://localhost:5173/join-room/{room.id}/{token}"
            send_invite_email.delay(email, room.name, link)

        return Response({"status": "invites scheduled", "count": len(invites)})


# ---------------- Chat Messages ----------------
class ChatMessageList(generics.ListAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChatMessage.objects.filter(
            room_id=self.kwargs["room_id"]
        ).order_by("timestamp")


# ---------------- Livekit Token ----------------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_livekit_token(request):
    room_name = request.data.get("room_name")
    if not room_name:
        return Response({"error": "Room name is required"}, status=400)

    try:
        room = Room.objects.get(livekit_room_name=room_name)
    except Room.DoesNotExist:
        return Response({"error": "Room not found"}, status=404)

    is_creator = room.creator == request.user
    is_invited = Invitation.objects.filter(
        room=room, email=request.user.email, accepted=True
    ).exists()

    if not (is_creator or is_invited):
        return Response({"error": "Not authorized"}, status=403)

    token = generate_livekit_token(room_name=room_name, identity=request.user.email)
    return Response({"token": token})


# ---------------- Movie Bot ----------------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def start_movie_streaming(request, room_id):
    try:
        room = Room.objects.get(id=room_id, creator=request.user)
    except Room.DoesNotExist:
        return Response({"error": "Room not found or not yours"}, status=404)

    if not room.selected_movie:
        return Response({"error": "No movie selected"}, status=400)

    if room.bot_status == "active":
        return Response({"error": "Bot already running"}, status=400)

    start_movie_bot.delay(room_id)
    return Response({"message": "Movie streaming bot is starting...", "bot_status": "starting"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stop_movie_streaming(request, room_id):
    try:
        room = Room.objects.get(id=room_id, creator=request.user)
    except Room.DoesNotExist:
        return Response({"error": "Room not found or not yours"}, status=404)

    stop_movie_bot.delay(room_id)
    return Response({"message": "Movie streaming bot is stopping...", "bot_status": "stopping"})

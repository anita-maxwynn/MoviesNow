# livekit/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RoomViewSet,
    InviteUsersView,
    ChatMessageList,
    get_livekit_token,
    start_movie_streaming,
    stop_movie_streaming,
)

router = DefaultRouter()
router.register(r"rooms", RoomViewSet, basename="room")

urlpatterns = [
    path("", include(router.urls)),

    # Room extras
    path("rooms/<int:room_id>/invite/", InviteUsersView.as_view(), name="invite_users"),
    path("rooms/<int:room_id>/messages/", ChatMessageList.as_view(), name="get_messages"),
    path("rooms/<int:room_id>/start-movie/", start_movie_streaming, name="start_movie_streaming"),
    path("rooms/<int:room_id>/stop-movie/", stop_movie_streaming, name="stop_movie_streaming"),

    # Livekit
    path("livekit/token/", get_livekit_token, name="livekit_token"),
]

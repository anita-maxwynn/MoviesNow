from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RoomViewSet, CreateInvitation, UserInvitationsList, GetLiveKitToken, AcceptInvitation

router = DefaultRouter()
router.register(r'rooms', RoomViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('invite/', CreateInvitation.as_view(), name='create_invitation'),
    path('my-invitations/', UserInvitationsList.as_view(), name='user_invitations'),
    path('invitations/<int:invitation_id>/accept/', AcceptInvitation.as_view(), name='accept_invitation'),
    path('get-token/', GetLiveKitToken.as_view(), name='get_livekit_token'),
]
from django.urls import path
from .views import GoogleLoginAPIView, LoginAPIView, RegisterAPIView, ActivateAccountAPIView, ProfileAPIView, PasswordChangeAPIView
from rest_framework_simplejwt.views import TokenRefreshView



urlpatterns = [
    path("google-login/", GoogleLoginAPIView.as_view(), name="google-login"),
    path("login/", LoginAPIView.as_view(), name="login"),
    path("register/", RegisterAPIView.as_view(), name="register"),
    path('activate/<uidb64>/<token>/', ActivateAccountAPIView.as_view(), name='activate-account'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('profile/', ProfileAPIView.as_view(), name='profile'),
    path('profile/change-password/', PasswordChangeAPIView.as_view(), name='change-password'),
]

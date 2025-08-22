# backend/asgi.py
import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()  # Ensures apps are loaded

# Now safe to import middleware and routing
from backend.jwt_middleware import JWTAuthMiddleware
import meet.routing
application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JWTAuthMiddleware(
        URLRouter(
            meet.routing.websocket_urlpatterns
        )
    ),
})

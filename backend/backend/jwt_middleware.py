# backend/jwt_middleware.py
from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from django.db import close_old_connections
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        qs = parse_qs(query_string)
        token = qs.get("token")
        scope["user"] = AnonymousUser()  # default

        if token:
            try:
                validated_token = JWTAuthentication().get_validated_token(token[0])
                user = await database_sync_to_async(JWTAuthentication().get_user)(validated_token)
                scope["user"] = user
            except (InvalidToken, TokenError):
                scope["user"] = AnonymousUser()

        close_old_connections()
        return await super().__call__(scope, receive, send)

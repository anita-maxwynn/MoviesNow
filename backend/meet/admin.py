from django.contrib import admin
from .models import Room, Invitation, Message

admin.site.register(Room)
admin.site.register(Invitation)
admin.site.register(Message)

from django.contrib import admin
from .models import Room, Invitation, ChatMessage
from .models import  Room, Invitation, ChatMessage

# @admin.register(Movie)
# class MovieAdmin(admin.ModelAdmin):
#     list_display = ['id','title', 'genre', 'duration_minutes', 'uploaded_by', 'conversion_status', 'is_active', 'created_at']
#     list_filter = ['genre', 'conversion_status', 'is_active', 'release_year']
#     search_fields = ['title', 'description', 'genre']
#     readonly_fields = ['uploaded_by', 'created_at', 'conversion_status', 'hls_path']
    
#     def save_model(self, request, obj, form, change):
#         if not change:  # Only set uploaded_by for new objects
#             obj.uploaded_by = request.user
#         super().save_model(request, obj, form, change)

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    exclude = ('creator',)  # hide from admin form
    list_display = ['id', 'name', 'livekit_room_name', 'creator']
    list_filter = ['creator']
    search_fields = ['name', 'livekit_room_name', 'creator__username']
    def save_model(self, request, obj, form, change):
        if not obj.creator:
            obj.creator = request.user
        super().save_model(request, obj, form, change)


@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = ['email', 'room', 'accepted', 'invite_token']
    list_filter = ['accepted']
    search_fields = ['email', 'room__name']

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['user', 'room', 'message', 'timestamp']
    list_filter = ['timestamp']
    search_fields = ['user__username', 'room__name', 'message']
    readonly_fields = ['timestamp']

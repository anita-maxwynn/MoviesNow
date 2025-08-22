from django.contrib import admin
from .models import CustomUser
# Register your models here.
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'name', 'is_active', 'is_staff')
    search_fields = ('email', 'name')
    list_filter = ('is_active', 'is_staff')

admin.site.register(CustomUser, UserAdmin)
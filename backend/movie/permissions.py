# permissions.py
from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAuthenticatedOrAdminEdit(BasePermission):
    """
    Allow GET/HEAD/OPTIONS for any authenticated user.
    Allow POST/PUT/PATCH/DELETE only for admin users.
    """

    def has_permission(self, request, view):
        # Read-only methods (GET, HEAD, OPTIONS) → need to be logged in
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated

        # Other methods → must be admin
        return request.user and request.user.is_staff
class IsOwnerOrReadOnly(BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request
        # So we'll always allow GET, HEAD, or OPTIONS requests.
        if request.method in SAFE_METHODS:
            return True

        # Write permissions are only allowed to the user who created the review.
        return obj.user == request.user
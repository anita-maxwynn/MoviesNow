from django.apps import AppConfig


class MeetConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'meet'

    def ready(self):
        import meet.signals

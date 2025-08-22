# account/utils.py or inside your views.py
from django.urls import reverse
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from .tasks import send_activation_email_task

def send_activation_email(user, request):
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    activation_link = request.build_absolute_uri(
        reverse('activate-account', kwargs={'uidb64': uid, 'token': token})
    )

    subject = 'Activate your account'
    message = f"Hi {user.name},\n\nPlease activate your account by clicking the link below:\n{activation_link}"

    send_activation_email_task.delay(subject, message, [user.email])

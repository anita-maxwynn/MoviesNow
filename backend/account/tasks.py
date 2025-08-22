from celery import shared_task
from django.core.mail import send_mail

@shared_task
def send_activation_email_task(subject, message, recipient_list):
    send_mail(
        subject,
        message,
        'no-reply@yourdomain.com',
        recipient_list,
        fail_silently=False,
    )

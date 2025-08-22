import asyncio
import logging
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from celery import shared_task
from .models import Room
from .utils import create_livekit_ingress, stop_livekit_ingress  # your functions
from .utils import run_bot  # async bot streamer

logger = logging.getLogger(__name__)

# ----------------------------
# Movie starting and ingress
# ----------------------------
@shared_task
def check_and_start_movies():
    now = timezone.now()
    rooms_to_start = Room.objects.filter(
        meet_datetime__lte=now,
        meet_datetime__gte=now - timedelta(minutes=1),
        movie_started=False,
        movie__isnull=False
    )
    for room in rooms_to_start:
        try:
            start_movie_ingress.delay(room.id)
            logger.info(f"Scheduled movie ingress for room: {room.name}")
        except Exception as e:
            logger.error(f"Failed to schedule movie ingress for room {room.name}: {str(e)}")

@shared_task
def start_movie_ingress(room_id):
    try:
        room = Room.objects.get(id=room_id)
        if room.movie_started or not room.movie:
            logger.warning(f"Movie already started or no movie assigned for room: {room.name}")
            return

        # Get movie URL
        if room.movie.hls_path:
            movie_url = room.movie.hls_path
            if not movie_url.startswith('http'):
                movie_url = f"http://localhost:8000{movie_url}"
        else:
            movie_url = f"http://localhost:8000{settings.MEDIA_URL}{room.movie.movie_file.name}"

        # Create LiveKit ingress
        try:
            ingress_info = create_livekit_ingress(room.name, movie_url)
            room.ingress_id = ingress_info.get("sid", None)
            logger.info(f"LiveKit ingress started for room {room.name}, ingress_id={room.ingress_id}")
        except Exception as e:
            logger.error(f"Failed to create LiveKit ingress for room {room.name}: {e}")
            room.ingress_id = None

        # Update room status
        room.movie_started = True
        room.movie_start_time = timezone.now()
        room.movie_url = movie_url
        room.save()

        # Notify participants
        notify_movie_started.delay(room.id)
        notify_movie_bot_joined.delay(room.id)

        # Start bot streamer in background
        if movie_url and room.name:
            asyncio.run(run_bot(room.name, movie_url))

    except Room.DoesNotExist:
        logger.error(f"Room with id {room_id} does not exist")
    except Exception as e:
        logger.error(f"Failed to start movie for room_id {room_id}: {str(e)}")


# ----------------------------
# Movie stopping and cleanup
# ----------------------------
@shared_task
def stop_movie_ingress(room_id):
    try:
        room = Room.objects.get(id=room_id)
        if not room.movie_started:
            logger.warning(f"Movie not started for room: {room.name}")
            return

        # Stop LiveKit ingress
        if room.ingress_id:
            try:
                stop_livekit_ingress(room.ingress_id)
                logger.info(f"Stopped LiveKit ingress for room {room.name}")
            except Exception as e:
                logger.error(f"Failed to stop ingress for room {room.name}: {e}")

        # Update room
        room.movie_started = False
        room.movie_url = None
        room.movie_start_time = None
        room.ingress_id = None
        room.save()

        # Notify participants
        notify_movie_stopped.delay(room.id)

    except Room.DoesNotExist:
        logger.error(f"Room with id {room_id} does not exist")
    except Exception as e:
        logger.error(f"Failed to stop movie for room_id {room_id}: {str(e)}")


# ----------------------------
# Participant notifications
# ----------------------------
@shared_task
def notify_movie_started(room_id):
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        room = Room.objects.get(id=room_id)
        channel_layer = get_channel_layer()
        group_name = f'chat_{str(room.id).replace("-", "_")[:50]}'
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'movie_started',
                'message': 'Movie has started!',
                'movie_title': room.movie.title if room.movie else 'Unknown',
                'started_at': room.movie_start_time.isoformat() if room.movie_start_time else None
            }
        )
        logger.info(f"Notified participants that movie started in room: {room.name}")
    except Exception as e:
        logger.error(f"Failed to notify movie started for room_id {room_id}: {str(e)}")

@shared_task
def notify_movie_stopped(room_id):
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        room = Room.objects.get(id=room_id)
        channel_layer = get_channel_layer()
        group_name = f'chat_{str(room.id).replace("-", "_")[:50]}'
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'movie_stopped',
                'message': 'Movie has stopped!',
                'movie_title': room.movie.title if room.movie else 'Unknown',
                'stopped_at': timezone.now().isoformat()
            }
        )
        logger.info(f"Notified participants that movie stopped in room: {room.name}")
    except Exception as e:
        logger.error(f"Failed to notify movie stopped for room_id {room_id}: {str(e)}")

@shared_task
def notify_movie_bot_joined(room_id):
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        room = Room.objects.get(id=room_id)
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'chat_{room.name}',
            {
                'type': 'chat_message',
                'message': f'🎬 Movie Bot has joined! "{room.movie.title}" is now starting. Enjoy the show! 🍿',
                'username': 'Movie Bot',
                'timestamp': timezone.now().isoformat()
            }
        )
        logger.info(f"Movie bot join notification sent for room: {room.name}")
    except Exception as e:
        logger.error(f"Failed to send movie bot notification for room_id {room_id}: {str(e)}")


# ----------------------------
# Cleanup expired ingresses
# ----------------------------
@shared_task
def cleanup_expired_ingresses():
    cutoff_time = timezone.now() - timedelta(hours=3)
    expired_rooms = Room.objects.filter(
        movie_started=True,
        movie_start_time__lt=cutoff_time,
        ingress_id__isnull=False
    )
    for room in expired_rooms:
        try:
            stop_movie_ingress.delay(room.id)
            logger.info(f"Scheduled cleanup for expired room: {room.name}")
        except Exception as e:
            logger.error(f"Failed to schedule cleanup for room {room.name}: {str(e)}")

import os
import time
import asyncio
import logging
import requests
import jwt
from livekit import api

from django.conf import settings

logger = logging.getLogger(__name__)

# ----------------------------
# Token generation
# ----------------------------
def generate_livekit_token(room_name=None):
    """
    Generate a server JWT for LiveKit REST API requests
    """
    payload = {
        "iss": settings.LIVEKIT_API_KEY,
        "sub": "server",
        "exp": int(time.time()) + 60  # token valid for 1 minute
    }
    if room_name:
        payload["room"] = room_name

    token = jwt.encode(payload, settings.LIVEKIT_API_SECRET, algorithm="HS256")
    return token

# ----------------------------
# LiveKit ingress management
# ----------------------------
def create_livekit_ingress(room_name: str, input_url: str) -> dict:
    """
    Create a LiveKit ingress to stream a video into a room
    Returns ingress info including ingress ID
    """
    url = f"{settings.LIVEKIT_SERVER_URL}/ingress"

    payload = {
        "iss": settings.LIVEKIT_API_KEY,
        "sub": "server",
        "exp": int(time.time()) + 60,
        "room": room_name
    }
    token = jwt.encode(payload, settings.LIVEKIT_API_SECRET, algorithm="HS256")

    data = {
        "room_name": room_name,
        "input_url": input_url,
        "name": "Movie Stream",
        "video": True,
        "audio": True
    }

    resp = requests.post(url, json=data, headers={"Authorization": f"Bearer {token}"})

    if resp.status_code != 200:
        logger.error(f"LiveKit ingress creation failed: {resp.status_code} {resp.text}")
        raise Exception(f"LiveKit ingress creation failed: {resp.text}")

    try:
        return resp.json()
    except ValueError:
        logger.error(f"LiveKit returned non-JSON response: {resp.text}")
        raise

def stop_livekit_ingress(ingress_id: str) -> dict:
    """
    Stop/delete a LiveKit ingress by its ID
    """
    try:
        url = f"{settings.LIVEKIT_SERVER_URL}/ingress/{ingress_id}"
        token = generate_livekit_token()
        headers = {
            "Authorization": f"Bearer {token}"
        }

        response = requests.delete(url, headers=headers)
        response.raise_for_status()
        logger.info(f"Successfully stopped LiveKit ingress {ingress_id}")
        return response.json()

    except requests.exceptions.HTTPError as e:
        logger.error(f"Failed to stop LiveKit ingress {ingress_id}: {e.response.text}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error stopping LiveKit ingress {ingress_id}: {str(e)}")
        raise

# ----------------------------
# Async bot streamer
# ----------------------------
async def run_bot(room_name: str, video_file: str):
    """
    Connects to a LiveKit room and streams a video file as a bot participant.

    Args:
        room_name (str): The name of the LiveKit room to join.
        video_file (str): The absolute path to the video file to stream.
    """
    LIVEKIT_API_KEY = settings.LIVEKIT_API_KEY
    LIVEKIT_API_SECRET = settings.LIVEKIT_API_SECRET
    LIVEKIT_SERVER_URL = settings.LIVEKIT_URL

    # Generate token for bot
    token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
    token.set_identity("video-bot")
    token.set_grants(api.VideoGrants(
        room_join=True,
        room=room_name,
        can_publish=True,
    ))

    # Connect to room
    room = api.Room(token=token.to_jwt(), server_url=LIVEKIT_SERVER_URL)
    logger.info(f"Bot connecting to room: {room_name}")
    try:
        await room.connect()
        logger.info(f"Bot connected to room: {room_name}")
    except Exception as e:
        logger.error(f"Failed to connect bot: {e}")
        return

    # Open video file using PyAV
    import av
    try:
        container = av.open(video_file)
        video_stream = next(s for s in container.streams if s.type == 'video')
    except (av.AVError, StopIteration) as e:
        logger.error(f"Failed to open video file or find video stream: {e}")
        await room.disconnect()
        return

    # Create a video track
    video_source = api.VideoSource()
    video_track = api.LocalVideoTrack.create_video_track("video-bot-track", video_source)

    # Publish track
    try:
        await room.local_participant.publish_track(video_track, api.TrackPublishOptions())
        logger.info("Bot is now publishing the video track.")
    except Exception as e:
        logger.error(f"Failed to publish video track: {e}")
        await room.disconnect()
        return

    # Stream video frames
    try:
        for frame in container.decode(video_stream):
            img = frame.to_image()
            livekit_frame = api.VideoFrame.create(
                api.VideoBuffer.create(img.width, img.height, img.tobytes(), api.VideoFrame.Format.RGB)
            )
            await video_source.capture_frame(livekit_frame)
            await asyncio.sleep(1 / video_stream.average_rate)
    except asyncio.CancelledError:
        logger.info("Bot stream cancelled.")
    except Exception as e:
        logger.error(f"Error while streaming: {e}")
    finally:
        await room.disconnect()
        logger.info("Bot disconnected.")

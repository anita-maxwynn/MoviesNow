import os
import time
import asyncio
import logging
import requests
import jwt
from livekit import api, rtc

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
    try:
        # Use LiveKit API client instead of direct HTTP requests
        from livekit import api
        
        # Create LiveKit API client
        livekit_api = api.LiveKitAPI(
            url=settings.LIVEKIT_URL,
            api_key=settings.LIVEKIT_API_KEY,
            api_secret=settings.LIVEKIT_API_SECRET
        )
        
        # Create ingress request
        ingress_info = api.CreateIngressRequest(
            input_type=api.IngressInput.URL_INPUT,
            name=f"Movie Stream - {room_name}",
            room_name=room_name,
            participant_identity="movie-bot",
            participant_name="Movie Bot",
            url=input_url,
            video=api.IngressVideoOptions(
                source=api.TrackSource.SOURCE_CAMERA,
            ),
            audio=api.IngressAudioOptions(
                source=api.TrackSource.SOURCE_MICROPHONE,
            )
        )
        
        # Create the ingress
        ingress = livekit_api.ingress.create_ingress(ingress_info)
        
        logger.info(f"Created LiveKit ingress: {ingress.ingress_id}")
        return {
            "ingress_id": ingress.ingress_id,
            "url": ingress.url,
            "stream_key": getattr(ingress, 'stream_key', ''),
            "status": "created"
        }
        
    except Exception as e:
        logger.error(f"Failed to create LiveKit ingress: {str(e)}")
        # Fallback: just return a mock ingress for bot streaming
        logger.info("Fallback: Using direct bot streaming instead of ingress")
        return {
            "ingress_id": f"bot-{room_name}-{int(time.time())}",
            "url": input_url,
            "stream_key": "",
            "status": "fallback"
        }

def stop_livekit_ingress(ingress_id: str) -> dict:
    """
    Stop/delete a LiveKit ingress by its ID
    """
    try:
        # Check if it's a fallback bot ingress
        if ingress_id and ingress_id.startswith("bot-"):
            logger.info(f"Fallback bot ingress {ingress_id} - no need to stop via API")
            return {"status": "fallback_stopped"}
        
        # Use LiveKit API client for real ingress
        from livekit import api
        
        livekit_api = api.LiveKitAPI(
            url=settings.LIVEKIT_URL,
            api_key=settings.LIVEKIT_API_KEY,
            api_secret=settings.LIVEKIT_API_SECRET
        )
        
        # Delete the ingress
        livekit_api.ingress.delete_ingress(api.DeleteIngressRequest(ingress_id=ingress_id))
        logger.info(f"Successfully stopped LiveKit ingress {ingress_id}")
        return {"status": "stopped"}

    except Exception as e:
        logger.error(f"Failed to stop LiveKit ingress {ingress_id}: {str(e)}")
        # For fallback, just log and continue
        return {"status": "error", "message": str(e)}

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
    token.with_identity("video-bot")
    token.with_grants(api.VideoGrants(
        room_join=True,
        room=room_name,
        can_publish=True,
    ))

    # Connect to room
    room = rtc.Room()
    logger.info(f"Bot connecting to room: {room_name}")
    try:
        await room.connect(LIVEKIT_SERVER_URL, token.to_jwt())
        logger.info(f"Bot connected to room: {room_name}")
    except Exception as e:
        logger.error(f"Failed to connect bot: {e}")
        return

    # Create video and audio sources
    video_source = rtc.VideoSource(width=1280, height=720)
    audio_source = rtc.AudioSource(sample_rate=48000, num_channels=2)
    
    # Create tracks
    video_track = rtc.LocalVideoTrack.create_video_track("video-bot-track", video_source)
    audio_track = rtc.LocalAudioTrack.create_audio_track("audio-bot-track", audio_source)

    # Publish tracks
    try:
        video_options = rtc.TrackPublishOptions(
            source=rtc.TrackSource.SOURCE_CAMERA,
            video_encoding=rtc.VideoEncoding(max_framerate=30, max_bitrate=5_000_000),
        )
        audio_options = rtc.TrackPublishOptions(
            source=rtc.TrackSource.SOURCE_MICROPHONE
        )
        
        await room.local_participant.publish_track(video_track, video_options)
        await room.local_participant.publish_track(audio_track, audio_options)
        logger.info("Bot is now publishing video and audio tracks.")
    except Exception as e:
        logger.error(f"Failed to publish tracks: {e}")
        await room.disconnect()
        return

    # Stream video and audio
    try:
        if video_file.endswith('.m3u8') or 'hls' in video_file:
            logger.info(f"Streaming HLS content: {video_file}")
            await stream_hls_content(video_source, audio_source, video_file)
        else:
            logger.info(f"Streaming MP4 content: {video_file}")
            await stream_mp4_content(video_source, audio_source, video_file)
                
    except asyncio.CancelledError:
        logger.info("Bot stream cancelled.")
    except Exception as e:
        logger.error(f"Error while streaming: {e}")
    finally:
        await room.disconnect()
        logger.info("Bot disconnected.")


async def stream_mp4_content(video_source, audio_source, video_file):
    """Stream MP4 file content to LiveKit sources"""
    import av
    
    try:
        # Open the video file
        container = av.open(video_file)
        video_stream = container.streams.video[0] if container.streams.video else None
        audio_stream = container.streams.audio[0] if container.streams.audio else None
        
        if not video_stream:
            logger.error("No video stream found in file")
            return
            
        logger.info(f"Video stream info: {video_stream.width}x{video_stream.height}, codec: {video_stream.codec.name}")
        logger.info(f"Video frame rate: {video_stream.average_rate}, time_base: {video_stream.time_base}")
        
        if audio_stream:
            logger.info(f"Audio stream info: {audio_stream.sample_rate}Hz, {audio_stream.channels} channels, codec: {audio_stream.codec.name}")
        
        # Set target frame rate
        target_fps = 30
        frame_duration = 1.0 / target_fps
        
        frame_count = 0
        start_time = asyncio.get_event_loop().time()
        
        for packet in container.demux():
            if packet.stream == video_stream:
                for frame in packet.decode():
                    try:
                        # Reformat frame to target size and RGB24
                        rgb_frame = frame.reformat(
                            width=1280, 
                            height=720, 
                            format='rgb24'
                        )
                        
                        # Convert to numpy array then to bytes
                        import numpy as np
                        frame_array = rgb_frame.to_ndarray()
                        rgb_data = frame_array.tobytes()
                        
                        # Create VideoFrame for LiveKit (correct API)
                        video_frame = rtc.VideoFrame(
                            1280,
                            720,
                            rtc.VideoBufferType.RGB24,
                            rgb_data
                        )
                        
                        # Send the frame
                        await video_source.capture_frame(video_frame)
                        
                        frame_count += 1
                        
                        # Calculate target time for this frame
                        target_time = start_time + (frame_count * frame_duration)
                        current_time = asyncio.get_event_loop().time()
                        
                        # Sleep if we're ahead of schedule
                        if current_time < target_time:
                            await asyncio.sleep(target_time - current_time)
                        
                        # Log progress every 100 frames
                        if frame_count % 100 == 0:
                            logger.info(f"Streamed {frame_count} frames")
                            
                    except Exception as e:
                        logger.error(f"Error processing video frame {frame_count}: {e}")
                        continue
                        
            elif packet.stream == audio_stream and audio_source:
                for frame in packet.decode():
                    try:
                        # Reformat audio to 48kHz stereo
                        audio_frame = frame.reformat(
                            format='s16',
                            layout='stereo', 
                            rate=48000
                        )
                        
                        # Convert to numpy array then to bytes
                        import numpy as np
                        audio_array = audio_frame.to_ndarray()
                        audio_data = audio_array.tobytes()
                        
                        # Create AudioFrame for LiveKit (correct API)
                        audio_livekit = rtc.AudioFrame(
                            data=audio_data,
                            sample_rate=48000,
                            num_channels=2,
                            samples_per_channel=audio_frame.samples
                        )
                        
                        # Send audio
                        await audio_source.capture_frame(audio_livekit)
                        
                    except Exception as e:
                        logger.error(f"Error processing audio frame: {e}")
                        continue
        
        logger.info(f"Finished streaming {frame_count} video frames")
        
    except Exception as e:
        logger.error(f"Error streaming MP4: {e}")
        import traceback
        logger.error(traceback.format_exc())


async def stream_hls_content(video_source, audio_source, hls_url):
    """Stream HLS content using asyncio subprocess"""
    try:
        # Use ffmpeg to read HLS and output raw video/audio
        cmd = [
            'ffmpeg',
            '-i', hls_url,
            '-f', 'rawvideo',
            '-pix_fmt', 'rgb24',
            '-s', '1280x720',
            '-r', '30',
            '-an',  # no audio for now, handle separately
            'pipe:1'
        ]
        
        logger.info(f"Starting ffmpeg for HLS: {' '.join(cmd)}")
        
        # Use asyncio subprocess
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        frame_size = 1280 * 720 * 3  # RGB24
        frame_duration = 1.0 / 30.0  # 30 FPS
        frame_count = 0
        
        while True:
            try:
                # Read frame data asynchronously
                frame_data = await process.stdout.read(frame_size)
                if len(frame_data) != frame_size:
                    logger.info(f"End of stream or incomplete frame. Got {len(frame_data)} bytes, expected {frame_size}")
                    break
                    
                # Create VideoFrame
                video_frame = rtc.VideoFrame(
                    1280,
                    720,
                    rtc.VideoBufferType.RGB24,
                    frame_data
                )
                
                await video_source.capture_frame(video_frame)
                frame_count += 1
                
                # Log progress every 100 frames
                if frame_count % 100 == 0:
                    logger.info(f"Streamed {frame_count} HLS frames")
                
                await asyncio.sleep(frame_duration)
                
            except Exception as e:
                logger.error(f"Error processing HLS frame {frame_count}: {e}")
                break
        
        # Wait for process to complete
        await process.wait()
        logger.info(f"HLS streaming finished. Total frames: {frame_count}")
            
    except Exception as e:
        logger.error(f"Error streaming HLS: {e}")
        import traceback
        logger.error(traceback.format_exc())
        # Fallback: just keep the connection alive for 5 minutes
        logger.info("Falling back to keeping connection alive...")
        await asyncio.sleep(300)

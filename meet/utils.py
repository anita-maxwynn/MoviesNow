# utils.py
import os
from livekit.api.access_token import AccessToken, VideoGrants

def generate_livekit_token(room_name: str, identity: str) -> str:
    """
    Generates a LiveKit JWT token for a participant
    """
    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")
    
    if not api_key or not api_secret:
        raise ValueError("LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set")

    # Grant permissions for joining a specific room
    grants = VideoGrants(
        room_join=True,
        room=room_name,
        can_publish=True,
        can_subscribe=True,
        can_publish_data=True
    )

    token = AccessToken(api_key=api_key, api_secret=api_secret)
    token.with_identity(identity).with_grants(grants)

    return token.to_jwt()


from livekit import api
import os

def create_ingress(room_name: str, identity: str):
    client = api.LiveKitAPI(
        api_key=os.getenv("LIVEKIT_API_KEY"),
        api_secret=os.getenv("LIVEKIT_API_SECRET"),
        url="https://cloud.livekit.io"  # use LiveKit Cloud endpoint
    )

    ingress = client.ingress.create(
        input_type=api.IngressInput.RTMP_INPUT,
        room_name=room_name,
        participant_identity=identity,
    )

    return ingress  # contains RTMP URL + stream key

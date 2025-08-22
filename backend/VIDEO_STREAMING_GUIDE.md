# Video Streaming in Conference Rooms - LiveKit Integration

## Overview

Your MoviesNow application now has automatic video streaming functionality that streams movies into LiveKit conference rooms at scheduled meeting times using Celery Beat.

## Features

### Automatic Movie Streaming
- Movies automatically start streaming when `meet_datetime` is reached
- Supports both MP4 files and HLS streams (M3U8)
- Uses LiveKit Python SDK for real-time video streaming
- Automatic cleanup of expired streams

### Manual Controls
- Start/stop movie streaming via API endpoints
- Management commands for testing and administration
- Room creator permissions for movie controls

## Database Schema

### Room Model (Updated)
- `ingress_id`: LiveKit ingress ID for streaming control
- `movie_url`: Current streaming URL (MP4 or HLS)
- All existing fields remain unchanged

## API Endpoints

### Movie Control Endpoints
```
POST /api/meet/rooms/{room_id}/start_movie/
POST /api/meet/rooms/{room_id}/stop_movie/
GET /api/meet/rooms/{room_id}/movie_status/
```

**Permissions**: Only room creators can start/stop movies

### Example API Usage
```javascript
// Start movie streaming
fetch('/api/meet/rooms/your-room-id/start_movie/', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer your-jwt-token',
        'Content-Type': 'application/json'
    }
})

// Check movie status
fetch('/api/meet/rooms/your-room-id/movie_status/', {
    headers: {
        'Authorization': 'Bearer your-jwt-token'
    }
})
```

## Management Commands

### Start Movie Stream
```bash
python manage.py start_movie_stream <room_id>
```

### Stop Movie Stream
```bash
python manage.py stop_movie_stream <room_id>
```

### List All Rooms
```bash
python manage.py list_rooms
```

## Celery Tasks

### Automatic Tasks (Celery Beat)
- `check_and_start_movies`: Runs every 60 seconds, starts movies at scheduled time
- `cleanup_expired_ingresses`: Runs every 5 minutes, cleans up old streams

### Manual Tasks
- `start_movie_ingress(room_id)`: Start streaming for a room
- `stop_movie_ingress(room_id)`: Stop streaming for a room
- `notify_movie_started(room_id)`: Notify participants via WebSocket
- `notify_movie_stopped(room_id)`: Notify participants movie stopped

## How It Works

### 1. Automatic Streaming Flow
```
1. Room created with movie and meet_datetime
2. Celery Beat checks every minute for rooms ready to start
3. When meet_datetime reached:
   - Create LiveKit ingress for movie streaming
   - Start bot participant that streams video
   - Update room status (movie_started=True)
   - Notify participants via WebSocket
4. Movie streams until duration ends or manually stopped
```

### 2. Video Source Priority
```
1. If movie.hls_path exists → Use HLS stream
2. Else → Use MP4 file via Django media URL
```

### 3. Bot Streaming
- Creates LiveKit bot participant "video-bot"
- Streams video frames using PyAV (for MP4) or FFmpeg (for HLS)
- Maintains proper frame rate and quality

## LiveKit Configuration

### Required Environment Variables
```bash
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
```

### LiveKit Room Names
- Uses `room.name` as LiveKit room identifier
- Supports multiple participants watching the same stream

## Dependencies Added

```
av==14.1.0  # PyAV for video processing
livekit      # LiveKit Python SDK (already installed)
```

## Testing

### 1. Create Test Data
```bash
python test_streaming.py
```

### 2. Manual Testing
```bash
# Start streaming
python manage.py start_movie_stream <room_id>

# Check status
python manage.py list_rooms

# Stop streaming
python manage.py stop_movie_stream <room_id>
```

### 3. API Testing
Use the provided room ID with your frontend or API client to test the endpoints.

## Troubleshooting

### Common Issues

1. **"Movie not starting automatically"**
   - Ensure Celery worker and beat are running
   - Check `meet_datetime` is set correctly
   - Verify movie is assigned to room

2. **"LiveKit connection failed"**
   - Check LIVEKIT_URL, API_KEY, API_SECRET
   - Ensure LiveKit server is running
   - Verify network connectivity

3. **"Video file not found"**
   - Check movie file paths in media directory
   - Verify HLS files are properly generated
   - Ensure Django media serving is configured

### Logs
Monitor Django logs and Celery worker logs for detailed error information.

## Integration with Frontend

Your React frontend with LiveKit components should automatically receive the video stream when:
1. User joins the room with valid token
2. Movie streaming is active
3. Bot participant "video-bot" is publishing video track

The existing LiveKit React components will display the streamed movie automatically.

## Future Enhancements

- [ ] Support for live camera streaming
- [ ] Multiple video sources per room
- [ ] Recording capabilities
- [ ] Stream quality controls
- [ ] Participant video reactions overlay

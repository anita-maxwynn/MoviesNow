import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { meetsAPI } from "@/lib/api";
import {
  LiveKitRoom,
  ParticipantTile,
  TrackRefContext,
  useTracks,
  ControlBar,
  ConnectionQualityIndicator,
  FocusLayoutContainer,
  Chat,
  useParticipants,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import { 
  Video, 
  MessageSquare,
  Users,
} from "lucide-react";

interface RoomData {
  id: string;
  name: string;
  creator_email: string;
  meet_datetime: string;
  max_participants: number;
  is_active: boolean;
  movie_details?: {
    title: string;
    description: string;
    genre: string;
    duration_minutes: number;
  };
  movie_started: boolean;
  movie_start_time?: string;
}

const SpotlightLayout = () => {
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  // Focus on screenshare if any, else active speaker, else first track
  const focusTrack =
    tracks.find((t) => t.source === Track.Source.ScreenShare) ||
    tracks.find((t) => t.participant.isSpeaking) ||
    tracks[0];

  const otherTracks = tracks.filter((t) => t !== focusTrack);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 p-2 bg-black rounded-lg overflow-hidden">
        {focusTrack && (
          <TrackRefContext.Provider value={focusTrack}>
            <ParticipantTile className="h-full w-full object-cover rounded-lg" />
          </TrackRefContext.Provider>
        )}
      </div>

      {otherTracks.length > 0 && (
        <div className="flex gap-2 overflow-x-auto mt-2 px-2">
          {otherTracks.map((track) => (
            <TrackRefContext.Provider key={track.sid} value={track}>
              <ParticipantTile className="w-32 h-24 object-cover rounded-lg flex-shrink-0" />
            </TrackRefContext.Provider>
          ))}
        </div>
      )}
    </div>
  );
};


const MeetingRoom = ({ roomData, onLeave }: { roomData: RoomData; onLeave: () => void }) => {
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const participants = useParticipants();

  return (
    <div className="h-full flex">
      {/* Main meeting area */}
      <div className={`flex-1 flex flex-col ${showChat ? 'mr-80' : ''}`}>
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">{roomData.name}</h2>
            {roomData.movie_details && (
              <Badge variant="secondary" className="text-sm">
                🎬 {roomData.movie_details.title}
              </Badge>
            )}
            {roomData.movie_started && (
              <Badge variant="default" className="text-sm bg-red-500 text-white">
                🔴 Movie Playing
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowParticipants(!showParticipants)}
            >
              <Users className="w-4 h-4 mr-2" />
              {participants.length}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChat(!showChat)}
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Video area with spotlight layout */}
        <div className="flex-1 bg-gray-900">
          <SpotlightLayout />
        </div>

        {/* Control bar */}
        <div className="bg-white border-t px-6 py-4 flex justify-between items-center">
          <ControlBar 
            variation="minimal"
            controls={{
              microphone: true,
              camera: true,
              screenShare: true,
              chat: false, // We have our own chat button
              leave: false, // We have our own leave button
            }}
          />
          <Button onClick={onLeave} variant="destructive" size="sm">
            Leave Meeting
          </Button>
        </div>
      </div>

      {/* Chat sidebar */}
      {showChat && (
        <div className="w-80 bg-white border-l flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Chat</h3>
          </div>
          <div className="flex-1">
            <Chat />
          </div>
        </div>
      )}

      {/* Participants sidebar */}
      {showParticipants && (
    <div className="absolute right-0 top-0 w-64 bg-white rounded-lg shadow-lg border z-50 h-full">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Participants ({participants.length})</h3>
      </div>
      <div className="overflow-y-auto max-h-full">
        {participants.map((p) => (
          <div key={p.sid} className="p-3 border-b last:border-b-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {p.identity.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-sm">
                  {p.identity} {p.isLocal && <Badge variant="outline" className="ml-2 text-xs">You</Badge>}
                </div>
                {p.isSpeaking && <div className="text-xs text-green-600">Speaking</div>}
              </div>
            </div>
            <ConnectionQualityIndicator participant={p} />
          </div>
        ))}
      </div>
    </div>
  )}
    </div>
  );
};

export default function Meet() {
  const { id: roomId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [token, setToken] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Get room info on mount
  useEffect(() => {
    if (roomId) {
      fetchRoomInfo();
    } else {
      toast.error("Room ID is required");
      navigate("/meets");
    }
  }, [roomId]);

  const fetchRoomInfo = async () => {
    try {
      const response = await meetsAPI.getRoom(roomId!);
      setRoomData(response.data);
      setError(null);
    } catch (error: any) {
      console.error("Failed to fetch room info:", error);
      const errorMessage = error.response?.data?.detail || "Failed to load room information";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Get LiveKit token and join room
  const joinRoom = async () => {
    if (!roomData || !user) {
      toast.error("Room data or user not available");
      return;
    }

    setLoading(true);
    try {
      // Get LiveKit token from backend - using roomId instead of room name
      const tokenResponse = await meetsAPI.getLiveKitToken(
        roomId!
      );
      setToken(tokenResponse.data.token);
      console.log("LiveKit token received:", tokenResponse.data.token.substring(0, 50) + "...");
      console.log("LiveKit server URL:", livekitUrl);
      toast.success("Successfully joined the room!");
    } catch (err: any) {
      console.error("Failed to join room:", err);
      const errorMessage = err.response?.data?.error || err.message || "Failed to join room";
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Leave the room and handle disconnection
  const handleLeaveRoom = () => {
    setToken("");
    toast.info("Left the meeting room");
    navigate("/meets");
  };

  // Handle connection errors
  const handleDisconnected = (reason: any) => {
    console.log("Disconnected from room:", reason);
    setToken("");
    toast.error("Disconnected from the meeting");
    navigate("/meets");
  };

  // Handle connection state changes
  const handleConnected = () => {
    console.log("Successfully connected to LiveKit room");
    toast.success("Connected to meeting room!");
  };

  const handleConnectionError = (error: any) => {
    console.error("LiveKit connection error:", error);
    // Only show error if it's not a client disconnect
    if (!error.message.includes('Client initiated disconnect')) {
      toast.error("Failed to connect to meeting room");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4 text-red-600">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate("/meets")} className="w-full">
              Back to Meetings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!roomData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading room...</h2>
          <p className="text-gray-600">Please wait while we fetch room information</p>
        </div>
      </div>
    );
  }

  // Get LiveKit server URL
  const livekitUrl = import.meta.env.VITE_LIVEKIT_URL || "wss://localhost:7880";

  return (
    <div className="min-h-screen bg-gray-50">
      {!token ? (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Join Meeting Room</h2>
                <p className="text-gray-600">Ready to start your video meeting?</p>
              </div>
              
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2">{roomData.name}</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Host:</strong> {roomData.creator_email}</p>
                    <p><strong>Meeting Time:</strong> {new Date(roomData.meet_datetime).toLocaleString()}</p>
                    <p><strong>Max Participants:</strong> {roomData.max_participants}</p>
                    {roomData.movie_details && (
                      <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                        <p><strong>🎬 Featured Movie:</strong> {roomData.movie_details.title}</p>
                        <p className="text-xs mt-1">{roomData.movie_details.description}</p>
                        <p className="text-xs">Duration: {roomData.movie_details.duration_minutes} minutes</p>
                      </div>
                    )}
                    {roomData.movie_started && (
                      <Badge variant="default" className="bg-red-500 text-white">
                        🔴 Movie Currently Playing
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={joinRoom}
                    disabled={loading}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Joining...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        Join Room
                      </div>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={() => navigate("/meets")} 
                    variant="outline" 
                    className="w-full"
                  >
                    Back to Meetings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="h-screen">
          <LiveKitRoom
            video={false}  // Don't auto-start video
            audio={false}  // Don't auto-start audio
            token={token}
            serverUrl={livekitUrl}
            data-lk-theme="default"
            style={{ height: '100%' }}
            onDisconnected={handleDisconnected}
            onConnected={handleConnected}
            onError={handleConnectionError}
            connectOptions={{
              autoSubscribe: true,
            }}
            options={{
              // Add connection timeout and retry options
              publishDefaults: {
                videoCodec: 'vp8',
              },
            }}
          >
            <MeetingRoom roomData={roomData} onLeave={handleLeaveRoom} />
          </LiveKitRoom>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { meetsAPI } from '@/lib/api';

interface Room {
  id: string;
  name: string;
  creator_email: string;
  meet_datetime: string;
  created_at: string;
  invite_duration_minutes: number;
  max_participants: number;
  is_private: boolean;
  movie_details?: {
    id: string;
    title: string;
    genre: string;
  };
  is_active: boolean;
  movie_started: boolean;
}

export const useMeets = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = async (params?: {
    page?: number;
    search?: string;
    is_active?: boolean;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await meetsAPI.getRooms(params);
      setRooms(response.data.results || response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  const getRoom = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await meetsAPI.getRoom(id);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch room');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async (roomData: {
    name: string;
    meet_datetime: string;
    invite_duration_minutes?: number;
    max_participants?: number;
    is_private?: boolean;
    movie?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await meetsAPI.createRoom(roomData);
      // Refresh the rooms list
      await fetchRooms();
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to create room');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateRoom = async (id: string, roomData: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await meetsAPI.updateRoom(id, roomData);
      // Refresh the rooms list
      await fetchRooms();
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to update room');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteRoom = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await meetsAPI.deleteRoom(id);
      // Remove from local state
      setRooms(prev => prev.filter(room => room.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete room');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const startMovie = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await meetsAPI.startMovie(id);
      // Refresh the rooms list to update movie status
      await fetchRooms();
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to start movie');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const stopMovie = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await meetsAPI.stopMovie(id);
      // Refresh the rooms list to update movie status
      await fetchRooms();
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to stop movie');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getLiveKitToken = async (roomName: string, participantName: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await meetsAPI.getLiveKitToken(roomName, participantName);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to get LiveKit token');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  return {
    rooms,
    loading,
    error,
    fetchRooms,
    getRoom,
    createRoom,
    updateRoom,
    deleteRoom,
    startMovie,
    stopMovie,
    getLiveKitToken,
  };
};

export default useMeets;

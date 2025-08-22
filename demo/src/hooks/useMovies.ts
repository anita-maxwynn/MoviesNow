import { useState, useEffect } from 'react';
import { moviesAPI } from '@/lib/api';

interface Movie {
  id: string;
  title: string;
  description: string;
  movie_file: string;
  thumbnail?: string;
  duration_minutes: number;
  genre: string;
  release_year: number;
  created_at: string;
  is_active: boolean;
  conversion_status: 'pending' | 'processing' | 'completed' | 'failed';
  hls_path?: string;
  rating: number;
}

export const useMovies = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMovies = async (params?: {
    page?: number;
    search?: string;
    genre?: string;
    is_active?: boolean;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await moviesAPI.getMovies(params);
      setMovies(response.data.results || response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch movies');
    } finally {
      setLoading(false);
    }
  };

  const getMovie = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await moviesAPI.getMovie(id);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch movie');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createMovie = async (movieData: {
    title: string;
    description: string;
    genre: string;
    release_year: number;
    duration_minutes: number;
    movie_file?: File;
    thumbnail?: File;
    is_active?: boolean;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await moviesAPI.createMovie(movieData);
      // Refresh the movies list
      await fetchMovies();
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to create movie');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateMovie = async (id: string, movieData: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await moviesAPI.updateMovie(id, movieData);
      // Refresh the movies list
      await fetchMovies();
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to update movie');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteMovie = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await moviesAPI.deleteMovie(id);
      // Remove from local state
      setMovies(prev => prev.filter(movie => movie.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete movie');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  return {
    movies,
    loading,
    error,
    fetchMovies,
    getMovie,
    createMovie,
    updateMovie,
    deleteMovie,
  };
};

export default useMovies;

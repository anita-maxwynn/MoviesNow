import axios from 'axios';

// Base URL for the Django backend
const BASE_URL = 'http://localhost:8000';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authentication token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${BASE_URL}/account/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/account/login/', credentials),
  
  register: (userData: {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
    profile_picture?: string;
  }) => api.post('/account/register/', userData),
  
  refreshToken: (refresh: string) =>
    api.post('/account/token/refresh/', { refresh }),
  
  activateAccount: (uidb64: string, token: string) =>
    api.post(`/account/activate/${uidb64}/${token}/`),
  
  googleLogin: (accessToken: string) =>
    api.post('/account/google-login/', { access_token: accessToken }),
  
  getProfile: () => api.get('/account/profile/'),
};

// Movies API
export const moviesAPI = {
  getMovies: (params?: {
    page?: number;
    search?: string;
    genre?: string;
    is_active?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.genre) queryParams.append('genre', params.genre);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    
    return api.get(`/movies/?${queryParams.toString()}`);
  },
  
  getMovie: (id: string) => api.get(`/movies/${id}/`),
  
  createMovie: (movieData: {
    title: string;
    description: string;
    genre: string;
    release_year: number;
    duration_minutes: number;
    movie_file?: File;
    thumbnail?: File;
    is_active?: boolean;
  }) => {
    const formData = new FormData();
    Object.entries(movieData).forEach(([key, value]) => {
      if (value !== undefined) {
        if (typeof value === 'boolean') {
          formData.append(key, value.toString());
        } else if (typeof value === 'number') {
          formData.append(key, value.toString());
        } else {
          formData.append(key, value);
        }
      }
    });
    return api.post('/movies/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  updateMovie: (id: string, movieData: any) => {
    const formData = new FormData();
    Object.entries(movieData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'boolean') {
          formData.append(key, value.toString());
        } else if (typeof value === 'string' || value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });
    return api.patch(`/movies/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  deleteMovie: (id: string) => api.delete(`/movies/${id}/`),
};

// Movie Reviews API
export const reviewsAPI = {
  getReviews: (movieId?: string) => {
    const params = movieId ? `?movie=${movieId}` : '';
    return api.get(`/movie-reviews/${params}`);
  },
  
  createReview: (reviewData: {
    movie: string;
    rating: number;
    comment: string;
  }) => api.post('/movie-reviews/', reviewData),
  
  updateReview: (id: string, reviewData: any) =>
    api.patch(`/movie-reviews/${id}/`, reviewData),
  
  deleteReview: (id: string) => api.delete(`/movie-reviews/${id}/`),
};

// Meets API
export const meetsAPI = {
  getRooms: (params?: {
    page?: number;
    search?: string;
    is_active?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    
    return api.get(`/meet/rooms/?${queryParams.toString()}`);
  },
  
  getRoom: (id: string) => api.get(`/meet/rooms/${id}/`),
  
  createRoom: (roomData: {
    name: string;
    meet_datetime: string;
    invite_duration_minutes?: number;
    max_participants?: number;
    is_private?: boolean;
    movie?: string;
  }) => api.post('/meet/rooms/', roomData),
  
  updateRoom: (id: string, roomData: any) =>
    api.patch(`/meet/rooms/${id}/`, roomData),
  
  deleteRoom: (id: string) => api.delete(`/meet/rooms/${id}/`),
  
  startMovie: (id: string) => api.post(`/meet/rooms/${id}/start-movie/`),
  
  stopMovie: (id: string) => api.post(`/meet/rooms/${id}/stop-movie/`),
  
  getLiveKitToken: (roomId: string) =>
    api.post('/meet/get-token/', {
      roomId: roomId,
    }),
  
  createInvitation: (invitationData: {
    room: string;
    invited_user: string;
  }) => api.post('/meet/invite/', invitationData),
  
  getMyInvitations: () => api.get('/meet/my-invitations/'),
  
  acceptInvitation: (invitationId: string) => 
    api.post(`/meet/invitations/${invitationId}/accept/`),
};

// WebSocket URLs
export const websocketAPI = {
  chatSocket: (roomName: string) => `ws://localhost:8000/ws/chat/${roomName}/`,
};

export default api;

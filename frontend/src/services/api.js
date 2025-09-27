import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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
      
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        try {
          const response = await axios.post('http://localhost:8000/api/token/refresh/', {
            refresh: refreshToken
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      } else {
        // No refresh token, redirect to login
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  // Register user
  register: async (userData) => {
    const response = await api.post('/users/register/', userData);
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/users/login/', credentials);
    return response.data;
  },

  // Get user profile
  getProfile: async () => {
    const response = await api.get('/users/profile/');
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData) => {
    const response = await api.put('/users/profile/', userData);
    return response.data;
  },
};

// Document API functions
export const documentAPI = {
  // Upload document
  upload: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/documents/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },

  // Get all documents for current user
  getAll: async (page = 1, search = '', status = '') => {
    const params = new URLSearchParams();
    if (page > 1) params.append('page', page);
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    
    const response = await api.get(`/documents/?${params.toString()}`);
    return response.data;
  },

  // Get document by ID
  getById: async (documentId) => {
    const response = await api.get(`/documents/${documentId}/`);
    return response.data;
  },

  // Delete document
  delete: async (documentId) => {
    const response = await api.delete(`/documents/${documentId}/`);
    return response.data;
  },

  // Download document
  download: async (documentId) => {
    const response = await api.get(`/documents/${documentId}/download/`, {
      responseType: 'blob',
    });
    return response;
  },
};

// Chat API functions
export const chatAPI = {
  // Ask question to chatbot
  askQuestion: async (question, conversationId = null) => {
    const requestData = { question };
    if (conversationId) {
      requestData.conversation_id = conversationId;
    }
    
    const response = await api.post('/chatbot/ask/', requestData);
    return response.data;
  },
};

export default api;
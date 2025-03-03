import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Add timeout
});

// Single request interceptor handling both tokens and image requests
axiosInstance.interceptors.request.use(
  (config) => {
    try {
      // Add token to all requests
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Special handling for image requests
      if (config.url?.startsWith('/uploads/')) {
        config.responseType = 'blob';
        config.headers['Cache-Control'] = 'no-cache';
        config.headers['Pragma'] = 'no-cache';
        config.headers['Expires'] = '0';
        config.url = `${config.url}?t=${new Date().getTime()}`;
      }

      return config;
    } catch (error) {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with better error handling
axiosInstance.interceptors.response.use(
  (response) => {
    // Handle successful responses
    if (response.config.responseType === 'blob') {
      return response;
    }
    return response;
  },
  async (error) => {
    try {
      const originalRequest = error.config;

      // Handle 401 Unauthorized
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // Handle network errors
      if (!error.response) {
        console.error('Network Error:', error);
        return Promise.reject(new Error('Network error occurred'));
      }

      // Handle other errors
      console.error('API Error:', {
        status: error.response?.status,
        data: error.response?.data,
        url: originalRequest.url
      });

      return Promise.reject(error);
    } catch (e) {
      console.error('Response interceptor error:', e);
      return Promise.reject(error);
    }
  }
);

// Add retry logic for failed requests
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry if we already tried or specific status codes
    if (originalRequest._retry || error.response?.status === 401) {
      return Promise.reject(error);
    }

    if (error.response?.status === 500 || !error.response) {
      originalRequest._retry = true;
      try {
        return await axiosInstance(originalRequest);
      } catch (retryError) {
        return Promise.reject(retryError);
      }
    }

    return Promise.reject(error);
  }
);

// Add global error handler
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Global error notification could be added here
    console.error('Request failed:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

export default axiosInstance;
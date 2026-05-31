import axios from 'axios';

// Base URL can be configured via environment variables
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://auth.ucentric.id';

const api = axios.create({ baseURL });

// 1. Add Access Token to each Request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 2. Automatic Refresh Token if Access Token Expired (403)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If rejected by server (403 expired) and not retried yet
    // Do NOT try to refresh if the request was to the login endpoint
    if (error.response?.status === 403 && !originalRequest._retry && !originalRequest.url?.includes('/api/auth/login')) {
      originalRequest._retry = true;
      let refreshToken = null;
      if (typeof window !== 'undefined') {
        refreshToken = localStorage.getItem('refreshToken');
      }
      
      try {
        const res = await axios.post(`${baseURL}/api/auth/refresh`, { refreshToken });
        
        if (res.data.success) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', res.data.data.token);
          }
          originalRequest.headers.Authorization = `Bearer ${res.data.data.token}`;
          return api(originalRequest); // Retry original request
        }
      } catch (err) {
        // Refresh token also expired/deleted, must re-login
        if (typeof window !== 'undefined') {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

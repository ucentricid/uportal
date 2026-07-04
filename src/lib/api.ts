import axios from 'axios';

// The client-side API instance should point to the local Next.js proxy routes
// which will securely attach the X-API-KEY and X-API-SECRET before forwarding
// to the actual Backoffice API.
const api = axios.create({ 
  withCredentials: true 
});

// 1. Add Access Token to each Request (Fallback for Cookie)
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 2. Handle Unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If we get a 401 or 403 on the client side, it means our session is invalid
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      if (typeof window !== 'undefined' && !error.config.url?.includes('/api/proxy/auth/login')) {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

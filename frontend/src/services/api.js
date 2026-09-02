import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Save/remove authentication token
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('iiita_token', token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem('iiita_token');
    delete api.defaults.headers.common.Authorization;
  }
};

// Load token when app starts
const initialToken = localStorage.getItem('iiita_token');

if (initialToken) {
  api.defaults.headers.common.Authorization = `Bearer ${initialToken}`;
}

// Always attach the latest token to protected requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('iiita_token');

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
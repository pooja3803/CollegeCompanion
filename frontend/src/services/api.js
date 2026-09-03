import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5050/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const setAuthToken = (token) => {

  if (token) {

    localStorage.setItem(
      'iiita_token',
      token
    );

    api.defaults.headers.common.Authorization =
      `Bearer ${token}`;

  } else {

    localStorage.removeItem(
      'iiita_token'
    );

    delete api.defaults.headers.common.Authorization;
  }
};


// Load token when application starts

const savedToken =
  localStorage.getItem('iiita_token');

if (savedToken) {

  api.defaults.headers.common.Authorization =
    `Bearer ${savedToken}`;
}


// Automatically attach token

api.interceptors.request.use(
  (config) => {

    const token =
      localStorage.getItem('iiita_token');

    if (token) {

      config.headers =
        config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;

  },
  (error) => Promise.reject(error)
);


// Automatically logout on invalid token

api.interceptors.response.use(

  (response) => response,

  (error) => {

    if (
      error.response?.status === 401 &&
      !error.config.url.includes('/auth/login')
    ) {

      setAuthToken(null);

      localStorage.removeItem(
        'iiita_user'
      );
    }

    return Promise.reject(error);
  }
);

export default api;
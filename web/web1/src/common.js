import axios from 'axios';

/* =========================================================
   API  (shared by main.jsx and the modules in ./reports)
========================================================= */

const host = typeof window !== 'undefined' ? (window.location.hostname || 'localhost') : 'localhost';
const isLocalHost = ['localhost', '127.0.0.1'].includes(host);
const localApiUrl = `http://${host}:5001/api`;

// Never silently fall back to the live API while running the local ERP.
// VITE_API_URL can still be supplied explicitly for a deployment.
const configuredApiUrl = import.meta.env.VITE_API_URL;
const apiBaseURL = configuredApiUrl || localApiUrl;

// Localhost is the default for the desktop/local ERP.
// Set VITE_API_URL when deploying to a live server.
export const API = axios.create({
  baseURL: apiBaseURL
});

API.interceptors.request.use(config => {
  const token = localStorage.getItem('xmart_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  response => response,
  error => {
    if (typeof window !== 'undefined') {
      console.error('[XMart API]', {
        url: error?.config?.baseURL ? `${error.config.baseURL}${error.config.url || ''}` : error?.config?.url,
        status: error?.response?.status,
        data: error?.response?.data
      });
    }
    return Promise.reject(error);
  }
);

/* =========================================================
   HELPERS
========================================================= */

export const money = value =>
  `Rs. ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

export const getErrorMessage = error =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  (typeof error?.response?.data === 'string' ? error.response.data : null) ||
  error?.message ||
  'Request failed';

export const normalizeList = data =>
  Array.isArray(data) ? data : (data?.data || data?.rows || []);

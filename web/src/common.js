import axios from 'axios';

/* =========================================================
   API  (shared by main.jsx and the modules in ./reports)
========================================================= */

export const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    'http://localhost:5001/api' 
});

//'https://api-h.raas-llc.com/api'  'http://localhost:5001/api'

API.interceptors.request.use(config => {
  const token = localStorage.getItem('xmart_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Broadcast successful data mutations so dashboard totals refresh immediately.
API.interceptors.response.use(response => {
  const method = String(response?.config?.method || 'get').toLowerCase();
  if (typeof window !== 'undefined' && ['post', 'put', 'patch', 'delete'].includes(method)) {
    window.dispatchEvent(new CustomEvent('xmart:data-changed', {
      detail: { method, url: response?.config?.url || '' }
    }));
  }
  return response;
});

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

/**
 * Display timestamps consistently as YYYY-MM-DD HH:mm:ss.
 *
 * SQL-style values (YYYY-MM-DD or YYYY-MM-DD HH:mm:ss) are preserved as-is.
 * Legacy ISO/Date values are converted to Pakistan Standard Time so older
 * records such as 2026-09-18T19:00:00.000Z are displayed correctly.
 */
export const dateTime = value => {
  if (value == null || value === '') return '';
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}(?: \d{2}:\d{2}:\d{2})?$/.test(raw)) return raw;
  const d = value instanceof Date ? value : new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(d).reduce((o, p) => { o[p.type] = p.value; return o; }, {});
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
};

export const localYmd = (value = new Date()) => {
  const d = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(d).reduce((o, p) => { o[p.type] = p.value; return o; }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
};

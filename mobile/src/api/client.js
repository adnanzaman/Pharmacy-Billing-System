import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Default points at a LAN backend. Change this in the app's Settings screen
// to your computer's LAN IP (e.g. http://192.168.1.10:5001/api) since
// "localhost" on a phone/emulator refers to the phone itself, not your PC.
//export const DEFAULT_API_URL = 'http://192.168.10.8:5001/api';
export const DEFAULT_API_URL = 'https://api-h.raas-llc.com/api';
let baseURL = DEFAULT_API_URL;

export const API = axios.create({ baseURL });

export async function loadApiUrl() {
  const saved = await AsyncStorage.getItem('xmart_api_url');
  baseURL = saved || DEFAULT_API_URL;
  API.defaults.baseURL = baseURL;
  return baseURL;
}

export async function setApiUrl(url) {
  baseURL = url;
  API.defaults.baseURL = url;
  await AsyncStorage.setItem('xmart_api_url', url);
}

export function getApiUrl() {
  return baseURL;
}

API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('xmart_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (r) => r,
  (err) => {
    const message =
      err.response?.data?.message ||
      (err.message === 'Network Error'
        ? 'Cannot reach the server. Check the API URL in Settings and make sure the backend is running.'
        : err.message);
    return Promise.reject(new Error(message));
  }
);

export default API;

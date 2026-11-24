import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000/api';
export const api = axios.create({ baseURL: API_URL, timeout: 20000 });

const KEY = 'autoservice_token';
let memoryToken = null;
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => (onUnauthorized = fn);

export async function loadToken() {
  try {
    memoryToken = await SecureStore.getItemAsync(KEY);
  } catch {
    memoryToken = null;
  }
  return memoryToken;
}
export async function saveToken(t) {
  memoryToken = t;
  try {
    if (t) await SecureStore.setItemAsync(KEY, t);
    else await SecureStore.deleteItemAsync(KEY);
  } catch {}
}

api.interceptors.request.use((c) => {
  if (memoryToken) c.headers.Authorization = `Bearer ${memoryToken}`;
  return c;
});
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && memoryToken) onUnauthorized();
    return Promise.reject(err);
  }
);

export const errMsg = (e) => {
  if (e.response?.data?.message) return e.response.data.message;
  if (e.code === 'ECONNABORTED' || e.message === 'Network Error') return 'Cannot reach the server. Check your connection and the API URL.';
  return e.message || 'Something went wrong';
};

/** Upload picked images (expo-image-picker assets) to Cloudinary through the API. Returns [{url, publicId}]. */
export async function uploadAssets(assets, folder = 'misc') {
  if (!assets?.length) return [];
  const form = new FormData();
  assets.forEach((a, i) => {
    const name = a.fileName || `upload-${Date.now()}-${i}.jpg`;
    form.append('files', { uri: a.uri, name, type: a.mimeType || 'image/jpeg' });
  });
  const { data } = await api.post(`/uploads?folder=${folder}`, form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000, transformRequest: (d) => d });
  return data.files;
}

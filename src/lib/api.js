import axios from 'axios';

// Ensure baseURL always ends with /api when an absolute URL is specified
export const resolveBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api';
  const clean = envUrl.trim().replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

const API = axios.create({ baseURL: resolveBaseUrl(), timeout: 15000 });

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('cg_token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

API.interceptors.response.use(
  (res) => {
    if (
      typeof res.data === 'string' &&
      (res.data.trim().startsWith('<!DOCTYPE') || res.data.trim().startsWith('<html'))
    ) {
      const err = new Error('Invalid API response format (HTML received instead of JSON)');
      err.response = res;
      return Promise.reject(err);
    }
    return res;
  },
  (err) => {
    const url = err.config?.url || '';
    if (err.response?.status === 401 && !url.startsWith('/auth/')) {
      window.dispatchEvent(new Event('cg:unauthorized'));
    }
    return Promise.reject(err);
  }
);

export const errorMessage = (err) => {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.request && !err?.response) return 'No connection. Check your internet and try again.';
  return 'Something went wrong. Please try again.';
};

export default API;

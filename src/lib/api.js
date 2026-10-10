import axios from 'axios';

// All requests go to /api on the same origin; Vite proxies them to Express.
const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 15000 });

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('cg_token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

API.interceptors.response.use(
  (res) => res,
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

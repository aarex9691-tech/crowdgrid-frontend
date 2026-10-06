import axios from 'axios';

// Create an Axios instance pointing to your backend
const API = axios.create({
  baseURL: 'http://localhost:5000/api', // Make sure your backend server is running!
});

// Interceptor: Attach the JWT token to every request automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;
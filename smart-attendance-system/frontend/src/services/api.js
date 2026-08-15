import axios from "axios";

// In deployment, set REACT_APP_API_URL as an environment variable
// (e.g. https://your-backend.onrender.com/api) in Vercel's project settings.
// Locally, it falls back to your dev backend on port 9630.
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:9630/api",
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If token expires/invalid, redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

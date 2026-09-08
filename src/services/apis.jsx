// src/services/apis.js
//
// NOTE: adjust baseURL to match whatever your real API URL is/was in the
// original file — I don't have your original apis.js, so this is a
// reasonable default. Everything else (the interceptor) is new and is what
// lets components call `api.put(...)` etc. without manually attaching the
// Authorization header.
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://api.wenyfour.com.ng",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token is rejected server-side, clear it so the app doesn't get
// stuck thinking it's still logged in.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
    }
    return Promise.reject(error);
  },
);

export default api;
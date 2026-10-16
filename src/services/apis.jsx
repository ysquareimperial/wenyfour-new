// src/services/apis.js
// Axios instance used by AuthContext and the profile pages. Shares its base
// URL and session-expiry behaviour with services/http.js.
import axios from "axios";
import { API_BASE, SESSION_EXPIRED_EVENT } from "./http";

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A rejected token logs the user out everywhere (AuthContext listens).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const hadToken = !!error.config?.headers?.Authorization;
    if (error.response?.status === 401 && hadToken) {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  },
);

export default api;

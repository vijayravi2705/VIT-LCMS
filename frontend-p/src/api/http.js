// src/api/http.js
import axios from "axios";

const http = axios.create({
  baseURL: process.env.REACT_APP_API_BASE || "http://localhost:4000/api",
  timeout: 15000,
});

// Attach token on each request
http.interceptors.request.use((config) => {
  const t = localStorage.getItem("token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// Handle 401 globally
http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      // token invalid/expired -> clear + redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("username");
      localStorage.removeItem("vitId");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default http;

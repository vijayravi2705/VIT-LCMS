// src/utils/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000/api",
  timeout: 10000,
});

let firstLog = true;

api.interceptors.request.use((config) => {
  const t = localStorage.getItem("token");     // <- uses your key "token"
  if (t) config.headers.Authorization = `Bearer ${t}`;
  if (firstLog) {
    // one-time debug so you can confirm header in DevTools
    // expect: "Bearer eyJhbGciOiJIUzI1NiIs..."
    // if null/undefined, your login page never saved token
    console.log("[api] Authorization:", config.headers.Authorization || "(none)");
    firstLog = false;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("username");
      localStorage.removeItem("vitId");
      // optional: hard redirect to /login so you don't keep hitting 401s
      if (window.location.pathname !== "/login") window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;

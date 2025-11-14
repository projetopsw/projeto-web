import axios from "axios";

function resolveBaseURL() {
  const defaultHost = (typeof window !== 'undefined' && window.location && window.location.hostname)
    ? window.location.hostname
    : 'localhost';

  const host = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_HOST)
    ? import.meta.env.VITE_API_HOST
    : defaultHost;

  const port = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_PORT)
    ? import.meta.env.VITE_API_PORT
    : '3001';

  const protocol = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_PROTOCOL)
    ? import.meta.env.VITE_API_PROTOCOL
    : 'http';

  const isIPv6 = host.includes(':');
  const hostPart = isIPv6 ? `[${host}]` : host;

  return `${protocol}://${hostPart}:${port}`;
}

const finalBaseURL = resolveBaseURL();

export const API_BASE_URL = finalBaseURL;

console.log("Axios Base URL para a API:", finalBaseURL);

const api = axios.create({
  baseURL: finalBaseURL,
  timeout: 8000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response, 
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default api;
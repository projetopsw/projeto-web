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

console.log("Axios Base URL para a API:", finalBaseURL);

const api = axios.create({
  baseURL: finalBaseURL,
  timeout: 8000,
});

export default api;
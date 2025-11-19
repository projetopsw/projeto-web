import axios from "axios";

// Definindo a URL do Backend Express (onde rodam MongoDB/Login/Spotify Proxy)
const EXPRESS_API_URL = 'http://127.0.0.1:3000'; 

export const API_BASE_URL = EXPRESS_API_URL;

const api = axios.create({
    baseURL: EXPRESS_API_URL,
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
import axios from "axios";

const USER_API_BASE_URL = 'http://localhost:3000';

console.log("User API Base URL (MongoDB):", USER_API_BASE_URL);

const userApi = axios.create({
  baseURL: USER_API_BASE_URL,
  timeout: 8000,
});

userApi.interceptors.request.use(
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

userApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default userApi;

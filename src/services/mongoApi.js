import axios from 'axios';

const mongoApi = axios.create({
  baseURL: 'http://localhost:3000', 
});

mongoApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); 
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default mongoApi;
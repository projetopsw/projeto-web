import axios from 'axios';

const mongoApi = axios.create({
  baseURL: 'http://localhost:3000', 
});

export default mongoApi;
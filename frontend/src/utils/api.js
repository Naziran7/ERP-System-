import axios from 'axios';

const rawBase =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  'http://localhost:5000';

const baseURL = rawBase.replace(/\/$/, '').endsWith('/api')
  ? rawBase.replace(/\/$/, '')
  : `${rawBase.replace(/\/$/, '')}/api`;

const api = axios.create({
  baseURL,
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("erp_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("erp_token");
      localStorage.removeItem("erp_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;

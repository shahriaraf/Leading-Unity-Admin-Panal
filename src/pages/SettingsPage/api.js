import axios from 'axios';

export const API_URL = 'https://leading-unity-nest-backend.vercel.app/api';

export const getAuthConfig = () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    return { headers: { Authorization: `Bearer ${userInfo?.token}` } };
  } catch { return {}; }
};

export const api = {
  get: (path) => axios.get(`${API_URL}/${path}`, getAuthConfig()),
  post: (path, data) => axios.post(`${API_URL}/${path}`, data, getAuthConfig()),
  patch: (path, data = {}) => axios.patch(`${API_URL}/${path}`, data, getAuthConfig()),
  delete: (path) => axios.delete(`${API_URL}/${path}`, getAuthConfig()),
};
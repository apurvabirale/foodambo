import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('foodambo_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authAPI = {
  sendOTP: (phone) => api.post('/auth/send-otp', { phone }),
  verifyOTP: (phone, code) => api.post('/auth/verify-otp', { phone, code }),
  googleAuth: (session_id) => api.post('/auth/google', { session_id }),
  facebookAuth: (access_token) => api.post('/auth/facebook', { access_token }),
  getMe: () => api.get('/auth/me'),
};

export const storeAPI = {
  create: (data) => api.post('/stores', data),
  getMy: () => api.get('/stores/me'),
  get: (id) => api.get(`/stores/${id}`),
  update: (data) => api.put('/stores/me', data),
  uploadFSSAI: (image_base64) => api.post('/fssai/upload', { image_base64 }),
};

export const productAPI = {
  create: (data) => api.post('/products', data),
  getAll: (params) => api.get('/products', { params }),
  getMy: () => api.get('/products/my'),
  get: (id) => api.get(`/products/${id}`),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getMy: () => api.get('/orders/my'),
  getSeller: () => api.get('/orders/seller'),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, null, { params: { status } }),
};

export const chatAPI = {
  send: (data) => api.post('/chat/messages', data),
  get: (orderId) => api.get(`/chat/messages/${orderId}`),
};

export const reviewAPI = {
  create: (data) => api.post('/reviews', data),
  getStore: (storeId) => api.get(`/reviews/store/${storeId}`),
};

export const walletAPI = {
  createTransaction: (type, amount, description) => api.post('/wallet/transactions', null, { params: { transaction_type: type, amount, description } }),
  getTransactions: () => api.get('/wallet/transactions/my'),
};

export default api;
import axios from 'axios';

// Base API instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle token expiration
    if (error.response?.status === 401 && localStorage.getItem('token')) {
      // Token expired, log out the user
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    // Add retry logic for network errors (3 retries)
    const { config } = error;
    if (!config || !config.retry) {
      return Promise.reject(error);
    }

    if (config.retryCount === undefined) {
      config.retryCount = 0;
    }

    // Check if we should retry the request
    if (config.retryCount < 3) {
      config.retryCount += 1;
      
      // Exponential backoff
      const delay = 1000 * Math.pow(2, config.retryCount);
      
      // Return the promise with retry
      return new Promise((resolve) => {
        setTimeout(() => resolve(api(config)), delay);
      });
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  
  register: (name: string, email: string, password: string) => 
    api.post('/auth/register', { name, email, password }),
  
  forgotPassword: (email: string) => 
    api.post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, password: string) => 
    api.post('/auth/reset-password', { token, password }),
};

// Routes API
export const routesAPI = {
  getRoutes: (origin: string, destination: string) => 
    api.get('/routes', { params: { origin, destination } }),
  
  getRouteById: (id: string) => 
    api.get(`/routes/${id}`),
  
  saveRoute: (routeData: any) => 
    api.post('/routes', routeData),
};

// Cost Estimation API
export const costAPI = {
  estimateCost: (routeId: string, transportMode: string) => 
    api.get('/costs/estimate', { params: { routeId, transportMode } }),
  
  getHistoricalPrices: (routeId: string) => 
    api.get(`/costs/history/${routeId}`),
};

// Reviews API
export const reviewsAPI = {
  getReviews: (page = 1, limit = 10, sortBy = 'createdAt', order = 'desc') => 
    api.get('/reviews', { params: { page, limit, sortBy, order } }),
  
  getReviewById: (id: string) => 
    api.get(`/reviews/${id}`),
  
  createReview: (reviewData: any) => 
    api.post('/reviews', reviewData),
  
  updateReview: (id: string, reviewData: any) => 
    api.put(`/reviews/${id}`, reviewData),
  
  deleteReview: (id: string) => 
    api.delete(`/reviews/${id}`),
};

// Admin API
export const adminAPI = {
  getUsers: (page = 1, limit = 10) => 
    api.get('/admin/users', { params: { page, limit } }),
  
  updateUser: (id: string, userData: any) => 
    api.put(`/admin/users/${id}`, userData),
  
  deleteUser: (id: string) => 
    api.delete(`/admin/users/${id}`),
  
  getPlaces: (page = 1, limit = 10) => 
    api.get('/admin/places', { params: { page, limit } }),
  
  createPlace: (placeData: any) => 
    api.post('/admin/places', placeData),
  
  updatePlace: (id: string, placeData: any) => 
    api.put(`/admin/places/${id}`, placeData),
  
  deletePlace: (id: string) => 
    api.delete(`/admin/places/${id}`),
  
  getStats: () => 
    api.get('/admin/stats'),
};
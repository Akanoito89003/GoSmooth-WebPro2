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
  // Get reviews with pagination, filtering, and sorting
  getReviews: async (page: number = 1, limit: number = 10, sort: string = 'newest', order: 'asc' | 'desc' = 'desc', filters?: any) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort,
      order,
      ...filters
    });
    return api.get(`/api/reviews?${params}`);
  },

  // Create new review
  createReview: (data: { placeId: string; placeName: string; rating: number; comment: string }) =>
    api.post('/api/reviews', data),

  // Update review
  updateReview: async (reviewId: string, data: {
    rating?: number;
    comment?: string;
  }) => {
    return axios.put(`/api/reviews/${reviewId}`, data);
  },

  // Delete review
  deleteReview: async (reviewId: string) => {
    return axios.delete(`/api/reviews/${reviewId}`);
  },

  // Like/Unlike review
  toggleLike: async (reviewId: string) => {
    return axios.post(`/api/reviews/${reviewId}/like`);
  },

  // Add comment to review
  addComment: async (reviewId: string, comment: string) => {
    return axios.post(`/api/reviews/${reviewId}/comments`, { text: comment });
  },

  likeReview: (reviewId: string) => api.post(`/api/reviews/${reviewId}/like`),

  reportReview: (reviewId: string, data: { type: string; detail: string }) => {
    return api.post(`/api/reviews/${reviewId}/report`, data);
  },
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

export const placesAPI = {
  getPlaces: async () => {
    return api.get('/api/places');
  },
  getPlaceById: async (id: string) => {
    return api.get(`/api/places/${id}`);
  }
};
import { createContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Cookies from 'js-cookie';
import React from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<string | void>;
  logout: () => void;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  isLoading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  clearError: () => {},
});

// Check token expiration
const isTokenExpired = (token: string): boolean => {
  try {
    const decoded: any = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch {
    return true;
  }
};

// Inactivity tracker
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthContextType>({
    token: null,
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    isLoading: true,
    error: null,
    login: async () => {},
    register: async () => {},
    logout: () => {},
    clearError: () => {},
  });
  
  const navigate = useNavigate();
  let inactivityTimer: NodeJS.Timeout;

  // Reset inactivity timer
  const resetInactivityTimer = () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
    
    if (authState.isAuthenticated) {
      inactivityTimer = setTimeout(() => {
        logout();
      }, INACTIVITY_TIMEOUT);
    }
  };

  // Initialize authentication state from local storage or cookie
  useEffect(() => {
    const initAuth = async () => {
      const cookieToken = Cookies.get('token');
      const sessionToken = sessionStorage.getItem('token');
      const storedToken = cookieToken || sessionToken;
      console.log('DEBUG: cookieToken:', cookieToken, 'sessionToken:', sessionToken, 'storedToken:', storedToken);
      if (storedToken && !isTokenExpired(storedToken)) {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          console.log('DEBUG: Set axios Authorization header:', api.defaults.headers.common['Authorization']);
          const response = await api.get('/api/profile');
          const userData = response.data.user || response.data;
          console.log('DEBUG: Got userData from /api/profile:', userData);
          setAuthState({
            token: storedToken,
            user: userData,
            isAuthenticated: true,
            isAdmin: userData.role === 'admin',
            isLoading: false,
            error: null,
            login: async () => {},
            register: async () => {},
            logout: () => {},
            clearError: () => {},
          });
          resetInactivityTimer();
        } catch (error) {
          console.error('DEBUG: Error fetching /api/profile:', error);
          Cookies.remove('token');
          sessionStorage.removeItem('token');
          setAuthState({
            token: null,
            user: null,
            isAuthenticated: false,
            isAdmin: false,
            isLoading: false,
            error: null,
            login: async () => {},
            register: async () => {},
            logout: () => {},
            clearError: () => {},
          });
        }
      } else {
        console.log('DEBUG: No valid token found, clearing auth state');
        Cookies.remove('token');
        sessionStorage.removeItem('token');
        setAuthState({
          token: null,
          user: null,
          isAuthenticated: false,
          isAdmin: false,
          isLoading: false,
          error: null,
          login: async () => {},
          register: async () => {},
          logout: () => {},
          clearError: () => {},
        });
      }
    };
    initAuth();
    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('keypress', resetInactivityTimer);
    window.addEventListener('click', resetInactivityTimer);
    window.addEventListener('scroll', resetInactivityTimer);
    return () => {
      window.removeEventListener('mousemove', resetInactivityTimer);
      window.removeEventListener('keypress', resetInactivityTimer);
      window.removeEventListener('click', resetInactivityTimer);
      window.removeEventListener('scroll', resetInactivityTimer);
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
    };
  }, []);

  // Login function
  const login = async (email: string, password: string, rememberMe?: boolean) => {
    try {
      // Clear any old tokens before login
      Cookies.remove('token');
      sessionStorage.removeItem('token');
      const response = await api.post('/api/auth/login', { email, password, rememberMe });
      const { token, user } = response.data;
      if (rememberMe) {
        Cookies.set('token', token, { expires: 7 }); // 7 days
      } else {
        sessionStorage.setItem('token', token);
      }
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setAuthState({
        token,
        user,
        isAuthenticated: true,
        isAdmin: user.role === 'admin',
        isLoading: false,
        error: null,
        login: async () => {},
        register: async () => {},
        logout: () => {},
        clearError: () => {},
      });
      resetInactivityTimer();
      navigate('/');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setAuthState({
          ...authState,
          error: error.response.data.message || 'Failed to login',
          isLoading: false,
        });
      } else {
        setAuthState({
          ...authState,
          error: 'An unexpected error occurred',
          isLoading: false,
        });
      }
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string): Promise<string | void> => {
    try {
      // Clear any old tokens before register
      Cookies.remove('token');
      sessionStorage.removeItem('token');
      const response = await api.post('/api/auth/register', { name, email, password });
      const { token } = response.data;
      Cookies.set('token', token, { expires: 7 }); // Always remember new user
      await login(email, password, true);
      return token;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setAuthState({
          ...authState,
          error: error.response.data.message || 'Failed to register',
          isLoading: false,
        });
      } else {
        setAuthState({
          ...authState,
          error: 'An unexpected error occurred',
          isLoading: false,
        });
      }
    }
  };

  // Logout function
  const logout = () => {
    Cookies.remove('token');
    sessionStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setAuthState({
      token: null,
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
      error: null,
      login: async () => {},
      register: async () => {},
      logout: () => {},
      clearError: () => {},
    });
    navigate('/login');
    window.location.reload();
  };

  // Clear error
  const clearError = () => {
    setAuthState({
      ...authState,
      error: null,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);
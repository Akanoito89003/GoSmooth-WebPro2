import { createContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Cookies from 'js-cookie';
import React from 'react';

interface Address {
  addressLine: string;
  city: string;
  province: string;
  zipcode: string;
  country: string;
  lat: number;
  lng: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  address?: Address;
  created_at?: string;
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
  registerUser: (
    name: string,
    email: string,
    password: string,
    address: {
      addressLine: string;
      city: string;
      province: string;
      zipcode: string;
      country: string;
      lat: number;
      lng: number;
    }
  ) => Promise<any>;
  updateProfile: (data: { name: string; address: Address }) => Promise<any>;
  changePassword: (data: { currentPassword: string; newPassword: string }) => Promise<any>;
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
  registerUser: async () => {},
  updateProfile: async () => {},
  changePassword: async () => {},
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
    registerUser: async () => {},
    updateProfile: async () => {},
    changePassword: async () => {},
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
            registerUser: async () => {},
            updateProfile: async () => {},
            changePassword: async () => {},
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
            registerUser: async () => {},
            updateProfile: async () => {},
            changePassword: async () => {},
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
          registerUser: async () => {},
          updateProfile: async () => {},
          changePassword: async () => {},
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
        registerUser: async () => {},
        updateProfile: async () => {},
        changePassword: async () => {},
      });
      resetInactivityTimer();
      navigate('/');
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        // ดักกรณีถูกแบน
        if (error.response.status === 403 && error.response.data?.banReason) {
          setAuthState({
            ...authState,
            error: error.response.data.error,
            isLoading: false,
          });
          throw { banned: true, banReason: error.response.data.banReason };
        }
        
        // จัดการข้อความผิดพลาดเฉพาะ
        let errorMessage = 'ไม่สามารถเข้าสู่ระบบได้';
        if (error.response.status === 404) {
          errorMessage = 'อีเมลที่กรอกไม่ถูกต้อง';
        } else if (error.response.status === 401) {
          errorMessage = 'รหัสผ่านไม่ถูกต้อง';
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }

        setAuthState({
          ...authState,
          error: errorMessage,
          isLoading: false,
        });
        throw { response: { data: { error: errorMessage } } };
      } else {
        setAuthState({
          ...authState,
          error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง',
          isLoading: false,
        });
        throw { response: { data: { error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง' } } };
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
      registerUser: async () => {},
      updateProfile: async () => {},
      changePassword: async () => {},
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

  const registerUser = async (
    name: string,
    email: string,
    password: string,
    address: {
      addressLine: string;
      city: string;
      province: string;
      zipcode: string;
      country: string;
      lat: number;
      lng: number;
    }
  ) => {
    try {
      const response = await axios.post('/api/auth/register', {
        name,
        email,
        password,
        address,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  };

  const updateProfile = async (data: { name: string; address: Address }) => {
    try {
      const response = await api.put('/api/profile', data);
      setAuthState((prev) => ({
        ...prev,
        user: response.data.user || response.data,
      }));
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Update profile failed');
    }
  };

  const changePassword = async (data: { currentPassword: string; newPassword: string }) => {
    try {
      const response = await api.post('/api/auth/change-password', data);
      return response.data;
    } catch (error: any) {
      console.log('DEBUG: changePassword error', error, error.response, error.message);
      // ตรวจสอบ error message จาก backend
      let msg = error.response?.data?.error || 'Change password failed';
      if (msg.toLowerCase().includes('current password') || msg.toLowerCase().includes('รหัสผ่านเดิม')) {
        msg = 'รหัสผ่านเดิมไม่ถูกต้อง';
      }
      throw new Error(msg);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        register,
        logout,
        clearError,
        registerUser,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);
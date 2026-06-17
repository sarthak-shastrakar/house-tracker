import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setUser, setToken, clearAuth } from '../redux/slices/authSlice';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUserState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ─── Fetch Current User ───────────────────────────────────────────────────
  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('buildledger_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      const userData = response.data.data.user;
      setUserState(userData);
      dispatch(setUser(userData));
      dispatch(setToken(token));
      setIsAuthenticated(true);
    } catch {
      localStorage.removeItem('buildledger_token');
      localStorage.removeItem('buildledger_refresh_token');
      dispatch(clearAuth());
      setIsAuthenticated(false);
      setUserState(null);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  // ─── Login ────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { user: userData, accessToken, refreshToken } = response.data.data;

    localStorage.setItem('buildledger_token', accessToken);
    localStorage.setItem('buildledger_refresh_token', refreshToken);

    setUserState(userData);
    dispatch(setUser(userData));
    dispatch(setToken(accessToken));
    setIsAuthenticated(true);

    return userData;
  };

  // ─── Register ─────────────────────────────────────────────────────────────
  const register = async (name, email, password, phone) => {
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
      phone,
    });
    const { user: userData, accessToken, refreshToken } = response.data.data;

    localStorage.setItem('buildledger_token', accessToken);
    localStorage.setItem('buildledger_refresh_token', refreshToken);

    setUserState(userData);
    dispatch(setUser(userData));
    dispatch(setToken(accessToken));
    setIsAuthenticated(true);

    return userData;
  };

  // ─── Logout ───────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // even if server call fails, clear local state
    } finally {
      localStorage.removeItem('buildledger_token');
      localStorage.removeItem('buildledger_refresh_token');
      dispatch(clearAuth());
      setIsAuthenticated(false);
      setUserState(null);
    }
  };

  // ─── Refresh Token ────────────────────────────────────────────────────────
  const refreshToken = async () => {
    const token = localStorage.getItem('buildledger_refresh_token');
    if (!token) throw new Error('No refresh token');

    const response = await api.post('/auth/refresh-token', {
      refreshToken: token,
    });
    const { accessToken } = response.data.data;
    localStorage.setItem('buildledger_token', accessToken);
    dispatch(setToken(accessToken));
    return accessToken;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

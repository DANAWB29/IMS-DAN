import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthAPI } from '../api/resources';
import { setTokens, clearTokens, getAccessToken, setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    if (!getAccessToken()) {
      setLoading(false);
      return;
    }
    try {
      const res = await AuthAPI.me();
      setUser(res.data);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
    setUnauthorizedHandler(() => {
      setUser(null);
    });
  }, [loadMe]);

  const login = async (email, password) => {
    const res = await AuthAPI.login({ email, password });
    setTokens(res.data);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (payload) => {
    const res = await AuthAPI.register(payload);
    setTokens(res.data);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('ims_refresh_token');
    try {
      await AuthAPI.logout(refreshToken);
    } catch {
      // ignore network errors on logout
    }
    clearTokens();
    setUser(null);
  };

  const refreshUser = async () => {
    const res = await AuthAPI.me();
    setUser(res.data);
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

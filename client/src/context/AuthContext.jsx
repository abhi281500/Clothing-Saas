import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const res = await api.getMe();
      if (res.success && res.data) {
        setUser(res.data.user);
        setStore(res.data.store);
      } else {
        setUser(null);
        setStore(null);
      }
    } catch {
      setUser(null);
      setStore(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.success) {
      setUser(res.data.user);
      setStore(res.data.store);
      return res.data;
    }
  };

  const register = async (payload) => {
    const res = await api.register(payload);
    if (res.success) {
      setUser(res.data.user);
      setStore(res.data.store);
      return res.data;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      setStore(null);
    }
  };

  const refreshStore = async () => {
    try {
      const res = await api.getMyStore();
      if (res.success) {
        setStore(res.data);
      }
    } catch (e) {
      console.error('Failed to refresh store', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        store,
        loading,
        login,
        register,
        logout,
        refreshStore,
        setStore,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

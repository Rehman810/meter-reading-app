import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import client from '../api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const storedUser = await SecureStore.getItemAsync('user');
      
      if (token && storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.log('Failed to load user info', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await client.post('/api/auth/login', { email, password });
    await SecureStore.setItemAsync('token', res.data.token);
    await SecureStore.setItemAsync('user', JSON.stringify(res.data));
    setUser(res.data);
  };

  const register = async (name, email, password) => {
    const res = await client.post('/api/auth/register', { name, email, password });
    await SecureStore.setItemAsync('token', res.data.token);
    await SecureStore.setItemAsync('user', JSON.stringify(res.data));
    setUser(res.data);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

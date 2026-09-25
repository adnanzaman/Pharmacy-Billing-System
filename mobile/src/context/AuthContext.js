import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API, { loadApiUrl } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    (async () => {
      await loadApiUrl();
      const token = await AsyncStorage.getItem('xmart_token');
      const savedUser = await AsyncStorage.getItem('xmart_user');
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          // ignore corrupt cache
        }
      }
      setBooting(false);
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    await AsyncStorage.setItem('xmart_token', data.token);
    await AsyncStorage.setItem('xmart_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['xmart_token', 'xmart_user']);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, booting, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

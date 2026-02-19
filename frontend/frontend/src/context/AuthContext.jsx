import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getMe } from '@/api/client'; // Correctly import getMe

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('brainloop_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [showTokenExpiredModal, setShowTokenExpiredModal] = useState(false);

  const fetchUser = useCallback(async () => {
    if (token) {
      try {
        const userData = await getMe(); 
        setUser({
          ...userData,
          isAdmin: userData.is_admin || userData.isAdmin || false
        });
      } catch (error) {
        setToken(null); // Invalid token
        setUser(null);
        localStorage.removeItem('brainloop_token');
        localStorage.removeItem('brainloop_user_id');
        localStorage.removeItem('brainloop_is_admin');
      }
    }
    setIsLoading(false);
  }, [token]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback((loginData) => {
    localStorage.setItem('brainloop_token', loginData.access_token);
    localStorage.setItem('brainloop_user_id', loginData.user_id);
    localStorage.setItem('brainloop_is_admin', loginData.is_admin);
    setToken(loginData.access_token);
    setUser({ 
      id: loginData.user_id, 
      username: loginData.username, 
      isAdmin: loginData.is_admin,
      ...loginData
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('brainloop_token');
    localStorage.removeItem('brainloop_user_id');
    localStorage.removeItem('brainloop_is_admin');
    setToken(null);
    setUser(null);
  }, []);

  const openTokenExpiredModal = useCallback(() => {
    setShowTokenExpiredModal(true);
  }, []);

  const closeTokenExpiredModal = useCallback(() => {
    setShowTokenExpiredModal(false);
    logout();
  }, [logout]);

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    showTokenExpiredModal,
    openTokenExpiredModal,
    closeTokenExpiredModal,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

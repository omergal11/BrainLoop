import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [showTokenExpiredModal, setShowTokenExpiredModal] = useState(false);

  const openTokenExpiredModal = useCallback(() => {
    setShowTokenExpiredModal(true);
  }, []);

  const closeTokenExpiredModal = useCallback(() => {
    setShowTokenExpiredModal(false);
  }, []);

  return (
    <AuthContext.Provider value={{ showTokenExpiredModal, openTokenExpiredModal, closeTokenExpiredModal }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

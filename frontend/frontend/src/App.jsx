import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from '@/pages/Home';
import Quiz from '@/pages/Quiz';
import Profile from '@/pages/Profile';
import Auth from '@/pages/Auth';
import LearnStats from '@/pages/LearnStats';
import AdminStats from '@/pages/AdminStats';
import Header from '@/components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';
import TokenExpiredModal from '@/components/TokenExpiredModal';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { setTokenExpiredCallback } from '@/api/client';
import './index.css';

function AppLayout() {
  const { user, showTokenExpiredModal, openTokenExpiredModal, closeTokenExpiredModal } = useAuth();

  React.useEffect(() => {
    setTokenExpiredCallback(openTokenExpiredModal);
  }, [openTokenExpiredModal]);

  return (
    <div>
      <Header />
      <TokenExpiredModal isOpen={showTokenExpiredModal} onClose={closeTokenExpiredModal} />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route 
          path="/quiz"
          element={<ProtectedRoute><Quiz /></ProtectedRoute>}
        />
        <Route 
          path="/profile"
          element={<ProtectedRoute><Profile /></ProtectedRoute>}
        />
        <Route 
          path="/stats"
          element={<ProtectedRoute><LearnStats /></ProtectedRoute>}
        />
        <Route 
          path="/admin/stats"
          element={<ProtectedRoute adminOnly={true}><AdminStats /></ProtectedRoute>}
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

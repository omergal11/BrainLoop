import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Home from '@/pages/Home';
import Quiz from '@/pages/Quiz';
import Profile from '@/pages/Profile';
import Auth from '@/pages/Auth';
import LearnStats from '@/pages/LearnStats';
import AdminStats from '@/pages/AdminStats';
import Header from '@/components/Header';
import TokenExpiredModal from '@/components/TokenExpiredModal';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { getUserStreak, setTokenExpiredCallback } from '@/api/client';
import './index.css';

function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [streak, setStreak] = useState(0);
  const { showTokenExpiredModal, openTokenExpiredModal, closeTokenExpiredModal } = useAuth();

  useEffect(() => {
    setTokenExpiredCallback(openTokenExpiredModal);
  }, [openTokenExpiredModal]);

  const isLoggedIn = !!localStorage.getItem("brainloop_token");
  const isAdmin = localStorage.getItem("brainloop_is_admin") === "true";
  const userId = parseInt(localStorage.getItem('brainloop_user_id')) || null;

  // Fetch streak from API
  useEffect(() => {
    if (userId && isLoggedIn) {
      getUserStreak(userId)
        .then((data) => setStreak(data.current_streak_days || 0))
        .catch(() => {});
    }
  }, [location.pathname, userId, isLoggedIn]); // Refetch on route change or userId change

  return (
    <div>
      <Header
        streak={streak}
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        navigate={navigate}
      />
      <TokenExpiredModal isOpen={showTokenExpiredModal} onClose={closeTokenExpiredModal} />
      {children}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/stats" element={<LearnStats />} />
            <Route path="/admin/stats" element={<AdminStats />} />
          </Routes>
        </AppLayout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
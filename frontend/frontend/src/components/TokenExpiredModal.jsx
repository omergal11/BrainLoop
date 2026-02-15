import React from 'react';
import { AlertCircle, LogOut, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function TokenExpiredModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogoutAndStay = () => {
    localStorage.removeItem('brainloop_token');
    localStorage.removeItem('brainloop_user_id');
    localStorage.removeItem('brainloop_username');
    localStorage.removeItem('brainloop_is_admin');
    onClose();
    navigate('/home');
  };

  const handleLoginAgain = () => {
    localStorage.removeItem('brainloop_token');
    localStorage.removeItem('brainloop_user_id');
    localStorage.removeItem('brainloop_username');
    localStorage.removeItem('brainloop_is_admin');
    onClose();
    navigate('/auth');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-orange-500" />
          <h2 className="text-xl font-bold text-gray-900">Session Expired</h2>
        </div>
        
        <p className="text-gray-700 mb-6">
          You haven't been logged in for a long time. Your session has expired. Would you like to log in again or stay logged out?
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleLogoutAndStay}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Stay Logged Out
          </button>
          <button
            onClick={handleLoginAgain}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Log In Again
          </button>
        </div>
      </div>
    </div>
  );
}

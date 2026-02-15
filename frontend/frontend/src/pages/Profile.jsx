import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { User, Mail, Calendar, Shield } from 'lucide-react';
import { request } from '@/api/client';
import { useAuth } from '@/context/AuthContext';

export default function Profile() {
  const navigate = useNavigate();
  const { openTokenExpiredModal } = useAuth();
  const [userInfo, setUserInfo] = useState({
    username: '',
    email: '',
    birthDate: '',
    isAdmin: false
  });

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('brainloop_token');
    if (!token) {
      navigate('/auth');
      return;
    }

    // Validate token with backend
    request('/auth/me')
      .catch(() => {
        // Token is invalid - modal will be shown by the request function
      });

    // Load user data from localStorage
    const username = localStorage.getItem('brainloop_user') || '';
    const email = localStorage.getItem('brainloop_email') || '';
    const birthDate = localStorage.getItem('brainloop_birth_date') || '';
    const isAdmin = localStorage.getItem('brainloop_is_admin') === 'true';

    setUserInfo({ username, email, birthDate, isAdmin });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 px-8 py-12 text-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <User className="w-12 h-12 text-purple-500" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {userInfo.username}
            </h2>
            {userInfo.isAdmin && (
              <div className="inline-flex items-center gap-2 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full font-semibold">
                <Shield className="w-5 h-5" />
                ADMIN
              </div>
            )}
          </div>

          {/* User Details */}
          <div className="px-8 py-8 space-y-6">
            <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-2xl">
              <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 font-medium">Username</p>
                <p className="text-lg text-gray-900 font-semibold">{userInfo.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl">
              <div className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 font-medium">Email</p>
                <p className="text-lg text-gray-900 font-semibold">{userInfo.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-pink-50 rounded-2xl">
              <div className="w-12 h-12 bg-pink-200 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-pink-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 font-medium">Birth Date</p>
                <p className="text-lg text-gray-900 font-semibold">
                  {userInfo.birthDate ? new Date(userInfo.birthDate).toLocaleDateString('en-GB') : 'N/A'}
                </p>
              </div>
            </div>

            {userInfo.isAdmin && (
              <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-2xl border-2 border-yellow-200">
                <div className="w-12 h-12 bg-yellow-200 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 font-medium">Role</p>
                  <p className="text-lg text-gray-900 font-semibold">Administrator</p>
                </div>
              </div>
            )}
          </div>

          {/* Back Button */}
          <div className="px-8 pb-8">
            <Button
              className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-6"
              onClick={() => navigate('/home')}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

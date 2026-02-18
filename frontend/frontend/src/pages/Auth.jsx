import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Brain, LogIn, UserPlus, ArrowLeft, KeyRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export default function Auth() {
  const [mode, setMode] = useState('login'); // login, signup, updatePassword
  const [form, setForm] = useState({ username: '', email: '', password: '', birthdate: '' });
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };
  
  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/\d/.test(password)) return 'Password must contain at least one digit';
    if (!/[@$!%*?&#]/.test(password)) return 'Password must contain at least one special character (@$!%*?&#)';
    return '';
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const usernameRegex = /^[A-Za-z0-9]+$/;

  const isValidBirthdate = (value) => {
    if (!value) return false;
    const d = new Date(value);
    const iso = d.toISOString?.().slice(0, 10);
    const notFuture = d <= new Date();
    return !Number.isNaN(d.getTime()) && iso === value && notFuture;
  };

  const isSignup = mode === 'signup';
  const isUpdatePassword = mode === 'updatePassword';

  const signupErrors = useMemo(() => {
    if (!isSignup) return {};
    return {
      username:
        form.username.trim() === ''
          ? 'Username is required'
          : usernameRegex.test(form.username)
            ? ''
            : 'Use only English letters and digits',
      email: emailRegex.test(form.email) ? '' : 'Enter a valid email',
      password: validatePassword(form.password),
      birthdate: isValidBirthdate(form.birthdate) ? '' : 'Enter a valid birthdate',
    };
  }, [form, isSignup]);

  const hasSignupErrors = isSignup && Object.values(signupErrors).some(Boolean);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors

      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 403) {
          setError(data.detail || 'Your password is weak. Please create a new one.');
          setMode('updatePassword');
          return; 
        }
        throw new Error(data.detail || 'Login failed');
      }

      authLogin(data);
      navigate('/home');

    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (hasSignupErrors) return;
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`${API_BASE_URL}/auth/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
          birthdate: form.birthdate,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || 'Signup failed');
      }

      setMode('login');
      setForm({ username: data.username, email: '', password: '', birthdate: '' });

    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdatePassword = async () => {
    setError('');
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (form.password === newPassword) {
      setError('New password must be different from the old password.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/update-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          old_password: form.password,
          new_password: newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to update password.');
      }
      
      authLogin(data);
      navigate('/home');

    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (isSignup) {
      handleSignup();
    } else if (isUpdatePassword) {
      handleUpdatePassword();
    } else {
      handleLogin();
    }
  };

  const renderContent = () => {
    if (isUpdatePassword) {
      return (
        <>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Update Your Password</h2>
          <p className="text-gray-600 mb-8">
            Your current password is weak. Please set a new, strong password to secure your account.
          </p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={form.username} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter a strong new password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirm New Password</Label>
              <Input
                id="confirm-new-password"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirm your new password"
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-2xl"
            >
              <KeyRound className="w-5 h-5 mr-2" />
              Update Password and Login
            </Button>
          </form>
        </>
      );
    }

    return (
      <>
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant={mode === 'login' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setMode('login')}
          >
            <LogIn className="w-4 h-4 mr-2" /> Login
          </Button>
          <Button
            variant={mode === 'signup' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setMode('signup')}
          >
            <UserPlus className="w-4 h-4 mr-2" /> Sign Up
          </Button>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {isSignup ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="text-gray-600 mb-8">
          {isSignup
            ? 'Join BrainLoop to practice topics tailored to you.'
            : 'Log in to continue your practice journey.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={form.username}
              onChange={handleChange('username')}
              placeholder={isSignup ? "brainy-dev" : "your-username"}
              required
            />
            {isSignup && signupErrors.username && (
              <p className="text-sm text-red-600">{signupErrors.username}</p>
            )}
          </div>
          
          {isSignup && (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                placeholder="you@example.com"
                required
              />
              {signupErrors.email && (
                <p className="text-sm text-red-600">{signupErrors.email}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              placeholder={isSignup ? "Enter a strong password" : "••••••••"}
              required
            />
            {isSignup && signupErrors.password && (
              <p className="text-sm text-red-600">{signupErrors.password}</p>
            )}
          </div>

          {isSignup && (
            <div className="space-y-2">
              <Label htmlFor="birthdate">Birthdate</Label>
              <Input
                id="birthdate"
                type="date"
                value={form.birthdate}
                onChange={handleChange('birthdate')}
                required
              />
              {signupErrors.birthdate && (
                <p className="text-sm text-red-600">{signupErrors.birthdate}</p>
              )}
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            type="submit"
            disabled={loading || (isSignup ? hasSignupErrors : !form.username || !form.password)}
            className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-2xl shadow-lg"
          >
            {loading ? 'Please wait...' : isSignup ? 'Sign Up' : 'Login'}
          </Button>
        </form>

        {!isSignup && (
          <p className="text-sm text-gray-600 mt-4 text-center">
            New here?{' '}
            <button
              type="button"
              onClick={() => setMode('signup')}
              className="text-purple-600 font-semibold"
            >
              Create an account
            </button>
          </p>
        )}
      </>
    );
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center px-4 py-10">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl shadow-purple-200/50 p-8 border border-white/20">
          <div className="flex items-center gap-3 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/home')}
              className="rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                BrainLoop
              </h1>
            </div>
          </div>
          {renderContent()}
        </div>
        <div className="bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 rounded-3xl p-[1px] shadow-2xl shadow-purple-300/40 hidden lg:block">
          <div className="bg-white/90 rounded-3xl h-full p-8 flex flex-col justify-between border border-white/40">
            <div>
              <p className="text-sm font-semibold text-purple-700 mb-3">Why join</p>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Personalized practice that sticks</h3>
              <ul className="space-y-3 text-gray-700">
                <li>• Pick topics and question styles you care about.</li>
                <li>• Track streaks and progress across quizzes.</li>
                <li>• Learn faster with focused practice and feedback.</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl p-6 border border-white/70">
              <p className="text-lg font-semibold text-gray-900 mb-1">Ready to loop in?</p>
              <p className="text-gray-700">Sign up and we will remember your name and picks.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

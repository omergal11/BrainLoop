import { Brain, BarChart3, Home, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header({ streak, isLoggedIn, isAdmin, navigate }) {
  const handleLogout = () => {
    localStorage.removeItem('brainloop_token');
    localStorage.removeItem('brainloop_user');
    localStorage.removeItem('brainloop_is_admin');
    navigate('/auth');
    window.location.reload();
  };

  return (
    <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-purple-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/home')}>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              BrainLoop
            </h1>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-4">
            {/* Streak Display - only when logged in */}
            {isLoggedIn && streak > 0 && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-orange-100 to-red-100 rounded-full border border-orange-200">
                <span className="text-lg">🔥</span>
                <span className="font-bold text-orange-600">{streak}</span>
              </div>
            )}

            {/* Statistics - only when logged in */}
            {isLoggedIn && (
              <Button
                variant="ghost"
                size="icon"
                title="Statistics"
                onClick={() => navigate('/stats')}
              >
                <BarChart3 className="h-5 w-5" />
              </Button>
            )}

            {/* Admin Stats - only for admins */}
            {isLoggedIn && isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                title="Admin Stats"
                onClick={() => navigate('/admin/stats')}
              >
                <BarChart3 className="h-5 w-5 text-red-500" />
              </Button>
            )}

            {/* Home */}
            <Button
              variant="ghost"
              size="icon"
              title="Home"
              onClick={() => navigate('/home')}
            >
              <Home className="h-5 w-5" />
            </Button>

            {/* Profile / Login */}
            <Button
              variant="ghost"
              size="icon"
              title={isLoggedIn ? 'Profile' : 'Login'}
              onClick={() => navigate(isLoggedIn ? '/profile' : '/auth')}
            >
              <User className="h-5 w-5" />
            </Button>

            {/* Logout - only when logged in */}
            {isLoggedIn && (
              <Button
                variant="ghost"
                size="icon"
                title="Logout"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 text-red-500" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
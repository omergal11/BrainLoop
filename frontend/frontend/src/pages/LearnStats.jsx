import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, Target, Zap, Flame, Clock, BookOpen, ArrowLeft, RefreshCw } from 'lucide-react';
import { request } from '@/api/client';

export default function LearnStats() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    const token = localStorage.getItem('brainloop_token');
    if (!token) {
      navigate('/auth');
      return;
    }

    try {
      setLoading(true);
      console.log('📊 Fetching user stats...');
      const data = await request('/stats/user');
      console.log('✅ Stats fetched:', data);
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching stats:', err);
      setError(err.message || 'Error loading stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [navigate]);

  // Refresh stats when user navigates back from quiz
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchStats();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <Brain className="w-12 h-12 text-purple-500 mx-auto" />
          </div>
          <p className="text-gray-600 text-lg">Loading your stats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/home')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
            <p className="text-red-600 font-semibold">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Page Title */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Learning Statistics</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          disabled={loading}
          className="mb-4"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Questions */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Questions</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_questions}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Correct Answers */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Correct Answers</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.correct_answers}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Success Rate</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{stats.success_rate}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Longest Streak */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Longest Streak</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.best_streak}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Flame className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Last Session & Best Session */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-cyan-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Session Performance</h3>
            </div>
            <div className="space-y-4">
              {/* Last Session */}
              {stats.last_session ? (
                <div className="p-4 bg-cyan-50 rounded-xl border-l-4 border-cyan-600">
                  <p className="text-sm text-gray-600 font-medium">Last Session</p>
                  <p className="text-sm text-gray-500 mt-1">{stats.last_session.start_time ? new Date(stats.last_session.start_time).toLocaleDateString() : 'N/A'}</p>
                  <div className="mt-3">
                    <span className="text-sm text-gray-600">Questions: <span className="font-bold text-cyan-600">{stats.last_session.questions_solved || 0}</span> answered</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic p-4">No sessions yet</p>
              )}

              {/* Best Session */}
              {stats.best_session ? (
                <div className="p-4 bg-green-50 rounded-xl border-l-4 border-green-600">
                  <p className="text-sm text-gray-600 font-medium">Best Session</p>
                  <p className="text-sm text-gray-500 mt-1">{stats.best_session.start_time ? new Date(stats.best_session.start_time).toLocaleDateString() : 'N/A'}</p>
                  <div className="mt-3">
                    <span className="text-sm text-gray-600">Questions: <span className="font-bold text-green-600">{stats.best_session.questions_solved || 0}</span> answered</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic p-4">No sessions yet</p>
              )}
            </div>
          </div>

          {/* Topic Performance */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Topic Performance</h3>
            </div>
            <div className="space-y-3">
              {stats.strongest_topic ? (
                <div className="p-4 bg-green-50 rounded-xl border-l-4 border-green-600">
                  <p className="text-sm text-gray-600 font-medium">Strongest Topic</p>
                  <p className="text-lg font-bold text-green-600 mt-1">
                    {typeof stats.strongest_topic === 'object' ? stats.strongest_topic.name : stats.strongest_topic}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Success Rate: {typeof stats.strongest_topic === 'object' ? stats.strongest_topic.accuracy : 0}%
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 italic">No data yet</p>
              )}
              {stats.weakest_topic ? (
                <div className="p-4 bg-red-50 rounded-xl border-l-4 border-red-600">
                  <p className="text-sm text-gray-600 font-medium">Weakest Topic</p>
                  <p className="text-lg font-bold text-red-600 mt-1">
                    {typeof stats.weakest_topic === 'object' ? stats.weakest_topic.name : stats.weakest_topic}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Success Rate: {typeof stats.weakest_topic === 'object' ? stats.weakest_topic.accuracy : 0}%
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 italic">No data yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Topic Stats */}
        {Object.keys(stats.topic_stats).length > 0 && (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">All Topics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stats.topic_stats).map(([topicId, statsData]) => {
                const successRate = statsData.total > 0 ? Math.round((statsData.correct / statsData.total) * 100) : 0;
                return (
                  <div key={topicId} className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-white/20">
                    <p className="font-semibold text-gray-900">{statsData.name}</p>
                    <div className="mt-3">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="text-sm font-bold text-purple-600">{successRate}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                          style={{ width: `${successRate}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">{statsData.correct} of {statsData.total} correct</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8 flex justify-center">
          <Button
            className="rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold px-8 py-6"
            onClick={() => navigate('/home')}
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}

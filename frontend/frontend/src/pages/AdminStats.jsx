import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Brain,
  ShieldCheck,
  Award,
  Flame,
  BarChart3,
  TrendingDown,
  TimerReset,
  ArrowLeft,
} from 'lucide-react';
import { request } from '@/api/client';

export default function AdminStats() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const isAdmin = localStorage.getItem('brainloop_is_admin') === 'true';

    if (!isAdmin) {
      navigate('/home');
      return;
    }

    const fetchData = async () => {
      const startTime = performance.now();
      try {
        const payload = await request('/admin/stats/overview');
        const endTime = performance.now();
        const loadTime = (endTime - startTime).toFixed(2);
        console.log(`✅ Admin stats loaded in ${loadTime}ms`);
        setData(payload);
      } catch (err) {
        console.error('Error fetching admin stats:', err);
        setError(err.message || 'Failed to load admin statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <Brain className="w-12 h-12 text-amber-500 mx-auto" />
          </div>
          <p className="text-gray-600 text-lg">Loading admin insights...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-purple-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button variant="ghost" onClick={() => navigate('/home')} className="mb-4">
            Back to Home
          </Button>
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
            <p className="text-red-600 font-semibold">{error || 'Failed to load data'}</p>
          </div>
        </div>
      </div>
    );
  }

  const Section = ({ title, icon: Icon, children }) => (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
          <Icon className="w-6 h-6 text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );

  const StatList = ({ items, emptyText, renderItem }) => (
    <div className="space-y-3">
      {items && items.length > 0 ? items.map(renderItem) : (
        <p className="text-gray-500 italic">{emptyText}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-purple-50">
      {/* Page Title */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="w-8 h-8 text-amber-600" />
          <h2 className="text-2xl font-bold text-gray-900">Admin Insights</h2>
          <span className="text-sm font-semibold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">Admin only</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Average Session Duration</p>
              <p className="text-3xl font-bold text-amber-700 mt-2">{data.avg_session_duration_minutes} min</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <TimerReset className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Strongest Topic</p>
              <p className="text-xl font-bold text-green-700 mt-2">{data.strongest_overall_topic?.name || 'No data'}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Flame className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Weakest Topic</p>
              <p className="text-xl font-bold text-red-700 mt-2">{data.weakest_overall_topic?.name || 'No data'}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Longest Streak (All Time)</p>
              <p className="text-xl font-bold text-purple-700 mt-2">{data.user_longest_streak?.username || 'No data'}</p>
              <p className="text-sm text-gray-500 mt-1">{data.user_longest_streak?.streak_days || 0} days</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Flame className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Current Longest Streak</p>
              <p className="text-xl font-bold text-pink-700 mt-2">{data.user_current_longest_streak?.username || 'No data'}</p>
              <p className="text-sm text-gray-500 mt-1">{data.user_current_longest_streak?.streak_days || 0} days</p>
            </div>
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-pink-600" />
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Best Session Overall</p>
              <p className="text-xl font-bold text-green-700 mt-2">{data.best_session?.username || 'No data'}</p>
              <p className="text-sm text-gray-500 mt-1">
                {data.best_session?.questions_solved || 0} questions answered
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {data.best_session?.duration_minutes ? (() => {
                  const mins = Math.floor(data.best_session.duration_minutes);
                  const secs = Math.round((data.best_session.duration_minutes - mins) * 60);
                  return `${mins}m ${secs}s`;
                })() : '0m 0s'}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="Top Performing Students" icon={Award}>
            <StatList
              items={data.top_students}
              emptyText="No attempts yet"
              renderItem={(item, idx) => (
                <div key={idx} className="p-4 bg-amber-50 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">{item.username}</p>
                    <p className="text-sm text-gray-500">Attempts: {item.total_questions}</p>
                  </div>
                  <span className="text-lg font-bold text-amber-700">{item.success_rate}%</span>
                </div>
              )}
            />
          </Section>

          <Section title="Most Frequently Practiced Topics" icon={BarChart3}>
            <StatList
              items={data.most_practiced_topics}
              emptyText="No topic activity yet"
              renderItem={(item, idx) => (
                <div key={idx} className="p-4 bg-white rounded-xl border border-gray-100 flex justify-between items-center">
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <span className="text-sm text-gray-600">{item.answer_count} attempts</span>
                </div>
              )}
            />
          </Section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="Most Challenging Topics" icon={TrendingDown}>
            <StatList
              items={data.most_challenging_topics}
              emptyText="No challenge data yet"
              renderItem={(item, idx) => (
                <div key={idx} className="p-4 bg-red-50 rounded-xl border border-red-100 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">Attempts: {item.total}</p>
                  </div>
                  <span className="text-lg font-bold text-red-600">{item.success_rate}%</span>
                </div>
              )}
            />
          </Section>

          <Section title="Topics with Highest Proficiency" icon={Flame}>
            <StatList
              items={data.highest_proficiency_topics}
              emptyText="No proficiency data yet"
              renderItem={(item, idx) => (
                <div key={idx} className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">Attempts: {item.total}</p>
                  </div>
                  <span className="text-lg font-bold text-indigo-700">{item.success_rate}%</span>
                </div>
              )}
            />
          </Section>
        </div>

        <div className="flex justify-center pt-4">
          <Button className="rounded-xl bg-gradient-to-r from-amber-500 to-purple-500 text-white px-8 py-6 hover:from-amber-600 hover:to-purple-600"
            onClick={() => navigate('/home')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}

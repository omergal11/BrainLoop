import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Brain, Database, Cpu, Code2, Network, Layers
} from 'lucide-react';

import TopicCard from '@/components/TopicCard';
import QuestionTypeCard from '@/components/QuestionTypeCard';
import Logo from '@/components/Logo';
import { getTopicsByType, getUser, request } from '@/api/client';
import { useAuth } from '@/context/AuthContext';

// -------------------- Static Data --------------------

const topicCatalog = [
  { id: 'data-structures', name: 'Data Structures', icon: Layers, color: 'from-purple-400 to-purple-600' },
  { id: 'algorithms', name: 'Algorithms', icon: Brain, color: 'from-blue-400 to-blue-600' },
  { id: 'oop', name: 'Object-Oriented Programming', icon: Code2, color: 'from-pink-400 to-pink-600' },
  { id: 'databases', name: 'Databases', icon: Database, color: 'from-green-400 to-green-600' },
  { id: 'os', name: 'Operating Systems', icon: Cpu, color: 'from-orange-400 to-orange-600' },
  { id: 'networks', name: 'Computer Networks', icon: Network, color: 'from-cyan-400 to-cyan-600' },
];

const questionTypes = [
  { id: 'code', name: 'Code Questions', icon: '💻', description: 'Analyze and debug' },
  { id: 'multiple-choice', name: 'Multiple Choice', icon: '🧠', description: 'Test your knowledge' },
];

// ------------------------ Component ------------------------

export default function Home() {
  const [username, setUsername] = useState('User');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [selectedQuestionType, setSelectedQuestionType] = useState(null);
  const [availableTopics, setAvailableTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [topicsError, setTopicsError] = useState('');
  const navigate = useNavigate();
  const { openTokenExpiredModal } = useAuth();
  
  // Get userId from localStorage
  const userId = parseInt(localStorage.getItem('brainloop_user_id')) || null;
  const isLoggedIn = !!localStorage.getItem('brainloop_token');

  // -------------------- Validate token on mount --------------------
  useEffect(() => {
    if (isLoggedIn) {
      request('/auth/me')
        .catch(() => {
          // Token is invalid - modal will be shown by the request function
        });
    }
  }, []);

  // -------------------- Load user --------------------
  useEffect(() => {
    const storedUsername = localStorage.getItem('brainloop_user');
    if (storedUsername) setUsername(storedUsername);

    if (userId) {
      getUser(userId)
        .then((data) => data.username && setUsername(data.username))
        .catch(() => {});
    }
  }, [userId]);

  // -------------------- Topic Handling --------------------
  const toggleTopic = (topicId) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]
    );
  };

  const handleSelectType = (typeId) => {
    setSelectedQuestionType(typeId);
    setSelectedTopics([]);
  };

  useEffect(() => {
    if (!selectedQuestionType) {
      setAvailableTopics([]);
      return;
    }

    setLoadingTopics(true);
    setTopicsError('');

    getTopicsByType(selectedQuestionType)
      .then((topics) => setAvailableTopics(topics || []))
      .catch((err) => setTopicsError(err.message || 'Failed to load topics'))
      .finally(() => setLoadingTopics(false));
  }, [selectedQuestionType]);

  // -------------------- Start Practice --------------------
  const handleStartPractice = async () => {
    if (!selectedTopics.length || !selectedQuestionType) return;

    localStorage.setItem('brainloop_topics', JSON.stringify(selectedTopics));
    localStorage.setItem('brainloop_question_type', selectedQuestionType);

    navigate('/quiz');
  };

  // -------------------- Topic Display Formatting --------------------
  const displayTopics =
    selectedQuestionType && availableTopics.length
      ? availableTopics.map((t) => {
          const id = String(t.topic_id || t.id);
          const catalog = topicCatalog.find((c) => c.id === id);
          return {
            id,
            name: t.name || catalog?.name || `Topic ${id}`,
            icon: catalog?.icon || Layers,
            color: catalog?.color || 'from-slate-300 to-slate-400',
          };
        })
      : [];

  // ------------------------------ JSX ------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full mx-auto px-4 py-12 flex flex-col items-center">
        {/* If not logged in, show logo, description, and login/register */}
        {!isLoggedIn ? (
          <>
            <div className="mb-8">
              <Logo size={100} />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">Welcome to BrainLoop!</h1>
            <p className="text-lg text-gray-700 mb-8 text-center">
              The smart app for learning, practicing, and improving your computer science knowledge.<br />
              In BrainLoop you can solve code questions, multiple choice questions, track your progress, and maintain a daily streak.
            </p>
            <Button
              onClick={() => navigate('/auth')}
              className="px-8 py-4 text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-2xl shadow-xl"
            >
              Login / Register
            </Button>
          </>
        ) : (
          <>
            <div className="mb-4 flex flex-col items-center">
              <Logo size={70} />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-12 text-center">
              Hello, {username}! <span role="img" aria-label="rocket">🚀</span>
            </h1>
          </>
        )}
        {/* If logged in, show practice options below greeting */}
        {isLoggedIn && (
          <div className="w-full mt-2">
            {/* Question Types */}
            <div className="mb-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Choose Question Type</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {questionTypes.map((type) => (
                  <QuestionTypeCard
                    key={type.id}
                    type={type}
                    isSelected={selectedQuestionType === type.id}
                    onSelect={() => handleSelectType(type.id)}
                  />
                ))}
              </div>
            </div>
            {/* Topics */}
            <div className="mb-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                {selectedQuestionType ? 'Select Topics for this type' : 'Select Topics'}
              </h3>
              {!selectedQuestionType ? (
                <p className="text-gray-600">Please choose a question type first.</p>
              ) : loadingTopics ? (
                <p className="text-gray-600">Loading topics...</p>
              ) : topicsError ? (
                <p className="text-red-600">{topicsError}</p>
              ) : displayTopics.length === 0 ? (
                <p className="text-gray-600">No topics available for this question type.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayTopics.map((topic) => (
                    <TopicCard
                      key={topic.id}
                      topic={topic}
                      isSelected={selectedTopics.includes(topic.id)}
                      onToggle={() => toggleTopic(topic.id)}
                    />
                  ))}
                </div>
              )}
            </div>
            {/* Start Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleStartPractice}
                disabled={!selectedTopics.length || !selectedQuestionType}
                className="px-12 py-6 text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-2xl shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Practice 🚀
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
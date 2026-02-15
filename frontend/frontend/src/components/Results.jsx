import React from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, Target, ArrowRight, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Results({ 
  score, 
  totalQuestions, 
  topicStats, // Object: { [topicName]: { correct: number, total: number } }
  onRetry 
}) {
  const navigate = useNavigate();
  const percentage = Math.round((score / totalQuestions) * 100);

  // Determine message and emoji based on score
  let emoji = '🎉';
  let message = 'Great job!';
  
  if (percentage === 100) {
    emoji = '🏆';
    message = 'Perfect score!';
  } else if (percentage >= 80) {
    emoji = '🌟';
    message = 'Excellent work!';
  } else if (percentage >= 60) {
    emoji = '👍';
    message = 'Good effort!';
  } else {
    emoji = '💪';
    message = 'Keep practicing!';
  }

  // Calculate success rate per topic and sort them
  const sortedTopics = Object.entries(topicStats)
    .map(([topic, stats]) => ({
      topic,
      successRate: stats.correct / stats.total,
      ...stats
    }))
    .sort((a, b) => a.successRate - b.successRate);

  // Get bottom 2 topics (even if they have good scores, just the lowest ones)
  // But usually we only want to recommend if they are not perfect?
  // User asked for "2 least good". If I have 100%, 100%, 100% -> it will pick 2 random ones.
  // Let's assume we want the lowest 2.
  const recommendedTopics = sortedTopics
    .slice(0, 2)
    .map(t => t.topic);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl shadow-purple-200/50 p-8 sm:p-12 text-center border border-white/20">
          
          {/* Header Score Section */}
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-purple-300/50">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">{message}</h2>
            <p className="text-6xl mb-6 animate-bounce">{emoji}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl p-8 mb-8">
            <div className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              {score}/{totalQuestions}
            </div>
            <p className="text-gray-600 text-lg font-medium">Questions Correct</p>
            <div className="mt-4">
              <div className="text-3xl font-bold text-purple-600">{percentage}%</div>
            </div>
          </div>

          {/* Topic Breakdown */}
          {Object.keys(topicStats).length > 0 && (
            <div className="mb-8 text-left">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                Topic Breakdown
              </h3>
              <div className="space-y-3">
                {Object.entries(topicStats).map(([topic, stats]) => {
                  const topicPercentage = Math.round((stats.correct / stats.total) * 100);
                  return (
                    <div key={topic} className="bg-white/50 rounded-lg p-3 flex items-center justify-between">
                      <span className="font-medium text-gray-700">{topic}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${topicPercentage >= 70 ? 'bg-green-500' : topicPercentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${topicPercentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-600 w-8 text-right">{topicPercentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommendedTopics.length > 0 && (
            <div className="mb-8 bg-blue-50 border border-blue-100 rounded-xl p-4 text-left">
              <h4 className="font-semibold text-blue-800 mb-2">💡 Recommended Practice:</h4>
              <p className="text-blue-700 text-sm">
                Based on your results, you might want to review:
                <span className="font-bold ml-1">{recommendedTopics.join(', ')}</span>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={onRetry}
              className="px-8 py-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-300/50 transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Try Again
            </Button>
            <Button
              onClick={() => navigate('/stats')}
              className="px-8 py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-green-300/50 transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              📊 View Your Stats
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => navigate('/home')}
              variant="outline"
              className="px-8 py-6 border-2 border-purple-300 hover:bg-purple-50 font-semibold rounded-xl transition-all duration-300 flex items-center gap-2"
            >
              Back to Home
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


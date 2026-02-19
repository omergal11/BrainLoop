import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target } from 'lucide-react';
import MultipleChoiceQuestion from '@/components/MultipleChoiceQuestion';
import CodeQuestion from '@/components/CodeQuestion';
import FillInQuestion from '@/components/FillInQuestion';
import Results from '@/components/Results';
import { getRandomQuestions, submitAnswer, getTopicsByType, completeSession, request } from '@/api/client';
import { useAuth } from '@/context/AuthContext';

const extractCode = (text = '') => {
  // Priority 1: Question mark - everything after ? is code
  const questionMarkIdx = text.indexOf('?');
  if (questionMarkIdx !== -1) {
    const prompt = text.slice(0, questionMarkIdx + 1).trim();
    const code = text.slice(questionMarkIdx + 1).trim();
    if (code) {
      return { prompt, code };
    }
  }

  // 2) fenced blocks ```
  const fenceMatch = text.match(/```[a-zA-Z0-9]*\n?([\s\S]*?)```/);
  if (fenceMatch) {
    const code = fenceMatch[1].trimEnd();
    const prompt = text.replace(fenceMatch[0], '').trim();
    return { prompt, code };
  }

  // 3) blank line separation
  const parts = text.split(/\n\s*\n/);
  if (parts.length > 1) {
    const prompt = parts[0].trim();
    const code = parts.slice(1).join('\n').trim();
    return { prompt, code };
  }

  // 4) newline-based: first line prompt, rest code
  const lines = text.split('\n');
  if (lines.length > 1) {
    const prompt = lines[0].trim();
    const code = lines.slice(1).join('\n').trim();
    return { prompt, code };
  }

  return { prompt: text, code: '' };
};

// Extract imports from code block
const extractImportsFromCode = (code = '') => {
  if (!code) return { imports: '', codeOnly: '' };
  
  const lines = code.split('\n');
  const importLines = [];
  let codeStartIdx = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Check if line is an import statement
    const isImport = /^(import\s|from\s|#include\s|#define\s|using\s)/i.test(line);
    
    if (isImport) {
      importLines.push(lines[i]);
    } else if (importLines.length > 0) {
      // Found first non-import line after imports
      codeStartIdx = i;
      break;
    } else {
      // No imports, code starts here
      codeStartIdx = i;
      break;
    }
  }
  
  const imports = importLines.join('\n');
  const codeOnly = lines.slice(codeStartIdx).join('\n').trim();
  
  return { imports, codeOnly };
};

export default function Quiz() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0); // Count correct answers
  const [showResults, setShowResults] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [topicStats, setTopicStats] = useState({}); 
  const [topicMap, setTopicMap] = useState({}); // Stores id -> name mapping
  const [sessionStartTime, setSessionStartTime] = useState(null); // Track session start time
  const navigate = useNavigate();
  const { openTokenExpiredModal } = useAuth();
  const hasInitialized = useRef(false); // Prevent duplicate initializations
  
  const storedUserId = 194; // For development

  // Validate token on mount
  useEffect(() => {
    request('/auth/me')
      .catch(() => {
        // Token is invalid - modal will be shown by the request function
      });
  }, []);

  // Helper function to fetch with token
  const fetchWithToken = async (url, options = {}) => {
    const token = localStorage.getItem('brainloop_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };
    return fetch(url, { ...options, headers });
  };

  useEffect(() => {
    // Guard: prevent multiple initializations
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;

    const topics = JSON.parse(localStorage.getItem('brainloop_topics') || '[]');
    const questionType = localStorage.getItem('brainloop_question_type');
    const storedUserId = localStorage.getItem('brainloop_user_id');

    if (topics.length === 0 || !questionType) {
      navigate('/home');
      return;
    }

    // Map UI type to backend type
    const backendType = questionType === 'multiple-choice' ? 'choose' : questionType;

    setLoading(true);
    setLoadError('');

    // Fetch topics to get names
    getTopicsByType(questionType)
      .then((allTopics) => {
        const mapping = {};
        allTopics.forEach(t => {
            mapping[t.topic_id] = t.name;
        });
        setTopicMap(mapping);
        setSessionStartTime(new Date()); // Record session start time
        return getRandomQuestions(backendType, topics, 10);
      })
      .then((res) => {
        const normalized = (res || []).map((q) => {
          const letters = ['A', 'B', 'C', 'D'];
          const optionTexts = [q.option_a, q.option_b, q.option_c, q.option_d];
          const options = optionTexts
            .map((text, idx) => ({ value: letters[idx], label: text }))
            .filter((o) => !!o.label);

          const correctLetter = (q.correct_answer || '').trim().toUpperCase();
          const correctLabel = options.find((o) => o.value === correctLetter)?.label || q.correct_answer;

          // Use backend-provided code and imports if available, otherwise fall back to frontend extraction
          let prompt, code, code_imports;
          if (q.type === 'code') {
            // Backend provides code and code_imports now
            if (q.code !== undefined) {
              code = q.code || '';
              code_imports = q.code_imports || '';
              // question_text might contain both question + code, we need just the question part
              const { prompt: extractedPrompt } = extractCode(q.question_text || '');
              prompt = extractedPrompt || q.question_text;
            } else {
              // Fallback to frontend extraction if backend didn't provide code fields
              const extracted = extractCode(q.question_text || '');
              prompt = extracted.prompt || q.question_text;
              code = extracted.code || '';
              code_imports = '';
            }
            
            // Further extract imports from code (in case they're embedded in the code block)
            if (code && !code_imports) {
              const { imports, codeOnly } = extractImportsFromCode(code);
              code_imports = imports;
              code = codeOnly;
            }
          } else {
            prompt = q.question_text;
            code = '';
            code_imports = '';
          }

          const effectiveType =
            q.type === 'choose' || options.length > 0 ? 'multiple-choice' : q.type;

          return {
            id: q.q_id,
            type: effectiveType,
            question: prompt || q.question_text,
            code,
            code_imports,
            options,
            correctAnswer: correctLetter || correctLabel,
            correctAnswerLabel: correctLabel,
            topicId: q.topic_id,
          };
        });

        setQuestions(normalized.slice(0, 10));
      })
      .catch((err) => setLoadError(err.message || 'Failed to load questions'))
      .finally(() => setLoading(false));
  }, []);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleCheckAnswer = async () => {
  if (submitting) return;
  setSubmitting(true);

  const fallbackCorrect =
    (userAnswer || '').toLowerCase().trim() ===
    (currentQuestion.correctAnswer || '').toLowerCase().trim();

  let correct = false;
  try {
    const res = await submitAnswer(currentQuestion.id, userAnswer);
    correct = !!res?.is_correct;
    setIsCorrect(correct);
    setShowFeedback(true);
    if (correct) {
      setScore((s) => s + 1);
      setCorrectAnswersCount((c) => c + 1); // Increment correct count
    }
  } catch (err) {
    correct = fallbackCorrect;
    setIsCorrect(fallbackCorrect);
    setShowFeedback(true);
    if (fallbackCorrect) {
      setScore((s) => s + 1);
      setCorrectAnswersCount((c) => c + 1); // Increment correct count
    }
  } finally {
    const topicId = currentQuestion.topicId;
    const topicName = topicMap[topicId] || `Topic ${topicId}`; 

    setTopicStats(prev => {
      const currentStats = prev[topicName] || { correct: 0, total: 0 };
      return {
        ...prev,
        [topicName]: {
          correct: currentStats.correct + (correct ? 1 : 0),
          total: currentStats.total + 1
        }
      };
    });

    setSubmitting(false);
  }
};

  const handleNext = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswer('');
      setShowFeedback(false);
      setIsCorrect(false);
    } else {
      // Session completed - update streak and end learning session
      try {
        const endTime = new Date();
        const result = await completeSession(correctAnswersCount, endTime.toISOString(), sessionStartTime.toISOString());
      } catch (err) {
        console.error('❌ Failed to complete session:', err);
      }
      setShowResults(true);
    }
  };

  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setShowFeedback(false);
    setIsCorrect(false);
    setScore(0);
    setTopicStats({}); 
    setShowResults(false);
  };

  const handleSkipToEnd = async () => {
    // Mark all remaining questions (including current if not answered) as incorrect
    const startIndex = showFeedback ? currentQuestionIndex + 1 : currentQuestionIndex;
    const remainingQuestions = questions.slice(startIndex);
    
    // Update topicStats for all remaining questions as incorrect
    const updatedStats = { ...topicStats };
    remainingQuestions.forEach((q) => {
      const topicName = topicMap[q.topicId] || `Topic ${q.topicId}`;
      if (!updatedStats[topicName]) {
        updatedStats[topicName] = { correct: 0, total: 0 };
      }
      updatedStats[topicName].total += 1;
      // correct stays the same (marking as wrong)
    });
    setTopicStats(updatedStats);

    // Complete the session
    try {
      const endTime = new Date();
      const result = await completeSession(correctAnswersCount, endTime.toISOString(), sessionStartTime.toISOString());
    } catch (err) {
      console.error('❌ Failed to complete session:', err);
    }
    
    setShowResults(true);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading questions...</div>;
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {loadError}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        No questions available for your selection.
      </div>
    );
  }

  if (showResults) {
    return (
      <Results 
        score={score} 
        totalQuestions={questions.length} 
        topicStats={topicStats} 
        onRetry={handleRetry} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Quiz Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Topic Title + Score */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Practice mode 🚀
          </h1>
          <p className="text-gray-600">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
          <div className="mt-2 flex items-center justify-center gap-2 text-sm text-gray-600">
            <Target className="w-4 h-4" />
            <span className="font-medium">{score} correct</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-3 bg-gray-200" />
        </div>

        {/* Question Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl shadow-purple-100/50 p-6 sm:p-8 mb-6 border border-white/20">
          {currentQuestion.type === 'multiple-choice' && (
            <MultipleChoiceQuestion
              question={currentQuestion}
              userAnswer={userAnswer}
              setUserAnswer={setUserAnswer}
              showFeedback={showFeedback}
            />
          )}
          {currentQuestion.type === 'code' && (
            <CodeQuestion
              question={currentQuestion}
              userAnswer={userAnswer}
              setUserAnswer={setUserAnswer}
              showFeedback={showFeedback}
            />
          )}
          {currentQuestion.type === 'fill-in' && (
            <FillInQuestion
              question={currentQuestion}
              userAnswer={userAnswer}
              setUserAnswer={setUserAnswer}
              showFeedback={showFeedback}
            />
          )}

          {/* Feedback */}
          {showFeedback && (
            <div
              className={`mt-6 p-4 rounded-xl flex items-center gap-3 ${
                isCorrect
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <span className="text-2xl">{isCorrect ? '✅' : '❌'}</span>
              <div>
                <p className={`font-semibold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                  {isCorrect ? 'Correct!' : 'Not quite right'}
                </p>
                {!isCorrect && (
                  <p className="text-sm text-gray-600 mt-1">
                    The correct answer is:{' '}
                    <span className="font-medium">
                      {currentQuestion.correctAnswerLabel || currentQuestion.correctAnswer}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {!showFeedback ? (
            <Button
              onClick={handleCheckAnswer}
              disabled={!userAnswer || submitting}
              className="px-8 py-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-300/50 disabled:opacity-50 transition-all duration-300 hover:scale-105"
            >
              {submitting ? 'Checking...' : 'Check Answer'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="px-8 py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-green-300/50 transition-all duration-300 hover:scale-105"
            >
              {currentQuestionIndex < questions.length - 1 ? 'Next Question →' : 'View Results 🎉'}
            </Button>
          )}
        </div>

        {/* Skip to End Button */}
        <div className="mt-6 flex justify-center">
          <Button
            variant="ghost"
            onClick={handleSkipToEnd}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ⏭️ Skip to End (mark remaining as wrong)
          </Button>
        </div>
      </div>
    </div>
  );
}

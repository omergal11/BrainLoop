import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Brain, ArrowLeft, Send, Sparkles } from 'lucide-react';
import { request } from '@/api/client';

export default function AskAI() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setError('');
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);

    try {
      const data = await request('/ai/ask', {
        method: 'POST',
        body: JSON.stringify({ question }),
      });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: data.answer, sources: data.sources || [] },
      ]);
    } catch (err) {
      setError(err.message || 'Something went wrong. Is Ollama running and has the index been built?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-[calc(100vh-88px)]">
        <Button variant="ghost" onClick={() => navigate('/home')} className="mb-4 self-start">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ask the Course</h1>
            <p className="text-gray-600 text-sm">
              Ask a question and get an answer grounded in our Questions &amp; Topics.
            </p>
          </div>
        </div>

        <div className="flex-1 bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-6 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {messages.length === 0 && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 py-12">
                <Brain className="w-10 h-10 text-purple-300 mb-3" />
                <p>Ask anything about the topics and questions in this course.</p>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-purple-50 border border-purple-100 text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{m.text}</p>
                  {m.role === 'assistant' && m.sources?.length > 0 && (
                    <p className="mt-2 text-xs text-gray-500">
                      Sources: {m.sources.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-purple-50 border border-purple-100 flex items-center gap-2">
                  <div className="animate-spin">
                    <Brain className="w-4 h-4 text-purple-500" />
                  </div>
                  <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-sm font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. What topics cover recursion?"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !input.trim()} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

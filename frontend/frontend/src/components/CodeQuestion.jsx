import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CodeQuestion({ question, userAnswer, setUserAnswer, showFeedback }) {
  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
        {question.question}
      </h2>

      <div className="bg-gray-900 rounded-xl p-4 sm:p-6 mb-6 overflow-x-auto">
        {question.code_imports && (
          <div className="text-gray-100 text-sm font-mono whitespace-pre mb-3">
            <code className="text-gray-400">{question.code_imports}</code>
          </div>
        )}
        <pre className="text-gray-100 text-sm font-mono whitespace-pre">
          <code>{question.code}</code>
        </pre>
      </div>

      <div className="space-y-2">
        <Label htmlFor="code-answer" className="text-gray-700 font-medium">
          Your Answer:
        </Label>
        <Input
          id="code-answer"
          type="text"
          placeholder="Enter the output..."
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          disabled={showFeedback}
          className="h-12 bg-white border-gray-300 focus:border-purple-400 focus:ring-purple-400/20 rounded-xl"
        />
      </div>
    </div>
  );
}
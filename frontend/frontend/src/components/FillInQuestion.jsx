import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function FillInQuestion({ question, userAnswer, setUserAnswer, showFeedback }) {
  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">
        {question.question}
      </h2>

      <div className="space-y-2">
        <Label htmlFor="fill-answer" className="text-gray-700 font-medium">
          Your Answer:
        </Label>
        <Input
          id="fill-answer"
          type="text"
          placeholder="Type your answer here..."
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          disabled={showFeedback}
          className="h-12 bg-white border-gray-300 focus:border-purple-400 focus:ring-purple-400/20 rounded-xl text-lg"
        />
      </div>
    </div>
  );
}
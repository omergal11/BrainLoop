import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function MultipleChoiceQuestion({
  question,
  userAnswer,
  setUserAnswer,
  showFeedback,
}) {
  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
        {question.question}
      </h2>

      {/* Code block if present */}
      {question.code && (
        <div className="bg-gray-900 rounded-xl p-4 sm:p-6 mb-6 overflow-x-auto">
          {question.code_imports && (
            <div className="text-gray-100 text-sm font-mono whitespace-pre mb-3">
              <code className="text-gray-400">{question.code_imports}</code>
            </div>
          )}
          <pre className="text-gray-100 text-sm font-mono whitespace-pre-wrap">
            <code>{question.code}</code>
          </pre>
        </div>
      )}

      <RadioGroup value={userAnswer} onValueChange={setUserAnswer} className="space-y-3">
        {question.options.map((option) => {
          const isSelected = userAnswer === option.value;
          const isCorrect = option.value === question.correctAnswer;
          const isWrongSelection = showFeedback && isSelected && !isCorrect;

          return (
          <div
              key={option.value}
            className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                isSelected
                ? 'border-purple-400 bg-purple-50'
                : 'border-gray-200 hover:border-purple-300 bg-white/50'
              } ${showFeedback && isCorrect ? 'border-green-400 bg-green-50' : ''} ${
                isWrongSelection ? 'border-red-400 bg-red-50' : ''
            }`}
          >
              <RadioGroupItem value={option.value} id={`option-${option.value}`} disabled={showFeedback} />
            <Label
                htmlFor={`option-${option.value}`}
              className="flex-1 cursor-pointer text-gray-900 font-medium"
            >
                {option.label}
            </Label>
          </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}
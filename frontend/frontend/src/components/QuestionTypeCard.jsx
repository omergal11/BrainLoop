import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

export default function QuestionTypeCard({ type, isSelected, onSelect }) {
  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
        isSelected
          ? 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-400 shadow-lg shadow-purple-200/50'
          : 'bg-white/60 border-gray-200 hover:border-purple-300 hover:shadow-md'
      }`}
    >
      {isSelected && (
        <div className="absolute top-3 right-3">
          <CheckCircle2 className="w-6 h-6 text-purple-600" />
        </div>
      )}

      <div className="text-4xl mb-3">{type.icon}</div>
      <h3 className="font-semibold text-gray-900 text-lg mb-1">{type.name}</h3>
      <p className="text-sm text-gray-600">{type.description}</p>
    </motion.button>
  );
}
import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export default function TopicCard({ topic, isSelected, onToggle }) {
  const Icon = topic.icon;

  return (
    <motion.button
      onClick={onToggle}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className={`relative p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
        isSelected
          ? 'bg-white border-purple-400 shadow-lg shadow-purple-200/50'
          : 'bg-white/60 border-gray-200 hover:border-purple-300 hover:shadow-md'
      }`}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-md">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${topic.color} shadow-lg`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>

      <h3 className="font-semibold text-gray-900 text-lg">{topic.name}</h3>
    </motion.button>
  );
}
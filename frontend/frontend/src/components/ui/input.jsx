import React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef(function Input(
  { className, type = 'text', ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
});

export default Input;

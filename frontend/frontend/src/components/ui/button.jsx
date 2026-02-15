import React from 'react';
import { cn } from '@/lib/utils';

const variants = {
  default:
    'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700',
  outline:
    'border-2 border-purple-300 text-gray-900 hover:bg-purple-50 bg-white',
  ghost: 'text-gray-900 hover:bg-gray-100',
};

const sizes = {
  default: 'px-4 py-2',
  icon: 'h-10 w-10 p-0',
};

export const Button = React.forwardRef(function Button(
  { className, variant = 'default', size = 'default', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant] || variants.default,
        sizes[size] || sizes.default,
        className
      )}
      {...props}
    />
  );
});

export default Button;

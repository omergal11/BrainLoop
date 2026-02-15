import React from 'react';
import { cn } from '@/lib/utils';

export function Progress({ value = 0, className }) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-full bg-gray-200',
        className
      )}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-purple-600 to-blue-600 transition-[width]"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export default Progress;

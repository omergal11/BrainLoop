import React, { createContext, useContext, useId } from 'react';
import { cn } from '@/lib/utils';

const RadioGroupContext = createContext(null);

export function RadioGroup({ value, onValueChange, children, className }) {
  const name = useId();

  return (
    <RadioGroupContext.Provider value={{ value, onValueChange, name }}>
      <div className={cn('space-y-2', className)}>{children}</div>
    </RadioGroupContext.Provider>
  );
}

export const RadioGroupItem = React.forwardRef(function RadioGroupItem(
  { value, disabled, id, className, ...props },
  ref
) {
  const context = useContext(RadioGroupContext);
  const inputId = id || `${context?.name}-${value}`;

  return (
    <input
      ref={ref}
      type="radio"
      id={inputId}
      name={context?.name}
      value={value}
      checked={context?.value === value}
      onChange={() => context?.onValueChange?.(value)}
      disabled={disabled}
      className={cn(
        'h-4 w-4 border border-gray-300 text-purple-600 focus:ring-purple-500',
        className
      )}
      {...props}
    />
  );
});

export default RadioGroup;

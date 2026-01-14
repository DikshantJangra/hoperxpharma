import React from 'react';

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ value = [0], onValueChange, min = 0, max = 100, step = 1, className = '', ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value);
      onValueChange?.([newValue]);
    };

    return (
      <input
        ref={ref}
        type="range"
        value={value[0]}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500 ${className}`}
        {...props}
      />
    );
  }
);

Slider.displayName = 'Slider';

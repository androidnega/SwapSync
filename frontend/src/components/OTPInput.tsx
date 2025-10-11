/**
 * OTP Input Component
 * Beautiful 4-digit OTP input with auto-focus and auto-submit
 */
import React, { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from 'react';

interface OTPInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  onComplete: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
}

const OTPInput: React.FC<OTPInputProps> = ({ 
  length, 
  value, 
  onChange, 
  onComplete,
  disabled = false,
  error = false
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    // Auto-focus first input on mount
    if (inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [disabled]);

  useEffect(() => {
    // Auto-complete when all digits filled
    if (value.length === length && !disabled) {
      onComplete(value);
    }
  }, [value, length, onComplete, disabled]);

  const handleChange = (index: number, inputValue: string) => {
    // Only allow digits
    const digit = inputValue.replace(/\D/g, '');
    if (!digit && inputValue !== '') return;

    const newValue = value.split('');
    newValue[index] = digit[digit.length - 1] || ''; // Take last digit
    const joinedValue = newValue.join('').slice(0, length);
    
    onChange(joinedValue);

    // Auto-focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // Move to previous input if current is empty
        inputRefs.current[index - 1]?.focus();
        setActiveIndex(index - 1);
        
        // Clear previous input
        const newValue = value.split('');
        newValue[index - 1] = '';
        onChange(newValue.join(''));
      } else {
        // Clear current input
        const newValue = value.split('');
        newValue[index] = '';
        onChange(newValue.join(''));
      }
      e.preventDefault();
    }

    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setActiveIndex(index - 1);
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    const newValue = pastedData.slice(0, length);
    onChange(newValue);
    
    // Focus last filled input or next empty
    const nextIndex = Math.min(newValue.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
    setActiveIndex(nextIndex);
  };

  const handleFocus = (index: number) => {
    setActiveIndex(index);
    // Select all text in the input
    inputRefs.current[index]?.select();
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          disabled={disabled}
          className={`
            w-12 h-12 text-2xl font-bold text-center
            border-2 rounded transition-all duration-200
            ${error
              ? 'border-red-500 bg-red-50 text-red-600 animate-shake'
              : activeIndex === index && !disabled
              ? 'border-blue-600 ring-2 ring-blue-200 bg-blue-50'
              : value[index]
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-gray-300 bg-white'
            }
            ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-50' : 'hover:border-blue-400'}
            focus:outline-none font-mono
          `}
        />
      ))}
    </div>
  );
};

export default OTPInput;


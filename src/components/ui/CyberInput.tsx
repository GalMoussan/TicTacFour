import React, { useState } from 'react';

interface CyberInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
  id?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const CyberInput: React.FC<CyberInputProps> = ({
  value,
  onChange,
  placeholder = '',
  disabled = false,
  maxLength,
  className = '',
  id,
  onKeyDown,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const isAtMaxLength = maxLength && value.length === maxLength;
  const counterColorClass = isAtMaxLength
    ? 'text-neon-cyan'
    : value.length > 0
    ? 'text-gray-400'
    : 'text-gray-500';

  return (
    <div className={className}>
      <div className="relative">
        <input
          type="text"
          id={id}
          value={value}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className={`
            glass
            font-mono
            w-full
            px-4
            py-2
            ${maxLength ? 'pr-12' : ''}
            rounded-lg
            border
            transition-all
            duration-300
            outline-none
            ${
              isFocused
                ? 'border-neon-cyan shadow-glow-cyan'
                : 'border-white border-opacity-10'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />

        {/* Scan line animation on focus */}
        {isFocused && (
          <div className="scanlines absolute inset-0 pointer-events-none rounded-lg" />
        )}
      </div>

      {/* Character counter - moved outside and below input */}
      {maxLength && (
        <p className={`text-right text-xs font-mono mt-1 transition-colors duration-300 ${counterColorClass}`}>
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
};

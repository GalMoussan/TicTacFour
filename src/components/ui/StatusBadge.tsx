import React from 'react';

interface StatusBadgeProps {
  children: React.ReactNode;
  color: 'cyan' | 'magenta' | 'green' | 'yellow' | 'red';
  pulse?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  children,
  color,
  pulse = false,
  className = '',
}) => {
  const colorClasses = {
    cyan: 'border-neon-cyan text-neon-cyan',
    magenta: 'border-neon-pink text-neon-pink',
    green: 'border-neon-green text-neon-green',
    yellow: 'border-yellow-400 text-yellow-400',
    red: 'border-red-400 text-red-400',
  };

  const pulseClass = pulse ? 'pulse' : '';

  return (
    <span
      className={`
        glass
        rounded-full
        px-3
        py-1
        font-body
        text-sm
        border
        ${colorClasses[color]}
        ${pulseClass}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

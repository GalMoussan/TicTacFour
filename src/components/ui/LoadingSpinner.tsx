import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'cyan' | 'magenta' | 'purple';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'cyan',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-3',
    lg: 'w-16 h-16 border-4',
  };

  const colorClasses = {
    cyan: 'border-neon-cyan',
    magenta: 'border-neon-pink',
    purple: 'border-neon-purple',
  };

  const glowClasses = {
    cyan: 'shadow-glow-cyan',
    magenta: 'shadow-glow-magenta',
    purple: 'shadow-glow-purple',
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${glowClasses[color]}
        rounded-full
        border-transparent
        ${colorClasses[color]}
        border-t-current
        animate-spin
        ${className}
      `}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

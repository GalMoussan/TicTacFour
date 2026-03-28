import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { RippleEffect } from './RippleEffect';

interface NeonButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  color?: 'cyan' | 'magenta' | 'purple';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * Get ripple color based on button color variant
 */
function getRippleColor(color: 'cyan' | 'magenta' | 'purple'): string {
  const colors = {
    cyan: 'rgba(0, 255, 245, 0.5)',
    magenta: 'rgba(255, 0, 255, 0.5)',
    purple: 'rgba(168, 85, 247, 0.5)',
  };
  return colors[color];
}

export const NeonButton: React.FC<NeonButtonProps> = ({
  children,
  onClick,
  color = 'cyan',
  disabled = false,
  className = '',
  type = 'button',
}) => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const borderClass = `neon-border-${color}`;

  /**
   * Handle button click with ripple effect
   */
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) onClick();

    // Get click position relative to button
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Add ripple
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x, y }]);

    // Remove ripple after animation completes
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative
        overflow-hidden
        glass
        ${borderClass}
        font-display
        text-base
        uppercase
        tracking-widest
        px-6
        py-3
        rounded-lg
        transition-all
        duration-300
        cursor-pointer
        ${
          disabled
            ? 'opacity-60 cursor-not-allowed'
            : 'hover:scale-105 active:scale-95'
        }
        ${className}
      `}
    >
      {/* Ripple effects */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <RippleEffect
            key={ripple.id}
            x={ripple.x}
            y={ripple.y}
            color={getRippleColor(color)}
          />
        ))}
      </AnimatePresence>

      {children}
    </button>
  );
};

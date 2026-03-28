import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'cyan' | 'magenta' | 'purple' | 'none';
  hover?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  glowColor = 'none',
  hover = false,
  ...rest
}) => {
  const glowClass = glowColor !== 'none' ? `glow-${glowColor}` : '';
  const hoverClass = hover ? 'glass-hover' : '';

  return (
    <div
      className={`glass rounded-2xl p-6 ${glowClass} ${hoverClass} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};

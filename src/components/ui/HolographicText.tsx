import React from 'react';

interface HolographicTextProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

export const HolographicText: React.FC<HolographicTextProps> = ({
  children,
  className = '',
  as: Component = 'h1',
}) => {
  return (
    <Component className={`holographic-text font-display font-bold ${className}`}>
      {children}
    </Component>
  );
};

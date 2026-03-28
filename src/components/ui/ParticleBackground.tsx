import React from 'react';

interface ParticleBackgroundProps {
  intensity?: 'low' | 'medium' | 'high';
}

export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  intensity = 'medium',
}) => {
  const intensityMap = {
    low: 0.3,
    medium: 0.5,
    high: 0.7,
  };

  const particleOpacity = intensityMap[intensity];

  return (
    <div className="fixed inset-0 -z-10">
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, var(--color-background-dark), var(--color-background-medium))',
        }}
      />

      {/* Particle background */}
      <div
        className="particle-bg"
        style={{ opacity: particleOpacity }}
      />

      {/* Scan lines */}
      <div className="scanlines absolute inset-0" style={{ opacity: 0.3 }} />
    </div>
  );
};

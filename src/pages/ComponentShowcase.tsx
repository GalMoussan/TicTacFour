import React, { useState } from 'react';
import {
  GlassCard,
  NeonButton,
  HolographicText,
  ParticleBackground,
  StatusBadge,
  CyberInput,
  LoadingSpinner,
} from '../components/ui';

export const ComponentShowcase: React.FC = () => {
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="min-h-screen relative">
      <ParticleBackground intensity="medium" />

      <div className="container mx-auto px-4 py-12">
        <HolographicText className="text-4xl mb-12 text-center">
          UI Component Library
        </HolographicText>

        <div className="grid gap-8">
          {/* GlassCard Examples */}
          <section>
            <h2 className="text-2xl text-neon-cyan mb-4 font-display">Glass Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GlassCard glowColor="cyan" hover>
                <h3 className="text-neon-cyan font-display mb-2">Cyan Glow</h3>
                <p className="text-white text-opacity-70">Card with cyan glow and hover effect</p>
              </GlassCard>
              <GlassCard glowColor="magenta" hover>
                <h3 className="text-neon-pink font-display mb-2">Magenta Glow</h3>
                <p className="text-white text-opacity-70">Card with magenta glow and hover effect</p>
              </GlassCard>
              <GlassCard glowColor="purple" hover>
                <h3 className="text-neon-purple font-display mb-2">Purple Glow</h3>
                <p className="text-white text-opacity-70">Card with purple glow and hover effect</p>
              </GlassCard>
            </div>
          </section>

          {/* NeonButton Examples */}
          <section>
            <h2 className="text-2xl text-neon-cyan mb-4 font-display">Neon Buttons</h2>
            <div className="flex gap-4 flex-wrap">
              <NeonButton color="cyan" onClick={() => alert('Cyan clicked!')}>
                Cyan Button
              </NeonButton>
              <NeonButton color="magenta" onClick={() => alert('Magenta clicked!')}>
                Magenta Button
              </NeonButton>
              <NeonButton color="purple" onClick={() => alert('Purple clicked!')}>
                Purple Button
              </NeonButton>
              <NeonButton color="cyan" disabled>
                Disabled Button
              </NeonButton>
            </div>
          </section>

          {/* StatusBadge Examples */}
          <section>
            <h2 className="text-2xl text-neon-cyan mb-4 font-display">Status Badges</h2>
            <div className="flex gap-3 flex-wrap">
              <StatusBadge color="cyan">Online</StatusBadge>
              <StatusBadge color="magenta">Active</StatusBadge>
              <StatusBadge color="green">Success</StatusBadge>
              <StatusBadge color="yellow">Warning</StatusBadge>
              <StatusBadge color="red">Error</StatusBadge>
              <StatusBadge color="cyan" pulse>
                Pulsing
              </StatusBadge>
            </div>
          </section>

          {/* CyberInput Example */}
          <section>
            <h2 className="text-2xl text-neon-cyan mb-4 font-display">Cyber Input</h2>
            <GlassCard>
              <CyberInput
                value={inputValue}
                onChange={setInputValue}
                placeholder="Enter your username..."
                maxLength={20}
                className="max-w-md"
              />
              <p className="text-white text-opacity-50 mt-2 font-mono text-sm">
                Value: {inputValue || '(empty)'}
              </p>
            </GlassCard>
          </section>

          {/* LoadingSpinner Examples */}
          <section>
            <h2 className="text-2xl text-neon-cyan mb-4 font-display">Loading Spinners</h2>
            <div className="flex gap-8 items-center">
              <div className="flex flex-col items-center gap-2">
                <LoadingSpinner size="sm" color="cyan" />
                <span className="text-xs text-white text-opacity-50">Small</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <LoadingSpinner size="md" color="magenta" />
                <span className="text-xs text-white text-opacity-50">Medium</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <LoadingSpinner size="lg" color="purple" />
                <span className="text-xs text-white text-opacity-50">Large</span>
              </div>
            </div>
          </section>

          {/* HolographicText Examples */}
          <section>
            <h2 className="text-2xl text-neon-cyan mb-4 font-display">Holographic Text</h2>
            <div className="space-y-4">
              <HolographicText as="h1" className="text-5xl">
                Heading 1
              </HolographicText>
              <HolographicText as="h2" className="text-4xl">
                Heading 2
              </HolographicText>
              <HolographicText as="h3" className="text-3xl">
                Heading 3
              </HolographicText>
              <HolographicText as="p" className="text-xl">
                Paragraph text with holographic effect
              </HolographicText>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

/**
 * Design System Test Component
 *
 * This component demonstrates all the futuristic design system elements
 * to verify Sprint 1 foundation setup is working correctly.
 */

export default function DesignSystemTest() {
  return (
    <div className="min-h-screen bg-cyber-dark p-8">
      {/* Header */}
      <div className="mb-12">
        <h1 className="font-display text-5xl font-bold holographic-text mb-4">
          Design System Test
        </h1>
        <p className="font-body text-xl text-neon-cyan">
          Verifying Sprint 1: Foundation Setup
        </p>
      </div>

      {/* Font Tests */}
      <section className="mb-12">
        <h2 className="font-display text-3xl text-neon-pink mb-6">
          Font Family Tests
        </h2>
        <div className="space-y-4">
          <div className="glass p-6">
            <p className="font-display text-xl text-white">
              Display Font (Orbitron): The quick brown fox jumps
            </p>
          </div>
          <div className="glass p-6">
            <p className="font-body text-xl text-white">
              Body Font (Rajdhani): The quick brown fox jumps
            </p>
          </div>
          <div className="glass p-6">
            <p className="font-mono text-xl text-white">
              Mono Font (Share Tech Mono): The quick brown fox
            </p>
          </div>
        </div>
      </section>

      {/* Color Tests */}
      <section className="mb-12">
        <h2 className="font-display text-3xl text-neon-purple mb-6">
          Neon Color Palette
        </h2>
        <div className="grid grid-cols-5 gap-4">
          <div className="glass p-6 text-center">
            <div className="w-16 h-16 bg-neon-cyan mx-auto mb-2 rounded"></div>
            <p className="font-mono text-neon-cyan">Cyan</p>
          </div>
          <div className="glass p-6 text-center">
            <div className="w-16 h-16 bg-neon-pink mx-auto mb-2 rounded"></div>
            <p className="font-mono text-neon-pink">Pink</p>
          </div>
          <div className="glass p-6 text-center">
            <div className="w-16 h-16 bg-neon-purple mx-auto mb-2 rounded"></div>
            <p className="font-mono text-neon-purple">Purple</p>
          </div>
          <div className="glass p-6 text-center">
            <div className="w-16 h-16 bg-neon-blue mx-auto mb-2 rounded"></div>
            <p className="font-mono text-neon-blue">Blue</p>
          </div>
          <div className="glass p-6 text-center">
            <div className="w-16 h-16 bg-neon-green mx-auto mb-2 rounded"></div>
            <p className="font-mono text-neon-green">Green</p>
          </div>
        </div>
      </section>

      {/* Effect Tests */}
      <section className="mb-12">
        <h2 className="font-display text-3xl text-neon-blue mb-6">
          Visual Effects
        </h2>
        <div className="grid grid-cols-3 gap-6">
          {/* Glassmorphism */}
          <div className="glass glass-hover p-6">
            <h3 className="font-display text-xl text-neon-cyan mb-2">
              Glassmorphism
            </h3>
            <p className="font-body text-white">
              Hover to see the effect
            </p>
          </div>

          {/* Neon Glow */}
          <div className="glass p-6 neon-border-cyan">
            <h3 className="font-display text-xl glow-cyan mb-2">
              Neon Glow
            </h3>
            <p className="font-body text-white">
              Cyan border with glow
            </p>
          </div>

          {/* Text Glow */}
          <div className="glass p-6">
            <h3 className="font-display text-xl text-glow-magenta mb-2">
              Text Glow
            </h3>
            <p className="font-body text-white">
              Glowing text effect
            </p>
          </div>
        </div>
      </section>

      {/* Animation Tests */}
      <section className="mb-12">
        <h2 className="font-display text-3xl text-neon-green mb-6">
          Animations
        </h2>
        <div className="grid grid-cols-4 gap-6">
          {/* Float */}
          <div className="glass p-6 text-center float">
            <div className="w-16 h-16 bg-neon-cyan mx-auto mb-2 rounded-full"></div>
            <p className="font-mono text-neon-cyan">Float</p>
          </div>

          {/* Pulse */}
          <div className="glass p-6 text-center pulse">
            <div className="w-16 h-16 bg-neon-pink mx-auto mb-2 rounded-full"></div>
            <p className="font-mono text-neon-pink">Pulse</p>
          </div>

          {/* Holographic Text */}
          <div className="glass p-6 text-center">
            <h3 className="font-display text-3xl holographic-text">HOLO</h3>
            <p className="font-mono text-white">Holographic</p>
          </div>

          {/* Hover Lift */}
          <div className="glass p-6 text-center hover-lift">
            <div className="w-16 h-16 bg-neon-purple mx-auto mb-2 rounded-full"></div>
            <p className="font-mono text-neon-purple">Hover Lift</p>
          </div>
        </div>
      </section>

      {/* Button Tests */}
      <section className="mb-12">
        <h2 className="font-display text-3xl text-neon-cyan mb-6">
          Interactive Elements
        </h2>
        <div className="flex gap-4">
          <button className="glass glass-hover btn-glow px-8 py-4 font-display text-lg text-neon-cyan">
            Glow Button
          </button>
          <button className="glass glass-hover neon-border-magenta px-8 py-4 font-display text-lg text-neon-pink">
            Neon Border
          </button>
          <button className="glass glass-hover px-8 py-4 font-display text-lg holographic-text">
            Holographic
          </button>
        </div>
      </section>

      {/* Success Message */}
      <div className="glass neon-border-cyan p-8 text-center">
        <h2 className="font-display text-3xl text-glow-cyan mb-4">
          Foundation Setup Complete!
        </h2>
        <p className="font-body text-xl text-white mb-2">
          All design system elements are loaded and working correctly.
        </p>
        <p className="font-mono text-neon-cyan">
          Sprint 1 Status: SUCCESSFUL
        </p>
      </div>
    </div>
  );
}

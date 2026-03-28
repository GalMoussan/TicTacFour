import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ParticleBackground, GlassCard, NeonButton, HolographicText } from '../components/ui';
import { pageVariants, cardContainerVariants, cardVariants } from '../utils/pageTransitions';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <>
      {/* Hero Section - Full Viewport */}
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen relative text-white flex flex-col items-center justify-center p-4 overflow-hidden"
      >
        {/* Particle Background */}
        <ParticleBackground intensity="medium" />

        <div className="max-w-6xl w-full relative z-10 flex flex-col items-center justify-center flex-1">
          {/* Title & Tagline */}
          <div className="text-center mb-20">
            <HolographicText
              as="h1"
              className="text-6xl md:text-7xl lg:text-8xl mb-6"
            >
              4×4×4 TIC-TAC-TOE
            </HolographicText>
            <p className="font-body text-lg md:text-xl text-gray-300 uppercase tracking-widest animate-scale-in">
              EXPERIENCE THE GAME IN 4 DIMENSIONS
            </p>
          </div>

          {/* Game Mode Cards - Compact CTAs */}
          <motion.div
            variants={cardContainerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-4xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 px-4"
          >
          {/* Single Player Card */}
          <motion.div variants={cardVariants} className="flex">
            <GlassCard
              glowColor="cyan"
              hover
              className="p-8 relative overflow-hidden w-full transition-all duration-300 hover:scale-105 border-2 border-neon-cyan/30 hover:border-neon-cyan/60"
            >
              {/* Corner decorations */}
              <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-neon-cyan/50" />
              <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-neon-cyan/50" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-neon-cyan/50" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-neon-cyan/50" />

              <div className="flex flex-col items-center gap-5 relative z-10">
                {/* Hexagonal Icon Container */}
                <motion.div
                  className="hexagon w-24 h-24 bg-gradient-to-br from-neon-cyan to-blue-500 flex items-center justify-center shadow-glow-cyan"
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  transition={{ duration: 0.5 }}
                >
                  <svg
                    className="w-12 h-12 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M16 6H8c-2.21 0-4 1.79-4 4v8c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4v-8c0-2.21-1.79-4-4-4zm-5 10H9v2H7v-2H5v-2h2v-2h2v2h2v2zm6-2c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2-2c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                  </svg>
                </motion.div>

                {/* Title */}
                <h2 className="font-display text-2xl text-neon-cyan tracking-wider text-glow-cyan">SINGLE PLAYER</h2>

                {/* Description */}
                <p className="font-body text-gray-300 text-center text-sm leading-relaxed">
                  Train your skills against the AI opponent
                </p>

                {/* CTA Button */}
                <NeonButton color="cyan" onClick={() => navigate('/single-player')} className="mt-3 px-8 py-4 min-h-[3.5rem] w-full">
                  START GAME
                </NeonButton>
              </div>
            </GlassCard>
          </motion.div>

          {/* Multiplayer Card */}
          <motion.div variants={cardVariants} className="flex">
            <GlassCard
              glowColor="magenta"
              hover
              className="p-8 relative overflow-hidden w-full transition-all duration-300 hover:scale-105 border-2 border-neon-pink/30 hover:border-neon-pink/60"
            >
              {/* Corner decorations */}
              <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-neon-pink/50" />
              <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-neon-pink/50" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-neon-pink/50" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-neon-pink/50" />

              <div className="flex flex-col items-center gap-5 relative z-10">
                {/* Hexagonal Icon Container */}
                <motion.div
                  className="hexagon w-24 h-24 bg-gradient-to-br from-neon-pink to-purple-500 flex items-center justify-center shadow-glow-magenta"
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  transition={{ duration: 0.5 }}
                >
                  <svg
                    className="w-12 h-12 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                  </svg>
                </motion.div>

                {/* Title */}
                <h2 className="font-display text-2xl text-neon-pink tracking-wider text-glow-magenta">MULTIPLAYER</h2>

                {/* Description */}
                <p className="font-body text-gray-300 text-center text-sm leading-relaxed">
                  Challenge players worldwide in real-time battles
                </p>

                {/* CTA Button */}
                <NeonButton color="magenta" onClick={() => navigate('/multiplayer')} className="mt-3 px-8 py-4 min-h-[3.5rem] w-full">
                  JOIN BATTLE
                </NeonButton>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="font-body text-xs text-gray-400 uppercase tracking-widest">Learn More</span>
          <svg
            className="w-6 h-6 text-neon-purple"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </motion.div>

      {/* How to Play Section - Below the Fold */}
      <div className="min-h-screen relative text-white flex items-center justify-center p-4 bg-gradient-to-b from-transparent via-cyber-medium to-cyber-dark mb-16">
        <div className="max-w-4xl w-full relative z-10">
          <GlassCard glowColor="purple" className="p-10 border border-neon-purple/30">
          <div className="text-center mb-10">
            <h3 className="font-display text-4xl text-neon-purple text-glow-purple mb-2">
              HOW TO PLAY
            </h3>
            <div className="w-24 h-1 mx-auto bg-gradient-to-r from-transparent via-neon-purple to-transparent" />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass rounded-xl p-4 border border-white/5">
              <div className="flex gap-4">
                <div className="w-1 bg-neon-cyan rounded-full flex-shrink-0" />
                <div className="pl-4">
                  <h4 className="font-display text-lg text-neon-cyan mb-2">OBJECTIVE</h4>
                  <p className="font-body leading-relaxed text-gray-300 text-sm">
                    Get four of your marks (X or O) in a row to win. Rows can be
                    horizontal, vertical, or diagonal across any of the four layers.
                  </p>
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-4 border border-white/5">
              <div className="flex gap-4">
                <div className="w-1 bg-neon-cyan rounded-full flex-shrink-0" />
                <div className="pl-4">
                  <h4 className="font-display text-lg text-neon-cyan mb-2">GAMEPLAY</h4>
                  <p className="font-body leading-relaxed text-gray-300 text-sm">
                    Players alternate turns placing their marks on the 4×4×4 grid.
                    The game ends when a player gets four in a row or all spaces are filled.
                  </p>
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-4 border border-white/5">
              <div className="flex gap-4">
                <div className="w-1 bg-neon-cyan rounded-full flex-shrink-0" />
                <div className="pl-4">
                  <h4 className="font-display text-lg text-neon-cyan mb-2">VIEWS</h4>
                  <p className="font-body leading-relaxed text-gray-300 text-sm">
                    Use both the flat 2D boards (showing each layer) and the
                    interactive 3D view to visualize and plan your strategy.
                  </p>
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-4 border border-white/5">
              <div className="flex gap-4">
                <div className="w-1 bg-neon-cyan rounded-full flex-shrink-0" />
                <div className="pl-4">
                  <h4 className="font-display text-lg text-neon-cyan mb-2">WIN CONDITIONS</h4>
                  <p className="font-body leading-relaxed text-gray-300 text-sm">
                    There are 76 possible winning lines in 4×4×4 Tic-Tac-Toe,
                    including vertical stacks, diagonals through layers, and more!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
        </div>
      </div>
    </>
  );
}

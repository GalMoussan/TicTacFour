import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, StatusBadge } from './ui';
import type { PlayerRole } from '../multiplayer/types';

/**
 * RoomStatus Component Props
 */
export interface RoomStatusProps {
  roomId: string;
  playerRole: PlayerRole;
  playerXId: string | null;
  playerOId: string | null;
  opponentConnected: boolean;
}

/**
 * RoomStatus Component
 *
 * Displays room information and player connection status.
 * Shows room code with copy-to-clipboard functionality,
 * player connection status, and role indicators.
 */
export function RoomStatus({
  roomId,
  playerRole,
  playerXId,
  playerOId,
}: RoomStatusProps) {
  const [showCopied, setShowCopied] = useState(false);

  /**
   * Copy room URL to clipboard
   */
  const handleCopyToClipboard = async () => {
    try {
      const roomUrl = `${window.location.origin}/room/${roomId}`;
      await navigator.clipboard.writeText(roomUrl);

      // Show confirmation message
      setShowCopied(true);

      // Hide confirmation message after 2 seconds
      setTimeout(() => {
        setShowCopied(false);
      }, 2000);
    } catch (error) {
      // Silently fail - clipboard access might be denied
      console.error('Failed to copy to clipboard:', error);
    }
  };

  /**
   * Check if player X is connected
   */
  const isPlayerXConnected = playerXId !== null;

  /**
   * Check if player O is connected
   */
  const isPlayerOConnected = playerOId !== null;

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Room Code Display */}
      <GlassCard glowColor="cyan" className="inline-flex items-center gap-3 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="font-body text-sm text-gray-400">ROOM:</span>
          <span className="font-mono text-neon-cyan text-lg tracking-widest">
            {roomId}
          </span>
        </div>

        <div className="relative">
          <button
            onClick={handleCopyToClipboard}
            className="glass rounded-lg p-2 hover:bg-neon-cyan/20 transition-all group"
            aria-label="Copy room code"
          >
            <svg
              className="w-5 h-5 text-neon-cyan group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>

          {/* Copied feedback with particle burst */}
          <AnimatePresence>
            {showCopied && (
              <>
                <motion.div
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 1, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute -top-2 -right-2 pointer-events-none"
                >
                  <StatusBadge color="green" className="animate-pulse text-xs">
                    COPIED!
                  </StatusBadge>
                </motion.div>

                {/* Enhanced particle burst */}
                <motion.div
                  className="absolute inset-0 pointer-events-none overflow-visible"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-neon-green rounded-full"
                      style={{ left: '50%', top: '50%' }}
                      initial={{ scale: 0, x: 0, y: 0 }}
                      animate={{
                        scale: [0, 1, 0],
                        x: Math.cos((i * 30 * Math.PI) / 180) * 50,
                        y: Math.sin((i * 30 * Math.PI) / 180) * 50,
                      }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </GlassCard>

      {/* Player Status Indicators */}
      <div className="flex items-center gap-4">
        {/* Player X Status */}
        <div className="flex items-center gap-2">
          <StatusBadge
            color={isPlayerXConnected ? 'green' : 'yellow'}
            pulse={!isPlayerXConnected}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-current opacity-75" />
              <span className="font-display text-xs">PLAYER X</span>
            </div>
          </StatusBadge>

          {playerRole === 'X' && (
            <StatusBadge color="cyan" className="text-xs font-bold">
              YOU
            </StatusBadge>
          )}
        </div>

        {/* Player O Status */}
        <div className="flex items-center gap-2">
          <StatusBadge
            color={isPlayerOConnected ? 'green' : 'yellow'}
            pulse={!isPlayerOConnected}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-current opacity-75" />
              <span className="font-display text-xs">PLAYER O</span>
            </div>
          </StatusBadge>

          {playerRole === 'O' && (
            <StatusBadge color="magenta" className="text-xs font-bold">
              YOU
            </StatusBadge>
          )}
        </div>
      </div>

      {/* Spectator Mode Indicator */}
      {playerRole === 'spectator' && (
        <StatusBadge color="cyan" className="font-display">
          <div className="flex items-center gap-2">
            <span className="text-xl">👁️</span>
            <span>SPECTATING</span>
          </div>
        </StatusBadge>
      )}
    </div>
  );
}

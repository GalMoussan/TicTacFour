import { motion } from 'framer-motion';
import { HolographicText } from './ui';
import { useGameStore } from '../store/gameStore';

export function GameInfo() {
  const { currentPlayer, winner, isGameOver } = useGameStore();

  // Check if it is a draw (game over but no winner)
  const isDraw = isGameOver && !winner;

  // Determine game status for screen readers
  const getGameStatus = () => {
    if (winner) return `Player ${winner} wins!`;
    if (isDraw) return 'Game ended in a draw';
    return `Current turn: Player ${currentPlayer}`;
  };

  return (
    <div
      className="flex items-center gap-3"
      role="status"
      aria-live="polite"
      aria-label={getGameStatus()}
    >
      {!isGameOver && (
        <>
          <div
            className={`
              w-10 h-10 rounded-full border-3 flex items-center justify-center
              ${currentPlayer === 'X' ? 'border-neon-cyan shadow-glow-cyan' : 'border-neon-pink shadow-glow-magenta'}
              animate-pulse-glow
            `}
            aria-hidden="true"
          >
            <span className="font-display text-xl">
              {currentPlayer}
            </span>
          </div>

          <div>
            <h3 className="font-display text-sm text-white">
              CURRENT PLAYER
            </h3>
            <p className="font-body text-xs text-gray-400">
              Player {currentPlayer}'s turn
            </p>
          </div>
        </>
      )}

      {winner && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="flex items-center gap-3"
        >
          <motion.div
            animate={{ y: [-5, 5, -5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-4xl"
            aria-hidden="true"
          >
            🏆
          </motion.div>
          <div>
            <HolographicText as="h2" className="text-2xl">
              PLAYER {winner} WINS!
            </HolographicText>
            <p className="font-body text-gray-300 text-xs">
              Congratulations!
            </p>
          </div>
        </motion.div>
      )}

      {isDraw && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="flex items-center gap-3"
        >
          <div className="text-4xl" aria-hidden="true">🤝</div>
          <div>
            <HolographicText as="h2" className="text-2xl text-gray-300">
              DRAW
            </HolographicText>
            <p className="font-body text-gray-300 text-xs">
              It is a tie!
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

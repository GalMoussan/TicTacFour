import { motion } from 'framer-motion';
import { NeonButton } from './ui';
import type { PlayerRole } from '../multiplayer/types';

export interface MultiplayerGameInfoProps {
  currentPlayer: 'X' | 'O';
  winner: string | null;
  isDraw: boolean;
  isMyTurn: boolean;
  playerRole: PlayerRole;
  opponentConnected: boolean;
  playerOId: string | null;
  onReset: () => void;
}

export function MultiplayerGameInfo({
  currentPlayer: _currentPlayer,
  winner,
  isDraw,
  isMyTurn,
  playerRole,
  opponentConnected,
  playerOId,
  onReset,
}: MultiplayerGameInfoProps) {
  // Determine game state messages
  const isGameOver = winner !== null || isDraw;
  const isSpectator = playerRole === 'spectator';

  // Determine if opponent exists vs disconnected
  // - playerOId === null: no opponent has joined yet (waiting)
  // - playerOId !== null && !opponentConnected: opponent existed but disconnected
  const hasOpponent = playerOId !== null;
  const opponentDisconnected = hasOpponent && !opponentConnected;

  // Waiting state: either playerRole is null OR no opponent has joined yet
  const isWaitingForOpponent = playerRole === null || !hasOpponent;

  // Determine if player won or lost
  const playerWon = winner === playerRole;
  const opponentWon = winner && winner !== playerRole && !isSpectator;

  return (
    <div className="space-y-4">
      {/* Opponent Disconnection Warning */}
      {opponentDisconnected && !isWaitingForOpponent && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-3 glass rounded-full px-6 py-3 border-2 border-red-400 bg-red-900/20">
            <div className="animate-pulse text-red-400 text-2xl">⚠️</div>
            <p className="font-display text-red-400 text-sm uppercase tracking-wider">
              Opponent disconnected — Waiting for reconnection
            </p>
          </div>
        </motion.div>
      )}

      {/* Main Turn/Status Display */}
      <div className="text-center">
        <div className="inline-block">
          <div className="flex items-center justify-center gap-6">
            {/* Spectator Mode */}
            {isSpectator && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass rounded-full px-8 py-4 border-2 border-cyan-400"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">👁️</span>
                  <span className="font-display text-2xl text-cyan-400 uppercase tracking-wider">Spectating</span>
                </div>
              </motion.div>
            )}

            {/* Waiting for Opponent */}
            {isWaitingForOpponent && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass rounded-full px-8 py-4 border-2 border-yellow-400 animate-pulse-glow"
              >
                <div className="flex items-center gap-4">
                  <div className="animate-pulse text-4xl">⏳</div>
                  <span className="font-display text-2xl text-yellow-400 uppercase tracking-wider">
                    Waiting for Opponent
                  </span>
                </div>
              </motion.div>
            )}

            {/* Game Status Display */}
            {!isSpectator && !isWaitingForOpponent && (
              <>
                {/* VICTORY */}
                {playerWon && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                    className="glass rounded-full px-12 py-6 border-4 border-yellow-400 shadow-glow-yellow bg-yellow-400/10"
                  >
                    <div className="flex items-center gap-6">
                      <motion.div
                        animate={{ rotate: [0, 15, -15, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-6xl"
                      >
                        🏆
                      </motion.div>
                      <div className="text-center">
                        <h2 className="font-display text-5xl text-yellow-400 tracking-wider text-glow-cyan uppercase">
                          VICTORY!
                        </h2>
                        <p className="font-body text-gray-200 text-lg mt-2 uppercase tracking-widest">
                          You won the match
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* DEFEAT */}
                {opponentWon && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="glass rounded-full px-12 py-6 border-4 border-red-500 bg-red-900/20"
                  >
                    <div className="flex items-center gap-6">
                      <div className="text-6xl">💔</div>
                      <div className="text-center">
                        <h2 className="font-display text-5xl text-red-400 tracking-wider uppercase">
                          DEFEAT
                        </h2>
                        <p className="font-body text-gray-200 text-lg mt-2 uppercase tracking-widest">
                          Opponent won this round
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* DRAW */}
                {isDraw && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="glass rounded-full px-12 py-6 border-4 border-gray-400 bg-gray-700/20"
                  >
                    <div className="flex items-center gap-6">
                      <div className="text-6xl">🤝</div>
                      <div className="text-center">
                        <h2 className="font-display text-5xl text-gray-300 tracking-wider uppercase">
                          DRAW
                        </h2>
                        <p className="font-body text-gray-200 text-lg mt-2 uppercase tracking-widest">
                          It's a tie!
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TURN INDICATOR - Dramatic Fighting Game Style */}
                {!isGameOver && (
                  <motion.div
                    key={isMyTurn ? 'your-turn' : 'opponent-turn'}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className={`
                      glass rounded-full px-16 py-8 border-4
                      ${isMyTurn
                        ? 'border-neon-cyan shadow-glow-cyan bg-neon-cyan/10 animate-pulse-glow'
                        : 'border-white/20 bg-gray-800/30'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center gap-4">
                      <motion.h2
                        className={`font-display text-6xl tracking-wider uppercase ${
                          isMyTurn ? 'text-neon-cyan text-glow-cyan' : 'text-gray-400'
                        }`}
                        animate={isMyTurn ? { scale: [1, 1.05, 1] } : {}}
                        transition={isMyTurn ? { repeat: Infinity, duration: 2 } : {}}
                      >
                        {isMyTurn ? 'YOUR TURN' : "OPPONENT'S TURN"}
                      </motion.h2>
                      <p className={`font-body text-xl uppercase tracking-widest ${
                        isMyTurn ? 'text-neon-cyan' : 'text-gray-500'
                      }`}>
                        {isMyTurn ? '⚔️ Make your move ⚔️' : '⏳ Waiting for opponent...'}
                      </p>
                    </div>
                  </motion.div>
                )}
              </>
            )}

            {/* Spectator watching game over */}
            {isSpectator && isGameOver && (
              <>
                {winner && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="glass rounded-full px-12 py-6 border-4 border-yellow-400 shadow-glow-yellow"
                  >
                    <div className="flex items-center gap-6">
                      <div className="text-6xl">🎉</div>
                      <h2 className="font-display text-5xl text-yellow-400 tracking-wider uppercase">
                        PLAYER {winner} WINS!
                      </h2>
                    </div>
                  </motion.div>
                )}
                {isDraw && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="glass rounded-full px-12 py-6 border-4 border-gray-400"
                  >
                    <div className="flex items-center gap-6">
                      <div className="text-6xl">🤝</div>
                      <h2 className="font-display text-5xl text-gray-300 tracking-wider uppercase">
                        DRAW
                      </h2>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* New Game Button - Only shown when game is over */}
      {isGameOver && !isWaitingForOpponent && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
          className="text-center mt-6"
        >
          <NeonButton
            color="magenta"
            onClick={onReset}
            className="px-12 py-4 text-xl"
          >
            ⚔️ NEW GAME
          </NeonButton>
        </motion.div>
      )}
    </div>
  );
}

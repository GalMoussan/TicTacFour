import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Board, Position } from '../game/types';
import { isWinningCell } from '../game/utils';
import { useGameStore } from '../store/gameStore';

interface PendingMove {
  layer: number;
  row: number;
  col: number;
}

interface FlatBoardProps {
  layer: number;
  board: Board;
  onCellClick: (z: number, y: number, x: number, clientX: number, clientY: number) => void;
  winningLine: Position[] | null;
  isGameOver: boolean;
  pendingMove?: PendingMove | null;
}

interface ParticleBurstProps {
  color: string;
}

function ParticleBurst({ color }: ParticleBurstProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className={`absolute w-2 h-2 rounded-full ${color}`}
          style={{ left: '50%', top: '50%' }}
          initial={{ scale: 0, x: 0, y: 0 }}
          animate={{
            scale: [0, 1, 0],
            x: Math.cos(i * 45 * Math.PI / 180) * 30,
            y: Math.sin(i * 45 * Math.PI / 180) * 30,
          }}
          transition={{ duration: 0.5 }}
        />
      ))}
    </div>
  );
}

function getLayerBorderClass(index: number): string {
  const borders = [
    'border-neon-cyan/30 shadow-glow-cyan/20',
    'border-blue-400/30',
    'border-neon-purple/30 shadow-glow-purple/20',
    'border-neon-pink/30 shadow-glow-magenta/20',
  ];
  return borders[index];
}

function getCellClassName(
  cell: 'X' | 'O' | null,
  isWinner: boolean,
  isGameOver: boolean
): string {
  // Compact sizing for compass layout
  const base = `
    relative rounded transition-all duration-300
    flex items-center justify-center group
    min-w-[2.5rem] min-h-[2.5rem]
    w-12 h-12
    max-w-[3.5rem] max-h-[3.5rem]
  `;

  if (isWinner) {
    return `${base}
      bg-yellow-500/20 border-2 border-yellow-400
      shadow-glow-yellow animate-pulse-glow
    `;
  }

  if (cell === 'X') {
    return `${base}
      glass border border-neon-cyan/50
      shadow-glow-cyan
      hover:shadow-glow-cyan/80
    `;
  }

  if (cell === 'O') {
    return `${base}
      glass border border-neon-pink/50
      shadow-glow-magenta
      hover:shadow-glow-magenta/80
    `;
  }

  if (isGameOver) {
    return `${base}
      glass border border-white/10
      cursor-not-allowed
    `;
  }

  return `${base}
    glass border border-white/10
    hover:border-neon-cyan hover:shadow-glow-cyan/50
    cursor-pointer
  `;
}

function getCellAriaLabel(
  layer: number,
  row: number,
  col: number,
  cell: 'X' | 'O' | null,
  isWinner: boolean,
  isGameOver: boolean
): string {
  const position = `Layer ${layer + 1}, Row ${row + 1}, Column ${col + 1}`;
  
  if (cell) {
    const status = isWinner ? ', winning cell' : '';
    return `${position}: ${cell}${status}`;
  }
  
  if (isGameOver) {
    return `${position}: Empty, game over`;
  }
  
  return `${position}: Empty, click to place your mark`;
}

export function FlatBoard({ layer, board, onCellClick, winningLine, isGameOver, pendingMove = null }: FlatBoardProps) {
  const [particleBurstCells, setParticleBurstCells] = useState<Map<string, 'X' | 'O'>>(new Map());
  const currentPlayer = useGameStore((state) => state.currentPlayer);

  // Check if there is any pending move (blocks all other cells)
  const hasPendingMove = pendingMove !== null;

  const handleCellClick = (y: number, x: number, cell: 'X' | 'O' | null, event: React.MouseEvent) => {
    if (cell === null && !isGameOver && currentPlayer && !hasPendingMove) {
      const cellKey = `${layer}-${y}-${x}`;

      setParticleBurstCells(prev => {
        const next = new Map(prev);
        next.set(cellKey, currentPlayer);
        return next;
      });

      setTimeout(() => {
        setParticleBurstCells(prev => {
          const next = new Map(prev);
          next.delete(cellKey);
          return next;
        });
      }, 500);

      onCellClick(layer, y, x, event.clientX, event.clientY);
    }
  };

  const layerLabel = layer === 0 ? 'bottom' : layer === 3 ? 'top' : `level ${layer + 1}`;

  return (
    <div
      className={`p-2 rounded-xl border ${getLayerBorderClass(layer)}`}
      role="grid"
      aria-label={`Layer ${layer + 1} (${layerLabel}) game board`}
    >
      <div className="grid grid-cols-4 gap-1.5 auto-rows-min" role="rowgroup">
        {board[layer].map((row, y) => (
          <div key={y} role="row" className="contents">
            {row.map((cell, x) => {
              const isWinner = isWinningCell(layer, y, x, winningLine);
              const isEmpty = cell === null;
              const isPendingCell = pendingMove && pendingMove.layer === layer && pendingMove.row === y && pendingMove.col === x;
              const isClickable = isEmpty && !isGameOver && !hasPendingMove;
              const cellKey = `${layer}-${y}-${x}`;
              const particlePlayer = particleBurstCells.get(cellKey);
              const showParticles = particlePlayer !== undefined;

              return (
                <motion.button
                  key={cellKey}
                  role="gridcell"
                  aria-label={getCellAriaLabel(layer, y, x, cell, isWinner, isGameOver)}
                  aria-pressed={cell !== null}
                  aria-disabled={!isClickable}
                  onClick={(e) => handleCellClick(y, x, cell, e)}
                  disabled={!isClickable}
                  className={getCellClassName(cell, isWinner, isGameOver)}
                  whileHover={isClickable ? { scale: 1.1 } : {}}
                  whileTap={isClickable ? { scale: 0.95 } : {}}
                  initial={{ scale: 0 }}
                  animate={cell !== null ? { scale: [0, 1.3, 1] } : { scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  {/* Actual cell content */}
                  {cell && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className={`font-display text-xl ${
                        cell === 'X' ? 'text-neon-cyan' : 'text-neon-pink'
                      }`}
                      aria-hidden="true"
                    >
                      {cell}
                    </motion.span>
                  )}

                  {/* Pending move preview */}
                  {isPendingCell && currentPlayer && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 0.5, scale: 1 }}
                      className={`font-display text-xl ${
                        currentPlayer === 'X' ? 'text-neon-cyan' : 'text-neon-pink'
                      }`}
                      aria-hidden="true"
                    >
                      {currentPlayer}
                    </motion.span>
                  )}

                  {/* Pending cell glow effect */}
                  {isPendingCell && (
                    <motion.div
                      className={`absolute inset-0 rounded-lg ${
                        currentPlayer === 'X' ? 'bg-neon-cyan/20 border-2 border-neon-cyan' : 'bg-neon-pink/20 border-2 border-neon-pink'
                      }`}
                      animate={{ opacity: [0.5, 0.8, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      aria-hidden="true"
                    />
                  )}

                  {isClickable && (
                    <div
                      className="absolute inset-0 bg-gradient-radial from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                      aria-hidden="true"
                    />
                  )}

                  <AnimatePresence>
                    {showParticles && particlePlayer && (
                      <ParticleBurst
                        color={particlePlayer === 'X' ? 'bg-neon-cyan' : 'bg-neon-pink'}
                      />
                    )}
                  </AnimatePresence>

                  {isWinner && (
                    <div aria-hidden="true">
                      <motion.div
                        className="absolute inset-0 bg-yellow-400/20 rounded-lg blur"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      />
                      <div className="absolute inset-0 overflow-hidden">
                        {[...Array(3)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                            style={{ left: `${25 + i * 25}%`, top: '50%' }}
                            animate={{
                              y: [-20, -40, -20],
                              opacity: [0, 1, 0],
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: 2,
                              delay: i * 0.3,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

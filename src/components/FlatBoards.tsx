import { useGameStore } from '../store/gameStore';
import { FlatBoard } from './FlatBoard';
import { GlassCard } from './ui';

interface FlatBoardsProps {
  onCellClick?: (z: number, y: number, x: number, clientX: number, clientY: number) => void;
}

function getLayerColor(index: number): string {
  const colors = [
    'bg-neon-cyan',
    'bg-blue-400',
    'bg-neon-purple',
    'bg-neon-pink',
  ];
  return colors[index];
}

export function FlatBoards({ onCellClick }: FlatBoardsProps) {
  const board = useGameStore((state) => state.board);
  const winningLine = useGameStore((state) => state.winningLine);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const makeMove = useGameStore((state) => state.makeMove);

  const handleCellClick = (z: number, y: number, x: number, clientX: number, clientY: number) => {
    if (onCellClick) {
      onCellClick(z, y, x, clientX, clientY);
    } else {
      makeMove(z, y, x);
    }
  };

  return (
    <GlassCard glowColor="cyan" className="p-0 relative border border-neon-cyan/20 overflow-hidden">
      <div className="scanlines absolute inset-0 pointer-events-none rounded-2xl" />
      <div className="absolute top-4 left-4 hexagon w-6 h-6 border-2 border-neon-cyan/50 z-20" />
      <div className="absolute top-4 right-4 hexagon w-6 h-6 border-2 border-neon-purple/50 z-20" />
      <div className="absolute bottom-4 left-4 hexagon w-6 h-6 border-2 border-neon-purple/50 z-20" />
      <div className="absolute bottom-4 right-4 hexagon w-6 h-6 border-2 border-neon-cyan/50 z-20" />

      {/* Sticky Title */}
      <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-neon-cyan/20 py-6 text-center">
        <h2 className="font-display text-2xl text-neon-cyan text-glow-cyan tracking-wider uppercase">
          2D Layer View
        </h2>
        <div className="w-16 h-0.5 mx-auto mt-2 bg-gradient-to-r from-transparent via-neon-cyan to-transparent" />
      </div>

      <div className="flex flex-col gap-6 relative z-0 p-8">
        {[0, 1, 2, 3].map((layer) => (
          <div key={layer} className="space-y-3">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-3 h-3 rounded-full ${getLayerColor(layer)} shadow-lg`} />
              <h3 className="font-display text-lg tracking-widest text-white uppercase">
                LAYER {layer + 1}
              </h3>
              <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
            </div>

            <FlatBoard
              layer={layer}
              board={board}
              onCellClick={handleCellClick}
              winningLine={winningLine}
              isGameOver={isGameOver}
            />
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

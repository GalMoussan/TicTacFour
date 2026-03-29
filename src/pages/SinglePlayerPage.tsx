import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GameInfo } from '../components/GameInfo';
import { FlatBoard } from '../components/FlatBoard';
import { Scene3D } from '../components/Scene3D';
import { NeonButton, HolographicText, GlassCard } from '../components/ui';
import { MoveConfirmationDialog } from '../components/MoveConfirmationDialog';
import { useGameStore } from '../store/gameStore';
import { pageVariants } from '../utils/pageTransitions';

interface PendingMove {
  layer: number;
  row: number;
  col: number;
  clickX: number;
  clickY: number;
}

/**
 * Single Layer Panel Component - Renders one 2D layer for compass layout
 */
function SingleLayerPanel({
  layer,
  onCellClick,
  pendingMove,
}: {
  layer: number;
  onCellClick: (z: number, y: number, x: number, clientX: number, clientY: number) => void;
  pendingMove: PendingMove | null;
}) {
  const board = useGameStore((state) => state.board);
  const winningLine = useGameStore((state) => state.winningLine);
  const isGameOver = useGameStore((state) => state.isGameOver);

  const layerColors = [
    'bg-neon-cyan',
    'bg-blue-400',
    'bg-neon-purple',
    'bg-neon-pink',
  ];

  const layerBorders = [
    'border-neon-cyan/30',
    'border-blue-400/30',
    'border-neon-purple/30',
    'border-neon-pink/30',
  ];

  return (
    <GlassCard
      glowColor="none"
      className={`p-3 h-full flex flex-col border ${layerBorders[layer]}`}
    >
      {/* Layer Label */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${layerColors[layer]} shadow-lg`} />
        <h3 className="font-display text-xs tracking-widest text-white uppercase">
          LAYER {layer + 1}
        </h3>
      </div>

      {/* Layer Grid */}
      <div className="flex-1 flex items-center justify-center">
        <FlatBoard
          layer={layer}
          board={board}
          onCellClick={onCellClick}
          winningLine={winningLine}
          isGameOver={isGameOver}
          pendingMove={pendingMove}
        />
      </div>
    </GlassCard>
  );
}

export function SinglePlayerPage() {
  const navigate = useNavigate();
  const { resetGame, makeMove, currentPlayer } = useGameStore();
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);

  const handleCellClick = (layer: number, row: number, col: number, clickX: number, clickY: number) => {
    setPendingMove({ layer, row, col, clickX, clickY });
  };

  const handleConfirmMove = () => {
    if (pendingMove) {
      makeMove(pendingMove.layer, pendingMove.row, pendingMove.col);
      setPendingMove(null);
    }
  };

  const handleCancelMove = () => {
    setPendingMove(null);
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-gray-900 text-white flex flex-col"
    >
      {/* Glass Header Bar */}
      <div className="fixed top-0 left-0 right-0 z-10 glass backdrop-blur-glass border-b border-white/10 max-h-40">
        <div className="max-w-7xl mx-auto px-4">
          {/* Row 1: Navigation Bar */}
          <div className="flex items-center justify-between py-3 border-b border-white/10">
            {/* Back Button */}
            <NeonButton
              color="cyan"
              onClick={() => navigate('/')}
              className="px-4 py-2 text-sm"
            >
              ← BACK
            </NeonButton>

            {/* Title */}
            <HolographicText as="h1" className="text-xl md:text-2xl">
              4×4×4 TIC-TAC-TOE
            </HolographicText>

            {/* Spacer for symmetry */}
            <div className="w-20" />
          </div>

          {/* Row 2: Status Bar */}
          <div className="flex items-center justify-between py-3">
            {/* Game Info (Current Player) */}
            <GameInfo />

            {/* Reset Button */}
            <button
              onClick={resetGame}
              className="glass border border-white/20 text-gray-300 hover:border-neon-cyan hover:text-neon-cyan px-4 py-2 text-sm rounded-lg transition-all"
              aria-label="Reset game and start over"
            >
              RESET GAME
            </button>
          </div>
        </div>
      </div>

      {/* Main Game Area - Cross/Compass Layout */}
      <main className="pt-[140px] h-screen overflow-hidden bg-gray-900">
        <div
          className="grid gap-3 p-3 h-[calc(100vh-140px)]"
          style={{
            gridTemplateColumns: '1fr 2fr 1fr',
            gridTemplateRows: '1fr 1fr 1fr',
          }}
        >
          {/* Top Center - Layer 1 */}
          <div className="col-start-2 row-start-1 min-h-0">
            <SingleLayerPanel layer={0} onCellClick={handleCellClick} pendingMove={pendingMove} />
          </div>

          {/* Middle Left - Layer 2 */}
          <div className="col-start-1 row-start-2 min-h-0">
            <SingleLayerPanel layer={1} onCellClick={handleCellClick} pendingMove={pendingMove} />
          </div>

          {/* Center - 3D Cube with label */}
          <div className="col-start-2 row-start-2 flex flex-col items-center justify-center gap-3 min-h-0">
            <div className="glass rounded-lg px-4 py-1 border border-neon-purple/30">
              <span className="font-display text-sm text-neon-purple uppercase tracking-widest">
                3D View
              </span>
            </div>
            <div className="w-full h-full flex items-center justify-center overflow-hidden">
              <Scene3D pendingMove={pendingMove} />
            </div>
          </div>

          {/* Middle Right - Layer 3 */}
          <div className="col-start-3 row-start-2 min-h-0">
            <SingleLayerPanel layer={2} onCellClick={handleCellClick} pendingMove={pendingMove} />
          </div>

          {/* Bottom Center - Layer 4 */}
          <div className="col-start-2 row-start-3 min-h-0">
            <SingleLayerPanel layer={3} onCellClick={handleCellClick} pendingMove={pendingMove} />
          </div>
        </div>
      </main>

      {/* Move Confirmation Dialog */}
      {currentPlayer && (
        <MoveConfirmationDialog
          pendingMove={pendingMove}
          currentPlayer={currentPlayer}
          onConfirm={handleConfirmMove}
          onCancel={handleCancelMove}
          clickX={pendingMove?.clickX}
          clickY={pendingMove?.clickY}
        />
      )}
    </motion.div>
  );
}

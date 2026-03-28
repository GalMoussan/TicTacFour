import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoom } from '../multiplayer/useRoom';
import { useMultiplayer } from '../multiplayer/useMultiplayer';
import { useGameStore } from '../store/gameStore';
import { validateRoomId } from '../multiplayer/utils';
import { FlatBoard } from '../components/FlatBoard';
import { GlassCard } from '../components/ui';
import { Scene3D } from '../components/Scene3D';
import { NeonButton, HolographicText } from '../components/ui';
import { MoveConfirmationDialog } from '../components/MoveConfirmationDialog';
import { pageVariants } from '../utils/pageTransitions';

interface PendingMove {
  layer: number;
  row: number;
  col: number;
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
  onCellClick: (z: number, y: number, x: number) => void;
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

/**
 * Invalid Room Error Component
 */
function InvalidRoomError() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center space-y-4 p-8 bg-gray-800 rounded-lg shadow-lg max-w-md">
        <h1 className="text-3xl font-bold text-red-400">Invalid Room ID</h1>
        <p className="text-gray-300">
          The room you are trying to join does not exist or has an invalid ID.
        </p>
        <NeonButton color="cyan" onClick={() => navigate('/multiplayer')}>
          Back to Multiplayer Lobby
        </NeonButton>
      </div>
    </div>
  );
}

/**
 * Waiting Screen Component - Enhanced with animations and better UX
 */
function WaitingScreen({ roomId }: { roomId: string }) {
  const navigate = useNavigate();
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  const handleShare = async () => {
    const roomUrl = `${window.location.origin}/room/${roomId}`;
    try {
      await navigator.clipboard.writeText(roomUrl);
    } catch {
      // Clipboard copy failed - user may need to copy manually
    }
  };

  const handleCopyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2000);
    } catch {
      // Clipboard copy failed
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Rotating Wireframe Cube */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 opacity-10"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Wireframe cube outline */}
            <g stroke="currentColor" strokeWidth="0.5" fill="none" className="text-neon-cyan">
              {/* Front face */}
              <rect x="25" y="25" width="30" height="30" />
              {/* Back face */}
              <rect x="45" y="45" width="30" height="30" />
              {/* Connecting lines */}
              <line x1="25" y1="25" x2="45" y2="45" />
              <line x1="55" y1="25" x2="75" y2="45" />
              <line x1="25" y1="55" x2="45" y2="75" />
              <line x1="55" y1="55" x2="75" y2="75" />
            </g>
          </svg>
        </motion.div>

        {/* Additional decorative element - right side */}
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-48 h-48 opacity-10"
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <g stroke="currentColor" strokeWidth="0.5" fill="none" className="text-neon-pink">
              <circle cx="50" cy="50" r="20" />
              <circle cx="50" cy="50" r="30" />
              <circle cx="50" cy="50" r="40" />
            </g>
          </svg>
        </motion.div>

        {/* Gradient orbs */}
        <motion.div
          className="absolute top-1/3 right-1/3 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-neon-pink/5 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Main Content - Centered */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-8 p-10 glass border border-neon-cyan/20 rounded-xl shadow-glow-cyan max-w-lg relative z-10"
      >
        {/* Animated Header with Pulsing Indicator */}
        <div className="relative">
          {/* Pulsing Ring Around Header */}
          <motion.div
            className="absolute -inset-4 border-2 border-neon-cyan rounded-full opacity-30"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -inset-6 border border-neon-cyan/20 rounded-full opacity-20"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          />

          <div className="relative">
            <motion.div
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <HolographicText as="h1" className="text-3xl md:text-4xl mb-3">
                Waiting for Opponent
              </HolographicText>
            </motion.div>
            <p className="font-body text-gray-400 text-sm">Share this room code with a friend</p>
          </div>
        </div>

        {/* Room Code - Clickable with Copy Feedback */}
        <div className="relative">
          <button
            onClick={handleCopyRoomCode}
            className="w-full glass border border-neon-cyan/30 p-6 rounded-xl hover:border-neon-cyan hover:shadow-glow-cyan transition-all group cursor-pointer"
            aria-label="Click to copy room code"
          >
            <p className="font-body text-xs text-gray-400 uppercase tracking-wider mb-3">
              Room Code (Click to Copy)
            </p>
            <p className="font-mono text-4xl md:text-5xl font-bold text-neon-cyan tracking-wider group-hover:scale-105 transition-transform">
              {roomId}
            </p>
            <motion.div
              className="absolute top-1/2 right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              whileHover={{ scale: 1.1 }}
            >
              <svg className="w-6 h-6 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </motion.div>
          </button>

          {/* Toast Notification */}
          <AnimatePresence>
            {showCopiedToast && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute -bottom-12 left-1/2 -translate-x-1/2 glass border border-green-400/30 bg-green-400/10 px-4 py-2 rounded-lg shadow-glow-cyan"
              >
                <p className="font-display text-sm text-green-400 whitespace-nowrap">
                  ✓ Copied to clipboard!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <NeonButton color="cyan" onClick={handleShare} className="w-full py-3">
            📤 Share Room Link
          </NeonButton>

          <button
            onClick={() => navigate('/multiplayer')}
            className="w-full glass border border-white/20 text-gray-300 hover:border-neon-pink hover:text-neon-pink py-3 rounded-lg transition-all font-display text-sm uppercase tracking-wider"
          >
            ← Back to Lobby
          </button>
        </div>

        {/* Connection Status Indicator */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <motion.div
            className="w-2 h-2 bg-neon-cyan rounded-full"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <p className="font-body text-xs text-gray-500 uppercase tracking-wider">
            Listening for connection...
          </p>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Game Content Component - renders the actual game UI
 */
function GameContent({
  roomId,
  playerRole,
  localPlayerId,
  roomState,
  sendMove,
  requestRematch,
}: {
  roomId: string;
  playerRole: 'X' | 'O' | 'spectator' | null;
  localPlayerId: string;
  roomState: { playerXId: string | null; playerOId: string | null };
  sendMove: (z: number, y: number, x: number) => void;
  requestRematch: () => void;
}) {
  const navigate = useNavigate();
  const {
    currentPlayer,
    winner,
    isGameOver,
    opponentConnected,
    setMultiplayerMode,
    exitMultiplayer,
  } = useGameStore();

  // Track previous values to prevent unnecessary updates
  const prevPlayerIdsRef = useRef({ playerXId: '', playerOId: null as string | null });

  // Initialize multiplayer mode when player joins
  useEffect(() => {
    if (playerRole && playerRole !== 'spectator' && roomId) {
      const currentPlayerXId = roomState.playerXId || '';
      const currentPlayerOId = roomState.playerOId || null;

      // Only update if values have actually changed
      if (prevPlayerIdsRef.current.playerXId !== currentPlayerXId ||
        prevPlayerIdsRef.current.playerOId !== currentPlayerOId) {

        prevPlayerIdsRef.current = { playerXId: currentPlayerXId, playerOId: currentPlayerOId };

        setMultiplayerMode({
          roomId,
          localPlayer: playerRole,
          playerXId: currentPlayerXId,
          playerOId: currentPlayerOId
        });
      }
    }

    // Cleanup when leaving room
    return () => {
      exitMultiplayer();
    };
  }, [playerRole, roomId, roomState.playerXId, roomState.playerOId, setMultiplayerMode, exitMultiplayer]);

  // Calculate if it is a draw
  const isDraw = isGameOver && winner === null;

  // Determine if current player's turn
  const isMyTurn = currentPlayer === playerRole;

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Pending move state
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);

  // Handle cell clicks in multiplayer mode - sets pending move instead of sending immediately
  // Wrapped in useCallback to prevent Scene3D from re-rendering constantly
  const handleCellClick = useCallback((z: number, y: number, x: number) => {
    // Only allow moves if it is the player's turn and they are not a spectator
    if (playerRole === 'spectator' || playerRole === null) {
      return;
    }

    if (!isMyTurn) {
      return;
    }

    // Set pending move for confirmation
    setPendingMove({ layer: z, row: y, col: x });
  }, [playerRole, isMyTurn]);

  // Handle move confirmation - only sends to server after user confirms
  const handleConfirmMove = useCallback(() => {
    if (pendingMove) {
      sendMove(pendingMove.layer, pendingMove.row, pendingMove.col);
      setPendingMove(null);
    }
  }, [pendingMove, sendMove]);

  // Handle move cancellation
  const handleCancelMove = useCallback(() => {
    setPendingMove(null);
  }, []);

  // Determine if we are waiting for opponent
  const isWaitingForOpponent = !roomState.playerOId && playerRole === 'X';

  // Show waiting screen when Player X is waiting for Player O
  // This conditional return is AFTER all hooks
  if (isWaitingForOpponent) {
    return <WaitingScreen roomId={roomId} />;
  }

  // Main game UI
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-gray-900 text-white flex flex-col"
    >
      {/* Consolidated Header - Three-Zone Layout */}
      {/* Professional Header - Balanced Cyberpunk Design */}
      <header
        style={{ position: 'fixed', top: 0, left: 0, right: 0 }}
        className="z-50 glass backdrop-blur-glass border-b border-white/10 h-16 flex items-center px-8 lg:px-16"
      >
        <div className="flex items-center justify-between w-full max-w-[1480px] mx-auto">

          {/* LEFT ZONE: Back + Compact Room Info */}
          <div className="flex items-center gap-6 flex-shrink-0">
            <button
              onClick={() => navigate('/multiplayer')}
              className="glass neon-border-cyan font-display text-sm uppercase tracking-widest px-6 py-2.5 rounded-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap flex items-center gap-2"
            >
              ← BACK
            </button>

            <div className="flex items-center rounded-2xl border border-neon-cyan/50 overflow-hidden bg-black/40 shadow-[0_0_10px_rgba(0,255,255,0.12)]">
              <div className="bg-neon-cyan/20 px-4 py-2.5 border-r border-neon-cyan/40">
                <span className="font-mono text-xs text-neon-cyan font-bold uppercase tracking-widest">ROOM</span>
              </div>
              <div className="px-5 py-2.5">
                <span className="font-mono text-sm text-neon-cyan tracking-widest font-medium">
                  {roomId}
                </span>
              </div>
            </div>
          </div>

          {/* CENTER ZONE: Title - Prominent and Centered */}
          <div className="flex-shrink-0">
            <h1 className="holographic-text font-display font-bold text-[26px] lg:text-3xl tracking-[2px] whitespace-nowrap">
              4×4×4 TIC-TAC-TOE
            </h1>
          </div>

          {/* RIGHT ZONE: Minimal Player Avatars + Status */}
          <div className="flex items-center gap-10 flex-shrink-0">
            {/* Player X */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-9 h-9 rounded-2xl border-2 border-neon-cyan flex items-center justify-center shadow-[0_0_12px_rgba(0,255,255,0.6)]">
                <span className="font-mono text-lg font-bold text-neon-cyan">X</span>
              </div>
              <span className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">
                {playerRole === 'X' ? 'YOU' : 'P1'}
              </span>
            </div>

            {/* VS Separator */}
            <div className="font-mono text-xl text-gray-500 font-light tracking-widest">VS</div>

            {/* Player O */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-9 h-9 rounded-2xl border-2 border-neon-pink flex items-center justify-center shadow-[0_0_12px_rgba(255,20,147,0.6)]">
                <span className="font-mono text-lg font-bold text-neon-pink">O</span>
              </div>
              <span className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">
                {playerRole === 'O' ? 'YOU' : 'P2'}
              </span>
            </div>

            {/* Status Indicator */}
            <div className="pl-6 border-l border-white/10">
              {!isGameOver && !isWaitingForOpponent && (
                <div className={`rounded-3xl px-8 py-3 text-sm font-mono uppercase tracking-widest border transition-all ${isMyTurn
                    ? 'border-neon-cyan text-neon-cyan bg-neon-cyan/10 shadow-glow-cyan'
                    : 'border-white/20 text-gray-400'
                  }`}>
                  {isMyTurn ? 'YOUR TURN' : 'WAITING...'}
                </div>
              )}

              {isGameOver && (
                <div className="flex items-center gap-4">
                  {winner === playerRole && (
                    <div className="rounded-3xl px-8 py-3 text-sm font-mono uppercase tracking-wider border-2 border-yellow-400 bg-yellow-400/10 text-yellow-400">
                      VICTORY
                    </div>
                  )}
                  {winner && winner !== playerRole && playerRole !== 'spectator' && (
                    <div className="rounded-3xl px-8 py-3 text-sm font-mono uppercase tracking-wider border-2 border-red-400 bg-red-900/10 text-red-400">
                      DEFEAT
                    </div>
                  )}
                  {isDraw && (
                    <div className="rounded-3xl px-8 py-3 text-sm font-mono uppercase tracking-wider border-2 border-gray-400 text-gray-300">
                      DRAW
                    </div>
                  )}
                  <NeonButton color="magenta" onClick={requestRematch} className="px-7 py-3 text-sm">
                    NEW GAME
                  </NeonButton>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      {/* Main Game Area - Cross/Compass Layout */}
      <main className="pt-16 h-screen overflow-hidden bg-gray-900">
        <div
          className="grid gap-3 p-3 h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)]"
          style={{
            gridTemplateColumns: '1fr 2fr 1fr',
            gridTemplateRows: '1fr 2fr 1fr',
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
          <div className="col-start-2 row-start-2 flex flex-col items-center justify-center gap-3 min-h-0 max-h-full overflow-hidden">
            <div className="glass rounded-lg px-4 py-1 border border-neon-purple/30 shrink-0">
              <span className="font-display text-sm text-neon-purple uppercase tracking-widest">
                3D View
              </span>
            </div>
            <div className="w-full flex-1 min-h-0 overflow-hidden">
              <Scene3D onCellClick={handleCellClick} pendingMove={pendingMove} />
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
        />
      )}
    </motion.div>
  );
}

/**
 * Multiplayer Page Component - Wrapper that validates room and calls hooks unconditionally
 */
export function MultiplayerPage() {
  const { roomId } = useParams<{ roomId: string }>();

  // All hooks must be called unconditionally
  const isValidRoom = roomId ? validateRoomId(roomId) : false;

  // Always call hooks, even if room is invalid
  const { playerRole, localPlayerId, roomState } = useRoom(isValidRoom ? roomId! : null);
  const { sendMove, requestRematch } = useMultiplayer(
    roomId || '',
    localPlayerId,
    playerRole
  );

  // Show error if room is invalid
  if (!roomId || !isValidRoom) {
    return <InvalidRoomError />;
  }

  return (
    <GameContent
      roomId={roomId}
      playerRole={playerRole}
      localPlayerId={localPlayerId}
      roomState={roomState}
      sendMove={sendMove}
      requestRematch={requestRematch}
    />
  );
}

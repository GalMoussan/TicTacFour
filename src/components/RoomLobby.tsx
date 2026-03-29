import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { generateRoomId, validateRoomId } from '../multiplayer/utils';
import {
  GlassCard,
  NeonButton,
  CyberInput,
  LoadingSpinner
} from './ui';

/**
 * RoomLobby Component
 *
 * UI for creating and joining multiplayer game rooms.
 * Handles room validation, error display, and navigation.
 * Does not manage presence - MultiplayerPage handles actual joining.
 */
export function RoomLobby() {
  const navigate = useNavigate();

  const [roomIdInput, setRoomIdInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  /**
   * Handles room creation
   */
  const handleCreateRoom = async () => {
    setError(null);
    setIsCreating(true);

    try {
      const newRoomId = generateRoomId();
      navigate(`/room/${newRoomId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create room';
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Handles joining an existing room
   */
  const handleJoinRoom = async () => {
    setError(null);

    if (!roomIdInput.trim()) {
      setError('Please enter a room ID');
      return;
    }

    if (!validateRoomId(roomIdInput.trim())) {
      setError('Invalid room ID. Room ID must be 8 alphanumeric characters.');
      return;
    }

    setIsJoining(true);

    try {
      const trimmedRoomId = roomIdInput.trim();
      setRoomIdInput('');
      navigate(`/room/${trimmedRoomId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join room';
      setError(errorMessage);
    } finally {
      setIsJoining(false);
    }
  };

  /**
   * Handles input changes and clears errors
   */
  const handleInputChange = (value: string) => {
    setRoomIdInput(value);
    setError(null);
  };

  const loading = isCreating || isJoining;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyber-dark via-cyber-medium to-cyber-dark flex items-center justify-center p-4">
      <GlassCard
        glowColor="none"
        className="max-w-[42rem] w-full mx-auto !p-8 border-2 border-transparent bg-gradient-to-r from-neon-cyan via-neon-pink to-neon-cyan bg-[length:200%_100%] animate-border-flow relative"
      >
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1
            className="text-white font-display font-bold text-5xl md:text-6xl tracking-tight mb-2"
            style={{ textShadow: '0 0 20px rgba(0,255,255,0.4)' }}
          >
            ROOM LOBBY
          </h1>
          <p className="font-body text-neon-cyan text-xs uppercase tracking-[0.3em] mt-2">
            CREATE OR JOIN A MULTIPLAYER SESSION
          </p>
          <div className="w-16 h-[2px] bg-neon-cyan mx-auto mt-4 mb-6" />
        </div>

        {/* Create Room Section */}
        <div className="mb-8">
          <NeonButton
            color="cyan"
            onClick={handleCreateRoom}
            disabled={loading}
            className="w-full py-6 text-lg"
            aria-busy={isCreating}
          >
            <div className="flex items-center justify-center gap-3">
              <div className="hexagon w-8 h-8 bg-neon-cyan/20 flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
              </div>
              <span>{isCreating ? 'CREATING...' : 'CREATE NEW ROOM'}</span>
              {isCreating && <LoadingSpinner size="sm" color="cyan" />}
            </div>
          </NeonButton>
        </div>

        {/* Divider */}
        <div className="relative my-6 h-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-neon-pink to-transparent" />
          </div>
          <div className="relative flex justify-center">
            <div className="glass rounded-full px-4 py-2 border border-neon-pink backdrop-blur-md bg-cyber-dark/80">
              <span className="font-display text-neon-pink text-sm tracking-widest">OR</span>
            </div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-neon-pink/10 rounded-full blur-xl animate-pulse pointer-events-none" />
        </div>

        {/* Join Room Section */}
        <div className="space-y-4">
          <label
            htmlFor="room-id-input"
            className="font-display text-neon-purple uppercase tracking-wider text-sm block"
          >
            ENTER ROOM CODE
          </label>

          <CyberInput
            id="room-id-input"
            value={roomIdInput}
            onChange={handleInputChange}
            placeholder="XXXXXXXX"
            maxLength={8}
            disabled={loading}
            className="w-full text-center text-2xl uppercase"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && roomIdInput.length === 8 && !loading) {
                handleJoinRoom();
              }
            }}
          />

          <NeonButton
            color="magenta"
            onClick={handleJoinRoom}
            disabled={loading || roomIdInput.length !== 8}
            className="w-full py-6 text-lg transition-opacity duration-300"
            aria-busy={isJoining}
            aria-disabled={loading || roomIdInput.length !== 8}
          >
            <div className="flex items-center justify-center gap-3">
              <span className="uppercase tracking-widest">{isJoining ? 'JOINING...' : 'JOIN ROOM'}</span>
              {isJoining && <LoadingSpinner size="sm" color="magenta" />}
            </div>
          </NeonButton>
        </div>

        {/* Error Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mt-6"
            >
              <GlassCard
                glowColor="none"
                className="border-2 border-red-400 bg-red-900/20"
                role="alert"
              >
                <div className="flex items-center gap-3">
                  <div className="hexagon w-10 h-10 bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 2L1 21h22L12 2zm0 3.5L19.5 19h-15L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
                    </svg>
                  </div>
                  <p className="font-body text-red-400">{error}</p>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back to Home Link */}
        <div className="text-center mt-8 w-full">
          <a
            href="/"
            className="text-neon-cyan hover:text-neon-pink transition-colors duration-300 inline-flex items-center gap-2 font-body uppercase tracking-widest text-sm whitespace-nowrap"
          >
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </a>
        </div>
      </GlassCard>
    </div>
  );
}

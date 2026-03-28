import { useState, useEffect, useCallback, useRef } from 'react';
import type { InboundMessage } from 'ably';
import { ablyClient } from './ably-client';
import {
  type GameMessage,
  type PlayerRole,
  type PlayerSymbol,
  isMoveMessage,
  isJoinMessage,
  isLeaveMessage,
  isSyncRequestMessage,
  isSyncResponseMessage,
  isRematchMessage,
} from './types';
import { useGameStore } from '../store/gameStore';
import type { RealtimeChannel } from 'ably';

/**
 * Return value for the useMultiplayer hook
 */
interface UseMultiplayerReturn {
  sendMove: (z: number, y: number, x: number) => void;
  requestSync: () => void;
  requestRematch: () => void;
  isReady: boolean;
}

/**
 * The critical hook that bridges Ably messaging with the game store.
 */
export function useMultiplayer(
  roomId: string,
  localPlayerId: string,
  _playerRole: PlayerRole
): UseMultiplayerReturn {
  // Suppress unused parameter warning - kept for API compatibility
  void _playerRole;

  const [isReady, setIsReady] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Get game store state and actions
  const gameStore = useGameStore();
  const {
    board,
    currentPlayer,
    winner,
    isGameOver,
    localPlayer,
    makeMove: storeMakeMove,
    resetGame,
    updateOpponentStatus,
  } = gameStore;

  /**
   * Validates if a move is legal
   */
  const isValidMove = useCallback(
    (z: number, y: number, x: number, player: PlayerSymbol): boolean => {
      // Check bounds
      if (z < 0 || z > 3 || y < 0 || y > 3 || x < 0 || x > 3) {
        return false;
      }

      // Check if cell is already occupied
      if (board[z][y][x] !== null) {
        return false;
      }

      // Check if it is the player's turn
      if (currentPlayer !== player) {
        return false;
      }

      // Check if game is over
      if (isGameOver) {
        return false;
      }

      return true;
    },
    [board, currentPlayer, isGameOver]
  );

  /**
   * Broadcasts a message to the channel
   */
  const publishMessage = useCallback((message: GameMessage) => {
    if (channelRef.current) {
      channelRef.current.publish('game-message', message).catch(() => {
        // Failed to publish message
      });
    }
  }, []);

  /**
   * Handles incoming MOVE messages
   */
  const handleMoveMessage = useCallback(
    (message: GameMessage) => {
      if (!isMoveMessage(message)) return;

      // Ignore messages from self
      if (message.senderId === localPlayerId) {
        return;
      }

      const { z, y, x, player } = message.payload;

      // Validate the move
      if (!isValidMove(z, y, x, player)) {
        return;
      }

      // Apply the move to the game store (mark as opponent move to skip turn validation)
      storeMakeMove(z, y, x, true);
    },
    [localPlayerId, isValidMove, storeMakeMove]
  );

  /**
   * Handles incoming SYNC_REQUEST messages
   */
  const handleSyncRequest = useCallback(
    (message: GameMessage) => {
      if (!isSyncRequestMessage(message)) return;

      // Ignore requests from self
      if (message.senderId === localPlayerId) {
        return;
      }

      // Send current game state
      const gameStatus = isGameOver
        ? winner
          ? 'finished'
          : 'draw'
        : 'playing';

      publishMessage({
        type: 'SYNC_RESPONSE',
        timestamp: Date.now(),
        senderId: localPlayerId,
        payload: {
          board,
          currentPlayer: currentPlayer as PlayerSymbol,
          gameStatus,
        },
      });
    },
    [localPlayerId, board, currentPlayer, isGameOver, winner, publishMessage]
  );

  /**
   * Handles incoming SYNC_RESPONSE messages
   */
  const handleSyncResponse = useCallback(
    (message: GameMessage) => {
      if (!isSyncResponseMessage(message)) return;

      // Ignore responses from self
      if (message.senderId === localPlayerId) {
        return;
      }

      // Update local game state with received state
      // Note: This would require adding a method to gameStore to set the full state
    },
    [localPlayerId]
  );

  /**
   * Handles incoming JOIN messages
   */
  const handleJoinMessage = useCallback(
    (message: GameMessage) => {
      if (!isJoinMessage(message)) return;

      // Ignore join from self
      if (message.senderId === localPlayerId) {
        return;
      }

      // Update opponent status
      updateOpponentStatus(true);
    },
    [localPlayerId, updateOpponentStatus]
  );

  /**
   * Handles incoming LEAVE messages
   */
  const handleLeaveMessage = useCallback(
    (message: GameMessage) => {
      if (!isLeaveMessage(message)) return;

      // Ignore leave from self
      if (message.senderId === localPlayerId) {
        return;
      }

      // Update opponent status
      updateOpponentStatus(false);
    },
    [localPlayerId, updateOpponentStatus]
  );

  /**
   * Handles incoming REMATCH messages
   */
  const handleRematchMessage = useCallback(
    (message: GameMessage) => {
      if (!isRematchMessage(message)) return;

      // Reset the game
      resetGame();
    },
    [resetGame]
  );

  /**
   * Main message handler that routes to specific handlers
   */
  const handleMessage = useCallback(
    (message: GameMessage) => {
      switch (message.type) {
        case 'MOVE':
          handleMoveMessage(message);
          break;
        case 'SYNC_REQUEST':
          handleSyncRequest(message);
          break;
        case 'SYNC_RESPONSE':
          handleSyncResponse(message);
          break;
        case 'JOIN':
          handleJoinMessage(message);
          break;
        case 'LEAVE':
          handleLeaveMessage(message);
          break;
        case 'REMATCH':
          handleRematchMessage(message);
          break;
      }
    },
    [
      handleMoveMessage,
      handleSyncRequest,
      handleSyncResponse,
      handleJoinMessage,
      handleLeaveMessage,
      handleRematchMessage,
    ]
  );

  /**
   * Sends a move to the channel and applies it locally
   */
  const sendMove = useCallback(
    (z: number, y: number, x: number) => {
      // Spectators cannot make moves
      if (localPlayer === 'spectator' || localPlayer === null) {
        return;
      }

      // Check if it is the player's turn
      if (currentPlayer !== localPlayer) {
        return;
      }

      // Apply move locally
      storeMakeMove(z, y, x);

      // Broadcast move
      const message: GameMessage = {
        type: 'MOVE',
        timestamp: Date.now(),
        senderId: localPlayerId,
        payload: {
          z,
          y,
          x,
          player: localPlayer as PlayerSymbol,
        },
      };

      if (!channelRef.current) {
        return;
      }

      publishMessage(message);
    },
    [localPlayer, currentPlayer, localPlayerId, storeMakeMove, publishMessage]
  );

  /**
   * Requests game state sync from other players
   */
  const requestSync = useCallback(() => {
    publishMessage({
      type: 'SYNC_REQUEST',
      timestamp: Date.now(),
      senderId: localPlayerId,
    });
  }, [localPlayerId, publishMessage]);

  /**
   * Requests a rematch
   */
  const requestRematch = useCallback(() => {
    // Reset local game
    resetGame();

    // Broadcast rematch request
    publishMessage({
      type: 'REMATCH',
      timestamp: Date.now(),
      senderId: localPlayerId,
    });
  }, [localPlayerId, resetGame, publishMessage]);

  /**
   * Keep handleMessage ref up to date without triggering channel re-subscription
   */
  const handleMessageRef = useRef(handleMessage);
  useEffect(() => {
    handleMessageRef.current = handleMessage;
  }, [handleMessage]);

  /**
   * Keep requestSync ref up to date without triggering channel re-subscription
   */
  const requestSyncRef = useRef(requestSync);
  useEffect(() => {
    requestSyncRef.current = requestSync;
  }, [requestSync]);

  /**
   * Initialize channel subscription and presence
   */
  useEffect(() => {
    // Skip setup if roomId is empty
    if (!roomId) {
      return;
    }

    const channel = ablyClient.channels.get(`room:${roomId}`);
    channelRef.current = channel;

    // Subscribe to messages
    const messageHandler = (message: InboundMessage) => {
      const gameMessage = message.data as GameMessage;

      if (!gameMessage || !gameMessage.type) {
        return;
      }

      // Use ref to always call the latest version without re-subscribing
      handleMessageRef.current(gameMessage);
    };

    channel.subscribe('game-message', messageHandler);

    // Enter presence
    channel.presence.enter();

    // Subscribe to presence updates
    channel.presence.subscribe(() => {
      // Track presence changes if needed
    });

    // Listen for reconnection events
    channel.on('attached', () => {
      // Request sync when reconnecting using ref
      requestSyncRef.current();
    });

    // Set ready state after setup is complete
    // Using setTimeout to avoid setState during render
    const timeoutId = setTimeout(() => {
      setIsReady(true);
    }, 0);

    // Cleanup on unmount
    return () => {
      clearTimeout(timeoutId);
      channel.unsubscribe('game-message', messageHandler);
      channel.presence.leave();
      channelRef.current = null;
    };
  }, [roomId, localPlayerId]);

  return {
    sendMove,
    requestSync,
    requestRematch,
    isReady,
  };
}

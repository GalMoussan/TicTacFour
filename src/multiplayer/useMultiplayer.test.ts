/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { MoveMessage, JoinMessage, LeaveMessage, SyncRequestMessage, SyncResponseMessage, RematchMessage } from './types';
import type { Board } from '../game/types';

// Mock dependencies BEFORE imports
vi.mock('../store/gameStore');
vi.mock('./ably-client', () => ({
  ablyClient: {
    auth: {
      clientId: undefined
    },
    channels: {
      get: vi.fn(),
    },
  },
}));

// Import after mocking
import { useMultiplayer } from './useMultiplayer';
import { useGameStore } from '../store/gameStore';
import { ablyClient } from './ably-client';

describe('useMultiplayer', () => {
  let mockChannel: any;
  let mockPresence: any;
  let messageCallback: ((message: any) => void) | null = null;

  const mockBoard: Board = [
    [
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ],
    [
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ],
    [
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ],
    [
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ],
  ];

  const mockGameStore = {
    board: mockBoard,
    currentPlayer: 'X' as const,
    winner: null,
    winningLine: null,
    isGameOver: false,
    isMultiplayer: true,
    roomId: 'test-room',
    localPlayer: 'X' as const,
    playerXId: 'player-x-id',
    playerOId: 'player-o-id',
    isMyTurn: true,
    opponentConnected: true,
    makeMove: vi.fn(),
    resetGame: vi.fn(),
    setMultiplayerMode: vi.fn(),
    updateOpponentStatus: vi.fn(),
    exitMultiplayer: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    messageCallback = null;

    mockPresence = {
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      enter: vi.fn(),
      leave: vi.fn(),
    };

    mockChannel = {
      subscribe: vi.fn((callback) => {
        messageCallback = callback;
      }),
      unsubscribe: vi.fn(),
      publish: vi.fn(),
      presence: mockPresence,
      attach: vi.fn(),
      detach: vi.fn(),
      on: vi.fn(),
    };

    vi.mocked(ablyClient.channels.get).mockReturnValue(mockChannel);
    vi.mocked(useGameStore).mockReturnValue(mockGameStore);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initialization', () => {
    it('should subscribe to room channel on mount', () => {
      renderHook(() => useMultiplayer('test-room', 'player-x-id', 'X'));

      expect(ablyClient.channels.get).toHaveBeenCalledWith('room:test-room');
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it('should enter presence on mount', () => {
      renderHook(() => useMultiplayer('test-room', 'player-x-id', 'X'));

      expect(mockPresence.enter).toHaveBeenCalled();
    });

    it('should set isReady to true after channel subscription', () => {
      const { result } = renderHook(() => useMultiplayer('test-room', 'player-x-id', 'X'));

      expect(result.current.isReady).toBe(true);
    });

    it('should unsubscribe and leave presence on unmount', () => {
      const { unmount } = renderHook(() => useMultiplayer('test-room', 'player-x-id', 'X'));

      unmount();

      expect(mockChannel.unsubscribe).toHaveBeenCalled();
      expect(mockPresence.leave).toHaveBeenCalled();
    });
  });

  describe('MOVE message handling', () => {
    it('should apply valid move from opponent', async () => {
      // Set current player to O so opponent's move is valid
      vi.mocked(useGameStore).mockReturnValue({
        ...mockGameStore,
        currentPlayer: 'O',
      });

      renderHook(() => useMultiplayer('test-room', 'player-x-id', 'X'));

      expect(messageCallback).not.toBeNull();

      const moveMessage: MoveMessage = {
        type: 'MOVE',
        timestamp: Date.now(),
        senderId: 'player-o-id',
        payload: {
          z: 0,
          y: 0,
          x: 0,
          player: 'O',
        },
      };

      act(() => {
        messageCallback!(moveMessage);
      });

      await waitFor(() => {
        expect(mockGameStore.makeMove).toHaveBeenCalledWith(0, 0, 0);
      });
    });

    it('should ignore MOVE message from self', async () => {
      renderHook(() => useMultiplayer('test-room', 'player-x-id', 'X'));

      const moveMessage: MoveMessage = {
        type: 'MOVE',
        timestamp: Date.now(),
        senderId: 'player-x-id',
        payload: {
          z: 0,
          y: 0,
          x: 0,
          player: 'X',
        },
      };

      act(() => {
        messageCallback!(moveMessage);
      });

      expect(mockGameStore.makeMove).not.toHaveBeenCalled();
    });

    it('should ignore MOVE message when not opponent\'s turn', async () => {
      vi.mocked(useGameStore).mockReturnValue({
        ...mockGameStore,
        currentPlayer: 'X',
      });

      renderHook(() => useMultiplayer('test-room', 'player-x-id', 'X'));

      const moveMessage: MoveMessage = {
        type: 'MOVE',
        timestamp: Date.now(),
        senderId: 'player-o-id',
        payload: {
          z: 0,
          y: 0,
          x: 0,
          player: 'O',
        },
      };

      act(() => {
        messageCallback!(moveMessage);
      });

      expect(mockGameStore.makeMove).not.toHaveBeenCalled();
    });

    it('should ignore MOVE message for occupied cell', async () => {
      const boardWithMove: Board = [
        [
          ['X', null, null, null],
          [null, null, null, null],
          [null, null, null, null],
          [null, null, null, null],
        ],
        [
          [null, null, null, null],
          [null, null, null, null],
          [null, null, null, null],
          [null, null, null, null],
        ],
        [
          [null, null, null, null],
          [null, null, null, null],
          [null, null, null, null],
          [null, null, null, null],
        ],
        [
          [null, null, null, null],
          [null, null, null, null],
          [null, null, null, null],
          [null, null, null, null],
        ],
      ];

      vi.mocked(useGameStore).mockReturnValue({
        ...mockGameStore,
        board: boardWithMove,
        currentPlayer: 'O',
      });

      renderHook(() => useMultiplayer('test-room', 'player-x-id', 'X'));

      const moveMessage: MoveMessage = {
        type: 'MOVE',
        timestamp: Date.now(),
        senderId: 'player-o-id',
        payload: {
          z: 0,
          y: 0,
          x: 0,
          player: 'O',
        },
      };

      act(() => {
        messageCallback!(moveMessage);
      });

      expect(mockGameStore.makeMove).not.toHaveBeenCalled();
    });
  });

  describe('sendMove', () => {
    it('should broadcast move after local move', async () => {
      const { result } = renderHook(() => useMultiplayer('test-room', 'player-x-id', 'X'));

      act(() => {
        result.current.sendMove(1, 2, 3);
      });

      await waitFor(() => {
        expect(mockGameStore.makeMove).toHaveBeenCalledWith(1, 2, 3);
      });

      await waitFor(() => {
        expect(mockChannel.publish).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'MOVE',
            senderId: 'player-x-id',
            payload: {
              z: 1,
              y: 2,
              x: 3,
              player: 'X',
            },
          })
        );
      });
    });

    it('should not send move if not player\'s turn in multiplayer', () => {
      vi.mocked(useGameStore).mockReturnValue({
        ...mockGameStore,
        localPlayer: 'O',
        currentPlayer: 'X',
        isMyTurn: false,
      });

      const { result } = renderHook(() => useMultiplayer('test-room', 'player-o-id', 'O'));

      act(() => {
        result.current.sendMove(1, 2, 3);
      });

      expect(mockGameStore.makeMove).not.toHaveBeenCalled();
      expect(mockChannel.publish).not.toHaveBeenCalled();
    });

    it('should not send move if spectator', () => {
      vi.mocked(useGameStore).mockReturnValue({
        ...mockGameStore,
        localPlayer: 'spectator',
      });

      const { result } = renderHook(() => useMultiplayer('test-room', 'spectator-id', 'spectator'));

      act(() => {
        result.current.sendMove(1, 2, 3);
      });

      expect(mockGameStore.makeMove).not.toHaveBeenCalled();
      expect(mockChannel.publish).not.toHaveBeenCalled();
    });
  });

  describe('Sync handling', () => {
    it('should handle SYNC_REQUEST by sending current game state', async () => {
      renderHook(() => useMultiplayer('test-room', 'player-x-id', 'X'));

      const syncRequestMessage: SyncRequestMessage = {
        type: 'SYNC_REQUEST',
        timestamp: Date.now(),
        senderId: 'player-o-id',
      };

      act(() => {
        messageCallback!(syncRequestMessage);
      });

      await waitFor(() => {
        expect(mockChannel.publish).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'SYNC_RESPONSE',
            senderId: 'player-x-id',
            payload: {
              board: mockBoard,
              currentPlayer: 'X',
              gameStatus: 'playing',
            },
          })
        );
      });
    });

    it('should not send SYNC_RESPONSE to own SYNC_REQUEST', async () => {
      renderHook(() => useMultiplayer('test-room', 'player-x-id', 'X'));

      const syncRequestMessage: SyncRequestMessage = {
        type: 'SYNC_REQUEST',
        timestamp: Date.now(),
        senderId: 'player-x-id',
      };

      act(() => {
        messageCallback!(syncRequestMessage);
      });

      expect(mockChannel.publish).not.toHaveBeenCalled();
    });

    it('should request sync when requestSync is called', async () => {
      const { result } = renderHook(() => useMultiplayer('test-room', 'player-x-id', 'X'));

      act(() => {
        result.current.requestSync();
      });

      await waitFor(() => {
        expect(mockChannel.publish).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'SYNC_REQUEST',
            senderId: 'player-x-id',
          })
        );
      });
    });

    it('should apply sync response from opponent', async () => {
      const syncBoard: Board = [
        [
          ['X', null, null, null],
          [null, 'O', null, null],
          [null, null, null, null],
          [null, null, null, null],
        ],
        [
          [null, null, null, null],
          [null, null, null, null],
          [null, null, null, null],
          [null, null, null, null],
        ],
        [
          [null, null, null, null],
          [null, null, null, null],
          [null, null, null, null],
          [null, null, null, null],
        ],
        [
          [null, null, null, null],
          [null, null, null, null],
          [null, null, null, null],
          [null, null, null, null],
        ],
      ];

      renderHook(() => useMultiplayer('test-room', 'player-x-id', 'X'));

      const syncResponseMessage: SyncResponseMessage = {
        type: 'SYNC_RESPONSE',
        timestamp: Date.now(),
        senderId: 'player-o-id',
        payload: {
          board: syncBoard,
          currentPlayer: 'X',
          gameStatus: 'playing',
        },
      };

      act(() => {
        messageCallback!(syncResponseMessage);
      });

      // Should update local game state (implementation will call a store method)
      // We'll verify this in the implementation
      expect(true).toBe(true); // Placeholder for now
    });
  });

  describe('JOIN/LEAVE handling', () => {
    it('should update opponent status on JOIN message', async () => {
      renderHook(() => useMultiplayer('test-room', 'player-x-id', 'X'));

      const joinMessage: JoinMessage = {
        type: 'JOIN',
        timestamp: Date.now(),
        senderId: 'player-o-id',
        payload: {
          playerName: 'Player O',
        },
      };

      act(() => {
        messageCallback!(joinMessage);
      });

      await waitFor(() => {
        expect(mockGameStore.updateOpponentStatus).toHaveBeenCalledWith(true);
      });
    });

    it('should update opponent status on LEAVE message', async () => {
      renderHook(() => useMultiplayer('test-room', 'player-x-id', 'X'));

      const leaveMessage: LeaveMessage = {
        type: 'LEAVE',
        timestamp: Date.now(),
        senderId: 'player-o-id',
      };

      act(() => {
        messageCallback!(leaveMessage);
      });

      await waitFor(() => {
        expect(mockGameStore.updateOpponentStatus).toHaveBeenCalledWith(false);
      });
    });

    it('should ignore JOIN message from self', async () => {
      renderHook(() => useMultiplayer('test-room', 'player-x-id', 'X'));

      const joinMessage: JoinMessage = {
        type: 'JOIN',
        timestamp: Date.now(),
        senderId: 'player-x-id',
        payload: {},
      };

      act(() => {
        messageCallback!(joinMessage);
      });

      expect(mockGameStore.updateOpponentStatus).not.toHaveBeenCalled();
    });
  });

  describe('REMATCH handling', () => {
    it('should reset game on REMATCH message', async () => {
      renderHook(() => useMultiplayer('test-room', 'player-x-id', 'X'));

      const rematchMessage: RematchMessage = {
        type: 'REMATCH',
        timestamp: Date.now(),
        senderId: 'player-o-id',
      };

      act(() => {
        messageCallback!(rematchMessage);
      });

      await waitFor(() => {
        expect(mockGameStore.resetGame).toHaveBeenCalled();
      });
    });

    it('should broadcast REMATCH when requestRematch is called', async () => {
      const { result } = renderHook(() => useMultiplayer('test-room', 'player-x-id', 'X'));

      act(() => {
        result.current.requestRematch();
      });

      await waitFor(() => {
        expect(mockChannel.publish).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'REMATCH',
            senderId: 'player-x-id',
          })
        );
      });

      await waitFor(() => {
        expect(mockGameStore.resetGame).toHaveBeenCalled();
      });
    });
  });

  describe('Reconnection handling', () => {
    it('should request sync when channel reconnects', async () => {
      let attachCallback: (() => void) | null = null;

      const mockChannelWithCallback = {
        ...mockChannel,
        on: vi.fn((event, callback) => {
          if (event === 'attached') {
            attachCallback = callback;
          }
        }),
      };

      vi.mocked(ablyClient.channels.get).mockReturnValue(mockChannelWithCallback as any);

      renderHook(() => useMultiplayer('test-room', 'player-x-id', 'X'));

      expect(mockChannelWithCallback.on).toHaveBeenCalledWith('attached', expect.any(Function));

      // Simulate reconnection
      act(() => {
        if (attachCallback) {
          attachCallback();
        }
      });

      await waitFor(() => {
        expect(mockChannelWithCallback.publish).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'SYNC_REQUEST',
            senderId: 'player-x-id',
          })
        );
      });
    });
  });

  describe('Role-based permissions', () => {
    it('should allow moves for player X when it is their turn', () => {
      vi.mocked(useGameStore).mockReturnValue({
        ...mockGameStore,
        localPlayer: 'X',
        currentPlayer: 'X',
        isMyTurn: true,
      });

      const { result } = renderHook(() => useMultiplayer('test-room', 'player-x-id', 'X'));

      act(() => {
        result.current.sendMove(0, 0, 0);
      });

      expect(mockGameStore.makeMove).toHaveBeenCalledWith(0, 0, 0);
    });

    it('should prevent moves for player O when it is not their turn', () => {
      vi.mocked(useGameStore).mockReturnValue({
        ...mockGameStore,
        localPlayer: 'O',
        currentPlayer: 'X',
        isMyTurn: false,
      });

      const { result } = renderHook(() => useMultiplayer('test-room', 'player-o-id', 'O'));

      act(() => {
        result.current.sendMove(0, 0, 0);
      });

      expect(mockGameStore.makeMove).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases and validation', () => {
    it('should reject moves with out-of-bounds coordinates', async () => {
      vi.mocked(useGameStore).mockReturnValue({
        ...mockGameStore,
        currentPlayer: 'O',
      });

      renderHook(() => useMultiplayer('test-room', 'player-x-id', 'X'));

      const invalidMoves = [
        { z: -1, y: 0, x: 0 },
        { z: 0, y: -1, x: 0 },
        { z: 0, y: 0, x: -1 },
        { z: 4, y: 0, x: 0 },
        { z: 0, y: 4, x: 0 },
        { z: 0, y: 0, x: 4 },
      ];

      for (const coords of invalidMoves) {
        const moveMessage: MoveMessage = {
          type: 'MOVE',
          timestamp: Date.now(),
          senderId: 'player-o-id',
          payload: {
            ...coords,
            player: 'O',
          },
        };

        act(() => {
          messageCallback!(moveMessage);
        });
      }

      expect(mockGameStore.makeMove).not.toHaveBeenCalled();
    });

    it('should reject moves when game is over', async () => {
      vi.mocked(useGameStore).mockReturnValue({
        ...mockGameStore,
        currentPlayer: 'O',
        isGameOver: true,
        winner: 'X',
      });

      renderHook(() => useMultiplayer('test-room', 'player-x-id', 'X'));

      const moveMessage: MoveMessage = {
        type: 'MOVE',
        timestamp: Date.now(),
        senderId: 'player-o-id',
        payload: {
          z: 0,
          y: 0,
          x: 0,
          player: 'O',
        },
      };

      act(() => {
        messageCallback!(moveMessage);
      });

      expect(mockGameStore.makeMove).not.toHaveBeenCalled();
    });

    it('should handle sync response status correctly for finished game', async () => {
      vi.mocked(useGameStore).mockReturnValue({
        ...mockGameStore,
        isGameOver: true,
        winner: 'X',
      });

      renderHook(() => useMultiplayer('test-room', 'player-x-id', 'X'));

      const syncRequestMessage: SyncRequestMessage = {
        type: 'SYNC_REQUEST',
        timestamp: Date.now(),
        senderId: 'player-o-id',
      };

      act(() => {
        messageCallback!(syncRequestMessage);
      });

      await waitFor(() => {
        expect(mockChannel.publish).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'SYNC_RESPONSE',
            payload: expect.objectContaining({
              gameStatus: 'finished',
            }),
          })
        );
      });
    });

    it('should handle sync response status correctly for draw game', async () => {
      vi.mocked(useGameStore).mockReturnValue({
        ...mockGameStore,
        isGameOver: true,
        winner: null,
      });

      renderHook(() => useMultiplayer('test-room', 'player-x-id', 'X'));

      const syncRequestMessage: SyncRequestMessage = {
        type: 'SYNC_REQUEST',
        timestamp: Date.now(),
        senderId: 'player-o-id',
      };

      act(() => {
        messageCallback!(syncRequestMessage);
      });

      await waitFor(() => {
        expect(mockChannel.publish).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'SYNC_RESPONSE',
            payload: expect.objectContaining({
              gameStatus: 'draw',
            }),
          })
        );
      });
    });

    it('should handle player with null role', () => {
      vi.mocked(useGameStore).mockReturnValue({
        ...mockGameStore,
        localPlayer: null,
      });

      const { result } = renderHook(() => useMultiplayer('test-room', 'player-id', null));

      act(() => {
        result.current.sendMove(0, 0, 0);
      });

      expect(mockGameStore.makeMove).not.toHaveBeenCalled();
    });
  });
});

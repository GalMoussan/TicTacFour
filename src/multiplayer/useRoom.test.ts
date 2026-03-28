/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Create mock objects at module scope
let mockChannel: any;
let mockPresence: any;

// Mock dependencies before imports
vi.mock('./ably-client', () => ({
  ablyClient: {
    auth: {
      clientId: undefined
    },
    channels: {
      get: vi.fn(() => mockChannel),
    },
  },
}));

vi.mock('./utils', () => ({
  generateRoomId: vi.fn(() => 'testroom'),
  validateRoomId: vi.fn((id: string) => id.length === 8 && /^[a-zA-Z0-9]{8}$/.test(id)),
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'test-client-id'),
}));

// Import after mocks are set up
import { useRoom } from './useRoom';
import { ablyClient } from './ably-client';

describe('useRoom', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock presence
    mockPresence = {
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      get: vi.fn().mockResolvedValue([]),
      enter: vi.fn().mockResolvedValue(undefined),
      leave: vi.fn().mockResolvedValue(undefined),
    };

    // Setup mock channel
    mockChannel = {
      presence: mockPresence,
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      detach: vi.fn().mockResolvedValue(undefined),
    };

    // Update the mock implementation
    vi.mocked(ablyClient.channels.get).mockReturnValue(mockChannel);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should generate a unique local player ID on mount', () => {
      const { result } = renderHook(() => useRoom(null));

      expect(result.current.localPlayerId).toBe('test-client-id');
    });

    it('should initialize with no channel when roomId is null', () => {
      const { result } = renderHook(() => useRoom(null));

      expect(result.current.channel).toBeNull();
      expect(result.current.playerRole).toBeNull();
      expect(result.current.isConnected).toBe(false);
    });

    it('should initialize roomState with default values when roomId is null', () => {
      const { result } = renderHook(() => useRoom(null));

      expect(result.current.roomState).toEqual({
        roomId: '',
        playerXId: null,
        playerOId: null,
        spectatorIds: [],
        isActive: false,
      });
    });
  });

  describe('createRoom', () => {
    it('should generate a new room ID and join as Player X', async () => {
      const { result } = renderHook(() => useRoom(null));

      let newRoomId: string = '';
      await act(async () => {
        newRoomId = await result.current.createRoom();
      });

      expect(newRoomId).toBe('testroom');
      expect(ablyClient.channels.get).toHaveBeenCalledWith('room:testroom');
      expect(mockPresence.enter).toHaveBeenCalled();
    });

    it('should set the creator as Player X', async () => {
      mockPresence.get.mockResolvedValue([
        { clientId: 'test-client-id', data: { role: 'X' } },
      ]);

      const { result } = renderHook(() => useRoom(null));

      await act(async () => {
        await result.current.createRoom();
      });

      await waitFor(() => {
        expect(result.current.playerRole).toBe('X');
      });
    });

    it('should update roomState after creating room', async () => {
      mockPresence.get.mockResolvedValue([
        { clientId: 'test-client-id', data: { role: 'X' } },
      ]);

      const { result } = renderHook(() => useRoom(null));

      await act(async () => {
        await result.current.createRoom();
      });

      await waitFor(() => {
        expect(result.current.roomState.roomId).toBe('testroom');
        expect(result.current.roomState.playerXId).toBe('test-client-id');
        expect(result.current.roomState.isActive).toBe(true);
      });
    });
  });

  describe('joinRoom', () => {
    it('should join a valid room', async () => {
      const { result } = renderHook(() => useRoom(null));

      await act(async () => {
        await result.current.joinRoom('abcd1234');
      });

      expect(ablyClient.channels.get).toHaveBeenCalledWith('room:abcd1234');
      expect(mockPresence.enter).toHaveBeenCalled();
    });

    it('should reject invalid room IDs', async () => {
      const { result } = renderHook(() => useRoom(null));

      await expect(
        act(async () => {
          await result.current.joinRoom('invalid');
        })
      ).rejects.toThrow('Invalid room ID');
    });

    it('should assign Player O role to second joiner', async () => {
      mockPresence.get.mockResolvedValue([
        { clientId: 'player-1', data: { role: 'X' } },
        { clientId: 'test-client-id', data: { role: 'O' } },
      ]);

      const { result } = renderHook(() => useRoom(null));

      await act(async () => {
        await result.current.joinRoom('abcd1234');
      });

      await waitFor(() => {
        expect(result.current.playerRole).toBe('O');
      });
    });

    it('should assign spectator role to third+ joiner', async () => {
      mockPresence.get.mockResolvedValue([
        { clientId: 'player-1', data: { role: 'X' } },
        { clientId: 'player-2', data: { role: 'O' } },
        { clientId: 'test-client-id', data: { role: 'spectator' } },
      ]);

      const { result } = renderHook(() => useRoom(null));

      await act(async () => {
        await result.current.joinRoom('abcd1234');
      });

      await waitFor(() => {
        expect(result.current.playerRole).toBe('spectator');
      });
    });

    it('should update roomState with all players', async () => {
      mockPresence.get.mockResolvedValue([
        { clientId: 'player-1', data: { role: 'X' } },
        { clientId: 'player-2', data: { role: 'O' } },
        { clientId: 'test-client-id', data: { role: 'spectator' } },
      ]);

      const { result } = renderHook(() => useRoom(null));

      await act(async () => {
        await result.current.joinRoom('abcd1234');
      });

      await waitFor(() => {
        expect(result.current.roomState).toEqual({
          roomId: 'abcd1234',
          playerXId: 'player-1',
          playerOId: 'player-2',
          spectatorIds: ['test-client-id'],
          isActive: true,
        });
      });
    });
  });

  describe('leaveRoom', () => {
    it('should cleanup presence and channel when leaving', async () => {
      mockPresence.get.mockResolvedValue([
        { clientId: 'test-client-id', data: { role: 'X' } },
      ]);

      const { result } = renderHook(() => useRoom(null));

      await act(async () => {
        await result.current.createRoom();
      });

      await act(async () => {
        result.current.leaveRoom();
      });

      expect(mockPresence.leave).toHaveBeenCalled();
      expect(mockPresence.unsubscribe).toHaveBeenCalled();
      expect(mockChannel.detach).toHaveBeenCalled();
    });

    it('should reset state after leaving', async () => {
      mockPresence.get.mockResolvedValue([
        { clientId: 'test-client-id', data: { role: 'X' } },
      ]);

      const { result } = renderHook(() => useRoom(null));

      await act(async () => {
        await result.current.createRoom();
      });

      await act(async () => {
        result.current.leaveRoom();
      });

      expect(result.current.channel).toBeNull();
      expect(result.current.playerRole).toBeNull();
      expect(result.current.isConnected).toBe(false);
      expect(result.current.roomState.isActive).toBe(false);
    });

    it('should handle leaving when not in a room gracefully', () => {
      const { result } = renderHook(() => useRoom(null));

      expect(() => {
        act(() => {
          result.current.leaveRoom();
        });
      }).not.toThrow();
    });
  });

  describe('presence tracking', () => {
    it('should subscribe to presence updates on join', async () => {
      const { result } = renderHook(() => useRoom(null));

      await act(async () => {
        await result.current.joinRoom('abcd1234');
      });

      expect(mockPresence.subscribe).toHaveBeenCalled();
    });

    it('should handle presence enter events', async () => {
      let presenceCallback: any;
      mockPresence.subscribe.mockImplementation((callback: any) => {
        presenceCallback = callback;
      });

      mockPresence.get.mockResolvedValue([
        { clientId: 'test-client-id', data: { role: 'X' } },
      ]);

      const { result } = renderHook(() => useRoom(null));

      await act(async () => {
        await result.current.createRoom();
      });

      // Update mock to include new player
      mockPresence.get.mockResolvedValue([
        { clientId: 'test-client-id', data: { role: 'X' } },
        { clientId: 'player-2', data: { role: 'O' } },
      ]);

      // Simulate another player joining
      await act(async () => {
        await presenceCallback({
          action: 'enter',
          clientId: 'player-2',
          data: { role: 'O' },
        });
      });

      await waitFor(() => {
        expect(result.current.roomState.playerOId).toBe('player-2');
      });
    });

    it('should handle presence leave events', async () => {
      let presenceCallback: any;
      mockPresence.subscribe.mockImplementation((callback: any) => {
        presenceCallback = callback;
      });

      mockPresence.get.mockResolvedValue([
        { clientId: 'test-client-id', data: { role: 'X' } },
        { clientId: 'player-2', data: { role: 'O' } },
      ]);

      const { result } = renderHook(() => useRoom(null));

      await act(async () => {
        await result.current.createRoom();
      });

      // Update mock to remove player
      mockPresence.get.mockResolvedValue([
        { clientId: 'test-client-id', data: { role: 'X' } },
      ]);

      // Simulate player leaving
      await act(async () => {
        await presenceCallback({
          action: 'leave',
          clientId: 'player-2',
        });
      });

      await waitFor(() => {
        expect(result.current.roomState.playerOId).toBeNull();
      });
    });
  });

  describe('connection management', () => {
    it('should set isConnected to true when channel is active', async () => {
      mockPresence.get.mockResolvedValue([
        { clientId: 'test-client-id', data: { role: 'X' } },
      ]);

      const { result } = renderHook(() => useRoom(null));

      await act(async () => {
        await result.current.createRoom();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });
    });

    it('should handle reconnection gracefully', async () => {
      mockPresence.get.mockResolvedValue([
        { clientId: 'test-client-id', data: { role: 'X' } },
      ]);

      const { result } = renderHook(() => useRoom(null));

      await act(async () => {
        await result.current.createRoom();
      });

      // Simulate disconnect
      await act(async () => {
        result.current.leaveRoom();
      });

      expect(result.current.isConnected).toBe(false);

      // Reconnect
      await act(async () => {
        await result.current.joinRoom('testroom');
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });
    });
  });

  describe('roomId prop changes', () => {
    it('should join room when roomId prop is provided', async () => {
      mockPresence.get.mockResolvedValue([
        { clientId: 'player-1', data: { role: 'X' } },
        { clientId: 'test-client-id', data: { role: 'O' } },
      ]);

      const { result } = renderHook(() => useRoom('abcd1234'));

      await waitFor(() => {
        expect(ablyClient.channels.get).toHaveBeenCalledWith('room:abcd1234');
        expect(result.current.isConnected).toBe(true);
      });
    });

    it('should leave old room and join new room when roomId changes', async () => {
      mockPresence.get.mockResolvedValue([
        { clientId: 'test-client-id', data: { role: 'X' } },
      ]);

      const { rerender } = renderHook(
        ({ roomId }) => useRoom(roomId),
        { initialProps: { roomId: 'room0001' as string | null } }
      );

      await waitFor(() => {
        expect(ablyClient.channels.get).toHaveBeenCalledWith('room:room0001');
      });

      // Change room
      rerender({ roomId: 'room0002' });

      await waitFor(() => {
        expect(mockPresence.leave).toHaveBeenCalled();
        expect(ablyClient.channels.get).toHaveBeenCalledWith('room:room0002');
      });
    });

    it('should cleanup on unmount', async () => {
      mockPresence.get.mockResolvedValue([
        { clientId: 'test-client-id', data: { role: 'X' } },
      ]);

      const { unmount } = renderHook(() => useRoom('abcd1234'));

      await waitFor(() => {
        expect(mockPresence.enter).toHaveBeenCalled();
      });

      unmount();

      expect(mockPresence.leave).toHaveBeenCalled();
      expect(mockPresence.unsubscribe).toHaveBeenCalled();
      expect(mockChannel.detach).toHaveBeenCalled();
    });
  });

  describe('role assignment logic', () => {
    it('should assign roles in order: X, O, spectator', async () => {
      const { result: result1 } = renderHook(() => useRoom(null));

      // Mock should return empty first, then include the new player
      mockPresence.get.mockResolvedValueOnce([]);
      mockPresence.get.mockResolvedValue([
        { clientId: 'test-client-id', data: { role: 'X' } },
      ]);

      await act(async () => {
        await result1.current.createRoom();
      });

      await waitFor(() => {
        expect(result1.current.playerRole).toBe('X');
      });
    });

    it('should maintain role assignment when presence is fetched', async () => {
      mockPresence.get.mockResolvedValue([
        { clientId: 'player-x', data: { role: 'X' } },
        { clientId: 'player-o', data: { role: 'O' } },
        { clientId: 'spectator-1', data: { role: 'spectator' } },
        { clientId: 'spectator-2', data: { role: 'spectator' } },
      ]);

      const { result } = renderHook(() => useRoom('abcd1234'));

      await waitFor(() => {
        expect(result.current.roomState).toEqual({
          roomId: 'abcd1234',
          playerXId: 'player-x',
          playerOId: 'player-o',
          spectatorIds: ['spectator-1', 'spectator-2'],
          isActive: true,
        });
      });
    });
  });

  describe('error handling', () => {
    it('should handle presence.get errors gracefully', async () => {
      mockPresence.get.mockRejectedValue(new Error('Presence fetch failed'));

      const { result } = renderHook(() => useRoom(null));

      await expect(
        act(async () => {
          await result.current.createRoom();
        })
      ).rejects.toThrow('Presence fetch failed');
    });

    it('should handle presence.enter errors gracefully', async () => {
      mockPresence.enter.mockRejectedValue(new Error('Enter failed'));

      const { result } = renderHook(() => useRoom(null));

      await expect(
        act(async () => {
          await result.current.createRoom();
        })
      ).rejects.toThrow('Enter failed');
    });

    it('should validate room ID format before joining', async () => {
      const { result } = renderHook(() => useRoom(null));

      await expect(
        act(async () => {
          await result.current.joinRoom('short');
        })
      ).rejects.toThrow('Invalid room ID');

      await expect(
        act(async () => {
          await result.current.joinRoom('toolongid123');
        })
      ).rejects.toThrow('Invalid room ID');

      await expect(
        act(async () => {
          await result.current.joinRoom('bad-char!');
        })
      ).rejects.toThrow('Invalid room ID');
    });
  });
});

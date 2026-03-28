/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * Role Assignment Bug Reproduction Tests
 *
 * These tests are designed to REPRODUCE the exact bug symptoms:
 * 1. Room creator shows "Player O: You" instead of "Player X: You"
 * 2. Room creator sees "Opponent disconnected" instead of "Waiting for opponent"
 * 3. Second joiner becomes spectator instead of Player O
 *
 * Expected Failures:
 * - ❌ Creator gets 'O' instead of 'X'
 * - ❌ Second joiner gets 'spectator' instead of 'O'
 * - ❌ roomState has playerOId filled first instead of playerXId
 * - ❌ determineRole() logic is backwards
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Create mock objects at module scope
let mockChannel: any;
let mockPresence: any;

// Mock dependencies before imports
vi.mock('../ably-client', () => ({
  ablyClient: {
    auth: {
      clientId: undefined
    },
    channels: {
      get: vi.fn(() => mockChannel),
    },
  },
}));

vi.mock('../utils', () => ({
  generateRoomId: vi.fn(() => 'testroom'),
  validateRoomId: vi.fn((id: string) => id.length === 8 && /^[a-zA-Z0-9]{8}$/.test(id)),
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'creator-id'),
}));

// Import after mocks are set up
import { useRoom } from '../useRoom';
import type { PlayerRole } from '../types';

describe('Role Assignment Bug - Reproduction Tests', () => {
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
  });

  describe('BUG 1: Room creator should be Player X (not O)', () => {
    it('CRITICAL: createRoom should assign creator as Player X', async () => {
      // Mock empty presence (no one in room yet)
      mockPresence.get.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useRoom(null));

      console.log('[TEST] Before createRoom - playerRole:', result.current.playerRole);
      console.log('[TEST] Before createRoom - localPlayerId:', result.current.localPlayerId);

      // Create room
      await act(async () => {
        await result.current.createRoom();
      });

      console.log('[TEST] After createRoom - playerRole:', result.current.playerRole);
      console.log('[TEST] After createRoom - localPlayerId:', result.current.localPlayerId);

      // CRITICAL: Creator should be Player X
      expect(result.current.playerRole).toBe('X');
      expect(result.current.playerRole).not.toBe('O'); // This would fail if bug exists
      expect(result.current.playerRole).not.toBe('spectator');
    });

    it('CRITICAL: Creator ID should be in playerXId slot (not playerOId)', async () => {
      // Mock: After creator joins, presence shows them as X
      mockPresence.get.mockResolvedValueOnce([]);
      mockPresence.get.mockResolvedValue([
        { clientId: 'creator-id', data: { role: 'X' } },
      ]);

      const { result } = renderHook(() => useRoom(null));

      await act(async () => {
        await result.current.createRoom();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      console.log('[TEST] roomState.playerXId:', result.current.roomState.playerXId);
      console.log('[TEST] roomState.playerOId:', result.current.roomState.playerOId);
      console.log('[TEST] localPlayerId:', result.current.localPlayerId);

      // Creator's ID should be in playerXId slot
      expect(result.current.roomState.playerXId).toBe('creator-id');
      expect(result.current.roomState.playerOId).toBeNull(); // No opponent yet

      // This would fail if bug exists (creator would be in playerOId)
      expect(result.current.roomState.playerXId).not.toBeNull();
    });

    it('CRITICAL: Room creator should see correct role in presence', async () => {
      const enteredRole = { role: 'X' as PlayerRole };
      let capturedEnterData: any;

      mockPresence.enter.mockImplementation((data: any) => {
        capturedEnterData = data;
        return Promise.resolve();
      });

      mockPresence.get.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useRoom(null));

      await act(async () => {
        await result.current.createRoom();
      });

      console.log('[TEST] Role sent to presence.enter():', capturedEnterData);

      // Should enter presence as Player X
      expect(capturedEnterData).toEqual({ role: 'X' });
      expect(capturedEnterData?.role).not.toBe('O');
    });
  });

  describe('BUG 2: Room creator should NOT see "opponent disconnected"', () => {
    it('CRITICAL: Creator should have playerOId = null (no opponent yet)', async () => {
      mockPresence.get.mockResolvedValueOnce([]);
      mockPresence.get.mockResolvedValue([
        { clientId: 'creator-id', data: { role: 'X' } },
      ]);

      const { result } = renderHook(() => useRoom(null));

      await act(async () => {
        await result.current.createRoom();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Should NOT have an opponent yet
      expect(result.current.roomState.playerOId).toBeNull();

      // If this fails, it means playerOId is set when it shouldn't be
      console.log('[TEST] Does creator have opponent? playerOId =', result.current.roomState.playerOId);
    });

    it('CRITICAL: Only creator in room = waiting state (not disconnected)', async () => {
      mockPresence.get.mockResolvedValueOnce([]);
      mockPresence.get.mockResolvedValue([
        { clientId: 'creator-id', data: { role: 'X' } },
      ]);

      const { result } = renderHook(() => useRoom(null));

      await act(async () => {
        await result.current.createRoom();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const { roomState } = result.current;

      // Only Player X exists
      expect(roomState.playerXId).toBe('creator-id');
      expect(roomState.playerOId).toBeNull();
      expect(roomState.spectatorIds).toHaveLength(0);

      // UI should render "Waiting for opponent" based on this state
      const hasOpponent = roomState.playerOId !== null;
      console.log('[TEST] hasOpponent:', hasOpponent);
      expect(hasOpponent).toBe(false);
    });
  });

  describe('BUG 3: Second joiner should become Player O (not spectator)', () => {
    it('CRITICAL: Second joiner should be assigned Player O role', async () => {
      // Tab 1: Creator joins
      mockPresence.get.mockResolvedValueOnce([]);

      const tab1 = renderHook(() => useRoom(null));

      await act(async () => {
        await tab1.result.current.createRoom();
      });

      console.log('[TEST] Tab 1 (creator) role:', tab1.result.current.playerRole);
      expect(tab1.result.current.playerRole).toBe('X');

      // Tab 2: Second player joins
      // Reset nanoid to give different ID
      vi.mocked(await import('nanoid')).nanoid.mockReturnValue('player-2-id');

      // Mock presence: X already exists, O is free
      mockPresence.get.mockResolvedValueOnce([
        { clientId: 'creator-id', data: { role: 'X' } },
      ]);

      const tab2 = renderHook(() => useRoom(null));

      await act(async () => {
        await tab2.result.current.joinRoom('testroom');
      });

      console.log('[TEST] Tab 2 (second joiner) role:', tab2.result.current.playerRole);

      // Tab 2 should be Player O
      expect(tab2.result.current.playerRole).toBe('O');
      expect(tab2.result.current.playerRole).not.toBe('spectator'); // This would fail if bug exists
      expect(tab2.result.current.playerRole).not.toBe('X');
    });

    it('CRITICAL: Second joiner ID should be in playerOId slot', async () => {
      // Presence after both players join
      mockPresence.get.mockResolvedValue([
        { clientId: 'creator-id', data: { role: 'X' } },
        { clientId: 'player-2-id', data: { role: 'O' } },
      ]);

      const { result } = renderHook(() => useRoom('testroom'));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      console.log('[TEST] Full room state:', result.current.roomState);

      // Both players should be assigned correctly
      expect(result.current.roomState.playerXId).toBe('creator-id');
      expect(result.current.roomState.playerOId).toBe('player-2-id');
      expect(result.current.roomState.spectatorIds).toHaveLength(0);
    });

    it('CRITICAL: Third joiner should become spectator (roles X and O taken)', async () => {
      // Reset nanoid for third player
      vi.mocked(await import('nanoid')).nanoid.mockReturnValue('player-3-id');

      // Mock presence: Both X and O taken
      mockPresence.get.mockResolvedValueOnce([
        { clientId: 'creator-id', data: { role: 'X' } },
        { clientId: 'player-2-id', data: { role: 'O' } },
      ]);

      const tab3 = renderHook(() => useRoom(null));

      await act(async () => {
        await tab3.result.current.joinRoom('testroom');
      });

      console.log('[TEST] Tab 3 (third joiner) role:', tab3.result.current.playerRole);

      // Third joiner should be spectator
      expect(tab3.result.current.playerRole).toBe('spectator');
      expect(tab3.result.current.playerRole).not.toBe('X');
      expect(tab3.result.current.playerRole).not.toBe('O');
    });
  });

  describe('BUG 4: determineRole() logic validation', () => {
    it('CRITICAL: Empty presence array should assign X', async () => {
      mockPresence.get.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useRoom(null));

      await act(async () => {
        await result.current.createRoom();
      });

      console.log('[TEST] First player in empty room gets role:', result.current.playerRole);

      // First player should ALWAYS be X
      expect(result.current.playerRole).toBe('X');
    });

    it('CRITICAL: Presence with only X should assign O to next joiner', async () => {
      // Mock: Player X exists
      mockPresence.get.mockResolvedValueOnce([
        { clientId: 'player-x-id', data: { role: 'X' } },
      ]);

      vi.mocked(await import('nanoid')).nanoid.mockReturnValue('player-o-id');

      const { result } = renderHook(() => useRoom(null));

      await act(async () => {
        await result.current.joinRoom('testroom');
      });

      console.log('[TEST] Second player when X exists gets role:', result.current.playerRole);

      // Second player should be O
      expect(result.current.playerRole).toBe('O');
      expect(result.current.playerRole).not.toBe('spectator');
    });

    it('CRITICAL: Presence with X and O should assign spectator', async () => {
      // Mock: Both X and O exist
      mockPresence.get.mockResolvedValueOnce([
        { clientId: 'player-x-id', data: { role: 'X' } },
        { clientId: 'player-o-id', data: { role: 'O' } },
      ]);

      vi.mocked(await import('nanoid')).nanoid.mockReturnValue('spectator-id');

      const { result } = renderHook(() => useRoom(null));

      await act(async () => {
        await result.current.joinRoom('testroom');
      });

      console.log('[TEST] Third player when X and O exist gets role:', result.current.playerRole);

      // Third player should be spectator
      expect(result.current.playerRole).toBe('spectator');
    });
  });

  describe('BUG 5: Presence order validation', () => {
    it('CRITICAL: First member in presence array should be X', async () => {
      const members = [
        { clientId: 'first-player', data: { role: 'X' } },
      ];

      mockPresence.get.mockResolvedValue(members);

      const { result } = renderHook(() => useRoom('testroom'));

      await waitFor(() => {
        expect(result.current.roomState.playerXId).toBe('first-player');
      });

      console.log('[TEST] First presence member role:', members[0].data.role);
      expect(members[0].data.role).toBe('X');
    });

    it('CRITICAL: Second member in presence array should be O', async () => {
      const members = [
        { clientId: 'first-player', data: { role: 'X' } },
        { clientId: 'second-player', data: { role: 'O' } },
      ];

      mockPresence.get.mockResolvedValue(members);

      const { result } = renderHook(() => useRoom('testroom'));

      await waitFor(() => {
        expect(result.current.roomState.playerOId).toBe('second-player');
      });

      console.log('[TEST] Second presence member role:', members[1].data.role);
      expect(members[1].data.role).toBe('O');
    });

    it('CRITICAL: Members beyond second should be spectators', async () => {
      const members = [
        { clientId: 'first-player', data: { role: 'X' } },
        { clientId: 'second-player', data: { role: 'O' } },
        { clientId: 'third-player', data: { role: 'spectator' } },
        { clientId: 'fourth-player', data: { role: 'spectator' } },
      ];

      mockPresence.get.mockResolvedValue(members);

      const { result } = renderHook(() => useRoom('testroom'));

      await waitFor(() => {
        expect(result.current.roomState.spectatorIds).toHaveLength(2);
      });

      console.log('[TEST] Third+ members roles:', members.slice(2).map(m => m.data.role));
      expect(members[2].data.role).toBe('spectator');
      expect(members[3].data.role).toBe('spectator');
    });
  });

  describe('BUG 6: Real-world scenario simulation', () => {
    it('CRITICAL: Full user flow - create room → second player joins', async () => {
      console.log('\n=== SIMULATING REAL USER FLOW ===');

      // Step 1: User creates room
      console.log('[STEP 1] User creates room...');
      mockPresence.get.mockResolvedValueOnce([]);
      mockPresence.get.mockResolvedValue([
        { clientId: 'creator-id', data: { role: 'X' } },
      ]);

      const creator = renderHook(() => useRoom(null));

      await act(async () => {
        await creator.result.current.createRoom();
      });

      await waitFor(() => {
        expect(creator.result.current.isConnected).toBe(true);
      });

      console.log('[CREATOR] Role:', creator.result.current.playerRole);
      console.log('[CREATOR] Room State:', creator.result.current.roomState);

      // CRITICAL CHECKS FOR CREATOR
      expect(creator.result.current.playerRole).toBe('X');
      expect(creator.result.current.roomState.playerXId).toBe('creator-id');
      expect(creator.result.current.roomState.playerOId).toBeNull();

      // Step 2: Second player joins
      console.log('[STEP 2] Second player joins room...');
      vi.mocked(await import('nanoid')).nanoid.mockReturnValue('joiner-id');

      mockPresence.get.mockResolvedValueOnce([
        { clientId: 'creator-id', data: { role: 'X' } },
      ]);
      mockPresence.get.mockResolvedValue([
        { clientId: 'creator-id', data: { role: 'X' } },
        { clientId: 'joiner-id', data: { role: 'O' } },
      ]);

      const joiner = renderHook(() => useRoom(null));

      await act(async () => {
        await joiner.result.current.joinRoom('testroom');
      });

      await waitFor(() => {
        expect(joiner.result.current.isConnected).toBe(true);
      });

      console.log('[JOINER] Role:', joiner.result.current.playerRole);
      console.log('[JOINER] Room State:', joiner.result.current.roomState);

      // CRITICAL CHECKS FOR JOINER
      expect(joiner.result.current.playerRole).toBe('O');
      expect(joiner.result.current.roomState.playerXId).toBe('creator-id');
      expect(joiner.result.current.roomState.playerOId).toBe('joiner-id');

      // Step 3: Verify final state
      console.log('[FINAL] Both players connected correctly');
      console.log('[FINAL] Player X:', joiner.result.current.roomState.playerXId);
      console.log('[FINAL] Player O:', joiner.result.current.roomState.playerOId);

      expect(joiner.result.current.roomState.playerXId).not.toBeNull();
      expect(joiner.result.current.roomState.playerOId).not.toBeNull();
      expect(joiner.result.current.roomState.spectatorIds).toHaveLength(0);
    });
  });
});

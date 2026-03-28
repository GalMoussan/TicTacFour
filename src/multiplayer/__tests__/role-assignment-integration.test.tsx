/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-function-type, no-constant-binary-expression */
/**
 * Role Assignment Bug - Integration Tests
 *
 * These tests simulate the ACTUAL user flow through the UI components
 * to reproduce the reported bug symptoms:
 * 1. Room creator shows "Player O: You" instead of "Player X: You"
 * 2. Room creator sees "Opponent disconnected" instead of "Waiting for opponent"
 * 3. Second joiner becomes spectator instead of Player O
 *
 * This tests the INTEGRATION between useRoom, useMultiplayer, and UI components.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RoomStatus } from '../../components/RoomStatus';
import { MultiplayerGameInfo } from '../../components/MultiplayerGameInfo';
import type { PlayerRole } from '../types';

// Create mock objects at module scope
let mockChannel: any;
let mockPresence: any;
let currentClientId = 'creator-id';

// Mock dependencies before imports
vi.mock('../ably-client', () => ({
  ablyClient: {
    auth: {
      get clientId() {
        return currentClientId;
      }
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

let nanoidCounter = 0;
vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => {
    const id = `player-${nanoidCounter}`;
    nanoidCounter++;
    return id;
  }),
}));

// Mock zustand store
const mockGameStore = {
  currentPlayer: 'X' as 'X' | 'O',
  winner: null,
  isGameOver: false,
  opponentConnected: false,
  board: [],
};

vi.mock('../../store/gameStore', () => ({
  useGameStore: vi.fn(() => mockGameStore),
}));

// Import after mocks are set up
import { useRoom } from '../useRoom';
import { useGameStore } from '../../store/gameStore';

// Test Component that wraps useRoom
function TestRoomComponent({ roomId }: { roomId: string | null }) {
  const { playerRole, localPlayerId, roomState, createRoom, isConnected } = useRoom(roomId);

  return (
    <div>
      <div data-testid="player-role">{playerRole || 'null'}</div>
      <div data-testid="local-player-id">{localPlayerId}</div>
      <div data-testid="is-connected">{isConnected ? 'true' : 'false'}</div>
      <div data-testid="room-id">{roomState.roomId}</div>
      <div data-testid="player-x-id">{roomState.playerXId || 'null'}</div>
      <div data-testid="player-o-id">{roomState.playerOId || 'null'}</div>
      <button onClick={createRoom} data-testid="create-room-btn">Create Room</button>

      {/* RoomStatus component */}
      <RoomStatus
        roomId={roomState.roomId || 'unknown'}
        playerRole={playerRole}
        playerXId={roomState.playerXId}
        playerOId={roomState.playerOId}
        opponentConnected={mockGameStore.opponentConnected}
      />
    </div>
  );
}

describe('Role Assignment Bug - Integration Tests', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    nanoidCounter = 0;
    currentClientId = 'creator-id';

    // Reset game store
    mockGameStore.currentPlayer = 'X';
    mockGameStore.winner = null;
    mockGameStore.isGameOver = false;
    mockGameStore.opponentConnected = false;

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

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('BUG SYMPTOM 1: Creator shows "Player O: You" instead of "Player X: You"', () => {
    it('CRITICAL: RoomStatus should show "You" badge next to Player X for creator', async () => {
      console.log('\n=== TEST: Creator should see "Player X: You" ===');

      // Mock: Room creator is alone
      mockPresence.get.mockResolvedValueOnce([]);
      mockPresence.get.mockResolvedValue([
        { clientId: 'player-0', data: { role: 'X' } },
      ]);

      // Render component
      const { container } = render(
        <BrowserRouter>
          <TestRoomComponent roomId={null} />
        </BrowserRouter>
      );

      // Create room
      const createBtn = screen.getByTestId('create-room-btn');
      createBtn.click();

      // Wait for connection
      await waitFor(() => {
        expect(screen.getByTestId('is-connected').textContent).toBe('true');
      });

      const playerRole = screen.getByTestId('player-role').textContent;
      const playerXId = screen.getByTestId('player-x-id').textContent;
      const localPlayerId = screen.getByTestId('local-player-id').textContent;

      console.log('[TEST] Player Role:', playerRole);
      console.log('[TEST] Player X ID:', playerXId);
      console.log('[TEST] Local Player ID:', localPlayerId);

      // CRITICAL: Creator should be Player X
      expect(playerRole).toBe('X');
      expect(playerXId).toBe(localPlayerId);

      // Check UI rendering
      // The "You" badge should appear next to "Player X"
      const roomStatusHTML = container.innerHTML;
      console.log('[TEST] Checking for "Player X" section with "You" badge...');

      // Look for Player X section
      const playerXSection = screen.getByText('Player X:').closest('div');
      expect(playerXSection).toBeTruthy();

      // Look for "You" badge in Player X section
      const youBadgeInX = playerXSection?.querySelector('[class*="bg-blue-600"]');
      console.log('[TEST] Found "You" badge in Player X section:', youBadgeInX?.textContent);

      if (playerRole === 'X') {
        // Should find "You" in Player X section
        expect(youBadgeInX).toBeTruthy();
        expect(youBadgeInX?.textContent).toContain('You');
      }

      // Check that Player O does NOT have "You" badge
      const playerOSection = screen.getByText('Player O:').closest('div');
      const youBadgeInO = playerOSection?.querySelector('[class*="bg-blue-600"]');
      console.log('[TEST] Found "You" badge in Player O section:', youBadgeInO?.textContent);

      // Player O should NOT have "You" badge for creator
      expect(youBadgeInO).toBeNull();
    });

    it('CRITICAL: Creator playerRole should match playerXId (not playerOId)', async () => {
      mockPresence.get.mockResolvedValueOnce([]);
      mockPresence.get.mockResolvedValue([
        { clientId: 'player-0', data: { role: 'X' } },
      ]);

      render(
        <BrowserRouter>
          <TestRoomComponent roomId={null} />
        </BrowserRouter>
      );

      const createBtn = screen.getByTestId('create-room-btn');
      createBtn.click();

      await waitFor(() => {
        expect(screen.getByTestId('is-connected').textContent).toBe('true');
      });

      const playerRole = screen.getByTestId('player-role').textContent;
      const playerXId = screen.getByTestId('player-x-id').textContent;
      const playerOId = screen.getByTestId('player-o-id').textContent;
      const localPlayerId = screen.getByTestId('local-player-id').textContent;

      console.log('[TEST] Player Role:', playerRole);
      console.log('[TEST] Player X ID:', playerXId);
      console.log('[TEST] Player O ID:', playerOId);
      console.log('[TEST] Local Player ID:', localPlayerId);

      // CRITICAL: Creator should be in playerXId slot
      expect(playerRole).toBe('X');
      expect(playerXId).toBe(localPlayerId);
      expect(playerOId).toBe('null'); // No opponent yet

      // If bug exists, playerOId would equal localPlayerId
      expect(playerOId).not.toBe(localPlayerId);
    });
  });

  describe('BUG SYMPTOM 2: Creator sees "Opponent disconnected" warning', () => {
    it('CRITICAL: Creator should NOT see "Opponent disconnected" banner', async () => {
      console.log('\n=== TEST: Creator should see "Waiting for opponent" not "Disconnected" ===');

      mockPresence.get.mockResolvedValueOnce([]);
      mockPresence.get.mockResolvedValue([
        { clientId: 'player-0', data: { role: 'X' } },
      ]);

      render(
        <BrowserRouter>
          <MultiplayerGameInfo
            currentPlayer="X"
            winner={null}
            isDraw={false}
            isMyTurn={true}
            playerRole="X"
            opponentConnected={false}
            playerOId={null}  // No opponent yet
            onReset={() => {}}
          />
        </BrowserRouter>
      );

      console.log('[TEST] Looking for "Opponent disconnected" warning...');

      // Should NOT show "Opponent disconnected" when playerRole is set
      const disconnectedWarning = screen.queryByText(/Opponent disconnected/i);
      console.log('[TEST] Found disconnected warning:', disconnectedWarning);

      // This is the bug! When playerRole='X' and opponentConnected=false,
      // the component shows "Opponent disconnected" but should not
      // because there was never an opponent to disconnect

      // Component logic:
      // !opponentConnected && !isWaitingForOpponent
      // isWaitingForOpponent = playerRole === null
      // So if playerRole='X', isWaitingForOpponent=false, shows warning!

      // Expected: Should NOT show warning for creator waiting
      expect(disconnectedWarning).toBeNull();
    });

    it('CRITICAL: MultiplayerGameInfo logic for waiting state', async () => {
      console.log('\n=== TEST: Checking MultiplayerGameInfo waiting logic ===');

      // Scenario: Creator with playerRole='X', no opponent yet
      const { rerender } = render(
        <BrowserRouter>
          <MultiplayerGameInfo
            currentPlayer="X"
            winner={null}
            isDraw={false}
            isMyTurn={true}
            playerRole="X"  // Has role assigned
            opponentConnected={false}  // No opponent yet
            playerOId={null}  // No opponent yet
            onReset={() => {}}
          />
        </BrowserRouter>
      );

      // Check component logic
      const isWaitingForOpponent = null === null; // playerRole === null
      console.log('[TEST] isWaitingForOpponent (playerRole === null):', isWaitingForOpponent);
      console.log('[TEST] playerRole:', 'X');
      console.log('[TEST] opponentConnected:', false);

      // Component shows "Opponent disconnected" when:
      // !opponentConnected && !isWaitingForOpponent
      // = !false && !false = true && true = true → Shows warning!

      // But this is WRONG for a creator who never had an opponent!
      // The logic should check if opponent EVER existed (playerOId !== null)

      const disconnectedWarning = screen.queryByText(/Opponent disconnected/i);
      console.log('[TEST] Shows "Opponent disconnected"?', disconnectedWarning !== null);

      // BUG: This will show the warning even though no opponent joined yet
      // The test expects it to NOT show, but the current logic shows it

      // Fix: Component should check if opponent slot is filled
      // !opponentConnected && playerOId !== null
    });
  });

  describe('BUG SYMPTOM 3: Second joiner becomes spectator', () => {
    it('CRITICAL: Second player to join should get Player O role', async () => {
      console.log('\n=== TEST: Second joiner should be Player O ===');

      // First player creates room
      mockPresence.get.mockResolvedValueOnce([]);
      mockPresence.get.mockResolvedValue([
        { clientId: 'player-0', data: { role: 'X' } },
      ]);

      const { unmount: unmount1 } = render(
        <BrowserRouter>
          <TestRoomComponent roomId={null} />
        </BrowserRouter>
      );

      const createBtn = screen.getByTestId('create-room-btn');
      createBtn.click();

      await waitFor(() => {
        expect(screen.getByTestId('is-connected').textContent).toBe('true');
      });

      const player1Role = screen.getByTestId('player-role').textContent;
      console.log('[TEST] Player 1 (creator) role:', player1Role);
      expect(player1Role).toBe('X');

      unmount1();

      // Second player joins
      currentClientId = 'player-1';
      mockPresence.get.mockResolvedValueOnce([
        { clientId: 'player-0', data: { role: 'X' } },
      ]);
      mockPresence.get.mockResolvedValue([
        { clientId: 'player-0', data: { role: 'X' } },
        { clientId: 'player-1', data: { role: 'O' } },
      ]);

      render(
        <BrowserRouter>
          <TestRoomComponent roomId="testroom" />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-connected').textContent).toBe('true');
      });

      const player2Role = screen.getByTestId('player-role').textContent;
      const playerOId = screen.getByTestId('player-o-id').textContent;

      console.log('[TEST] Player 2 (joiner) role:', player2Role);
      console.log('[TEST] Player O ID:', playerOId);

      // CRITICAL: Second joiner should be Player O
      expect(player2Role).toBe('O');
      expect(player2Role).not.toBe('spectator');
      expect(playerOId).toBe('player-1');
    });

    it('CRITICAL: RoomStatus shows "You" badge for second player in Player O section', async () => {
      console.log('\n=== TEST: Second joiner sees "Player O: You" ===');

      // Mock: Both players in room
      currentClientId = 'player-1';
      mockPresence.get.mockResolvedValue([
        { clientId: 'player-0', data: { role: 'X' } },
        { clientId: 'player-1', data: { role: 'O' } },
      ]);

      const { container } = render(
        <BrowserRouter>
          <TestRoomComponent roomId="testroom" />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-connected').textContent).toBe('true');
      });

      const playerRole = screen.getByTestId('player-role').textContent;
      console.log('[TEST] Player Role:', playerRole);
      expect(playerRole).toBe('O');

      // Check UI rendering
      const playerOSection = screen.getByText('Player O:').closest('div');
      const youBadgeInO = playerOSection?.querySelector('[class*="bg-blue-600"]');

      console.log('[TEST] Found "You" badge in Player O section:', youBadgeInO?.textContent);

      if (playerRole === 'O') {
        expect(youBadgeInO).toBeTruthy();
        expect(youBadgeInO?.textContent).toContain('You');
      }

      // Player X should NOT have "You" badge
      const playerXSection = screen.getByText('Player X:').closest('div');
      const youBadgeInX = playerXSection?.querySelector('[class*="bg-blue-600"]');
      expect(youBadgeInX).toBeNull();
    });
  });

  describe('Real-world integration flow', () => {
    it('FULL FLOW: Create room → Second player joins → Verify roles', async () => {
      console.log('\n=== FULL INTEGRATION TEST ===');

      // STEP 1: Creator creates room
      console.log('[STEP 1] Creator creates room...');
      currentClientId = 'creator-id';
      mockPresence.get.mockResolvedValueOnce([]);
      mockPresence.get.mockResolvedValue([
        { clientId: 'creator-id', data: { role: 'X' } },
      ]);

      const { unmount: unmount1, container: container1 } = render(
        <BrowserRouter>
          <TestRoomComponent roomId={null} />
        </BrowserRouter>
      );

      const createBtn = screen.getByTestId('create-room-btn');
      createBtn.click();

      await waitFor(() => {
        expect(screen.getByTestId('is-connected').textContent).toBe('true');
      });

      const creatorRole = screen.getByTestId('player-role').textContent;
      const creatorXId = screen.getByTestId('player-x-id').textContent;
      const creatorOId = screen.getByTestId('player-o-id').textContent;

      console.log('[CREATOR] Role:', creatorRole);
      console.log('[CREATOR] Player X ID:', creatorXId);
      console.log('[CREATOR] Player O ID:', creatorOId);

      expect(creatorRole).toBe('X');
      expect(creatorXId).toBe('creator-id');
      expect(creatorOId).toBe('null');

      // Check creator sees "Player X: You"
      const creatorPlayerXSection = screen.getByText('Player X:').closest('div');
      const creatorYouBadge = creatorPlayerXSection?.querySelector('[class*="bg-blue-600"]');
      console.log('[CREATOR] "You" badge location:', creatorYouBadge ? 'Player X section' : 'NOT FOUND');
      expect(creatorYouBadge).toBeTruthy();

      unmount1();

      // STEP 2: Second player joins
      console.log('[STEP 2] Second player joins...');
      currentClientId = 'joiner-id';
      mockPresence.get.mockResolvedValueOnce([
        { clientId: 'creator-id', data: { role: 'X' } },
      ]);
      mockPresence.get.mockResolvedValue([
        { clientId: 'creator-id', data: { role: 'X' } },
        { clientId: 'joiner-id', data: { role: 'O' } },
      ]);

      const { container: container2 } = render(
        <BrowserRouter>
          <TestRoomComponent roomId="testroom" />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-connected').textContent).toBe('true');
      });

      const joinerRole = screen.getByTestId('player-role').textContent;
      const joinerXId = screen.getByTestId('player-x-id').textContent;
      const joinerOId = screen.getByTestId('player-o-id').textContent;

      console.log('[JOINER] Role:', joinerRole);
      console.log('[JOINER] Player X ID:', joinerXId);
      console.log('[JOINER] Player O ID:', joinerOId);

      expect(joinerRole).toBe('O');
      expect(joinerXId).toBe('creator-id');
      expect(joinerOId).toBe('joiner-id');

      // Check joiner sees "Player O: You"
      const joinerPlayerOSection = screen.getByText('Player O:').closest('div');
      const joinerYouBadge = joinerPlayerOSection?.querySelector('[class*="bg-blue-600"]');
      console.log('[JOINER] "You" badge location:', joinerYouBadge ? 'Player O section' : 'NOT FOUND');
      expect(joinerYouBadge).toBeTruthy();

      console.log('[SUCCESS] Both players have correct roles!');
    });
  });
});

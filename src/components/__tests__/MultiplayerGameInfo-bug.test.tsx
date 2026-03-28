import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MultiplayerGameInfo } from '../MultiplayerGameInfo';

/**
 * Bug Fix Tests: Disconnect Warning vs Waiting Message
 *
 * PROBLEM:
 * Component shows "Opponent disconnected" warning when room creator
 * has no opponent yet, instead of showing "Waiting for opponent".
 *
 * ROOT CAUSE:
 * Component only checks opponentConnected flag, but doesn't know if
 * an opponent ever existed. When playerOId is null, it means no
 * opponent has joined yet (not disconnected).
 *
 * SOLUTION:
 * Add playerOId prop to distinguish:
 * - playerOId === null → waiting for opponent to join
 * - playerOId !== null && !opponentConnected → opponent disconnected
 */
describe('MultiplayerGameInfo - Disconnect vs Waiting Bug', () => {
  const defaultProps = {
    currentPlayer: 'X' as const,
    winner: null,
    isDraw: false,
    isMyTurn: true,
    playerRole: 'X' as const,
    opponentConnected: false,
    onReset: vi.fn(),
  };

  describe('BUG: Waiting vs Disconnected States', () => {
    it('should show "Waiting for opponent" when room creator has no opponent yet', () => {
      render(
        <MultiplayerGameInfo
          {...defaultProps}
          playerRole="X"
          opponentConnected={false}
          playerOId={null}  // NO OPPONENT YET
        />
      );

      // Should show waiting, NOT disconnected warning
      expect(screen.queryByText(/opponent disconnected/i)).not.toBeInTheDocument();
      expect(screen.getByText(/waiting for opponent/i)).toBeInTheDocument();

      // Expected: FAIL - currently shows "Opponent disconnected" instead
    });

    it('should show "Opponent disconnected" only when opponent existed and left', () => {
      render(
        <MultiplayerGameInfo
          {...defaultProps}
          playerRole="X"
          opponentConnected={false}
          playerOId="opponent-123"  // OPPONENT EXISTS BUT DISCONNECTED
        />
      );

      // Should show disconnected warning
      expect(screen.getByText(/opponent disconnected/i)).toBeInTheDocument();
      expect(screen.queryByText(/waiting for opponent/i)).not.toBeInTheDocument();

      // Expected: PASS (this already works correctly)
    });

    it('should NOT show disconnect warning when both players connected', () => {
      render(
        <MultiplayerGameInfo
          {...defaultProps}
          currentPlayer="O"
          playerRole="X"
          opponentConnected={true}
          playerOId="opponent-123"
        />
      );

      // Should show neither waiting nor disconnected
      expect(screen.queryByText(/opponent disconnected/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/waiting for opponent/i)).not.toBeInTheDocument();

      // Expected: PASS
    });

    it('spectator should show waiting when only 1 player in room', () => {
      render(
        <MultiplayerGameInfo
          {...defaultProps}
          playerRole="spectator"
          opponentConnected={false}
          playerOId={null}  // Only Player X present
        />
      );

      // Spectator should see waiting message, not disconnected
      expect(screen.queryByText(/opponent disconnected/i)).not.toBeInTheDocument();
      expect(screen.getByText(/spectating/i)).toBeInTheDocument();

      // Expected: Might FAIL - spectators might see disconnect warning
    });

    it('player O joining room should not see disconnect warning initially', () => {
      render(
        <MultiplayerGameInfo
          {...defaultProps}
          playerRole="O"
          opponentConnected={true}
          playerOId="opponent-x-id"  // Player X exists
        />
      );

      // Player O should not see any warnings
      expect(screen.queryByText(/opponent disconnected/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/waiting/i)).not.toBeInTheDocument();

      // Expected: PASS
    });
  });

  describe('Edge Cases', () => {
    it('handles null playerRole (legacy waiting state)', () => {
      render(
        <MultiplayerGameInfo
          {...defaultProps}
          playerRole={null}
          opponentConnected={false}
          playerOId={null}
        />
      );

      // Should show waiting message
      expect(screen.getByText(/waiting for opponent/i)).toBeInTheDocument();
      expect(screen.queryByText(/opponent disconnected/i)).not.toBeInTheDocument();
    });

    it('handles game over with disconnected opponent', () => {
      render(
        <MultiplayerGameInfo
          {...defaultProps}
          playerRole="X"
          winner="X"
          opponentConnected={false}
          playerOId="opponent-123"
        />
      );

      // Should show both win message AND disconnect warning
      expect(screen.getByText(/you win/i)).toBeInTheDocument();
      expect(screen.getByText(/opponent disconnected/i)).toBeInTheDocument();
    });
  });
});

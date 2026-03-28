import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MultiplayerGameInfo } from '../MultiplayerGameInfo';
import type { PlayerRole } from '../../multiplayer/types';

describe('MultiplayerGameInfo', () => {
  const defaultProps = {
    currentPlayer: 'X' as const,
    winner: null,
    isDraw: false,
    isMyTurn: false,
    playerRole: null as PlayerRole,
    opponentConnected: true,
    playerOId: 'opponent-123' as string | null,
    onReset: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Turn Indicator', () => {
    it('displays "Your turn" when it is the player\'s turn', () => {
      render(
        <MultiplayerGameInfo
          {...defaultProps}
          playerRole="X"
          isMyTurn={true}
        />
      );

      expect(screen.getByText(/Your turn/i)).toBeInTheDocument();
    });

    it('displays "Opponent\'s turn" when it is not the player\'s turn', () => {
      render(
        <MultiplayerGameInfo
          {...defaultProps}
          playerRole="X"
          isMyTurn={false}
          currentPlayer="O"
        />
      );

      expect(screen.getByText(/Opponent's turn/i)).toBeInTheDocument();
    });

    it('highlights the turn indicator when it is the player\'s turn', () => {
      render(
        <MultiplayerGameInfo
          {...defaultProps}
          playerRole="X"
          isMyTurn={true}
        />
      );

      const turnIndicator = screen.getByText(/Your turn/i).closest('div');
      // The parent div should have the bg-green class when it's player's turn
      const parentDiv = turnIndicator?.parentElement;
      expect(parentDiv?.className).toMatch(/bg-green/);
    });
  });

  describe('Winner Announcements', () => {
    it('displays "You win!" when the player wins', () => {
      render(
        <MultiplayerGameInfo
          {...defaultProps}
          playerRole="X"
          winner="X"
        />
      );

      expect(screen.getByText(/You win!/i)).toBeInTheDocument();
    });

    it('displays "Opponent wins!" when the opponent wins', () => {
      render(
        <MultiplayerGameInfo
          {...defaultProps}
          playerRole="X"
          winner="O"
        />
      );

      expect(screen.getByText(/Opponent wins!/i)).toBeInTheDocument();
    });

    it('does not display winner message when game is not over', () => {
      render(
        <MultiplayerGameInfo
          {...defaultProps}
          playerRole="X"
          winner={null}
        />
      );

      expect(screen.queryByText(/win/i)).not.toBeInTheDocument();
    });
  });

  describe('Draw Announcement', () => {
    it('displays draw message when game ends in a draw', () => {
      render(
        <MultiplayerGameInfo
          {...defaultProps}
          playerRole="X"
          isDraw={true}
        />
      );

      expect(screen.getByText(/It's a draw!/i)).toBeInTheDocument();
    });

    it('does not display draw message when game is not a draw', () => {
      render(
        <MultiplayerGameInfo
          {...defaultProps}
          playerRole="X"
          isDraw={false}
        />
      );

      expect(screen.queryByText(/draw/i)).not.toBeInTheDocument();
    });
  });

  describe('Opponent Disconnection', () => {
    it('displays warning banner when opponent is disconnected', () => {
      render(
        <MultiplayerGameInfo
          {...defaultProps}
          playerRole="X"
          opponentConnected={false}
          playerOId="opponent-123"  // Opponent exists but disconnected
        />
      );

      expect(screen.getByText(/Opponent disconnected/i)).toBeInTheDocument();
    });

    it('does not display warning when opponent is connected', () => {
      render(
        <MultiplayerGameInfo
          {...defaultProps}
          playerRole="X"
          opponentConnected={true}
        />
      );

      expect(screen.queryByText(/disconnected/i)).not.toBeInTheDocument();
    });

    it('applies warning styles to disconnection banner', () => {
      render(
        <MultiplayerGameInfo
          {...defaultProps}
          playerRole="X"
          opponentConnected={false}
          playerOId="opponent-123"  // Opponent exists but disconnected
        />
      );

      const banner = screen.getByText(/Opponent disconnected/i).closest('div');
      expect(banner?.className).toMatch(/(bg-red|bg-orange|bg-yellow)/);
    });
  });

  describe('Spectator Mode', () => {
    it('displays spectator message when player is a spectator', () => {
      render(
        <MultiplayerGameInfo
          {...defaultProps}
          playerRole="spectator"
        />
      );

      expect(screen.getByText(/Spectating/i)).toBeInTheDocument();
    });

    it('does not display spectator message when player is X or O', () => {
      render(
        <MultiplayerGameInfo
          {...defaultProps}
          playerRole="X"
        />
      );

      expect(screen.queryByText(/Spectating/i)).not.toBeInTheDocument();
    });
  });

  describe('Waiting State', () => {
    it('displays waiting message when playerRole is null', () => {
      render(
        <MultiplayerGameInfo
          {...defaultProps}
          playerRole={null}
        />
      );

      expect(screen.getByText(/Waiting for opponent/i)).toBeInTheDocument();
    });

    it('does not display waiting message when game has started', () => {
      render(
        <MultiplayerGameInfo
          {...defaultProps}
          playerRole="X"
        />
      );

      expect(screen.queryByText(/Waiting for opponent/i)).not.toBeInTheDocument();
    });
  });

  describe('Reset Button', () => {
    it('renders reset button', () => {
      render(
        <MultiplayerGameInfo
          {...defaultProps}
          playerRole="X"
        />
      );

      expect(screen.getByRole('button', { name: /reset|new game/i })).toBeInTheDocument();
    });

    it('calls onReset when reset button is clicked', () => {
      const onReset = vi.fn();
      render(
        <MultiplayerGameInfo
          {...defaultProps}
          playerRole="X"
          onReset={onReset}
        />
      );

      const resetButton = screen.getByRole('button', { name: /reset|new game/i });
      fireEvent.click(resetButton);

      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it('button is enabled during player\'s turn', () => {
      render(
        <MultiplayerGameInfo
          {...defaultProps}
          playerRole="X"
          isMyTurn={true}
        />
      );

      const resetButton = screen.getByRole('button', { name: /reset|new game/i });
      expect(resetButton).not.toBeDisabled();
    });

    it('button is enabled during opponent\'s turn (always allow reset)', () => {
      render(
        <MultiplayerGameInfo
          {...defaultProps}
          playerRole="X"
          isMyTurn={false}
        />
      );

      const resetButton = screen.getByRole('button', { name: /reset|new game/i });
      expect(resetButton).not.toBeDisabled();
    });
  });

  describe('Combined States', () => {
    it('prioritizes game over states over turn indicators', () => {
      render(
        <MultiplayerGameInfo
          {...defaultProps}
          playerRole="X"
          winner="X"
          isMyTurn={true}
        />
      );

      expect(screen.getByText(/You win!/i)).toBeInTheDocument();
      expect(screen.queryByText(/Your turn/i)).not.toBeInTheDocument();
    });

    it('shows disconnection warning even when it\'s player\'s turn', () => {
      render(
        <MultiplayerGameInfo
          {...defaultProps}
          playerRole="X"
          isMyTurn={true}
          opponentConnected={false}
          playerOId="opponent-123"  // Opponent exists but disconnected
        />
      );

      expect(screen.getByText(/Opponent disconnected/i)).toBeInTheDocument();
      expect(screen.getByText(/Your turn/i)).toBeInTheDocument();
    });

    it('shows correct message when spectator and game is over', () => {
      render(
        <MultiplayerGameInfo
          {...defaultProps}
          playerRole="spectator"
          winner="X"
        />
      );

      expect(screen.getByText(/Player X wins!/i)).toBeInTheDocument();
    });
  });
});

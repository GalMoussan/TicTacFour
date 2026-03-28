import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RoomStatus } from './RoomStatus';

describe('RoomStatus', () => {
  // Mock clipboard API
  const mockWriteText = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    mockWriteText.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering - Basic Structure', () => {
    it('renders room code display', () => {
      render(
        <RoomStatus
          roomId="abc12345"
          playerRole="X"
          playerXId="player1"
          playerOId="player2"
          opponentConnected={true}
        />
      );

      expect(screen.getByText(/Room:/i)).toBeInTheDocument();
      expect(screen.getByText('abc12345')).toBeInTheDocument();
    });

    it('renders copy button', () => {
      render(
        <RoomStatus
          roomId="abc12345"
          playerRole="X"
          playerXId="player1"
          playerOId="player2"
          opponentConnected={true}
        />
      );

      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    it('renders player X status', () => {
      render(
        <RoomStatus
          roomId="abc12345"
          playerRole="X"
          playerXId="player1"
          playerOId="player2"
          opponentConnected={true}
        />
      );

      expect(screen.getByText(/Player X/i)).toBeInTheDocument();
    });

    it('renders player O status', () => {
      render(
        <RoomStatus
          roomId="abc12345"
          playerRole="X"
          playerXId="player1"
          playerOId="player2"
          opponentConnected={true}
        />
      );

      expect(screen.getByText(/Player O/i)).toBeInTheDocument();
    });
  });

  describe('Your Role Indicator', () => {
    it('shows "You" badge next to Player X when playerRole is X', () => {
      render(
        <RoomStatus
          roomId="abc12345"
          playerRole="X"
          playerXId="player1"
          playerOId="player2"
          opponentConnected={true}
        />
      );

      const playerXSection = screen.getByText(/Player X/i).closest('div');
      expect(playerXSection).toHaveTextContent(/You/i);
    });

    it('shows "You" badge next to Player O when playerRole is O', () => {
      render(
        <RoomStatus
          roomId="abc12345"
          playerRole="O"
          playerXId="player1"
          playerOId="player2"
          opponentConnected={true}
        />
      );

      const playerOSection = screen.getByText(/Player O/i).closest('div');
      expect(playerOSection).toHaveTextContent(/You/i);
    });

    it('does not show "You" badge when playerRole is spectator', () => {
      render(
        <RoomStatus
          roomId="abc12345"
          playerRole="spectator"
          playerXId="player1"
          playerOId="player2"
          opponentConnected={true}
        />
      );

      const playerXSection = screen.getByText(/Player X/i).closest('div');
      const playerOSection = screen.getByText(/Player O/i).closest('div');

      expect(playerXSection).not.toHaveTextContent(/You/i);
      expect(playerOSection).not.toHaveTextContent(/You/i);
    });

    it('does not show "You" badge when playerRole is null', () => {
      render(
        <RoomStatus
          roomId="abc12345"
          playerRole={null}
          playerXId="player1"
          playerOId="player2"
          opponentConnected={true}
        />
      );

      expect(screen.queryByText(/You/i)).not.toBeInTheDocument();
    });
  });

  describe('Connection Status Display', () => {
    it('shows connected status when playerXId is present', () => {
      render(
        <RoomStatus
          roomId="abc12345"
          playerRole="O"
          playerXId="player1"
          playerOId="player2"
          opponentConnected={true}
        />
      );

      const playerXSection = screen.getByText(/Player X/i).closest('div');
      expect(playerXSection).toHaveTextContent(/Connected/i);
    });

    it('shows waiting status when playerXId is null', () => {
      render(
        <RoomStatus
          roomId="abc12345"
          playerRole="O"
          playerXId={null}
          playerOId="player2"
          opponentConnected={false}
        />
      );

      const playerXSection = screen.getByText(/Player X/i).closest('div');
      expect(playerXSection).toHaveTextContent(/Waiting/i);
    });

    it('shows connected status when playerOId is present', () => {
      render(
        <RoomStatus
          roomId="abc12345"
          playerRole="X"
          playerXId="player1"
          playerOId="player2"
          opponentConnected={true}
        />
      );

      const playerOSection = screen.getByText(/Player O/i).closest('div');
      expect(playerOSection).toHaveTextContent(/Connected/i);
    });

    it('shows waiting status when playerOId is null', () => {
      render(
        <RoomStatus
          roomId="abc12345"
          playerRole="X"
          playerXId="player1"
          playerOId={null}
          opponentConnected={false}
        />
      );

      const playerOSection = screen.getByText(/Player O/i).closest('div');
      expect(playerOSection).toHaveTextContent(/Waiting/i);
    });
  });

  describe('Spectator Mode Display', () => {
    it('shows spectator indicator when playerRole is spectator', () => {
      render(
        <RoomStatus
          roomId="abc12345"
          playerRole="spectator"
          playerXId="player1"
          playerOId="player2"
          opponentConnected={true}
        />
      );

      expect(screen.getByText(/Spectating/i)).toBeInTheDocument();
    });

    it('does not show spectator indicator when playerRole is X', () => {
      render(
        <RoomStatus
          roomId="abc12345"
          playerRole="X"
          playerXId="player1"
          playerOId="player2"
          opponentConnected={true}
        />
      );

      expect(screen.queryByText(/Spectating/i)).not.toBeInTheDocument();
    });

    it('does not show spectator indicator when playerRole is O', () => {
      render(
        <RoomStatus
          roomId="abc12345"
          playerRole="O"
          playerXId="player1"
          playerOId="player2"
          opponentConnected={true}
        />
      );

      expect(screen.queryByText(/Spectating/i)).not.toBeInTheDocument();
    });
  });

  describe('Copy to Clipboard Functionality', () => {
    it('copies room URL to clipboard when copy button is clicked', async () => {
      const roomId = 'abc12345';
      const expectedUrl = `${window.location.origin}/room/${roomId}`;

      render(
        <RoomStatus
          roomId={roomId}
          playerRole="X"
          playerXId="player1"
          playerOId="player2"
          opponentConnected={true}
        />
      );

      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(expectedUrl);
      });
    });

    it('shows copy confirmation message after successful copy', async () => {
      render(
        <RoomStatus
          roomId="abc12345"
          playerRole="X"
          playerXId="player1"
          playerOId="player2"
          opponentConnected={true}
        />
      );

      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/Copied!/i)).toBeInTheDocument();
      });
    });

    it('hides copy confirmation message after 2 seconds', async () => {
      render(
        <RoomStatus
          roomId="abc12345"
          playerRole="X"
          playerXId="player1"
          playerOId="player2"
          opponentConnected={true}
        />
      );

      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      // Wait for the clipboard operation and state update
      await waitFor(() => {
        expect(screen.getByText(/Copied!/i)).toBeInTheDocument();
      });

      // Wait for the message to disappear (timeout is 2000ms in component)
      await waitFor(
        () => {
          expect(screen.queryByText(/Copied!/i)).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('handles clipboard copy errors gracefully', async () => {
      // Create a console.error spy to suppress the error log
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockWriteText.mockRejectedValue(new Error('Clipboard access denied'));

      render(
        <RoomStatus
          roomId="abc12345"
          playerRole="X"
          playerXId="player1"
          playerOId="player2"
          opponentConnected={true}
        />
      );

      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      // Give the component time to handle the error
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should have attempted to call writeText
      expect(mockWriteText).toHaveBeenCalled();

      // Should not show the confirmation message on error
      expect(screen.queryByText(/Copied!/i)).not.toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Visual Status Indicators', () => {
    it('applies green color class for connected player X', () => {
      render(
        <RoomStatus
          roomId="abc12345"
          playerRole="O"
          playerXId="player1"
          playerOId="player2"
          opponentConnected={true}
        />
      );

      const playerXSection = screen.getByText(/Player X/i).closest('div');
      const playerXStatus = playerXSection?.querySelector('.text-green-400');
      expect(playerXStatus).toBeInTheDocument();
      expect(playerXStatus?.className).toMatch(/green/i);
    });

    it('applies yellow color class for waiting player X', () => {
      render(
        <RoomStatus
          roomId="abc12345"
          playerRole="O"
          playerXId={null}
          playerOId="player2"
          opponentConnected={false}
        />
      );

      const playerXSection = screen.getByText(/Player X/i).closest('div');
      const playerXStatus = playerXSection?.querySelector('.text-yellow-400');
      expect(playerXStatus).toBeInTheDocument();
      expect(playerXStatus?.className).toMatch(/yellow/i);
    });

    it('applies green color class for connected player O', () => {
      render(
        <RoomStatus
          roomId="abc12345"
          playerRole="X"
          playerXId="player1"
          playerOId="player2"
          opponentConnected={true}
        />
      );

      const playerOSection = screen.getByText(/Player O/i).closest('div');
      const playerOStatus = playerOSection?.querySelector('.text-green-400');
      expect(playerOStatus).toBeInTheDocument();
      expect(playerOStatus?.className).toMatch(/green/i);
    });

    it('applies yellow color class for waiting player O', () => {
      render(
        <RoomStatus
          roomId="abc12345"
          playerRole="X"
          playerXId="player1"
          playerOId={null}
          opponentConnected={false}
        />
      );

      const playerOSection = screen.getByText(/Player O/i).closest('div');
      const playerOStatus = playerOSection?.querySelector('.text-yellow-400');
      expect(playerOStatus).toBeInTheDocument();
      expect(playerOStatus?.className).toMatch(/yellow/i);
    });
  });

  describe('Responsive Layout', () => {
    it('renders with compact design suitable for game header', () => {
      const { container } = render(
        <RoomStatus
          roomId="abc12345"
          playerRole="X"
          playerXId="player1"
          playerOId="player2"
          opponentConnected={true}
        />
      );

      // Check that component uses flex or grid layout
      const rootElement = container.firstChild as HTMLElement;
      expect(rootElement.className).toMatch(/flex|grid/);
    });
  });

  describe('Accessibility', () => {
    it('has accessible button text for copy action', () => {
      render(
        <RoomStatus
          roomId="abc12345"
          playerRole="X"
          playerXId="player1"
          playerOId="player2"
          opponentConnected={true}
        />
      );

      const copyButton = screen.getByRole('button', { name: /copy/i });
      expect(copyButton).toBeInTheDocument();
    });

    it('provides clear text labels for status indicators', () => {
      render(
        <RoomStatus
          roomId="abc12345"
          playerRole="X"
          playerXId="player1"
          playerOId={null}
          opponentConnected={false}
        />
      );

      expect(screen.getByText(/Player X/i)).toBeInTheDocument();
      expect(screen.getByText(/Player O/i)).toBeInTheDocument();
      expect(screen.getByText(/Connected/i)).toBeInTheDocument();
      expect(screen.getByText(/Waiting/i)).toBeInTheDocument();
    });
  });
});

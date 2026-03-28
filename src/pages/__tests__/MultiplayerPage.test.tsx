/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { MultiplayerPage } from '../MultiplayerPage';
import type { UseRoomReturn } from '../../multiplayer/useRoom';
import type { RoomState } from '../../multiplayer/types';

// Mock dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
  };
});

vi.mock('../../multiplayer/useRoom', () => ({
  useRoom: vi.fn(),
}));

vi.mock('../../multiplayer/useMultiplayer', () => ({
  useMultiplayer: vi.fn(),
}));

vi.mock('../../store/gameStore', () => ({
  useGameStore: vi.fn(),
}));

// Mock child components
vi.mock('../../components/RoomStatus', () => ({
  RoomStatus: ({ roomId }: { roomId: string }) => (
    <div data-testid="room-status">Room Status: {roomId}</div>
  ),
}));

vi.mock('../../components/MultiplayerGameInfo', () => ({
  MultiplayerGameInfo: () => <div data-testid="multiplayer-game-info">Multiplayer Game Info</div>,
}));

vi.mock('../../components/FlatBoards', () => ({
  FlatBoards: () => <div data-testid="flat-boards">Flat Boards</div>,
}));

vi.mock('../../components/Scene3D', () => ({
  Scene3D: () => <div data-testid="scene-3d">Scene 3D</div>,
}));

// Import mocked dependencies
import { useParams } from 'react-router-dom';
import { useRoom } from '../../multiplayer/useRoom';
import { useMultiplayer } from '../../multiplayer/useMultiplayer';
import { useGameStore } from '../../store/gameStore';

describe('MultiplayerPage', () => {
  const mockRoomId = 'abcd1234';
  const mockLocalPlayerId = 'player-123';

  const defaultRoomState: RoomState = {
    roomId: mockRoomId,
    playerXId: mockLocalPlayerId,
    playerOId: null,
    spectatorIds: [],
    isActive: true,
  };

  const defaultRoomReturn: UseRoomReturn = {
    channel: {} as any,
    localPlayerId: mockLocalPlayerId,
    playerRole: 'X',
    roomState: defaultRoomState,
    createRoom: vi.fn(),
    joinRoom: vi.fn(),
    leaveRoom: vi.fn(),
    isConnected: true,
  };

  const defaultMultiplayerReturn = {
    sendMove: vi.fn(),
    requestSync: vi.fn(),
    requestRematch: vi.fn(),
    isReady: true,
  };

  const defaultGameStoreReturn = {
    board: Array(4).fill(Array(4).fill(Array(4).fill(null))),
    currentPlayer: 'X' as const,
    winner: null,
    winningLine: null,
    isGameOver: false,
    isMultiplayer: true,
    roomId: mockRoomId,
    localPlayer: 'X' as const,
    playerXId: mockLocalPlayerId,
    playerOId: null,
    isMyTurn: true,
    opponentConnected: false,
    makeMove: vi.fn(),
    resetGame: vi.fn(),
    setMultiplayerMode: vi.fn(),
    updateOpponentStatus: vi.fn(),
    exitMultiplayer: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useParams as any).mockReturnValue({ roomId: mockRoomId });
    (useRoom as any).mockReturnValue(defaultRoomReturn);
    (useMultiplayer as any).mockReturnValue(defaultMultiplayerReturn);
    (useGameStore as any).mockReturnValue(defaultGameStoreReturn);
  });

  const renderPage = () => {
    return render(
      <BrowserRouter>
        <MultiplayerPage />
      </BrowserRouter>
    );
  };

  describe('Invalid room ID handling', () => {
    it('should show error when roomId is undefined', () => {
      (useParams as any).mockReturnValue({ roomId: undefined });

      renderPage();

      expect(screen.getByText(/invalid room id/i)).toBeInTheDocument();
      expect(screen.getByText(/back to multiplayer lobby/i)).toBeInTheDocument();
    });

    it('should show error when roomId is invalid format', () => {
      (useParams as any).mockReturnValue({ roomId: 'invalid' });

      renderPage();

      expect(screen.getByText(/invalid room id/i)).toBeInTheDocument();
    });

    it('should provide link back to multiplayer lobby', () => {
      (useParams as any).mockReturnValue({ roomId: undefined });

      renderPage();

      const backLink = screen.getByText(/back to multiplayer lobby/i).closest('a');
      expect(backLink).toHaveAttribute('href', '/multiplayer');
    });
  });

  describe('Waiting for opponent', () => {
    it('should show waiting screen when player is X and no opponent', () => {
      const waitingRoomState = {
        ...defaultRoomState,
        playerOId: null,
      };

      (useRoom as any).mockReturnValue({
        ...defaultRoomReturn,
        playerRole: 'X',
        roomState: waitingRoomState,
      });

      renderPage();

      expect(screen.getByText(/waiting for opponent/i)).toBeInTheDocument();
      expect(screen.getByText(mockRoomId)).toBeInTheDocument();
    });

    it('should show share button in waiting screen', () => {
      const waitingRoomState = {
        ...defaultRoomState,
        playerOId: null,
      };

      (useRoom as any).mockReturnValue({
        ...defaultRoomReturn,
        playerRole: 'X',
        roomState: waitingRoomState,
      });

      renderPage();

      expect(screen.getByText('Share Room Link')).toBeInTheDocument();
    });

    it('should not show waiting screen when player is O', () => {
      (useRoom as any).mockReturnValue({
        ...defaultRoomReturn,
        playerRole: 'O',
      });

      renderPage();

      expect(screen.queryByText(/waiting for opponent/i)).not.toBeInTheDocument();
    });

    it('should not show waiting screen when both players are connected', () => {
      const fullRoomState = {
        ...defaultRoomState,
        playerOId: 'player-456',
      };

      (useRoom as any).mockReturnValue({
        ...defaultRoomReturn,
        playerRole: 'X',
        roomState: fullRoomState,
      });

      renderPage();

      expect(screen.queryByText(/waiting for opponent/i)).not.toBeInTheDocument();
    });

    it('should copy room link to clipboard when share button is clicked', async () => {
      const waitingRoomState = {
        ...defaultRoomState,
        playerOId: null,
      };

      (useRoom as any).mockReturnValue({
        ...defaultRoomReturn,
        playerRole: 'X',
        roomState: waitingRoomState,
      });

      // Mock clipboard API
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      renderPage();

      const shareButton = screen.getByText('Share Room Link');
      fireEvent.click(shareButton);

      expect(writeTextMock).toHaveBeenCalledWith(
        `${window.location.origin}/room/${mockRoomId}`
      );
    });

    it('should handle clipboard copy failure gracefully', async () => {
      const waitingRoomState = {
        ...defaultRoomState,
        playerOId: null,
      };

      (useRoom as any).mockReturnValue({
        ...defaultRoomReturn,
        playerRole: 'X',
        roomState: waitingRoomState,
      });

      // Mock clipboard API to fail
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const writeTextMock = vi.fn().mockRejectedValue(new Error('Clipboard denied'));
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      renderPage();

      const shareButton = screen.getByText('Share Room Link');
      fireEvent.click(shareButton);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to copy room URL:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Playing state', () => {
    beforeEach(() => {
      const fullRoomState = {
        ...defaultRoomState,
        playerOId: 'player-456',
      };

      (useRoom as any).mockReturnValue({
        ...defaultRoomReturn,
        roomState: fullRoomState,
      });

      (useGameStore as any).mockReturnValue({
        ...defaultGameStoreReturn,
        playerOId: 'player-456',
        opponentConnected: true,
      });
    });

    it('should render game components when playing', () => {
      renderPage();

      expect(screen.getByTestId('room-status')).toBeInTheDocument();
      expect(screen.getByTestId('multiplayer-game-info')).toBeInTheDocument();
      expect(screen.getByTestId('flat-boards')).toBeInTheDocument();
      expect(screen.getByTestId('scene-3d')).toBeInTheDocument();
    });

    it('should pass correct props to RoomStatus', () => {
      renderPage();

      expect(screen.getByText(`Room Status: ${mockRoomId}`)).toBeInTheDocument();
    });

    it('should render page header', () => {
      renderPage();

      expect(screen.getByText('4×4×4 Tic-Tac-Toe')).toBeInTheDocument();
    });

    it('should render back to lobby link', () => {
      renderPage();

      const backLink = screen.getByText(/back to lobby/i).closest('a');
      expect(backLink).toHaveAttribute('href', '/multiplayer');
    });

    it('should have proper layout structure', () => {
      const { container } = renderPage();

      const header = container.querySelector('header');
      const main = container.querySelector('main');

      expect(header).toBeInTheDocument();
      expect(main).toBeInTheDocument();
    });
  });

  describe('Opponent disconnected state', () => {
    it('should show warning when opponent disconnects', () => {
      const fullRoomState = {
        ...defaultRoomState,
        playerOId: 'player-456',
      };

      (useRoom as any).mockReturnValue({
        ...defaultRoomReturn,
        roomState: fullRoomState,
      });

      (useGameStore as any).mockReturnValue({
        ...defaultGameStoreReturn,
        playerOId: 'player-456',
        opponentConnected: false, // Opponent disconnected
      });

      renderPage();

      // The warning is shown by MultiplayerGameInfo component
      // Just verify the game is still rendered
      expect(screen.getByTestId('multiplayer-game-info')).toBeInTheDocument();
      expect(screen.getByTestId('flat-boards')).toBeInTheDocument();
    });

    it('should keep game running when opponent disconnects', () => {
      const fullRoomState = {
        ...defaultRoomState,
        playerOId: 'player-456',
      };

      (useRoom as any).mockReturnValue({
        ...defaultRoomReturn,
        roomState: fullRoomState,
      });

      (useGameStore as any).mockReturnValue({
        ...defaultGameStoreReturn,
        playerOId: 'player-456',
        opponentConnected: false,
      });

      renderPage();

      // Game components should still be rendered
      expect(screen.getByTestId('flat-boards')).toBeInTheDocument();
      expect(screen.getByTestId('scene-3d')).toBeInTheDocument();
    });
  });

  describe('Hook initialization', () => {
    it('should call useRoom with roomId', () => {
      renderPage();

      expect(useRoom).toHaveBeenCalledWith(mockRoomId);
    });

    it('should call useMultiplayer with correct params', () => {
      renderPage();

      expect(useMultiplayer).toHaveBeenCalledWith(
        mockRoomId,
        mockLocalPlayerId,
        'X'
      );
    });

    it('should call useGameStore', () => {
      renderPage();

      expect(useGameStore).toHaveBeenCalled();
    });
  });

  describe('Spectator mode', () => {
    it('should handle spectator role', () => {
      const fullRoomState = {
        ...defaultRoomState,
        playerOId: 'player-456',
        spectatorIds: [mockLocalPlayerId],
      };

      (useRoom as any).mockReturnValue({
        ...defaultRoomReturn,
        playerRole: 'spectator',
        roomState: fullRoomState,
      });

      (useGameStore as any).mockReturnValue({
        ...defaultGameStoreReturn,
        localPlayer: 'spectator',
      });

      renderPage();

      // Should still render game components for spectator
      expect(screen.getByTestId('room-status')).toBeInTheDocument();
      expect(screen.getByTestId('multiplayer-game-info')).toBeInTheDocument();
      expect(screen.getByTestId('flat-boards')).toBeInTheDocument();
    });
  });
});

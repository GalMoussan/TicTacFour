import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RoomLobby } from './RoomLobby';
import { useRoom } from '../multiplayer/useRoom';
import { validateRoomId } from '../multiplayer/utils';
import { useNavigate } from 'react-router-dom';

// Mock dependencies
vi.mock('../multiplayer/useRoom');
vi.mock('../multiplayer/utils');
vi.mock('../multiplayer/ably-client', () => ({
  ablyClient: {
    channels: {
      get: vi.fn(),
    },
  },
}));
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

describe('RoomLobby', () => {
  const mockNavigate = vi.fn();
  const mockCreateRoom = vi.fn();
  const mockJoinRoom = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(useRoom).mockReturnValue({
      createRoom: mockCreateRoom,
      joinRoom: mockJoinRoom,
      channel: null,
      localPlayerId: 'test-player-id',
      playerRole: null,
      roomState: {
        roomId: '',
        playerXId: null,
        playerOId: null,
        spectatorIds: [],
        isActive: false,
      },
      leaveRoom: vi.fn(),
      isConnected: false,
    });
  });

  describe('Rendering', () => {
    it('renders the room lobby with all elements', () => {
      render(<RoomLobby />);

      expect(screen.getByText(/Room Lobby/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create Room/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Enter room ID/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Join$/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Back to Home/i })).toBeInTheDocument();
    });
  });

  describe('Create Room', () => {
    it('creates a room and navigates when create button is clicked', async () => {
      const roomId = 'abc12345';
      mockCreateRoom.mockResolvedValue(roomId);

      render(<RoomLobby />);

      const createButton = screen.getByRole('button', { name: /Create Room/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockCreateRoom).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith(`/room/${roomId}`);
      });
    });

    it('shows loading state during room creation', async () => {
      mockCreateRoom.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('abc12345'), 100)));

      render(<RoomLobby />);

      const createButton = screen.getByRole('button', { name: /Create Room/i });
      fireEvent.click(createButton);

      expect(screen.getByText(/Creating.../i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText(/Creating.../i)).not.toBeInTheDocument();
      });
    });

    it('handles room creation errors', async () => {
      mockCreateRoom.mockRejectedValue(new Error('Failed to create room'));

      render(<RoomLobby />);

      const createButton = screen.getByRole('button', { name: /Create Room/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to create room/i)).toBeInTheDocument();
      });
    });
  });

  describe('Join Room', () => {
    it('joins a room with valid ID and navigates', async () => {
      const roomId = 'valid123';
      vi.mocked(validateRoomId).mockReturnValue(true);
      mockJoinRoom.mockResolvedValue(undefined);

      render(<RoomLobby />);

      const input = screen.getByPlaceholderText(/Enter room ID/i);
      const joinButton = screen.getByRole('button', { name: /^Join$/i });

      fireEvent.change(input, { target: { value: roomId } });
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(validateRoomId).toHaveBeenCalledWith(roomId);
        expect(mockJoinRoom).toHaveBeenCalledWith(roomId);
        expect(mockNavigate).toHaveBeenCalledWith(`/room/${roomId}`);
      });
    });

    it('shows validation error for invalid room ID', async () => {
      vi.mocked(validateRoomId).mockReturnValue(false);

      render(<RoomLobby />);

      const input = screen.getByPlaceholderText(/Enter room ID/i);
      const joinButton = screen.getByRole('button', { name: /^Join$/i });

      fireEvent.change(input, { target: { value: 'invalid' } });
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid room ID/i)).toBeInTheDocument();
        expect(mockJoinRoom).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    it('shows validation error for empty room ID', async () => {
      render(<RoomLobby />);

      const joinButton = screen.getByRole('button', { name: /^Join$/i });
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText(/Please enter a room ID/i)).toBeInTheDocument();
        expect(mockJoinRoom).not.toHaveBeenCalled();
      });
    });

    it('shows loading state during room join', async () => {
      const roomId = 'valid123';
      vi.mocked(validateRoomId).mockReturnValue(true);
      mockJoinRoom.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<RoomLobby />);

      const input = screen.getByPlaceholderText(/Enter room ID/i);
      const joinButton = screen.getByRole('button', { name: /^Join$/i });

      fireEvent.change(input, { target: { value: roomId } });
      fireEvent.click(joinButton);

      expect(screen.getByText(/Joining.../i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText(/Joining.../i)).not.toBeInTheDocument();
      });
    });

    it('handles room join errors', async () => {
      const roomId = 'valid123';
      vi.mocked(validateRoomId).mockReturnValue(true);
      mockJoinRoom.mockRejectedValue(new Error('Room not found'));

      render(<RoomLobby />);

      const input = screen.getByPlaceholderText(/Enter room ID/i);
      const joinButton = screen.getByRole('button', { name: /^Join$/i });

      fireEvent.change(input, { target: { value: roomId } });
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText(/Room not found/i)).toBeInTheDocument();
      });
    });

    it('clears input after successful join', async () => {
      const roomId = 'valid123';
      vi.mocked(validateRoomId).mockReturnValue(true);
      mockJoinRoom.mockResolvedValue(undefined);

      render(<RoomLobby />);

      const input = screen.getByPlaceholderText(/Enter room ID/i) as HTMLInputElement;
      const joinButton = screen.getByRole('button', { name: /^Join$/i });

      fireEvent.change(input, { target: { value: roomId } });
      expect(input.value).toBe(roomId);

      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });
  });

  describe('Error Handling', () => {
    it('clears error message when user starts typing', async () => {
      vi.mocked(validateRoomId).mockReturnValue(false);

      render(<RoomLobby />);

      const input = screen.getByPlaceholderText(/Enter room ID/i);
      const joinButton = screen.getByRole('button', { name: /^Join$/i });

      // Trigger validation error
      fireEvent.change(input, { target: { value: 'invalid' } });
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid room ID/i)).toBeInTheDocument();
      });

      // Start typing again
      fireEvent.change(input, { target: { value: 'new' } });

      expect(screen.queryByText(/Invalid room ID/i)).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Interactions', () => {
    it('joins room when Enter key is pressed in input field', async () => {
      const roomId = 'valid123';
      vi.mocked(validateRoomId).mockReturnValue(true);
      mockJoinRoom.mockResolvedValue(undefined);

      render(<RoomLobby />);

      const input = screen.getByPlaceholderText(/Enter room ID/i);

      fireEvent.change(input, { target: { value: roomId } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

      await waitFor(() => {
        expect(mockJoinRoom).toHaveBeenCalledWith(roomId);
        expect(mockNavigate).toHaveBeenCalledWith(`/room/${roomId}`);
      });
    });
  });

  describe('Navigation', () => {
    it('provides a link back to home', () => {
      render(<RoomLobby />);

      const homeLink = screen.getByRole('link', { name: /Back to Home/i });
      expect(homeLink).toHaveAttribute('href', '/');
    });
  });
});

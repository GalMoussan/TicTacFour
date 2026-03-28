import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameInfo } from '../GameInfo';
import { useGameStore } from '../../store/gameStore';
import type { Board, Player, Position } from '../../game/types';

// Mock the store
vi.mock('../../store/gameStore');

type GameStore = {
  board: Board;
  currentPlayer: Player;
  winner: Player;
  winningLine: Position[] | null;
  isGameOver: boolean;
  isMultiplayer: boolean;
  roomId: string | null;
  localPlayer: 'X' | 'O' | 'spectator' | null;
  playerXId: string | null;
  playerOId: string | null;
  isMyTurn: boolean;
  opponentConnected: boolean;
  makeMove: (z: number, y: number, x: number, isOpponentMove?: boolean) => void;
  resetGame: () => void;
  setMultiplayerMode: (config: {
    roomId: string;
    localPlayer: 'X' | 'O' | 'spectator';
    playerXId: string;
    playerOId: string | null;
  }) => void;
  updateOpponentStatus: (connected: boolean) => void;
  exitMultiplayer: () => void;
};

describe('GameInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays current player when game is active', () => {
    vi.mocked(useGameStore).mockReturnValue({
      currentPlayer: 'X',
      winner: null,
      isGameOver: false,
      resetGame: vi.fn(),
      board: [],
      winningLine: null,
      makeMove: vi.fn(),
      isMultiplayer: false,
      roomId: null,
      localPlayer: null,
      playerXId: null,
      playerOId: null,
      isMyTurn: false,
      opponentConnected: false,
      setMultiplayerMode: vi.fn(),
      updateOpponentStatus: vi.fn(),
      exitMultiplayer: vi.fn(),
    } as GameStore);

    render(<GameInfo />);

    expect(screen.getByText(/Current Player:/)).toBeInTheDocument();
    expect(screen.getByText('X')).toBeInTheDocument();
  });

  it('displays winner message when game is won', () => {
    vi.mocked(useGameStore).mockReturnValue({
      currentPlayer: 'X',
      winner: 'X',
      isGameOver: true,
      resetGame: vi.fn(),
      board: [],
      winningLine: null,
      makeMove: vi.fn(),
      isMultiplayer: false,
      roomId: null,
      localPlayer: null,
      playerXId: null,
      playerOId: null,
      isMyTurn: false,
      opponentConnected: false,
      setMultiplayerMode: vi.fn(),
      updateOpponentStatus: vi.fn(),
      exitMultiplayer: vi.fn(),
    } as GameStore);

    render(<GameInfo />);

    expect(screen.getByText(/Player X Wins!/)).toBeInTheDocument();
  });

  it('displays draw message when game is drawn', () => {
    vi.mocked(useGameStore).mockReturnValue({
      currentPlayer: 'X',
      winner: null,
      isGameOver: true,
      resetGame: vi.fn(),
      board: [],
      winningLine: null,
      makeMove: vi.fn(),
      isMultiplayer: false,
      roomId: null,
      localPlayer: null,
      playerXId: null,
      playerOId: null,
      isMyTurn: false,
      opponentConnected: false,
      setMultiplayerMode: vi.fn(),
      updateOpponentStatus: vi.fn(),
      exitMultiplayer: vi.fn(),
    } as GameStore);

    render(<GameInfo />);

    expect(screen.getByText(/It's a Draw!/)).toBeInTheDocument();
  });

  it('calls resetGame when reset button is clicked', () => {
    const resetGame = vi.fn();
    vi.mocked(useGameStore).mockReturnValue({
      currentPlayer: 'X',
      winner: null,
      isGameOver: false,
      resetGame,
      board: [],
      winningLine: null,
      makeMove: vi.fn(),
      isMultiplayer: false,
      roomId: null,
      localPlayer: null,
      playerXId: null,
      playerOId: null,
      isMyTurn: false,
      opponentConnected: false,
      setMultiplayerMode: vi.fn(),
      updateOpponentStatus: vi.fn(),
      exitMultiplayer: vi.fn(),
    } as GameStore);

    render(<GameInfo />);

    const resetButton = screen.getByText('Reset Game');
    fireEvent.click(resetButton);

    expect(resetGame).toHaveBeenCalledTimes(1);
  });
});

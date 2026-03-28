import { create } from 'zustand';
import type { Board, Player, Position } from '../game/types';
import { createEmptyBoard, makeMove as makeMoveLogic, checkWin, isDraw } from '../game/logic';

interface GameState {
  board: Board;
  currentPlayer: Player;
  winner: Player;
  winningLine: Position[] | null;
  isGameOver: boolean;
  // Multiplayer state
  isMultiplayer: boolean;
  roomId: string | null;
  localPlayer: 'X' | 'O' | 'spectator' | null;
  playerXId: string | null;
  playerOId: string | null;
  isMyTurn: boolean;
  opponentConnected: boolean;
}

interface GameActions {
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
}

type GameStore = GameState & GameActions;

const initialState: GameState = {
  board: createEmptyBoard(),
  currentPlayer: 'X',
  winner: null,
  winningLine: null,
  isGameOver: false,
  // Multiplayer state defaults
  isMultiplayer: false,
  roomId: null,
  localPlayer: null,
  playerXId: null,
  playerOId: null,
  isMyTurn: false,
  opponentConnected: false,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  makeMove: (z: number, y: number, x: number, isOpponentMove = false) => {
    const state = get();
    const { board, currentPlayer, isGameOver, isMultiplayer, localPlayer, isMyTurn } = state;

    // Check if cell is already occupied
    const currentValue = board[z][y][x];
    if (currentValue !== null) {
      return; // Return gracefully instead of throwing error
    }

    // Don't allow moves if game is over
    if (isGameOver) {
      return;
    }

    // In multiplayer mode, validate it's the local player's turn
    // UNLESS this is an opponent's move being applied
    if (isMultiplayer && !isOpponentMove) {
      if (localPlayer === null) {
        return;
      }
      if (localPlayer === 'spectator') {
        return;
      }
      if (!isMyTurn || currentPlayer !== localPlayer) {
        return;
      }
    }

    // Make the move immutably
    const newBoard = makeMoveLogic(board, z, y, x, currentPlayer);

    // Check for a winner
    const winResult = checkWin(newBoard);

    // Calculate next player
    const nextPlayer: Player = currentPlayer === 'X' ? 'O' : 'X';
    const nextIsMyTurn = isMultiplayer ? nextPlayer === localPlayer : false;

    if (winResult) {
      // We have a winner
      set({
        board: newBoard,
        winner: winResult.winner,
        winningLine: winResult.line,
        isGameOver: true,
        isMyTurn: false,
      });
    } else if (isDraw(newBoard)) {
      // Game is a draw
      set({
        board: newBoard,
        isGameOver: true,
        isMyTurn: false,
      });
    } else {
      // Continue game with next player
      set({
        board: newBoard,
        currentPlayer: nextPlayer,
        isMyTurn: nextIsMyTurn,
      });
    }
  },

  resetGame: () => {
    const { isMultiplayer, localPlayer } = get();

    set({
      board: createEmptyBoard(),
      currentPlayer: 'X',
      winner: null,
      winningLine: null,
      isGameOver: false,
      // In multiplayer mode, reset isMyTurn based on localPlayer
      isMyTurn: isMultiplayer ? localPlayer === 'X' : false,
    });
  },

  setMultiplayerMode: (config: {
    roomId: string;
    localPlayer: 'X' | 'O' | 'spectator';
    playerXId: string;
    playerOId: string | null;
  }) => {
    set({
      isMultiplayer: true,
      roomId: config.roomId,
      localPlayer: config.localPlayer,
      playerXId: config.playerXId,
      playerOId: config.playerOId,
      isMyTurn: config.localPlayer === 'X',
      opponentConnected: config.playerOId !== null,
    });
  },

  updateOpponentStatus: (connected: boolean) => {
    set({
      opponentConnected: connected,
    });
  },

  exitMultiplayer: () => {
    set({
      isMultiplayer: false,
      roomId: null,
      localPlayer: null,
      playerXId: null,
      playerOId: null,
      isMyTurn: false,
      opponentConnected: false,
    });
  },
}));

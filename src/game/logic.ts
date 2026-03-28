import type { Board, Player, WinResult } from './types';
import { ALL_LINES } from './constants';

/**
 * Creates an empty 4×4×4 board.
 * Board indexing is [z][y][x] where z=0 is the bottom layer.
 */
export function createEmptyBoard(): Board {
  return Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () =>
      Array.from({ length: 4 }, () => null)
    )
  );
}

/**
 * Makes a move on the board immutably.
 * Returns a new board with the move applied.
 * @param board - Current board state
 * @param z - Layer index (0-3, where 0 is bottom)
 * @param y - Row index (0-3)
 * @param x - Column index (0-3)
 * @param player - Player making the move ('X' or 'O')
 * @returns New board with the move applied
 */
export function makeMove(
  board: Board,
  z: number,
  y: number,
  x: number,
  player: Player
): Board {
  // Create a deep copy of the board using structuredClone
  const newBoard = structuredClone(board);

  // Make the move on the new board
  newBoard[z][y][x] = player;

  return newBoard;
}

/**
 * Checks if there is a winner on the board.
 * @param board - Current board state
 * @returns WinResult with winner and winning line, or null if no winner
 */
export function checkWin(board: Board): WinResult {
  for (const line of ALL_LINES) {
    const [pos1, pos2, pos3, pos4] = line;
    const [z1, y1, x1] = pos1;
    const [z2, y2, x2] = pos2;
    const [z3, y3, x3] = pos3;
    const [z4, y4, x4] = pos4;

    const cell1 = board[z1][y1][x1];
    const cell2 = board[z2][y2][x2];
    const cell3 = board[z3][y3][x3];
    const cell4 = board[z4][y4][x4];

    // Check if all four cells are the same and not null
    if (
      cell1 !== null &&
      cell1 === cell2 &&
      cell1 === cell3 &&
      cell1 === cell4
    ) {
      return {
        winner: cell1,
        line: line,
      };
    }
  }

  return null;
}

/**
 * Checks if the game is a draw (board is full with no winner).
 * @param board - Current board state
 * @returns True if the game is a draw, false otherwise
 */
export function isDraw(board: Board): boolean {
  // If there's a winner, it's not a draw
  if (checkWin(board) !== null) {
    return false;
  }

  // Check if all cells are filled
  for (let z = 0; z < 4; z++) {
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        if (board[z][y][x] === null) {
          return false; // Found an empty cell
        }
      }
    }
  }

  return true; // Board is full and no winner
}

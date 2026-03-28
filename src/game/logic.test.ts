import { describe, it, expect, beforeEach } from 'vitest';
import { createEmptyBoard, makeMove, checkWin, isDraw } from './logic';
import type { Board } from './types';

describe('Game Logic', () => {
  let board: Board;

  beforeEach(() => {
    board = createEmptyBoard();
  });

  describe('createEmptyBoard', () => {
    it('should create a 4x4x4 board filled with nulls', () => {
      expect(board).toHaveLength(4);
      expect(board[0]).toHaveLength(4);
      expect(board[0][0]).toHaveLength(4);
      expect(board[0][0][0]).toBeNull();
      expect(board[3][3][3]).toBeNull();
    });
  });

  describe('makeMove', () => {
    it('should make a move immutably', () => {
      const newBoard = makeMove(board, 0, 0, 0, 'X');
      expect(newBoard[0][0][0]).toBe('X');
      expect(board[0][0][0]).toBeNull(); // Original board unchanged
    });

    it('should allow multiple moves', () => {
      let newBoard = makeMove(board, 0, 0, 0, 'X');
      newBoard = makeMove(newBoard, 1, 1, 1, 'O');
      newBoard = makeMove(newBoard, 2, 2, 2, 'X');

      expect(newBoard[0][0][0]).toBe('X');
      expect(newBoard[1][1][1]).toBe('O');
      expect(newBoard[2][2][2]).toBe('X');
    });
  });

  describe('checkWin - X-axis (horizontal rows)', () => {
    it('should detect X-axis win on layer 0, row 0', () => {
      board = makeMove(board, 0, 0, 0, 'X');
      board = makeMove(board, 0, 0, 1, 'X');
      board = makeMove(board, 0, 0, 2, 'X');
      board = makeMove(board, 0, 0, 3, 'X');

      const result = checkWin(board);
      expect(result).not.toBeNull();
      expect(result?.winner).toBe('X');
      expect(result?.line).toEqual([
        [0, 0, 0],
        [0, 0, 1],
        [0, 0, 2],
        [0, 0, 3],
      ]);
    });

    it('should detect X-axis win on layer 2, row 3', () => {
      board = makeMove(board, 2, 3, 0, 'O');
      board = makeMove(board, 2, 3, 1, 'O');
      board = makeMove(board, 2, 3, 2, 'O');
      board = makeMove(board, 2, 3, 3, 'O');

      const result = checkWin(board);
      expect(result).not.toBeNull();
      expect(result?.winner).toBe('O');
      expect(result?.line).toEqual([
        [2, 3, 0],
        [2, 3, 1],
        [2, 3, 2],
        [2, 3, 3],
      ]);
    });
  });

  describe('checkWin - Y-axis (vertical columns)', () => {
    it('should detect Y-axis win on layer 1, column x=2', () => {
      board = makeMove(board, 1, 0, 2, 'X');
      board = makeMove(board, 1, 1, 2, 'X');
      board = makeMove(board, 1, 2, 2, 'X');
      board = makeMove(board, 1, 3, 2, 'X');

      const result = checkWin(board);
      expect(result).not.toBeNull();
      expect(result?.winner).toBe('X');
      expect(result?.line).toEqual([
        [1, 0, 2],
        [1, 1, 2],
        [1, 2, 2],
        [1, 3, 2],
      ]);
    });
  });

  describe('checkWin - Z-axis (through layers)', () => {
    it('should detect Z-axis win at position (y=1, x=1)', () => {
      board = makeMove(board, 0, 1, 1, 'O');
      board = makeMove(board, 1, 1, 1, 'O');
      board = makeMove(board, 2, 1, 1, 'O');
      board = makeMove(board, 3, 1, 1, 'O');

      const result = checkWin(board);
      expect(result).not.toBeNull();
      expect(result?.winner).toBe('O');
      expect(result?.line).toEqual([
        [0, 1, 1],
        [1, 1, 1],
        [2, 1, 1],
        [3, 1, 1],
      ]);
    });

    it('should detect Z-axis win at corner position (y=3, x=3)', () => {
      board = makeMove(board, 0, 3, 3, 'X');
      board = makeMove(board, 1, 3, 3, 'X');
      board = makeMove(board, 2, 3, 3, 'X');
      board = makeMove(board, 3, 3, 3, 'X');

      const result = checkWin(board);
      expect(result).not.toBeNull();
      expect(result?.winner).toBe('X');
      expect(result?.line).toEqual([
        [0, 3, 3],
        [1, 3, 3],
        [2, 3, 3],
        [3, 3, 3],
      ]);
    });
  });

  describe('checkWin - Face diagonals', () => {
    it('should detect XY-plane diagonal on layer 0 (main diagonal)', () => {
      board = makeMove(board, 0, 0, 0, 'X');
      board = makeMove(board, 0, 1, 1, 'X');
      board = makeMove(board, 0, 2, 2, 'X');
      board = makeMove(board, 0, 3, 3, 'X');

      const result = checkWin(board);
      expect(result).not.toBeNull();
      expect(result?.winner).toBe('X');
      expect(result?.line).toEqual([
        [0, 0, 0],
        [0, 1, 1],
        [0, 2, 2],
        [0, 3, 3],
      ]);
    });

    it('should detect XY-plane anti-diagonal on layer 3', () => {
      board = makeMove(board, 3, 0, 3, 'O');
      board = makeMove(board, 3, 1, 2, 'O');
      board = makeMove(board, 3, 2, 1, 'O');
      board = makeMove(board, 3, 3, 0, 'O');

      const result = checkWin(board);
      expect(result).not.toBeNull();
      expect(result?.winner).toBe('O');
      expect(result?.line).toEqual([
        [3, 0, 3],
        [3, 1, 2],
        [3, 2, 1],
        [3, 3, 0],
      ]);
    });

    it('should detect XZ-plane diagonal at y=2', () => {
      board = makeMove(board, 0, 2, 0, 'X');
      board = makeMove(board, 1, 2, 1, 'X');
      board = makeMove(board, 2, 2, 2, 'X');
      board = makeMove(board, 3, 2, 3, 'X');

      const result = checkWin(board);
      expect(result).not.toBeNull();
      expect(result?.winner).toBe('X');
      expect(result?.line).toEqual([
        [0, 2, 0],
        [1, 2, 1],
        [2, 2, 2],
        [3, 2, 3],
      ]);
    });

    it('should detect YZ-plane diagonal at x=0', () => {
      board = makeMove(board, 0, 0, 0, 'O');
      board = makeMove(board, 1, 1, 0, 'O');
      board = makeMove(board, 2, 2, 0, 'O');
      board = makeMove(board, 3, 3, 0, 'O');

      const result = checkWin(board);
      expect(result).not.toBeNull();
      expect(result?.winner).toBe('O');
      expect(result?.line).toEqual([
        [0, 0, 0],
        [1, 1, 0],
        [2, 2, 0],
        [3, 3, 0],
      ]);
    });
  });

  describe('checkWin - Space diagonals', () => {
    it('should detect space diagonal from (0,0,0) to (3,3,3)', () => {
      board = makeMove(board, 0, 0, 0, 'X');
      board = makeMove(board, 1, 1, 1, 'X');
      board = makeMove(board, 2, 2, 2, 'X');
      board = makeMove(board, 3, 3, 3, 'X');

      const result = checkWin(board);
      expect(result).not.toBeNull();
      expect(result?.winner).toBe('X');
      expect(result?.line).toEqual([
        [0, 0, 0],
        [1, 1, 1],
        [2, 2, 2],
        [3, 3, 3],
      ]);
    });

    it('should detect space diagonal from (0,0,3) to (3,3,0)', () => {
      board = makeMove(board, 0, 0, 3, 'O');
      board = makeMove(board, 1, 1, 2, 'O');
      board = makeMove(board, 2, 2, 1, 'O');
      board = makeMove(board, 3, 3, 0, 'O');

      const result = checkWin(board);
      expect(result).not.toBeNull();
      expect(result?.winner).toBe('O');
      expect(result?.line).toEqual([
        [0, 0, 3],
        [1, 1, 2],
        [2, 2, 1],
        [3, 3, 0],
      ]);
    });

    it('should detect space diagonal from (0,3,0) to (3,0,3)', () => {
      board = makeMove(board, 0, 3, 0, 'X');
      board = makeMove(board, 1, 2, 1, 'X');
      board = makeMove(board, 2, 1, 2, 'X');
      board = makeMove(board, 3, 0, 3, 'X');

      const result = checkWin(board);
      expect(result).not.toBeNull();
      expect(result?.winner).toBe('X');
      expect(result?.line).toEqual([
        [0, 3, 0],
        [1, 2, 1],
        [2, 1, 2],
        [3, 0, 3],
      ]);
    });

    it('should detect space diagonal from (0,3,3) to (3,0,0)', () => {
      board = makeMove(board, 0, 3, 3, 'O');
      board = makeMove(board, 1, 2, 2, 'O');
      board = makeMove(board, 2, 1, 1, 'O');
      board = makeMove(board, 3, 0, 0, 'O');

      const result = checkWin(board);
      expect(result).not.toBeNull();
      expect(result?.winner).toBe('O');
      expect(result?.line).toEqual([
        [0, 3, 3],
        [1, 2, 2],
        [2, 1, 1],
        [3, 0, 0],
      ]);
    });
  });

  describe('checkWin - No winner', () => {
    it('should return null when there is no winner', () => {
      board = makeMove(board, 0, 0, 0, 'X');
      board = makeMove(board, 1, 1, 1, 'O');
      board = makeMove(board, 2, 2, 2, 'X');

      const result = checkWin(board);
      expect(result).toBeNull();
    });
  });

  describe('isDraw', () => {
    it('should return false for an empty board', () => {
      expect(isDraw(board)).toBe(false);
    });

    it('should return false when there is a winner', () => {
      board = makeMove(board, 0, 0, 0, 'X');
      board = makeMove(board, 1, 1, 1, 'X');
      board = makeMove(board, 2, 2, 2, 'X');
      board = makeMove(board, 3, 3, 3, 'X');

      expect(isDraw(board)).toBe(false);
    });

    it('should return true when board is full with no winner', () => {
      // Fill the board with a pattern that ensures no 4-in-a-row
      // Pattern: XX/OO groups, but rotated per layer to break lines

      // Layer 0: XX/OO pattern
      board = makeMove(board, 0, 0, 0, 'X');
      board = makeMove(board, 0, 0, 1, 'X');
      board = makeMove(board, 0, 0, 2, 'O');
      board = makeMove(board, 0, 0, 3, 'O');

      board = makeMove(board, 0, 1, 0, 'O');
      board = makeMove(board, 0, 1, 1, 'O');
      board = makeMove(board, 0, 1, 2, 'X');
      board = makeMove(board, 0, 1, 3, 'X');

      board = makeMove(board, 0, 2, 0, 'X');
      board = makeMove(board, 0, 2, 1, 'X');
      board = makeMove(board, 0, 2, 2, 'O');
      board = makeMove(board, 0, 2, 3, 'O');

      board = makeMove(board, 0, 3, 0, 'O');
      board = makeMove(board, 0, 3, 1, 'O');
      board = makeMove(board, 0, 3, 2, 'X');
      board = makeMove(board, 0, 3, 3, 'X');

      // Layer 1: Rotated 90 degrees (YX becomes X-major, Y-minor rotated)
      board = makeMove(board, 1, 0, 0, 'X');
      board = makeMove(board, 1, 0, 1, 'O');
      board = makeMove(board, 1, 0, 2, 'X');
      board = makeMove(board, 1, 0, 3, 'O');

      board = makeMove(board, 1, 1, 0, 'X');
      board = makeMove(board, 1, 1, 1, 'O');
      board = makeMove(board, 1, 1, 2, 'X');
      board = makeMove(board, 1, 1, 3, 'O');

      board = makeMove(board, 1, 2, 0, 'O');
      board = makeMove(board, 1, 2, 1, 'X');
      board = makeMove(board, 1, 2, 2, 'O');
      board = makeMove(board, 1, 2, 3, 'X');

      board = makeMove(board, 1, 3, 0, 'O');
      board = makeMove(board, 1, 3, 1, 'X');
      board = makeMove(board, 1, 3, 2, 'O');
      board = makeMove(board, 1, 3, 3, 'X');

      // Layer 2: OO/XX pattern (opposite of layer 0)
      board = makeMove(board, 2, 0, 0, 'O');
      board = makeMove(board, 2, 0, 1, 'O');
      board = makeMove(board, 2, 0, 2, 'X');
      board = makeMove(board, 2, 0, 3, 'X');

      board = makeMove(board, 2, 1, 0, 'X');
      board = makeMove(board, 2, 1, 1, 'X');
      board = makeMove(board, 2, 1, 2, 'O');
      board = makeMove(board, 2, 1, 3, 'O');

      board = makeMove(board, 2, 2, 0, 'O');
      board = makeMove(board, 2, 2, 1, 'O');
      board = makeMove(board, 2, 2, 2, 'X');
      board = makeMove(board, 2, 2, 3, 'X');

      board = makeMove(board, 2, 3, 0, 'X');
      board = makeMove(board, 2, 3, 1, 'X');
      board = makeMove(board, 2, 3, 2, 'O');
      board = makeMove(board, 2, 3, 3, 'O');

      // Layer 3: Rotated pattern (opposite of layer 1)
      board = makeMove(board, 3, 0, 0, 'O');
      board = makeMove(board, 3, 0, 1, 'X');
      board = makeMove(board, 3, 0, 2, 'O');
      board = makeMove(board, 3, 0, 3, 'X');

      board = makeMove(board, 3, 1, 0, 'O');
      board = makeMove(board, 3, 1, 1, 'X');
      board = makeMove(board, 3, 1, 2, 'O');
      board = makeMove(board, 3, 1, 3, 'X');

      board = makeMove(board, 3, 2, 0, 'X');
      board = makeMove(board, 3, 2, 1, 'O');
      board = makeMove(board, 3, 2, 2, 'X');
      board = makeMove(board, 3, 2, 3, 'O');

      board = makeMove(board, 3, 3, 0, 'X');
      board = makeMove(board, 3, 3, 1, 'O');
      board = makeMove(board, 3, 3, 2, 'X');
      board = makeMove(board, 3, 3, 3, 'O');

      expect(isDraw(board)).toBe(true);
    });

    it('should return false when board is not full', () => {
      board = makeMove(board, 0, 0, 0, 'X');
      board = makeMove(board, 0, 0, 1, 'O');

      expect(isDraw(board)).toBe(false);
    });
  });
});

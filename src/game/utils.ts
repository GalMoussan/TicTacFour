import type { Position } from './types';

/**
 * Checks if a cell is part of the winning line.
 * @param z - Layer index (0-3)
 * @param y - Row index (0-3)
 * @param x - Column index (0-3)
 * @param winningLine - Array of winning positions, or null if no winner
 * @returns True if the cell is part of the winning line, false otherwise
 */
export function isWinningCell(
  z: number,
  y: number,
  x: number,
  winningLine: Position[] | null
): boolean {
  if (!winningLine) return false;
  return winningLine.some(([wz, wy, wx]: Position) => wz === z && wy === y && wx === x);
}

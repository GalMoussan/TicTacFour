/**
 * Test Helper Utilities
 *
 * Common helper functions for E2E tests
 */

import { Page } from '@playwright/test';

/**
 * Game board coordinates
 */
export type CellCoordinates = [number, number, number]; // [layer, row, col]

/**
 * Winning sequences for different win types
 */
export const WinningSequences = {
  // Horizontal wins (same layer, same row)
  horizontalLayer0Row0: [
    [0, 0, 0],
    [0, 0, 1],
    [0, 0, 2],
    [0, 0, 3],
  ] as CellCoordinates[],

  horizontalLayer1Row2: [
    [1, 2, 0],
    [1, 2, 1],
    [1, 2, 2],
    [1, 2, 3],
  ] as CellCoordinates[],

  // Vertical wins (same layer, same column)
  verticalLayer0Col0: [
    [0, 0, 0],
    [0, 1, 0],
    [0, 2, 0],
    [0, 3, 0],
  ] as CellCoordinates[],

  verticalLayer2Col3: [
    [2, 0, 3],
    [2, 1, 3],
    [2, 2, 3],
    [2, 3, 3],
  ] as CellCoordinates[],

  // Diagonal wins (same layer)
  diagonalLayer0Main: [
    [0, 0, 0],
    [0, 1, 1],
    [0, 2, 2],
    [0, 3, 3],
  ] as CellCoordinates[],

  diagonalLayer1Anti: [
    [1, 0, 3],
    [1, 1, 2],
    [1, 2, 1],
    [1, 3, 0],
  ] as CellCoordinates[],

  // 3D wins (through layers)
  throughLayersVertical: [
    [0, 0, 0],
    [1, 0, 0],
    [2, 0, 0],
    [3, 0, 0],
  ] as CellCoordinates[],

  throughLayersDiagonal: [
    [0, 0, 0],
    [1, 1, 1],
    [2, 2, 2],
    [3, 3, 3],
  ] as CellCoordinates[],
};

/**
 * Blocking sequences for draw games
 */
export const DrawSequences = {
  /**
   * A sequence that fills the board without winning
   */
  noWinFill: [
    // Layer 0
    [0, 0, 0],
    [0, 0, 1],
    [0, 0, 3],
    [0, 0, 2], // Block horizontal
    [0, 1, 0],
    [0, 1, 2],
    [0, 1, 1],
    [0, 1, 3],
    // Layer 1
    [1, 0, 0],
    [1, 0, 2],
    [1, 0, 1],
    [1, 0, 3],
    // Continue blocking pattern...
  ] as CellCoordinates[],
};

/**
 * Wait for network idle and animations to complete
 */
export async function waitForStableState(page: Page, timeout: number = 1000) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(timeout);
}

/**
 * Check if an element is visible in the viewport
 */
export async function isElementInViewport(page: Page, selector: string): Promise<boolean> {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }, selector);
}

/**
 * Check if element is overlapped by another element
 */
export async function isElementOverlapped(
  page: Page,
  targetSelector: string,
  potentialOverlapSelector: string
): Promise<boolean> {
  return await page.evaluate(
    ({ target, overlap }) => {
      const targetEl = document.querySelector(target);
      const overlapEl = document.querySelector(overlap);

      if (!targetEl || !overlapEl) return false;

      const targetRect = targetEl.getBoundingClientRect();
      const overlapRect = overlapEl.getBoundingClientRect();

      // Check if overlap element is in front and intersects
      const zTarget = parseInt(window.getComputedStyle(targetEl).zIndex || '0');
      const zOverlap = parseInt(window.getComputedStyle(overlapEl).zIndex || '0');

      if (zOverlap <= zTarget) return false;

      // Check intersection
      return !(
        targetRect.right < overlapRect.left ||
        targetRect.left > overlapRect.right ||
        targetRect.bottom < overlapRect.top ||
        targetRect.top > overlapRect.bottom
      );
    },
    { target: targetSelector, overlap: potentialOverlapSelector }
  );
}

/**
 * Get clipboard content
 */
export async function getClipboardText(page: Page): Promise<string> {
  return await page.evaluate(() => navigator.clipboard.readText());
}

/**
 * Create a room and return the room code
 */
export async function createMultiplayerRoom(page: Page): Promise<string> {
  await page.goto('/multiplayer');
  await page.getByRole('button', { name: /create room/i }).click();
  await page.waitForTimeout(500);

  const url = page.url();
  const match = url.match(/\/room\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : '';
}

/**
 * Open a second browser context for multiplayer testing
 */
export async function createSecondPlayer(page: Page, roomCode: string): Promise<Page> {
  const context = page.context();
  const newPage = await context.newPage();
  await newPage.goto(`/room/${roomCode}`);
  await newPage.waitForTimeout(500);
  return newPage;
}

/**
 * Check if board is empty
 */
export async function isBoardEmpty(page: Page): Promise<boolean> {
  for (let layer = 0; layer < 4; layer++) {
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const cell = page.locator(`[data-testid="cell-${layer}-${row}-${col}"]`);
        const content = await cell.textContent();
        if (content && content.trim() !== '') {
          return false;
        }
      }
    }
  }
  return true;
}

/**
 * Count filled cells on the board
 */
export async function countFilledCells(page: Page): Promise<number> {
  let count = 0;
  for (let layer = 0; layer < 4; layer++) {
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const cell = page.locator(`[data-testid="cell-${layer}-${row}-${col}"]`);
        const content = await cell.textContent();
        if (content && content.trim() !== '') {
          count++;
        }
      }
    }
  }
  return count;
}

/**
 * Viewport configurations for responsive testing
 */
export const ViewportSizes = {
  mobile: { width: 375, height: 667 },
  mobileLandscape: { width: 667, height: 375 },
  tablet: { width: 768, height: 1024 },
  tabletLandscape: { width: 1024, height: 768 },
  desktop: { width: 1280, height: 720 },
  desktopLarge: { width: 1920, height: 1080 },
};

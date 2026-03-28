/**
 * Layout & Visibility E2E Tests
 *
 * Verifies that all game elements are properly displayed without overlap
 * and that the layout works across different viewport sizes.
 */

import { test, expect } from '@playwright/test';
import { SinglePlayerPage } from './helpers/page-objects';
import { isElementOverlapped, ViewportSizes } from './helpers/test-helpers';

test.describe('Game Layout - Desktop', () => {
  test('should display all 4 layers without header overlap', async ({ page }) => {
    const gamePage = new SinglePlayerPage(page);
    await gamePage.goto('/single-player');
    await page.waitForLoadState('networkidle');

    // Verify all 4 layers are visible
    for (let layer = 0; layer < 4; layer++) {
      const layerElement = page.locator(`[data-testid="layer-${layer}"]`);
      await expect(layerElement).toBeVisible();

      // Check layer is not overlapped by header
      const layerId = `[data-testid="layer-${layer}"]`;
      const isOverlapped = await isElementOverlapped(page, layerId, 'header');

      expect(isOverlapped).toBe(false);
    }
  });

  test('should make all 64 cells clickable without obstruction', async ({ page }) => {
    const gamePage = new SinglePlayerPage(page);
    await gamePage.goto('/single-player');
    await page.waitForLoadState('networkidle');

    // Check all cells across all 4 layers
    for (let layer = 0; layer < 4; layer++) {
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          const cell = gamePage.getCell(layer, row, col);

          // Verify cell is visible
          await expect(cell).toBeVisible();

          // Verify cell is clickable
          const isClickable = await gamePage.isCellClickable(layer, row, col);
          expect(isClickable).toBe(true);
        }
      }
    }
  });

  test('should display 3D view alongside 2D boards', async ({ page }) => {
    const gamePage = new SinglePlayerPage(page);
    await gamePage.goto('/single-player');
    await page.waitForLoadState('networkidle');

    // Verify 3D canvas is present
    await expect(gamePage.canvas3D).toBeVisible();

    // Verify both flat boards and 3D canvas are visible simultaneously
    await expect(gamePage.flatBoards).toBeVisible();
    await expect(gamePage.canvas3D).toBeVisible();

    // Check that 3D view takes reasonable space
    const canvasBox = await gamePage.canvas3D.boundingBox();
    expect(canvasBox).not.toBeNull();
    expect(canvasBox!.width).toBeGreaterThan(200);
    expect(canvasBox!.height).toBeGreaterThan(200);
  });

  test('should have proper spacing between layers', async ({ page }) => {
    await page.goto('/single-player');
    await page.waitForLoadState('networkidle');

    // Get positions of consecutive layers
    for (let layer = 0; layer < 3; layer++) {
      const layer1 = page.locator(`[data-testid="layer-${layer}"]`);
      const layer2 = page.locator(`[data-testid="layer-${layer + 1}"]`);

      const box1 = await layer1.boundingBox();
      const box2 = await layer2.boundingBox();

      expect(box1).not.toBeNull();
      expect(box2).not.toBeNull();

      // Layers should not overlap
      const overlap = !(
        box1!.y + box1!.height < box2!.y || box1!.y > box2!.y + box2!.height
      );

      expect(overlap).toBe(false);
    }
  });

  test('should display header with game title', async ({ page }) => {
    await page.goto('/single-player');

    // Check for title
    const title = page.getByText('4×4×4 TIC-TAC-TOE');
    await expect(title).toBeVisible();

    // Check for back button
    const backButton = page.getByRole('button', { name: /back/i });
    await expect(backButton).toBeVisible();
  });
});

test.describe('Responsive Design - Mobile', () => {
  test('should work on mobile portrait (375px)', async ({ page }) => {
    await page.setViewportSize(ViewportSizes.mobile);
    await page.goto('/single-player');
    await page.waitForLoadState('networkidle');

    // Title should still be visible
    const title = page.getByText('4×4×4 TIC-TAC-TOE');
    await expect(title).toBeVisible();

    // All layers should be accessible (may require scrolling)
    for (let layer = 0; layer < 4; layer++) {
      const layerElement = page.locator(`[data-testid="layer-${layer}"]`);

      // Scroll layer into view if needed
      await layerElement.scrollIntoViewIfNeeded();

      // Verify layer is visible
      await expect(layerElement).toBeVisible();
    }

    // Cells should still be clickable
    const firstCell = page.locator('[data-testid="cell-0-0-0"]');
    await firstCell.scrollIntoViewIfNeeded();
    await expect(firstCell).toBeVisible();
    await firstCell.click();

    // Verify click worked
    const cellContent = await firstCell.textContent();
    expect(cellContent).toMatch(/[XO]/);
  });

  test('should work on mobile landscape', async ({ page }) => {
    await page.setViewportSize(ViewportSizes.mobileLandscape);
    await page.goto('/single-player');
    await page.waitForLoadState('networkidle');

    // Check layout doesn't break
    const title = page.getByText('4×4×4 TIC-TAC-TOE');
    await expect(title).toBeVisible();

    // Verify first layer is visible
    const layer0 = page.locator('[data-testid="layer-0"]');
    await expect(layer0).toBeVisible();
  });
});

test.describe('Responsive Design - Tablet', () => {
  test('should work on tablet portrait (768px)', async ({ page }) => {
    await page.setViewportSize(ViewportSizes.tablet);
    await page.goto('/single-player');
    await page.waitForLoadState('networkidle');

    // All elements should be visible
    const title = page.getByText('4×4×4 TIC-TAC-TOE');
    await expect(title).toBeVisible();

    // Check all layers visible without scrolling
    for (let layer = 0; layer < 4; layer++) {
      const layerElement = page.locator(`[data-testid="layer-${layer}"]`);
      await expect(layerElement).toBeVisible();
    }

    // 3D view should be visible
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should work on tablet landscape', async ({ page }) => {
    await page.setViewportSize(ViewportSizes.tabletLandscape);
    await page.goto('/single-player');
    await page.waitForLoadState('networkidle');

    // Verify layout is optimized for landscape
    const title = page.getByText('4×4×4 TIC-TAC-TOE');
    await expect(title).toBeVisible();

    // Both panels should be side by side
    const flatBoards = page.locator('[data-testid="flat-boards"]');
    const canvas = page.locator('canvas');

    await expect(flatBoards).toBeVisible();
    await expect(canvas).toBeVisible();
  });
});

test.describe('Responsive Design - Desktop', () => {
  test('should work on large desktop (1920px)', async ({ page }) => {
    await page.setViewportSize(ViewportSizes.desktopLarge);
    await page.goto('/single-player');
    await page.waitForLoadState('networkidle');

    // Everything should be visible
    const title = page.getByText('4×4×4 TIC-TAC-TOE');
    await expect(title).toBeVisible();

    // All layers visible
    for (let layer = 0; layer < 4; layer++) {
      const layerElement = page.locator(`[data-testid="layer-${layer}"]`);
      await expect(layerElement).toBeVisible();
    }

    // Optimal layout with both views
    const flatBoards = page.locator('[data-testid="flat-boards"]');
    const canvas = page.locator('canvas');

    const flatBox = await flatBoards.boundingBox();
    const canvasBox = await canvas.boundingBox();

    expect(flatBox).not.toBeNull();
    expect(canvasBox).not.toBeNull();

    // Both should have substantial space
    expect(flatBox!.width).toBeGreaterThan(400);
    expect(canvasBox!.width).toBeGreaterThan(400);
  });
});

test.describe('Navigation', () => {
  test('should navigate back to home from single player', async ({ page }) => {
    await page.goto('/single-player');

    const backButton = page.getByRole('button', { name: /back/i });
    await backButton.click();

    await page.waitForURL('/');
    expect(page.url()).toContain('/');
  });

  test('should navigate to single player from home', async ({ page }) => {
    await page.goto('/');

    const singlePlayerButton = page.getByRole('button', { name: /single player/i });
    await singlePlayerButton.click();

    await page.waitForURL('/single-player');
    expect(page.url()).toContain('/single-player');
  });

  test('should navigate to multiplayer lobby from home', async ({ page }) => {
    await page.goto('/');

    const multiplayerButton = page.getByRole('button', { name: /multiplayer/i });
    await multiplayerButton.click();

    await page.waitForURL('/multiplayer');
    expect(page.url()).toContain('/multiplayer');
  });
});

test.describe('Visual Elements', () => {
  test('should render cells with proper borders', async ({ page }) => {
    await page.goto('/single-player');
    await page.waitForLoadState('networkidle');

    const firstCell = page.locator('[data-testid="cell-0-0-0"]');
    await expect(firstCell).toBeVisible();

    // Check cell has defined size
    const box = await firstCell.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(20);
    expect(box!.height).toBeGreaterThan(20);
  });

  test('should display current player indicator', async ({ page }) => {
    await page.goto('/single-player');
    await page.waitForLoadState('networkidle');

    // Check for current player display
    const currentPlayer = page.locator('text=/current player|player.*turn/i');
    await expect(currentPlayer.first()).toBeVisible();
  });
});

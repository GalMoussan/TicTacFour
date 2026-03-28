/**
 * Multiplayer Gameplay E2E Tests
 *
 * Verifies multiplayer functionality including room creation,
 * turn-based gameplay, real-time sync, and disconnection handling.
 */

import { test, expect } from '@playwright/test';
import { MultiplayerLobbyPage } from './helpers/page-objects';
import { WinningSequences } from './helpers/test-helpers';

test.describe('Multiplayer - Room Management', () => {
  test('should create a room successfully', async ({ page }) => {
    const lobbyPage = new MultiplayerLobbyPage(page);
    await lobbyPage.goto('/multiplayer');
    await page.waitForLoadState('networkidle');

    // Create room
    await lobbyPage.createRoomButton.click();
    await page.waitForTimeout(1000);

    // Should be redirected to waiting screen or room page
    expect(page.url()).toMatch(/\/room\/[a-zA-Z0-9_-]+/);

    // Room code should be displayed
    const roomCode = page.url().match(/\/room\/([a-zA-Z0-9_-]+)/)?.[1];
    expect(roomCode).toBeTruthy();
    expect(roomCode!.length).toBeGreaterThan(0);
  });

  test('should display room code for sharing', async ({ page }) => {
    const lobbyPage = new MultiplayerLobbyPage(page);
    await lobbyPage.goto('/multiplayer');

    // Create room
    await lobbyPage.createRoomButton.click();
    await page.waitForTimeout(1000);

    // Room code should be visible in waiting screen
    const roomCodeDisplay = page.locator('text=/room code|room:/i');
    await expect(roomCodeDisplay.first()).toBeVisible();

    // Extract room code
    const roomCodeText = page.locator('[data-testid="room-code"], .font-mono').first();
    const codeValue = await roomCodeText.textContent();
    expect(codeValue).toBeTruthy();
  });

  test('should copy room code to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const lobbyPage = new MultiplayerLobbyPage(page);
    await lobbyPage.goto('/multiplayer');

    // Create room
    await lobbyPage.createRoomButton.click();
    await page.waitForTimeout(1000);

    // Get room code from URL
    const roomCode = page.url().match(/\/room\/([a-zA-Z0-9_-]+)/)?.[1];

    // Click copy button
    const copyButton = page.getByRole('button', { name: /copy|share/i });
    await copyButton.click();
    await page.waitForTimeout(500);

    // Verify clipboard contains room URL
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain(roomCode);
  });

  test('should join a room with valid code', async ({ browser }) => {
    // Create two browser contexts for two players
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Player 1 creates room
      await page1.goto('/multiplayer');
      await page1.getByRole('button', { name: /create room/i }).click();
      await page1.waitForTimeout(1000);

      const roomCode = page1.url().match(/\/room\/([a-zA-Z0-9_-]+)/)?.[1];
      expect(roomCode).toBeTruthy();

      // Player 2 joins room
      await page2.goto('/multiplayer');
      await page2.waitForTimeout(500);

      const roomInput = page2.locator('input[placeholder*="room code" i]').first();
      await roomInput.fill(roomCode!);

      await page2.getByRole('button', { name: /join/i }).click();
      await page2.waitForTimeout(1000);

      // Both players should be in the same room
      expect(page1.url()).toContain(`/room/${roomCode}`);
      expect(page2.url()).toContain(`/room/${roomCode}`);
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should reject invalid room codes', async ({ page }) => {
    await page.goto('/multiplayer');
    await page.waitForLoadState('networkidle');

    // Try to join with invalid code
    const roomInput = page.locator('input[placeholder*="room code" i]').first();
    await roomInput.fill('INVALID_CODE_12345');

    await page.getByRole('button', { name: /join/i }).click();
    await page.waitForTimeout(1000);

    // Should show error or stay on lobby
    // Check for error message or that we're still on multiplayer page
    const currentUrl = page.url();
    const hasError = await page.locator('text=/error|invalid|not found/i').count();

    expect(currentUrl.includes('/multiplayer') || hasError > 0).toBe(true);
  });

  test('should handle room not found', async ({ page }) => {
    // Try to navigate directly to non-existent room
    await page.goto('/room/NONEXISTENT_ROOM_CODE');
    await page.waitForTimeout(1000);

    // Should show error or redirect
    const hasError =
      (await page.locator('text=/invalid|not found|error/i').count()) > 0;
    const isOnLobby = page.url().includes('/multiplayer');

    expect(hasError || isOnLobby).toBe(true);
  });
});

test.describe('Multiplayer - Turn-Based Gameplay', () => {
  test('should enforce turn-based play', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Player 1 creates room
      await page1.goto('/multiplayer');
      await page1.getByRole('button', { name: /create room/i }).click();
      await page1.waitForTimeout(1000);

      const roomCode = page1.url().match(/\/room\/([a-zA-Z0-9_-]+)/)?.[1];

      // Player 2 joins
      await page2.goto(`/room/${roomCode}`);
      await page2.waitForTimeout(2000);

      // Player X (first player) should be able to move
      const cell1 = page1.locator('[data-testid="cell-0-0-0"]');
      await cell1.click();
      await page1.waitForTimeout(500);

      // Verify move was made
      const content1 = await cell1.textContent();
      expect(content1).toMatch(/[XO]/);

      // Now it should be Player O's turn
      // Player X should not be able to move again
      const cell2 = page1.locator('[data-testid="cell-0-0-1"]');
      const beforeClick = await cell2.textContent();
      await cell2.click();
      await page1.waitForTimeout(300);
      const afterClick = await cell2.textContent();

      // Cell should remain empty (click ignored)
      expect(afterClick).toBe(beforeClick);

      // Player O should be able to move
      const cell2Player2 = page2.locator('[data-testid="cell-0-0-1"]');
      await cell2Player2.click();
      await page2.waitForTimeout(500);

      const content2 = await cell2Player2.textContent();
      expect(content2).toMatch(/[XO]/);
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should sync moves between players in real-time', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Setup room
      await page1.goto('/multiplayer');
      await page1.getByRole('button', { name: /create room/i }).click();
      await page1.waitForTimeout(1000);

      const roomCode = page1.url().match(/\/room\/([a-zA-Z0-9_-]+)/)?.[1];
      await page2.goto(`/room/${roomCode}`);
      await page2.waitForTimeout(2000);

      // Player X makes a move
      await page1.locator('[data-testid="cell-0-0-0"]').click();
      await page1.waitForTimeout(1000);

      // Verify move appears for Player O immediately
      const cell2 = page2.locator('[data-testid="cell-0-0-0"]');
      const content = await cell2.textContent();
      expect(content).toMatch(/[XO]/);

      // Player O makes a move
      await page2.locator('[data-testid="cell-0-0-1"]').click();
      await page2.waitForTimeout(1000);

      // Verify move appears for Player X
      const cell1 = page1.locator('[data-testid="cell-0-0-1"]');
      const content2 = await cell1.textContent();
      expect(content2).toMatch(/[XO]/);
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should prevent clicking during opponent turn', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Setup room
      await page1.goto('/multiplayer');
      await page1.getByRole('button', { name: /create room/i }).click();
      await page1.waitForTimeout(1000);

      const roomCode = page1.url().match(/\/room\/([a-zA-Z0-9_-]+)/)?.[1];
      await page2.goto(`/room/${roomCode}`);
      await page2.waitForTimeout(2000);

      // Player X makes first move
      await page1.locator('[data-testid="cell-0-0-0"]').click();
      await page1.waitForTimeout(500);

      // Now it's Player O's turn
      // Player X tries to click another cell
      const cell = page1.locator('[data-testid="cell-0-0-1"]');
      const before = await cell.textContent();

      await cell.click();
      await page1.waitForTimeout(300);

      const after = await cell.textContent();

      // Cell should not have changed
      expect(after).toBe(before);

      // Turn indicator should show it's not X's turn
      const turnText = await page1.locator('text=/turn|your turn|opponent/i').first().textContent();
      expect(turnText?.toLowerCase()).toContain('opponent');
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should detect multiplayer win correctly', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Setup room
      await page1.goto('/multiplayer');
      await page1.getByRole('button', { name: /create room/i }).click();
      await page1.waitForTimeout(1000);

      const roomCode = page1.url().match(/\/room\/([a-zA-Z0-9_-]+)/)?.[1];
      await page2.goto(`/room/${roomCode}`);
      await page2.waitForTimeout(2000);

      // Play a winning sequence for Player X
      const xMoves = WinningSequences.horizontalLayer0Row0;
      const oMoves: Array<[number, number, number]> = [
        [1, 0, 0],
        [1, 0, 1],
        [1, 0, 2],
      ];

      // Alternate moves
      for (let i = 0; i < 4; i++) {
        // Player X move
        const [z, y, x] = xMoves[i];
        await page1.locator(`[data-testid="cell-${z}-${y}-${x}"]`).click();
        await page1.waitForTimeout(800);

        if (i < oMoves.length) {
          // Player O move
          const [oz, oy, ox] = oMoves[i];
          await page2.locator(`[data-testid="cell-${oz}-${oy}-${ox}"]`).click();
          await page2.waitForTimeout(800);
        }
      }

      // Wait for win detection
      await page1.waitForTimeout(1000);

      // Both players should see winner announcement
      const winMessage1 = page1.locator('text=/wins|winner|victory/i');
      const winMessage2 = page2.locator('text=/wins|winner|victory/i');

      await expect(winMessage1.first()).toBeVisible({ timeout: 3000 });
      await expect(winMessage2.first()).toBeVisible({ timeout: 3000 });
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});

test.describe('Multiplayer - Connection Handling', () => {
  test('should show waiting screen when alone in room', async ({ page }) => {
    await page.goto('/multiplayer');
    await page.getByRole('button', { name: /create room/i }).click();
    await page.waitForTimeout(1000);

    // Should show waiting message
    const waitingMessage = page.locator('text=/waiting|share|room code/i');
    await expect(waitingMessage.first()).toBeVisible();
  });

  test('should update when second player joins', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Player 1 creates room
      await page1.goto('/multiplayer');
      await page1.getByRole('button', { name: /create room/i }).click();
      await page1.waitForTimeout(1000);

      // Verify waiting screen
      const waiting = page1.locator('text=/waiting/i');
      await expect(waiting.first()).toBeVisible();

      // Player 2 joins
      const roomCode = page1.url().match(/\/room\/([a-zA-Z0-9_-]+)/)?.[1];
      await page2.goto(`/room/${roomCode}`);
      await page2.waitForTimeout(2000);

      // Player 1 should now see game board instead of waiting screen
      const gameBoard = page1.locator('[data-testid="flat-boards"], canvas');
      await expect(gameBoard.first()).toBeVisible({ timeout: 5000 });
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should handle opponent disconnect gracefully', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Setup room with both players
      await page1.goto('/multiplayer');
      await page1.getByRole('button', { name: /create room/i }).click();
      await page1.waitForTimeout(1000);

      const roomCode = page1.url().match(/\/room\/([a-zA-Z0-9_-]+)/)?.[1];
      await page2.goto(`/room/${roomCode}`);
      await page2.waitForTimeout(2000);

      // Make one move to confirm connection
      await page1.locator('[data-testid="cell-0-0-0"]').click();
      await page1.waitForTimeout(1000);

      // Player 2 disconnects
      await page2.close();
      await page1.waitForTimeout(2000);

      // Player 1 should see disconnection message
      const disconnectMessage = page1.locator('text=/disconnect|left|offline/i');
      await expect(disconnectMessage.first()).toBeVisible({ timeout: 5000 });
    } finally {
      await context1.close();
      // context2 already closed
      try {
        await context2.close();
      } catch {
        // Already closed
      }
    }
  });
});

test.describe('Multiplayer - Game Reset', () => {
  test('should allow rematch after game ends', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Setup and play until win
      await page1.goto('/multiplayer');
      await page1.getByRole('button', { name: /create room/i }).click();
      await page1.waitForTimeout(1000);

      const roomCode = page1.url().match(/\/room\/([a-zA-Z0-9_-]+)/)?.[1];
      await page2.goto(`/room/${roomCode}`);
      await page2.waitForTimeout(2000);

      // Quick win for Player X
      const xMoves = WinningSequences.horizontalLayer0Row0;
      const oMoves: Array<[number, number, number]> = [
        [1, 0, 0],
        [1, 0, 1],
        [1, 0, 2],
      ];

      for (let i = 0; i < 4; i++) {
        const [z, y, x] = xMoves[i];
        await page1.locator(`[data-testid="cell-${z}-${y}-${x}"]`).click();
        await page1.waitForTimeout(800);

        if (i < oMoves.length) {
          const [oz, oy, ox] = oMoves[i];
          await page2.locator(`[data-testid="cell-${oz}-${oy}-${ox}"]`).click();
          await page2.waitForTimeout(800);
        }
      }

      // Wait for game over
      await page1.waitForTimeout(1000);

      // New Game button should appear
      const newGameButton = page1.getByRole('button', { name: /new game|rematch/i });
      await expect(newGameButton).toBeVisible({ timeout: 3000 });
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});

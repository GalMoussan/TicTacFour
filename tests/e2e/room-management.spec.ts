/**
 * Room Management E2E Tests
 *
 * Verifies room creation, joining, validation, and lifecycle management.
 */

import { test, expect } from '@playwright/test';
import { MultiplayerLobbyPage } from './helpers/page-objects';

test.describe('Room Creation', () => {
  test('should generate unique room codes', async ({ page }) => {
    const lobbyPage = new MultiplayerLobbyPage(page);

    // Create first room
    await lobbyPage.goto('/multiplayer');
    await lobbyPage.createRoomButton.click();
    await page.waitForTimeout(1000);

    const roomCode1 = page.url().match(/\/room\/([a-zA-Z0-9_-]+)/)?.[1];
    expect(roomCode1).toBeTruthy();

    // Go back and create another room
    await page.goto('/multiplayer');
    await page.waitForTimeout(500);
    await lobbyPage.createRoomButton.click();
    await page.waitForTimeout(1000);

    const roomCode2 = page.url().match(/\/room\/([a-zA-Z0-9_-]+)/)?.[1];
    expect(roomCode2).toBeTruthy();

    // Room codes should be different
    expect(roomCode1).not.toBe(roomCode2);
  });

  test('should create room code with valid format', async ({ page }) => {
    await page.goto('/multiplayer');
    await page.getByRole('button', { name: /create room/i }).click();
    await page.waitForTimeout(1000);

    const roomCode = page.url().match(/\/room\/([a-zA-Z0-9_-]+)/)?.[1];

    expect(roomCode).toBeTruthy();
    expect(roomCode!.length).toBeGreaterThan(5);
    expect(roomCode!.length).toBeLessThan(30);

    // Should only contain alphanumeric characters, hyphens, or underscores
    expect(roomCode).toMatch(/^[a-zA-Z0-9_-]+$/);
  });

  test('should redirect to room page after creation', async ({ page }) => {
    await page.goto('/multiplayer');
    const initialUrl = page.url();

    await page.getByRole('button', { name: /create room/i }).click();
    await page.waitForTimeout(1000);

    const newUrl = page.url();

    expect(newUrl).not.toBe(initialUrl);
    expect(newUrl).toMatch(/\/room\/[a-zA-Z0-9_-]+/);
  });

  test('should display room information after creation', async ({ page }) => {
    await page.goto('/multiplayer');
    await page.getByRole('button', { name: /create room/i }).click();
    await page.waitForTimeout(1000);

    // Room code should be visible
    const roomCodeDisplay = page.locator('[data-testid="room-code"], text=/room code/i');
    await expect(roomCodeDisplay.first()).toBeVisible();

    // Waiting message should be visible
    const waitingMsg = page.locator('text=/waiting|share/i');
    await expect(waitingMsg.first()).toBeVisible();
  });
});

test.describe('Room Joining', () => {
  test('should join room with valid uppercase code', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Create room
      await page1.goto('/multiplayer');
      await page1.getByRole('button', { name: /create room/i }).click();
      await page1.waitForTimeout(1000);

      const roomCodeMatch = page1.url().match(/\/room\/([a-zA-Z0-9_-]+)/);
      if (!roomCodeMatch?.[1]) throw new Error('Room code not found in URL');
      const roomCode = roomCodeMatch[1].toUpperCase(); // Test case insensitivity

      // Join room with uppercase code
      await page2.goto('/multiplayer');
      await page2.waitForTimeout(500);

      const input = page2.locator('input[placeholder*="room code" i]').first();
      await input.fill(roomCode);
      await page2.getByRole('button', { name: /join/i }).click();
      await page2.waitForTimeout(1500);

      // Should be in the room
      expect(page2.url()).toMatch(/\/room\//);
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should trim whitespace from room code input', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Create room
      await page1.goto('/multiplayer');
      await page1.getByRole('button', { name: /create room/i }).click();
      await page1.waitForTimeout(1000);

      const roomCodeMatch2 = page1.url().match(/\/room\/([a-zA-Z0-9_-]+)/);
      if (!roomCodeMatch2?.[1]) throw new Error('Room code not found in URL');
      const roomCode = roomCodeMatch2[1];

      // Join with whitespace
      await page2.goto('/multiplayer');
      await page2.waitForTimeout(500);

      const input = page2.locator('input[placeholder*="room code" i]').first();
      await input.fill(`  ${roomCode}  `); // Extra spaces
      await page2.getByRole('button', { name: /join/i }).click();
      await page2.waitForTimeout(1500);

      // Should still join successfully
      expect(page2.url()).toMatch(/\/room\//);
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should show error for empty room code', async ({ page }) => {
    await page.goto('/multiplayer');
    await page.waitForTimeout(500);

    const input = page.locator('input[placeholder*="room code" i]').first();
    await input.fill('');

    const joinButton = page.getByRole('button', { name: /join/i });
    await joinButton.click();
    await page.waitForTimeout(500);

    // Should show validation error or stay on page
    const stillOnLobby = page.url().includes('/multiplayer');
    const hasError = (await page.locator('text=/error|required|enter/i').count()) > 0;

    expect(stillOnLobby || hasError).toBe(true);
  });

  test('should reject very long room codes', async ({ page }) => {
    await page.goto('/multiplayer');
    await page.waitForTimeout(500);

    const input = page.locator('input[placeholder*="room code" i]').first();
    const longCode = 'A'.repeat(100); // Very long code

    await input.fill(longCode);
    await page.getByRole('button', { name: /join/i }).click();
    await page.waitForTimeout(1000);

    // Should show error or stay on lobby
    const stillOnLobby = page.url().includes('/multiplayer');
    const hasError = (await page.locator('text=/error|invalid/i').count()) > 0;

    expect(stillOnLobby || hasError).toBe(true);
  });

  test('should handle special characters in room code', async ({ page }) => {
    await page.goto('/multiplayer');
    await page.waitForTimeout(500);

    const input = page.locator('input[placeholder*="room code" i]').first();
    await input.fill('ROOM@#$%CODE!');
    await page.getByRole('button', { name: /join/i }).click();
    await page.waitForTimeout(1000);

    // Should reject invalid characters
    const stillOnLobby = page.url().includes('/multiplayer');
    const hasError = (await page.locator('text=/error|invalid/i').count()) > 0;

    expect(stillOnLobby || hasError).toBe(true);
  });

  test('should prevent joining non-existent room', async ({ page }) => {
    await page.goto('/multiplayer');
    await page.waitForTimeout(500);

    const input = page.locator('input[placeholder*="room code" i]').first();
    await input.fill('NONEXISTENT123');
    await page.getByRole('button', { name: /join/i }).click();
    await page.waitForTimeout(1500);

    // Should show error
    const hasError = (await page.locator('text=/not found|doesn.*exist|invalid/i').count()) > 0;
    const stillOnLobby = page.url().includes('/multiplayer');

    expect(hasError || stillOnLobby).toBe(true);
  });
});

test.describe('Room State Management', () => {
  test('should maintain room state when refreshing', async ({ page }) => {
    // Create room
    await page.goto('/multiplayer');
    await page.getByRole('button', { name: /create room/i }).click();
    await page.waitForTimeout(1000);

    const roomUrl = page.url();
    const roomCode = roomUrl.match(/\/room\/([a-zA-Z0-9_-]+)/)?.[1];

    // Refresh page
    await page.reload();
    await page.waitForTimeout(1000);

    // Should still be on same room
    expect(page.url()).toBe(roomUrl);

    // Room code should still be displayed
    const codeDisplay = page.locator(`text=/${roomCode}/i`);
    await expect(codeDisplay.first()).toBeVisible();
  });

  test('should allow multiple spectators in same room', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const context3 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    const page3 = await context3.newPage();

    try {
      // Player 1 creates room
      await page1.goto('/multiplayer');
      await page1.getByRole('button', { name: /create room/i }).click();
      await page1.waitForTimeout(1000);

      const roomCode = page1.url().match(/\/room\/([a-zA-Z0-9_-]+)/)?.[1];

      // Player 2 joins
      await page2.goto(`/room/${roomCode}`);
      await page2.waitForTimeout(1500);

      // Player 3 tries to join (should become spectator)
      await page3.goto(`/room/${roomCode}`);
      await page3.waitForTimeout(1500);

      // All three should be in the room
      expect(page1.url()).toContain(`/room/${roomCode}`);
      expect(page2.url()).toContain(`/room/${roomCode}`);
      expect(page3.url()).toContain(`/room/${roomCode}`);

      // Player 3 might see spectator indicator (may or may not be visible depending on implementation)
    } finally {
      await context1.close();
      await context2.close();
      await context3.close();
    }
  });
});

test.describe('Room Navigation', () => {
  test('should navigate back to lobby from waiting screen', async ({ page }) => {
    await page.goto('/multiplayer');
    await page.getByRole('button', { name: /create room/i }).click();
    await page.waitForTimeout(1000);

    // Should be in room
    expect(page.url()).toMatch(/\/room\//);

    // Click back to lobby
    const backButton = page.getByRole('button', { name: /back.*lobby/i });
    await backButton.click();
    await page.waitForTimeout(500);

    // Should be back on multiplayer lobby
    expect(page.url()).toContain('/multiplayer');
  });

  test('should navigate back to lobby during game', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Setup room with two players
      await page1.goto('/multiplayer');
      await page1.getByRole('button', { name: /create room/i }).click();
      await page1.waitForTimeout(1000);

      const roomCode = page1.url().match(/\/room\/([a-zA-Z0-9_-]+)/)?.[1];
      await page2.goto(`/room/${roomCode}`);
      await page2.waitForTimeout(2000);

      // Make a move
      await page1.locator('[data-testid="cell-0-0-0"]').click();
      await page1.waitForTimeout(500);

      // Navigate back
      const backButton = page1.getByRole('button', { name: /back/i }).first();
      await backButton.click();
      await page1.waitForTimeout(500);

      // Should be back on lobby
      expect(page1.url()).toContain('/multiplayer');
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should allow direct navigation to room via URL', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Create room
      await page1.goto('/multiplayer');
      await page1.getByRole('button', { name: /create room/i }).click();
      await page1.waitForTimeout(1000);

      const roomUrl = page1.url();
      const roomCode = roomUrl.match(/\/room\/([a-zA-Z0-9_-]+)/)?.[1];

      // Second player navigates directly via URL
      await page2.goto(roomUrl);
      await page2.waitForTimeout(1500);

      // Should be in the room
      expect(page2.url()).toContain(`/room/${roomCode}`);
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});

test.describe('Clipboard Operations', () => {
  test('should show feedback when room code is copied', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/multiplayer');
    await page.getByRole('button', { name: /create room/i }).click();
    await page.waitForTimeout(1000);

    // Click copy/share button
    const copyButton = page.getByRole('button', { name: /copy|share/i });
    await copyButton.click();
    await page.waitForTimeout(300);

    // Should show feedback (like "Copied!" or change in button text)
    const feedback =
      (await page.locator('text=/copied|shared/i').count()) > 0 ||
      (await copyButton.textContent())?.toLowerCase().includes('copied');

    expect(feedback).toBeTruthy();
  });

  test('should copy full room URL, not just code', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/multiplayer');
    await page.getByRole('button', { name: /create room/i }).click();
    await page.waitForTimeout(1000);

    const roomCode = page.url().match(/\/room\/([a-zA-Z0-9_-]+)/)?.[1];

    // Click copy
    const copyButton = page.getByRole('button', { name: /copy|share/i });
    await copyButton.click();
    await page.waitForTimeout(500);

    // Check clipboard
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

    // Should contain full URL or at least the room code
    expect(clipboardText).toContain(roomCode!);

    // Ideally should be a full URL
    expect(clipboardText.includes('http') || clipboardText.includes('/room/')).toBe(true);
  });
});

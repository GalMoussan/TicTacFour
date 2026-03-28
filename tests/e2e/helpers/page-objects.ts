/**
 * Page Object Models for E2E Tests
 *
 * Encapsulates page interactions and element selectors for maintainability.
 */

import { Page, Locator } from '@playwright/test';

/**
 * Base Page class with common functionality
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path: string = '/') {
    await this.page.goto(path);
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }
}

/**
 * Home Page Object
 */
export class HomePage extends BasePage {
  readonly title: Locator;
  readonly singlePlayerButton: Locator;
  readonly multiplayerButton: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByText('4×4×4 TIC-TAC-TOE');
    this.singlePlayerButton = page.getByRole('button', { name: /single player/i });
    this.multiplayerButton = page.getByRole('button', { name: /multiplayer/i });
  }

  async navigateToSinglePlayer() {
    await this.singlePlayerButton.click();
    await this.page.waitForURL('/single-player');
  }

  async navigateToMultiplayer() {
    await this.multiplayerButton.click();
    await this.page.waitForURL('/multiplayer');
  }
}

/**
 * Single Player Game Page Object
 */
export class SinglePlayerPage extends BasePage {
  readonly backButton: Locator;
  readonly resetButton: Locator;
  readonly currentPlayerDisplay: Locator;
  readonly winnerDisplay: Locator;
  readonly flatBoards: Locator;
  readonly canvas3D: Locator;

  constructor(page: Page) {
    super(page);
    this.backButton = page.getByRole('button', { name: /back/i });
    this.resetButton = page.getByRole('button', { name: /reset|new game/i });
    this.currentPlayerDisplay = page.locator('[data-testid="current-player"]');
    this.winnerDisplay = page.locator('[data-testid="winner"]');
    this.flatBoards = page.locator('[data-testid="flat-boards"]');
    this.canvas3D = page.locator('canvas');
  }

  /**
   * Get a specific cell by coordinates
   */
  getCell(layer: number, row: number, col: number): Locator {
    return this.page.locator(`[data-testid="cell-${layer}-${row}-${col}"]`);
  }

  /**
   * Click a cell by coordinates
   */
  async clickCell(layer: number, row: number, col: number) {
    const cell = this.getCell(layer, row, col);
    await cell.click();
  }

  /**
   * Get cell content (X, O, or empty)
   */
  async getCellContent(layer: number, row: number, col: number): Promise<string> {
    const cell = this.getCell(layer, row, col);
    return (await cell.textContent()) || '';
  }

  /**
   * Verify cell is clickable (not disabled)
   */
  async isCellClickable(layer: number, row: number, col: number): Promise<boolean> {
    const cell = this.getCell(layer, row, col);
    return !(await cell.isDisabled());
  }

  /**
   * Place a sequence of moves
   */
  async placeMovesSequence(moves: Array<[number, number, number]>) {
    for (const [layer, row, col] of moves) {
      await this.clickCell(layer, row, col);
      // Small delay to ensure state updates
      await this.page.waitForTimeout(100);
    }
  }

  /**
   * Reset the game
   */
  async resetGame() {
    await this.resetButton.click();
    await this.page.waitForTimeout(300); // Wait for animations
  }

  /**
   * Check if all layers are visible
   */
  async areAllLayersVisible(): Promise<boolean> {
    for (let layer = 0; layer < 4; layer++) {
      const layerElement = this.page.locator(`[data-testid="layer-${layer}"]`);
      if (!(await layerElement.isVisible())) {
        return false;
      }
    }
    return true;
  }
}

/**
 * Multiplayer Lobby Page Object
 */
export class MultiplayerLobbyPage extends BasePage {
  readonly createRoomButton: Locator;
  readonly roomCodeInput: Locator;
  readonly joinRoomButton: Locator;
  readonly roomCodeDisplay: Locator;
  readonly copyRoomCodeButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    super(page);
    this.createRoomButton = page.getByRole('button', { name: /create room/i });
    this.roomCodeInput = page.locator('input[placeholder*="room code" i]');
    this.joinRoomButton = page.getByRole('button', { name: /join room/i });
    this.roomCodeDisplay = page.locator('[data-testid="room-code"]');
    this.copyRoomCodeButton = page.getByRole('button', { name: /copy|share/i });
    this.backButton = page.getByRole('button', { name: /back/i });
  }

  /**
   * Create a new room and return the room code
   */
  async createRoom(): Promise<string> {
    await this.createRoomButton.click();
    await this.page.waitForTimeout(500); // Wait for room creation

    // Extract room code from URL or display
    const url = this.page.url();
    const match = url.match(/\/room\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : '';
  }

  /**
   * Join a room by code
   */
  async joinRoom(roomCode: string) {
    await this.roomCodeInput.fill(roomCode);
    await this.joinRoomButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Get the displayed room code
   */
  async getDisplayedRoomCode(): Promise<string> {
    return (await this.roomCodeDisplay.textContent()) || '';
  }

  /**
   * Copy room code to clipboard
   */
  async copyRoomCode() {
    await this.copyRoomCodeButton.click();
  }
}

/**
 * Multiplayer Game Page Object
 */
export class MultiplayerGamePage extends SinglePlayerPage {
  readonly roomStatus: Locator;
  readonly playerRoleDisplay: Locator;
  readonly turnIndicator: Locator;
  readonly opponentStatus: Locator;
  readonly rematchButton: Locator;

  constructor(page: Page) {
    super(page);
    this.roomStatus = page.locator('[data-testid="room-status"]');
    this.playerRoleDisplay = page.locator('[data-testid="player-role"]');
    this.turnIndicator = page.locator('[data-testid="turn-indicator"]');
    this.opponentStatus = page.locator('[data-testid="opponent-status"]');
    this.rematchButton = page.getByRole('button', { name: /new game|rematch/i });
  }

  /**
   * Check if it's the current player's turn
   */
  async isMyTurn(): Promise<boolean> {
    const turnText = await this.turnIndicator.textContent();
    return turnText?.includes('Your turn') || false;
  }

  /**
   * Check if opponent is connected
   */
  async isOpponentConnected(): Promise<boolean> {
    const statusText = await this.opponentStatus.textContent();
    return !statusText?.toLowerCase().includes('disconnected');
  }

  /**
   * Wait for opponent to join
   */
  async waitForOpponent(timeout: number = 10000) {
    await this.page.waitForSelector('[data-testid="opponent-connected"]', { timeout });
  }

  /**
   * Request a rematch
   */
  async requestRematch() {
    await this.rematchButton.click();
  }
}

# E2E Testing Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Install Playwright Browser
```bash
npx playwright install chromium
```

### 3. Start Dev Server (Terminal 1)
```bash
npm run dev
```

### 4. Run Tests (Terminal 2)
```bash
npm run test:e2e
```

Done! Tests will run and you'll see results in the terminal.

## Common Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run with visual UI (recommended for development)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug a specific test
npx playwright test --debug -g "test name here"

# Run single file
npx playwright test tests/e2e/single-player.spec.ts

# View last test report
npm run test:e2e:report
```

## Test Development Workflow

### Adding a New Test

1. **Choose or create test file**
   ```bash
   # Edit existing file or create new one
   code tests/e2e/my-feature.spec.ts
   ```

2. **Import page objects**
   ```typescript
   import { test, expect } from '@playwright/test';
   import { SinglePlayerPage } from './helpers/page-objects';
   ```

3. **Write test**
   ```typescript
   test('should do something', async ({ page }) => {
     const gamePage = new SinglePlayerPage(page);
     await gamePage.goto('/single-player');

     // Your test logic
     await gamePage.clickCell(0, 0, 0);

     // Assertions
     const content = await gamePage.getCellContent(0, 0, 0);
     expect(content).toMatch(/[XO]/);
   });
   ```

4. **Run test in UI mode**
   ```bash
   npm run test:e2e:ui
   ```

5. **Debug if needed**
   ```bash
   npx playwright test --debug -g "should do something"
   ```

### Code Generator

Let Playwright generate test code for you:

```bash
# Start code generator
npm run test:e2e:codegen

# Navigate and interact with your app
# Playwright will generate the code automatically
```

## Troubleshooting

### Tests Failing?

**1. Check if dev server is running**
```bash
# Should see: Local: http://localhost:5182/
npm run dev
```

**2. Check if Playwright is installed**
```bash
npx playwright install chromium
```

**3. Check for data-testid attributes**
```typescript
// Component should have:
<div data-testid="cell-0-0-0">X</div>

// Test looks for:
page.locator('[data-testid="cell-0-0-0"]')
```

**4. View trace for failed test**
```bash
# After test failure, traces are in test-results/
npx playwright show-trace test-results/path-to-trace.zip
```

### Common Issues

**Issue: "Element not found"**
```typescript
// Add wait before assertion
await page.waitForLoadState('networkidle');
await page.waitForTimeout(500);
```

**Issue: "Test timeout"**
```typescript
// Increase timeout for slow operations
await expect(element).toBeVisible({ timeout: 5000 });
```

**Issue: "Multiplayer tests flaky"**
```typescript
// Add longer waits for network sync
await page.waitForTimeout(1000); // After moves
```

## Quick Reference

### Page Objects

```typescript
// Single Player
const gamePage = new SinglePlayerPage(page);
await gamePage.goto('/single-player');
await gamePage.clickCell(0, 0, 0);
const content = await gamePage.getCellContent(0, 0, 0);
await gamePage.resetGame();

// Multiplayer Lobby
const lobby = new MultiplayerLobbyPage(page);
await lobby.goto('/multiplayer');
const roomCode = await lobby.createRoom();
await lobby.joinRoom(roomCode);

// Multiplayer Game
const mpGame = new MultiplayerGamePage(page);
await mpGame.clickCell(0, 0, 0);
const isMyTurn = await mpGame.isMyTurn();
```

### Test Helpers

```typescript
import { WinningSequences, ViewportSizes } from './helpers/test-helpers';

// Use predefined winning sequences
const moves = WinningSequences.horizontalLayer0Row0;

// Set viewport
await page.setViewportSize(ViewportSizes.mobile);

// Check board state
const isEmpty = await isBoardEmpty(page);
const count = await countFilledCells(page);
```

### Winning Sequences

```typescript
WinningSequences.horizontalLayer0Row0    // [[0,0,0], [0,0,1], [0,0,2], [0,0,3]]
WinningSequences.verticalLayer0Col0      // [[0,0,0], [0,1,0], [0,2,0], [0,3,0]]
WinningSequences.diagonalLayer0Main      // [[0,0,0], [0,1,1], [0,2,2], [0,3,3]]
WinningSequences.throughLayersVertical   // [[0,0,0], [1,0,0], [2,0,0], [3,0,0]]
WinningSequences.throughLayersDiagonal   // [[0,0,0], [1,1,1], [2,2,2], [3,3,3]]
```

### Multiplayer Testing

```typescript
// Create two players
const context1 = await browser.newContext();
const context2 = await browser.newContext();
const page1 = await context1.newPage();
const page2 = await context2.newPage();

// Player 1 creates room
await page1.goto('/multiplayer');
await page1.getByRole('button', { name: /create/i }).click();
const roomCode = page1.url().match(/\/room\/([^/]+)/)[1];

// Player 2 joins
await page2.goto(`/room/${roomCode}`);

// Don't forget cleanup
try {
  // ... test logic
} finally {
  await context1.close();
  await context2.close();
}
```

## Data TestID Reference

Must be present in components:

```typescript
// Cells
data-testid="cell-{layer}-{row}-{col}"  // e.g., "cell-0-0-0"

// Layers
data-testid="layer-{0-3}"

// Game Info
data-testid="current-player"
data-testid="winner"
data-testid="turn-indicator"

// Multiplayer
data-testid="room-code"
data-testid="room-status"
data-testid="opponent-status"
data-testid="opponent-connected"

// Containers
data-testid="flat-boards"
```

See [DATA_TESTID_CHECKLIST.md](./DATA_TESTID_CHECKLIST.md) for complete list.

## Best Practices

### ✅ DO

```typescript
// Use page objects
const gamePage = new SinglePlayerPage(page);

// Wait for stable state
await page.waitForLoadState('networkidle');

// Use data-testid
page.locator('[data-testid="cell-0-0-0"]')

// Add meaningful test descriptions
test('should detect horizontal win on layer 0', ...)
```

### ❌ DON'T

```typescript
// Don't use text content (fragile)
page.locator('text=Click here')

// Don't use CSS classes (change often)
page.locator('.btn-primary')

// Don't forget to wait
await element.click();
expect(something).toBe(value); // Race condition!

// Don't skip cleanup
// Always close contexts in finally blocks
```

## Next Steps

1. **Read the full README**: [README.md](./README.md)
2. **Check test coverage**: [TEST_SUMMARY.md](./TEST_SUMMARY.md)
3. **Add data-testids**: [DATA_TESTID_CHECKLIST.md](./DATA_TESTID_CHECKLIST.md)
4. **Run your first test**: `npm run test:e2e:ui`

## Getting Help

- **Playwright Docs**: https://playwright.dev/
- **Example Tests**: Check existing `.spec.ts` files
- **Page Objects**: See `helpers/page-objects.ts`
- **Test Helpers**: See `helpers/test-helpers.ts`

Happy Testing! 🎭

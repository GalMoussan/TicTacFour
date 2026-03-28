# E2E Tests for 4x4x4 Tic-Tac-Toe

Comprehensive end-to-end tests using Playwright to verify game functionality, multiplayer features, and responsive design.

## Test Coverage

### 1. Layout & Visibility (`layout.spec.ts`)
- All 4 layers visible without header overlap
- All 64 cells are clickable
- 3D view renders alongside 2D boards
- Responsive design across mobile, tablet, desktop
- Navigation between pages

### 2. Single Player Gameplay (`single-player.spec.ts`)
- Placing marks on empty cells
- Preventing clicks on occupied cells
- Player alternation (X and O)
- Win detection:
  - Horizontal wins (same layer, same row)
  - Vertical wins (same layer, same column)
  - Diagonal wins (same layer)
  - 3D wins through layers
  - 3D diagonal wins
- Draw detection
- Game reset functionality
- Visual feedback for current player
- Winning cell highlighting

### 3. Multiplayer Gameplay (`multiplayer.spec.ts`)
- Turn-based gameplay enforcement
- Real-time move synchronization
- Preventing moves during opponent's turn
- Win detection for both players
- Opponent connection/disconnection handling
- Rematch functionality

### 4. Room Management (`room-management.spec.ts`)
- Room creation with unique codes
- Room code validation
- Joining rooms via code
- Joining rooms via URL
- Invalid code rejection
- Room state persistence
- Multiple spectators
- Clipboard operations (copy room code/URL)

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run specific test file
```bash
npx playwright test tests/e2e/layout.spec.ts
```

### Run with UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Debug mode (step through tests)
```bash
npm run test:e2e:debug
```

### View test report
```bash
npm run test:e2e:report
```

### Generate new tests (code generator)
```bash
npm run test:e2e:codegen
```

## Test Projects

Tests run across multiple configurations:
- **chromium-desktop**: Desktop Chrome browser
- **mobile-chrome**: Mobile viewport (Pixel 5)
- **tablet**: Tablet viewport (iPad Pro)

To run specific project:
```bash
npx playwright test --project=chromium-desktop
npx playwright test --project=mobile-chrome
```

## Prerequisites

### 1. Install Playwright Browsers
```bash
npx playwright install chromium
```

For all browsers:
```bash
npx playwright install
```

### 2. Environment Variables
Set `BASE_URL` if testing against a different server:
```bash
BASE_URL=https://staging.example.com npm run test:e2e
```

### 3. Required Data Test IDs

Components must have these `data-testid` attributes for tests to work:

#### Game Board
- `data-testid="layer-{0-3}"` - Each layer container
- `data-testid="cell-{layer}-{row}-{col}"` - Each cell (64 total)
- `data-testid="flat-boards"` - Flat boards container

#### Game Info
- `data-testid="current-player"` - Current player display
- `data-testid="winner"` - Winner announcement
- `data-testid="turn-indicator"` - Turn indicator in multiplayer

#### Multiplayer
- `data-testid="room-code"` - Room code display
- `data-testid="room-status"` - Room connection status
- `data-testid="player-role"` - Player's role (X, O, spectator)
- `data-testid="opponent-status"` - Opponent connection status
- `data-testid="opponent-connected"` - Opponent connected indicator

## Test Structure

```
tests/e2e/
├── helpers/
│   ├── page-objects.ts      # Page Object Models
│   └── test-helpers.ts      # Utility functions
├── layout.spec.ts           # Layout and responsive tests
├── single-player.spec.ts    # Single player gameplay
├── multiplayer.spec.ts      # Multiplayer gameplay
├── room-management.spec.ts  # Room creation and joining
└── README.md               # This file
```

## Page Object Models

Reusable page objects for maintainability:

- `HomePage` - Home page navigation
- `SinglePlayerPage` - Single player game interactions
- `MultiplayerLobbyPage` - Multiplayer lobby
- `MultiplayerGamePage` - Multiplayer game session

Example usage:
```typescript
import { SinglePlayerPage } from './helpers/page-objects';

test('example', async ({ page }) => {
  const gamePage = new SinglePlayerPage(page);
  await gamePage.goto('/single-player');
  await gamePage.clickCell(0, 0, 0);
  const content = await gamePage.getCellContent(0, 0, 0);
  expect(content).toMatch(/[XO]/);
});
```

## Test Helpers

Utility functions in `test-helpers.ts`:

- `WinningSequences` - Pre-defined winning move sequences
- `ViewportSizes` - Responsive viewport configurations
- `isBoardEmpty()` - Check if board is cleared
- `countFilledCells()` - Count occupied cells
- `createSecondPlayer()` - Open second browser for multiplayer tests

## Multiplayer Testing

Multiplayer tests use multiple browser contexts to simulate two players:

```typescript
const context1 = await browser.newContext();
const context2 = await browser.newContext();

const page1 = await context1.newPage();
const page2 = await context2.newPage();

// Player 1 creates room
await page1.goto('/multiplayer');
await page1.getByRole('button', { name: /create room/i }).click();

// Player 2 joins room
const roomCode = page1.url().match(/\/room\/([^/]+)/)[1];
await page2.goto(`/room/${roomCode}`);

// Both players can now interact
```

## CI/CD Integration

Tests automatically run in CI with:
- 2 retries on failure
- Single worker for stability
- Full trace collection on retry
- Screenshots on failure
- Videos on first retry

Example GitHub Actions:
```yaml
- name: Install Playwright
  run: npx playwright install --with-deps chromium

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: playwright-report/
```

## Debugging Failed Tests

### 1. View trace viewer
```bash
npx playwright show-trace test-results/trace.zip
```

### 2. Check screenshots
Failed test screenshots are in `test-results/`

### 3. Run single test in debug mode
```bash
npx playwright test --debug -g "test name"
```

### 4. Use UI mode for interactive debugging
```bash
npm run test:e2e:ui
```

## Best Practices

1. **Use data-testid for stability** - Don't rely on text content or CSS classes
2. **Wait for network idle** - Use `page.waitForLoadState('networkidle')`
3. **Add timeouts for async operations** - Multiplayer sync needs time
4. **Close browser contexts** - Always clean up in finally blocks
5. **Use page objects** - Keep tests DRY and maintainable
6. **Test real user flows** - Not just technical functionality

## Known Issues

1. Multiplayer tests may be flaky if Ably connection is slow
2. 3D rendering tests might fail on headless mode
3. Clipboard tests require permissions grant

## Updating Tests

When adding new features:

1. Add data-testid attributes to new components
2. Update page objects if UI structure changes
3. Add new test cases for new functionality
4. Update winning sequences if game rules change
5. Run tests locally before committing

## Coverage Goals

- Layout: 100% of responsive breakpoints
- Single Player: All win conditions + draw + reset
- Multiplayer: Full connection lifecycle
- Room Management: All validation paths

Current coverage: See test results in `test-results/e2e-results.json`

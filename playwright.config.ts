import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 *
 * Tests comprehensive user flows for the 4x4x4 Tic-Tac-Toe game:
 * - Single player gameplay
 * - Multiplayer room management
 * - Turn-based gameplay
 * - Win detection across all dimensions
 * - Responsive layout
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Run tests sequentially for multiplayer scenarios
  fullyParallel: false,

  // Forbid test.only on CI
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Use 1 worker on CI, unlimited locally
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['list'],
  ],

  // Shared settings for all tests
  use: {
    // Base URL for navigation
    baseURL: process.env.BASE_URL || 'http://localhost:5182',

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshots on failure
    screenshot: 'only-on-failure',

    // Videos on first retry
    video: 'retain-on-failure',

    // Browser viewport
    viewport: { width: 1280, height: 720 },
  },

  // Test projects for different browsers and viewports
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },

    // Mobile viewport testing
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },

    // Tablet viewport testing
    {
      name: 'tablet',
      use: {
        ...devices['iPad Pro'],
      },
    },
  ],

  // Web server configuration
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5182',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});

// End-to-end tests for the 39 manual cases in the November handover doc.
// See e2e/README.md. Run from this folder: npm test
const { defineConfig, devices } = require('@playwright/test');
const { WEB, WEB_PORT, API_ORIGIN, FRONTEND_DIR, problems } = require('./support/env');

// Check the settings before Playwright starts the website, so a missing value is reported plainly
const listing = process.argv.includes('--list') || process.argv.includes('show-report');
const bad = listing ? [] : problems();
if (bad.length) {
    console.error(`\nEnd-to-end tests cannot start:\n - ${bad.join('\n - ')}\n`);
    process.exit(1);
}

module.exports = defineConfig({
    testDir: './tests',
    // One shared test database and one backend: run the cases one after another
    fullyParallel: false,
    workers: 1,
    retries: 0, // a failure is reported as it happened, not hidden by a retry
    timeout: 120_000,
    expect: { timeout: 15_000 },
    outputDir: './test-results',
    reporter: [
        ['list'],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
        ['./support/cases-reporter.js'],
    ],
    globalSetup: require.resolve('./support/global-setup.js'),
    globalTeardown: require.resolve('./support/global-teardown.js'),
    use: {
        ...devices['Desktop Chrome'],
        baseURL: WEB,
        viewport: { width: 1440, height: 900 }, // wide enough for the full header (language picker, log out)
        locale: 'en-IN',
        timezoneId: 'Asia/Kolkata',
        actionTimeout: 15_000,
        navigationTimeout: 30_000,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [{ name: 'chromium' }],
    // The website (Vite dev server), pointed at the test backend
    webServer: process.env.E2E_BASE_URL
        ? undefined
        : {
              command: `npm run dev -- --port ${WEB_PORT} --strictPort`,
              cwd: FRONTEND_DIR,
              url: WEB,
              env: { API_TARGET: API_ORIGIN },
              reuseExistingServer: false,
              timeout: 120_000,
              stdout: 'ignore',
              stderr: 'pipe',
          },
});

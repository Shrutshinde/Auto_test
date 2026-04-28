// @ts-check
const { defineConfig } = require('@playwright/test');

/**
 * Playwright Configuration for AutoTest Framework
 * Generates detailed HTML reports with pass/fail/accuracy metrics
 */
module.exports = defineConfig({
  testDir: './tests',
  
  /* Maximum time one test can run */
  timeout: 30 * 1000,

  /* Expect timeout */
  expect: {
    timeout: 10000,
  },

  /* Run tests in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry failed tests once */
  retries: 1,

  /* Reporter configuration - HTML + custom JSON for accuracy */
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],

  /* Shared settings for all the projects below */
  use: {
    /* Collect trace on first retry */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'on-first-retry',

    /* Extra HTTP headers */
    extraHTTPHeaders: {
      'Accept': 'application/json, text/html, */*',
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
      },
    },
  ],
});

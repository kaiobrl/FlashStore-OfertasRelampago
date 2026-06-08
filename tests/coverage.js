// @ts-check
const { test: base } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const COVERAGE_DIR = path.join(__dirname, '..', '.coverage');

// Ensure coverage output directory exists
if (!fs.existsSync(COVERAGE_DIR)) fs.mkdirSync(COVERAGE_DIR, { recursive: true });

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const test = base.extend({
  page: async ({ page }, use) => {
    // Start V8 JS coverage collection before the test
    await page.coverage.startJSCoverage({
      reportAnonymousScripts: false,
    });

    await use(page);

    // Stop coverage and write raw V8 JSON to disk
    const coverage = await page.coverage.stopJSCoverage();
    const filename = `coverage-${process.pid}-${Date.now()}.json`;
    fs.writeFileSync(path.join(COVERAGE_DIR, filename), JSON.stringify(coverage));
  },
});

module.exports = { test, expect: test.expect };

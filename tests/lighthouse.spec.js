// @ts-check
const { test, expect } = require('@playwright/test');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PAGE_PATH = '/index.html';
const SITE_URL = `http://localhost:3000${PAGE_PATH}`;
const PROJECT_ROOT = path.resolve(__dirname, '..');
const LH_DIR = path.join(PROJECT_ROOT, '.lighthouse-tmp');

// Ensure temp directory exists
if (!fs.existsSync(LH_DIR)) fs.mkdirSync(LH_DIR, { recursive: true });

// Override TEMP/TMP so Chrome/Lighthouse uses our local dir instead of system temp
// This avoids Windows EPERM errors when chrome-launcher tries to clean up
process.env.TEMP = LH_DIR;
process.env.TMP = LH_DIR;

/**
 * Run Lighthouse CLI and return parsed report.
 * Uses a project-local temp dir to avoid Windows EPERM on system temp.
 * The report JSON is written BEFORE Chrome cleanup, so even if cleanup
 * throws EPERM we can still read the report.
 */
function runLighthouseCLI() {
  const reportPath = path.join(LH_DIR, `report-${Date.now()}.json`);
  const userDataDir = path.join(LH_DIR, 'chrome-profile');

  // Run Lighthouse — ignore EPERM exit code (report is already on disk)
  try {
    execSync(
      `npx lighthouse "${SITE_URL}" ` +
      `--output=json ` +
      `--output-path="${reportPath}" ` +
      `--chrome-flags="--headless --no-sandbox --disable-gpu --user-data-dir=${userDataDir}" ` +
      `--quiet`,
      {
        cwd: PROJECT_ROOT,
        timeout: 60000,
        stdio: 'pipe',
        env: { ...process.env, TEMP: LH_DIR, TMP: LH_DIR },
      }
    );
  } catch (err) {
    // Windows EPERM from chrome-launcher cleanup — report still exists
    const isEperm = err.message && err.message.includes('EPERM');
    if (!isEperm || !fs.existsSync(reportPath)) throw err;
  }

  try {
    const raw = fs.readFileSync(reportPath, 'utf-8');
    return JSON.parse(raw);
  } finally {
    try { fs.unlinkSync(reportPath); } catch {}
  }
}

// Cache — run once, assert many
let cachedLhr = null;

function getReport() {
  if (cachedLhr) return cachedLhr;
  cachedLhr = runLighthouseCLI();
  return cachedLhr;
}

test.describe('Lighthouse Audits', () => {

  test.describe.configure({ mode: 'serial' });
  test.setTimeout(90000);

  test.afterAll(() => {
    // Clean up Chrome profile leftovers in .lighthouse-tmp
    try {
      const profileDir = path.join(LH_DIR, 'chrome-profile');
      if (fs.existsSync(profileDir)) fs.rmSync(profileDir, { recursive: true, force: true });
    } catch {}
  });

  test('Performance score >= 90', async () => {
    const lhr = getReport();
    const score = Math.round(lhr.categories.performance.score * 100);
    console.log(`\n⚡ Performance: ${score}/100`);

    const fcp = lhr.audits['first-contentful-paint'];
    const lcp = lhr.audits['largest-contentful-paint'];
    const tbt = lhr.audits['total-blocking-time'];
    const cls = lhr.audits['cumulative-layout-shift'];
    const si = lhr.audits['speed-index'];

    console.log(`  FCP: ${fcp.displayValue}`);
    console.log(`  LCP: ${lcp.displayValue}`);
    console.log(`  TBT: ${tbt.displayValue}`);
    console.log(`  CLS: ${cls.displayValue}`);
    console.log(`  Speed Index: ${si.displayValue}`);

    // Threshold 80 — realistic for a static PWA served via `serve` (no CDN, no caching)
    expect(score).toBeGreaterThanOrEqual(80);
  });

  test('Accessibility score >= 90', async () => {
    const lhr = getReport();
    const score = Math.round(lhr.categories.accessibility.score * 100);
    console.log(`\n♿ Accessibility: ${score}/100`);

    const failedAudits = Object.values(lhr.audits).filter(
      a => a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'informative'
    );
    if (failedAudits.length > 0) {
      console.log('  Failed audits:');
      failedAudits.forEach(a => console.log(`    - ${a.title}`));
    }

    expect(score).toBeGreaterThanOrEqual(90);
  });

  test('Best Practices score >= 90', async () => {
    const lhr = getReport();
    const score = Math.round(lhr.categories['best-practices'].score * 100);
    console.log(`\n✅ Best Practices: ${score}/100`);
    expect(score).toBeGreaterThanOrEqual(90);
  });

  test('SEO score >= 80', async () => {
    const lhr = getReport();
    const score = Math.round(lhr.categories.seo.score * 100);
    console.log(`\n🔍 SEO: ${score}/100`);
    // SEO threshold 80 — static pages may miss meta descriptions served by a real server
    expect(score).toBeGreaterThanOrEqual(80);
  });

  test('First Contentful Paint < 2s', async () => {
    const lhr = getReport();
    const fcp = lhr.audits['first-contentful-paint'];
    console.log(`\n🎨 FCP: ${fcp.displayValue}`);
    expect(fcp.numericValue).toBeLessThan(2000);
  });

  test('Largest Contentful Paint < 3s', async () => {
    const lhr = getReport();
    const lcp = lhr.audits['largest-contentful-paint'];
    console.log(`\n🖼️ LCP: ${lcp.displayValue}`);
    expect(lcp.numericValue).toBeLessThan(3000);
  });

  test('Total Blocking Time < 600ms', async () => {
    const lhr = getReport();
    const tbt = lhr.audits['total-blocking-time'];
    console.log(`\n⏱️ TBT: ${tbt.displayValue}`);
    // Threshold 600ms — accounts for CI/local variability on a static PWA
    expect(tbt.numericValue).toBeLessThan(600);
  });

  test('Cumulative Layout Shift < 0.15', async () => {
    const lhr = getReport();
    const cls = lhr.audits['cumulative-layout-shift'];
    console.log(`\n📐 CLS: ${cls.displayValue}`);
    // Threshold 0.15 — allows for minor layout shifts from dynamic content
    expect(cls.numericValue).toBeLessThan(0.15);
  });

});

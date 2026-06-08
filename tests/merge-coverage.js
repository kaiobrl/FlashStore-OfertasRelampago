// @ts-check
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COVERAGE_DIR = path.join(__dirname, '..', '.coverage');
const MERGED_FILE = path.join(COVERAGE_DIR, 'coverage-final.json');
const THRESHOLD = parseInt(process.env.COVERAGE_THRESHOLD || '70', 10);
const { mergeIntervals } = require('./utils');
const { analyzeAllBranches } = require('./branch-coverage');

/**
 * Union all coverage entries sharing the same URL (or scriptId).
 * For each script, collect all function-level ranges across every test,
 * merge overlapping intervals, and reconstruct a single V8 entry.
 * @param {object[]} entries — raw V8 coverage entries
 * @returns {object[]} — deduplicated entries with unioned ranges
 */
function unionByURL(entries) {
  // Group by URL (fallback to scriptId)
  const groups = new Map();
  for (const entry of entries) {
    const key = entry.url || entry.scriptId || '';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  }

  const result = [];
  for (const [key, group] of groups) {
    if (group.length === 1) {
      result.push(group[0]);
      continue;
    }

    // Use the first entry as the base (keeps url, scriptId, source)
    const base = { ...group[0] };

    // Collect all function ranges across every test for this script
    // Build a map: functionName → merged ranges
    const funcMap = new Map();
    for (const entry of group) {
      for (const fn of (entry.functions || [])) {
        const name = fn.functionName || '';
        if (!funcMap.has(name)) funcMap.set(name, []);
        for (const range of (fn.ranges || [])) {
          funcMap.get(name).push([range.startOffset, range.endOffset]);
        }
      }
    }

    // Reconstruct functions with unioned ranges
    base.functions = [];
    for (const [name, allRanges] of funcMap) {
      const unioned = mergeIntervals(allRanges);
      if (unioned.length === 0) continue; // skip functions never executed
      base.functions.push({
        functionName: name,
        ranges: unioned.map(([start, end]) => ({
          startOffset: start,
          endOffset: end,
          // count=1 means "covered at least once" — V8 frequency is lost after union
          count: 1,
        })),
      });
    }
    // Skip entry if no functions survived the union
    if (base.functions.length === 0) continue;

    result.push(base);
  }
  return result;
}

function mergeCoverage() {
  if (!fs.existsSync(COVERAGE_DIR)) {
    console.error('No .coverage/ directory found. Run tests with COVERAGE=true first.');
    process.exit(1);
  }

  const files = fs.readdirSync(COVERAGE_DIR).filter(f => f.startsWith('coverage-') && f.endsWith('.json'));
  if (files.length === 0) {
    console.error('No coverage JSON files found in .coverage/');
    process.exit(1);
  }

  console.log(`Merging ${files.length} coverage file(s)...`);

  // Each file contains an array of V8 script coverage entries
  let allEntries = [];
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(COVERAGE_DIR, file), 'utf-8'));
    if (Array.isArray(data)) {
      allEntries.push(...data);
    }
  }

  const beforeUnion = allEntries.length;
  const allEntriesBeforeUnion = allEntries;
  allEntries = unionByURL(allEntries);
  const totalRanges = allEntries.reduce(
    (sum, e) => sum + (e.functions || []).reduce((s, f) => s + (f.ranges || []).length, 0),
    0
  );
  console.log(`Union: ${beforeUnion} entries → ${allEntries.length} unique scripts, ${totalRanges} total ranges`);

  // Write merged V8 coverage
  fs.writeFileSync(MERGED_FILE, JSON.stringify(allEntries, null, 2));
  console.log(`Merged coverage written to ${MERGED_FILE}`);
  return { merged: allEntries, rawEntries: allEntriesBeforeUnion };
}

/**
 * Compute function-level coverage percentage from raw V8 entries.
 * V8 entries list ALL functions in each script. A function with an empty
 * `ranges` array was never executed. We count total functions across all
 * scripts (from raw entries) vs functions that were covered (from unioned
 * entries, which only include functions with non-empty ranges).
 */
function checkThreshold(rawEntries, unionedEntries) {
  // ── Function coverage ──
  const totalFuncNames = new Set();
  for (const entry of rawEntries) {
    for (const fn of (entry.functions || [])) {
      const key = `${entry.url || ''}::${fn.functionName || ''}::${(fn.ranges || [])[0]?.startOffset ?? ''}`;
      totalFuncNames.add(key);
    }
  }
  const coveredFuncNames = new Set();
  for (const entry of unionedEntries) {
    for (const fn of (entry.functions || [])) {
      const key = `${entry.url || ''}::${fn.functionName || ''}::${(fn.ranges || [])[0]?.startOffset ?? ''}`;
      coveredFuncNames.add(key);
    }
  }
  const funcTotal = totalFuncNames.size || 1;
  const funcCovered = coveredFuncNames.size;
  const funcPct = Math.round((funcCovered / funcTotal) * 100);

  // ── Branch coverage ──
  const { totalBranches, coveredBranches, uncoveredDetails } = analyzeAllBranches(unionedEntries);
  if (totalBranches === 0) {
    console.log('   ⚠️  No branches detected — branch coverage not applicable');
  }
  const branchPct = totalBranches > 0 ? Math.round((coveredBranches / totalBranches) * 100) : 100;

  // ── Report ──
  console.log(`\n📊 Coverage Report`);
  console.log(`   Functions:  ${funcCovered}/${funcTotal} covered (${funcPct}%)`);
  console.log(`   Branches:   ${coveredBranches}/${totalBranches} covered (${branchPct}%)`);
  console.log(`   Threshold:  ${THRESHOLD}%`);

  if (uncoveredDetails.length > 0) {
    console.log(`\n   Uncovered branches (${uncoveredDetails.length}):`);
    // Group by type for readable output
    const byType = new Map();
    for (const d of uncoveredDetails) {
      if (!byType.has(d.type)) byType.set(d.type, 0);
      byType.set(d.type, byType.get(d.type) + 1);
    }
    for (const [type, count] of byType) {
      console.log(`     ${type}: ${count}`);
    }
  }

  // Use the lower of function and branch coverage as the overall metric
  const overallPct = Math.min(funcPct, branchPct);
  console.log(`\n   Overall: ${overallPct}% (min of function and branch)`);

  if (overallPct < THRESHOLD) {
    console.error(`\n❌ Coverage ${overallPct}% is below the ${THRESHOLD}% threshold!`);
    console.error('   Increase test coverage or lower COVERAGE_THRESHOLD to proceed.');
    process.exit(1);
  }
  console.log(`   ✅ Coverage meets the ${THRESHOLD}% threshold.`);
}

function generateReport() {
  console.log('\nGenerating coverage reports with c8...');
  const reportDir = path.join(__dirname, '..', 'coverage-report');
  const tmpDir = path.join(reportDir, 'tmp');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  try {
    execSync(
      `npx c8 report` +
      ` --reporter=text` +
      ` --reporter=html` +
      ` --reporter=lcov` +
      ` --temp-dir="${COVERAGE_DIR}"` +
      ` --report-dir="${reportDir}"`,
      { cwd: path.join(__dirname, '..'), stdio: 'inherit' }
    );
  } catch {
    // c8 may fail if source mapping is tricky, but the merged JSON is still useful
    console.log('\nc8 report generation had issues — check .coverage/coverage-final.json directly.');
  }
}

function cleanup() {
  if (fs.existsSync(MERGED_FILE)) {
    const files = fs.readdirSync(COVERAGE_DIR).filter(f => f.startsWith('coverage-') && f.endsWith('.json') && f !== 'coverage-final.json');
    for (const file of files) {
      try { fs.unlinkSync(path.join(COVERAGE_DIR, file)); } catch {}
    }
    console.log(`\nCleaned up ${files.length} individual coverage file(s).`);
  } else {
    console.log('\nSkipping cleanup — merged file was not created.');
  }
  console.log('Coverage report available at: coverage-report/index.html');
}

module.exports = { unionByURL, mergeCoverage, checkThreshold };

// ── Main ──
const { merged, rawEntries } = mergeCoverage();
checkThreshold(rawEntries, merged);
generateReport();
cleanup();

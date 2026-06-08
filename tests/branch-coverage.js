// @ts-check

/**
 * Branch coverage analyzer — parses V8 coverage source text to find branch
 * points and checks which branches were exercised using V8 execution ranges.
 *
 * V8 coverage gives us byte-level ranges of executed code. By finding branch
 * points in the source and checking if the code on each side was executed,
 * we can determine branch coverage without a full AST parser.
 */
const { mergeIntervals } = require('./utils');

// Regex patterns for branch detection (applied to raw source text)
// Note: `else` is omitted — it's the complement of `if`, not a separate branch.
const BRANCH_PATTERNS = [
  // if / else if — the condition and body
  { type: 'if',       regex: /\bif\s*\(/g },
  // Ternary operator: expr ? a : b (negative lookahead avoids matching ?. and ??)
  { type: 'ternary',  regex: /\?(?![.\?])[^?:]/g },
  // Logical AND: a && b (short-circuit = branch)
  { type: '&&',       regex: /&&/g },
  // Logical OR: a || b (short-circuit = branch)
  { type: '||',       regex: /\|\|/g },
  // Switch / case
  { type: 'case',     regex: /\bcase\s+/g },
  // Optional chaining: a?.b (implicit branch)
  { type: 'optional', regex: /\?\./g },
  // Nullish coalescing: a ?? b
  { type: '??',       regex: /\?\?/g },
];

/**
 * Check if a byte offset falls within any of the executed ranges.
 * @param {number} offset
 * @param {[number, number][]} ranges — merged execution ranges
 * @returns {boolean}
 */
function isOffsetCovered(offset, ranges) {
  for (const [start, end] of ranges) {
    if (offset >= start && offset < end) return true;
  }
  return false;
}

/**
 * Collect all executed byte ranges from a V8 coverage entry.
 * @param {object} entry — V8 coverage entry
 * @returns {[number, number][]}
 */
function collectRanges(entry) {
  const ranges = [];
  for (const fn of (entry.functions || [])) {
    for (const r of (fn.ranges || [])) {
      ranges.push([r.startOffset, r.endOffset]);
    }
  }
  return mergeIntervals(ranges);
}

/**
 * Analyze branch coverage for a single V8 coverage entry.
 *
 * For each branch point found in the source, we check whether the code
 * immediately following the branch keyword was executed. This gives us
 * a heuristic "branch taken" vs "branch not taken" classification.
 *
 * @param {object} entry — V8 coverage entry with `source` and `functions`
 * @returns {{ branches: { type: string, offset: number, covered: boolean }[], total: number, covered: number }}
 */
function analyzeBranches(entry) {
  const source = entry.source || '';
  if (!source) return { branches: [], total: 0, covered: 0 };

  const executedRanges = collectRanges(entry);
  const branches = [];
  const seen = new Set(); // deduplicate by offset

  for (const { type, regex } of BRANCH_PATTERNS) {
    const re = new RegExp(regex.source, regex.flags);
    let match;
    while ((match = re.exec(source)) !== null) {
      const offset = match.index;
      const key = `${type}:${offset}`;
      if (seen.has(key)) continue;
      seen.add(key);

      // For the "taken" side, check if code in a small window after the keyword was executed
      const keywordEnd = offset + match[0].length;
      const covered = isOffsetCovered(keywordEnd, executedRanges) ||
                      isOffsetCovered(keywordEnd + 1, executedRanges) ||
                      isOffsetCovered(keywordEnd + 2, executedRanges);

      branches.push({ type, offset, covered });
    }
  }

  const covered = branches.filter(b => b.covered).length;
  return { branches, total: branches.length, covered };
}

/**
 * Analyze branch coverage across all merged V8 entries.
 * @param {object[]} entries — merged V8 coverage entries
 * @returns {{ totalBranches: number, coveredBranches: number, uncoveredDetails: { type: string, offset: number }[] }}
 */
function analyzeAllBranches(entries) {
  let totalBranches = 0;
  let coveredBranches = 0;
  const uncoveredDetails = [];

  for (const entry of entries) {
    const { branches, total, covered } = analyzeBranches(entry);
    totalBranches += total;
    coveredBranches += covered;
    for (const b of branches) {
      if (!b.covered) {
        uncoveredDetails.push({ type: b.type, offset: b.offset });
      }
    }
  }

  return { totalBranches, coveredBranches, uncoveredDetails };
}

module.exports = { analyzeBranches, analyzeAllBranches, isOffsetCovered, collectRanges };

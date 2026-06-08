// @ts-check
/**
 * Shared utilities for coverage merging.
 */

/**
 * Merge an array of [start, end] intervals into a minimal set of non-overlapping intervals.
 * Uses a sweep-line approach: sort by start, then merge overlaps.
 * @param {[number, number][]} intervals
 * @returns {[number, number][]}
 */
function mergeIntervals(intervals) {
  if (intervals.length === 0) return [];
  intervals.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  const merged = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const last = merged[merged.length - 1];
    if (intervals[i][0] <= last[1]) {
      last[1] = Math.max(last[1], intervals[i][1]);
    } else {
      merged.push(intervals[i]);
    }
  }
  return merged;
}

module.exports = { mergeIntervals };

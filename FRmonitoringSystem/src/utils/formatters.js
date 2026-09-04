/**
 * Data Formatting Utilities
 */

export function formatNumber(num) {
  if (num === null || num === undefined) return "0";
  return new Intl.NumberFormat("en-IN").format(num);
}

export function formatArea(ha) {
  if (!ha && ha !== 0) return "N/A";
  return `${ha.toFixed(1)} ha`;
}

export function formatPercent(val) {
  if (!val && val !== 0) return "0%";
  return `${val.toFixed(1)}%`;
}

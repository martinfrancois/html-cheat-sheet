// The page's own HTML, CSS and JavaScript may use a web feature six months after it became Baseline
// newly available: docs/adr/0016-use-web-features-six-months-after-they-become-baseline.md.
export const MONTHS_AFTER_BASELINE = 6;

// The shape web-features gives a feature's status and each entry of its by_compat_key.
export interface BaselineStatus {
  baseline: boolean | "high" | "low";
  baseline_low_date?: string;
}

// The date from which the page may use a feature with this status, or undefined while it isn't
// Baseline at all.
export function usableSince(status: BaselineStatus): Date | undefined {
  if (!status.baseline || !status.baseline_low_date) return undefined;
  const since = new Date(status.baseline_low_date.replace("≤", ""));
  since.setUTCMonth(since.getUTCMonth() + MONTHS_AFTER_BASELINE);
  return since;
}

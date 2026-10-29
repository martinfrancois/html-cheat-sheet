import type { CompatStatus } from "../src/lib/baseline.ts";
import { withoutOrEarlier } from "../src/lib/support.ts";

// The page's own HTML, CSS and JavaScript may use a web feature six months after it became Baseline
// newly available: docs/adr/0016-use-web-features-six-months-after-they-become-baseline.md.
const MONTHS_AFTER_BASELINE = 6;

// The date from which the page may use a feature with this status, or undefined while it isn't
// Baseline. A day the target month doesn't have, such as 31 August plus six months, becomes that
// month's last day.
export function usableSince(status: Pick<CompatStatus, "baseline" | "baseline_low_date">): Date | undefined {
  const low = withoutOrEarlier(status.baseline_low_date);
  if (!status.baseline || !low) return undefined;
  const since = new Date(low);
  const day = since.getUTCDate();
  since.setUTCDate(1);
  since.setUTCMonth(since.getUTCMonth() + MONTHS_AFTER_BASELINE);
  const lastDay = new Date(Date.UTC(since.getUTCFullYear(), since.getUTCMonth() + 1, 0)).getUTCDate();
  since.setUTCDate(Math.min(day, lastDay));
  return since;
}

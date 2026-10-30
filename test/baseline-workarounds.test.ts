// Each workaround here exists only because a web feature hasn't been Baseline long enough for the
// page to use it, see docs/adr/0016-use-web-features-six-months-after-they-become-baseline.md.
// A workaround's test fails on the day its feature qualifies, with or without a code change, and
// the fix is to remove the workaround as its entry says. Use the date of the most specific compat
// key the code relies on, such as css.selectors.popover-open rather than the whole popover feature.
import assert from "node:assert/strict";
import { test } from "node:test";
import { compatStatus } from "../src/lib/baseline.ts";
import { usableSince } from "./page-features.ts";

const workarounds: { compatKey: string; where: string; remove: string }[] = [
  {
    compatKey: "css.properties.text-wrap.pretty",
    where: "src/components/Example.astro",
    remove: "drop keepLastWordsTogether and give the title text-wrap: pretty (Tailwind's text-pretty) instead, then check that a wrapping title still doesn't leave one word alone on its last line",
  },
  {
    compatKey: "api.Window.requestIdleCallback",
    where: "src/scripts/analytics.ts",
    remove: "start analytics with requestIdleCallback instead of the two-second setTimeout in setupAnalytics, and update its comment and the two seconds in SPEC.md and ADR 0013",
  },
];


for (const { compatKey, where, remove } of workarounds) {
  test(`${compatKey} can't be used on the page yet`, () => {
    const found = compatStatus(compatKey);
    assert.notEqual(found, undefined, `web-features no longer knows ${compatKey}`);
    const since = usableSince(found!);
    assert.ok(since === undefined || since > new Date(), `${compatKey} can be used since ${since?.toISOString().slice(0, 10)}. Remove the workaround in ${where}: ${remove}`);
  });
}

test("the page may use a feature six months after it became Baseline", () => {
  assert.deepEqual(usableSince({ baseline: "low", baseline_low_date: "2025-09-15" }), new Date("2026-03-15"));
  assert.deepEqual(usableSince({ baseline: "low", baseline_low_date: "2025-08-31" }), new Date("2026-02-28"));
  // web-features writes "≤2020-01-29" when it only knows an upper bound.
  assert.deepEqual(usableSince({ baseline: "high", baseline_low_date: "≤2020-01-29" }), new Date("2020-07-29"));
});

test("the page may not use a feature that isn't Baseline", () => {
  assert.equal(usableSince({ baseline: false }), undefined);
});

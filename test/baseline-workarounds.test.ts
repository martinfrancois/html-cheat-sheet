// Each workaround here exists only because a web feature hasn't been Baseline long enough for the
// page to use it, see docs/adr/0016-use-web-features-six-months-after-they-become-baseline.md.
// The test fails once the feature qualifies, so the workaround gets removed in the Renovate update
// that brings the news.
import assert from "node:assert/strict";
import { test } from "node:test";
import { features } from "web-features";
import { usableSince } from "./page-features.ts";

const workarounds: { compatKey: string; where: string; remove: string }[] = [];

function status(compatKey: string) {
  for (const feature of Object.values(features)) {
    const byKey = "status" in feature ? feature.status?.by_compat_key : undefined;
    if (byKey?.[compatKey]) return byKey[compatKey];
  }
  return undefined;
}

for (const { compatKey, where, remove } of workarounds) {
  test(`${compatKey} can't be used on the page yet`, () => {
    const found = status(compatKey);
    assert.notEqual(found, undefined, `web-features no longer knows ${compatKey}`);
    const since = usableSince(found!);
    assert.ok(since === undefined || since > new Date(), `${compatKey} can be used since ${since?.toISOString().slice(0, 10)}. Remove the workaround in ${where}: ${remove}`);
  });
}

test("a feature can be used six months after it became Baseline, and never before", () => {
  assert.deepEqual(usableSince({ baseline: "low", baseline_low_date: "2025-09-15" }), new Date("2026-03-15"));
  assert.equal(usableSince({ baseline: false }), undefined);
  // web-features writes "≤2020-01-29" when it only knows an upper bound.
  assert.deepEqual(usableSince({ baseline: "high", baseline_low_date: "≤2020-01-29" }), new Date("2020-07-29"));
});

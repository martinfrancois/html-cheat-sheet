// Each workaround here exists only because a web feature is not Baseline widely available yet.
// The test fails once web-features reports it widely available, so the workaround gets removed
// in the Renovate update that brings the news.
import assert from "node:assert/strict";
import { test } from "node:test";
import { features } from "web-features";

const workarounds = [
  {
    compatKey: "css.types.color.light-dark",
    where: "src/styles/global.css, the second copy of the dark palette under :root[data-theme=dark]",
    remove: "Write each colour token once with light-dark(), drop the duplicated block and test/styles.test.ts.",
  },
  {
    compatKey: "css.selectors.popover-open",
    where: "src/scripts/frame-document.ts, the try around matches(\":modal, :popover-open\")",
    remove: "Call element.matches(\":modal, :popover-open\") directly and drop the sentence about it in the comment above.",
  },
];

function status(compatKey: string): unknown {
  for (const feature of Object.values(features)) {
    const byKey = "status" in feature ? feature.status?.by_compat_key : undefined;
    if (byKey?.[compatKey]) return byKey[compatKey].baseline;
  }
  return undefined;
}

for (const { compatKey, where, remove } of workarounds) {
  test(`${compatKey} is still not Baseline widely available`, () => {
    const level = status(compatKey);
    assert.notEqual(level, undefined, `web-features no longer knows ${compatKey}`);
    assert.notEqual(level, "high", `${compatKey} is widely available now. Remove the workaround in ${where}: ${remove}`);
  });
}

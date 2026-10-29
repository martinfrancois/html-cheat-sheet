import assert from "node:assert/strict";
import { test } from "node:test";
import { compatStatus } from "../src/lib/baseline.ts";
import { REQUIRED_FEATURES } from "../src/lib/required-features.ts";
import { listOf, supportedBrowsers } from "../src/lib/supported-browsers.ts";
import { usableSince } from "./page-features.ts";

// The page may only need a feature the six-month rule allows (docs/adr/0016), and the notice names
// versions only for features web-features knows.
test("every required feature exists and may be used on the page", () => {
  for (const { compatKey } of REQUIRED_FEATURES) {
    const status = compatStatus(compatKey);
    assert.notEqual(status, undefined, `web-features doesn't know ${compatKey}`);
    const since = usableSince(status!);
    assert.ok(since && since <= new Date(), `${compatKey} isn't usable on the page yet`);
  }
});

test("the notice names each browser's first version with every required feature", () => {
  assert.deepEqual(supportedBrowsers(["css.types.color.light-dark", "javascript.builtins.Set.intersection"]), ["Chrome 123", "Edge 123", "Firefox 127", "Safari 17.5"]);
  // Firefox for Android computed an image's aspect ratio from its attributes eight versions later.
  assert.deepEqual(supportedBrowsers(["html.elements.img.aspect_ratio_computed_from_attributes"]), ["Chrome 79", "Edge 79", "Firefox on desktop 71", "Firefox for Android 79", "Safari 15"]);
});

test("a list of browsers reads as a sentence", () => {
  assert.equal(listOf(["Chrome 132", "Edge 132", "Firefox 143", "Safari 26"]), "Chrome 132, Edge 132, Firefox 143 and Safari 26");
  assert.equal(listOf(["Chrome 132"]), "Chrome 132");
});

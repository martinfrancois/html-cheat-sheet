import assert from "node:assert/strict";
import { test } from "node:test";
import { support } from "../src/lib/support.ts";

// The numbers move with every data release, so these check the shape and the bounds, not a value.
test("an element every browser has had for decades works for nearly every visitor", () => {
  const b = support("html.elements.b");
  assert.ok(b && b.share >= 90 && b.share <= 100, `share ${b?.share}`);
  assert.deepEqual(b.missing, []);
});

test("a feature a major browser lacks names that browser and counts fewer visitors", () => {
  const all = support("html.elements.b")!;
  // <fencedframe> is deprecated and Chrome-only; Firefox and Safari never shipped it.
  const fenced = support("html.elements.fencedframe");
  assert.ok(fenced, "the compat data still has html.elements.fencedframe; pick another deprecated, Chrome-only feature");
  assert.ok(fenced.share < all.share);
  assert.ok(fenced.missing.includes("Firefox"), `missing: ${fenced.missing.join(", ")}`);
});

test("a compat key that doesn't exist has no support data", () => {
  assert.equal(support("html.elements.not_an_element"), undefined);
});

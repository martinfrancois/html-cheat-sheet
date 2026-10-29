import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import spec from "../src/data/spec.json" with { type: "json" };

const text = readFileSync(new URL("../SPEC.md", import.meta.url), "utf8");

test("every relative link in SPEC.md points at a file that exists", () => {
  const links = [...text.matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)].map((match) => match[1]!).filter((href) => !/^[a-z]+:/.test(href));
  assert.deepEqual(
    links.filter((href) => !existsSync(new URL(`../${href}`, import.meta.url))),
    [],
  );
});

test("SPEC.md states the coverage counts of src/data/spec.json", () => {
  const total = spec.elements.length + spec.globalAttributes.length + spec.obsolete.length;
  const stated = text.match(/(\d+) elements \(.*?\), (\d+) global attributes and (\d+)\s+obsolete elements, (\d+) names in all/s);
  assert.ok(stated, "section 4 no longer states the counts in the expected words");
  assert.deepEqual(stated.slice(1).map(Number), [spec.elements.length, spec.globalAttributes.length, spec.obsolete.length, total]);
});

test("SPEC.md uses no em dashes", () => {
  assert.equal(text.includes("—"), false);
});

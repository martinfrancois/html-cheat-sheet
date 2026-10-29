import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { roles } from "../src/lib/roles.ts";

const spec = JSON.parse(await readFile(new URL("../src/data/spec.json", import.meta.url), "utf8")) as {
  elements: { role: string | null }[];
  obsolete: { role: string | null }[];
};

test("every role in the spec data has a plain-words gloss", () => {
  const named = new Set([...spec.elements, ...spec.obsolete].map((element) => element.role).filter((role): role is string => Boolean(role)));
  assert.deepEqual([...named].filter((role) => !roles.has(role)).sort(), []);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const css = readFileSync(new URL("../src/styles/global.css", import.meta.url), "utf8");

function declarations(selector: RegExp): string {
  const match = css.match(selector);
  assert.ok(match, `no block matches ${selector}`);
  return match[1]!.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").trim();
}

// Each colour token holds both themes, so a token missing its dark value shows the light one there.
test("every colour token gives a light and a dark value, or mixes only tokens that do", () => {
  const palette = declarations(/^:root \{([^}]*)\}/m);
  assert.match(palette, /color-scheme: light dark;/);
  const tokens = [...palette.matchAll(/(--[a-z-]+): ([^;]+);/g)];
  assert.ok(tokens.length > 0);
  const lightOnly = tokens.filter(([, , value]) => !value!.startsWith("light-dark(") && /#[0-9a-f]{3,8}\b|\b(?:white|black)\b/i.test(value!)).map(([, name]) => name);
  assert.deepEqual(lightOnly, []);
});

// The browser paints its own bar and the installed app's window in these colours, so they match
// the page background in each theme.
test("the theme colours in the page head and the manifest match the page background", () => {
  const page = readFileSync(new URL("../src/pages/index.astro", import.meta.url), "utf8");
  const manifest = JSON.parse(readFileSync(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));
  const [, light, dark] = declarations(/^:root \{([^}]*)\}/m).match(/--bg: light-dark\((#[0-9a-f]+), (#[0-9a-f]+)\);/)!;
  const meta = (scheme: string) => page.match(new RegExp(`<meta name="theme-color" content="(#[0-9a-f]+)" media="\\(prefers-color-scheme: ${scheme}\\)"`))?.[1];
  assert.equal(meta("light"), light);
  assert.equal(meta("dark"), dark);
  assert.equal(manifest.background_color, light);
  assert.equal(manifest.theme_color, light);
});


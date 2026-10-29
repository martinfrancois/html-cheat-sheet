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
test("every colour token gives a light and a dark value, or derives from tokens that do", () => {
  const palette = declarations(/^:root \{([^}]*)\}/m);
  const tokens = [...palette.matchAll(/(--[a-z-]+): ([^;]+);/g)];
  assert.ok(tokens.length > 0);
  const oneValue = tokens.filter(([, , value]) => !value!.startsWith("light-dark(") && !value!.includes("var(--")).map(([, name]) => name);
  assert.deepEqual(oneValue, []);
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

// The index opens where its toggle is hidden by Tailwind's sm: variant.
test("the index opens at Tailwind's sm breakpoint", () => {
  const page = readFileSync(new URL("../src/pages/index.astro", import.meta.url), "utf8");
  const tailwind = readFileSync(new URL("../node_modules/tailwindcss/theme.css", import.meta.url), "utf8");
  const sm = tailwind.match(/--breakpoint-sm: ([^;]+);/)![1];
  assert.equal(page.match(/data-open-from="([^"]+)"/)?.[1], `(min-width: ${sm})`);
});

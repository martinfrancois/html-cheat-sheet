import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const css = readFileSync(new URL("../src/styles/global.css", import.meta.url), "utf8");

function declarations(selector: RegExp): string {
  const match = css.match(selector);
  assert.ok(match, `no block matches ${selector}`);
  return match[1]!.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").trim();
}

// The dark palette is written twice: once for the system setting, once for the explicit choice.
test("the two dark theme blocks define the same tokens", () => {
  const system = declarations(/:root:not\(\[data-theme="light"\]\) \{([^}]*)\}/);
  const chosen = declarations(/:root\[data-theme="dark"\] \{([^}]*)\}/);
  assert.equal(chosen, system);
});

test("the dark blocks redefine every colour token the light palette has", () => {
  const tokens = (block: string) => [...block.matchAll(/(--[a-z-]+):/g)].map((match) => match[1]).sort();
  const light = declarations(/^:root \{([^}]*)\}/m);
  const dark = declarations(/:root\[data-theme="dark"\] \{([^}]*)\}/);
  assert.deepEqual(tokens(dark), tokens(light));
});

// The browser paints its own bar and the installed app's window in these colours, so they match
// the page background in each theme.
test("the theme colours in the page head and the manifest match the page background", () => {
  const page = readFileSync(new URL("../src/pages/index.astro", import.meta.url), "utf8");
  const manifest = JSON.parse(readFileSync(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));
  const background = (block: string) => block.match(/--bg: (#[0-9a-f]+);/)![1];
  const light = background(declarations(/^:root \{([^}]*)\}/m));
  const dark = background(declarations(/:root\[data-theme="dark"\] \{([^}]*)\}/));
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

import { readdir, readFile, writeFile } from "node:fs/promises";
import tailwindcss from "@tailwindcss/vite";
import type { AstroIntegration } from "astro";
import { defineConfig } from "astro/config";
import { DEFAULT_CATEGORY_FALLBACKS, type FontCategory, FontaineTransform } from "fontaine";

// Until the web fonts arrive, text is drawn in a fallback font. fontaine gives each fallback the
// web font's size and line height, so the page barely moves when the fonts swap in:
// docs/adr/0017. fontaine can't tell the variable mono fonts are monospace, and its sans list leaves
// out Roboto, Android's system font.
function systemFonts(category: FontCategory): string[] {
  const fonts = DEFAULT_CATEGORY_FALLBACKS[category];
  if (!fonts) throw new Error(`fontaine has no ${category} fallbacks`);
  return fonts;
}
const FALLBACKS = {
  "Atkinson Hyperlegible Next Variable": [...systemFonts("sans-serif"), "Roboto"],
  "Atkinson Hyperlegible Mono Variable": systemFonts("monospace"),
  "Martian Mono Variable": systemFonts("monospace"),
};

// Cloudflare, in front of the site, can run Rocket Loader, which holds back every script until after
// the first paint. The inline script must run before it, or a saved dark theme flashes light.
// Rocket Loader leaves a script with data-cfasync="false" alone: the inline one carries it in
// src/pages/index.astro, and this adds it to the module script
// Astro writes, which would stop being bundled if the attribute were in its source. No library adds
// an attribute to Astro's script tags, and Astro has no setting for it: docs/adr/0014.
const skipRocketLoader: AstroIntegration = {
  name: "skip-rocket-loader",
  hooks: {
    "astro:build:done": async ({ dir }) => {
      const pages = (await readdir(dir, { recursive: true })).filter((path) => path.endsWith(".html"));
      let marked = 0;
      for (const path of pages) {
        const page = new URL(path, dir);
        const html = await readFile(page, "utf8");
        // Cloudflare reads the attribute only when it comes before src.
        const changed = html.replaceAll('<script type="module" src=', '<script type="module" data-cfasync="false" src=');
        if (changed === html) continue;
        await writeFile(page, changed);
        marked++;
      }
      // Astro changing how it writes the tag would otherwise leave every script unmarked.
      if (marked === 0) throw new Error("skip-rocket-loader: no module script found in any page");
    },
  },
};

export default defineConfig({
  site: "https://html.fmartin.ch",
  // GitHub Pages sends this header on every file. The live output frames have an origin of their
  // own and load captions with CORS (src/scripts/live-output.ts), so dev and preview send it too.
  server: { headers: { "Access-Control-Allow-Origin": "*" } },
  build: { inlineStylesheets: "always" },
  integrations: [skipRocketLoader],
  vite: {
    plugins: [FontaineTransform.vite({ fallbacks: FALLBACKS, resolvePath: (id) => new URL(id, import.meta.url) }), tailwindcss()],
  },
});

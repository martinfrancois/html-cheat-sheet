import { readFile, writeFile } from "node:fs/promises";
import tailwindcss from "@tailwindcss/vite";
import type { AstroIntegration } from "astro";
import { defineConfig } from "astro/config";

// Cloudflare, in front of the site, can run Rocket Loader, which holds back every script until after
// the first paint. The two inline scripts must run before it, or a saved dark theme flashes light
// and the index pushes the entries down. Rocket Loader leaves a script with data-cfasync="false"
// alone: the inline ones carry it in src/pages/index.astro, and this adds it to the module script
// Astro writes, which would stop being bundled if the attribute were in its source.
const skipRocketLoader: AstroIntegration = {
  name: "skip-rocket-loader",
  hooks: {
    "astro:build:done": async ({ dir }) => {
      const page = new URL("index.html", dir);
      const html = await readFile(page, "utf8");
      const marked = html.replaceAll('<script type="module" src=', '<script type="module" data-cfasync="false" src=');
      if (marked === html) throw new Error("skip-rocket-loader: no module script found in index.html");
      await writeFile(page, marked);
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
  vite: { plugins: [tailwindcss()] },
});

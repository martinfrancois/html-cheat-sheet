import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://html.fmartin.ch",
  // GitHub Pages sends this header on every file. The live output frames have an origin of their
  // own and load captions with CORS (src/scripts/live-output.ts), so dev and preview send it too.
  server: { headers: { "Access-Control-Allow-Origin": "*" } },
  build: { inlineStylesheets: "always" },
  vite: { plugins: [tailwindcss()] },
});

// Generates dist/sw.js after `astro build`. It precaches every file of the build, so after one
// visit the page, its fonts, images and the editor work offline. Each deploy changes the file
// hashes, which makes the browser install the new worker; src/scripts/offline.ts then offers a reload.
import { generateSW } from "workbox-build";

const { count, size, warnings } = await generateSW({
  globDirectory: "dist",
  globPatterns: ["**/*.{html,js,css,woff2,svg,png,webmanifest,webm,mp4,mp3,vtt}"],
  swDest: "dist/sw.js",
  // Wait for the reader to accept the update instead of swapping files under an open page.
  skipWaiting: false,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  navigateFallback: "/index.html",
  // Font files for scripts the page never shows (Cyrillic, Greek, Vietnamese) stay out.
  globIgnores: ["**/*-cyrillic*", "**/*-greek*", "**/*-vietnamese*", "sw.js", "workbox-*.js"],
  inlineWorkboxRuntime: true,
  sourcemap: false,
});

for (const warning of warnings) console.warn(warning);
console.log(`Service worker precaches ${count} files, ${(size / 1024).toFixed(0)} KiB`);

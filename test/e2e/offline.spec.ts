import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { preview } from "vite";
import { liveOutput } from "./helpers.ts";

test.use({ serviceWorkers: "allow" });

async function waitForServiceWorker(page: import("@playwright/test").Page): Promise<void> {
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
}

test("works offline after the first visit", async ({ page, context }) => {
  await page.goto("/");
  await waitForServiceWorker(page);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("<html> cheat sheet");
  const output = await liveOutput(page, "picture-source-example-1");
  await expect(output.getByRole("img")).toHaveJSProperty("complete", true);
});

test("offers a reload when a new version is deployed, then shows it", async ({ page }) => {
  // Serve a copy of the build, so the test can deploy a changed version into it.
  const root = await mkdtemp(join(tmpdir(), "html-cheat-sheet-deploy-"));
  await cp("dist", root, { recursive: true });
  // Port 0 takes a free port, so the test can run in several browsers at once.
  const server = await preview({ configFile: false, root, build: { outDir: root }, preview: { host: "127.0.0.1", port: 0 } });
  try {
    await page.goto(server.resolvedUrls!.local[0]!);
    await waitForServiceWorker(page);

    // A deploy changes the page and, with it, the page's revision in the service worker.
    const html = join(root, "index.html");
    await writeFile(html, (await readFile(html, "utf8")).replace("cheat sheet</a></h1>", "cheat sheet, new version</a></h1>"));
    const worker = join(root, "sw.js");
    await writeFile(worker, (await readFile(worker, "utf8")).replace(/(\{url:"index\.html",revision:")[^"]+/, "$1deployed"));
    await page.evaluate(() => navigator.serviceWorker.getRegistration().then((registration) => registration?.update()));

    const notice = page.locator("#update-notice");
    await expect(notice).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("<html> cheat sheet");
    await notice.getByRole("button", { name: "Reload" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("<html> cheat sheet, new version");
  } finally {
    await new Promise<void>((resolve) => server.httpServer.close(() => resolve()));
    await rm(root, { recursive: true, force: true });
  }
});

import { expect, test } from "@playwright/test";

// Playwright hides Chromium's scrollbars. Without that flag Chromium draws a 15 pixel one, as on
// Windows and on Linux without overlay scrollbars. Playwright's Firefox and WebKit draw none, so
// this file runs in Chromium only (playwright.config.ts). A launch option needs a file of its own.
test.use({ launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } });

// The page lets code chips wrap by the width of the entry column, which a scrollbar narrows, not
// by the screen's: docs/adr/0027-let-kept-together-pieces-wrap-in-a-narrower-column.md
test("code chips wrap at 320 pixels beside a classic scrollbar", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.clientWidth)).toBeLessThan(320);
  await expect(page.locator("article#marquee code.whitespace-nowrap").first()).toHaveCSS("white-space", "normal");
});

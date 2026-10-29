import { expect, test } from "@playwright/test";
import { entry, fontsReady, liveOutput } from "./helpers.ts";

// Screenshots catch what the functional tests can't: a dependency update that shifts layout,
// colours, fonts or highlighting. When one fails, look at the diff images in the report before
// updating: docs/agents/testing.md.
for (const colorScheme of ["light", "dark"] as const) {
  for (const [device, viewport] of [
    ["desktop", { width: 1280, height: 900 }],
    ["phone", { width: 390, height: 844 }],
  ] as const) {
    test.describe(`${colorScheme} ${device}`, () => {
      test.use({ colorScheme, viewport });

      test("top of the page", async ({ page }) => {
        await page.goto("/");
        await fontsReady(page);
        await expect(page).toHaveScreenshot(`top-${colorScheme}-${device}.png`);
      });

      for (const id of ["strong-b", "dialog", "attr-popover", "center"]) {
        test(`entry ${id}`, async ({ page }) => {
          await page.goto("/");
          await fontsReady(page);
          // A screenshot of an element taller than the viewport would otherwise show the sticky
          // header wherever the scroll position left it.
          await page.addStyleTag({ content: "body > header { position: static !important; }" });
          const article = entry(page, id);
          const examples = await article.locator("[data-example]").evaluateAll((figures) => figures.map((figure) => figure.id));
          for (const example of examples) await liveOutput(page, example);
          // Chromium captures an element taller than the viewport with its frames blank and its
          // masks missing, so the viewport grows to hold the whole entry.
          const { height } = (await article.boundingBox())!;
          await page.setViewportSize({ width: viewport.width, height: Math.max(viewport.height, Math.ceil(height)) });
          // Support badges show usage shares that change with every caniuse-lite release.
          await expect(article).toHaveScreenshot(`entry-${id}-${colorScheme}-${device}.png`, { mask: [article.locator("[data-support]")] });
        });
      }
    });
  }
}

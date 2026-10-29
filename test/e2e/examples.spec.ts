import AxeBuilder from "@axe-core/playwright";
import { readdirSync, readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { parse } from "yaml";
import { frameDocument } from "../../src/scripts/frame-document.ts";

// Every example loads its images and meets WCAG 2.2 AA, checked one entry at a time in the
// document its live output frame shows. One axe run over the whole page and its 140 frames takes minutes. The markup is the
// same in every browser, so only Chromium runs it (playwright.config.ts).
const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const dir = new URL("../../src/content/entries/", import.meta.url);
const entries = readdirSync(dir)
  .filter((file) => file.endsWith(".yaml"))
  .map((file) => ({ file, examples: (parse(readFileSync(new URL(file, dir), "utf8")) as { examples: { code: string }[] }).examples }));

for (const { file, examples } of entries) {
  test(`the examples of ${file} load their images and meet WCAG 2.2 AA apart from browser default colours`, async ({ page }) => {
    for (const [index, { code }] of examples.entries()) {
      // Served from the site's own origin, so relative URLs such as images/stickman.svg resolve.
      const url = `/example-under-test-${index}`;
      await page.route(url, (route) => route.fulfill({ contentType: "text/html", body: frameDocument(code, "light") }));
      await page.goto(url);
      const broken = await page.locator("img, input[type=image]").evaluateAll((images) =>
        images.filter((image) => image instanceof HTMLImageElement && (!image.complete || image.naturalWidth === 0)).map((image) => image.outerHTML),
      );
      expect(broken, "every image loads").toEqual([]);
      const whole = /<html[\s>]/i.test(code);
      // axe waits forever on an example's own <iframe> sandboxed without scripts, so frames are
      // left out and their one rule, a title, is checked here.
      const untitled = await page.locator("iframe:not([title])").count();
      expect(untitled, "every <iframe> has a title").toBe(0);
      const results = await new AxeBuilder({ page })
        .exclude("iframe")
        .withTags(WCAG)
        // Live output shows the browser's default colours and control sizes, which WCAG exempts as
        // the user agent's; axe can't tell them apart from the page's own.
        .disableRules([
          "color-contrast",
          "target-size",
          // A fragment sits in a frame of the cheat sheet, whose own title and language apply.
          ...(whole ? [] : ["document-title", "html-has-lang"]),
        ])
        .analyze();
      expect(results.violations, code).toEqual([]);
    }
  });
}

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Result } from "axe-core";
import { renderAllFrames } from "./helpers.ts";

// The rules in docs/agents/accessibility.md: WCAG 2.2 AA everywhere, AAA for contrast (7:1) and
// text size, in both themes, at desktop and phone width.
const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "wcag2aaa"];

// The owner's rule holds large text to AA (3:1) and small text to AAA (7:1). axe's enhanced check
// wants 4.5:1 for large text, so its large-text findings are dropped here; the AA rule
// (color-contrast) still fails any large text under 3:1.
function withLargeTextAtAA(violations: Result[]): Result[] {
  return violations
    .map((violation) =>
      violation.id !== "color-contrast-enhanced"
        ? violation
        : { ...violation, nodes: violation.nodes.filter((node) => node.any.some((check) => (check.data as { expectedContrastRatio?: string })?.expectedContrastRatio !== "4.5:1")) },
    )
    .filter((violation) => violation.nodes.length > 0);
}

for (const colorScheme of ["light", "dark"] as const) {
  for (const [device, viewport] of [
    ["desktop", { width: 1280, height: 900 }],
    ["phone", { width: 390, height: 844 }],
  ] as const) {
    test.describe(`${colorScheme} theme on a ${device}`, () => {
      test.use({ colorScheme, viewport });
      // Rendering every live output first takes a while; test/e2e/examples.spec.ts checks the
      // examples themselves.
      test.slow();

      test("the page meets WCAG 2.2 AA and AAA contrast", async ({ page }) => {
        await page.goto("/");
        await renderAllFrames(page);
        // Live output is the browser's own default rendering of an example, the subject being
        // shown, so test/e2e/examples.spec.ts checks it without the contrast rules.
        const results = await new AxeBuilder({ page }).withTags(WCAG).exclude("iframe").analyze();
        expect(withLargeTextAtAA(results.violations)).toEqual([]);
      });
    });
  }
}

// The back-to-top link is hidden at the top, where the scans above run.
test("the back-to-top link meets WCAG 2.2 AA in both themes", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => scrollTo(0, innerHeight * 3));
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme });
    await expect(page.getByRole("link", { name: "Back to top" })).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(WCAG).include("#to-top").analyze();
    expect(results.violations).toEqual([]);
  }
});

test("no text is smaller than 15 pixels and running text has a line height of at least 1.5", async ({ page }) => {
  await page.goto("/");
  const problems = await page.evaluate(() => {
    const found: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const element = node.parentElement;
      if (!element || !node.textContent?.trim() || element.closest(".sr-only, [hidden], script, style")) continue;
      const style = getComputedStyle(element);
      const size = Number.parseFloat(style.fontSize);
      if (size < 15) found.push(`${size}px: ${node.textContent.trim().slice(0, 40)}`);
      if (element.closest("p") && style.lineHeight !== "normal" && Number.parseFloat(style.lineHeight) / size < 1.5) {
        found.push(`line height ${style.lineHeight} at ${size}px: ${node.textContent.trim().slice(0, 40)}`);
      }
    }
    return found;
  });
  expect(problems).toEqual([]);
});

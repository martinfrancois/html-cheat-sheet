import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Result } from "axe-core";
import { liveOutput, layOutEveryEntry, renderAllFrames } from "./helpers.ts";

// The rules in docs/agents/accessibility.md: WCAG 2.2 AA everywhere, AAA for contrast (7:1) and
// text size, in both themes, at desktop and phone width.
const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "wcag2aaa"];

// martinfrancois's rule holds large text to AA (3:1) and small text to AAA (7:1). axe's enhanced
// check wants 4.5:1 for large text, so its large-text findings are dropped here; the AA rule
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
        await layOutEveryEntry(page);
        // Live output is the browser's own default rendering of an example, the subject being
        // shown, so test/e2e/examples.spec.ts checks it without the contrast rules.
        const results = await new AxeBuilder({ page }).withTags(WCAG).exclude("iframe").analyze();
        expect(withLargeTextAtAA(results.violations)).toEqual([]);
      });
    });
  }
}

// Lighthouse checks contrast as the page loads, before the entries below the screen are drawn.
// Their contents are laid out then but their box keeps its estimated height, so a taller entry
// spills into the next one and axe reads a code chip as the next entry's background.
// One scan per test: each scans the whole page, which alone takes most of the default timeout on a
// slow CI runner.
for (const colorScheme of ["light", "dark"] as const) {
  for (const [device, viewport] of [
    ["desktop", { width: 1350, height: 940 }],
    ["phone", { width: 412, height: 823 }],
  ] as const) {
    test.describe(`${colorScheme} theme at Lighthouse's ${device} size`, () => {
      test.use({ colorScheme, viewport });
      test.slow();

      test("text contrast holds before the entries are drawn", async ({ page }) => {
        await page.goto("/");
        const results = await new AxeBuilder({ page }).withRules(["color-contrast", "color-contrast-enhanced"]).exclude("iframe").analyze();
        expect(withLargeTextAtAA(results.violations)).toEqual([]);
      });
    });
  }
}

// An entry clips whatever reaches past its box (docs/adr/0018), so text there is lost, which WCAG
// 1.4.10 rules out down to 320 pixels, and so is the part of a focus ring outside it.
for (const width of [320, 390, 1280]) {
  test(`nothing in an entry, focus rings included, reaches past its edge at ${width} pixels`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await layOutEveryEntry(page);
    const cut = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const ring = parseFloat(root.getPropertyValue("--focus-width")) + parseFloat(root.getPropertyValue("--focus-offset"));
      const found: string[] = [];
      for (const entry of document.querySelectorAll("[data-entry]")) {
        const box = entry.getBoundingClientRect();
        for (const element of entry.querySelectorAll("*")) {
          const rect = element.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          const reach = element.matches("a[href], button, textarea, summary, [tabindex='0']") ? ring : 0;
          const outside = rect.left - reach < box.left - 0.5 || rect.right + reach > box.right + 0.5 || rect.top - reach < box.top - 0.5 || rect.bottom + reach > box.bottom + 0.5;
          if (outside) found.push(`${entry.id}: <${element.tagName.toLowerCase()}> ${element.textContent?.trim().slice(0, 30)}`);
        }
      }
      return found;
    });
    expect(cut).toEqual([]);
  });
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

// The notice shows only in a browser that lacks a feature the page needs.
test("the browser notice meets WCAG 2.2 AA and AAA contrast in both themes", async ({ page }) => {
  await page.addInitScript(() => delete (Set.prototype as { intersection?: unknown }).intersection);
  await page.goto("/");
  await expect(page.getByText(/is too old for parts of this page/)).toBeVisible();
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme });
    const results = await new AxeBuilder({ page }).withTags(WCAG).include("#browser-notice").analyze();
    expect(withLargeTextAtAA(results.violations)).toEqual([]);
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

// Firefox focused the live output of bdi and br below the screen, out of sight (WCAG 2.4.11):
// https://github.com/martinfrancois/html-cheat-sheet/issues/21
test("Tab never moves focus to a place out of sight", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator("article#mark a").last().focus();
  const hidden: string[] = [];
  for (let press = 1; press <= 40; press++) {
    await page.keyboard.press("Tab");
    // Below the sticky header and above the bottom of the screen.
    const place = await page.evaluate(() => {
      const focused = document.activeElement!;
      const { top, bottom } = focused.getBoundingClientRect();
      const shown = bottom > document.querySelector("body > header")!.getBoundingClientRect().bottom && top < innerHeight;
      return shown ? undefined : `${focused.closest("article")?.id}: <${focused.tagName.toLowerCase()}> from ${Math.round(top)} to ${Math.round(bottom)}`;
    });
    if (place) hidden.push(`Tab ${press}, ${place}`);
  }
  expect(hidden).toEqual([]);
});

// A frame with nothing focusable inside, just past either edge of the screen, the case every
// browser leaves out of sight.
test("Tab and Shift+Tab bring a live output frame into view", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const example = page.locator("#bdi [data-example]").first();
  await liveOutput(page, (await example.getAttribute("id"))!);
  const frame = example.locator("[data-live-output] > iframe");
  const inView = () =>
    frame.evaluate((element) => {
      const { top, bottom } = element.getBoundingClientRect();
      return bottom > document.querySelector("body > header")!.getBoundingClientRect().bottom && top < innerHeight;
    });

  await frame.evaluate((element) => scrollBy(0, element.getBoundingClientRect().top - innerHeight - 10));
  await example.locator("[data-code-view] pre").evaluate((code: HTMLElement) => code.focus({ preventScroll: true }));
  expect(await inView()).toBe(false);
  await page.keyboard.press("Tab");
  await expect.poll(inView).toBe(true);

  // Firefox stops twice in a frame in Playwright's build, once in the stock one.
  while (await frame.evaluate((element) => document.activeElement === element)) await page.keyboard.press("Tab");
  // With the frame scrolled up under the sticky header.
  await frame.evaluate((element) => scrollBy(0, element.getBoundingClientRect().bottom - 10));
  expect(await inView()).toBe(false);
  await page.keyboard.press("Shift+Tab");
  await expect.poll(inView).toBe(true);
});

// src/scripts/live-output.ts scrolls a live output frame into view when Tab focuses it, because
// the browsers don't when the frame has nothing focusable inside. This page has none of the
// site's styles or scripts. When the test fails, the browser scrolls on its own; once it fails in
// all three, drop showFocusedFrame and this test.
test("browsers still leave a frame that Tab focuses below the screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.setContent(`<button>Before</button><iframe title="Text only" srcdoc="<p>Text</p>" style="display: block; margin-top: 2000px"></iframe>`);
  await expect(page.frameLocator("iframe").locator("p")).toHaveText("Text");
  await page.getByRole("button", { name: "Before" }).focus();
  await page.keyboard.press("Tab");
  await expect.poll(() => page.evaluate(() => document.activeElement?.tagName)).toBe("IFRAME");
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(await page.evaluate(() => scrollY)).toBe(0);
});

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Result } from "axe-core";
import { BESIDE_A_SCROLLBAR, layOutEveryEntry, liveOutput, outOfView, renderAllFrames } from "./helpers.ts";

// The rules in docs/agents/accessibility.md: WCAG 2.2 AA everywhere, AAA for contrast (7:1) and
// text size, in both themes, at desktop and phone width.
const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "wcag2aaa"];
const DESKTOP = { width: 1280, height: 900 };
const PHONE = { width: 390, height: 844 };

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
    ["desktop", DESKTOP],
    ["phone", PHONE],
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
for (const width of [BESIDE_A_SCROLLBAR, 320, 390, 1280]) {
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
          const reach = element.matches("a[href], button, textarea, summary, [tabindex='0'], [data-live-output]") ? ring : 0;
          const outside = rect.left - reach < box.left - 0.5 || rect.right + reach > box.right + 0.5 || rect.top - reach < box.top - 0.5 || rect.bottom + reach > box.bottom + 0.5;
          if (outside) found.push(`${entry.id}: <${element.tagName.toLowerCase()}> ${element.textContent?.trim().slice(0, 30)}`);
        }
      }
      return found;
    });
    expect(cut).toEqual([]);
  });
}

// Code chips are sized for the column a 320 pixel screen leaves, and wrap in a narrower one, also
// when a scrollbar narrows it: docs/adr/0027-let-kept-together-pieces-wrap-in-a-narrower-column.md
test("code chips start to wrap just below the column a 320 pixel screen leaves", async ({ page }) => {
  await page.goto("/");
  const chip = page.locator("article#marquee code.whitespace-nowrap").first();
  for (const [width, whiteSpace] of [
    [320, "nowrap"],
    [319, "normal"],
  ] as const) {
    await page.setViewportSize({ width, height: 800 });
    await expect(chip).toHaveCSS("white-space", whiteSpace);
  }
});

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

// The probe from html-cheat-sheet issue 21, where Firefox focused the live output of bdi and br
// below the screen: docs/adr/0025-scroll-a-live-output-frame-that-tab-focuses-into-view.md
test("Tab never moves focus to a place out of sight", async ({ page }) => {
  // 40 presses and checks, each about 200 ms slower in WebKit on this page (docs/adr/0018).
  test.slow();
  await page.setViewportSize(PHONE);
  await page.goto("/");
  await page.locator("article#mark a").last().focus();
  for (let press = 1; press <= 40; press++) {
    await page.keyboard.press("Tab");
    // The page scrolls a focused frame a task after the key.
    await expect.poll(() => page.evaluate(outOfView, null), { message: `Tab ${press}` }).toBeUndefined();
  }
});

// A frame with nothing focusable inside, just past either edge of the screen, the case every
// browser leaves out of sight.
for (const [device, viewport] of [
  ["desktop", DESKTOP],
  ["phone", PHONE],
] as const) {
  test(`Tab and Shift+Tab bring a live output frame into view on a ${device}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const example = page.locator("#bdi [data-example]").first();
    await liveOutput(page, (await example.getAttribute("id"))!);
    const frame = example.locator("[data-live-output] > iframe");
    const frameOutOfView = () => frame.evaluate(outOfView);

    await frame.evaluate((element) => scrollBy(0, element.getBoundingClientRect().top - innerHeight + 10));
    await example.locator("[data-code-view] pre").evaluate((code: HTMLElement) => code.focus({ preventScroll: true }));
    expect(await frameOutOfView()).toBeDefined();
    await page.keyboard.press("Tab");
    await expect.poll(frameOutOfView).toBeUndefined();

    // Firefox stops twice in a frame in Playwright's build, once in Mozilla's.
    while (await frame.evaluate((element) => document.activeElement === element)) await page.keyboard.press("Tab");
    // With the frame scrolled up under the sticky header.
    await frame.evaluate((element) => scrollBy(0, element.getBoundingClientRect().bottom - 10));
    expect(await frameOutOfView()).toBeDefined();
    await page.keyboard.press("Shift+Tab");
    await expect.poll(frameOutOfView).toBeUndefined();
  });
}

// No selector matches a frame that has focus, so the page draws the ring on the frame's box:
// docs/adr/0026-draw-the-focus-ring-of-a-live-output-frame.md
test("a live output frame that Tab focuses shows a focus ring until focus moves on or a press lands in it", async ({ page }) => {
  await page.goto("/");
  const example = page.locator("#bdi [data-example]").first();
  const output = await liveOutput(page, (await example.getAttribute("id"))!);
  const box = example.locator("[data-live-output]");
  const code = example.locator("[data-code-view] pre");
  const frameFocused = () => box.locator("iframe").evaluate((frame) => document.activeElement === frame);

  await code.focus();
  await page.keyboard.press("Tab");
  await expect(box).toHaveAttribute("data-focus-ring");
  await expect(box).toHaveCSS("outline-style", "solid");
  await expect(box).toHaveCSS("outline-width", "3px");
  while (await frameFocused()) await page.keyboard.press("Tab");
  await expect(box).not.toHaveAttribute("data-focus-ring");

  // A press keeps focus in the frame, as a click on a button does, and shows no ring either.
  await page.keyboard.press("Shift+Tab");
  await expect(box).toHaveAttribute("data-focus-ring");
  await output.locator("body").click();
  await expect(box).not.toHaveAttribute("data-focus-ring");
  expect(await frameFocused()).toBe(true);
});

test("a live output frame shows no ring while an element inside it shows its own", async ({ page, browserName }) => {
  await page.goto("/");
  const example = page.locator("#a [data-example]").first();
  const output = await liveOutput(page, (await example.getAttribute("id"))!);
  const box = example.locator("[data-live-output]");

  await example.locator("[data-code-view] pre").focus();
  await page.keyboard.press("Tab");
  // Playwright's Firefox stops on the frame itself first, then on its first link.
  if (browserName === "firefox") {
    await expect(box).toHaveAttribute("data-focus-ring");
    await page.keyboard.press("Tab");
  }
  await expect(output.getByRole("link").first()).toBeFocused();
  // The page marks the frame a task after the key, so wait for that before looking.
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve)));
  await expect(box).not.toHaveAttribute("data-focus-ring");

  // Not even for a moment while Tab moves to the next link.
  await box.evaluate((element) => {
    const marks = ((window as unknown as { marks: number }).marks = 0);
    new MutationObserver(() => (window as unknown as { marks: number }).marks++).observe(element, { attributeFilter: ["data-focus-ring"] });
    return marks;
  });
  await page.keyboard.press("Tab");
  await expect(output.getByRole("link").nth(1)).toBeFocused();
  // The frame reports both focus events before the key's task ends; one more task takes in both.
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve)));
  expect(await page.evaluate(() => (window as unknown as { marks: number }).marks)).toBe(0);
});

// A Tab pressed inside a frame goes to its document, so the frame reports it.
test("a live output frame that the reader tabs within shows the ring once nothing inside has focus", async ({ page }) => {
  await page.goto("/");
  const example = page.locator("#a [data-example]").first();
  const output = await liveOutput(page, (await example.getAttribute("id"))!);
  const box = example.locator("[data-live-output]");
  const firstLink = output.getByRole("link").first();

  await output.locator("p").first().click({ position: { x: 1, y: 1 } });
  await page.keyboard.press("Tab");
  await expect(firstLink).toBeFocused();
  await firstLink.evaluate((link: HTMLElement) => link.blur());
  await expect(box).toHaveAttribute("data-focus-ring");
});

// Playwright's Firefox fires no focus or blur on a frame's window, which the page needs here.
test("a click into a frame inside another example takes the ring away", async ({ page, browserName }) => {
  test.skip(browserName === "firefox", "Playwright's Firefox fires no blur on a frame's window");
  await page.goto("/");
  const nested = page.locator("#iframe [data-example]").first();
  const nestedOutput = await liveOutput(page, (await nested.getAttribute("id"))!);
  const example = page.locator("#bdi [data-example]").first();
  await liveOutput(page, (await example.getAttribute("id"))!);
  const box = example.locator("[data-live-output]");

  await example.locator("[data-code-view] pre").focus();
  await page.keyboard.press("Tab");
  await expect(box).toHaveAttribute("data-focus-ring");
  // The nested frame is sandboxed without scripts, so Playwright's WebKit can't click into it by
  // locator. A click on the page would take the ring away by itself, so it has to land in the frame.
  await nested.locator("[data-live-output]").evaluate((box) => box.scrollIntoView({ block: "center" }));
  const nestedFrame = (await nestedOutput.locator("iframe").boundingBox())!;
  await page.mouse.click(nestedFrame.x + nestedFrame.width / 2, nestedFrame.y + nestedFrame.height / 2);
  await expect.poll(() => page.evaluate(() => document.activeElement?.closest("[data-example]")?.id)).toBe(await nested.getAttribute("id"));
  await expect(box).not.toHaveAttribute("data-focus-ring");
});

// The browsers that scroll to a frame Tab focuses, when it has nothing focusable inside.
const SCROLLS_ON_ITS_OWN: string[] = [];

// src/scripts/live-output.ts scrolls a live output frame into view when Tab focuses it, because
// the browsers don't. This page has none of the site's styles or scripts. When the test fails in
// one browser, that browser now scrolls on its own: add it to SCROLLS_ON_ITS_OWN and keep
// showFocusedFrame. Once all three are in the list, remove showFocusedFrame, this test and the list.
test("browsers still leave a frame that Tab focuses below the screen", async ({ page, browserName }) => {
  await page.setViewportSize(PHONE);
  await page.setContent(`<button>Before</button><iframe title="Text only" srcdoc="<p>Text</p>" style="display: block; margin-top: 2000px"></iframe>`);
  await expect(page.frameLocator("iframe").locator("p")).toHaveText("Text");
  await page.getByRole("button", { name: "Before" }).focus();
  await page.keyboard.press("Tab");
  await expect.poll(() => page.evaluate(() => document.activeElement?.tagName)).toBe("IFRAME");
  // A scroll that doesn't come needs a point to stop waiting. A browser scrolls to what it
  // focuses before it draws the next frame, so two frames are enough.
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const scrolled = await page.evaluate(() => scrollY > 0);
  expect(scrolled).toBe(SCROLLS_ON_ITS_OWN.includes(browserName));
});

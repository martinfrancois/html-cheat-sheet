import { expect, type FrameLocator, type Locator, type Page } from "@playwright/test";

// The width a 320 pixel screen leaves the page beside a classic scrollbar, which Windows draws 17
// pixels wide: the narrowest the layout has to work at (docs/adr/0027).
export const BESIDE_A_SCROLLBAR = 320 - 17;

// Live output frames render only near the screen; scroll one into view and wait until its
// document has loaded and reported its height.
export async function liveOutput(page: Page, exampleId: string): Promise<FrameLocator> {
  // The page's own scrollIntoView, because Playwright's scroll leaves WebKit at the top when the box
  // is inside an entry that content-visibility hasn't drawn yet.
  await page.locator(`#${exampleId} [data-live-output]`).evaluate((box) => box.scrollIntoView({ block: "center" }));
  const frame = page.locator(`#${exampleId} [data-live-output] > iframe`);
  await expect(frame).toHaveAttribute("data-rendered", "true");
  await expect(frame.contentFrame().locator("body")).toBeAttached();
  return frame.contentFrame();
}

// Renders every live output on the page, for checks that look into all of them.
// Scrolls inside the page, frame by frame, waiting two animation frames for the
// IntersectionObserver each time; a Playwright round trip per frame is too slow for 200 of them.
export async function renderAllFrames(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
    for (const box of document.querySelectorAll<HTMLElement>("[data-live-output]")) {
      box.scrollIntoView({ block: "center" });
      while (box.querySelector<HTMLIFrameElement>(":scope > iframe")?.dataset.rendered !== "true") await nextFrame();
    }
    scrollTo(0, 0);
  });
  const count = await page.locator("[data-live-output]").count();
  // Every frame's document has loaded.
  // The page's own frames only: an <iframe> example has a frame inside its live output.
  await expect.poll(() => page.mainFrame().childFrames().filter((frame) => frame.url() === "about:srcdoc").length).toBe(count);
  for (const frame of page.frames().filter((candidate) => candidate !== page.mainFrame())) await frame.waitForLoadState("load");
}

// Entries off screen skip layout (content-visibility: auto), so their boxes measure zero and axe
// can't see their colours. A check that looks at every entry lays them all out first.
export async function layOutEveryEntry(page: Page): Promise<void> {
  await page.addStyleTag({ content: "[data-entry] { content-visibility: visible !important; }" });
}

// Waits until web fonts have loaded, so screenshots never catch a fallback font.
export async function fontsReady(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
}

export function entry(page: Page, id: string): Locator {
  return page.locator(`article#${id}`);
}

// Where an element, by default the focused one, sits when none of it is between the page's scroll
// padding at the top and at the bottom, the part of the screen the sticky header and the
// back-to-top link leave free. The page scrolls a focused live output frame by the same rule
// (src/scripts/live-output.ts). Runs in the page: pass it to evaluate.
export function outOfView(node?: Element | null): string | undefined {
  const element = node ?? document.activeElement;
  if (!element) return "nothing focused";
  const root = getComputedStyle(document.documentElement);
  const { top, bottom } = element.getBoundingClientRect();
  if (bottom > parseFloat(root.scrollPaddingTop) && top < innerHeight - parseFloat(root.scrollPaddingBottom)) return undefined;
  return `${element.closest("article")?.id}: <${element.tagName.toLowerCase()}> from ${Math.round(top)} to ${Math.round(bottom)}`;
}

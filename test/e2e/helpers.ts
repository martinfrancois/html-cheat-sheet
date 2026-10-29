import { expect, type FrameLocator, type Locator, type Page } from "@playwright/test";

// Live output frames render only near the screen; scroll one into view and wait until its
// document has loaded and reported its height.
export async function liveOutput(page: Page, exampleId: string): Promise<FrameLocator> {
  await page.locator(`#${exampleId} [data-live-output]`).scrollIntoViewIfNeeded();
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

// Waits until web fonts have loaded, so screenshots never catch a fallback font.
export async function fontsReady(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
}

export function entry(page: Page, id: string): Locator {
  return page.locator(`article#${id}`);
}

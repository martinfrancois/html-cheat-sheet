import { frameDocument, HEIGHT_MESSAGE } from "./frame-document.ts";
import { currentScheme } from "./theme.ts";

// An example's live output box holds its <iframe> in a <template> until the box comes near the
// screen. Every <iframe> in the HTML gets a browsing context while the page is parsed, even an
// empty one, and for 200 of them that was most of the time a phone spent loading the page:
// docs/adr/0012-create-live-output-frames-near-the-screen.md.
export function frameIn(box: HTMLElement): HTMLIFrameElement {
  const existing = box.querySelector<HTMLIFrameElement>(":scope > iframe");
  if (existing) return existing;
  const frame = box.querySelector("template")!.content.querySelector("iframe")!.cloneNode() as HTMLIFrameElement;
  box.replaceChildren(frame);
  return frame;
}

// The example's code, as the highlighted block shows it. Keeping it only there, and not in an
// attribute as well, makes the page smaller, so it shows sooner on a slow connection.
export const codeOf = (box: HTMLElement): string => box.closest("[data-example]")!.querySelector("[data-code-view] pre")!.textContent;

export function render(box: HTMLElement, code = codeOf(box)): void {
  const frame = frameIn(box);
  frame.srcdoc = frameDocument(code, currentScheme());
  frame.dataset.rendered = "true";
}

export function setupLiveOutput(): void {
  const boxes = [...document.querySelectorAll<HTMLElement>("[data-live-output]")];

  // Render a box only when it comes near the screen.
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        render(entry.target as HTMLElement);
      }
    },
    { rootMargin: "800px 0px" },
  );
  for (const box of boxes) observer.observe(box);

  addEventListener("message", (event) => {
    const height = (event.data as Record<string, unknown> | null)?.[HEIGHT_MESSAGE];
    if (typeof height !== "number") return;
    const frame = boxes.map((box) => box.querySelector<HTMLIFrameElement>(":scope > iframe")).find((candidate) => candidate?.contentWindow === event.source);
    if (!frame) return;
    frame.style.height = `${Math.ceil(height)}px`;
  });

  // A theme change re-renders the boxes already shown, so they switch to the matching defaults.
  addEventListener("themechange", () => {
    for (const box of boxes) if (box.querySelector(":scope > iframe")) render(box, box.dataset.current ?? codeOf(box));
  });

  // Focus moves after the keydown event, so the check waits a task.
  addEventListener("keydown", (event) => {
    if (event.key === "Tab") setTimeout(showFocusedFrame);
  });
}

// Tab into a frame with nothing focusable inside leaves the frame where it is, even below the
// screen (WCAG 2.4.11), in Chromium 156, Firefox 159 and WebKit 27.2. Firefox scrolled to it up
// to version 125; https://bugzilla.mozilla.org/show_bug.cgi?id=1886182 ended that. A frame with a
// link inside is in view already, because the browser scrolls to the link. The test "browsers
// still leave a frame that Tab focuses below the screen" fails once a browser scrolls on its own:
// docs/adr/0025-scroll-a-live-output-frame-that-tab-focuses-into-view.md.
function showFocusedFrame(): void {
  const frame = document.activeElement;
  if (!(frame instanceof HTMLIFrameElement) || !frame.parentElement?.matches("[data-live-output]")) return;
  // The sticky header and the back-to-top link take these margins (src/styles/global.css).
  const root = getComputedStyle(document.documentElement);
  const { top, bottom } = frame.getBoundingClientRect();
  if (bottom > parseFloat(root.scrollPaddingTop) && top < innerHeight - parseFloat(root.scrollPaddingBottom)) return;
  frame.scrollIntoView({ block: "nearest" });
}

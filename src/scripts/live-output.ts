import { FOCUS_MESSAGE, frameDocument, HEIGHT_MESSAGE } from "./frame-document.ts";
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

// Without it, a frame that Tab focuses shows no focus ring (WCAG 2.4.7):
// docs/adr/0026-draw-the-focus-ring-of-a-live-output-frame.md
let tabbedFrame: HTMLIFrameElement | null = null;
// The frames that report an element inside them with focus.
const framesWithFocusInside = new WeakSet<HTMLIFrameElement>();

export function render(box: HTMLElement, code = codeOf(box)): void {
  const frame = frameIn(box);
  frame.srcdoc = frameDocument(code, currentScheme());
  frame.dataset.rendered = "true";
  // The old document goes without telling the page that focus left an element in it.
  framesWithFocusInside.delete(frame);
  drawFocusRing();
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

  const frameFrom = (source: MessageEventSource | null) => boxes.map((box) => box.querySelector<HTMLIFrameElement>(":scope > iframe")).find((candidate) => candidate?.contentWindow === source);
  addEventListener("message", (event) => {
    const height = (event.data as Record<string, unknown> | null)?.[HEIGHT_MESSAGE];
    if (typeof height !== "number") return;
    const frame = frameFrom(event.source);
    if (frame) frame.style.height = `${Math.ceil(height)}px`;
  });
  addEventListener("message", (event) => {
    const type = (event.data as Record<string, unknown> | null)?.[FOCUS_MESSAGE];
    if (typeof type !== "string") return;
    const frame = frameFrom(event.source);
    if (frame) noteFrameEvent(frame, type);
  });

  // A theme change re-renders the boxes already shown, so they switch to the matching defaults.
  addEventListener("themechange", () => {
    for (const box of boxes) if (box.querySelector(":scope > iframe")) render(box, box.dataset.current ?? codeOf(box));
  });

  // Focus moves after the keydown event, so the checks wait a task.
  addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    setTimeout(() => {
      showFocusedFrame();
      tabbedFrame = focusedFrame();
      drawFocusRing();
    });
  });
  // Focus has left the frames: to an element of the page, or with a press on the page.
  for (const type of ["focusin", "pointerdown"]) {
    addEventListener(type, () => {
      tabbedFrame = null;
      drawFocusRing();
    });
  }
}

function focusedFrame(): HTMLIFrameElement | null {
  const focused = document.activeElement;
  return focused instanceof HTMLIFrameElement && focused.parentElement?.matches("[data-live-output]") ? focused : null;
}

// An event in a frame that the frame reports, since the page can't see it (src/scripts/frame-document.ts).
function noteFrameEvent(frame: HTMLIFrameElement, type: string): void {
  if (type === "keydown") tabbedFrame = frame;
  else if (type === "pointerdown") tabbedFrame = null;
  else if (type === "focusin") framesWithFocusInside.add(frame);
  else if (type === "focusout") framesWithFocusInside.delete(frame);
  drawFocusRing();
}

// The ring goes on the box of the frame that Tab focused while it still has focus, the window
// too, and no element inside it shows a ring of its own.
function drawFocusRing(): void {
  const frame = tabbedFrame;
  const ringed = frame && frame === document.activeElement && document.hasFocus() && !framesWithFocusInside.has(frame) ? frame.parentElement : null;
  for (const box of document.querySelectorAll("[data-focus-ring]")) if (box !== ringed) box.removeAttribute("data-focus-ring");
  ringed?.setAttribute("data-focus-ring", "");
}

// Without it, Tab can focus a frame out of sight (WCAG 2.4.11):
// docs/adr/0025-scroll-a-live-output-frame-that-tab-focuses-into-view.md
function showFocusedFrame(): void {
  const focused = focusedFrame();
  if (!focused) return;
  // The sticky header and the back-to-top link take these margins (src/styles/global.css).
  const root = getComputedStyle(document.documentElement);
  const { top, bottom } = focused.getBoundingClientRect();
  if (bottom > parseFloat(root.scrollPaddingTop) && top < innerHeight - parseFloat(root.scrollPaddingBottom)) return;
  focused.scrollIntoView({ block: "nearest" });
}

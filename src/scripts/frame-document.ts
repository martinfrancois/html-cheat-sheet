// The document a live output frame shows. It has no other imports, so the end-to-end tests can
// build the same document for an example (test/e2e/examples.spec.ts).

// Messages from a live output frame carry one of these keys, so other postMessage traffic is ignored.
export const HEIGHT_MESSAGE = "html-cheat-sheet:height";
// Its value is the type of an event in the frame that the page needs to draw the frame's focus ring.
export const FOCUS_MESSAGE = "html-cheat-sheet:focus";

// Appended to every example. It reports the height the example needs so the frame fits it,
// keeps in-page links inside the example, keeps a submitted form on the page instead of
// navigating the frame away, and reports Tab, presses and focus changes for the focus ring.
// A <form method="dialog"> still submits, because that only closes its dialog.
// An open modal dialog or popover sits in the top layer, outside the document's height, so the
// frame grows to show it whole and shrinks back when it closes. Browsers center it, so the frame
// leaves the example's own height free above and below it, and the button that opened it stays
// visible. The root's box height is used, not scrollHeight, which never drops below the frame's
// current height.
// iframe-resizer does this job, but its GPL-3.0 license doesn't fit this MIT project (ADR 0009).
const frameScript = `<script>(() => {
  const inTopLayer = (element) => element.matches(":modal, :popover-open");
  const report = () => {
    const content = document.documentElement.getBoundingClientRect().height;
    let height = content;
    for (const layer of document.querySelectorAll("dialog, [popover]")) {
      if (inTopLayer(layer)) height = Math.max(height, 2 * content + layer.scrollHeight + 24);
    }
    parent.postMessage({ "${HEIGHT_MESSAGE}": height }, "*");
  };
  new ResizeObserver(report).observe(document.documentElement);
  addEventListener("load", report);
  // toggle fires when a dialog, popover or <details> opens or closes, except when a script sets a
  // dialog's open attribute itself, which the spec advises against and no example does.
  addEventListener("toggle", report, true);
  addEventListener("submit", (event) => event.target.method === "dialog" || event.preventDefault());
  // The frame's <base target="_blank"> would open an in-page link, such as a skip link, in a new
  // tab. It moves within the example instead, unless the example's own <base href> changes it.
  addEventListener("click", (event) => {
    const link = event.target.closest?.('a[href^="#"]');
    if (!link || document.querySelector("base[href]")) return;
    event.preventDefault();
    location.hash = link.hash;
  });
  // The page draws the frame's focus ring and sees none of these events in here:
  // docs/adr/0026-draw-the-focus-ring-of-a-live-output-frame.md
  const reportFocus = (event) => parent.postMessage({ "${FOCUS_MESSAGE}": event.type }, "*");
  addEventListener("keydown", (event) => event.key === "Tab" && reportFocus(event), true);
  addEventListener("pointerdown", reportFocus, true);
  addEventListener("focusin", reportFocus);
  // Only when focus leaves the elements, not when it moves between two, so the ring doesn't flash.
  addEventListener("focusout", (event) => event.relatedTarget || reportFocus(event));
  // The frame's own window: focus moving to another frame or window, and coming back.
  addEventListener("focus", reportFocus);
  addEventListener("blur", reportFocus);
})();<\/script>`;

// Builds the frame document: the example as written, plus the page's light or dark choice.
// The example keeps the browser's default styles; only color-scheme is set, so a dark page
// shows the browser's dark defaults.
export function frameDocument(code: string, scheme: "light" | "dark"): string {
  // The sandbox gives the frame an origin of its own, so the site's captions file counts as
  // another site's, and a <track> only loads from another site when its media element asks with
  // CORS. The site sends Access-Control-Allow-Origin: *, as GitHub Pages does (astro.config.ts).
  // The shown code stays as a real page writes it, without crossorigin.
  const media = /<track[\s>]/i.test(code) ? code.replace(/<(video|audio)(?=[\s>])/gi, "<$1 crossorigin") : code;
  // Links open in a new tab instead of replacing the example, unless the example sets its own <base>.
  const base = /<base[\s>]/i.test(code) ? "" : '<base target="_blank">';
  // A whole document gets the <base> right after its <head> or <html> start tag, where the parser
  // takes it without an error; a fragment gets a doctype and the <base> in front.
  const start = [/<head(?:\s[^>]*)?>/i, /<html(?:\s[^>]*)?>/i].find((tag) => tag.test(media));
  const page = start ? media.replace(start, (tag) => tag + base) : `<!doctype html>${base}${media}`;
  return `${page}<style>:root { color-scheme: ${scheme} }</style>${frameScript}`;
}

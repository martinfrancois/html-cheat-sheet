---
status: accepted
date: 2026-10-30
decision-makers: [implementing coding agent]
consulted: []
informed: [Future maintainers and agents working on this repository]
---

# Draw the focus ring of a live output frame

## Context and Problem Statement

Each live output frame is a tab stop, also when its example has nothing focusable inside
([ADR 0025](0025-scroll-a-live-output-frame-that-tab-focuses-into-view.md)). When Tab moves focus to
such a frame, no browser draws a focus ring, so a keyboard reader can't see where focus is, which
WCAG 2.4.7 Focus Visible rules out
([html-cheat-sheet issue #37](https://github.com/martinfrancois/html-cheat-sheet/issues/37)).

The page's `:focus-visible` ring can't reach the frame. The HTML standard leaves a frame out of
[`:focus`](https://html.spec.whatwg.org/multipage/semantics-other.html#selector-focus): an element
has the focus only when "it is not itself a navigable container". In Chromium 156, Firefox 157 and
WebKit 27.2, none of `:focus`, `:focus-visible` and `:focus-within` matches the `<iframe>` while
focus is in its document, and no `focus` or `blur` event fires on the `<iframe>` in the page. The
sandbox gives the frame an origin of its own
([ADR 0003](0003-render-live-output-in-sandboxed-iframes.md)), so the page can't style or read its
document either. How should a frame that has focus show it?

## Decision Drivers

* A frame that Tab focuses shows a ring in Chromium, Firefox and WebKit (WCAG 2.4.7).
* It is the same ring as everywhere else on the page, from the same rule.
* A click into a frame shows no ring, as a click on a button shows none under `:focus-visible`.
* One ring at a time: a link or control inside a frame that has focus shows the browser's own ring.

## Considered Options

* The page marks the frame's box, and the frame reports presses and focus inside it
* A ring inside the frame's own document
* The page marks the frame's box after Tab, with nothing from the frame

## Decision Outcome

Chosen option: "The page marks the frame's box, and the frame reports presses and focus inside
it", because it is the only one that works in all three browsers and keeps the page's own ring.

The page decides when to draw the ring, with what the frame tells it:

* `src/scripts/live-output.ts` notes the frame that has focus a task after each Tab or Shift+Tab
  pressed on the page. A Tab pressed inside a frame goes to the frame's document, so the frame
  reports it, and the page notes that frame.
* A press in a frame or on the page, and focus moving to an element of the page, clear the note.
* The script `frameDocument` appends to each frame (`src/scripts/frame-document.ts`) reports these
  events to the page: Tab, `pointerdown`, `focusin`, `focusout` when focus leaves the frame's
  elements, and the frame window's `focus` and `blur`.
* The page draws the ring while the noted frame has focus, the browser window has focus, and no
  element inside the frame has focus. It sets `data-focus-ring` on the frame's box, and
  `src/styles/global.css` styles that with the `:focus-visible` rule itself.

### Consequences

* Good, because a frame that Tab focuses shows the page's focus ring in all three browsers, drawn
  outside the frame's border like every other ring on the page.
* Good, because a change to the focus ring's color or width reaches the frame's ring too.
* Good, because a click into a frame shows no ring, and an element inside it shows only its own.
* Neutral, because when Tab goes straight to a link inside a frame, the page can draw the ring for
  a moment: it notes the frame a task after the key, and the frame's report that focus is inside
  can arrive later.
* Neutral, because Playwright's Firefox fires no `focus` or `blur` on a frame's window. There, a
  click into a frame inside another example leaves the ring on the frame Tab focused until the
  next key or press on the page. Mozilla's Firefox 159.0 fires them and takes the ring away.
* Bad, because every frame posts the page a message on each Tab, press and focus change inside it,
  and the page keeps track of which frame Tab focused.

### Confirmation

Four tests in `test/e2e/accessibility.spec.ts` run in Chromium, Firefox and WebKit:

* "a live output frame that Tab focuses shows a focus ring until focus moves on or a press lands in
  it" uses the `bdi` frame, which has nothing focusable inside.
* "a live output frame shows no ring while an element inside it shows its own" uses the `a` frame.
  It also checks that the ring doesn't show for a moment while Tab moves from one link to the next.
* "a live output frame that the reader tabs within shows the ring once nothing inside has focus"
  checks a Tab pressed inside the frame.
* "a click into a frame inside another example takes the ring away" clicks into the frame inside the
  `iframe` example. It skips Playwright's Firefox, which fires no `blur` on the frame's window.

Each fails in Chromium when the frame doesn't report the event it checks. "nothing in an entry,
focus rings included, reaches past its edge" counts the ring around each live output box.

## Pros and Cons of the Options

### The page marks the frame's box, and the frame reports presses and focus inside it

The page notes which frame Tab focused, the frame tells it about presses and focus inside it, and
the page draws its ring on the frame's box.

* Good, because the page knows both what it sees itself, a Tab and focus on the page, and what only
  the frame sees, a Tab, a press or focus moving inside it.
* Bad, because it needs messages between the frame and the page.

### A ring inside the frame's own document

The frame's script draws an outline on its root element while its document has focus.

* Good, because the frame knows best when focus moves inside it.
* Bad, because Playwright's Firefox fires no `focus` event in the frame when Tab moves focus there,
  and neither `:focus` nor `:focus-visible` matches the frame's root element in any of the three
  browsers, so the frame can't tell when to draw it.
* Bad, because the ring would be drawn over the example's own rendering, which shows the browser's
  defaults, and would need the page's theme colors passed in.

### The page marks the frame's box after Tab, with nothing from the frame

The page draws the ring on the box of the frame that has focus after Tab, and the frame's document
stays as it is.

* Good, because it needs no messages.
* Bad, because the page can't see a click into a frame, so the ring stays on a frame after a click
  moves focus into another one.
* Bad, because a link inside the frame that has focus shows two rings, its own and the frame's.

## More Information

Measured on 2026-10-30 in the `mcr.microsoft.com/playwright:v1.64.1-noble` image with Playwright's
Chromium 156, Firefox 157 and WebKit 27.2, and with Mozilla's release build of Firefox 159.0 driven
through WebDriver BiDi, where all four tests pass too. Mozilla's build moves Tab straight to the
link inside the `a` frame; Playwright's stops on the frame first, and the second test checks the
ring there. Playwright's Firefox also keeps `:focus` and `:focus-visible` on the element that had
focus before Tab moved it into a frame, so its screenshots show that element's ring as well;
Mozilla's 159.0 doesn't.
[microsoft/playwright issue #42933](https://github.com/microsoft/playwright/issues/42933) reports
another focus difference in that build.

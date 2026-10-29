---
status: accepted
date: 2026-10-28
decision-makers: [implementing coding agent, approved by martinfrancois in the design interview]
consulted: []
informed: [Future maintainers and agents working on this repository]
---

# Render live output in sandboxed iframes with browser default styles

## Context and Problem Statement

Every entry shows its example as code and as live output. The live output has to show what the
HTML does by itself, with the browser's default styles. The old page rendered output inline in the
table, so the page's styles reached it. Its `<button>` row showed a Materialize button with the
classes `waves-effect waves-light btn`, not the button a browser draws. The new page uses Tailwind,
whose base styles (Preflight) remove default margins, heading sizes, list markers, and button
borders, so inline output would be wrong in the same way.

Some examples also act on the whole document: `<base>` changes how every relative URL resolves,
`<title>` and `<html>` belong to a document, and a modal `<dialog>` opened with `showModal()` covers
the page. Where should live output render so it looks like plain HTML and can't affect the page?

## Decision Drivers

* Live output must use the browser's default styles, with nothing from the page leaking in.
* Examples with `<base>`, `<html>`, `<title>`, or a modal `<dialog>` must run without changing the
  page around them.
* Example scripts must not reach the page's DOM, storage, or analytics.
* Several hundred examples on one page must not make the first load slow.
* The page uses only Baseline widely available features.

## Considered Options

* A sandboxed iframe per example, using `srcdoc`, loaded as it scrolls into view
* Inline rendering in the page
* Shadow DOM per example

## Decision Outcome

Chosen option: "A sandboxed iframe per example, using `srcdoc`, loaded as it scrolls into view",
because an iframe is the only option where the example gets its own document: its own default
styles, its own `<base>` and `<title>`, and its own top layer for a modal dialog.

The frame gets the example as its `srcdoc` and a `sandbox` attribute without `allow-same-origin`, so
an example script runs with an opaque origin and can't read the page. A frame loads its document
only when it nears the viewport, so the first load renders cards, not hundreds of documents.

### Consequences

* Good, because the output is exactly what a browser does with the example and nothing else.
* Good, because document-level examples such as `<base>` and `<title>` work as they would on a real
  page.
* Good, because `iframe-srcdoc` and `iframe-sandbox` are Baseline widely available, since
  2022-07-15 and 2018-01-29 according to `web-features` 3.43.0.
* Bad, because a frame does not size itself to its content. A script in each frame reports the
  height it needs, including an open modal dialog or popover, and the page resizes the frame.
* Bad, because each loaded frame is a separate document, which costs memory as a reader scrolls far.
* Neutral, because live output is exempt from the page's color tokens and font rules
  ([ADR 0007](0007-wcag-2-2-aa-with-aaa-contrast-and-text-presentation.md)); the chrome around the
  frame is not.

### Confirmation

A Playwright test checks that every live output is an `iframe` with a `srcdoc` and a `sandbox`
attribute that lacks `allow-same-origin`, and that a `<button>` example renders with the browser's
default button styles. A visual snapshot of the page includes live output in both themes.

## Pros and Cons of the Options

### A sandboxed iframe per example, using `srcdoc`, loaded as it scrolls into view

Each example becomes an `<iframe>` whose `srcdoc` holds the example's markup and whose `sandbox`
attribute leaves out `allow-same-origin`. The frame loads its content when it nears the viewport.

* Good, because the example gets a fresh document with the browser's own default styles.
* Good, because the sandbox keeps example scripts away from the page.
* Bad, because the page must size each frame and handle examples that grow.
* Bad, because every visible frame is a full document.

### Inline rendering in the page

Insert the example's markup directly into the card, as the old page did.

* Good, because it is the simplest option and costs no extra documents.
* Bad, because Tailwind's Preflight and every page style apply to the example, which is what made
  the old `<button>` row wrong.
* Bad, because `<base>` would change every relative link on the page, and a `<title>` or `<html>`
  example can't run inside a `<div>`.

### Shadow DOM per example

Attach a shadow root to each output container and put the example inside it, so page selectors
don't match the example.

* Good, because page selectors stop at the shadow boundary and it costs less than a document.
* Bad, because inherited properties such as `font-family`, `color`, and `line-height` still cross the
  boundary from the page, so the example doesn't show browser defaults.
* Bad, because `<base>`, `<title>`, and `<html>` have no effect inside a shadow root, and a modal
  dialog still covers the whole page.
* Bad, because declarative shadow DOM, which would let the build write shadow roots into the HTML,
  became Baseline widely available only on 2026-08-20 according to `web-features` 3.43.0. Attaching
  roots from script instead would mean an empty output until JavaScript runs.

## More Information

The coding agent proposed the iframe approach in the design interview on 2026-10-28 and
martinfrancois approved it. The old `<button>` row is in the git history before the rebuild.

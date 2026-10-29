---
status: accepted
date: 2026-10-29
decision-makers: [implementing coding agent]
consulted: []
informed: [Future maintainers and agents working on this repository]
---

# Reserve no scroll bar gutter

## Context and Problem Statement

On a desktop whose scroll bars take up room, a search that leaves too little to scroll makes the
scroll bar go away, and the page moves sideways by its width. `scrollbar-gutter: stable` keeps
that room reserved, and became Baseline on 2024-12-11. Should the page reserve it?

## Decision Drivers

* The page shouldn't move when a search shows few entries.
* The tests lay out the page at the width they name, such as 390 pixels for a phone.

## Considered Options

* `scrollbar-gutter: stable` on the root
* Reserve nothing

## Decision Outcome

Chosen option: "Reserve nothing", because the gutter would make every Playwright test lay out the
page narrower than the screen it names, for a shift only some desktops show and only after a
search.

### Consequences

* Good, because a test at 390 pixels lays out the page at 390 pixels.
* Bad, because on a desktop whose scroll bars take up room, the page moves sideways when a search
  leaves too little to scroll.

### Confirmation

`src/styles/global.css` sets no `scrollbar-gutter`.

## Pros and Cons of the Options

### `scrollbar-gutter: stable` on the root

The root keeps room for a scroll bar whether the page scrolls or not.

* Good, because the page never moves when the scroll bar comes or goes.
* Bad, because Playwright's Chromium hides scroll bars but still reserved the 15 pixel gutter, so
  every test ran 15 pixels narrower than its screen, and every visual snapshot changed.
* Neutral, because phones and macOS draw scroll bars over the page, so it changes nothing there.

### Reserve nothing

The scroll bar takes its room only while the page scrolls, as before.

* Good, because the tests measure the page at the width a reader has.
* Bad, because the shift after a search stays on desktops whose scroll bars take up room.

## More Information

Tried on 2026-10-29 with the Chromium in the `mcr.microsoft.com/playwright:v1.64.1-noble` image:
an entry snapshot at 1280 pixels came out 1233 pixels wide instead of 1248.

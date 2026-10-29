---
status: accepted
date: 2026-10-29
decision-makers: [implementing coding agent]
consulted: []
informed: [Future maintainers and agents working on this repository]
---

# Skip rendering entries off screen

## Context and Problem Statement

The page holds every element of the standard on one page: 125 entries, about 170,000 pixels tall
on a phone. The browser works out the style and layout of all of them on every load, and again
whenever a search shows or hides entries, although a reader sees two or three at a time. In
Lighthouse's mobile run the load took 442 to 565 ms of style and layout. Clearing a search, which
brings every entry back, took 274 to 307 ms on a phone's CPU, more than the 200 ms after which an
interaction counts as slow. `content-visibility: auto` lets the browser skip that work for an
entry until it comes near the screen. It became Baseline on 2025-09-15, so the page may use it
under [ADR 0016](0016-use-web-features-six-months-after-they-become-baseline.md). Should the page
skip drawing entries off screen?

## Decision Drivers

* Less main thread work on a phone, where the page is slowest, on load and when searching.
* Nothing a reader would notice (`SPEC.md` section 3): find in page, links to an entry, the scroll
  bar, and the reader's place after a reload or Back keep working.
* No change to the HTML.

## Considered Options

* `content-visibility: auto` on each entry, with an estimate per width and the place kept by a script
* `content-visibility: auto` on each entry, with one estimate and the browser's own scroll restoring
* Leave every entry drawn

## Decision Outcome

Chosen option: "`content-visibility: auto` on each entry, with an estimate per width and the place
kept by a script", because it makes clearing a search 15 to 20 times faster and cuts the style and
layout work on load to a fifth, while the scroll bar, links and the reader's place stay as they
were.

Each `[data-entry]` in `src/styles/global.css` gets `content-visibility: auto` and an estimated
height until it is drawn: 1300 pixels on a phone, 930 from Tailwind's `sm` breakpoint and 830 from
`lg`, each an entry's average height at those widths. Once drawn, an entry keeps its real height
(`auto`). `src/scripts/keep-place.ts` saves the entry at the top of the screen in the history entry
when a scroll ends, and after a reload, Back or Forward scrolls back to that entry instead of to
the old offset.

### Consequences

* Good, because clearing a search takes 14 to 20 ms instead of 274 to 307.
* Good, because Lighthouse's mobile run spends 57 to 117 ms on style and layout instead of 442 to
  565, and 8 ms painting instead of 75 to 101. Total blocking time is 0 in every run. On desktop,
  style and layout takes 18 to 20 ms instead of 119 to 132.
* Neutral, because the Lighthouse scores stay at 99 on mobile and 100 on desktop: the mobile score
  is held back by the largest paint, which waits for the HTML.
* Neutral, because the page's estimated height is within 6 percent of its real height at every
  width measured, from 360 to 1920 pixels, so the scroll bar is about where it was.
* Neutral, because each entry is now its own layout container, so text inside lands on a slightly
  different subpixel position and an entry's height can round one pixel differently. The visual
  snapshots changed by that much and nothing else.
* Bad, because `keep-place.ts` replaces the browser's scroll restoring for the page, and has to
  hold the place while entries above it are drawn and live output frames load, since WebKit
  doesn't hold the screen in place when the content above it grows. It lets go once the reader
  scrolls or does anything else.
* Bad, because a test that measures or checks every entry has to draw them all first, with
  `layOutEveryEntry` in `test/e2e/helpers.ts`, or it passes without looking at them. The axe
  check does so too, so it checks the page with every entry drawn.
* Bad, because Playwright's WebKit answers each test call about 200 ms slower on this page, while
  the page itself runs at 60 frames a second there as before. Tests that made one call per entry
  now make one call in all.

### Confirmation

These Playwright tests in `test/e2e/page.spec.ts` run in Chromium, Firefox and WebKit:

* "a reload keeps the reader's place", at 390 and 1280 pixels, and "Back after a jump returns to
  the reader's place" check that the entry the reader was on comes back within 2 pixels of where
  it was.
* "a link to an entry far down lands on it", from the index and from the address, checks that the
  jump ends on the entry and that it doesn't move while the entries around it are drawn.
* "find in page reaches the last entry" checks that the browser finds text in an entry that hasn't
  been drawn, with `window.find`, which searches like the find bar but isn't the find bar itself.

## Pros and Cons of the Options

### `content-visibility: auto` on each entry, with an estimate per width and the place kept by a script

The browser draws an entry only when it comes near the screen. Until then the entry takes an
estimated height for the reader's screen width, and a script brings the reader back to the same
entry after a reload, Back or Forward.

* Good, because the browser does the work for what's on screen only, and the content stays in the
  page for find in page, screen readers and links.
* Bad, because the page needs a script of its own to restore the reader's place.

### `content-visibility: auto` on each entry, with one estimate and the browser's own scroll restoring

The same rule with one estimate for every width, 1300 pixels, an entry's average height on a
phone, and no script.

* Good, because it's one CSS rule.
* Bad, because the browser restores the old scroll offset, which points at a different entry once
  the entries above have their estimated height again. After a reload at entry 61 the entry ended
  up between 1,644 pixels below and 5,529 pixels above where it was, in each of the three browsers.
* Bad, because on a desktop, where an entry averages 821 pixels, the page starts out about 60
  percent taller than it is.

### Leave every entry drawn

The browser works out the style and layout of every entry on each load and each search, as before.

* Good, because nothing changes and no test needs to draw entries first.
* Bad, because clearing a search takes more than 200 ms on a phone, and each load spends about
  half a second on entries no one sees.

## More Information

Measured on 2026-10-29 against local builds of main and this change. Lighthouse 12.6.1 with
HeadlessChrome 151 ran 3 times each, mobile and desktop; the numbers come from the "Style & Layout"
and "Rendering" rows of its main thread breakdown. The search times are from the Chromium in the
`mcr.microsoft.com/playwright:v1.64.1-noble` image at 390 pixels with the CPU slowed down 4 times,
from setting the search box's text to the next frame, 5 runs each. The entry heights were measured
in the same Chromium with every entry drawn.
[ADR 0012](0012-create-live-output-frames-near-the-screen.md) made the live output frames load near
the screen for the same reason, and they still load that way.

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
on a phone. On every load the browser works out the style and layout of all of them,
although a reader sees two or three at a time. In Lighthouse's mobile run that took 442 to 565 ms of
the main thread, with 75 to 101 ms more for painting. `content-visibility: auto` lets the browser skip
that work for an entry until it comes near the screen. It became Baseline on 2025-09-15, so the
page may use it under [ADR 0016](0016-use-web-features-six-months-after-they-become-baseline.md).
Should the page skip rendering entries off screen?

## Decision Drivers

* Less main thread work on a phone, where the page is slowest.
* Nothing a reader would notice: find in page, links to an entry and the scroll bar keep working
  (`SPEC.md` section 3).
* No change to the HTML or the scripts.

## Considered Options

* `content-visibility: auto` on each entry, with an estimated height
* Leave every entry rendered

## Decision Outcome

Chosen option: "`content-visibility: auto` on each entry, with an estimated height", because it
cuts the style and layout work on a phone to a fifth with one CSS rule, and readers can't tell.

Each `[data-entry]` in `src/styles/global.css` gets `content-visibility: auto` and
`contain-intrinsic-block-size: auto 1300px`. An entry not yet drawn takes 1300 pixels, close to an
entry's average height on a phone (1291), so the scroll bar stays about right there. Once drawn, the browser keeps the
entry's real height (`auto`).

### Consequences

* Good, because Lighthouse's mobile run spends 57 to 117 ms on style and layout instead of 442 to
  565, and 8 ms painting instead of 75 to 101. Total blocking time is 0 in every run.
* Good, because on desktop style and layout takes 18 to 20 ms instead of 119 to 132.
* Neutral, because the Lighthouse scores stay at 99 on mobile and 100 on desktop: the mobile score
  is held back by the largest paint, which waits for the HTML, not by this work.
* Neutral, because each entry is now its own layout container. Text inside lands on a slightly
  different subpixel position, and an entry's height can round one pixel differently; the visual
  snapshots changed by that much and nothing else.
* Bad, because a test that measures every entry first has to draw them all, with
  `layOutEveryEntry` in `test/e2e/helpers.ts`. Entries not yet drawn have no size, so such a test
  would otherwise pass without checking them.
* Bad, because Playwright's WebKit answers each test call about 200 ms slower on this page, while
  the page itself runs at 60 frames a second there as before. Tests that made one call per entry
  now make one call in all.

### Confirmation

The Playwright tests "a link to an entry far down lands on it", from the index and from the
address, check that a jump past entries not yet drawn ends on the entry and stays there once the
entries around it get their real height. "find in page reaches the last entry" checks that find in
page still finds text in an entry that hasn't been drawn. Both run in Chromium, Firefox and WebKit.

## Pros and Cons of the Options

### `content-visibility: auto` on each entry, with an estimated height

The browser draws an entry only when it comes near the screen and gives the others an estimated
height until then.

* Good, because the browser does the work for what's on screen only, and the content stays in the
  page for find in page, screen readers and links.
* Bad, because the scroll bar is off by the difference between the estimate and the real heights
  until the entries are drawn. On a desktop, where an entry averages 821 pixels, the page starts
  out about 60 percent taller than it is.

### Leave every entry rendered

The browser works out the style and layout of every entry on each load, as before.

* Good, because nothing changes and no test needs to draw entries first.
* Bad, because a phone spends about half a second on every load working out entries no one sees.

## More Information

Measured on 2026-10-29 with Lighthouse 3 times each, mobile and desktop, against local builds of
main and this change, with the numbers taken from the "Style & Layout" and "Rendering" rows of the
main thread breakdown. ADR 0012 made the live output frames load near the screen for the same
reason, and its frames still load that way.

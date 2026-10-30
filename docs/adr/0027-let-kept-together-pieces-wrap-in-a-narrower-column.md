---
status: accepted
date: 2026-10-30
decision-makers: [implementing coding agent]
consulted: []
informed: [Future maintainers and agents working on this repository]
---

# Let kept-together pieces wrap in a narrower column

## Context and Problem Statement

The page keeps some pieces on one row: a code chip of up to 22 characters such as
`prefers-reduced-motion`, a name such as `aria-labelledby` in a code block, an entry's title. Each is sized to fit the entry column a 320 px
screen leaves, 288 px or 18rem, and `test/e2e/page.spec.ts` checks that at 320 px
([src/lib/chips.ts](../../src/lib/chips.ts), [Visual design](../agents/visual-design.md)).

A classic scrollbar takes part of those 320 px. Mozilla's Firefox 159 on Linux draws one 12 px
wide, and Windows draws them 17 px wide, so the column is 276 or 271 px. There the widest pieces set a column wider than
the entry, and the entry's clip ([ADR 0018](0018-skip-rendering-entries-off-screen.md)) cut the
right edge of 31 elements in the `marquee` and `attr-draggable` entries. The headings and badges
reported there were not too wide themselves: the widest piece in an entry widens the entry's grid
column, and everything in it, the header too, takes that width
([html-cheat-sheet issue #40](https://github.com/martinfrancois/html-cheat-sheet/issues/40)). In
Chromium at 303 px, the `marquee`, `isindex`, `meta`, `attr-hidden` and `attr-writingsuggestions`
entries need 273 to 281 px: `prefers-reduced-motion` inside the padded "Use instead" box,
`<meta charset="utf-8">` and `div { display: block }` in list items, and the title
`writingsuggestions`. WCAG 1.4.10 Reflow allows no loss of content at 320 CSS px. How should the
page fit a column narrower than the one its pieces are sized for?

## Decision Drivers

* Nothing in an entry is cut off at a 320 px screen, also beside a classic scrollbar.
* The page stays as it is at 320 px and wider, where the chip and code row rules were set.
* The pieces' character counts stay in `src/lib/chips.ts`, the one place that sizes them.

## Considered Options

* Let the kept-together pieces wrap when the column is narrower than 18rem
* Size the pieces for the column beside a scrollbar
* Keep a chip whole with `display: inline-block` only while it fits a row

## Decision Outcome

Chosen option: "Let the kept-together pieces wrap when the column is narrower than 18rem",
because it fixes every width below the one the pieces are sized for and changes nothing at it or
above.

`<main id="entries">` is an inline-size container named `entries`. In `src/styles/global.css`, a
container query for a column narrower than 18rem lets code chips wrap (`white-space: normal` on
`whitespace-nowrap` in code), lets names and attributes in code blocks wrap (`pre-wrap` on
`attribute` and `keep`), and lets an entry's title break inside a word. A line's indentation stays
with its first token (`lead`), which is never wider than the indentation and one short token, so
no row holds only indentation. It
reads the column, so it counts a scrollbar, which a media query on the screen width doesn't. In
rem, it moves with the reader's font size, as the pieces do. A support badge's last two words and
an example title's last words stay together: no entry needs them to wrap at 303 px.

The `narrow` variant, which puts an entry's facts in one column and narrows the "Use instead"
note's padding, reads the same column for the same reason, below 20.5rem, the column a 360 px
screen leaves. With Mozilla's Firefox 159 and its scrollbar, no width from 320 to 420 px cut
anything off before that change either, so it changes no measured result.

### Consequences

* Good, because nothing is cut off beside a scrollbar of any width, and the narrower test widths
  catch a new piece that doesn't wrap.
* Good, because at 320 px and wider, without a scrollbar and at the default font size, the page
  looks the same, and the visual snapshots don't change.
* Bad, because in a narrower column every code chip may wrap, not only the ones too wide for it:
  `<meta charset="utf-8">` breaks after `utf-`, and `writingsuggestions` leaves its last letter on
  a row of its own.
* Bad, because 18rem has to match the column a 320 px screen leaves, 320 px less the two 16 px
  gutters, and a container query can't read a custom property. A test checks it, see below.
* Neutral, because the gutters are in px and the query in rem: with a larger default font, the
  pieces wrap in a wider column, as they grow with the font.

### Confirmation

* "nothing in an entry, focus rings included, reaches past its edge", "every code line fits inside
  its block" and "never scrolls sideways" also run at 303 px, `BESIDE_A_SCROLLBAR` in
  `test/e2e/helpers.ts`, in Chromium, Firefox and WebKit. Without the container query the first two
  fail in all three.
* "an indented code line keeps its indentation beside a scrollbar" fails when the indentation
  takes `white-space: normal`, and "a wrapped code line never starts with a row of only
  indentation" when it takes `pre-wrap`; both run at 303 px too.
* "code chips start to wrap just below the column a 320 pixel screen leaves" checks that a chip
  stays whole at 320 px and wraps at 319 px, so a change to the gutters or to 18rem that leaves the
  two apart fails.
* "code chips wrap at 320 pixels beside a classic scrollbar", in `test/e2e/scrollbar.spec.ts`, lets
  Chromium draw its 15 px scrollbar. It fails with a media query on the screen width instead.
* "a short code chip or word never breaks" stays at 320 px, where the chip rule holds.

## Pros and Cons of the Options

### Let the kept-together pieces wrap when the column is narrower than 18rem

A container query on the entry column lifts the one-row rule below the width the pieces are sized
for.

* Good, because it covers every narrower width, whatever takes the room.
* Bad, because it wraps pieces that would still have fit on a row of their own.

### Size the pieces for the column beside a scrollbar

Lower the chip limit, the code row and the smallest title size until the pieces fit 271 px.

* Good, because pieces would stay whole down to that width.
* Bad, because `prefers-reduced-motion`, 22 characters, would break even at 320 px without a
  scrollbar, and the title would shrink for every reader.
* Bad, because it only moves the edge: a wider scrollbar or a larger font cuts the pieces off again.

### Keep a chip whole with `display: inline-block` only while it fits a row

An inline block keeps a chip on one row when it fits and wraps it inside only when it doesn't.

* Good, because it wraps only the pieces too wide for a row.
* Bad, because it changes line breaking around every chip at every width. Browsers treat an inline
  block as a break opportunity before and after, so punctuation rules next to chips would need
  checking in all three engines, and its background would cover the whole line height.

## More Information

Measured on 2026-10-30 in the `mcr.microsoft.com/playwright:v1.64.1-noble` image with Playwright's
Chromium 156, Firefox 157 and WebKit 27.2, and Mozilla's release build of Firefox 159.0 through
WebDriver BiDi, which passes the tests at 320 px with its 12 px scrollbar. Playwright's builds draw
overlay scrollbars, which take no width, except Chromium without `--hide-scrollbars`, so CI checks
the narrower column by setting the window to 303 px and with Chromium's own scrollbar. Windows'
17 px is the width of its classic scrollbar at 100% scaling, `SM_CXVSCROLL` in
[GetSystemMetrics](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getsystemmetrics).

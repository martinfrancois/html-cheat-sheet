---
status: accepted
date: 2026-10-29
decision-makers: [implementing coding agent]
consulted: []
informed: [Future maintainers and agents working on this repository]
---

# Size fallback fonts to match the web fonts

## Context and Problem Statement

The page uses three web fonts, bundled with the site, preloaded, and shown with
`font-display: swap`: until a font arrives, the browser draws the text in a system font, then
swaps. On a slow connection the fonts arrive after the first paint, and every line of text takes a
new width and height. With the fonts held back by 800 ms in Playwright's Chromium, the page moved
by a layout shift score of 0.19 at 412 pixels, 0.41 at 1440 and 0.52 at 1280, where 0.1 is the
limit of a good score. One of three Lighthouse runs against the live site measured 0.82. A reader
on a first visit over a slow network sees the text jump. How should the page keep it still?

## Decision Drivers

* No visible jump when the fonts arrive, at any common width.
* Readers still see the page's own fonts, on the first visit too.
* Text appears as soon as the page is painted, not after the fonts load.
* Use a maintained library for a solved problem (ADR 0009).

## Considered Options

* Fallback faces sized to the web fonts with fontaine
* Astro's Fonts API with its sized fallbacks
* `font-display: optional`
* `font-display: fallback`
* `font-display: block`

## Decision Outcome

Chosen option: "Fallback faces sized to the web fonts with fontaine", because it takes the shift
from up to 0.52 to about 0.003 at most widths while every reader still gets the page's fonts.

fontaine reads each web font's metrics at build time and adds a fallback `@font-face` for each
system font a reader may have, Arial, Helvetica Neue, Segoe UI, Roboto and others, with
`size-adjust`, `ascent-override` and `descent-override` set so the system font takes the web
font's average width and line height. The font stacks in `src/styles/global.css` name these
fallback faces right after each web font. The settings are in `astro.config.ts`.

### Consequences

* Good, because the shift drops at 11 of 12 widths measured: to 0.001 to 0.004 at 360, 375, 393,
  412, 430, 768, 1024, 1280, 1366, 1440 and 1920 pixels.
* Bad, because the fallback matches the average width of a line, not every word. At 390 pixels one
  line breaks differently and the shift rises from 0.009 to 0.081, still under 0.1.
* Bad, because the fallback rules add 651 bytes, gzipped, to the page.
* Neutral, because a device with none of the listed system fonts draws the fallback unadjusted, as
  before. Android has Roboto, which fontaine leaves out of its list, so `astro.config.ts` adds it.

### Confirmation

The Chromium tests "late fonts barely move the page at 412 pixels" and "at 1440 pixels" in
`test/e2e/page.spec.ts` hold every font back by one second and require a total shift under 0.01.
Without the fallback faces they fail with 0.19 and 0.44.

## Pros and Cons of the Options

### Fallback faces sized to the web fonts with fontaine

[fontaine](https://github.com/unjs/fontaine) (MIT, about 2,000 GitHub stars, version 1.0.2
released 2026-10-21) is a Vite plugin from the UnJS project that generates the fallback rules.
Next.js does the same for fonts loaded through `next/font`.

* Good, because the page keeps its fonts and shows text at once.
* Good, because the metrics come from the font files at build time, so a font update needs no
  change here.
* Bad, because it can't detect that the variable mono fonts are monospace, so `astro.config.ts`
  names their fallback list.

### Astro's Fonts API with its sized fallbacks

Astro 7 can load the fonts itself, from Fontsource or local files, and with `optimizedFallbacks`
adds a sized fallback face in the same way.

* Good, because it needs no extra dependency.
* Bad, because Astro 7.4.1 sizes one system font per generic family: Arial for `sans-serif` and
  Courier New for `monospace`. Android has neither, so a first visit there still jumps; fontaine
  also sizes Roboto, Noto Sans, Liberation Sans, Segoe UI and Helvetica Neue.
* Bad, because the fonts would move from the `@fontsource-variable` imports and their preloads to
  Astro's own loading, a larger change for the same result on desktop.

### `font-display: optional`

The browser waits about 100 ms for a font. If it isn't there by then, the page keeps the system
font for that visit, and the font is used from the next visit on.

* Good, because nothing ever moves.
* Bad, because a first visit on a slow network never shows the page's fonts.

### `font-display: fallback`

The browser hides text for about 100 ms, then shows the system font, and swaps in the web font
only if it arrives within about three seconds.

* Good, because a font later than three seconds no longer moves the page.
* Bad, because a font that arrives within the three seconds moves the page as much as it does now,
  and on a slower network the first visit keeps the system font.

### `font-display: block`

The browser hides text for up to three seconds while the font loads.

* Good, because the text appears once, in the right font.
* Bad, because a slow network shows a page without text for up to three seconds.

## More Information

Measured on 2026-10-29 with the build served locally, every `.woff2` response held back by 800 ms,
in the Chromium of the `mcr.microsoft.com/playwright:v1.64.1-noble` image, whose system fonts
include Liberation Sans and Liberation Mono, metric-compatible with Arial and Courier New.
martinfrancois asked for the shift to be looked into after one of three Lighthouse runs against
https://html.fmartin.ch measured 0.82.

The preloads stay, measured on 2026-10-29 with Lighthouse 12.6.1's mobile preset against the build
served with zstd, five runs each unless noted. The fonts make up most of the mobile largest paint:
with none, it's 1,353 ms instead of 1,952 ms. Without the preloads it was 1,801 ms in two of three
runs, but the fonts then arrived after the first paint, where with the preloads they arrived before
it in every run, also in PageSpeed Insights' run against the live site. A reader would see the
fallback first and then the swap. Martian Mono's static bold file, 10.6 KB instead of 23.5 KB for
the variable one, left the largest paint at 1,951 ms.

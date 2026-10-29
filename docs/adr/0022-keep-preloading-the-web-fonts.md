---
status: accepted
date: 2026-10-29
decision-makers: [implementing coding agent]
consulted: []
informed: [Future maintainers and agents working on this repository]
---

# Keep preloading the web fonts

## Context and Problem Statement

PageSpeed Insights scores the page 99 on mobile, held back by the largest contentful paint, a
paragraph of text. Lighthouse's mobile preset simulates a slow connection, and a text largest paint
waits there for every request that starts before the page is first drawn: the HTML, the three
preloaded fonts and the page's script. martinfrancois asked whether the performance could improve.
What can the page change, and is any of it worth what it costs the reader?

## Decision Drivers

* A change stays only when a measurement shows it helps (`docs/agents/testing.md`).
* Readers see the page's own fonts at the first paint, without a swap, as `src/pages/index.astro`
  preloads them for.
* The page doesn't move when the fonts arrive ([ADR 0017](0017-size-fallback-fonts-to-match-the-web-fonts.md)).

## Considered Options

* Keep the preloads and the fonts as they are
* Drop the font preloads
* Smaller font files
* Smaller HTML
* Take the script out of the requests before the first paint

## Decision Outcome

Chosen option: "Keep the preloads and the fonts as they are", because the only change that moves
the largest paint, dropping the preloads, makes readers see the fallback fonts first and the page
jump when the web fonts arrive.

### Consequences

* Good, because the fonts arrive before the first paint, in every local run and in PageSpeed
  Insights' run against the live site (fonts loaded at 303 to 346 ms, first paint at 1,395 ms).
* Bad, because the mobile score stays at 99. Only dropping a web font would reach 100, which would
  change the page's design.

### Confirmation

Before changing the fonts, their preloads or what loads before the first paint, rerun the
measurements below and compare.

## Pros and Cons of the Options

### Keep the preloads and the fonts as they are

The three Latin font files stay preloaded from the page's `<head>`, as variable fonts.

* Good, because readers get the page's fonts at the first paint.
* Bad, because the simulated largest paint stays at 1,952 ms.

### Drop the font preloads

The browser then asks for each font when it first lays out text in it.

* Good, because the largest paint fell to 1,801 ms in two of three runs, and to 1,294 ms in the
  third, where the fonts started after the first paint.
* Bad, because the fonts then arrived after the first paint, the layout shift was 0.70 in all three
  runs, against 0 with the preloads, and the performance score fell to 75 to 77.

### Smaller font files

Fewer bytes per font, such as a static file for a font drawn at one weight.

* Neutral, because Martian Mono's static bold file, 10.6 KB instead of 23.5 KB for the variable
  one it replaces (the page uses only its bold), left the largest paint at 1,951 ms.
* Bad, because the simulation counts whole round trips of about 150 ms: without Atkinson Hyperlegible
  Next (34 KB) the largest paint was 1,803 ms, without Martian Mono (24 KB) 1,803 ms in two of three
  runs, and without Atkinson Hyperlegible Mono (18 KB) unchanged, so only a font dropped entirely
  helps. Atkinson Hyperlegible Next is drawn at three weights, which as static files would together
  be larger than the variable one.

### Smaller HTML

Fewer bytes in the page itself, such as without the search data each entry carries.

* Neutral, because 9.4 KB less of compressed HTML, without the search data on each entry, and
  4.9 KB less, with the code colours as short classes, both left the largest paint at 1,951 ms.

### Take the script out of the requests before the first paint

Load the page's script later, so it doesn't start before the first paint.

* Neutral, because without the page's script at all the largest paint was 1,959 ms.

## More Information

Measured on 2026-10-29 with Lighthouse 12.6.1's mobile preset against the build served locally with
zstd, five runs each unless the text says three, median largest paint. With no web fonts at all it
was 1,353 ms and the score 100. Each variant edited a copy of the built page, so no option needed
building to be measured.

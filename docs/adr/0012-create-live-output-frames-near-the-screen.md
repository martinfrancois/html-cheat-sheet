---
status: accepted
date: 2026-10-29
decision-makers: [implementing coding agent]
consulted: []
informed: [Future maintainers and agents working on this repository]
---

# Create live output frames when they come near the screen

## Context and Problem Statement

Every example shows its live output in a sandboxed `<iframe>`
([ADR 0003](0003-render-live-output-in-sandboxed-iframes.md)). With every entry written, the page
had about 220 of them in its HTML. They started empty and got their document from a script only
near the screen, but the browser still gives each `<iframe>` element a browsing context, with its
own window and `about:blank` document, while it parses the HTML. The owner asked for Lighthouse
scores of 100 where the reading experience doesn't suffer. How should the page hold its frames?

## Decision Drivers

* Lighthouse performance on mobile, measured, not assumed.
* Nothing a reader can do today may get worse: find in page, reading without JavaScript, links to
  an entry, the live output itself.
* The tests reach every frame the same way a reader does.

## Considered Options

* Every `<iframe>` in the HTML
* Each `<iframe>` in a `<template>`, created near the screen
* Smaller highlighted code markup
* Load the lower chapters after the first screen

## Decision Outcome

Chosen option: "Each `<iframe>` in a `<template>`, created near the screen", because it removed
almost all of the blocking time and changes nothing a reader sees.

Each live output box holds a 48 px placeholder and a `<template>` with its `<iframe>`.
`src/scripts/live-output.ts` swaps the placeholder for the frame when the box comes within 800 px of
the screen, then renders it as before. The example's code comes from its highlighted block, so the
page holds it once.

Measured with Lighthouse 12.6.1, mobile preset (simulated throttling), Chrome for Testing 151, against the
built page served with gzip and the full set of 125 entries, on 2026-10-29:

| | Performance | Total blocking time | First contentful paint | Largest contentful paint |
| --- | --- | --- | --- | --- |
| Every `<iframe>` in the HTML | 78 | 930 ms | 1.3 s | 2.0 s |
| `<iframe>` in a `<template>` | 99 (3 runs) | 10 to 70 ms | 1.5 s | 2.0 to 2.1 s |

The trace of the first row had one 235 ms task (940 ms after Lighthouse's 4x slowdown) parsing the
HTML. 176 ms of it was `LocalWindowProxy::Initialize`, which sets up a frame's window. Desktop
scores 100 in all four categories with the chosen option.

### Consequences

* Good, because mobile performance went from 78 to 99, with accessibility, best practices
  and SEO still at 100.
* Good, because readers see no difference: a frame appeared only near the screen before as well,
  and without JavaScript the box was empty before as well.
* Bad, because a frame no longer exists until its box nears the screen, so code that looks one up
  must create it first (`frameIn`) and tests must scroll to it (`test/e2e/helpers.ts`).
* Neutral, because first and largest contentful paint stay at 1.5 s and 2.0 s. Lighthouse's
  simulation charges them for the whole 114 KB of compressed HTML: the same page with a tenth of
  the entries (38 KB) painted at 0.9 s. Getting there means sending less of the page up front,
  which the last option rejects.

### Confirmation

`test/e2e/page.spec.ts` checks that the page starts with only the frames near the screen, and that
live output still renders. Rerun Lighthouse on mobile after a change to the page's structure.

## Pros and Cons of the Options

### Every `<iframe>` in the HTML

Each example's `<iframe>` is in the HTML from the start, empty until a script fills it near the
screen. This was the state before this decision.

* Good, because the markup is the simplest.
* Bad, because the browser builds about 220 frame windows while parsing, for 930 ms of blocking
  time on a mid-range phone and a performance score of 78.

### Each `<iframe>` in a `<template>`, created near the screen

The `<iframe>` waits in a `<template>`, whose content the browser parses but never turns into a
live element, until a script clones it into the page.

* Good, because the blocking time dropped to 10 to 70 ms.
* Bad, because frames exist only after a script ran, which code and tests must allow for.

### Smaller highlighted code markup

Shiki writes every token as `<span style="color:var(--code-attr)">`. A transformer replaced that
with short classes, dropped the span around spaces, and merged neighbours of one colour.

* Good, because the HTML shrank by 16% (4% compressed) and by about 1,700 elements.
* Bad, because three Lighthouse runs showed no change in any metric, so it added a transformer and
  colour rules for nothing measurable. Tried and reverted.

### Load the lower chapters after the first screen

Send only the first chapters in the HTML and fetch the rest once the page shows.

* Good, because it is the only option that would bring first contentful paint close to 0.9 s.
* Bad, because find in page, links to a later entry, and reading without JavaScript would miss
  most of the page until the rest arrived.

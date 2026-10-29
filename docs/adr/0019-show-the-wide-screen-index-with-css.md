---
status: accepted
date: 2026-10-29
decision-makers: [implementing coding agent]
consulted: []
informed: [Future maintainers and agents working on this repository]
---

# Show the wide-screen index with CSS

## Context and Problem Statement

The index is one `<details>`, so it folds on a phone without JavaScript. On a wide screen its
toggle is hidden and the index must show. An inline script opened the `<details>` before the first
paint where there was room, and `src/scripts/index-nav.ts` followed later resizes. Without
JavaScript the index stayed folded on a wide screen, with no toggle to open it. `::details-content`
became Baseline on 2025-09-16, so under
[ADR 0016](0016-use-web-features-six-months-after-they-become-baseline.md) the page may style the
content of a closed `<details>`. How should the index show on a wide screen?

## Decision Drivers

* The index shows on a wide screen with or without JavaScript.
* No script that has to run before the first paint (ADR 0014).
* Readers on a browser too old for the feature can still use the page.

## Considered Options

* `::details-content` shown from the `sm` breakpoint
* `::details-content`, and the toggle hidden only where the browser supports it
* Keep the scripts that open the `<details>`

## Decision Outcome

Chosen option: "`::details-content` shown from the `sm` breakpoint", because one class on the
`<details>` in `src/pages/index.astro` replaces both scripts and also shows the index without
JavaScript.

From Tailwind's `sm` breakpoint the `<details>` gets
`sm:[&::details-content]:[content-visibility:visible]`, next to the `sm:hidden` on its summary, so
the content shows whether the `<details>` is open or not.

### Consequences

* Good, because the inline script, `index-nav.ts`, and the unit test that kept the script's media
  query in step with Tailwind's breakpoint are gone.
* Good, because the index shows on a wide screen without JavaScript.
* Bad, because in a browser without `::details-content` (before Chrome 131, Firefox 143 and Safari
  18.4) the index stays folded on a wide screen with no toggle to open it. Search and the links
  between entries still work.

### Confirmation

The Playwright test "folds the index on a phone only", with and without JavaScript, checks that at
390 pixels the toggle shows and the links don't, and that at 1280 pixels the links show and the
toggle doesn't, in Chromium, Firefox and WebKit.

## Pros and Cons of the Options

### `::details-content` shown from the `sm` breakpoint

The content of the closed `<details>` shows from the `sm` breakpoint, where the toggle is hidden.

* Good, because it's one class and no script.
* Bad, because an older browser loses the index on a wide screen.

### `::details-content`, and the toggle hidden only where the browser supports it

The same, with the summary's `sm:hidden` applied only under `@supports selector(::details-content)`,
so an older browser keeps the toggle.

* Good, because an older browser can still open the index.
* Bad, because it's a fallback for a feature every browser six months old has, which ADR 0016 set
  out to stop writing.

### Keep the scripts that open the `<details>`

An inline script opens the `<details>` before the first paint where there is room, and a module
script follows resizes.

* Good, because it works in older browsers when JavaScript runs.
* Bad, because without JavaScript the index can't be opened on a wide screen, and the page keeps a
  script that must run before the first paint.

## More Information

Dates and versions are from `web-features` 3.43.0. The accessibility tree in Chromium lists every
index link under the "Index" navigation while the `<details>` is closed, and Tab reaches them in
all three browsers.

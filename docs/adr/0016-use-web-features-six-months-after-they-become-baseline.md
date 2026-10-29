---
status: accepted
date: 2026-10-29
decision-makers: [martinfrancois]
consulted: [implementing coding agent]
informed: [Future maintainers and agents working on this repository]
---

# Use web features six months after they become Baseline

## Context and Problem Statement

The page's own HTML, CSS and JavaScript used only features that are Baseline widely available, which
`web-features` reaches 30 months after a feature works in every major browser. martinfrancois never
asked for that rule: it came in with the rebuild as a default. It kept the page on workarounds,
such as a second copy of the dark palette in place of `light-dark()`, and it ruled out
`content-visibility: auto`, which could cut the page's style and layout work. The people who read an
HTML cheat sheet are developers, who mostly run a fairly recent browser. How long after a feature
works everywhere may the page use it?

## Decision Drivers

* Readers are developers, who mostly run a fairly recent browser.
* Workarounds for features every current browser has cost code and tests.
* One rule, checked the same way every time, with `web-features`.

## Considered Options

* Six months after Baseline newly available
* Baseline widely available, 30 months after newly available
* Baseline newly available, from the first day

## Decision Outcome

Chosen option: "Six months after Baseline newly available", because it lets the page use what the
browsers of its readers have, while the six months cover a reader whose browser updates late.

A feature counts from its `baseline_low_date` in `web-features`, taken from the most specific compat
key the code relies on under `status.by_compat_key`: `css.selectors.popover-open` for that selector,
not the whole `popover` feature, and `css.properties.content-visibility.auto` for that value. This
rule is for the page itself. Examples keep showing any feature, with their badge (`SPEC.md` section
9.5).

### Consequences

* Good, because two workarounds go: the dark palette is written once with `light-dark()`, which
  became Baseline on 2024-05-13, and the frame script calls `:popover-open` without a `try`, which
  has been Baseline since 2024-04-16.
* Good, because `content-visibility: auto`, Baseline since 2025-09-15, can be measured for the
  page's speed.
* Bad, because a reader on a browser more than six months behind can meet a feature their browser
  doesn't know. In a browser without `light-dark()` (before Chrome 123, Firefox 120 and Safari 17.5)
  every colour token is invalid where it's used, so the whole page shows the browser's default
  colours, black text on white, still readable. In a browser without popovers (before Chrome 114,
  Firefox 125 and Safari 17), the live output frames stop resizing, because `:popover-open` throws.
* Neutral, because [ADR 0003](0003-render-live-output-in-sandboxed-iframes.md) and
  [ADR 0006](0006-offline-support-with-a-service-worker.md) name the old rule as a driver. The
  features ADR 0006 uses are widely available anyway. ADR 0003 rejected declarative shadow DOM
  partly because it became widely available only on 2026-08-20; under this rule it qualified from
  2024-08-20, but the option's other drawbacks still decide against it.

### Confirmation

`test/baseline-workarounds.test.ts` lists each workaround for a feature that doesn't qualify yet and
fails on the day it does. Its tests "the page may use a feature six months after it became
Baseline" and "the page may not use a feature that isn't Baseline" check the date rule in
`test/page-features.ts`. Before using a feature, an agent looks up its date as
[Default workflow](../agents/default-workflow.md) describes.

## Pros and Cons of the Options

### Six months after Baseline newly available

The page may use a feature six months after the last of the core browsers shipped it.

* Good, because features reach the page two years sooner than under the old rule.
* Bad, because the page can break for a reader whose browser is more than six months old.

### Baseline widely available, 30 months after newly available

The rule the makeover started with: wait until `web-features` marks a feature `high`.

* Good, because nearly every browser in use has the feature by then.
* Bad, because it keeps workarounds for years for features every current browser has, which costs
  code, tests, and page speed.

### Baseline newly available, from the first day

The page may use a feature as soon as the last core browser ships it.

* Good, because there's never a workaround for a feature every current browser has.
* Bad, because a reader whose browser updates a few weeks late meets a broken page.

## More Information

martinfrancois set the six months on 2026-10-29: he never asked for the 30-month rule, and expects
the page's readers, mostly developers, to have a fairly recent browser most of the time.
Dates are from `web-features` 3.43.0. Baseline is described at
[web.dev/baseline](https://web.dev/baseline).

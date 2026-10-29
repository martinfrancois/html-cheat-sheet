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
`web-features` reaches 30 months after a feature works in every major browser. That rule was never
asked for: it came in with the makeover as a default. It kept the page on workarounds, such as a
second copy of the dark palette in place of `light-dark()`, and it ruled out
`content-visibility: auto`, which could cut the page's style and layout work. The people who read an
HTML cheat sheet are developers, who mostly run a browser that is at most a few months old. How long
after a feature works everywhere may the page use it?

## Decision Drivers

* Readers are developers, whose browsers update on their own and are rarely more than a few months
  behind.
* Workarounds for features every current browser has cost code and tests.
* A reader on an older browser must still be able to read the page.
* One rule, checked the same way every time, with `web-features`.

## Considered Options

* Six months after Baseline newly available
* Baseline widely available, 30 months after newly available
* Baseline newly available, from the first day

## Decision Outcome

Chosen option: "Six months after Baseline newly available", because it lets the page use what the
browsers of its readers have, while the six months cover a reader whose browser updates late.

A feature counts from its `baseline_low_date` in `web-features`; for a single CSS value, such as
`content-visibility: auto`, that's the date under `status.by_compat_key`. This rule is for the page
itself. Examples keep showing any feature, with their badge (`SPEC.md` section 9.5).

### Consequences

* Good, because two workarounds go: the dark palette is written once with `light-dark()`, which
  became Baseline on 2024-05-13, and the frame script calls `:popover-open` without a `try`, which
  has been Baseline since 2024-04-16.
* Good, because `content-visibility: auto`, Baseline since 2025-09-15, can be measured for the
  page's speed.
* Bad, because a reader on a browser more than six months behind can meet a feature their browser
  doesn't know. A CSS feature such as `light-dark()` then leaves its declaration out, so the page
  needs checking in that state when a feature affects reading.
* Neutral, because [ADR 0003](0003-render-live-output-in-sandboxed-iframes.md) and
  [ADR 0006](0006-offline-support-with-a-service-worker.md) name the old rule as a driver. Their
  choices don't depend on it: the features they use are widely available anyway.

### Confirmation

`test/baseline-workarounds.test.ts` lists each workaround for a feature that doesn't qualify yet and
fails once it does. Its last test checks the date rule in `test/page-features.ts`. Before using a
feature, an agent looks up its date as
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

martinfrancois set the six months on 2026-10-29, noting that he never asked for the 30-month rule.
Dates are from `web-features` 3.43.0. Baseline is described at
[web.dev/baseline](https://web.dev/baseline).

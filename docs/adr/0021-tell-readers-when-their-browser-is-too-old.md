---
status: accepted
date: 2026-10-29
decision-makers: [martinfrancois]
consulted: [implementing coding agent]
informed: [Future maintainers and agents working on this repository]
---

# Tell readers when their browser is too old

## Context and Problem Statement

Under [ADR 0016](0016-use-web-features-six-months-after-they-become-baseline.md) the page uses web
features six months after they work in every core browser, so a reader whose browser is older
than that loses parts of the page. Most of what they lose throws no error: without `light-dark()`
the page shows black text on white, and without `::details-content` the index stays folded on a
wide screen. That reader can't tell what went wrong, and martinfrancois can't tell how many readers
it happens to. How should the page handle a browser that lacks a feature it needs?

## Decision Drivers

* A reader on an older browser learns why the page looks broken and which browsers it works in.
* martinfrancois learns how many readers' browsers are too old, to adjust the rule if many are.
* Script errors in readers' browsers reach PostHog, which
  [ADR 0013](0013-measure-usage-and-web-vitals-with-cookieless-posthog.md) set up for usage data.
* The supported versions stay right without anyone keeping them in sync by hand.
* Nothing changes for a reader with a current browser.

## Considered Options

* Check the features the page needs, show a notice and send an event
* Send script errors only
* Show nothing

## Decision Outcome

Chosen option: "Check the features the page needs, show a notice and send an event", because it
catches the features whose loss throws no error, and tells both the reader and martinfrancois.

`src/lib/required-features.ts` lists each feature the page needs that isn't widely available yet,
with its compat key and a check the browser runs. `src/scripts/browser-support.ts` runs the checks
as the page starts. When one fails, it sends PostHog an `unsupported_browser` event with the
missing compat keys, and shows the notice at the top of the page: "Your browser, Firefox 120, is
too old for parts of this page. It works in Chrome 132, Edge 132, Firefox 143 and Safari 26 or
newer." PostHog adds the browser and its version to every event itself. The versions come from the
same list at build time (`src/lib/supported-browsers.ts`): for each browser, the newest of the first
versions `web-features` gives for the listed features. [bowser](https://github.com/bowser-js/bowser)
names the reader's browser, and loads only when a check fails.

PostHog's exception capture is on, with its code bundled like the web-vitals code, and
`src/scripts/analytics.ts` keeps the errors from before PostHog starts and sends them then.

A feature the page needs only for speed or comfort, whose loss a reader wouldn't notice, stays off
the list: `content-visibility: auto` makes the page faster, and `scrollend` lets the page remember
the reader's place after Back within the page. Safari has `scrollend` only from 26.2, so the notice
says the page works in Safari 26, not that it works fully there.

### Consequences

* Good, because a reader on an older browser sees what's wrong and how to fix it.
* Good, because PostHog shows how many readers have a browser that's too old, with its name and
  version, and which features it lacked.
* Good, because a new feature added to the list moves the supported versions in the notice by
  itself.
* Bad, because the list has to be kept: a new feature the page relies on and nobody adds goes
  unnoticed. [Default workflow](../agents/default-workflow.md) asks for it with every new feature.
* Bad, because the dialog check calls `show()` on a dialog and cancels the opening, since dialogs'
  `toggle` event has no check of its own. In an older browser the dialog does open, and Chromium
  and Firefox scroll a visible one into view at the end of the page, so it's hidden. Chromium still
  takes focus away, so the check puts it back, and the dialog is removed before the page is drawn.
* Bad, because the page's script grows by about 0.9 KB gzipped, bowser takes 7.6 KB that only an
  older browser downloads, and PostHog's error code 6.3 KB, which loads with PostHog. The service
  worker keeps a copy of all three for offline use.
* Neutral, because a browser too old to run the page's script at all gets neither the notice nor
  the event, such as one from before the second half of 2020, which lacks `??=`. Its reader still
  sees the page's text.

### Confirmation

* `test/required-features.test.ts` checks that every listed feature exists in `web-features` and may
  be used under the six-month rule, and how the versions are worked out and written.
* The Playwright test "tells a reader whose browser is too old, and reports what it lacks" removes
  `Set.prototype.intersection` and checks the notice and the PostHog event in Chromium, Firefox and
  WebKit. "shows no browser notice in a current browser" checks the other side.
* "reports script errors, also ones from before PostHog started" checks that an error thrown before
  PostHog starts and one after both reach it, and "sends nothing without a PostHog key, also for a
  browser that's too old" that nothing leaves the page without the key.
* `test/e2e/accessibility.spec.ts` checks the notice's contrast in both themes.

## Pros and Cons of the Options

### Check the features the page needs, show a notice and send an event

Each feature the page needs is checked as the page starts, and a missing one shows a notice and
sends PostHog an event.

* Good, because it catches what breaks without an error, such as the colours and the index.
* Bad, because it needs the list of features and a check for each.

### Send script errors only

PostHog's exception capture alone, with no checks and no notice.

* Good, because there's nothing to keep up to date.
* Bad, because most of what an older browser loses throws no error, so PostHog would see only a
  search of two or more words failing, and the reader would see no explanation.

### Show nothing

The page stays as it is: no checks, no notice and no errors sent.

* Good, because nothing changes.
* Bad, because neither the reader nor martinfrancois learns that the page is broken for them.

## More Information

martinfrancois asked on 2026-10-29 for a notice naming the reader's browser and version and the
supported ones, and for PostHog to hear about it so the rule can change if many readers have older
browsers. Versions are from `web-features` 3.43.0. bowser 2.14.1 is MIT licensed, with about 5,800
stars on GitHub and releases through 2026.

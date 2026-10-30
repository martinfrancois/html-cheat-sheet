---
status: accepted
date: 2026-10-30
decision-makers: [implementing coding agent]
consulted: []
informed: [Future maintainers and agents working on this repository]
---

# Bound a test for absent requests with a marker request

## Context and Problem Statement

"sends nothing without a PostHog key, also for a browser that's too old" in
`test/e2e/page.spec.ts` checks that something doesn't happen, which needs a point at which the test
stops looking. It waited for `waitForLoadState("networkidle")`, and on 2026-10-29 that timed out in
Firefox on two CI runs in a row, with every request in the trace finished.

Playwright 1.64.1 fires `networkidle` for a page only when every child frame has fired it too, and
a frame that has fired it never starts its idle timer again. So once the page has gone idle, made
one more request that finishes before a new frame commits, and then created that frame, it never
fires again ([microsoft/playwright#43243](https://github.com/microsoft/playwright/issues/43243),
closed as not planned). This page does that: it requests the bowser chunk for the browser notice
about 800 ms after its main script, more than the 500 ms idle time, and creates live output frames
after that. How should a test bound its wait for a request that must not come?

## Decision Drivers

* The test must fail when PostHog loads, in Chromium, Firefox and WebKit.
* It must not wait for a fixed time, see [Testing](../agents/testing.md#writing-tests).
* It must not depend on how Playwright tracks network activity across frames.

## Considered Options

* Wait for `networkidle`
* Wait a fixed time
* Make a marker request and wait for it

## Decision Outcome

Chosen option: "Make a marker request and wait for it", because it is the only option that ends at
a point the page itself defines and still sees PostHog load in all three browsers.

After `page.clock.runFor(2_000)`, the time at which PostHog would start, the page fetches
`/?after-start` and the test waits for that request. With a key, `load()` in
`src/scripts/analytics.ts` calls `import()` in a microtask of the two-second timer, so the browser
requests PostHog's scripts before the fetch from the next `page.evaluate`, and Playwright reports
page requests in the order the browser sends them. The test then checks that the page requested no
script after the notice showed. The check on PostHog's host only catches a send from code that is
already loaded, because a real send comes after the scripts load, well after the marker.

### Consequences

* Good, because the wait ends as soon as the marker request goes out, in about the same time on a
  slow runner as on a fast one.
* Good, because it catches PostHog loading in all three browsers. With a key forced on, the old
  check passed in WebKit.
* Bad, because any script the page loads after its first two seconds fails the test, even one that
  has nothing to do with analytics. A change that adds such a script has to say in this test which
  scripts it expects.

### Confirmation

On 2026-10-29, with Playwright 1.64.1 in its container, a probe with and without a key ran 165
times across Chromium, Firefox and WebKit, with 4 and 8 workers. With a key, PostHog's three scripts
(`module`, `web-vitals`, `exception-autocapture`) were requested before the marker every time;
without one, no script was. The test fails in all three browsers when `withKey(page)` is added to
it.

## Pros and Cons of the Options

### Wait for `networkidle`

`page.waitForLoadState("networkidle")` resolves once no request has been in flight for 500 ms, in
the page and in every frame.

* Good, because it needs no change to the page or the test's setup.
* Bad, because it never resolves after the request-then-frame order this page has, which upstream
  won't fix, and Playwright's docs discourage it.

### Wait a fixed time

`page.waitForTimeout` for a few seconds after the clock passes two seconds.

* Good, because it is one line.
* Bad, because a slow runner can still be loading PostHog when the time is up, so the test passes
  when it should fail.
* Bad, because the testing guide rules out waiting for a fixed time.

### Make a marker request and wait for it

The page fetches a URL the test knows, and the test waits for that request with
`page.waitForRequest`.

* Good, because it ends at a point the page defines, after any request the two-second timer starts.
* Neutral, because it relies on Playwright reporting requests in the order the browser sends them,
  which the probe above confirmed.
* Bad, because it fails on any late script, as described under Consequences.

## More Information

[html-cheat-sheet issue #30](https://github.com/martinfrancois/html-cheat-sheet/issues/30) has the
CI traces of both timeouts.

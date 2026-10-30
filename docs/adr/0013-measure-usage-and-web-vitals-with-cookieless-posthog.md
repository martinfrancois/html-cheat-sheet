---
status: accepted
date: 2026-10-29
decision-makers: [martinfrancois]
consulted: [implementing coding agent]
informed: [Future maintainers and agents working on this repository]
---

# Measure usage and web vitals with cookieless PostHog

## Context and Problem Statement

[ADR 0005](0005-cookieless-posthog-analytics-as-the-only-third-party-request.md) chose cookieless
PostHog to learn how the cheat sheet is used: page views, searches that find nothing, and clicks on
Edit and Copy. Lighthouse runs show how fast the page is on one machine. They don't show how fast it
is for the people who read it, on their phones and connections. Cloudflare, in front of the site,
offered that through its Real User Monitoring beacon, which martinfrancois turned off for the whole
fmartin.ch zone. How should the page measure how fast it is for its readers?

## Decision Drivers

* Report the Core Web Vitals readers get: LCP, INP and CLS, plus FCP.
* Store nothing on the reader's device, so no consent banner is needed.
* Keep the data in the EU, next to the usage data.
* Add no request to another host: PostHog stays the page's only third party.
* Never slow the page down to measure it.

## Considered Options

* Web vitals from cookieless PostHog, with the web-vitals code bundled
* Cloudflare Real User Monitoring
* No speed measurement from readers

## Decision Outcome

Chosen option: "Web vitals from cookieless PostHog, with the web-vitals code bundled", because it
measures the four metrics with the analytics the page already has, without another host or anything
stored on the device.

The page sends page views, searches with no results (with the search text), clicks on Edit and
Copy, and `$web_vitals` events: usually one with FCP and LCP and one with CLS and INP when the
reader leaves, plus one more each time the page is hidden again or restored from the back-forward
cache. It records no session replays and sets no
cookies. PostHog loads two seconds after the page and brings the web-vitals code with it from the
page's own bundle, because the page doesn't let PostHog fetch code from its servers. The page asks
for the web-vitals build without attribution, which is the one bundled; the attribution build would
tell which element caused a slow metric, for more code than a reference page needs.

### Consequences

* Good, because martinfrancois sees the speed readers actually get, next to the usage data, in one
  project.
* Good, because readers see no consent banner and nothing is written to cookies or local storage.
* Good, because searches with no results show which elements or words readers expect and don't
  find.
* Bad, because the web-vitals code adds 3.9 KB gzipped (11 KB raw, posthog-js 1.438.13, measured
  2026-10-29) to the analytics download, which starts after the page is ready.
* Neutral, because each browser reports only what it measures. Only Chromium-based browsers have
  the layout shift API, so Firefox and Safari readers send no CLS. Safari sends LCP and INP from
  version 26.2 on, and only FCP before that.
* Bad, because a visit that ends before PostHog loads, two seconds in plus the download, sends no
  web vitals. Those are the slowest loads on the slowest phones, so the numbers lean fast.
* Neutral, because PostHog reads LCP, CLS and FCP from the browser's buffer once it starts, and INP
  from buffered event timings, which keep every interaction of 104 ms or more. A quick interaction
  in the first two seconds is missed, a slow one isn't. A click in those two seconds loses no LCP:
  the browser keeps the LCP it recorded before the click, and web-vitals hands it to PostHog at the
  reader's next click or key press, or when the page is hidden. Only events from the reader count,
  so a test that hides the page by dispatching its own `visibilitychange` gets no LCP after an early
  click, see
  [web-vitals pull request #635, only finalize LCP on user events](https://github.com/GoogleChrome/web-vitals/pull/635)
  and [html-cheat-sheet issue #24, no LCP after an early click](https://github.com/martinfrancois/html-cheat-sheet/issues/24).
* Bad, because without a stored identifier, PostHog can't tell a returning visitor from a new one,
  so visitor counts are approximate.
* Bad, because PostHog is the one request to another host. A reader who blocks it is not counted,
  and the page must work the same when the request fails.
* Neutral, because when the page works offline
  ([ADR 0006](0006-offline-support-with-a-service-worker.md)), events from offline visits are lost.

### Confirmation

Playwright tests in `test/e2e/page.spec.ts`:

* One records every network request while it loads the page, searches, and clicks Edit and Copy. It
  checks that every request goes to the site's own origin or to PostHog's EU host, and that the page
  sets no cookies and writes no analytics keys to local storage.
* One hides the page, as leaving it does, and checks that `$web_vitals` events reach PostHog's EU
  host with LCP, INP, CLS and FCP in Chromium, and without CLS in Firefox and WebKit. The analytics
  tests block the service worker, because in WebKit the page's requests go through it, where the
  test can't answer them.
* In WebKit, the analytics tests hand `navigator.sendBeacon` bytes instead of a Blob. PostHog sends
  the events of a page being hidden that way, and Playwright's WebKit gives the test no body for a
  Blob, see
  [Playwright issue #6479, no post data for a Blob](https://github.com/microsoft/playwright/issues/6479)
  and [html-cheat-sheet issue #13, no web vitals in WebKit](https://github.com/martinfrancois/html-cheat-sheet/issues/13).
  The test "Playwright's WebKit still hides Blob request bodies" fails once Playwright shows them,
  and the workaround can go.
* One clicks the page before PostHog starts and checks that LCP still arrives.
* One blocks the PostHog host and checks that the page still works.

## Pros and Cons of the Options

### Web vitals from cookieless PostHog, with the web-vitals code bundled

The PostHog client, configured to store nothing on the device, sends events to a project in
PostHog's EU region that only this site uses. Its web vitals option measures the four metrics in the
reader's browser with Google's `web-vitals` library, which `posthog-js` ships as a separate file the
page imports.

* Good, because it needs no new host, account or banner.
* Good, because PostHog can count searches and button clicks, not only page views.
* Bad, because returning visitors can't be recognized.
* Bad, because PostHog's client starts late, so the earliest interactions are missed.

### Cloudflare Real User Monitoring

Cloudflare injects its own beacon script into every page it serves and reports web vitals in the
Cloudflare dashboard.

* Good, because it measures from the first moment and needs no code in the page.
* Bad, because it adds a request to another host, which the page promises it doesn't make.
* Bad, because it is switched for the whole zone, not per site, and martinfrancois turned it off.
* Bad, because the speed data sits in a different tool from the usage data.

### No speed measurement from readers

The page relies on Lighthouse runs and the tests.

* Good, because the page sends less.
* Bad, because a slow phone or a Cloudflare setting that slows the page goes unnoticed. Rocket
  Loader did exactly that before
  [html-cheat-sheet pull request #11](https://github.com/martinfrancois/html-cheat-sheet/pull/11).

## More Information

martinfrancois chose PostHog for web vitals on 2026-10-29, after turning off Cloudflare's Real User
Monitoring for the zone. This record supersedes
[ADR 0005](0005-cookieless-posthog-analytics-as-the-only-third-party-request.md), whose choice of
cookieless PostHog it keeps. The PostHog project itself is set up in
[html-cheat-sheet issue #4](https://github.com/martinfrancois/html-cheat-sheet/issues/4).

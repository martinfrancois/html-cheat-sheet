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
offered that through its Real User Monitoring beacon, which the owner turned off for the whole
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
Copy, and one or two `$web_vitals` events per visit. It records no session replays and sets no
cookies. PostHog loads two seconds after the page and brings the web-vitals code with it from the
page's own bundle, because the page doesn't let PostHog fetch code from its servers. The page asks
for the web-vitals build without attribution, which is the one bundled; the attribution build would
tell which element caused a slow metric, for more code than a reference page needs.

### Consequences

* Good, because the owner sees the speed readers actually get, next to the usage data, in one
  project.
* Good, because readers see no consent banner and nothing is written to cookies or local storage.
* Good, because searches with no results show which elements or words readers expect and don't
  find.
* Bad, because the web-vitals code adds about 4 KB compressed to the analytics download, which
  starts after the page is ready.
* Neutral, because each browser reports only what it measures: Firefox has no layout shift API, so
  Firefox readers send no CLS.
* Bad, because PostHog starts two seconds in, so an interaction in those first two seconds doesn't
  count toward INP. LCP, CLS and FCP are read from the browser's buffer and are complete.
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
  host with LCP, INP, CLS and FCP in Chromium, and without CLS in Firefox. Playwright's WebKit
  doesn't show the test the requests PostHog sends on its own, so it skips this one.
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
* Bad, because it is switched for the whole zone, not per site, and the owner turned it off.
* Bad, because the speed data sits in a different tool from the usage data.

### No speed measurement from readers

The page relies on Lighthouse runs and the tests.

* Good, because the page sends less.
* Bad, because a slow phone or a Cloudflare setting that slows the page goes unnoticed. Rocket
  Loader did exactly that before
  [html-cheat-sheet pull request #11](https://github.com/martinfrancois/html-cheat-sheet/pull/11).

## More Information

The owner chose PostHog for web vitals on 2026-10-29, after turning off Cloudflare's Real User
Monitoring for the zone. This record supersedes
[ADR 0005](0005-cookieless-posthog-analytics-as-the-only-third-party-request.md), whose choice of
cookieless PostHog it keeps. The PostHog project itself is set up in
[html-cheat-sheet issue #4](https://github.com/martinfrancois/html-cheat-sheet/issues/4).

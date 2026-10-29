---
status: accepted
date: 2026-10-28
decision-makers: [martinfrancois]
consulted: [implementing coding agent]
informed: [Future maintainers and agents working on this repository]
---

# Cookieless PostHog analytics as the only third-party request

## Context and Problem Statement

The owner wants to know how the cheat sheet is used: how many people visit, what they search for
and don't find, and whether anyone uses Edit and Copy. GitHub Pages, which hosts the site, gives the
owner no access logs. Collecting usage data must not cost readers their privacy or put a consent
banner between them and the page. How should the page measure usage?

## Decision Drivers

* Answer three questions: page views, searches that find nothing, and clicks on Edit and Copy.
* Store nothing on the reader's device, so no consent banner is needed.
* Keep the data in the EU.
* Make no other third-party request: fonts, scripts, and styles all come from the site itself.
* Use a service the owner already uses for other sites, rather than a new account and tool.

## Considered Options

* Cookieless PostHog in its own EU project
* PostHog with cookies and a consent banner
* No analytics

## Decision Outcome

Chosen option: "Cookieless PostHog in its own EU project", because it answers the three questions
without storing anything on the reader's device, keeps the data in PostHog's EU region, and uses a
tool the owner already knows.

The page sends three kinds of events: page views, searches with no results (with the search text),
and clicks on Edit and Copy. It sends no other events, records no session replays, and sets no
cookies.
The project is separate from the owner's other PostHog projects, so the cheat sheet's numbers stand
alone.

### Consequences

* Good, because readers see no consent banner and nothing is written to cookies or local storage
  for analytics.
* Good, because searches with no results show which elements or words readers expect and don't
  find.
* Bad, because without a stored identifier, PostHog can't tell a returning visitor from a new one,
  so visitor counts are approximate.
* Bad, because PostHog is the one request to another host. A reader who blocks it is not counted,
  and the page must work the same when the request fails.
* Neutral, because when the page works offline
  ([ADR 0006](0006-offline-support-with-a-service-worker.md)), events from offline visits are lost.

### Confirmation

A Playwright test records every network request while it loads the page, searches, and clicks Edit
and Copy. It checks that every request goes to the site's own origin or to PostHog's EU host, and
that the page sets no cookies and writes no analytics keys to local storage. The test also blocks
the PostHog host and checks that the page still works.

## Pros and Cons of the Options

### Cookieless PostHog in its own EU project

The PostHog JavaScript client, configured to store nothing on the device, sends events to a project
in PostHog's EU region that only this site uses.

* Good, because nothing is stored on the device.
* Good, because PostHog can count searches and button clicks, not only page views.
* Bad, because returning visitors can't be recognized.

### PostHog with cookies and a consent banner

The same client with its default cookie persistence, behind a banner that asks for consent first.

* Good, because returning visitors and sessions are counted correctly for those who agree.
* Bad, because every reader has to deal with a banner before using a reference page.
* Bad, because readers who decline are not counted at all, which skews the numbers more than the
  missing visitor identity does.

### No analytics

The page sends no usage data.

* Good, because the page makes no third-party request and needs no account.
* Bad, because the owner can't learn which elements readers look for and don't find, which is the
  main input for improving the content.

## More Information

The owner chose this option in the design interview on 2026-10-28.

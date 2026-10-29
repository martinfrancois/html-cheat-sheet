---
status: accepted
date: 2026-10-29
decision-makers: [martinfrancois]
consulted: [implementing coding agent]
informed: [Future maintainers and agents working on this repository]
---

# Keep Cloudflare's 31-day browser cache

## Context and Problem Statement

GitHub Pages sends every file with `cache-control: max-age=600`, and a repository can't change
that. Cloudflare, in front of GitHub Pages for the fmartin.ch zone, replaces it with the zone's
Browser Cache TTL: `max-age=2678400`, 31 days, for every file, the HTML, `sw.js` and
`manifest.webmanifest` included (measured on 2026-10-29). A browser may then keep showing an old
copy of the page for up to a month after a deploy. Should the site override the zone setting for
html.fmartin.ch?

## Decision Drivers

* A new deploy must reach readers, see [ADR 0006](0006-offline-support-with-a-service-worker.md).
* Repeat visits should load fast, without asking the server about files that haven't changed.
* No setting for this site alone in the Cloudflare dashboard unless it fixes a real problem.

## Considered Options

* Keep the zone's 31-day browser cache for every file
* A Cache Rule for html.fmartin.ch that keeps GitHub's 600 seconds
* A Cache Rule that caches `/_astro/` for a long time and keeps GitHub's 600 seconds elsewhere

## Decision Outcome

Chosen option: "Keep the zone's 31-day browser cache for every file", because the service worker
already brings each deploy to readers, so the long cache costs them nothing that matters, and the
site needs no rule of its own in the dashboard.

The service worker is what gets a deploy to readers, not the browser cache. A browser checks
`sw.js` for changes without using the browser cache, because the page registers it with the default
`updateViaCache` setting. The new service worker then downloads the new HTML with a
`__WB_REVISION__` query added to the URL, which the browser cache has never seen, and the page shows
its update notice.

### Consequences

* Good, because repeat visits load every file from the browser without asking the server.
* Good, because the zone keeps one setting for all its sites.
* Bad, because a browser without the service worker, such as one that blocks service workers, can
  show a copy of the page up to 31 days old after a deploy.
* Neutral, because a reader with the service worker sees a new deploy on their next visit, through
  the update notice, as with any cache setting.

### Confirmation

The offline test "offers a reload when a new version is deployed, then shows it" in
`test/e2e/offline.spec.ts` serves the site with `cache-control: max-age=2678400` and checks that a
changed deploy still shows the update notice and then the new page. `curl -sI
https://html.fmartin.ch/` shows the header the live site sends.

## Pros and Cons of the Options

### Keep the zone's 31-day browser cache for every file

Nothing changes in Cloudflare: every file of the site gets the zone's Browser Cache TTL of 31 days.

* Good, because there's nothing to set up or keep in sync with the repository.
* Bad, because readers without the service worker can see an old copy for up to 31 days.

### A Cache Rule for html.fmartin.ch that keeps GitHub's 600 seconds

A Cache Rule in the Cloudflare dashboard matches the hostname and sets Browser TTL to "Respect
existing headers", so browsers keep each file for 10 minutes.

* Good, because every browser sees a deploy within 10 minutes.
* Bad, because the hashed files under `/_astro/`, which never change, are asked for again every 10
  minutes. martinfrancois tried it on 2026-10-29 and set the zone back.

### A Cache Rule that caches `/_astro/` for a long time and keeps GitHub's 600 seconds elsewhere

Two rules in the dashboard: a long Browser TTL for `/_astro/*`, whose file names change with their
content, and "Respect existing headers" for everything else.

* Good, because hashed files stay cached and the HTML is fresh within 10 minutes in every browser.
* Bad, because it adds two rules for this site alone, which a reader of the repository can't see,
  for a problem only browsers without the service worker have.

## More Information

martinfrancois decided on 2026-10-29 that the long cache doesn't matter for this page. The cache
headers were first reported in
[html-cheat-sheet issue #7](https://github.com/martinfrancois/html-cheat-sheet/issues/7). The
`__WB_REVISION__` query comes from `workbox-precaching`, which `scripts/build-service-worker.ts`
uses.

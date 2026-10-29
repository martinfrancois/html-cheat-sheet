---
status: accepted
date: 2026-10-28
decision-makers: [martinfrancois]
consulted: [implementing coding agent]
informed: [Future maintainers and agents working on this repository]
---

# Offline support with a service worker

## Context and Problem Statement

The old cheat sheet worked offline: every script, stylesheet, and font sat in the repository, and a
test checked that nothing loaded from the network. Since the rebuild
([ADR 0002](0002-build-the-cheat-sheet-with-astro-and-tailwind.md)), the page exists only after a
build, so a clone no longer gives an offline copy. A reference page is often needed where the
network is bad, such as on a train or in a workshop room. How should the page stay usable without a
network, and how does a reader get a new version once one is deployed?

## Decision Drivers

* After one visit, the page must load and work with no network, including Edit.
* A new deploy must reach readers. A cached copy must not hide it forever.
* The reader decides when the page reloads, so an update never jumps the page while they read.
* The page uses only Baseline widely available features.

## Considered Options

* A service worker that caches the page, with an update notice
* No offline support
* A downloadable copy of the built site

## Decision Outcome

Chosen option: "A service worker that caches the page, with an update notice", because it gives
every reader offline use after the first visit without any action on their part, and a service
worker can detect a new deploy and tell the reader.

The service worker caches the page, its scripts and styles, its fonts, and the editor chunk
([ADR 0004](0004-edit-examples-with-codemirror-6-loaded-on-demand.md)). When a new deploy is found,
the page shows an "Updated, reload" notice. The reader reloads when they choose, and the new version
replaces the cached one.

### Consequences

* Good, because the page works offline after one visit, as the old page did from a clone.
* Good, because `service-workers` is Baseline widely available since 2020-10-30 according to
  `web-features` 3.43.0.
* Bad, because a bug in the service worker can keep serving an old version. The update path needs
  its own test.
* Bad, because the first visit has to download everything the cache needs, including the editor
  chunk that the reader may never use.
* Neutral, because analytics events from offline visits are lost
  ([ADR 0013](0013-measure-usage-and-web-vitals-with-cookieless-posthog.md)).

### Confirmation

Playwright tests check two things. First, after one visit with the network cut off, a reload still
shows the page, search works, and Edit opens the editor. Second, after a new build is served, an
open page shows the "Updated, reload" notice, and a reload shows the new content.

## Pros and Cons of the Options

### A service worker that caches the page, with an update notice

A service worker registered by the page caches the files it needs. On each visit it checks for a new
version and, when it finds one, the page tells the reader.

* Good, because it works for every reader without setup.
* Good, because the reader controls when the update applies.
* Bad, because caching bugs are hard to see and need a dedicated test.

### No offline support

The page loads from the network every time, like most sites.

* Good, because there is no cache that can go stale.
* Bad, because the page stops working without a network, which the old page did not.

### A downloadable copy of the built site

Offer a zip of the built site that readers unpack and open.

* Good, because it works without a browser cache.
* Bad, because readers have to download it, unpack it, and remember to update it.
* Bad, because the built page links its files with root paths such as `/_astro/...`, which don't
  resolve from a `file://` page, so the copy would need a local web server.

## More Information

martinfrancois chose this option in the design interview on 2026-10-28.

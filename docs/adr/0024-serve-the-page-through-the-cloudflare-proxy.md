---
status: accepted
date: 2026-10-30
decision-makers: [martinfrancois]
consulted: [implementing coding agent]
informed: [Future maintainers and agents working on this repository]
---

# Serve the page through the Cloudflare proxy

## Context and Problem Statement

GitHub Pages publishes the site from the deploy workflow with the custom domain `html.fmartin.ch`.
The DNS record for that name in the fmartin.ch Cloudflare zone goes through the Cloudflare proxy, so
readers connect to Cloudflare, and Cloudflare fetches the page from GitHub.

Behind the proxy, GitHub has no HTTPS certificate of its own for the domain: on 2026-10-30
`gh api repos/martinfrancois/html-cheat-sheet/pages` returned no `https_certificate` and
`https_enforced: false`. Readers still get HTTPS, with Cloudflare's certificate (issued by Google
Trust Services), and a plain HTTP request gets a 301 to HTTPS. Should the record stay proxied, or
switch to DNS only so GitHub serves the page and its own certificate directly?

## Decision Drivers

* Readers get the page over HTTPS with a valid certificate.
* Settings that live only in a dashboard stay few, because a reader of the repository can't see
  them.
* The zone's settings stay the same for all its sites.

## Considered Options

* Keep the Cloudflare proxy
* Switch the record to DNS only

## Decision Outcome

Chosen option: "Keep the Cloudflare proxy", because readers already get HTTPS with a valid
certificate through it, and martinfrancois prefers it.

### Consequences

* Good, because nothing changes, and the page keeps Cloudflare's cache in front of GitHub.
* Bad, because the hop from Cloudflare to GitHub isn't authenticated. GitHub answers for
  `html.fmartin.ch` over HTTP, and over HTTPS only with its `*.github.io` certificate, which doesn't
  name the domain (both checked against 185.199.108.153 on 2026-10-30). So the SSL mode that
  applies to this hostname is Flexible or Full, not Full (strict), which would refuse that
  certificate. Under Flexible the hop isn't encrypted either; from outside the two can't be told
  apart.
* Bad, because the zone's settings apply to the page: Rocket Loader, see
  [ADR 0014](0014-opt-every-script-out-of-rocket-loader.md), the 31-day browser cache, see
  [ADR 0015](0015-keep-cloudflares-31-day-browser-cache.md), a `speculation-rules` header and
  Network Error Logging.
* Bad, because Cloudflare's edge caches the HTML and `sw.js` too, which it doesn't do by default,
  for up to GitHub's 600 seconds. After the deploy on 2026-10-29 at 23:02 UTC, the edge served the
  old page until 23:12, so readers, and the service worker's update check, see a deploy up to ten
  minutes late.
* Neutral, because GitHub's own "Enforce HTTPS" stays off. It needs GitHub's certificate, and
  Cloudflare redirects HTTP to HTTPS instead.

### Confirmation

* `curl -sI http://html.fmartin.ch/` returns 301 to `https://html.fmartin.ch/`.
* `openssl s_client -connect html.fmartin.ch:443 -servername html.fmartin.ch` shows a certificate
  for the domain that hasn't expired.
* `curl -sI https://html.fmartin.ch/` shows `server: cloudflare`.

## Pros and Cons of the Options

### Keep the Cloudflare proxy

The DNS record stays proxied. Cloudflare terminates HTTPS with its own certificate and fetches the
page from GitHub Pages.

* Good, because it needs no change in DNS or in the zone.
* Good, because Cloudflare caches the page at its edge, which takes load off GitHub Pages.
* Bad, because the hop from Cloudflare to GitHub isn't authenticated.
* Bad, because the page has to work around the zone's Rocket Loader and caches.
* Bad, because the zone's SSL mode, which decides how Cloudflare reaches GitHub, is a dashboard
  setting the repository can't show.

### Switch the record to DNS only

The record points at GitHub Pages without the proxy. GitHub issues a Let's Encrypt certificate for
the domain and serves the page directly.

* Good, because the whole path from reader to GitHub is authenticated.
* Good, because the zone's Rocket Loader and caches no longer apply, and a deploy reaches readers
  as soon as GitHub's own cache lets it.
* Bad, because the page loses Cloudflare's edge cache and anything else the zone adds.
* Bad, because it changes a DNS record in the shared fmartin.ch zone.

## More Information

[html-cheat-sheet issue #28](https://github.com/martinfrancois/html-cheat-sheet/issues/28) asked
for this decision.
[html-cheat-sheet issue #6](https://github.com/martinfrancois/html-cheat-sheet/issues/6) switched
GitHub Pages to the deploy workflow and the custom domain.

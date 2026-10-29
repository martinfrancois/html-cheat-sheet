---
status: accepted
date: 2026-10-29
decision-makers: [martinfrancois]
consulted: [implementing coding agent]
informed: [Future maintainers and agents working on this repository]
---

# Opt every script out of Rocket Loader

## Context and Problem Statement

Cloudflare sits in front of GitHub Pages for the fmartin.ch zone, and its Rocket Loader is on for
the zone. Rocket Loader rewrites every script so it runs after the first paint. On this page that
broke two scripts that must run before it: the theme script, so a saved dark theme flashed light
first, and the script that opens the index, so the index pushed the entries down. It also held back
the main module. With Rocket Loader, Lighthouse scored the live page 79 on desktop (CLS 0.461) and
94 to 95 on mobile, where the same build served without Cloudflare scores 100 and 99. martinfrancois
wants Rocket Loader to stay on for the rest of the zone. How should this page keep its scripts
running when they're written to run?

## Decision Drivers

* No theme flash and no layout shift while the page loads.
* Rocket Loader stays on for the zone, which martinfrancois's other sites use.
* The rule holds for any script added later, without anyone having to remember Cloudflare.
* No setting outside the repository that a reader of the code can't see.

## Considered Options

* Mark every script for Rocket Loader to skip, in the build where the source can't
* A Cloudflare Configuration Rule that turns Rocket Loader off for html.fmartin.ch
* Turning Rocket Loader off for the whole zone

## Decision Outcome

Chosen option: "Mark every script for Rocket Loader to skip, in the build where the source can't",
because it keeps Rocket Loader on for the zone, lives in the repository next to the
scripts it protects, and a test fails when a script misses it.

Cloudflare documents that Rocket Loader ignores a script with `data-cfasync="false"`, and that the
attribute must come before `src`. The two inline scripts carry it in `src/pages/index.astro`. The
main module is written by Astro, which stops bundling a `<script>` that has any attribute in its
source, so a small integration in `astro.config.ts` adds it to the built tag of every page. Astro
7 has no setting for attributes on its script tags, and no library does this, so the integration is
written here. It fails the build if it finds no module script to mark, which is what would happen
if Astro changed how it writes the tag.

### Consequences

* Good, because the page runs its scripts as written, behind Cloudflare or not.
* Good, because martinfrancois's other sites keep Rocket Loader.
* Bad, because the build edits its own output with a string replacement that depends on Astro
  writing `<script type="module" src=`. The build fails loudly when that changes.
* Bad, because Cloudflare still adds its own Rocket Loader script to the page, which then finds
  nothing to do.

### Confirmation

`test/e2e/page.spec.ts` checks that every script element on the built page carries
`data-cfasync="false"` before any `src`. After a deploy, the live HTML has no
`type="…-text/javascript"` or `type="…-module"` scripts, and Lighthouse against
https://html.fmartin.ch shows no layout shift.

## Pros and Cons of the Options

### Mark every script for Rocket Loader to skip, in the build where the source can't

Every script gets `data-cfasync="false"` before any `src`: in the page source where it can, and
from a build step for the module script Astro writes.

* Good, because it needs no change in Cloudflare.
* Good, because a test catches a script without it.
* Bad, because it needs about twenty lines of build code.

### A Cloudflare Configuration Rule that turns Rocket Loader off for html.fmartin.ch

A rule in the Cloudflare dashboard matches the hostname and switches Rocket Loader off for it only.

* Good, because it needs no code, and Cloudflare's script isn't added either.
* Bad, because the reason the page works lives only in a dashboard, and copying the site elsewhere
  behind Cloudflare brings the bug back without warning.

### Turning Rocket Loader off for the whole zone

The Speed settings of the fmartin.ch zone switch Rocket Loader off for every site in it.

* Good, because it needs no code and no rule.
* Bad, because martinfrancois wants Rocket Loader for the zone's other sites.

## More Information

martinfrancois asked on 2026-10-29 whether `data-cfasync="false"` would let Rocket Loader stay on.
Cloudflare's documentation:
[Ignore JavaScripts](https://developers.cloudflare.com/speed/optimization/content/rocket-loader/ignore-javascripts/).
The change and its measurements are in
[html-cheat-sheet pull request #11](https://github.com/martinfrancois/html-cheat-sheet/pull/11), part
of [html-cheat-sheet issue #7](https://github.com/martinfrancois/html-cheat-sheet/issues/7).

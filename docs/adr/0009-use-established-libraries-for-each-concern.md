---
status: accepted
date: 2026-10-28
decision-makers: [martinfrancois]
consulted: [implementing coding agent]
informed: [Future maintainers and agents working on this repository]
---

# Use established libraries for each concern

## Context and Problem Statement

The rebuilt cheat sheet needs a list of every HTML element, spec and MDN links, accessibility roles,
Baseline status, search, syntax highlighting, an editor, offline caching, analytics, and Markdown in
entry text. Each of these looks small enough to write by hand, and each hand-written version would
need its own fixes and updates. martinfrancois set the rule on 2026-10-28: "please follow best
practices and dont hand roll things for which there are well maintained and popular libraries".
Which library covers each concern, and when is code written here allowed?

## Decision Drivers

* martinfrancois's rule: no hand-written code where a well-maintained, popular library exists.
* Data about HTML must track the specs, so it must come from a source that updates when they do.
* Renovate merges updates on its own, so a library update reaches the page without extra work
  ([ADR 0008](0008-automerge-every-dependency-update-that-passes-ci.md)).
* A library must allow bundling into this MIT project and support the Astro version in use.
* Where martinfrancois's other projects already solved a concern, the same library keeps his
  projects alike.
* martinfrancois's selection bar: at least 100 GitHub stars and a release within the last 12 months,
  with exceptions where worth it, each recorded with its reason.

## Considered Options

* An established library for each concern, hand-written code only with a recorded reason
* Hand-written helpers wherever the job looks small

## Decision Outcome

Chosen option: "An established library for each concern, hand-written code only with a recorded
reason", because a maintained library carries its own fixes and spec updates, and Renovate brings
them in. Code written here would need the same work done by hand.

The choices, as of 2026-10-28:

* **Element list and spec links.** `@webref/elements`, the W3C's curated extract of the HTML
  standard, updated by Renovate. `scripts/sync-spec.ts` still reads section numbers, chapter titles,
  the suggested browser stylesheet (for default display), and the global attribute index from the
  WHATWG standard itself, because no package publishes them.
* **MDN links.** `__compat.mdn_url` from `@mdn/browser-compat-data`, not URLs built by hand. Its
  list of global attributes is not used for coverage, because it also lists attributes from other
  specs: `part`, `exportparts`, `elementtiming`, `anchor`, `virtualkeyboardpolicy`, and
  `containertiming`.
* **Accessibility roles.** Parsed from the HTML-AAM spec by `scripts/sync-spec.ts`. `aria-query`,
  the common package for this, was rejected: its last release, 5.3.2 from 2024-09-20, maps `<hgroup>`
  to `generic`, where HTML-AAM now says `group`.
* **Baseline status.** `web-features`, the data behind Baseline itself.
* **Share of visitors who can use a feature.** `browserslist` sums `caniuse-lite`'s worldwide
  browser usage for the browser versions that `@mdn/browser-compat-data` says support the feature.
  caniuse's own feature list was not used on its own, because it has no entry for most HTML
  attributes and input types, such as `type="month"` or `commandfor`. The badge links to the
  feature's page on webstatus.dev, which shows each browser's support.
* **Search.** `@leeoniya/ufuzzy`, see [ADR 0010](0010-search-with-ufuzzy.md).
* **Syntax highlighting.** Shiki through Astro's `<Code>` component, at build time, with one custom
  theme whose colors are CSS variables shared with the editor. Shiki comes with Astro and ships no
  JavaScript to the page. It is also a direct dev dependency, at the version Astro uses, for the
  transformer types in `src/lib/code-theme.ts`, and `axe-core` is one for the result type the
  accessibility test reads.
* **Editor.** CodeMirror 6, see [ADR 0004](0004-edit-examples-with-codemirror-6-loaded-on-demand.md).
* **Offline.** `workbox-build` (`generateSW`, run by `scripts/build-service-worker.ts` after
  `astro build`) writes the service worker, and `workbox-window` registers it and drives the update
  notice ([ADR 0006](0006-offline-support-with-a-service-worker.md)). `@vite-pwa/astro` was rejected
  because its peer range, as of version 1.2.0, stops at Astro 5 and the project is on Astro 7.
* **Analytics.** `posthog-js`, see
  [ADR 0013](0013-measure-usage-and-web-vitals-with-cookieless-posthog.md).
* **Markdown in entry text.** `marked`, with `parseInline` for the inline code, emphasis, and links
  that entry fields allow.
* **HTML parsing in scripts.** `node-html-parser`, which the old link check already used.
* **Serving a build in tests.** Vite's preview server, which Astro already builds with, serves a
  copy of the build for the offline update test. `vite` is a direct dev dependency for that.
  `sirv` was dropped: its latest release, 3.0.2, is from 2025-09-03, outside the 12-month bar, and
  Vite already does the job.

On 2026-10-28 every direct dependency met the selection bar except `@leeoniya/ufuzzy`, whose
exception is in [ADR 0010](0010-search-with-ufuzzy.md). Packages from a larger project count by
that project: the `@codemirror/*` and `@lezer/*` packages by `codemirror/dev`, and the
`@fontsource-variable/*` fonts by `fontsource/font-files`.

Two parts are written here on purpose:

* The live output frame's automatic height, about ten lines of `postMessage` and `ResizeObserver`
  in `src/scripts/frame-document.ts`. The established library for this, `iframe-resizer` (version
  5.5.9), is licensed GPL-3.0, which this MIT project can't bundle.
* The layout of example code, about 100 lines in `src/lib/format-example.ts`. Prettier 3.9.10 was
  tried on 2026-10-29. By default it keeps every space exactly, so where an inline element doesn't
  fit it moves a tag's `>` to the next line (`</a` then `>` alone, `<label` then `>Meeting`), and it
  writes `/>` on void elements. Readers copy these examples to learn HTML from them. With
  `--html-whitespace-sensitivity ignore` the layout is clean but the rendering changes:
  `A<b>bold</b>word` becomes three words, and a comma after `</em>` gets a space before it.

### Consequences

* Good, because spec changes reach the page through package updates, not edits by hand.
* Good, because search behaves like the search on martinfrancois's website, with the same library
  and setting.
* Bad, because the project has more dependencies, and each one can break on update. The test suite
  is the gate for that ([ADR 0008](0008-automerge-every-dependency-update-that-passes-ci.md)).
* Bad, because three facts still come from scraping the standard's HTML, which breaks if its layout
  changes. `scripts/sync-spec.ts` stops with an error when it parses fewer than 100 roles or 20 global
  attributes.

### Confirmation

`package.json` lists each library named above. `docs/agents/libraries.md` lists the current
exceptions to the selection bar, and each one has its reason in an ADR. `scripts/sync-spec.ts` names its source for each
fact in its opening comment. `src/scripts/frame-document.ts` has a comment that names `iframe-resizer`
and its license. `docs/agents/libraries.md` holds the rule for future choices, and review checks new
code against it.

## Pros and Cons of the Options

### An established library for each concern, hand-written code only with a recorded reason

Each concern uses a maintained, popular library. Code written here is allowed only when no library
fits, with the reason in a comment and in this record.

* Good, because maintenance of each concern lies with people who work on it full time.
* Good, because a hand-written exception is visible and can be revisited when its reason changes.
* Bad, because every library is one more update to absorb.

### Hand-written helpers wherever the job looks small

Write the element list, MDN URLs, search matching, and service worker as small helpers in this
repository.

* Good, because the project has fewer dependencies.
* Bad, because hand-built MDN URLs break when MDN moves a page, while `mdn_url` is updated with it.
* Bad, because a hand-written element list or role table goes stale when the specs change, and
  nothing tells anyone.
* Bad, because cache invalidation and fuzzy matching are easy to get subtly wrong.

## More Information

martinfrancois stated the rule on 2026-10-28 during the rebuild. Peer ranges, release dates, and
licenses above were read from the npm registry on 2026-10-28. Revisit the `iframe-resizer` exception
if it changes its license, and the `@vite-pwa/astro` rejection if its peer range reaches the Astro
major in use.

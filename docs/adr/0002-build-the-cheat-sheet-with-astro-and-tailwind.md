---
status: accepted
date: 2026-10-28
decision-makers: [martinfrancois]
consulted: [implementing coding agent]
informed: [Future maintainers and agents working on this repository]
---

# Build the cheat sheet with Astro and Tailwind

## Context and Problem Statement

The cheat sheet was one hand-written `index.html`: a table with jQuery, Materialize, CodeMirror 5,
and normalize.css vendored next to it. Anyone could clone it and open the file with a double-click.
Every example was written twice, once escaped for the code cell and once raw for the output cell,
and the two copies drifted. The `<pre>` row showed `<pre>` in its code cell, but its output cell
held `This is<br>an example.`, which is not a `<pre>` at all.

The rebuild covers every element in the WHATWG HTML Living Standard (113, plus `svg` and `math`),
every global attribute, and the obsolete elements, each as a card with several fields and an example.
That is a few hundred examples. How should the page be produced so that each example exists once and
a missing field is caught before it ships?

## Decision Drivers

* Each example must be written once and shown both as code and as live output.
* A missing or empty field in an entry must fail before deploy, not show up as a blank card.
* The element list, chapters, and spec links must come from the standard, not be typed by hand.
* The editor and the analytics code load only when needed, so the page needs a bundler that splits
  code.
* Styles must stay maintainable across a few hundred cards in a light and a dark theme.

## Considered Options

* Astro with Tailwind, entries as YAML in a content collection
* Keep one hand-edited `index.html` with no build step
* Eleventy with Tailwind

## Decision Outcome

Chosen option: "Astro with Tailwind, entries as YAML in a content collection", because Astro's
content collections check every entry against a schema at build time, its Vite bundler splits the
editor into a chunk loaded on demand, and it ships no JavaScript to the page unless a component asks
for it.

Each entry is a YAML file under `src/content/entries/` that holds its example once. The schema in
`src/content.config.ts` fails the build when a field is missing. `scripts/sync-spec.ts` regenerates
`src/data/spec.json` from the standard: elements, chapters, global attributes, and obsolete elements.

### Consequences

* Good, because an example can't drift from its output: both come from the same `code` field.
* Good, because `pnpm run build` fails on an entry that breaks the schema, and a test fails when an
  element in `spec.json` has no entry.
* Good, because Tailwind keeps styles next to the markup and the theme colors in one set of tokens.
* Bad, because the page no longer opens from a clone with a double-click. Viewing it locally needs
  `pnpm install && pnpm run build` or `pnpm run dev`.
* Bad, because the project now depends on Node 24 and a few dozen npm packages, which Renovate keeps
  up to date ([ADR 0008](0008-automerge-every-dependency-update-that-passes-ci.md)).
* Neutral, because the site deploys to GitHub Pages through a GitHub Actions workflow instead of
  serving files from the branch.

### Confirmation

`package.json` has `astro` and `tailwindcss` as dependencies. `src/content.config.ts` defines the
`entries` collection with a schema. `pnpm run build` fails when a required field is removed from any
entry. The README tells readers to build or run the dev server, not to open a file.

## Pros and Cons of the Options

### Astro with Tailwind, entries as YAML in a content collection

Astro renders `.astro` components to static HTML at build time. A content collection loads every
YAML file under `src/content/entries/` and validates it with a Zod schema. Tailwind 4 runs as a Vite
plugin.

* Good, because schema validation is built in and its errors name the file and the field.
* Good, because client code goes through Vite, which splits dynamic imports into their own chunks.
* Good, because the output is static files that GitHub Pages can serve.
* Bad, because a major Astro version can change the content collection API, as Astro 5 did when it
  moved collections to loaders.

### Keep one hand-edited `index.html` with no build step

Write every card by hand in one HTML file, as before, and vendor any library next to it.

* Good, because the page opens from a clone with a double-click and needs no toolchain.
* Bad, because every example has to be written twice, escaped and raw, which is the drift this
  rebuild exists to fix.
* Bad, because nothing checks that a few hundred cards each have every field.
* Bad, because the element list would have to be typed and kept in sync with the standard by hand.

### Eleventy with Tailwind

Eleventy reads YAML data files and renders templates to static HTML. Tailwind runs through its CLI.

* Good, because Eleventy is small and reads YAML data without a plugin.
* Bad, because it has no schema validation for data files, so a missing field needs a hand-written
  check.
* Bad, because it does not bundle client JavaScript, so splitting the editor into a lazy chunk needs
  a separate bundler set up next to it.

## More Information

The owner chose this option in the design interview on 2026-10-28, over keeping the hand-edited
file. The old page is in the git history before this change; its `<pre>` row is the drift example
above.

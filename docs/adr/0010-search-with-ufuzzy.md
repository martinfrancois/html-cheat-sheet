---
status: accepted
date: 2026-10-28
decision-makers: [martinfrancois]
consulted: [implementing coding agent]
informed: [Future maintainers and agents working on this repository]
---

# Search with uFuzzy

## Context and Problem Statement

The page has a pinned search box that filters the entries as the reader types. Readers type element
names, attribute names, and words from summaries, often with a typo. The owner's website, fmartin.ch,
already has an event search built on `@leeoniya/ufuzzy` with `intraMode: 1`, and the owner likes how
it behaves. Which search library should the cheat sheet use?

## Decision Drivers

* A typo in a word must still find the entry.
* Results must update on every keystroke on a phone.
* Search should behave the same as on the owner's website.
* An established, maintained library, per [ADR 0009](0009-use-established-libraries-for-each-concern.md).

## Considered Options

* uFuzzy with `intraMode: 1`
* Fuse.js
* MiniSearch

## Decision Outcome

Chosen option: "uFuzzy with `intraMode: 1`", because it is the library and setting the owner already
uses and likes on his website, and `intraMode: 1` allows one typo per word, which is what readers of
a cheat sheet make.

`src/scripts/search.ts` builds a `uFuzzy` instance with `intraMode: 1` and filters each entry's
element names, attribute names, and text with it. Every word of the query must match, in any order,
so "dialgo" still finds `<dialog>`.

### Consequences

* Good, because search on the cheat sheet and on the owner's website behaves the same way.
* Good, because uFuzzy runs in the browser with no index to build or download.
* Bad, because uFuzzy is an exception to the owner's library bar (at least 100 GitHub stars and a
  release within 12 months, see `docs/agents/libraries.md`). On 2026-10-28 it had 3040 stars, but
  its latest release, 1.0.19, was from 2025-08-22, 14 months earlier. Its repository still gets
  commits, the latest on 2026-09-08. It is kept because the owner chose it, it is small and stable,
  and his website uses it.
* Bad, because uFuzzy matches text, not meaning, so a search for "bold" finds `<b>` only through
  words in its entry.

### Confirmation

`package.json` lists `@leeoniya/ufuzzy`. `src/scripts/search.ts` creates it with `intraMode: 1`. A
Playwright test types a search term with one typo and checks that the matching entry stays visible.

## Pros and Cons of the Options

### uFuzzy with `intraMode: 1`

`@leeoniya/ufuzzy` filters a list of strings in the browser. `intraMode: 1` allows one substitution,
insertion, deletion, or transposition inside each search word.

* Good, because it is already in use on the owner's website, with the same setting.
* Good, because it filters a few hundred entries with no index.
* Neutral, because its API returns indexes and ranges, so the page maps results back to entries.

### Fuse.js

A fuzzy search library that scores every item against the query.

* Good, because it is widely used.
* Bad, because it differs from the library the owner chose for his website. It was tried first on
  this page and replaced with uFuzzy for that reason.

### MiniSearch

A full-text search library that builds an inverted index, with prefix and fuzzy matching.

* Good, because it supports prefix and fuzzy matching with per-field weights.
* Bad, because it differs from the owner's website, and an index is more than a few hundred short
  entries need.

## More Information

The owner chose uFuzzy on 2026-10-28, after Fuse.js had been tried first.

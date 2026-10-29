# Libraries

## Scope

Choosing between a library and code written here, for any concern: parsing, search, highlighting,
offline caching, analytics, editing. Version pins and updates are in [Dependencies](dependencies.md).
The current choice for each concern is in
[ADR 0009](../adr/0009-use-established-libraries-for-each-concern.md).

## Rules

This is a standing rule from the owner: "please follow best practices and dont hand roll things for
which there are well maintained and popular libraries".

- For a solved problem, use a well-maintained, popular library instead of writing it here. Check
  recent releases, open issues, weekly downloads, and the license.
- Before picking one, check what the owner's other projects use for the same concern, where you
  can see them. The owner's website, fmartin.ch, is the model for search. Prefer the library he
  already uses unless it doesn't fit here, and say why when it doesn't. Never name a private
  repository in this public one.
- The license must allow bundling into this MIT project. GPL code can't be bundled.
- Use the library's own data instead of rebuilding it. For example, take MDN links from
  `__compat.mdn_url` in `@mdn/browser-compat-data`, never by joining URL parts.
- Write code here only with a stated reason: no maintained library exists, or the library can't be
  used (license, peer range, size). Put a one-line comment next to the code that names the library
  and why it isn't used, and record the decision in an ADR.
- When a library lags the spec it is supposed to reflect, read the spec directly and say so in a
  comment, as `scripts/sync-spec.ts` does for HTML-AAM roles.
- Recheck a hand-rolled part when the reason changes, such as a library relicensing or widening its
  peer range.

## Selection bar

The owner's bar for any library, direct or dev dependency: "at least 100 stars on github and a
release within the last year". Exceptions are allowed "where it's worth it".

- Check the stars with `gh api repos/<owner>/<repo> -q .stargazers_count`.
- Check the release date with `pnpm view <pkg> time --json`: the date of the latest version must be
  within the last 12 months.
- A package from a larger project's monorepo or GitHub organization counts by that project. The
  `@codemirror/*` and `@lezer/*` packages have their own repositories with 32 to 41 stars each, but
  belong to CodeMirror, whose main repository `codemirror/dev` had 7808 stars and a release in
  October 2026.
- Record every exception with its reason in ADR 0009 or in the concern's own ADR, and list it below,
  so a reviewer can tell an exception from an oversight.
- Recheck the bar when you add a dependency and when a review touches the dependency list.

Current exceptions, checked on 2026-10-28:

- `@leeoniya/ufuzzy`: 3040 stars, but its latest release, 1.0.19, is from 2025-08-22. Kept because
  the owner chose it, it is small and stable, and the owner's website uses it. See
  [ADR 0010](../adr/0010-search-with-ufuzzy.md).
- Hand-written: the live output frame's height (`iframe-resizer` is GPL-3.0) and the layout of
  example code (Prettier either hangs `>` on the next line or changes what renders). See
  [ADR 0009](../adr/0009-use-established-libraries-for-each-concern.md).

## Enforcement

Review checks each new file for logic that a dependency already in `package.json`, or a common
library, provides, and checks each new or changed dependency against the selection bar. A new library or a hand-rolled replacement needs an entry in ADR 0009 or a new
ADR, which `test/adr.test.ts` checks for shape.

## References

- [Dependencies](dependencies.md)
- [Design decisions](design-decisions.md)

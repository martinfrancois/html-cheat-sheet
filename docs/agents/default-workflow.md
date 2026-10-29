# Default workflow

## Scope

What to read, run, and check for every change, and how a change reaches `main`. Test layers live in
[Testing](testing.md); entry content rules live in [Content entries](content-entries.md).

## Before changing anything

1. Run `git status` and leave unrelated work alone.
2. Read the files you will change, the topic page under `docs/agents/` that owns them, and any
   record in `docs/adr/` that covers them.
3. For a reported bug, reproduce it in a browser or a failing test before changing code.

## Making the change

- Keep one change about one thing. Don't mix a dependency update, a reformat, or an unrelated fix
  into it.
- Write all code, scripts, and tests in TypeScript, never plain JavaScript. Node 24 runs `.ts` files
  directly by stripping types, so use only erasable syntax: no `enum`, no `namespace`, no
  constructor parameter properties. Import local files with their `.ts` extension. `pnpm run check`
  type-checks everything.
- Check [Libraries](libraries.md) before writing code for a problem a library may already solve.
- The page itself may use a web feature once it has been Baseline newly available for six months,
  see [ADR 0016](../adr/0016-use-web-features-six-months-after-they-become-baseline.md). Before
  using one, look up its `status.baseline_low_date` in the `web-features` package, for a single
  CSS value through `status.by_compat_key`. `usableSince()` in `test/page-features.ts` turns that
  into the date. The rule is for the page's own code; examples may show any feature, with a badge.
- A choice among several plausible approaches gets an ADR, see [Design decisions](design-decisions.md).
- Change `src/data/spec.json` only through `pnpm run sync-spec`. Read the diff it produces: a new
  element in the standard needs a new entry.

## Verifying

Run these before every push:

```sh
pnpm run check
pnpm test
pnpm run build
```

Then run the Playwright tests in the container, as [Testing](testing.md) describes. CI runs the same
commands.

Look at the result in a browser for any change to the page, an entry, or styles. Run
`pnpm run build && pnpm run preview`, open the printed URL, and check:

- every screen, as [Visual design](visual-design.md#visual-review-before-showing-a-change)
  describes, for a change to layout or styles;
- the changed entry or component in the light and the dark theme;
- the page at 320 CSS px wide (the browser's responsive mode) with no sideways scrolling;
- the page at 200% zoom;
- keyboard only: every control reachable with Tab and showing a visible focus ring.

A test that could not run is not a pass. Say which command did not run, why, and what you checked
instead.

## Commits and pull requests

- Write the commit subject as a plain imperative sentence, such as "Bundle Roboto Mono for offline
  code cells". No Conventional Commits prefix, no AI attribution trailers.
- Keep each commit understandable on its own, with its tests and docs in the same commit.
- Read `git diff --cached --stat` before committing and account for every file in it.
- Changes reach `main` through a pull request. Merge it by rebase so `main` fast-forwards. Never
  squash and never create a merge commit.
- Don't force-push `main`. Force-push a feature branch only with `--force-with-lease`.

## References

- [Testing](testing.md)
- [Content entries](content-entries.md)
- [Accessibility](accessibility.md)
- [Design decisions](design-decisions.md)
- [Writing style](writing-style.md)

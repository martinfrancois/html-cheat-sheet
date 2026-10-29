# Testing

## Scope

The test layers, what each one catches, how to run it, and how to update visual snapshots. These
tests are the gate that lets Renovate merge every dependency update on its own
([ADR 0008](../adr/0008-automerge-every-dependency-update-that-passes-ci.md)), so a gap in them is
a gap in what reaches the live site unreviewed.

## Layers

| Layer | Catches | Run |
| --- | --- | --- |
| Unit tests (`test/*.test.ts`) | Broken data files, a spec element with no entry, ADR records that leave the MADR shape | `pnpm test` |
| Type check | Type errors in `.astro`, `.ts`, and test files | `pnpm run check` |
| Build with content schema | An entry with a missing or empty field | `pnpm run build` |
| Playwright end-to-end | Search, theme toggle, Edit and Reset, live output, offline use, and the service worker replacing an old copy | Playwright container, see below |
| axe-core | WCAG 2.2 AA violations and AAA contrast, in both themes | Part of the Playwright run |
| Examples (`test/e2e/examples.spec.ts`) | An example whose image doesn't load, whose `<iframe>` has no title, or whose markup breaks WCAG 2.2 AA | Part of the Playwright run, Chromium only |
| Visual snapshots | Any change in how the page renders, light and dark, at phone and desktop widths | Part of the Playwright run |

Unit tests use `node:test` and `node:assert/strict`, written in TypeScript and run by Node directly.
Don't add a test framework.

## The Playwright container

Run the Playwright tests in the official Playwright image whose tag matches the `@playwright/test`
version in `package.json`, such as `mcr.microsoft.com/playwright:v1.64.1-noble` for 1.64.1. CI uses
the same image. Fonts and browser builds differ between machines, so a snapshot taken outside the
image will not match.

- Install Docker or Podman, run `pnpm install` on your machine, then `pnpm run test:e2e`.
  `scripts/playwright.sh` starts the matching image with the checkout mounted and runs the tests
  from `node_modules/.bin`, so the container needs no pnpm of its own.
- Don't max out the machine. The script runs the browsers at the lowest CPU priority with 2
  workers; check the load (`uptime`) before starting a run, run one suite at a time on a shared
  machine, and set `PLAYWRIGHT_WORKERS` higher only when it is idle.
- Every change runs in Chromium, Firefox and WebKit. `pnpm run test:e2e --project=chromium` is
  fine for quick feedback while you work, but run all three before a pull request.
- The examples spec and the visual snapshots run in Chromium only: the example markup is the same
  in every browser, and snapshots of three engines would triple the images to review.
- The layout shift tests in `test/e2e/page.spec.ts` run in Chromium only, the one engine that
  reports layout shifts. They measure with the image's system fonts, Liberation Sans and Liberation
  Mono, so they check the sized fallback for those two fonts only.
- An earlier sample run saw WebKit's page process (`WPEWebProcess`) abort near the end of a full
  three-browser run, failing the last WebKit tests with "Target page, context or browser has been
  closed". Two full runs with every entry didn't reproduce it. If it comes back, run WebKit alone
  to tell a crash from a page bug.
- Renovate updates the image tag and the npm package together. Never change one without the other.
- Running `pnpm exec playwright test` directly on your machine is fine for a quick check of behavior, but
  ignore its snapshot results.

## Writing tests

- Find elements by role and accessible name (`getByRole`, `getByLabel`), not by CSS class. A test
  that finds the search box by its label also checks that the label exists.
- Wait for a condition, never for a fixed time.
- A new user-visible feature needs an end-to-end test of its main path.
- A fixed bug needs a test that fails without the fix.
- Entries off screen aren't drawn (`content-visibility: auto`, ADR 0018) and measure zero until
  they are. A test that measures or checks every entry calls `layOutEveryEntry` from
  `test/e2e/helpers.ts` first, or it passes without looking at them.

## Checking each example

`test/e2e/examples.spec.ts` checks every example on its own: it serves the document the live output
frame would show from the site's origin, so relative image paths load, then checks the images, the
`<iframe>` titles, and runs axe. One axe run over the whole page and its 200 frames takes minutes.

- axe leaves out `<iframe>` elements inside an example, because it waits forever on one sandboxed
  without scripts; the test checks their one rule, a title, itself.
- `color-contrast` and `target-size` are off there: live output shows the browser's default colors
  and control sizes, which WCAG exempts as the user agent's.

## Performance

martinfrancois wants Lighthouse scores of 100 in every category, as long as reaching them costs the
reader nothing. Keep a performance change only when a measurement shows it helps, and record what
you measured; [ADR 0012](../adr/0012-create-live-output-frames-near-the-screen.md) and
[ADR 0018](../adr/0018-skip-rendering-entries-off-screen.md) have the current numbers and the
changes that were tried and dropped.

- Measure the built page (`pnpm run build`), served with gzip like GitHub Pages, never the dev
  server. Run Lighthouse's mobile and desktop presets at least three times each: single runs vary
  by a point or two.
- On mobile, first and largest contentful paint follow the compressed size of the HTML, so watch
  what a change adds to every entry.

## Updating snapshots

A failing snapshot test means the page now renders differently. Find out why before you touch the
snapshots.

1. Open the Playwright report and look at the expected, actual, and diff images of every failing
   snapshot.
2. Decide whether each change is intended. A dependency update that moves text by a pixel can be
   fine; a lost focus ring or a changed color is a bug.
3. Only then update them inside the container with `pnpm run test:e2e --update-snapshots`.
4. Say in the pull request which snapshots changed and why the change is expected.

An entry snapshot taller than the viewport grows the viewport first: Chromium captures the part
outside the viewport with its live output frames blank and its masks missing.

An update that rewrites snapshots without a stated reason hides exactly the regression the snapshots
exist to catch. Don't merge it.

## References

- [Default workflow](default-workflow.md)
- [Accessibility](accessibility.md)
- [Dependencies](dependencies.md)

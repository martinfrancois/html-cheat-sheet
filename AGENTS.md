# Working on html-cheat-sheet

A one-page reference of every element and global attribute in the WHATWG HTML Living Standard, built
with Astro and Tailwind and published at https://html.fmartin.ch.

`SPEC.md` says what the page must show and do; the code, tests, and docs follow it. Read
`CONTEXT.md` for the terms the project uses (entry, chapter, live output, comparison) and
`docs/adr/` before changing anything a record covers. Before starting any task, read
[Default workflow](docs/agents/default-workflow.md).

## Commands

- `pnpm install` installs the exact versions in `pnpm-lock.yaml`. Node 24, see `.nvmrc`; the pnpm
  version is the `packageManager` field in `package.json`.
- `pnpm run dev` serves the page with live reload. Opening a file from the checkout no longer works;
  the page only exists after a build.
- `pnpm run build` writes the site to `dist/` and fails when an entry breaks the content schema.
- `pnpm run check` type-checks the project with `astro check`.
- `pnpm test` runs the unit tests with `node --test`. `pnpm run test:e2e` runs the Playwright tests;
  run them in the Playwright container, see [Testing](docs/agents/testing.md).
- `pnpm run sync-spec` regenerates `src/data/spec.json` from the HTML standard.

## Rules for every task

- Use pnpm for every install and script, never npm or yarn. See
  [ADR 0011](docs/adr/0011-manage-packages-with-pnpm.md).
- All code, scripts, and tests are TypeScript. Node 24 runs scripts and tests directly, so use only
  erasable syntax.
- Use a well-maintained, popular library for a solved problem instead of writing it here. See
  [Libraries](docs/agents/libraries.md) before adding code or a dependency.
- The page follows WCAG 2.2 AA, with AAA contrast and text presentation, in both themes. See
  [Accessibility](docs/agents/accessibility.md).
- Group the layout by the Gestalt laws: related things close, same things alike. Look at every
  screen before showing a change. See [Visual design](docs/agents/visual-design.md).
- Take every fact about HTML from the spec, HTML-AAM, `web-features`, or MDN, never from memory.
- Read the `SPEC.md` sections a change touches. When the owner adds or changes a requirement,
  update `SPEC.md` in the same change; list what isn't built yet under "Not done yet". Before
  finishing, check that every changed requirement is built and tested or listed there, and that
  every changed behavior is in `SPEC.md`. See [Specification](docs/agents/specification.md).
- When a user corrects a repeatable mistake or states a useful repository preference, update the
  relevant page under `docs/agents/` in the same change. Keep this file short.

## Agent skills

- [Issue tracker](docs/agents/issue-tracker.md): GitHub Issues through the `gh` CLI
- [Triage labels](docs/agents/triage-labels.md): the five default triage labels
- [Domain docs](docs/agents/domain.md): single context, `CONTEXT.md` and `docs/adr/` at the root

## Detailed instructions

- [Default workflow](docs/agents/default-workflow.md): build, verify in a browser, commits, pull
  requests
- [Content entries](docs/agents/content-entries.md): writing an entry and where each fact comes from
- [Testing](docs/agents/testing.md): what each test layer catches, the Playwright container,
  updating snapshots
- [Accessibility](docs/agents/accessibility.md): the WCAG rule with its numbers
- [Visual design](docs/agents/visual-design.md): grouping, icons and controls, the visual review
- [Writing style](docs/agents/writing-style.md): page copy, docs, commit messages, naming people
- [Libraries](docs/agents/libraries.md): library over hand-written code, and the exceptions
- [Dependencies](docs/agents/dependencies.md): pins, cooldown, Renovate automerge
- [Specification](docs/agents/specification.md): what `SPEC.md` holds and when to update it
- [Design decisions](docs/agents/design-decisions.md): when and how to write an ADR
- [Maintaining agent docs](docs/agents/maintaining-agent-docs.md): what goes here and what goes in
  a topic page

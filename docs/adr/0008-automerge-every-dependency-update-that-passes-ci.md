---
status: accepted
date: 2026-10-28
decision-makers: [martinfrancois]
consulted: [implementing coding agent]
informed: [Future maintainers and agents working on this repository]
---

# Automerge every dependency update that passes CI

## Context and Problem Statement

The rebuild ([ADR 0002](0002-build-the-cheat-sheet-with-astro-and-tailwind.md)) brings Astro,
Tailwind, CodeMirror, Playwright, `web-features`, fonts, Node, and GitHub Actions, and Renovate opens
a pull request for each update. The earlier `renovate.json` merged minor and patch updates on its own
but held every major update and every Node update for a manual merge. The owner usually decides
breaking dependency updates himself. For this repository he wants to stop: "we should be confident
enough to merge any dependency update automatically that passes tests on CI no matter if major minor
or patch without worrying we break it." Should updates merge on their own, and what has to be true of
the tests for that to be safe?

## Decision Drivers

* A small site with one maintainer should not need someone to read every update.
* A broken update must not reach the live page.
* The test suite has to catch what a reviewer would have caught: build errors, broken behavior,
  accessibility regressions, and changes in how the page looks.
* Screenshot tests must give the same pixels on every machine, or they can't block anything.
* The repository is public, so CI runs on every Renovate pull request.

## Considered Options

* Automerge every update that passes CI
* Automerge non-major updates, merge majors by hand
* Merge every update by hand

## Decision Outcome

Chosen option: "Automerge every update that passes CI", because the tests are the gate in this
repository, and a test suite that catches a broken major update protects the page better than a
reviewer skimming release notes.

Renovate merges every update once CI passes: major, minor, and patch, npm packages, Node, GitHub
Actions, and the Playwright container image. The 7-day minimum release age still applies, and
security fixes still skip it. The gate is the whole suite:

* unit tests with `node --test`;
* the build, including the content collection schema;
* `astro check`;
* Playwright end-to-end tests of search, the theme toggle, Edit and Reset, live output, and offline
  use with the service worker update;
* axe-core accessibility checks in both themes;
* Playwright visual snapshots of the page in light and dark, at phone and desktop widths.

The Playwright tests run inside the official Playwright container image whose tag matches the
`@playwright/test` version, in CI and locally with Docker or Podman, so snapshots are pixel-stable
across machines. Renovate updates the image tag and the npm package in the same pull request.

When an update changes rendering, the snapshot test fails and the pull request waits. Whoever updates
the snapshots must look at the diff images first and say in the pull request why the change is
expected.

### Consequences

* Good, because an update reaches `main` as soon as CI passes, without waiting for a person.
* Good, because every missed regression points at a missing test, which then gets added.
* Bad, because a regression the tests don't cover reaches the live site without anyone seeing it
  first.
* Bad, because the suite has to be kept strong enough to deserve the trust: a skipped or weakened
  test now lowers the bar for every future update.
* Neutral, because rendering changes, which updates to fonts, Tailwind, or browsers can cause, still
  wait for a person to read the snapshot diff.

### Confirmation

`renovate.json` turns on automerge for every update type, with no rule that holds back majors or
Node. The CI workflow runs the unit tests, `astro check`, the build, and the Playwright suite in the
container image, and the branch protection on `main` requires those jobs to pass. A Renovate pull
request that bumps `@playwright/test` also bumps the image tag. `docs/agents/testing.md` describes
each layer and the snapshot update rule.

## Pros and Cons of the Options

### Automerge every update that passes CI

Renovate merges any update by itself once every required CI job passes.

* Good, because no update waits for a person unless a test fails.
* Good, because it puts the effort into tests, which keep paying off, instead of into reviews.
* Bad, because the suite's gaps become the site's gaps.

### Automerge non-major updates, merge majors by hand

Renovate merges minor and patch updates on its own and labels major and Node updates for a person
to merge. This is what `renovate.json` did before this decision.

* Good, because a person reads the migration guide before a major version lands.
* Bad, because major updates pile up when no one has time, and a pile of majors is harder to merge
  than one at a time.
* Bad, because a reviewer reading release notes catches less than a test that runs the page.

### Merge every update by hand

Renovate opens pull requests and a person merges each one.

* Good, because nothing reaches the site unseen.
* Bad, because it costs the owner time on every update, including the many that change nothing
  visible.

## More Information

The owner made this decision on 2026-10-28, after the design interview. It is a deliberate exception
to his usual practice of deciding breaking dependency updates himself: in this repository the tests
are the gate. If an update breaks the live site despite passing CI, add the test that would have
caught it, then fix the update.

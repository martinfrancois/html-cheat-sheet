---
status: accepted
date: 2026-10-28
decision-makers: [martinfrancois]
consulted: [implementing coding agent]
informed: [Future maintainers and agents working on this repository]
---

# Manage packages with pnpm

## Context and Problem Statement

The makeover added a build step and a few dozen packages, first installed with npm. The owner uses
pnpm on his other JavaScript repositories and wants it wherever it can work. Which package manager
should install the dependencies and run the scripts?

## Decision Drivers

* The same package manager as the owner's other repositories, so commands and settings carry over.
* The 7-day wait for new releases ([ADR 0008](0008-automerge-every-dependency-update-that-passes-ci.md))
  must hold when Renovate regenerates the lockfile, not only when it proposes an update.
* Install scripts of dependencies must not run unless someone allowed them.
* The Playwright container, which has Node and npm but no pnpm, must still run the tests.

## Considered Options

* pnpm
* npm
* Yarn

## Decision Outcome

Chosen option: "pnpm", because it is the owner's choice for his repositories, and the settings his
other repositories already use for the release wait and install scripts carry over unchanged.

`package.json` pins the version in `packageManager`. `pnpm-workspace.yaml` sets `minimumReleaseAge`
to 7 days, refuses versions without a publish time, and lists in `allowBuilds` each dependency that
has an install script. `scripts/playwright.sh` and the Playwright `webServer` call the binaries in
`node_modules/.bin`, so the container needs no pnpm.

### Consequences

* Good, because pnpm refuses a version younger than 7 days on every install, including Renovate's
  lockfile maintenance. The npm setup here had no such setting, and the switch moved 54 indirect
  packages back to older versions that npm had installed within days of their release, rollup
  4.66.0 among them on its release day.
* Good, because a new dependency with an install script stops the install until someone decides
  whether it may run.
* Bad, because contributors need pnpm, and a plain `npm install` creates a second lockfile. The
  `packageManager` field lets Corepack or pnpm itself fetch the right version.
* Bad, because pnpm 12 writes `pnpm-lock.yaml` as two YAML documents by default, and GitHub's
  dependency graph reads only the first, which holds only pnpm. `pmOnFail: ignore` keeps it to one
  document until
  [dependabot-core issue 15904](https://github.com/dependabot/dependabot-core/issues/15904) is fixed.

### Confirmation

`package.json` has `packageManager: pnpm@<version>`, the repository has `pnpm-lock.yaml` and no
`package-lock.json`, and every workflow installs with `pnpm install --frozen-lockfile`. The first
line of `pnpm-lock.yaml` is `lockfileVersion`, not `---`.

## Pros and Cons of the Options

### pnpm

A package manager that keeps one copy of each package version in a shared store and links it into
`node_modules`.

* Good, because the owner's other JavaScript repositories use it.
* Good, because `minimumReleaseAge` and `allowBuilds` are package manager settings, enforced on
  every install.
* Neutral, because its strict `node_modules` layout fails a build that imports a package it does
  not declare, which is correct but can surface after the switch. This build needed no change.

### npm

The package manager that ships with Node.

* Good, because it ships with Node and every container image.
* Neutral, because npm 11 has comparable settings, `min-release-age` and `allow-scripts`, so either
  manager can enforce the same rules.
* Bad, because the owner's other repositories moved from npm to pnpm, so its settings and commands
  would differ from theirs.

### Yarn

A package manager from Meta, now maintained by its own team, at version 4.

* Neutral, because Yarn 4 also has a release-age setting.
* Bad, because none of the owner's repositories use it.

## More Information

The owner asked on 2026-10-28 to use pnpm here and on his repositories in general, after the
makeover had started with npm.

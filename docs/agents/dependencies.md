# Dependencies

## Scope

Adding, pinning, and updating npm packages, the Node version, GitHub Actions, and the Playwright
container image. Renovate does the updates; `renovate.json` holds its configuration.

## Rules

- Pin every dependency to an exact version in `package.json`, with no `^` or `~`. Pin GitHub Actions
  to a commit SHA with the version in a comment, and container images to an exact tag.
- Use pnpm, never npm or yarn ([ADR 0011](../adr/0011-manage-packages-with-pnpm.md)). Commit
  `pnpm-lock.yaml` with every dependency change. `package.json` pins the pnpm version in
  `packageManager`; Renovate updates it like any other dependency.
- `pnpm-workspace.yaml` holds the pnpm settings. A dependency may run an install script only when
  `allowBuilds` names it with `true`; pnpm stops the install when an unlisted one has a script, so
  decide for each new one and say why in a comment.
- A new release waits 7 days before Renovate proposes it (`minimumReleaseAge` in `renovate.json`),
  and pnpm refuses to install one younger than that (`minimumReleaseAge` in `pnpm-workspace.yaml`).
  Security fixes skip the wait: the fixed version goes into `minimumReleaseAgeExclude` in the same
  commit as the lockfile change. Don't install a version younger than 7 days by hand unless it fixes
  a vulnerability.
- How to choose a library, and when code written here is allowed instead, is in
  [Libraries](libraries.md).
- Whatever the page loads at runtime is bundled into the build. The only third-party request the
  page makes is analytics, see
  [ADR 0013](../adr/0013-measure-usage-and-web-vitals-with-cookieless-posthog.md).
- The Playwright container tag and the `@playwright/test` version move together, in one pull
  request. Visual snapshots depend on that match, see [Testing](testing.md).
- The `.nvmrc` Node version and the `engines` field in `package.json` describe the same Node major.

## Automerge

Renovate merges every update on its own once CI passes: major, minor, and patch, npm packages,
Node, GitHub Actions, and the Playwright image. The test suite is the gate, see
[ADR 0008](../adr/0008-automerge-every-dependency-update-that-passes-ci.md).

- This is a deliberate exception for this repository. Don't hold back a major update for manual
  review because it is major; strengthen the tests instead.
- When an update fails CI, find out why. A real break gets a fix in the update's branch. A test
  that missed something it should have caught gets a better test.
- When an update changes rendering, the snapshot test fails and the pull request waits. Update the
  snapshots only after reading the diff images, as [Testing](testing.md#updating-snapshots) says.
- When you find a dependency failure that CI did not catch, add the test that would have caught it in
  the same change as the fix.

## References

- [Testing](testing.md)
- [Default workflow](default-workflow.md)

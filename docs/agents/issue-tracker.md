# Issue tracker

## Scope

Where issues and specs live and how the engineering skills read and write them. They are GitHub
issues in this repository, handled with the `gh` CLI, which finds the repository from the clone's
`origin` remote.

## Rules

- Create: `gh issue create --title "..." --body "..."`, with a heredoc for a body of several lines.
- Read: `gh issue view <number> --comments`.
- List: `gh issue list --state open --json number,title,body,labels,comments`, with `--label` and
  `--state` filters as needed.
- Comment: `gh issue comment <number> --body "..."`.
- Labels: `gh issue edit <number> --add-label "..."` or `--remove-label "..."`. The label names
  are in [Triage labels](triage-labels.md).
- Close: `gh issue close <number> --comment "..."`. If the reason for closing is a decision, such as
  keeping something the issue reports, write its ADR first, see
  [Design decisions](design-decisions.md).
- When a skill says "publish to the issue tracker", create a GitHub issue. When it says "fetch the
  relevant ticket", run `gh issue view <number> --comments`.
- GitHub numbers issues and pull requests in one sequence, so `#42` may be either. Try
  `gh pr view 42` first and fall back to `gh issue view 42`.

### Pull requests as a triage surface

**PRs as a request surface: no.** `/triage` reads this flag. Set it to `yes` only if outside pull
requests should go through the same labels and states as issues. Then read one with
`gh pr view <number> --comments` and `gh pr diff <number>`, and list the open ones with
`gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments`,
keeping only an `authorAssociation` of `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR` or `NONE`.

### Wayfinding

`/wayfinder` keeps a map of the work in one issue and its tickets in child issues.

- Map: one issue labelled `wayfinder:map`, holding the notes, the decisions so far and the open
  questions. Create it with `gh issue create --label wayfinder:map`.
- Child ticket: a GitHub sub-issue of the map, labelled `wayfinder:<type>`, where the type is
  `research`, `prototype`, `grilling` or `task`. Without sub-issues, list the child in a task list
  in the map and start the child's body with `Part of #<map>`.
- Blocking: GitHub's issue dependencies. Add one with
  `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<id>`,
  where the id is the blocker's numeric database id from
  `gh api repos/<owner>/<repo>/issues/<n> --jq .id`, not its issue number. Without dependencies,
  start the child's body with `Blocked by: #<n>, #<n>`. A ticket is unblocked once every blocker
  is closed.
- Next ticket: the first open child in map order that has no open blocker and no assignee.
- Claim: `gh issue edit <n> --add-assignee @me`, before anything else.
- Resolve: comment the answer, close the issue, then add a one-line summary with its link to the
  map's decisions.

## References

- [Triage labels](triage-labels.md): the label names.
- [Default workflow](default-workflow.md): branches, commits and pull requests.

# Design decisions

## Scope

When a choice needs an architecture decision record (ADR) and how to write one. Why the records use
MADR 4 is in [ADR 0001](../adr/0001-record-decisions-as-madr-4.md).

## Where

Records live in `docs/adr/` as [MADR 4](https://adr.github.io/madr/) files, one per decision, named
`NNNN-short-title-in-kebab-case.md` and numbered after the highest record on the target branch. Copy
`docs/adr/adr-template.md` and fill every section with concrete content for this project.

## When to write one

Write a record when:

- a choice can't be recovered from the code, and the obvious cleanup of a line would undo it;
- the owner and an agent weigh several options and pick one. A decision must not live only in chat,
  a pull request, or a commit message;
- an approach, library, or setting was tried or seriously considered and rejected for a reason that
  isn't obvious, so the next person doesn't try it again;
- a measured or verified fact decided the choice, such as a library's size or a feature's Baseline
  date. Keep the numbers with the versions and the date they were taken;
- the code deviates from the issue that asked for it;
- a session settled several durable decisions. Review the conversation and the commits before
  finishing and capture each one.

If the owner has to ask for a record after a decision was made, add it and sharpen the trigger above
that should have fired.

Don't write one for a choice the code already explains, or for routine use of a pattern the project
already has.

## How to write one

- Front matter: `status`, `date`, `decision-makers`, `consulted`, `informed`. Then the headings
  `Context and Problem Statement`, `Decision Drivers`, `Considered Options`, `Decision Outcome` with
  `Consequences` and `Confirmation`, `Pros and Cons of the Options`, and `More Information` when
  there is more to say.
- `decision-makers` is `[martinfrancois]` for a choice the owner made. For a choice the coding agent
  made, write `implementing coding agent`, plus how the owner approved it when he did, such as
  `implementing coding agent, approved by martinfrancois in the design interview`. `consulted` names
  only people or parties who gave input, and may be `[]`.
- Write the chosen option as `Chosen option: "<title>", because <reason>.`, with the title copied
  exactly from `Considered Options`.
- Open every option under `Pros and Cons of the Options` with one or two sentences that say what the
  option concretely is, before any Good or Bad bullet.
- `Confirmation` names how to check the decision still holds: a test, a command, a file to read.
  For something not built yet, describe the check that will confirm it, not a result.
- Status is `accepted`, or `superseded by [ADR NNNN](NNNN-short-title.md)` once a later record
  replaces it. Never rewrite an accepted decision to match a later one: supersede it. Fixing a fact,
  a link, or wording without changing the decision is fine.
- Cite issues and pull requests as full Markdown links with link text that names them, such as
  `[html-cheat-sheet issue #2](https://github.com/martinfrancois/html-cheat-sheet/issues/2)`.
- Point at the record from the code it protects: a one-line comment that says what breaks if the
  line goes, plus the record's path.

## Enforcement

`test/adr.test.ts` runs in `pnpm test` and checks every record: file name and unique, contiguous
numbering, front matter keys, status, required headings in order, no empty section, the chosen option
listed under `Considered Options`, every option opening with a sentence, no template placeholder,
no bare issue reference, and no em dash.

## References

- [Writing style](writing-style.md)
- [Maintaining agent docs](maintaining-agent-docs.md)

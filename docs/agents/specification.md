# Specification

## Scope

What `SPEC.md` holds, how it relates to the other docs, and when to change it. How to write an ADR
is in [Design decisions](design-decisions.md).

## What goes where

- `SPEC.md` says what the page must show and do, for whom, and how it is built, tested and
  published. It is the contract: the code, the tests and the docs follow it.
- An ADR in `docs/adr/` says why a choice was made and what lost. `SPEC.md` links to it.
- A page under `docs/agents/` says how to work on the repository. `SPEC.md` links to it for the
  detailed rules, such as the accessibility numbers or where each fact in an entry comes from.
- `CONTEXT.md` defines the terms. `SPEC.md` uses them as defined there.

Keep each rule in one place. When a requirement needs the detail of a topic page, state the
requirement in `SPEC.md` and link the page instead of copying it.

## Rules

- Before changing the page, read the `SPEC.md` sections the change touches.
- When martinfrancois adds or changes a requirement, update `SPEC.md` in the same change as the
  code. A requirement that lives only in chat, a pull request or a commit message is lost for the
  next person.
- martinfrancois's latest explicit decision wins. Rewrite the old wording instead of keeping both.
  When it's unclear how far a decision reaches, ask martinfrancois.
- A requirement martinfrancois asked for that isn't built yet goes under "Not done yet", never into
  the text as if it worked. Remove its line in the change that builds it.
- A temporary tool, such as a preview control that helps martinfrancois choose something, is not a
  feature. List the pending choice under "Open decisions" instead.
- When the code disagrees with `SPEC.md` and martinfrancois hasn't changed the requirement, fix the
  code or open an issue. Don't edit `SPEC.md` to match the code.
- When `SPEC.md` and an ADR disagree, `SPEC.md` wins for what the page does. Supersede the ADR as
  [Design decisions](design-decisions.md) describes.
- Use `MUST`, `MUST NOT`, `SHOULD` and `MAY` in capitals only with their RFC 2119 meaning.
- Keep the dates and counts in `SPEC.md`, such as the number of names in `src/data/spec.json` and
  the "Checked on" date, true for the change you make.

## Before finishing

Check both directions and say the result in the pull request:

1. Every requirement you added or changed is built and has a test, or is listed under "Not done
   yet".
2. Every behavior you added or changed is described in `SPEC.md`, or follows from a requirement
   already there.

Name the `SPEC.md` sections the pull request changes, or say why it changes none.

## Enforcement

No test reads `SPEC.md` yet. Review checks the two directions above.

## References

- [Design decisions](design-decisions.md)
- [Default workflow](default-workflow.md)
- [Maintaining agent docs](maintaining-agent-docs.md)

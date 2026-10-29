# Domain docs

## Scope

Where the engineering skills (`code-review`, `to-spec`, `to-tickets`, `domain-modeling` and the
others) find this project's terms and decisions, and how they use them. The repository has one
context: `CONTEXT.md` and `docs/adr/` at the root, and no `CONTEXT-MAP.md`.

## Rules

- Before exploring the code, read `CONTEXT.md` and the records in `docs/adr/` that touch the area
  you're about to change.
- Name domain concepts with the terms in `CONTEXT.md`, as [Writing style](writing-style.md) says.
  A concept the glossary lacks is either a word the project doesn't use, so pick another, or a gap
  to add to `CONTEXT.md` in the same change.
- When your output contradicts a record, say so instead of overriding it, for example: "Contradicts
  ADR 0005 (cookieless PostHog as the only third-party request), but worth reopening because…".
- A skill that writes a record follows [Design decisions](design-decisions.md), not its own format:
  every record is MADR 4, and `test/adr.test.ts` fails on any other shape.

## References

- [Design decisions](design-decisions.md): when to write a record and its format.
- [Writing style](writing-style.md): wording, including the glossary terms.

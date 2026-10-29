---
status: accepted
date: 2026-10-28
decision-makers: [martinfrancois]
consulted: [implementing coding agent]
informed: [Future maintainers and agents working on this repository]
---

# Record decisions as MADR 4 architecture decision records

## Context and Problem Statement

The cheat sheet is being rebuilt from one hand-written `index.html` into an Astro site. The owner
settled the main choices in a design interview with a coding agent on 2026-10-28: the stack, how
live output renders, the editor, analytics, offline support, and the accessibility level. Until now
the repository recorded no decisions anywhere, so that reasoning existed only in the conversation.
Once it is gone, a maintainer who wonders why every example sits in its own iframe, or why the page
needs a build, has no way to tell a deliberate choice from an accident. In what shape should this
repository record its decisions so the reasoning outlives the conversation?

## Decision Drivers

* A maintainer or agent must find the reasoning without the conversation that produced it.
* The options that lost and the facts that decided a choice can't be reconstructed from the code.
* The owner's other repositories already use MADR 4 with the same agent rules, so the habits carry
  over.
* A test must check the shape, so a record can't decay into a free-form note.
* The check must run in `pnpm test` with Node's built-in test runner and no new dependency.

## Considered Options

* MADR 4 records under `docs/adr/`, checked by a Node test
* Free-form notes in `docs/`
* Nygard-style records (Context, Decision, Status, Consequences)
* Rationale in AGENTS.md and code comments only

## Decision Outcome

Chosen option: "MADR 4 records under `docs/adr/`, checked by a Node test", because it is the only
option with a fixed place for rejected alternatives and for how to confirm a decision, it matches
the owner's other repositories, and the check runs in the test command CI already runs.

### Consequences

* Good, because every record names the options that lost and why, which stops the next person from
  trying them again.
* Good, because `test/adr.test.ts` fails `pnpm test` on a record with a missing or empty section, a
  template placeholder, an unknown status, a gap in the numbering, or an em dash.
* Bad, because a small decision costs a full record with front matter and option subsections.
  [Design decisions](../agents/design-decisions.md) says when that cost is owed.

### Confirmation

`pnpm test` runs `test/adr.test.ts`, which checks every file in `docs/adr/` except
`adr-template.md`. `docs/agents/design-decisions.md` lists the triggers for writing a record and the
rules for writing one.

## Pros and Cons of the Options

### MADR 4 records under `docs/adr/`, checked by a Node test

One Markdown file per decision, copied from the official MADR 4 template, with YAML front matter and
the fixed MADR headings. A `node:test` file written in TypeScript reads each record and checks its
front matter, headings, status, and file name.

* Good, because the template asks for rejected options, consequences, and a confirmation step.
* Good, because the same template and rules are in use in the owner's other repositories.
* Good, because the test needs only Node, which the build needs anyway.
* Bad, because the format is long for a one-line decision.

### Free-form notes in `docs/`

Each decision gets a Markdown page in whatever shape its author picks.

* Good, because a note costs almost nothing to write.
* Bad, because nothing makes the author list rejected options or how to confirm the decision.
* Bad, because a test can't check a shape the files don't have.

### Nygard-style records (Context, Decision, Status, Consequences)

One file per decision with four sections, as Michael Nygard first described them.

* Good, because the format is short and widely known.
* Bad, because it has no section for the options that lost, the part this repository most needs.
* Bad, because it differs from the owner's other repositories.

### Rationale in AGENTS.md and code comments only

Write the reason for each choice next to the code or in AGENTS.md, and keep no separate records.

* Good, because the reason sits where it applies.
* Bad, because every agent session reads AGENTS.md, so every rejected option would cost context on
  every task.
* Bad, because a comment must stay short and describe the current code, so there is no room for the
  alternatives or a superseded decision.

## More Information

The format is described at [MADR](https://adr.github.io/madr/). The template is `adr-template.md` in
this directory. Records 0002 to 0010 capture the decisions from the 2026-10-28 design interview and
the rules the owner set the same day.

# Maintaining agent docs

## Scope

Adding, changing, moving, or removing guidance in `AGENTS.md` and `docs/agents/`. `CLAUDE.md` only
imports `AGENTS.md`; don't add content to it.

## Progressive disclosure

`AGENTS.md` is read at the start of every session, so every line in it costs every task. It may
contain only:

- a one-sentence description of the project;
- commands that differ from what a reader would guess;
- rules that apply to every single task;
- links to the topic pages, each with a few words on what the page covers.

Everything else goes in the topic page that owns it under `docs/agents/`. When asked to add something
to `AGENTS.md`, check it against the list above first. If it is topic-specific, put it in a topic
page and link that page instead.

## Where rules belong

- What the page must show and do, and what isn't built yet: [Specification](specification.md).
- Building, verifying, commits, and pull requests: [Default workflow](default-workflow.md).
- Writing entries and where each fact comes from: [Content entries](content-entries.md).
- Test layers, the Playwright container, and snapshots: [Testing](testing.md).
- WCAG numbers and how they are checked: [Accessibility](accessibility.md).
- Layout, grouping, controls, and the visual review: [Visual design](visual-design.md).
- Page copy, docs, and commit message wording: [Writing style](writing-style.md).
- Choosing a library or writing code here: [Libraries](libraries.md).
- Pins, cooldown, and Renovate: [Dependencies](dependencies.md).
- When and how to write an ADR: [Design decisions](design-decisions.md).
- Where the engineering skills find issues, triage labels, and domain docs:
  [Issue tracker](issue-tracker.md), [Triage labels](triage-labels.md), and [Domain docs](domain.md).
- Project terms: `CONTEXT.md`, not a page here.

A new topic that fits none of these gets a new page, linked from `AGENTS.md` and from the list above.

## Learning from corrections

- When a user corrects a repeatable mistake or states a useful repository preference, update the
  relevant page under `docs/agents/` in the same change. Don't persist an instruction the user
  limited to the current session.
- If a mistake happened despite an existing rule, the rule did not work. Make it more specific, move
  it next to the step where it was missed, or replace it with a test.
- Prefer a test or a check over prose when a tool can prove the outcome. Keep prose only for what an
  agent still has to decide.

## Keeping pages useful

- Search the other pages for the same rule before adding one. Keep each rule in one place and link
  to it from elsewhere.
- Delete or rewrite vague rules such as "write clean code" or "be careful". A rule must change a
  concrete decision or a verification step.
- If a new rule conflicts with an existing one and it's not clear which should win, ask the owner.
  Don't keep both.
- Write for any person on any machine with any agent: no local paths, no host names, no first names.
  [Writing style](writing-style.md#naming-people) says how to name people.
- Follow [Writing style](writing-style.md).

## Template for a new page

```md
# Title

## Scope

What this page owns and what it does not.

## Rules

- Concrete instructions that change a decision or a verification step.

## References

- Links to related pages.
```

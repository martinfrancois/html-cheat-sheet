---
status: accepted
date: 2026-10-30
decision-makers: [implementing coding agent]
consulted: []
informed: [Future maintainers and agents working on this repository]
---

# Wrap code lines at seams of the code

## Context and Problem Statement

A code line too long for a phone's row wraps, and [Visual design](../agents/visual-design.md) says
where: at a seam of the code, never inside a word, a closing tag or a name such as
`aria-labelledby`. `src/lib/code-theme.ts` marks seams with `<wbr>`, and `overflow-wrap: anywhere`
breaks a piece only where no seam or space falls before the row ends.

Below 390 px that rule broke. In Playwright's Firefox at 320 px, 21 code lines broke inside a word,
such as `<section aria-labelledby="comm|ents">` and `</selectedco|ntent>`, and 5 at 360 px, such
as `prefers-reduced-|motion`. Most were an attribute whose name and value together didn't fit what
was left of the row after the tag
([html-cheat-sheet issue #43](https://github.com/martinfrancois/html-cheat-sheet/issues/43)). Where
should such a line wrap?

## Decision Drivers

* A line breaks inside a word, a closing tag or a name only when that piece is wider than a whole
  row.
* Lines that already wrapped well at 390 px and wider stay as they are.
* Selecting and copying the code gives the code as written.
* Nothing sticks out of a code block, also in the narrower column beside a classic scrollbar
  ([ADR 0027](0027-let-kept-together-pieces-wrap-in-a-narrower-column.md)).

## Considered Options

* Add a seam after the equals sign only in an attribute too long for a 320 px row
* Add a seam after every equals sign
* Keep each attribute in an inline block

## Decision Outcome

Chosen option: "Add a seam after the equals sign only in an attribute too long for a 320 px
row", because it fixes the breaks the issue lists and leaves an attribute that fits a row whole.

Two kinds of piece get their own rule:

* A closing tag is an inline block. It moves to the next row whole while it fits one, and wraps
  inside only when it's wider, such as a deeply indented `</selectedcontent>` beside a scrollbar.
  ADR 0027 turned down inline blocks for code chips, because a browser may break before and after
  one. A closing tag already has a seam on both sides, so its block adds no place to wrap.
* A hyphenated name that doesn't fit a 320 px row, such as `prefers-reduced-motion` indented two
  spaces, gets the classes `keep wide`. It stays whole from the column a 360 px screen leaves,
  where the `narrow` variant ends, and may break at its hyphens below it.

### Consequences

* Good, because at 303, 320 and 360 px no line breaks inside a word, a closing tag or a kept name,
  in Chromium, Firefox and WebKit.
* Good, because `<wbr>` adds no character, so a copy of the code is unchanged.
* Bad, because the seam after "=" is sized for a 320 px row and applies at every width. At 390 px,
  `aria-labelledby="confirm-title"` in the dialog example now wraps after its "=" where it used to
  move to the next row whole.
* Bad, because a second width is now kept in step with the CSS: `WIDE_CODE_ROW` in
  `src/lib/chips.ts` is the row of the 20.5rem column the `narrow` variant reads.

### Confirmation

* `test/code-theme.test.ts` checks where the seams fall: after "=" in `aria-labelledby="comments"`
  but not in `commandfor="confirm"`, between tags, before a closing tag in a `srcdoc` value, before
  a member after a call, and the `keep wide` and `closing-tag` classes.
* "a code line never wraps inside a word, a kept name or a closing tag" in
  `test/e2e/page.spec.ts` runs at 303, 320, 360 and 390 px. It fails on the commit before this
  change at every width below 390 px.
* "every code line fits inside its block" runs at 303, 320 and 360 px, so a kept piece that
  sticks out fails it.

## Pros and Cons of the Options

### Add a seam after the equals sign only in an attribute too long for a 320 px row

`breakAtSeams` measures the attribute from its name to the end of its quoted value, or of its tag,
and adds a `<wbr>` after "=" when that's longer than a wrapped row on a 320 px screen.

* Good, because `aria-labelledby=` and `"comments">` each take a row on a narrow phone.
* Good, because a short attribute such as `commandfor="confirm"` still moves to the next row whole.
* Bad, because the length is counted for 320 px, so a long attribute also wraps at its "=" on a
  wider screen where it would have fit a row.

### Add a seam after every equals sign

Every attribute may wrap between its name and its value.

* Good, because it needs no measuring.
* Bad, because a trial changed the 390 px rendering for the worse: short attributes split at their
  "=" instead of moving to the next row whole.

### Keep each attribute in an inline block

Each attribute, name and value, is an inline block that moves to the next row whole and wraps
inside only when it's wider than a row.

* Good, because it adapts to every width without a character count.
* Bad, because a browser may break before and after an inline block. A trial moved breaks next to
  punctuation and failed several of the wrapping tests.

## More Information

Measured on 2026-10-30 in the `mcr.microsoft.com/playwright:v1.64.1-noble` image with Playwright's
Chromium, Firefox and WebKit, and Mozilla's release build of Firefox 159.0. Keeping a closing tag
`white-space: pre` instead of an inline block made "every code line fits inside its block" fail at
303 px in Firefox and WebKit. With `pre-wrap`, Firefox broke after a closing tag's "</".

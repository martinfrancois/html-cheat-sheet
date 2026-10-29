---
status: accepted
date: 2026-10-28
decision-makers: [martinfrancois]
consulted: [implementing coding agent]
informed: [Future maintainers and agents working on this repository]
---

# WCAG 2.2 AA with AAA contrast and text presentation

## Context and Problem Statement

A cheat sheet is read in long stretches of small, dense text: code, attribute names, short notes.
Readers include people with low vision, people on phones, and people who navigate by keyboard or
screen reader. The old page was about 1550 pixels wide and scrolled sideways on narrower windows.
The owner gave a standing rule on 2026-10-28 for this and future work: follow WCAG 2.2 AA everywhere,
and AAA for colors and font sizes. Which success criteria and numbers does that mean here, and how
are they checked?

## Decision Drivers

* Text must be easy to read for people with low vision, in both a light and a dark theme.
* The page must work at 320 CSS px wide and at 200% zoom without sideways scrolling.
* Every rule must have a number a test or a reviewer can check.
* Live output shows browser defaults on purpose
  ([ADR 0003](0003-render-live-output-in-sandboxed-iframes.md)), so the rule can't apply inside it.

## Considered Options

* WCAG 2.2 AA, plus AAA for contrast and text presentation
* WCAG 2.2 AA only
* WCAG 2.2 AAA everywhere

## Decision Outcome

Chosen option: "WCAG 2.2 AA, plus AAA for contrast and text presentation", because the AAA criteria
for contrast, visual presentation, and target size help exactly the dense text a cheat sheet is made
of, and each of them has a number the page can meet in full.

The numbers:

* Text contrast at least 7:1 (1.4.6, AAA). Large text (24px, or 18.66px bold) at least 3:1
  (1.4.3, AA), the owner's choice, so headings can carry a bright accent color.
* Non-text UI parts and focus indicators at least 3:1 (1.4.11, AA).
* Body text at least 16px and no text under 14px. WCAG sets no font size; these are the owner's
  numbers.
* Line height at least 1.5, paragraph spacing at least 1.5 times the line height, lines at most 80
  characters, no justified text (1.4.8, AAA).
* Text resizable to 200% (1.4.4) and reflow at 320 CSS px without sideways page scrolling (1.4.10).
* Text spacing overrides do not clip text (1.4.12).
* Touch targets at least 24x24 CSS px (2.5.8, AA), and 44x44 where the layout allows (2.5.5, AAA).

Both themes must meet every number. Live output frames are exempt from the page's color tokens,
because they show the browser's default rendering of the example being taught. The page chrome
around them is not exempt.

### Consequences

* Good, because text stays readable for people with low vision, in either theme.
* Good, because the page works on a phone without sideways scrolling, which the old page did not.
* Bad, because 7:1 leaves few usable accent colors, especially for syntax highlighting in the code
  blocks and the editor.
* Bad, because every new color needs a contrast check in both themes.

### Confirmation

A Playwright test runs axe-core with the WCAG 2.2 A and AA rules plus `color-contrast-enhanced`
against the built page, once in the light and once in the dark theme, and fails on any violation.
Another test checks that the page does not scroll sideways at 320 CSS px. `docs/agents/accessibility.md`
lists the numbers and the manual checks for what axe-core can't measure.

## Pros and Cons of the Options

### WCAG 2.2 AA, plus AAA for contrast and text presentation

Meet every level A and AA criterion, plus 1.4.6 Contrast (Enhanced), 1.4.8 Visual Presentation, and
2.5.5 Target Size (Enhanced) where the layout allows, and the owner's font size minimums.

* Good, because the stricter criteria are the ones that matter most for dense reference text.
* Good, because axe-core can check enhanced contrast automatically.
* Bad, because it limits the color palette.

### WCAG 2.2 AA only

Meet every level A and AA criterion and nothing more.

* Good, because it is the level most laws and policies ask for, and leaves more colors to choose
  from.
* Bad, because 4.5:1 contrast and no rules on line length or spacing leave dense small text harder
  to read for people with low vision.

### WCAG 2.2 AAA everywhere

Meet every level AAA criterion as well.

* Good, because it is the strictest level.
* Bad, because some AAA criteria don't fit this content. 3.1.5 Reading Level would need a simpler
  second version of every note that uses spec terms such as "phrasing content".
  The W3C itself does not recommend AAA as a general policy for entire sites, because some content
  can't meet every AAA criterion.

## More Information

The owner stated the rule on 2026-10-28 as a standing preference for this repository. WCAG 2.2 is at
[w3.org/TR/WCAG22](https://www.w3.org/TR/WCAG22/). The W3C's note on AAA is in
[Understanding Conformance](https://www.w3.org/WAI/WCAG22/Understanding/conformance).

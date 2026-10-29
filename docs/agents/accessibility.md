# Accessibility

## Scope

The accessibility rule for the page chrome: layout, navigation, search, cards, buttons, code blocks,
and both color themes. It is a standing rule from martinfrancois and applies to every change. Why
the rule exists is in [ADR 0007](../adr/0007-wcag-2-2-aa-with-aaa-contrast-and-text-presentation.md).

## Rule

Follow WCAG 2.2 level AA everywhere, and level AAA for colors and font sizes. In numbers:

| What | Minimum | WCAG criterion |
| --- | --- | --- |
| Text contrast | 7:1 | 1.4.6 Contrast (Enhanced), AAA |
| Large text contrast (24px, or 18.66px bold, bold meaning weight 700) | 3:1 | 1.4.3, AA, martinfrancois's rule |
| Non-text UI parts and focus indicators | 3:1 against what is next to them | 1.4.11 Non-text Contrast, AA |
| Body text size | 16px | martinfrancois's rule |
| Smallest text anywhere | 15px (martinfrancois's floor is 14px) | martinfrancois's rule, checked at 15px |
| Line height | 1.5 | 1.4.8 Visual Presentation, AAA |
| Space between paragraphs | 1.5 times the line height | 1.4.8, AAA |
| Line length | 80 characters at most | 1.4.8, AAA |
| Text alignment | never justified | 1.4.8, AAA |
| Links inside running text | underlined, never color alone | 1.4.1 Use of Color, A |
| Text resized to 200% | nothing lost or cut off | 1.4.4 Resize Text, AA |
| Width 320 CSS px | no sideways page scrolling | 1.4.10 Reflow, AA |
| Text spacing overrides | no clipped or overlapping text | 1.4.12 Text Spacing, AA |
| Touch targets | 24x24 CSS px | 2.5.8 Target Size (Minimum), AA |
| Touch targets where the layout allows | 44x44 CSS px | 2.5.5 Target Size (Enhanced), AAA |

The 1.4.12 overrides are: line height 1.5 times the font size, paragraph spacing 2 times, letter
spacing 0.12 times, and word spacing 0.16 times.

## Applying it

- Both the light and the dark theme must meet every number. Check a new color in both.
- Decoration isn't exempt. An accent color on headings or rules still meets the large text or
  non-text number. Large text means 24px, or 18.66px at weight 700 (`font-bold`); semibold
  doesn't count.
- Define colors as theme tokens and use only the tokens. A one-off color skips the contrast check you
  did for the token.
- Measure contrast against the real background, including a hover or selected state.
- Code blocks and the CodeMirror editor follow the same contrast rule as body text, including every
  syntax highlighting color.
- Live output frames are exempt from the page's color tokens and font rules. They show the browser's
  default rendering of an example, which is the subject being demonstrated. The frame element still
  needs a `title`, and the border, buttons, and labels around it follow the rule.
- An example's own markup still follows [Content entries](content-entries.md): labels, `alt` text,
  table headers.

## Enforcement

- A Playwright test runs axe-core on the built page in both themes, with the WCAG 2.2 A and AA rules
  plus `color-contrast-enhanced`. A violation fails CI. The scan excludes the content of live output
  frames.
- Playwright tests cover what axe cannot see: no sideways scrolling at 320 px, and visual snapshots
  in both themes at phone and desktop widths. See [Testing](testing.md).
- Check the rest by hand when a change touches layout or styles: 200% zoom, a text spacing
  bookmarklet, and keyboard-only use. [Default workflow](default-workflow.md) lists the steps.

## References

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Testing](testing.md)
- [Content entries](content-entries.md)

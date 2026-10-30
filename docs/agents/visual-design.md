# Visual design

## Scope

How the page is laid out and how it looks: spacing, grouping, controls, icons, and the visual review
before a change is shown to anyone. These are standing rules from martinfrancois. Color contrast
and text size numbers live in [Accessibility](accessibility.md).

## Group by the Gestalt laws

Readers see what belongs together from how close, how alike, and how enclosed things are. Use that on
purpose, and check every screen for it.

- **Proximity.** Put a thing next to what it belongs to, and keep unrelated things apart. The space
  inside a group is smaller than the space between groups: lines of a fact list < parts of an entry
  < entries < chapters.
  - The MDN and Spec links sit right after the element name, not at the far edge of the page.
  - "Default CSS" and "Accessibility role" sit directly under the summary they describe.
  - An attribute's description starts right after the longest attribute name in its list, not at a
    fixed column far away.
  - The example's title is the header of its code block, with Copy and Edit at the right end of
    the same row and a thin line under it. The buttons take no space beside the code.
  - An example title keeps its last two words together, so when it wraps it never leaves one word
    alone on its last line, and otherwise fills its lines as usual. Balancing the lines instead
    split titles in the middle of a phrase, which martinfrancois found strange. `text-wrap: pretty`
    would do this in CSS but isn't Baseline (no Firefox).
- **Similarity.** Things of the same kind look the same everywhere: every piece of inline code is a
  chip, every section label inside an entry ("Key attributes", "Good to know") has the same small
  heading style, every icon button has the same size and hover state.
- **Common region.** A boundary groups what is inside it. The code and its live output each have one
  box; nothing else gets a box unless it is one unit.
- **Alignment.** Rows of the same kind share columns: chapter titles in the index, attribute names in
  key attributes.

## Keep it compact and free of repetition

- No chrome that repeats on every entry or example unless the reader needs it there each time. A
  header bar, label, or role line shown 40 times is noise; show it once or not at all.
- The index sits above the entries, one row per chapter: the chapter title on the left, its entries
  flowing to the right. No sidebar.
- Usage notes are short separate points, never a paragraph. [Content entries](content-entries.md)
  has the length limit and the rule for how many examples an entry gets.
- Example code doesn't wrap where martinfrancois reads it. On wide screens the code takes three
  fifths of an example's width and the live output two fifths, and the code is 15 px with 12 px of
  padding, so a 70-character line fits on one row at a foldable's 752 px and on a desktop.
  Narrower screens wrap a long line, and the rest of it continues further indented than the line
  started. It wraps at a seam of the code (before or after a tag, after a slash in a path, before
  `.member` in a script), never inside a word, a closing tag, or a name such as `aria-labelledby`.
  An attribute too long for a wrapped row on a 320 px screen, such as
  `aria-labelledby="confirm-title"`, may also wrap after its `=`, on wider screens too; a shorter
  one stays whole. Only a piece with no seam that is wider than a whole row breaks inside, such as
  a 22-character nonce on a 320 px screen, or a deeply indented `</selectedcontent>` in a column
  narrower than 18rem.
  A name stays whole only when it fits a wrapped row on a 320 px screen, 27 characters less the
  line's indentation and the 4 of the wrap, so a deeply indented `prefers-reduced-motion` may
  break at its hyphens. The 70-character limit is in
  [Content entries](content-entries.md).
- A code chip of up to 22 characters, such as `(min-width: 30em)`, never breaks; a longer one
  breaks only at its spaces or after a slash, never at a hyphen inside `z-index`. Below the
  column a 320 px screen leaves, such as beside a classic scrollbar, chips, names in code blocks
  and entry titles may break anywhere
  ([ADR 0027](../adr/0027-let-kept-together-pieces-wrap-in-a-narrower-column.md)). A support badge
  keeps its last two words together, like an example title, and its feature name follows the
  chip rule, so `<input type="datetime-local">` breaks after `<input`.
- Elements of one entry that share their Default CSS and accessibility role, such as `<h1>` to
  `<h6>`, show those rows once, under all summaries.
- Label facts in plain words a reader understands without looking them up: "Default CSS:
  `display: block`", "Accessibility role: group, a set of related items". Never a bare term such as
  "Role: group" or "Display".

## Color

martinfrancois wants colors that pop, never muddy.

- Keep the greys clean: backgrounds and text barely tinted. Color comes from saturated accents,
  not from tinting everything.
- Text colors (links, syntax colors) take the most saturated value that still reaches 7:1.
  Orange, yellow and olive turn brown when darkened that far on a light background, so a light
  theme uses them only as highlights, never as text.
- The highlight (`--accent`) goes only on large bold text and lines, such as the brackets in
  element names and the rule under each chapter title, where 3:1 is enough. Contrast rules still
  apply to it; see [Accessibility](accessibility.md).
- Code chips may take a light tint of the highlight, with dark text on them.
- martinfrancois chose the "Cyan and pink" theme on 2026-10-29, after comparing neon pink, neon
  cyan, lime and yellow with a panel of reviewers. Cyan marks what you read and click (links, the
  index, code tags); pink marks structure (the rule under chapter titles, the brackets in headings,
  the code chips).
- Dark mode shows both at full neon strength on near-black.
- Light mode keeps only shades that look good on white. martinfrancois found the alternatives ugly.
  - Backgrounds are plain white and grey, never tinted with the theme color.
  - Cyan becomes a strong blue: darkened to 7:1 on white, cyan itself turns a muddy petrol.
  - Pink becomes deep magenta for chips (white text on them) and bright pink for lines.
  - Lime and yellow never appear on white: darkened enough for contrast they turn olive or brown.
  - No highlighter stroke behind chapter titles.
- Code blocks stand out clearly from the page in both themes. In dark mode they're lighter than
  the page, because a code block darker than near-black is invisible.

## Browser support

Never just say a feature "doesn't work in every browser". A support badge says only how many
visitors can use it ("Available for 91% of visitors") and links to the feature's page on
webstatus.dev, which shows each browser. Keep the badge that short: the Baseline level and the
browsers that lack it go in its tooltip, not its text. It names the feature (`<input type="month">`)
only when an example has more than one badge, or when the feature belongs to another element or
attribute than the entry's, such as `<button commandfor>` in the `headingreset` example. The whole badge is the link, with an arrow icon so it
reads as one without hovering.

## Controls

- Use an icon for a common action that people recognize by its icon: copy, edit, reset, theme.
  Each icon button has an `aria-label`, shows that label as a tooltip on hover and on keyboard
  focus, and is at least 44 by 44 CSS px. After copying, the copy icon turns into a check mark for
  two seconds. Icons come from Lucide (`@lucide/astro`).
- The theme control is one button showing the mode it switches to: a moon in light mode, a sun in
  dark mode. The page follows the system setting until the reader clicks it; only that click stores
  a choice. There is no "System" option.
- The back-to-top link is the one round icon button, after the one on fmartin.ch, because it floats
  over the entries instead of sitting in a row. It has its own fill, a `--muted` border and a ring
  in the page color, so the border keeps 7:1 over chips and code blocks. It jumps without a smooth
  scroll, which martinfrancois asked for: on a page this long, an animation takes seconds.
- Never show a hint that most readers can't decode, such as a bare `/` next to the search box.
  Declare keyboard shortcuts with `aria-keyshortcuts` instead.
- Visible text must fit the narrowest screen it appears on. A placeholder such as "Search elements"
  stays short enough to show whole on a phone and on the inner screen of a foldable, never cut off
  mid-word.

## Examples show browser defaults

An example shows the element exactly as browsers render it, even when that looks plain, such as
`<menu>` as a bulleted list. Restyling it defeats the purpose of the cheat sheet.
[Content entries](content-entries.md) has the rule for when CSS belongs in an example.

## Visual review before showing a change

Passing tests and cropped snapshots are not a visual review. Before calling a layout or style change
done:

1. Build and serve the page, then capture it viewport by viewport from top to bottom, at desktop
   (1440 px), the inner screen of a foldable (about 884 px), and phone (390 px) widths, in both
   themes. Chromium leaves iframes blank in full-page screenshots, so scroll and capture each
   viewport instead.
2. Read every capture as a reader would, against each rule on this page: anything far from what it
   belongs to, repeated, cut off, misaligned, or empty.
3. Open a modal dialog and a popover in their live output, and hover and focus each kind of icon
   button.
4. Say in the pull request what you looked at and what you did not.

## References

- [Accessibility](accessibility.md) for contrast, text size, and target size numbers
- [Content entries](content-entries.md) for notes and examples
- [Testing](testing.md) for the automated visual snapshots

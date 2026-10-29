# Content entries

## Scope

How to write or change an entry in `src/content/entries/`. The terms used here (entry, chapter,
default display, key attributes, usage note, comparison, accessibility role, live output) are defined
in `CONTEXT.md`. Use them as defined there.

## Where entries live

- One YAML file per entry under `src/content/entries/`. The schema in `src/content.config.ts`
  fails `pnpm run build` when a required field is missing or empty. Read the schema's comments
  before adding a field.
- Write each example once, in `code`. The page shows the same text as code and as live output, so
  the two can never disagree. Never add a second copy of an example, escaped or rendered.
- Live output shows the browser's default styles, which are what an example teaches. Never restyle
  an example to look nicer, such as laying out `<menu>` buttons in a row: the reader came to see
  how the element looks on its own. Add CSS only when the CSS is the lesson, such as the
  replacement for an obsolete element.
- Every element in `src/data/spec.json` appears in exactly one entry, and a test fails when one has
  none. An obsolete element never shares an entry with a conforming one.

## Where each fact comes from

Never write a fact about HTML from memory. Take it from the source below and check it against MDN.
When the two disagree, the spec wins; mention the disagreement in the pull request. Library choices
for each source are in [ADR 0009](../adr/0009-use-established-libraries-for-each-concern.md).

| Field | Source |
| --- | --- |
| Element list, obsolete elements | `@webref/elements`, copied into `src/data/spec.json` by `pnpm run sync-spec` |
| Chapter, section number, spec link | The HTML standard's headings, in `src/data/spec.json` |
| `display` | `src/data/spec.json`, read from the standard's [suggested browser stylesheet](https://html.spec.whatwg.org/multipage/rendering.html) |
| `role` | `src/data/spec.json`, read from [HTML Accessibility API Mappings](https://w3c.github.io/html-aam/) (HTML-AAM) |
| Global attributes | The standard's attribute index, in `src/data/spec.json` |
| MDN link | `__compat.mdn_url` in `@mdn/browser-compat-data`; never build an MDN URL by hand |
| Baseline status, `compat` keys | The `web-features` package, never a website summary |
| `summary` | The element's definition in the [HTML standard](https://html.spec.whatwg.org/multipage/), in your own words |
| Key attributes | The element's content attributes in the standard; pick the two to five people use most |
| Replacement for an obsolete element | The [obsolete features section](https://html.spec.whatwg.org/multipage/obsolete.html) of the standard |

Set `display` or `role` in an entry only where the stylesheet or HTML-AAM has no single answer, and
say why in a YAML comment next to it. When the role depends on context, such as the `type` of an
`<input>`, add `roleContext`: which case the shown role is for and what the others get. The page
shows it after the role's gloss and a semicolon, so it starts in lowercase and continues that
phrase.

## Examples

- Write valid, conforming HTML that a real page would contain. Put an element where it belongs, not
  alone in a void.
- Give every form control a label, every `<img>` an `alt`, every `<iframe>` a `title`, and every
  table a header row. An example teaches what it shows, including its mistakes.
- Use a realistic sentence instead of "Lorem ipsum" or "Click me".
- Give an entry one example. Add a second only when it shows something the first can't, such as a
  newly available feature next to the version that works everywhere. Two examples of the same idea
  make the reader compare them for nothing.
- Link only to `https://example.com` or to pages inside the example, so the live output works offline.
- The live output grows by itself when an example opens a modal `<dialog>` or a popover, so an
  example needs no fixed height.
- Format example code the way Prettier formats HTML at 70 characters, and no tighter. The owner
  found a short `<img>` split over four lines wasteful.
  - Keep every line at 70 characters or fewer, so no line wraps on a foldable (752 px) or a desktop.
  - A tag that fits on its line stays on one line. Only a tag that doesn't fit puts each attribute
    on its own line, indented, with `>` after the last one.
  - An element that holds only text and inline elements, such as `<p>`, `<label>` or `<li>`, stays
    on one line when it fits. Lists, tables, forms and sections keep their children on their own
    indented lines, so the structure shows.
  - Long text breaks between words.
  - `pnpm run format-examples` joins what fits on one line, and a test fails when something that
    fits is split. Lines longer than the code column wrap on the page, and the rest of the line
    continues further indented.
- When an element's content goes past its first line, put the start tag, the content and the end
  tag on their own lines, with the content indented. A continued line at the same indent reads as a
  new element. A test enforces it.

## Key attributes

- An attribute that has a value when it's left out gets a `default` field, such as `default: text`
  for `<input type>`. The page shows it as *Default: `text`.* at the start of the description, in
  the same form on every attribute. Never write the default into the summary ("without it you get
  `text`"): the owner found that clumsy. Leave `default` out for a boolean attribute, which is
  simply off when absent, and where the value depends on other things; say that in the summary.
  Start the summary after a default with a word, not a code chip: "Default: `1`. `1`, `a` ..."
  reads like a stutter.
- An attribute the element can't do without, such as `dir` on `<bdo>` or `value` on `<data>`, gets
  `required: true`, which shows a "required" label next to its name. Optional attributes get no
  label, because they're the normal case and labeling all of them would bury the few that matter.
  Never write "Required." into the summary.
- When a summary names some of an attribute's values ("such as `email`, `tel` or
  `new-password`"), link the complete list right after them, as `([all values](...))`, to the
  spec's or MDN's list of values. A reader who sees three examples will want the rest. A summary
  that lists every value needs no link.

## Usage notes

`notes` is a list of short points, one idea each, so a reader can skim them. A test fails when a
point is longer than 140 characters. Write the point a reader acts on, such as "Put the subtitle in a
`<p>`, not a second heading", and leave out history unless it changes what to do.

Advice always says why, in the same point: "Put a visible close button inside, because touch
screens have no Esc key", never only "Put a visible close button inside". When the reason doesn't
fit, link the source that explains it. The owner asked for this: advice without a reason doesn't
say when it applies.

## Comparisons

A comparison, such as `<b>` against `<strong>` or `<i>` against `<em>`, always shows the difference.
A sentence that says there is one is not enough.

- Show the elements in one example, each in a sentence where it is the right choice. A test fails
  when an entry's examples leave out one of its elements.
- The page shows each element's accessibility role under its summary. When the elements look the
  same on screen, the role is the visible difference.
- Say in a usage note when to pick which.

## Verifying an entry

1. `pnpm run build` passes.
2. Open the entry in `pnpm run dev` and check that the live output matches what the code says.
3. Click Edit, change the example, check that the output updates, then press Reset.
4. Paste the example into the [Nu HTML Checker](https://validator.w3.org/nu/) when you are not sure
   it is conforming.

## References

- [Writing style](writing-style.md) for summaries and usage notes
- [Accessibility](accessibility.md) for what the page chrome around examples must meet
- [ADR 0003](../adr/0003-render-live-output-in-sandboxed-iframes.md) for why live output looks the
  way it does

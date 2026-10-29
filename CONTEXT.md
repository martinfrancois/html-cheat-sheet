# HTML cheat sheet

A single-page reference that covers every element in the WHATWG HTML Living Standard and shows each one's code next to how the browser renders it.

## Language

**Element**:
An element defined in the WHATWG HTML Living Standard, such as `<dialog>` or `<td>`. The cheat sheet covers all of them.
_Avoid_: tag (a tag is the `<p>` or `</p>` text in markup, not the element)

**Global attribute**:
An attribute the standard allows on every HTML element, such as `hidden`, `inert` or `popover`. The cheat sheet covers all of them, in their own chapter after the elements.

**Entry**:
The cheat sheet's unit of content, shown as a card. It describes one element, a few elements that only make sense together, or one global attribute, and shows an example of each.
_Avoid_: row (that is the old table layout)

**Chapter**:
A group of entries, following the chapters of the HTML standard: the document element, document metadata, sections, grouping content, text-level semantics, edits, embedded content, tables, forms, interactive elements, scripting. Global attributes and obsolete elements each form one more chapter at the end.
_Avoid_: category (the standard uses that word for content categories such as "phrasing content")

**Obsolete element**:
An element the standard lists as obsolete and non-conforming, such as `<center>` or `<marquee>`. Its entry lives in a separate section and names the modern replacement.
_Avoid_: deprecated (the standard does not use that term for elements)

**Default display**:
The CSS `display` value browsers give an element when no stylesheet overrides it, such as `block`, `inline`, `none` or `table-cell`.
_Avoid_: inline / block (the HTML4 split, which most elements do not fit)

**Key attributes**:
The two to five attributes of an element that people reach for most, listed in its entry. Not the full attribute list.

**Baseline status**:
Whether an element works across the major browsers, as the `web-features` package reports it: widely available, newly available, or limited.

**Usage note**:
A short point in an entry about accessibility or about choosing the right element. An entry lists its usage notes as separate points, one idea each.

**Example**:
A markup snippet in an entry, written once. The entry shows it both as code and as **Live output**.

**Live output**:
What the browser renders for an example, using the browser's default styles. The cheat sheet's own styles never change how it looks.
_Avoid_: preview, result

**Comparison**:
A usage note that contrasts two or more elements, such as `<b>` and `<strong>`. It always comes with an example that shows the difference, never only a sentence saying there is one. The example puts each element in a sentence where it is the right choice, and the entry shows each element's **Accessibility role**.

**Accessibility role**:
The role a browser exposes for an element to assistive technology, as the HTML Accessibility API Mappings spec defines it, such as `strong` for `<strong>` and `generic` for `<b>`.

## Relationships

- An **Entry** covers one or more **Elements**
- Every **Element** in the standard appears in exactly one **Entry**
- An **Obsolete element** never shares an **Entry** with a conforming **Element**

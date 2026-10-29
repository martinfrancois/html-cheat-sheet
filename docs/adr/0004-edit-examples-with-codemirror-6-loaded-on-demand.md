---
status: accepted
date: 2026-10-28
decision-makers: [implementing coding agent, approved by martinfrancois in the design interview]
consulted: []
informed: [Future maintainers and agents working on this repository]
---

# Edit examples with CodeMirror 6 loaded on demand

## Context and Problem Statement

Readers learn more when they can change an example and see what happens. Each entry gets an Edit
button that turns the example's code into an editor, updates the live output as the reader types,
and offers a Reset button to restore the original. The page has a few hundred examples and most
readers never press Edit, so the editor must cost nothing until they do. Which editor should the
page use, and when should it load?

## Decision Drivers

* The editor must work with a keyboard and a screen reader, since the page follows WCAG 2.2 AA
  ([ADR 0007](0007-wcag-2-2-aa-with-aaa-contrast-and-text-presentation.md)).
* It must work on phones.
* It must not add to the first page load.
* It must highlight HTML, including embedded CSS and JavaScript.
* It should be maintained and widely used, so bugs get found and fixed by others.

## Considered Options

* CodeMirror 6, loaded on the first Edit click
* Monaco Editor
* A small textarea-based editor such as prism-code-editor

## Decision Outcome

Chosen option: "CodeMirror 6, loaded on the first Edit click", because it supports screen readers
and touch devices, it is modular so the page ships only the HTML language support, and a dynamic
import keeps it out of the first load.

Until a reader presses Edit, the code is a static, highlighted block. The first click loads the
editor chunk, and later clicks reuse it.

### Consequences

* Good, because readers who never press Edit download no editor code.
* Good, because CodeMirror 6 uses a `contenteditable` element that screen readers and mobile
  keyboards handle like other text fields.
* Good, because `@codemirror/lang-html` highlights CSS and JavaScript inside `<style>` and
  `<script>`.
* Bad, because the first Edit click waits for a network request. The service worker must cache the
  editor chunk so Edit also works offline
  ([ADR 0006](0006-offline-support-with-a-service-worker.md)).
* Bad, because the static code block and the editor must look alike, and the editor theme must meet
  the same 7:1 text contrast as the rest of the page.

### Confirmation

A Playwright test clicks Edit on an example, checks that the editor chunk loads only then, types a
change, checks that the live output updates, presses Reset, and checks that the original example is
back. `package.json` lists `codemirror` and `@codemirror/*` packages and no other editor.

## Pros and Cons of the Options

### CodeMirror 6, loaded on the first Edit click

The `codemirror` package with `@codemirror/lang-html`, imported with a dynamic `import()` from the
Edit button's click handler, so Vite puts it in its own chunk.

* Good, because accessibility and touch input were design goals of version 6.
* Good, because about 12.3 million weekly npm downloads of `codemirror` (week of 2026-10-21) mean
  many users find its bugs first.
* Neutral, because the page picks its own extensions, which means a little setup code.

### Monaco Editor

The editor from Visual Studio Code, published as `monaco-editor`.

* Good, because it is widely used and has rich editing features.
* Bad, because the `monaco-editor` 0.57.0 package unpacks to about 102 MB, a lot to bundle for
  editing a few lines of HTML per example.
* Bad, because its README answers "Is the editor supported in mobile browsers?" with "No."

### A small textarea-based editor such as prism-code-editor

A `<textarea>` layered over a syntax-highlighted copy of its text. prism-code-editor 5.4.0 is one
such editor.

* Good, because it is small and a `<textarea>` works on every device.
* Bad, because far fewer people use it: about 24,000 weekly downloads against CodeMirror's 12.3
  million in the same week. Its README says it is accessible to screen readers, but far fewer
  people have tested that claim with assistive technology.

## More Information

The coding agent proposed CodeMirror 6 in the design interview on 2026-10-28 and martinfrancois
approved it. Package sizes and download counts are from the npm registry on 2026-10-28.

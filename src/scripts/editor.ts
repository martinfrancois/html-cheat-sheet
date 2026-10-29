// Loaded on the first click on "Edit", so readers who never edit never download CodeMirror.
import { html } from "@codemirror/lang-html";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView, minimalSetup } from "codemirror";
import { tags } from "@lezer/highlight";

// The same --code-* tokens as the static highlighting in src/lib/code-theme.ts.
const highlight = HighlightStyle.define([
  { tag: [tags.tagName, tags.keyword], color: "var(--code-tag)" },
  { tag: [tags.attributeName, tags.propertyName, tags.variableName], color: "var(--code-attr)" },
  { tag: [tags.attributeValue, tags.string, tags.number, tags.atom], color: "var(--code-string)" },
  { tag: tags.comment, color: "var(--code-comment)", fontStyle: "italic" },
  { tag: [tags.angleBracket, tags.punctuation, tags.documentMeta], color: "var(--code-punct)" },
]);

const theme = EditorView.theme({
  "&": { color: "var(--code-ink)", backgroundColor: "transparent" },
  // Same padding as the static code block, so the text stays put when Edit swaps them.
  ".cm-content": { padding: "0.75rem", caretColor: "var(--code-ink)" },
  ".cm-line": { padding: "0" },
  ".cm-cursor": { borderLeftColor: "var(--code-ink)" },
  "&.cm-focused": { outline: "3px solid var(--focus)", outlineOffset: "2px" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": { backgroundColor: "color-mix(in srgb, var(--focus) 30%, transparent)" },
});

export function createEditor(parent: HTMLElement, code: string, label: string, onChange: (code: string) => void): EditorView {
  return new EditorView({
    doc: code,
    parent,
    extensions: [
      minimalSetup,
      html(),
      syntaxHighlighting(highlight),
      theme,
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({ "aria-label": label }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) onChange(update.state.doc.toString());
      }),
    ],
  });
}

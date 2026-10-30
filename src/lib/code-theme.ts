import type { ShikiTransformer, ThemeRegistration } from "shiki";
import { CHIP_ROW, CODE_ROW, WIDE_CODE_ROW } from "./chips.ts";

// Colours come from the --code-* tokens in src/styles/global.css, so the static highlighting
// and the CodeMirror editor (src/scripts/editor.ts) share one palette, checked for 7:1 contrast
// in both themes.
const color = (token: string) => `var(--code-${token})`;

export const codeTheme: ThemeRegistration = {
  name: "cheat-sheet",
  type: "light",
  colors: { "editor.foreground": color("ink"), "editor.background": "transparent" },
  tokenColors: [
    { scope: ["entity.name.tag", "keyword", "storage", "entity.name.function"], settings: { foreground: color("tag") } },
    {
      scope: ["entity.other.attribute-name", "support.type.property-name", "meta.property-name", "variable"],
      settings: { foreground: color("attr") },
    },
    { scope: ["string", "constant", "support.constant", "meta.property-value"], settings: { foreground: color("string") } },
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: color("comment"), fontStyle: "italic" } },
    { scope: ["punctuation", "meta.tag.sgml.doctype"], settings: { foreground: color("punct") } },
  ],
};

// The text inside a token, or inside a group of tokens one of these transformers made.
type Node = { type: string; value?: string; children?: Node[] };
const textOf = (node: Node): string => (node.type === "text" ? (node.value ?? "") : (node.children ?? []).map(textOf).join(""));

// Lets a long line wrap where code has a seam instead of in the middle of a word: before a tag,
// after one (">Home"), after each slash of a path ("example.com/" "menu"), and in a script after
// "(" and before ".textContent", also before a member that follows a call or an index
// ("Date()" ".toLocaleTimeString"). An attribute too long for a narrow phone's row also wraps
// between its name and its quoted value ('aria-labelledby=' '"comments">'). <wbr> adds no
// character, so selecting and copying the code is unchanged. A comment's "<!--" and "-->", a
// short hyphenated name, and a quote at either end of a value stay whole.
export const breakAtSeams: ShikiTransformer = {
  name: "break-at-seams",
  line(line) {
    // A wrapped row starts 4ch further in than the line (see global.css). A name kept whole, and
    // an attribute kept on one row, must fit the rest of a narrow phone's row; a name marked
    // "wide" fits only the row of the column a 360 px screen leaves.
    const indent = textOf(line.children[0] ?? { type: "text" }).match(/^\s*/)![0].length + 4;
    const room = CODE_ROW - indent;
    const wideRoom = WIDE_CODE_ROW - indent;
    const tokens = keepClosingTags(line.children.flatMap((token) => splitPath(token, Math.min(CHIP_ROW, room))));
    const starts = startsOf(tokens);
    const lineText = tokens.map(textOf).join("");
    const quote = /^["']$/;
    line.children = tokens.flatMap((token, index) => {
      const text = textOf(token);
      // A name such as aria-labelledby stays whole; only a longer run of text may break at a hyphen.
      if (token.type === "element" && token.properties.class !== "closing-tag") {
        const name = text.includes("-") ? text.length : Infinity;
        if (/^(<!--|-->)$/.test(text) || name <= Math.min(CHIP_ROW, room)) token.properties.class = "keep";
        else if (name <= Math.min(CHIP_ROW, wideRoom)) token.properties.class = "keep wide";
      }
      const previous = index > 0 ? textOf(tokens[index - 1]!) : "";
      const member = /^\.\w/.test(text) || (text === "." && /[\w)\]]$/.test(previous));
      // The attribute from its name to the end of its value, or of its tag, such as
      // aria-labelledby="comments">. A shorter one stays whole, so a wider screen wraps before it.
      const quoted = previous === "=" && index > 1 ? lineText.slice(starts[index]).match(/^("[^"]*"|'[^']*')\/?>?/) : null;
      const longAttribute = !!quoted && textOf(tokens[index - 2]!).length + 1 + quoted[0].length > room;
      const seam =
        index > 0 &&
        !quote.test(previous) &&
        (text.startsWith("<") || member || longAttribute || /\($/.test(previous) || (/>$/.test(previous) && !quote.test(text)) || (/\/$/.test(previous) && !/</.test(previous)));
      return seam ? [{ type: "element" as const, tagName: "wbr", properties: {}, children: [] }, token] : [token];
    });
  },
};

// Groups each closing tag, "</" then the name then ">", into one unit kept on a row while it fits
// one (global.css). Firefox would otherwise break after the slash, as it does in a path, and
// leave "</" at a row's end.
// Shiki writes "></" as one token where an element is empty, and "><" where a tag follows another,
// so such a token is split before its "<" first.
function keepClosingTags(tokens: ElementContent[]): ElementContent[] {
  const split = tokens.flatMap((token) => {
    const parts = textOf(token).split(/(?<=.)(?=<\/$)|(?<=>)(?=<)/s);
    if (token.type !== "element" || token.children.length !== 1 || parts.length === 1) return [token];
    return parts.map((value) => ({ ...token, properties: { ...token.properties }, children: [{ type: "text" as const, value }] }));
  });
  const grouped: ElementContent[] = [];
  for (let index = 0; index < split.length; index++) {
    const [opener, name, closer] = split.slice(index, index + 3).map(textOf);
    if (opener === "</" && name && /^[\w-]+$/.test(name) && closer === ">") {
      grouped.push({ type: "element", tagName: "span", properties: { class: "closing-tag" }, children: split.slice(index, index + 3) });
      index += 2;
    } else grouped.push(split[index]!);
  }
  return grouped;
}

// Splits a token such as https://example.com/menu after each slash, one longer than "keep" such
// as a style value around each hyphenated word, and a value such as srcdoc's around each closing
// tag, keeping its colour, so the word or the closing tag can stay whole.
function splitPath(token: ElementContent, keep: number): ElementContent[] {
  const text = textOf(token);
  if (token.type !== "element" || token.children.length !== 1 || token.children[0]!.type !== "text" || /^<\S*$/.test(text)) return [token];
  const words = text.length > keep ? text.split(/(?<!\S)(\S*-\S*)(?!\S)/).filter(Boolean) : [text];
  return words
    .flatMap((word) => word.split(/(<\/[\w-]+>)/).filter(Boolean))
    .flatMap((word) => (/^<\//.test(word) ? [word] : word.split(/(?<=\/)(?!\/)/)))
    .map((value) => ({
      ...token,
      properties: /^<\/[\w-]+>$/.test(value) ? { ...token.properties, class: "closing-tag" } : { ...token.properties },
      children: [{ type: "text" as const, value }],
    }));
}

// Where each token's text starts in the text of the line.
function startsOf(tokens: ElementContent[]): number[] {
  const starts: number[] = [];
  let offset = 0;
  for (const token of tokens) {
    starts.push(offset);
    offset += textOf(token).length;
  }
  return starts;
}

// What a line holds, in the HTML syntax tree Shiki builds.
type ElementContent = Parameters<NonNullable<ShikiTransformer["line"]>>[0]["children"][number];

// Keeps a line's indentation together with its first token. Otherwise a narrow screen wraps right
// after the leading spaces and shows a row of nothing but indentation. The spaces stay in the
// text, so selecting and copying the code keeps the indentation. The indentation also goes into
// --indent, so a wrapped line continues further in than where it started (see global.css).
export const keepIndentWithFirstToken: ShikiTransformer = {
  name: "keep-indent-with-first-token",
  line(line) {
    const indent = line.children.findIndex((token) => textOf(token).trim() !== "");
    const spaces = textOf(line.children[0]!).match(/^\s*/)![0].length;
    if (spaces > 0) line.properties.style = `--indent: ${spaces}ch`;
    if (indent < 0 || spaces === 0) return;
    // A line of text is one token. Only its first word stays with the indentation; the rest may
    // wrap. A group such as alt="A stick figure" stays whole.
    const first = line.children[indent]!;
    const [, word, rest] = textOf(first).match(/^(\s*\S+)(\s.*)$/s) ?? [];
    const plain = first.type === "element" && first.children.length === 1 && first.children[0]!.type === "text";
    if (plain && rest) {
      line.children.splice(indent, 1, ...[word!, rest].map((value) => ({ ...first, children: [{ type: "text" as const, value }] })));
    }
    line.children.splice(0, indent + 1, { type: "element", tagName: "span", properties: { class: "lead" }, children: line.children.slice(0, indent + 1) });
  },
};

// The longest attribute kept on one row, such as alt="A stick figure". A longer one may wrap at
// its own spaces, so it never sticks out of the code block on a phone.
const ATTRIBUTE_ROW = 24;

// Keeps a short attribute whose value has spaces on one row, so a long tag wraps between
// attributes and never in the middle of alt="A stick figure".
export const keepAttributesTogether: ShikiTransformer = {
  name: "keep-attributes-together",
  line(line) {
    // Shiki puts the space before an attribute into the attribute's token, as " alt". The space
    // goes into a token of its own, so the line can still wrap there.
    line.children = line.children.flatMap((token) => {
      const [, space, rest] = textOf(token).match(/^(\s+)(\S.*)$/s) ?? [];
      if (token.type !== "element" || !space) return [token];
      return [space, rest!].map((value) => ({ ...token, children: [{ type: "text" as const, value }] }));
    });
    const starts = startsOf(line.children);
    const text = line.children.map(textOf).join("");
    const ranges = [...text.matchAll(/(?<=\s)[\w:-]+=(?:"[^"]* [^"]*"|'[^']* [^']*')/g)]
      .filter((match) => match[0].length <= ATTRIBUTE_ROW)
      .map((match) => ({ first: starts.indexOf(match.index), end: match.index + match[0].length }))
      .map(({ first, end }) => ({ first, last: starts.findIndex((start, index) => start + textOf(line.children[index]!).length === end) }))
      .filter(({ first, last }) => first >= 0 && last >= first);
    for (const { first, last } of ranges.reverse()) {
      line.children.splice(first, last - first + 1, { type: "element", tagName: "span", properties: { class: "attribute" }, children: line.children.slice(first, last + 1) });
    }
  },
};

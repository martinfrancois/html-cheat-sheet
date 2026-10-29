// The layout rule for example code, as code: a tag or an element that fits on one line of
// CODE_LINE characters stays on that line, the way Prettier formats HTML, and one that doesn't
// fit is split. Splitting a short <img> tag over four lines wastes space and makes the reader scan
// for nothing. test/entries.test.ts checks every example against it, and
// scripts/format-examples.ts applies it. Prettier itself either hangs a tag's ">" on the next line
// or changes what the example renders: docs/adr/0009-use-established-libraries-for-each-concern.md.

export const CODE_LINE = 70;

// Elements that a line of text can hold: the standard's phrasing content
// (https://html.spec.whatwg.org/multipage/dom.html#phrasing-content) without embedded content
// (<audio>, <canvas>, <embed>, <iframe>, <object>, <picture>, <video>), without elements that
// hold something other than a line of text (<datalist>, <map>, <noscript>, <ruby>, <script>,
// <selectedcontent>, <slot>, <template>, <textarea>), and without <area>, <link> and <meta>,
// which show nothing. An element whose content is only text and these joins into one line
// when it fits; a list, a table or a form section keeps its children on their own lines, so its
// structure shows.
const PHRASING = new Set(
  "a abbr b bdi bdo br button cite code data del dfn em i img input ins kbd label mark meter output progress q s samp select small span strong sub sup time u var wbr".split(" "),
);

// Elements whose line breaks are part of their content.
const PRESERVES_LINES = new Set(["pre", "textarea", "script", "style", "template", "svg", "math"]);

const indentOf = (line: string) => line.length - line.trimStart().length;

// One pass: joins the first start tag split over several lines, or the first element with only
// phrasing content, that fits on one line. Returns undefined when nothing joins.
function joinOnce(lines: string[]): string[] | undefined {
  for (let start = 0; start < lines.length; start++) {
    const line = lines[start]!;
    const indent = " ".repeat(indentOf(line));
    // A start tag whose attributes go on the following lines.
    if (/^\s*<[a-z][a-z0-9-]*\s*$/.test(line)) {
      const end = lines.findIndex((candidate, index) => index > start && candidate.trimEnd().endsWith(">"));
      if (end < 0) continue;
      const joined = indent + lines.slice(start, end + 1).map((part) => part.trim()).join(" ");
      if (joined.length <= CODE_LINE) return [...lines.slice(0, start), joined, ...lines.slice(end + 1)];
      continue;
    }
    // An element with its start tag and end tag on their own lines.
    const name = line.match(/^\s*<([a-z][a-z0-9-]*)\b[^<>]*>$/)?.[1];
    if (!name || PRESERVES_LINES.has(name)) continue;
    const end = lines.findIndex((candidate, index) => index > start && indentOf(candidate) === indent.length && candidate.trim() === `</${name}>`);
    if (end < 0) continue;
    const content = lines.slice(start + 1, end).map((part) => part.trim());
    // Inner elements join first, so a child still spread over lines waits for its own turn.
    if (content.some((part) => part.startsWith("</"))) continue;
    const tags = content.join(" ").matchAll(/<\/?([a-z][a-z0-9-]*)/g);
    if ([...tags].some(([, tag]) => !PHRASING.has(tag!))) continue;
    const joined = `${line}${content.join(" ")}</${name}>`;
    if (joined.length <= CODE_LINE) return [...lines.slice(0, start), joined, ...lines.slice(end + 1)];
  }
  return undefined;
}

// The lines inside an element whose line breaks are content, such as a <pre> or a <script>.
export function preservedLines(lines: string[]): Set<number> {
  const preserved = new Set<number>();
  let open: string | undefined;
  lines.forEach((line, index) => {
    if (open) {
      preserved.add(index);
      if (line.includes(`</${open}>`)) open = undefined;
      return;
    }
    const name = line.match(/<([a-z][a-z0-9-]*)\b/)?.[1];
    if (name && PRESERVES_LINES.has(name) && !line.includes(`</${name}>`)) open = name;
  });
  return preserved;
}

// Breaks a line of text and inline elements between words, never inside a tag.
function wrapText(line: string): string[] {
  const indent = " ".repeat(indentOf(line));
  const words = line.trim().match(/(?:<[^>]*>|[^\s<])+/g) ?? [];
  const rows: string[] = [];
  for (const word of words) {
    const last = rows.at(-1);
    if (last !== undefined && `${last} ${word}`.length <= CODE_LINE) rows[rows.length - 1] = `${last} ${word}`;
    else rows.push(indent + word);
  }
  return rows;
}

// One pass: splits the first line that is longer than CODE_LINE. An element on one line puts its
// content on an indented line of its own; a start tag alone puts each attribute on its own line;
// a line of text breaks between words. Returns undefined when nothing splits.
function splitOnce(lines: string[]): string[] | undefined {
  const preserved = preservedLines(lines);
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]!;
    if (line.length <= CODE_LINE || preserved.has(index)) continue;
    const indent = " ".repeat(indentOf(line));
    const replace = (...parts: string[]) => [...lines.slice(0, index), ...parts, ...lines.slice(index + 1)];
    const element = line.match(/^\s*(<([a-z][a-z0-9-]*)\b[^<>]*>)(.+)(<\/\2>)$/);
    if (element && !PRESERVES_LINES.has(element[2]!)) return replace(indent + element[1], `${indent}  ${element[3]!.trim()}`, indent + element[4]);
    const tag = line.match(/^\s*<([a-z][a-z0-9-]*)((?:\s+[^\s=>]+(?:="[^"]*"|='[^']*'|=[^\s>]+)?)+)\s*>$/);
    if (tag) {
      const attributes = [...tag[2]!.matchAll(/[^\s=>]+(?:="[^"]*"|='[^']*'|=[^\s>]+)?/g)].map(([attribute]) => `${indent}  ${attribute}`);
      return replace(`${indent}<${tag[1]}`, ...attributes.slice(0, -1), `${attributes.at(-1)}>`);
    }
    const opener = line.trim().match(/^<([a-z][a-z0-9-]*)/)?.[1];
    if (opener && !PHRASING.has(opener)) continue;
    const wrapped = wrapText(line);
    if (wrapped.length > 1) return replace(...wrapped);
  }
  return undefined;
}

export function formatExample(code: string): string {
  let lines = code.split("\n");
  for (let split = splitOnce(lines); split; split = splitOnce(lines)) lines = split;
  for (let joined = joinOnce(lines); joined; joined = joinOnce(lines)) lines = joined;
  return lines.join("\n");
}

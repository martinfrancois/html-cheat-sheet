// Checks the entry files against the facts they depend on: the spec snapshot, web-features and
// each other. The content schema in src/content.config.ts already checks field shapes at build.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { features } from "web-features";
import { parse } from "yaml";
import spec from "../src/data/spec.json" with { type: "json" };
import { CODE_LINE, formatExample, preservedLines } from "../src/lib/format-example.ts";

interface Entry {
  file: string;
  elements?: { name: string; summary: string }[];
  attribute?: { name: string; summary: string };
  attributes?: { name: string; summary: string }[];
  notes?: string[];
  replacement?: string;
  examples: { title: string; compat?: string[]; code: string }[];
}

const dir = new URL("../src/content/entries/", import.meta.url);
const entries: Entry[] = readdirSync(dir)
  .filter((file) => file.endsWith(".yaml"))
  .map((file) => ({ file, ...parse(readFileSync(new URL(file, dir), "utf8")) }));

const compatKeys = new Set(Object.values(features).flatMap((feature) => Object.keys(("status" in feature && feature.status?.by_compat_key) || {})));
// "title" is both an element and a global attribute, and so are style, slot and dir: names carry
// their kind, so <title> and the title attribute are told apart.
const covered = entries.flatMap((entry) => [...(entry.elements ?? []).map((element) => `<${element.name}>`), ...(entry.attribute ? [entry.attribute.name] : [])]);
const required = [...[...spec.elements, ...spec.obsolete].map((item) => `<${item.name}>`), ...spec.globalAttributes.map((item) => item.name)];

test("every element and global attribute in the spec has an entry", () => {
  assert.deepEqual(
    required.filter((name) => !covered.includes(name)),
    [],
  );
});

test("each element and attribute appears in exactly one entry", () => {
  const duplicates = covered.filter((name, index) => covered.indexOf(name) !== index);
  assert.deepEqual(duplicates, []);
});

test("every entry names elements or attributes the spec defines", () => {
  const unknown = covered.filter((name) => !required.includes(name));
  assert.deepEqual(unknown, []);
});

test("an obsolete element never shares an entry with a conforming one", () => {
  const obsolete = new Set(spec.obsolete.map((element) => element.name));
  for (const entry of entries) {
    const kinds = new Set((entry.elements ?? []).map((element) => obsolete.has(element.name)));
    assert.ok(kinds.size <= 1, `${entry.file} mixes obsolete and conforming elements`);
    if (kinds.has(true)) assert.ok(entry.replacement, `${entry.file} is obsolete and needs a replacement`);
  }
});

test("the examples of an entry about several elements use every one of them", () => {
  for (const entry of entries.filter((candidate) => (candidate.elements?.length ?? 0) > 1)) {
    const code = entry.examples.map((example) => example.code).join("\n");
    for (const element of entry.elements!) assert.match(code, new RegExp(`<${element.name}[\\s>]`), `${entry.file}: no example uses <${element.name}>`);
  }
});

// Lines past CODE_LINE wrap on most screens even with the wider code column, and copied code
// stays readable in an editor.
test(`example code lines are at most ${CODE_LINE} characters`, () => {
  for (const entry of entries) {
    for (const example of entry.examples) {
      for (const line of example.code.split("\n")) {
        assert.ok(line.length <= CODE_LINE, `${entry.file}: ${line.length} characters: ${line.trim()}`);
      }
    }
  }
});

// martinfrancois found a short <img> split over four lines wasteful: what fits on one line stays
// there.
test("example code keeps a tag or a line of text on one line when it fits", () => {
  for (const entry of entries) {
    for (const example of entry.examples) {
      assert.equal(formatExample(example.code), example.code, `${entry.file}: run pnpm run format-examples`);
    }
  }
});

// An element whose content goes on past its first line puts that content on indented lines, so a
// reader never takes a continued line for a new element.
test("example code indents the content of an element that spans several lines", () => {
  const indent = (line: string) => line.length - line.trimStart().length;
  for (const entry of entries) {
    for (const example of entry.examples) {
      const lines = example.code.split("\n");
      // The lines of a <pre> or a <script> are content, and their indentation with them.
      const preserved = preservedLines(lines);
      lines.slice(1).forEach((line, index) => {
        if (preserved.has(index + 1)) return;
        const previous = lines[index]!;
        const opened = previous.match(/^\s*<([a-z][a-z0-9]*)\b[^>]*>(?!.*<\/\1>\s*$).+$/)?.[1];
        const continues = opened && line.trim() && !line.trim().startsWith("<") && indent(line) <= indent(previous);
        assert.ok(!continues, `${entry.file}: "${line.trim()}" continues <${opened}> without an indent`);
      });
    }
  }
});

// A note is one point a reader takes in at a glance; a longer one is a paragraph in disguise.
const NOTE_LENGTH = 140;

test(`every note is one short point of at most ${NOTE_LENGTH} characters`, () => {
  for (const entry of entries) {
    for (const note of entry.notes ?? []) assert.ok(note.length <= NOTE_LENGTH, `${entry.file}: ${note.length} characters in "${note}"`);
  }
});

test("every web-features compat key in an example exists", () => {
  for (const entry of entries) {
    for (const key of entry.examples.flatMap((example) => example.compat ?? [])) {
      assert.ok(compatKeys.has(key), `${entry.file}: unknown compat key ${key}`);
    }
  }
});

test("entry text puts every tag in backticks, so Markdown never turns it into HTML", () => {
  for (const entry of entries) {
    const texts = [
      ...(entry.elements ?? []).map((element) => element.summary),
      entry.attribute?.summary,
      ...(entry.attributes ?? []).map((attribute) => attribute.summary),
      ...(entry.notes ?? []),
      entry.replacement,
      ...entry.examples.map((example) => example.title),
    ].filter((text): text is string => Boolean(text));
    for (const text of texts) {
      const outsideCode = text.replace(/`[^`]*`/g, "");
      assert.doesNotMatch(outsideCode, /<\/?[a-z][^>]*>/i, `${entry.file}: raw tag in "${text}"`);
    }
  }
});

// The page talks like a person: "doesn't", never "does not". A standing rule from martinfrancois.
const LONG_FORMS = /\b(do|does|did|is|are|was|were|has|have|had|will|would|should|could|must) not\b|\bcannot\b|\b(it|that|there|you|they|we) (is|are|will)\b/i;

test("entry text uses contractions, never the long form", () => {
  for (const entry of entries) {
    const prose = JSON.stringify({ ...entry, examples: entry.examples.map((example) => example.title) }).replace(/`[^`]*`/g, "");
    assert.doesNotMatch(prose, LONG_FORMS, `${entry.file}: "${prose.match(LONG_FORMS)?.[0]}" needs a contraction, such as "doesn't" for "does not"`);
  }
});

test("entry text uses no em dashes", () => {
  for (const entry of entries) assert.doesNotMatch(JSON.stringify(entry), /—/, `${entry.file} contains an em dash`);
});

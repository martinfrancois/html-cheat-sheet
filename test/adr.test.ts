// Without this test a decision record that leaves the MADR 4 shape in
// docs/agents/design-decisions.md goes unnoticed, see docs/adr/0001-record-decisions-as-madr-4.md.
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const ADR_DIRECTORY = fileURLToPath(new URL("../docs/adr/", import.meta.url));
const TEMPLATE = "adr-template.md";

const FILE_NAME = /^(\d{4})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SUPERSEDED = /^superseded by \[ADR \d{4}\]\(([^)]+\.md)\)$/;
const MARKDOWN_LINK = /\[([^\]]+)\]\([^)]+\)/g;
const VAGUE_LINK_TEXT = /^(?:#\d+|https?:\/\/\S+|(?:click )?here|(?:this )?link|this)$/i;
const BARE_REFERENCE = /(?<![\w/])#\d+\b/;
const BARE_GITHUB_URL = /https?:\/\/github\.com\/[^\s)]+\/(?:issues|pull)\/\d+/;
const PLACEHOLDER = /\{[^}]*\}/;
// Inline code such as `${{ github.token }}` may hold braces; only prose can hold a placeholder.
const INLINE_CODE = /(`+).+?\1/g;
const CHOSEN_OPTION = /Chosen option: "([^"]+)"/;
const EM_DASH = "\u2014";

const FRONT_MATTER_KEYS = ["status", "date", "decision-makers", "consulted", "informed"];
// The MADR template marks these optional, so an empty list says nobody was consulted or informed.
const MAY_BE_EMPTY = ["consulted", "informed"];
const REQUIRED_HEADINGS = [
  "## Context and Problem Statement",
  "## Decision Drivers",
  "## Considered Options",
  "## Decision Outcome",
  "### Consequences",
  "### Confirmation",
  "## Pros and Cons of the Options",
];
const MORE_INFORMATION = "## More Information";

function violations(directory: string): string[] {
  const found: string[] = [];
  const names = readdirSync(directory)
    .filter((name) => name.endsWith(".md") && name !== TEMPLATE)
    .sort();
  const byNumber = new Map<number, string[]>();
  for (const name of names) {
    const match = FILE_NAME.exec(name);
    if (!match) {
      found.push(`${name}: expected a file name like 0001-short-title.md`);
      continue;
    }
    const number = Number(match[1]);
    byNumber.set(number, [...(byNumber.get(number) ?? []), name]);
  }
  for (const [number, files] of byNumber) {
    if (files.length > 1) found.push(`ADR number ${pad(number)} is used by several files: ${files.join(", ")}`);
  }
  for (let number = 1; number <= Math.max(0, ...byNumber.keys()); number++) {
    if (!byNumber.has(number)) found.push(`ADR number ${pad(number)} is missing; numbers must run from 0001 without gaps`);
  }
  for (const name of names) {
    for (const problem of recordViolations(readFileSync(join(directory, name), "utf8"), directory)) {
      found.push(`${name}: ${problem}`);
    }
  }
  return found;
}

function recordViolations(text: string, directory: string): string[] {
  const lines = text.split("\n");
  const end = lines[0] === "---" ? lines.indexOf("---", 1) : -1;
  if (end <= 0) return ["expected YAML front matter between two --- lines at the top"];
  const body = withoutCodeBlocks(lines.slice(end + 1));
  return [
    ...metadataViolations(frontMatter(lines.slice(1, end)), directory),
    ...headingViolations(body),
    ...sectionViolations(body),
    ...outcomeViolations(body),
    ...optionViolations(body),
    ...placeholderViolations(body),
    ...referenceViolations(lines.join("\n")),
    ...dashViolations(lines),
  ];
}

/** The front matter as key and raw value, enough for the flat `key: value` lines MADR uses. */
function frontMatter(lines: string[]): Map<string, string> {
  const metadata = new Map<string, string>();
  for (const line of lines) {
    const separator = line.indexOf(":");
    if (separator > 0 && !line.startsWith("#") && !line.startsWith(" ")) {
      metadata.set(line.slice(0, separator).trim(), unquote(line.slice(separator + 1).trim()));
    }
  }
  return metadata;
}

function unquote(value: string): string {
  return /^(["']).*\1$/.test(value) ? value.slice(1, -1) : value;
}

function metadataViolations(metadata: Map<string, string>, directory: string): string[] {
  const found: string[] = [];
  for (const key of FRONT_MATTER_KEYS) {
    const value = metadata.get(key) ?? "";
    const emptyList = /^\[\s*\]$/.test(value);
    if (value === "" || (emptyList && !MAY_BE_EMPTY.includes(key))) {
      found.push(`expected filled front matter key ${key}`);
    } else if (PLACEHOLDER.test(value)) {
      found.push(`front matter key ${key} still holds a template placeholder`);
    }
  }
  const status = metadata.get("status");
  if (status !== undefined && status !== "" && status !== "accepted") {
    const successor = SUPERSEDED.exec(status)?.[1];
    if (successor === undefined) {
      found.push(`expected status accepted or a superseded-by link, found ${status}`);
    } else if (!existsSync(join(directory, successor))) {
      found.push(`superseding record does not exist: ${successor}`);
    }
  }
  const date = metadata.get("date");
  if (date && !DATE.test(date)) found.push(`expected date as YYYY-MM-DD, found ${date}`);
  return found;
}

function headingViolations(body: string[]): string[] {
  const found: string[] = [];
  const titles = body.filter((line) => line.startsWith("# ")).length;
  if (titles !== 1) found.push(`expected exactly one title heading, found ${titles}`);
  let previous = -1;
  for (const heading of REQUIRED_HEADINGS) {
    const index = body.indexOf(heading);
    if (index < 0) {
      found.push(`expected heading ${heading}`);
      continue;
    }
    if (index <= previous) found.push(`heading is out of order: ${heading}`);
    previous = Math.max(previous, index);
  }
  const moreInformation = body.indexOf(MORE_INFORMATION);
  if (moreInformation >= 0 && moreInformation <= previous) found.push(`heading is out of order: ${MORE_INFORMATION}`);
  return found;
}

function sectionViolations(body: string[]): string[] {
  return REQUIRED_HEADINGS.filter((heading) => body.includes(heading) && !hasText(section(body, heading, depth(heading)))).map(
    (heading) => `section ${heading} is empty`,
  );
}

function outcomeViolations(body: string[]): string[] {
  const outcome = section(body, "## Decision Outcome", 3).join(" ").replace(/\s+/g, " ");
  const chosen = CHOSEN_OPTION.exec(outcome)?.[1];
  if (chosen === undefined) return ['Decision Outcome must state the chosen option as Chosen option: "..."'];
  if (!bullets(section(body, "## Considered Options", 2)).includes(chosen)) {
    return [`chosen option "${chosen}" is not one of the Considered Options`];
  }
  return [];
}

function optionViolations(body: string[]): string[] {
  const prosAndCons = section(body, "## Pros and Cons of the Options", 2);
  const options = prosAndCons.filter((line) => line.startsWith("### "));
  if (options.length === 0) return ["Pros and Cons of the Options has no option subsection"];
  const found: string[] = [];
  for (const option of options) {
    const first = section(prosAndCons, option, 3).map((line) => line.trim()).find(isText) ?? "";
    if (first === "" || first.startsWith("* ") || first.startsWith("- ")) {
      found.push(`option '${option.slice(4)}' must open with a sentence saying what it is`);
    }
  }
  return found;
}

function placeholderViolations(body: string[]): string[] {
  const index = body.findIndex((line) => PLACEHOLDER.test(line.replace(INLINE_CODE, "")));
  return index < 0 ? [] : [`body line ${index + 1} still holds a template placeholder`];
}

function referenceViolations(text: string): string[] {
  const found: string[] = [];
  for (const [, linkText = ""] of text.matchAll(MARKDOWN_LINK)) {
    if (VAGUE_LINK_TEXT.test(linkText.trim())) found.push(`link text must say what it points to, not [${linkText}]`);
  }
  const unlinked = text.replace(MARKDOWN_LINK, "");
  const bare = BARE_REFERENCE.exec(unlinked);
  if (bare) found.push(`cite issues and pull requests as full Markdown links, not ${bare[0]}`);
  if (BARE_GITHUB_URL.test(unlinked)) found.push("cite issues and pull requests as full Markdown links, not a bare URL");
  return found;
}

function dashViolations(lines: string[]): string[] {
  const index = lines.findIndex((line) => line.includes(EM_DASH));
  return index < 0 ? [] : [`line ${index + 1} holds an em dash; use a comma or a full stop`];
}

/** `body` with the lines inside ``` fences blanked, so code never counts as a heading or a placeholder. */
function withoutCodeBlocks(body: string[]): string[] {
  let fenced = false;
  return body.map((line) => {
    const fence = line.trim().startsWith("```");
    const shown = fenced && !fence ? "" : line;
    if (fence) fenced = !fenced;
    return shown;
  });
}

/** The lines after `heading` up to the next heading of `level` or higher. */
function section(lines: string[], heading: string, level: number): string[] {
  const start = lines.indexOf(heading);
  if (start < 0) return [];
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => depth(line) > 0 && depth(line) <= level);
  return end < 0 ? rest : rest.slice(0, end);
}

/** The number of leading `#` of a heading line, or 0 for any other line. */
function depth(line: string): number {
  return /^#+(?= )/.exec(line)?.[0].length ?? 0;
}

function hasText(lines: string[]): boolean {
  return lines.some((line) => isText(line.trim()));
}

/** Whether a trimmed line shows the reader something: not blank and not an HTML comment. */
function isText(trimmed: string): boolean {
  return trimmed !== "" && !trimmed.startsWith("<!--");
}

/** The bullet items of `lines`, each with its continuation lines joined by single spaces. */
function bullets(lines: string[]): string[] {
  const items: string[] = [];
  for (const line of lines) {
    const text = line.trim();
    if (text.startsWith("* ") || text.startsWith("- ")) {
      items.push(text.slice(2).trim());
    } else if (text !== "" && items.length > 0 && line.startsWith(" ")) {
      items.push(`${items.pop()} ${text}`);
    }
  }
  return items;
}

function pad(number: number): string {
  return String(number).padStart(4, "0");
}

const VALID = `---
status: accepted
date: 2026-10-28
decision-makers: [martinfrancois]
consulted: [Maintainers]
informed: [Future maintainers]
---

# Keep the sample decision

## Context and Problem Statement

A sample problem that needs a decision.

## Decision Drivers

* A sample driver.

## Considered Options

* Keep the sample
* Drop the sample

## Decision Outcome

Chosen option: "Keep the sample", because it is the sample.

### Consequences

* Good, because the sample exists.

### Confirmation

Run the sample test.

## Pros and Cons of the Options

### Keep the sample

Keeping means the sample file stays in the repository.

* Good, because it is simple.

### Drop the sample

Dropping means the sample file is deleted.

* Bad, because nothing is left.

## More Information

See [html-cheat-sheet issue 1](https://github.com/example/project/issues/1).
`;

const scratch = mkdtempSync(join(tmpdir(), "adr-test-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

/** The violations found in a fresh directory holding the given files. */
function check(files: Record<string, string>): string[] {
  const directory = mkdtempSync(join(scratch, "case-"));
  for (const [name, content] of Object.entries(files)) writeFileSync(join(directory, name), content);
  return violations(directory);
}

function assertViolation(record: string, fragment: string): void {
  const found = check({ "0001-keep-the-sample.md": record });
  assert.ok(
    found.some((violation) => violation.includes(fragment)),
    `expected a violation containing "${fragment}", got ${JSON.stringify(found)}`,
  );
}

function replaced(search: string, replacement: string): string {
  assert.ok(VALID.includes(search), `sample record does not contain ${search}`);
  return VALID.replace(search, replacement);
}

test("every record in docs/adr has the MADR 4 shape", () => {
  assert.ok(existsSync(join(ADR_DIRECTORY, TEMPLATE)), "docs/adr/adr-template.md is missing");
  assert.deepEqual(violations(ADR_DIRECTORY), []);
});

test("a valid record passes and the template is skipped", () => {
  assert.deepEqual(check({ [TEMPLATE]: "{placeholder only}\n", "0001-keep-the-sample.md": VALID }), []);
});

test("reports a missing front matter key", () => {
  assertViolation(replaced("informed: [Future maintainers]\n", ""), "key informed");
});

test("reports an empty decision-makers list", () => {
  assertViolation(replaced("decision-makers: [martinfrancois]", "decision-makers: []"), "key decision-makers");
});

test("accepts an empty consulted list", () => {
  assert.deepEqual(check({ "0001-keep-the-sample.md": replaced("consulted: [Maintainers]", "consulted: []") }), []);
});

test("reports a template placeholder in the front matter", () => {
  assertViolation(
    replaced("decision-makers: [martinfrancois]", "decision-makers: {list everyone involved in the decision}"),
    "decision-makers still holds a template placeholder",
  );
});

test("reports a status other than accepted or superseded", () => {
  assertViolation(replaced("status: accepted", "status: proposed"), "status accepted");
});

test("accepts a superseded status that links an existing record", () => {
  const superseded = replaced("status: accepted", 'status: "superseded by [ADR 0002](0002-drop-the-sample.md)"');
  assert.deepEqual(check({ "0001-keep-the-sample.md": superseded, "0002-drop-the-sample.md": VALID }), []);
});

test("reports a superseding record that does not exist", () => {
  assertViolation(replaced("status: accepted", "status: superseded by [ADR 0002](0002-missing.md)"), "superseding record does not exist");
});

test("reports a malformed date", () => {
  assertViolation(replaced("date: 2026-10-28", "date: October 2026"), "YYYY-MM-DD");
});

test("reports a missing heading", () => {
  assertViolation(replaced("### Confirmation\n\nRun the sample test.\n\n", ""), "expected heading ### Confirmation");
});

test("reports a heading out of order", () => {
  const swapped = replaced("## Decision Drivers\n\n* A sample driver.\n\n", "").replace(
    "## Pros and Cons of the Options",
    "## Decision Drivers\n\n* A sample driver.\n\n## Pros and Cons of the Options",
  );
  assertViolation(swapped, "out of order");
});

test("reports an empty section, also when it holds only a comment", () => {
  assertViolation(replaced("Run the sample test.\n", ""), "section ### Confirmation is empty");
  assertViolation(replaced("* A sample driver.", "<!-- drivers go here -->"), "section ## Decision Drivers is empty");
});

test("reports a template placeholder in the body", () => {
  assertViolation(
    replaced('"Keep the sample", because it is the sample.', '"{title of option 1}", because {justification}.'),
    "template placeholder",
  );
});

test("accepts braces in inline code and fenced code blocks", () => {
  const record = replaced("Run the sample test.\n", "Run `node -e '{}'`.\n\n```ts\n// {not a placeholder}\n# not a heading\n```\n");
  assert.deepEqual(check({ "0001-keep-the-sample.md": record }), []);
});

test("reports an outcome without a chosen option", () => {
  assertViolation(replaced('Chosen option: "Keep the sample", because it is the sample.', "We keep it."), "must state the chosen option");
});

test("reports a chosen option that is not a considered option", () => {
  assertViolation(replaced('Chosen option: "Keep the sample"', 'Chosen option: "Keep a sample"'), "is not one of the Considered Options");
});

test("accepts a chosen option wrapped over two lines", () => {
  const record = replaced("* Keep the sample\n", "* Keep the sample,\n  for good\n").replace(
    'Chosen option: "Keep the sample"',
    'Chosen option: "Keep the sample,\nfor good"',
  );
  assert.deepEqual(check({ "0001-keep-the-sample.md": record }), []);
});

test("reports an option that opens with a bullet", () => {
  assertViolation(replaced("Keeping means the sample file stays in the repository.\n\n", ""), "must open with a sentence");
});

test("reports bare issue references and vague link text", () => {
  assertViolation(replaced("A sample driver.", "Asked for in #1."), "not #1");
  assertViolation(replaced("A sample driver.", "See https://github.com/example/project/pull/2."), "not a bare URL");
  assertViolation(replaced("[html-cheat-sheet issue 1]", "[here]"), "not [here]");
});

test("reports an em dash", () => {
  assertViolation(replaced("A sample driver.", `A sample driver ${EM_DASH} with a dash.`), "em dash");
});

test("reports a bad file name, a reused number, and a gap", () => {
  assert.ok(check({ "1-Keep Sample.md": VALID }).some((v) => v.includes("expected a file name like")));
  assert.ok(
    check({ "0001-keep-the-sample.md": VALID, "0001-keep-another.md": VALID }).some((v) => v.includes("used by several files")),
  );
  assert.ok(check({ "0001-keep-the-sample.md": VALID, "0003-keep-a-third.md": VALID }).some((v) => v.includes("0002 is missing")));
});

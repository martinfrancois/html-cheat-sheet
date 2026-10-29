// Regenerates src/data/spec.json, the facts every entry's chapter, order, display and role come
// from. A test fails when an element in it has no entry.
//
// - Elements and obsolete elements: @webref/elements, W3C's curated extract of the HTML standard.
// - Section numbers and chapter titles: the standard's own headings; no package publishes them.
// - Default display: the standard's suggested browser stylesheet; no package publishes it.
// - Accessibility roles: HTML Accessibility API Mappings. aria-query, the usual package for
//   this, still maps <hgroup> to generic where the current spec says group, so it lags the spec.
// - Global attributes: the standard's attribute index. @mdn/browser-compat-data also lists
//   attributes from other specs (part, elementtiming, ...), which this cheat sheet leaves out.
import { writeFile } from "node:fs/promises";
import webref from "@webref/elements";
import { type HTMLElement, parse } from "node-html-parser";

const SPEC = "https://html.spec.whatwg.org/multipage/";
const AAM = "https://w3c.github.io/html-aam/";
const OUTPUT = new URL("../src/data/spec.json", import.meta.url);

type Item = { name: string; href: string; section?: string | null; display?: string; role?: string | null };

async function fetchDocument(url: string): Promise<HTMLElement> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  // Parse <pre> as markup: the suggested browser stylesheet sits in <pre><code> blocks.
  return parse(await response.text(), { blockTextElements: { script: true, style: true } });
}

const pages = new Map<string, Promise<HTMLElement>>();
const specPage = (name: string) => {
  if (!pages.has(name)) pages.set(name, fetchDocument(SPEC + name));
  return pages.get(name)!;
};

const text = (node: HTMLElement) => node.textContent.replace(/\s+/g, " ").trim();
const sectionNumber = (heading: HTMLElement | null | undefined) => heading?.querySelector(".secno")?.textContent.trim() ?? null;

// The heading that owns a fragment carries the section number, such as 4.5.1 for <a>.
async function section(href: string): Promise<string | null> {
  const url = new URL(href);
  const doc = await specPage(url.pathname.split("/").pop()!);
  let node: HTMLElement | null = doc.getElementById(decodeURIComponent(url.hash.slice(1)));
  while (node && !/^H[2-6]$/.test(node.tagName)) node = node.previousElementSibling ?? node.parentNode;
  return sectionNumber(node);
}

const { html } = await webref.listAll();
const isObsolete = (item: { href: string }) => item.href.includes("/obsolete.html");

const elements: Item[] = [];
for (const element of html.elements.filter((item) => !isObsolete(item))) {
  elements.push({ name: element.name, href: element.href, section: await section(element.href) });
}
// MathML and SVG come from their own specs; the HTML standard defines how to embed them.
for (const [name, fragment] of [
  ["math", "embedded-content-other.html#mathml"],
  ["svg", "embedded-content-other.html#svg-0"],
] as const) {
  elements.push({ name, href: SPEC + fragment, section: await section(SPEC + fragment) });
}
const obsolete: Item[] = html.elements.filter(isObsolete).map(({ name, href }) => ({ name, href }));
obsolete.sort((a, b) => a.name.localeCompare(b.name));

const chapterNumbers = [...new Set(elements.map((element) => element.section?.split(".").slice(0, 2).join(".")).filter((number): number is string => Boolean(number)))];
const toc = (await specPage("index.html")).querySelectorAll("ol.toc li");
const chapters = chapterNumbers
  .sort((a, b) => a.localeCompare(b, "en", { numeric: true }))
  .map((number) => {
    const entry = toc.find((li) => sectionNumber(li) === number);
    return { section: number, title: entry ? text(entry.querySelector("a")!).replace(number, "").trim() : number };
  });

// The standard's attribute index links these rows to another attribute's definition (tabindex,
// id). Each entry holds the wrong link and the right one. The script stops when the index no
// longer has the wrong link, so the correction is removed once the standard fixes it.
const INDEX_CORRECTIONS: Record<string, { wrong: string; right: string }> = {
  headingoffset: { wrong: "interaction.html#attr-tabindex", right: "sections.html#attr-headingoffset" },
  headingreset: { wrong: "interaction.html#attr-tabindex", right: "sections.html#attr-headingreset" },
  slot: { wrong: "dom.html#the-id-attribute", right: "dom.html#attr-slot" },
};

const globalAttributes: Item[] = [];
for (const row of (await specPage("indices.html")).getElementById("attributes-1")!.querySelectorAll("tbody tr")) {
  const link = row.querySelector("td a");
  if (!link || text(link) !== "HTML elements") continue;
  const name = text(row.querySelector("th")!);
  const correction = INDEX_CORRECTIONS[name];
  if (correction && link.getAttribute("href") !== correction.wrong) {
    throw new Error(`the attribute index now links ${name} to ${link.getAttribute("href")}: remove its entry from INDEX_CORRECTIONS`);
  }
  globalAttributes.push({ name, href: new URL(correction?.right ?? link.getAttribute("href")!, SPEC).href });
}
// Two families have no single row in that table.
globalAttributes.push(
  { name: "data-*", href: `${SPEC}dom.html#embedding-custom-non-visible-data-with-the-data-*-attributes` },
  { name: "on*", href: `${SPEC}webappapis.html#event-handlers-on-elements,-document-objects,-and-window-objects` },
);
if (globalAttributes.length < 20) throw new Error(`only ${globalAttributes.length} global attributes parsed, the index layout probably changed`);

// Default display: the first rule in the suggested browser stylesheet that selects the element
// by name alone. Elements no rule selects keep CSS's initial value, inline.
const displays = new Map<string, string>();
for (const block of (await specPage("rendering.html")).querySelectorAll("pre > code.css")) {
  const css = block.textContent.replace(/@namespace[^;]*;/g, "");
  for (const [, selectors, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const display = body!.match(/display:\s*([a-z-]+)/)?.[1];
    if (!display) continue;
    for (const selector of selectors!.split(",").map((part) => part.trim())) {
      if (/^[a-z][a-z0-9]*$/.test(selector) && !displays.has(selector)) displays.set(selector, display);
    }
  }
}
// The standard describes these in prose, not in the stylesheet: headings through :heading, and
// textarea, meter and progress as widgets "expected to render as an 'inline-block' box"
// (https://html.spec.whatwg.org/multipage/rendering.html#widgets).
const HEADINGS = ["h1", "h2", "h3", "h4", "h5", "h6"];
for (const name of HEADINGS) displays.set(name, displays.get(name) ?? "block");
for (const name of ["textarea", "meter", "progress"]) displays.set(name, displays.get(name) ?? "inline-block");

// Role: the WAI-ARIA row of each element's section. An element with several sections (a with
// and without href, aside in different scopes) takes the plain one.
const roles = new Map<string, string | null>();
for (const heading of (await fetchDocument(AAM)).querySelectorAll('h4[id^="el-"]')) {
  const id = heading.id.slice(3);
  const row = heading.parentNode?.nextElementSibling?.querySelectorAll("tr").find((tr) => /wai-aria/i.test(tr.querySelector("th")?.textContent ?? ""));
  const mapping = row ? text(row.querySelector("td")!) : "";
  // "image or img role" names the ARIA 1.3 role first; keep that one.
  const role = /^No corresponding role/.test(mapping) ? null : (mapping.match(/^([a-z]+)(?: or [a-z]+)? role/)?.[1] ?? null);
  for (const name of id === "h1-h6" ? HEADINGS : [id]) roles.set(name, role);
  // <input> has one section per type; the element itself takes the text type's role.
  if (id === "input-text") roles.set("input", role);
}
if (roles.size < 100) throw new Error(`only ${roles.size} HTML-AAM roles parsed, the page layout probably changed`);

for (const element of [...elements, ...obsolete]) {
  element.display = displays.get(element.name) ?? "inline";
  element.role = roles.get(element.name) ?? null;
}

await writeFile(OUTPUT, `${JSON.stringify({ chapters, elements, globalAttributes, obsolete }, null, 2)}\n`);
console.log(`${elements.length} elements in ${chapters.length} chapters, ${globalAttributes.length} global attributes, ${obsolete.length} obsolete elements`);

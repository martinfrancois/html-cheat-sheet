import bcd from "@mdn/browser-compat-data";
import { type CollectionEntry, getCollection } from "astro:content";
import { marked } from "marked";
import { CHIP_ROW } from "./chips.ts";
import { roles } from "./roles.ts";
import { attributeCompatKey, type BaselineStatus, baseline, elementCompatKey, weakest, worthABadge } from "./baseline.ts";
import { chapters, compareSections, isObsolete, specAttribute, specElement } from "./spec.ts";

// MDN's own URLs from its compat data, so a renamed MDN page follows with the next update.
function mdnUrl(compatKey: string): string | undefined {
  const data = compatKey.split(".").reduce<Record<string, unknown> | undefined>((node, part) => node?.[part] as Record<string, unknown> | undefined, bcd as unknown as Record<string, unknown>);
  return (data?.__compat as { mdn_url?: string } | undefined)?.mdn_url;
}


marked.use({
  renderer: {
    codespan({ text }) {
      const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      const row = (value: string) => `<span class="whitespace-nowrap">${escape(value)}</span>`;
      if (text.length <= CHIP_ROW) return `<code class="whitespace-nowrap">${escape(text)}</code>`;
      // A longer chip breaks at its spaces, and a word too long for one row after a slash, such as
      // application/ x-www-form-urlencoded.
      const words = text.split(/(\s+)/).map((word) =>
        /^\s*$/.test(word) ? word : word.length <= CHIP_ROW ? row(word) : word.split(/(?<=\/)/).map((part) => (part.length <= CHIP_ROW ? row(part) : escape(part))).join("<wbr>"),
      );
      return `<code>${words.join("")}</code>`;
    },
  },
});

export const inline = (markdown: string): string => marked.parseInline(markdown, { async: false });

// The text of inline HTML from inline(): its tags dropped and the entities marked writes decoded.
const ENTITIES: Record<string, string> = { "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&amp;": "&" };
const plain = (html: string): string => html.replace(/<[^>]+>/g, "").replace(/&(?:lt|gt|quot|#39|amp);/g, (entity) => ENTITIES[entity]!);

// An attribute's summary, led by its default value when it has one: "Default: `text`. The kind of
// control." Every attribute shows its default in this one place and form.
const attributeSummary = (attribute: { default?: string; summary: string }): string =>
  inline(attribute.default ? `*Default: \`${attribute.default}\`.* ${attribute.summary}` : attribute.summary);

export interface ElementView {
  name: string;
  summary: string;
  display: string;
  // Null where HTML-AAM gives the element no role of its own.
  role: { name: string; gloss: string; href: string; context?: string } | null;
}

export interface ExampleView {
  id: string;
  title: string;
  // The title as text, for the live output frame's title attribute.
  plainTitle: string;
  code: string;
  badges: { key: string; status: BaselineStatus; foreign: boolean }[];
}

export interface EntryView {
  id: string;
  kind: "element" | "attribute" | "obsolete";
  // Display names: "<b>" for elements, "popover" for attributes.
  names: string[];
  elements: ElementView[];
  summary?: string;
  replacement?: string;
  attributes: { name: string; on?: string; required: boolean; summary: string }[];
  notes: string[];
  baseline?: BaselineStatus;
  mdn?: string;
  spec: { href: string; section?: string | null };
  examples: ExampleView[];
  // What the search box matches: names weigh most, then attribute names, then descriptions.
  search: { names: string[]; attributes: string[]; text: string };
}

export interface ChapterView {
  id: string;
  number?: string;
  title: string;
  entries: EntryView[];
}

function elementView(element: NonNullable<CollectionEntry<"entries">["data"]["elements"]>[number]): ElementView {
  const spec = specElement(element.name);
  const role = element.role ?? spec.role;
  const meaning = role ? roles.get(role) : undefined;
  if (role && !meaning) throw new Error(`<${element.name}>: role ${role} has no gloss in src/lib/roles.ts`);
  return { name: element.name, summary: inline(element.summary), display: element.display ?? spec.display ?? "inline", role: role && meaning ? { name: role, ...meaning, context: element.roleContext && inline(element.roleContext) } : null };
}

function toView(entry: CollectionEntry<"entries">): EntryView {
  const { data } = entry;
  const elements = (data.elements ?? []).map(elementView);
  const attributeName = data.attribute?.name;
  const kind = attributeName ? "attribute" : isObsolete(elements[0]!.name) ? "obsolete" : "element";
  const spec = attributeName ? specAttribute(attributeName) : specElement(elements[0]!.name);
  // A badge about another element or attribute, such as commandfor in the headingreset example,
  // names its feature, so it isn't read as the entry's own support.
  const own = attributeName ? [attributeCompatKey(attributeName)] : elements.map((element) => elementCompatKey(element.name));
  const foreign = (key: string) => !own.some((ownKey) => key === ownKey || key.startsWith(`${ownKey}.`));
  const examples = data.examples.map((example, index) => ({
    id: `${entry.id}-example-${index + 1}`,
    title: inline(example.title),
    plainTitle: plain(inline(example.title)),
    code: example.code,
    badges: example.compat
      .map((key) => ({ key, status: baseline(key), foreign: foreign(key) }))
      .filter((item): item is { key: string; status: BaselineStatus; foreign: boolean } => {
        if (!item.status) throw new Error(`${entry.id}: unknown web-features compat key ${item.key}`);
        return worthABadge(item.status);
      }),
  }));
  const names = attributeName ? [attributeName] : elements.map((element) => `<${element.name}>`);
  return {
    id: attributeName ? `attr-${attributeName.replace(/[^a-z]/g, "")}` : entry.id,
    kind,
    names,
    elements,
    summary: data.attribute ? attributeSummary(data.attribute) : undefined,
    replacement: data.replacement ? inline(data.replacement) : undefined,
    attributes: data.attributes.map((attribute) => ({ ...attribute, summary: attributeSummary(attribute) })),
    notes: (data.notes ?? []).map(inline),
    baseline: attributeName
      ? baseline(attributeCompatKey(attributeName))
      : kind === "obsolete"
        ? undefined
        : // An element that only an example needs, such as <selectedcontent> next to <select>,
          // gets its badge on that example, so the entry doesn't warn about the element it's for.
          weakest(
            elements
              .map((element) => elementCompatKey(element.name))
              .filter((key) => !data.examples.some((example) => example.compat.includes(key)))
              .map(baseline),
          ),
    mdn: mdnUrl(attributeName ? attributeCompatKey(attributeName) : elementCompatKey(elements[0]!.name)),
    spec: { href: spec.href, section: spec.section },
    examples,
    search: {
      names: attributeName ? [attributeName] : elements.map((element) => element.name),
      attributes: data.attributes.map((attribute) => attribute.name),
      text: [data.attribute?.summary, ...(data.elements ?? []).map((element) => element.summary), ...(data.notes ?? [])].filter(Boolean).join(" ").replace(/[`*]/g, ""),
    },
  };
}

export async function loadChapters(): Promise<ChapterView[]> {
  const views = (await getCollection("entries")).map(toView);
  const sectionOf = (view: EntryView) => view.spec.section ?? "";
  const result: ChapterView[] = chapters.map((chapter) => ({
    id: `chapter-${chapter.section.replace(".", "-")}`,
    number: chapter.section,
    title: chapter.title,
    entries: views
      .filter((view) => view.kind === "element" && sectionOf(view).startsWith(`${chapter.section}.`))
      .sort((a, b) => compareSections(sectionOf(a), sectionOf(b))),
  }));
  const byName = (a: EntryView, b: EntryView) => a.names[0]!.localeCompare(b.names[0]!);
  result.push(
    { id: "global-attributes", title: "Global attributes", entries: views.filter((view) => view.kind === "attribute").sort(byName) },
    { id: "obsolete", title: "Obsolete elements", entries: views.filter((view) => view.kind === "obsolete").sort(byName) },
  );
  return result.filter((chapter) => chapter.entries.length > 0);
}

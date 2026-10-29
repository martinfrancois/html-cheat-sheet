import spec from "../data/spec.json";

export interface SpecElement {
  name: string;
  href: string;
  section?: string | null;
  display?: string;
  role?: string | null;
}

export interface SpecChapter {
  section: string;
  title: string;
}

export const chapters: SpecChapter[] = spec.chapters;
export const specElements: SpecElement[] = spec.elements;
export const globalAttributes: SpecElement[] = spec.globalAttributes;
export const obsoleteElements: SpecElement[] = spec.obsolete;

const byName = new Map([...specElements, ...obsoleteElements].map((element) => [element.name, element]));
const attributesByName = new Map(globalAttributes.map((attribute) => [attribute.name, attribute]));

export function specElement(name: string): SpecElement {
  const element = byName.get(name);
  if (!element) throw new Error(`<${name}> is not in src/data/spec.json; run pnpm run sync-spec or fix the name`);
  return element;
}

export function specAttribute(name: string): SpecElement {
  const attribute = attributesByName.get(name);
  if (!attribute) throw new Error(`global attribute ${name} is not in src/data/spec.json`);
  return attribute;
}

export const isObsolete = (name: string): boolean => obsoleteElements.some((element) => element.name === name);

// Sorts spec section numbers such as 4.5.10 after 4.5.9.
export const compareSections = (a: string, b: string): number => a.localeCompare(b, "en", { numeric: true });

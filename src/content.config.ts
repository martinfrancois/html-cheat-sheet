import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// Inline Markdown: `code`, **bold**, *italic* and [links](https://...). Element and attribute
// names always go in backticks; a raw <tag> outside backticks would be parsed as HTML.
const text = z.string().trim().min(1);

const example = z.object({
  // Says what the example shows, such as "Mark the warning as important".
  title: text,
  // web-features compat keys, such as html.elements.input.type_week. The example shows a
  // badge when one of them is not Baseline widely available.
  compat: z.array(z.string()).default([]),
  code: z.string().trim().min(1),
});

// The value an attribute has when it's left out, such as text for <input type>. The page shows it
// the same way on every attribute, so the summary never has to say "without it you get ...".
const defaultValue = z.string().min(1).optional();

const attribute = z.object({
  name: z.string(),
  // The element the attribute belongs to, in an entry about several elements.
  on: z.string().optional(),
  // Shown as a "required" label next to the name. Optional is the normal case and isn't marked,
  // so the few attributes an element can't do without stand out.
  required: z.boolean().default(false),
  default: defaultValue,
  summary: text,
});

const element = z.object({
  name: z.string(),
  summary: text,
  // Display and role come from src/data/spec.json. Override only where the spec's
  // stylesheet or HTML-AAM has no single answer, and say why in a YAML comment.
  display: z.string().optional(),
  role: z.string().optional(),
  // When the role depends on context, which case it is and what the others get, continuing the
  // gloss after a semicolon: "for type="text"; each other type has its own, such as `checkbox`".
  roleContext: text.optional(),
});

const entries = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/entries" }),
  schema: z
    .object({
      // Element entries list one or more elements; a global attribute entry names the attribute.
      elements: z.array(element).min(1).optional(),
      attribute: z.object({ name: z.string(), default: defaultValue, summary: text }).optional(),
      // For obsolete elements: what to use instead.
      replacement: text.optional(),
      attributes: z.array(attribute).default([]),
      // Short points about accessibility or choosing the right element, one idea each, so a reader
      // can skim them. test/entries.test.ts caps their length.
      notes: z.array(text).min(1).optional(),
      examples: z.array(example).min(1),
    })
    .refine((entry) => Boolean(entry.elements) !== Boolean(entry.attribute), {
      message: "an entry describes either elements or one global attribute",
    }),
});

export const collections = { entries };

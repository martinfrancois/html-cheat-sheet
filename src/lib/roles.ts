// What each accessibility role means, in a few plain words, for the line under an element's
// summary. Each gloss restates the role's definition on its MDN page, or in WAI-ARIA 1.3 for the
// roles MDN has no page for. test/roles.test.ts fails when spec.json names a role missing here.
const MDN = "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/";
const ARIA = "https://w3c.github.io/aria/#";
const GRAPHICS_ARIA = "https://w3c.github.io/graphics-aria/#";

type Role = [string, { gloss: string; href: string }];
const mdn = (role: string, gloss: string): Role => [role, { gloss, href: `${MDN}${role}_role` }];
const aria = (role: string, gloss: string): Role => [role, { gloss, href: `${ARIA}${role}` }];
const graphics = (role: string, gloss: string): Role => [role, { gloss, href: `${GRAPHICS_ARIA}${role}` }];

export const roles: ReadonlyMap<string, { gloss: string; href: string }> = new Map([
  mdn("article", "a self-contained piece, such as a post or a comment"),
  aria("blockquote", "a quote from another source"),
  mdn("button", "a button that does something when pressed"),
  aria("caption", "visible text that names a figure, table or group"),
  mdn("cell", "a cell in a table"),
  aria("code", "a fragment of computer code"),
  mdn("columnheader", "a header cell that labels the cells of its column"),
  mdn("combobox", "a control that opens a list of options to pick from"),
  mdn("complementary", "a landmark that supports the main content, such as a sidebar"),
  mdn("definition", "the definition of a term"),
  aria("deletion", "content marked as removed"),
  mdn("dialog", "a dialog window on top of the page"),
  aria("emphasis", "stressed text"),
  mdn("figure", "a figure, such as an image or a code snippet, set apart from the text"),
  mdn("form", "a form, which becomes a landmark once it has a name"),
  mdn("generic", "a container with no meaning of its own"),
  graphics("graphics-document", "a drawing made of parts that screen readers can explore"),
  mdn("group", "a set of related items"),
  mdn("heading", "a heading for a page or a section"),
  aria("image", "an image"),
  aria("insertion", "content marked as added"),
  mdn("link", "a link to another page or another spot on this one"),
  mdn("list", "a list of items"),
  mdn("listbox", "a list to pick one or more options from"),
  mdn("listitem", "an item in a list"),
  mdn("main", "the landmark with the page's main content"),
  mdn("mark", "text highlighted for reference"),
  mdn("math", "a mathematical expression"),
  mdn("meter", "a measurement within a known range"),
  mdn("navigation", "a landmark with links for getting around"),
  mdn("option", "an option to pick in a list"),
  aria("paragraph", "a block of running text"),
  mdn("progressbar", "the progress of a long task"),
  mdn("region", "an important area of the page, a landmark"),
  mdn("row", "a row of cells in a table"),
  mdn("rowgroup", "a group of rows in a table"),
  mdn("search", "a landmark for searching"),
  aria("sectionfooter", "information about a section, such as who wrote it"),
  aria("sectionheader", "the introduction of a section, such as its heading"),
  mdn("separator", "a divider between sections"),
  mdn("status", "advisory information that's announced when it changes"),
  aria("strong", "important, serious or urgent content"),
  aria("subscript", "subscript characters"),
  aria("superscript", "superscript characters"),
  mdn("table", "a table of data in rows and columns"),
  mdn("term", "a word or phrase that a definition explains"),
  mdn("textbox", "a field for free-form text"),
  aria("time", "a specific point in time"),
]);

import assert from "node:assert/strict";
import { test } from "node:test";
import { codeToHtml } from "shiki";
import { breakAtSeams, codeTheme, keepAttributesTogether, keepIndentWithFirstToken } from "../src/lib/code-theme.ts";

// The code as the page shows it, with "|" where a long line may wrap: a <wbr> or a space.
async function seams(code: string): Promise<string> {
  const html = await codeToHtml(code, { lang: "html", theme: codeTheme, transformers: [keepAttributesTogether, keepIndentWithFirstToken, breakAtSeams] });
  const entities: Record<string, string> = { "&#x3C;": "<", "&#x26;": "&", "&#x27;": "'", "&quot;": '"' };
  return html
    .replace(/<wbr>/g, "|")
    .replace(/<[^>]+>/g, "")
    .replace(/&#x3C;|&#x26;|&#x27;|&quot;/g, (entity) => entities[entity]!)
    .replace(/(?<=\S) (?=\S)/g, "| ");
}

// A long line wraps at a seam of the code, not inside a word: docs/agents/visual-design.md
test("an attribute too long for a narrow phone's row may wrap between its name and its value", async () => {
  assert.equal(await seams(`<section aria-labelledby="comments">`), `<section| aria-labelledby=|"comments">`);
});

// A wider screen then wraps before it, not at its "=".
test("a shorter attribute stays whole", async () => {
  assert.equal(await seams(`<button commandfor="confirm" command="show-modal">`), `<button| commandfor="confirm"| command="show-modal">`);
});

test("a tag right after another may wrap between them, and a closing tag stays whole", async () => {
  assert.equal(await seams(`<button><selectedcontent></selectedcontent></button>`), `<button>|<selectedcontent>|</selectedcontent>|</button>`);
  assert.equal(await seams(`<rp>(</rp><rt>あ</rt>`), `<rp>|(|</rp>|<rt>|あ|</rt>`);
});

test("markup inside an attribute value may wrap before its closing tag, never inside it", async () => {
  assert.equal(await seams(`<iframe srcdoc="<p>Open Monday to Friday.</p>">`), `<iframe| srcdoc=|"|<p>Open| Monday| to| Friday.|</p>|">`);
});

test("a script may wrap before a member that follows a call", async () => {
  const shown = await seams(`<script>\n  time.textContent = new Date().toLocaleTimeString();\n</script>`);
  assert.match(shown, /Date\(\)\|\.toLocaleTimeString/);
});

test("an indented line never wraps between its indentation and its first token", async () => {
  assert.match(await seams(`<div>\n  <section aria-labelledby="comments"></section>\n</div>`), /\n {2}<section\|/);
});

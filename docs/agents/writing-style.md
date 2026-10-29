# Writing style

## Scope

Wording for text on the page (summaries, usage notes, button labels, messages), for docs and ADRs,
and for commit messages and pull requests.

## Everywhere

- Use plain words and short sentences, one idea per sentence. Many readers don't speak English as a
  first language.
- Write in the active voice and name who does what: "the build fails", not "an error is raised".
- Use sentence case for headings and labels: "Global attributes", not "Global Attributes".
- Never use em dashes. Use a full stop or a comma.
- Use straight quotes, not curly ones.
- Cut marketing words ("powerful", "seamless", "blazing fast") and filler ("it's important to note",
  "in order to"). Give the fact or the number instead.
- Write numbers with their unit: "24x24 CSS px", "7:1".

## Text on the page

- Use contractions everywhere, consistently: "doesn't", "don't", "isn't", "it's", "you'll". The page
  talks to the reader in a friendly, conversational tone. This is a standing rule from the owner,
  and `test/entries.test.ts` rejects the long forms in entries.
- Name things the way users know them. Say "element", "attribute", and "Edit", not internal names
  such as entry IDs or component names. Use the HTML standard's wording for HTML concepts.
- Use the terms in `CONTEXT.md` and avoid the words it lists under "Avoid". For example, "tag" means
  the `<p>` text in markup, never the element.
- Label a button with what it does: "Copy code", "Reset example". Don't use "Click here" or "OK".
- A message that reports a problem says what happened and what the reader can do next.
- Write summaries and usage notes for someone who knows a little HTML. Explain a term the first time
  an entry uses it, or link to MDN.
- Say what happens or what to do in concrete words, never as an abstract rule that the reader has
  to unpack. The owner found these confusing, and each now has a concrete version:
  - "bold is never the only sign of a warning": instead, "say a warning in words too, such as
    'Warning:', not just in bold";
  - "the outline gains a level that isn't one": instead, "people who jump between headings would
    take it for a new section".
- Explain jargon in the same sentence, or don't use it: "inert" became "blocks clicks and focus",
  and "top layer" gets "above everything else on the page".
- Say what a vague reference points to: not "the standard changed it" or "set `open` yourself",
  but what it changed from and to, or what the reader does instead of what.
- Notes in one entry must agree with each other and with the summary. Read them together: one
  `<b>` note said it "adds no meaning at all" while the next said it "tells readers the words
  deserve attention".
- Before showing new or changed text, read it as a learner would and ask of each sentence: would
  someone who knows a little HTML know what to do, and why, without asking?

## Docs, ADRs, and pull requests

- Wrap Markdown at about 100 characters.
- In docs, ADRs and agent pages, say "the owner" or "martinfrancois", never a first name.
- Pull requests, issues, comments and commit messages posted under the owner's account speak as
  the owner, in the first person: "I turned off Cloudflare's Real User Monitoring", not "the owner
  turned off". Readers take what an account posts as written by that person.
- Everyone else writes in their own first person and mentions the owner's work as
  `@martinfrancois`: "@martinfrancois turned off Real User Monitoring, so I measure it in PostHog".
- Link issues and pull requests with link text that names them, not a bare `#12` or a bare URL.
- Commit subjects are plain imperative sentences without a prefix, see
  [Default workflow](default-workflow.md#commits-and-pull-requests).

## Enforcement

`test/adr.test.ts` rejects em dashes and bare issue references in ADRs. Review checks the rest.

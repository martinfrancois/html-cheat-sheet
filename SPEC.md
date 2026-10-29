# HTML cheat sheet specification

Status: target contract for version 2, the makeover. Every element and global attribute of the
standard has an entry. Section 16.1 lists what isn't done yet and section 17 the decisions
martinfrancois still has to make. Last checked against the code, the tests and the GitHub settings
on 2026-10-29.

Purpose: define what the HTML cheat sheet at https://html.fmartin.ch shows and does, who it is for,
and how it is built, tested and published.

This document is the contract for the page. The implementation, the tests and the docs MUST match
it. It records the decisions of martinfrancois. A later explicit decision by martinfrancois
replaces an earlier one about the same thing.

## Normative language

The key words `MUST`, `MUST NOT`, `SHOULD`, `SHOULD NOT` and `MAY` are to be read as described in
RFC 2119 and RFC 8174.

## Where the rest lives

This file says what the page must do. It doesn't repeat the rules in the other docs; it links to
them.

| File | Holds |
| --- | --- |
| `CONTEXT.md` | The terms this file uses: element, global attribute, entry, chapter, live output, comparison and the rest |
| `docs/adr/` | Why each choice was made and what lost |
| `docs/agents/` | How to work on the repository: entries, tests, accessibility numbers, visual rules, writing style, libraries, dependencies |
| `README.md` | What the page is, for visitors and contributors |

## 1. Problem statement

The previous version was one hand-written `index.html`: a table of 40 rows covering about 60
elements, built on jQuery 3.2.1, Materialize 0.99 and CodeMirror 5. The table was 1550 px wide, had
no phone layout and no dark mode, and left out common elements such as `<figure>`, `<dialog>` and
`<label>`. Some of its data was wrong. It described `<b>` and `<strong>` as the same thing, marked
`<hgroup>` as not to be used, and used the HTML4 inline and block split. Each example was written
twice, once as code and once as output, and the two copies had drifted apart.

The page MUST be a reference people keep open: every element and global attribute of the WHATWG
HTML Living Standard, each with the facts people look up and an example whose code sits next to
what the browser renders for it.

## 2. Audience

- Web developers who know a little HTML and want to check what an element is for, which attributes
  matter, whether browsers support it, and how it looks.
- Readers on phones, on the inner screen of a foldable, and on desktops.
- Readers who don't speak English as a first language. The page uses plain words and short
  sentences.
- Readers who use a keyboard, a screen reader, zoom or their own text spacing.
- Readers with a bad connection, such as in a training or at a conference.

## 3. Goals and non-goals

Goals:

- Cover the whole standard, with correct facts taken from their sources.
- Show the difference between similar elements with examples, not only with words.
- Let a reader change an example and see the result right away.
- Work on every screen size, in light and dark mode, offline after the first visit.
- Score 100 in every Lighthouse category on desktop and as close to 100 as possible on mobile,
  without a change a reader would notice, such as hiding part of the page from find in page.
  [ADR 0012](docs/adr/0012-create-live-output-frames-near-the-screen.md) and
  [ADR 0018](docs/adr/0018-skip-rendering-entries-off-screen.md) have the numbers.
- Meet the accessibility rule in section 10.
- Keep dependencies current without manual review, with tests as the gate.

Non-goals:

- A print layout.
- Translations. The page is in English only.
- ARIA attributes as entries.
- One page per chapter, or a list that hides each entry's details behind a click. Everything stays
  on one page, so the browser's find in page reaches every entry.
- Opening `index.html` from a checkout without a build.
  [ADR 0002](docs/adr/0002-build-the-cheat-sheet-with-astro-and-tailwind.md) records that trade.
- Cookies, a consent banner, or session replays.

## 4. Coverage

- `src/data/spec.json` is the list of what the page covers. `pnpm run sync-spec` generates it from
  the standard, HTML-AAM and `@webref/elements`; nothing else changes it. On 2026-10-29 it holds
  115 elements (the 113 of the standard plus `<svg>` and `<math>`), 33 global attributes and 29
  obsolete elements, 177 names in all.
- Every name MUST appear in exactly one entry. An entry covers one element, a few elements that
  only make sense together, or one global attribute.
- The event handler attributes share one entry, `on*`, and the custom data attributes share one,
  `data-*`.
- An obsolete element MUST NOT share an entry with a conforming one. Its entry names the modern
  replacement.
- When the standard adds an element, the page MUST get an entry for it. The coverage test fails
  until it has one.

## 5. Chapters and order

- Chapters follow the standard, in its order: The document element, Document metadata, Sections,
  Grouping content, Text-level semantics, Edits, Embedded content, Tabular data, Forms,
  Interactive elements, Scripting. Global attributes and then Obsolete elements come last.
- Entries in a chapter follow the standard's section numbers.

## 6. Entry content

Each entry MUST show, in this order:

1. The element names or the attribute name as its heading, with links to MDN and to the
   standard's section right after the name.
2. A support badge (section 9.5) where support is worth knowing, or "Obsolete, don't use" for an
   obsolete element.
3. What each element is for, in one or two sentences based on the standard's definition.
4. For each element, its default display as "Default CSS: `display: block`", and its accessibility
   role as "Accessibility role: `group`, a set of related items", with the role linking to its
   definition, or "none of its own". A bare "Role: group" or "Display" is not enough. When the role
   depends on context, such as an `<input>` type, the row says which case it shows and what the
   others get. Elements of one entry that share both facts, such as `<h1>` to `<h6>`, show them
   once, under all their summaries.
5. For an obsolete element, "Use instead:" and the replacement.
6. Key attributes: the two to five attributes people reach for most, each with one sentence. In an
   entry about several elements, an attribute that only some of them take says which one. A required
   attribute is marked "required"; an attribute with a default value starts with "*Default:
   `text`.*"; one with more values than fit in a sentence links the full list as "all values".
7. "Good to know": usage notes about accessibility or about choosing the right element, as separate
   points of at most 140 characters, one idea each. Never a paragraph. Advice says why in the same
   point, or links a source that does. An obsolete element's entry MAY leave it out when the
   replacement already says everything worth knowing.
8. The examples, as section 7 describes.

Every fact about HTML comes from the standard, HTML-AAM, `web-features` or MDN, never from memory.
[Content entries](docs/agents/content-entries.md) lists the source of each field.

### 6.1 Comparisons

Elements that are easy to mix up, such as `<b>` and `<strong>` or `<i>` and `<em>`, share an entry.
The entry MUST show the difference:

- one example that uses every element of the entry, each in a sentence where it is the right
  choice;
- each element's accessibility role, which is the visible difference when two elements look the
  same;
- a usage note on when to pick which.

A sentence that only says there is a difference is not enough.

## 7. Examples

- An entry writes each example once. The page shows that text both as highlighted code and as live
  output, so the two can't disagree.
- An entry has one example. It gets a second only when the second shows something the first can't,
  such as a newly available feature next to the version that works everywhere.
- An example is valid, conforming HTML that a real page would contain, with realistic text. Form
  controls have labels, images have `alt`, frames have `title`, tables have header rows.
- An example shows how browsers render the element by default. It MUST NOT be styled to look nicer.
  CSS goes into an example only when the CSS is the lesson, such as the replacement for an obsolete
  element.
- An example links only to `https://example.com` or inside itself, so its live output works
  offline.

[Content entries](docs/agents/content-entries.md) has the full rules for writing examples.

## 8. Page layout

- One page. A header stays at the top while scrolling, with the site name `<html> cheat sheet`, the
  search box and the theme button. A skip link leads to the entries.
- No introduction: the site name, the index and the badges' own text say what the page holds.
- Once the first screen is scrolled away, a round link at the bottom right leads back to the top.
  It jumps there without a smooth scroll, which on a page this long would take seconds.
- The index sits above the entries at full width, one row per chapter: the chapter title on the
  left, its entry names flowing to the right. There is no sidebar. On screens narrower than 40rem
  the index starts folded behind an "Index" button, so the entries come first.
- The chapters follow, each with its heading and its entries.
- Every entry has an anchor: the element name, or `attr-<name>` for a global attribute. Each element
  in an entry about several elements has its own anchor too, such as `#strong`.
- The layout MUST work at every width from 320 CSS px up without sideways scrolling. Phones (about
  390 px), the inner screen of a foldable (about 884 px) and desktops (about 1440 px) are the widths
  to review.
- A footer names the data sources, links the source code and gives the license and author.

## 9. Behavior

### 9.1 Search

- One search box, in a search landmark, labelled "Search elements and attributes", with the
  placeholder "Search elements". The placeholder MUST fit whole on a phone and on the inner screen
  of a foldable.
- Typing filters the entries. Search tolerates one typo per word, so "dialgo" finds `<dialog>`.
  Every word must match somewhere in an entry, in any order. Angle brackets and slashes are
  ignored, so `<dialog>` works too.
- Index rows and chapters without a match are hidden. A status line says how many entries match,
  or that nothing matches. Clearing the box shows everything again.
- The `/` key focuses the search box when the reader isn't typing somewhere else. The page declares
  it with `aria-keyshortcuts` and shows no `/` hint next to the box.
- Search uses uFuzzy, the library martinfrancois's website uses.
  [ADR 0010](docs/adr/0010-search-with-ufuzzy.md) records the choice.

### 9.2 Theme

- The page has a light and a dark theme. It follows the system setting until the reader clicks the
  theme button. Only that click stores a choice, `light` or `dark`, in local storage. There is no
  "System" option.
- The theme button is one icon button: a moon in light mode, a sun in dark mode. Its label and
  tooltip say what a click does: "Switch to dark mode" or "Switch to light mode".
- A stored choice applies before the first paint, so the other theme never flashes.
- In dark mode, live output uses the browser's own dark defaults.

### 9.3 Live output

- Each example's live output renders in a sandboxed frame built from the example's code, with the
  browser's default styles. The frame has no access to the page. Scripts, forms, modal dialogs and
  popovers inside it work.
  [ADR 0003](docs/adr/0003-render-live-output-in-sandboxed-iframes.md) records why.
- A frame renders when it comes near the viewport, not at page load.
- A frame's height follows its content. It grows to show an open modal dialog or popover whole and
  shrinks again after it closes.
- Each frame has a title: "Live output: " and the example's title.

### 9.4 Code, copy and edit

- The example's title is the header of its code block: the title and any support badges on the
  left, the Copy and Edit buttons on the right, a thin line below. On wide screens the live output
  sits next to the code; on narrow ones it comes after it.
- Copy puts the code on the clipboard. Its icon turns into a check mark and its label into
  "Copied" for two seconds. When the clipboard isn't available, the code gets selected and the
  label says to copy it with the keyboard.
- Edit turns the code into an editor, CodeMirror 6, loaded on the first click so readers who never
  edit never download it. The live output updates as the reader types. Reset brings back the
  original code and moves focus back to Edit.
  [ADR 0004](docs/adr/0004-edit-examples-with-codemirror-6-loaded-on-demand.md) records the choice.
- Copy, Edit, Reset and the theme button are icon buttons. Each has a label that also shows as a
  tooltip on hover and on keyboard focus, and is at least 44x44 CSS px.

### 9.5 Support badges

- An entry or an example shows a badge only when support is worth knowing: the feature isn't
  Baseline widely available, or became widely available only recently. Features that were
  widely available before Baseline started tracking get no badge.
- The badge text is short: "Available for 91% of visitors", or "Widely available since 2024". The
  share is the global usage share of the browsers that support the feature.
- The whole badge is a link to the feature's page on webstatus.dev, which shows each browser, with
  an arrow icon so it reads as a link without hovering. The Baseline level and the browsers that
  lack the feature go in its tooltip, not its text.
- A badge names the feature, such as `<input type="month">`, only when an example has more than
  one badge, or when the feature belongs to another element or attribute than the entry's, such
  as `<button commandfor>` in the `headingreset` example.
- A feature that no released browser supports yet reads "Not in any browser yet", not "Available
  for 0% of visitors".
- The page MUST NOT say a feature "doesn't work in every browser" without the share and the link.

### 9.6 Offline and updates

- After the first visit, the page, its live output and the editor work without a connection.
  [ADR 0006](docs/adr/0006-offline-support-with-a-service-worker.md) records how.
- A new deploy installs in the background. The page then shows "A new version is ready." with a
  Reload button, and keeps the old version until the reader clicks it.
- Browsers can install the page as an app from its web manifest.
- Fonts, scripts, styles and images come from the site itself.

### 9.7 Analytics

- The page sends usage data to its own PostHog project in the EU: page views, searches that find
  nothing (sent once typing pauses), and clicks on Edit and Copy. It also sends the Core Web Vitals
  each reader's browser measures (LCP, INP and CLS), plus FCP, so martinfrancois sees how fast the
  page is for real readers. Only Chromium-based browsers measure CLS.
- It also sends the page's script errors, including ones from before PostHog started, and an
  `unsupported_browser` event naming the features a reader's browser lacks, so martinfrancois sees
  when readers' browsers break the page.
- A reader whose browser lacks a feature the page needs sees a notice at the top of the page naming
  their browser and version, and the oldest versions of Chrome, Edge, Firefox and Safari that have
  every feature it needs, on desktop and phone separately where they differ. [ADR 0021](docs/adr/0021-tell-readers-when-their-browser-is-too-old.md) records
  the choice.
- It sets no cookies, stores nothing on the reader's device and records no sessions, so it needs no
  consent banner.
- The PostHog script loads two seconds after the page, and only when the build had a PostHog key. It
  is the page's only request to a third party.
  [ADR 0013](docs/adr/0013-measure-usage-and-web-vitals-with-cookieless-posthog.md) records
  the choice.

## 10. Accessibility

- The page MUST meet WCAG 2.2 level AA everywhere, and level AAA for color contrast and text
  presentation, in both themes. Small text needs 7:1. Large text (24 px, or 18.66 px at weight 700)
  needs 3:1. Non-text parts and focus indicators need 3:1. Decoration isn't exempt.
- [Accessibility](docs/agents/accessibility.md) has the full table of numbers and how each is
  checked. [ADR 0007](docs/adr/0007-wcag-2-2-aa-with-aaa-contrast-and-text-presentation.md) records
  why.
- Live output shows the browser's defaults and is exempt from the page's colors and fonts. The
  frame, buttons and labels around it are not.
- Every control MUST be reachable with the keyboard and show a visible focus ring.

## 11. Visual design

- The layout groups by the Gestalt laws: proximity, similarity, common region and alignment.
  Things sit next to what they belong to.
- The page is compact. Chrome that would repeat on every entry or example is left out unless the
  reader needs it there each time.
- Labels use plain words a reader understands without looking them up.
- Colors pop: clean, barely tinted greys, with color from saturated accents. Inline code chips
  stand out clearly from the background.
- Text uses Atkinson Hyperlegible Next, code uses Atkinson Hyperlegible Mono, and the site name and
  entry headings use Martian Mono. All three are bundled with the site. Until they arrive, text is
  drawn in a system font sized to match, so the page barely moves when they swap in
  ([ADR 0017](docs/adr/0017-size-fallback-fonts-to-match-the-web-fonts.md)).
- [Visual design](docs/agents/visual-design.md) has the rules and the review steps.
- The color theme is "Cyan and pink": cyan for what you read and click, pink for structure, at
  full neon strength in dark mode and as blue and deep magenta in light mode.

## 12. Browser support for the page

- The page itself uses a web feature once it has been Baseline newly available for six months
  ([ADR 0016](docs/adr/0016-use-web-features-six-months-after-they-become-baseline.md)). A
  workaround for a feature that doesn't qualify yet has a test that fails once the feature does, so
  the workaround can go.
- The tests run in Chromium, Firefox and WebKit.
- Examples MAY show newer features. They carry a badge (section 9.5).

## 13. Data sources

| Data | Source |
| --- | --- |
| Elements, chapters, sections, obsolete elements, global attributes | The WHATWG HTML standard and `@webref/elements`, through `pnpm run sync-spec` |
| Default display | The standard's suggested browser stylesheet |
| Accessibility roles | HTML Accessibility API Mappings (HTML-AAM) |
| Baseline status | The `web-features` package |
| Share of visitors | `browserslist` and `caniuse-lite` usage data applied to `@mdn/browser-compat-data` versions |
| MDN links | `__compat.mdn_url` in `@mdn/browser-compat-data` |

Renovate keeps these packages current, so badges and links follow the data without manual work.

## 14. Tooling

- An Astro static site. Entries are YAML files under `src/content/entries/`, and the content schema
  in `src/content.config.ts` fails the build when a field is missing or empty.
- Tailwind CSS. Colors are theme tokens; nothing uses a one-off color.
- All code, scripts and tests are TypeScript. Node 24 runs them directly, so they use only erasable
  syntax.
- pnpm for every install and script, never npm or yarn.
  [ADR 0011](docs/adr/0011-manage-packages-with-pnpm.md) records the choice.
- A maintained, popular library for every solved problem instead of code written here. A library
  needs at least 100 stars on GitHub and a release in the last 12 months; exceptions are recorded
  with their reason. Its license must allow bundling into this MIT project.
  [Libraries](docs/agents/libraries.md) has the rules and
  [ADR 0009](docs/adr/0009-use-established-libraries-for-each-concern.md) the library for each
  concern.
- Every dependency is pinned to an exact version.

## 15. Testing, CI and dependency updates

- The tests MUST be strong enough that any dependency update, major, minor or patch, that passes CI
  can merge without a person reviewing it.
  [ADR 0008](docs/adr/0008-automerge-every-dependency-update-that-passes-ci.md) records the
  decision.
- CI runs on every pull request and every push to `main`: the type check, the unit tests, the build,
  and Playwright in the official container image. Playwright covers behavior in Chromium, Firefox
  and WebKit, accessibility with axe in both themes, visual snapshots in light and dark at phone and
  desktop widths, and offline use with the update notice.
- A new user-visible feature gets an end-to-end test of its main path. A fixed bug gets a test that
  fails without the fix. A dependency failure that CI missed gets the test that would have caught
  it.
- Snapshots change only after someone has looked at every diff image and found the change
  intended.
- Running the tests MUST NOT overload the machine they run on. The end-to-end tests default to two
  workers at the lowest CPU priority.
- Renovate proposes an update once the release is 7 days old; pnpm refuses younger versions too.
  Security fixes skip the wait. Renovate merges every update on its own once CI passes.
- [Testing](docs/agents/testing.md) and [Dependencies](docs/agents/dependencies.md) have the
  details.

## 16. Hosting and publishing

- GitHub Pages serves the page at https://html.fmartin.ch. The workflow
  `.github/workflows/deploy.yml` builds and deploys it on every push to `main`.
- Changes reach `main` through a pull request, merged by rebase.
- Cloudflare sits in front of GitHub Pages for the fmartin.ch zone. Its Rocket Loader stays on for
  the zone, so every script on the page carries `data-cfasync="false"` before any `src`, and none
  runs later than the page itself starts it.
  [ADR 0014](docs/adr/0014-opt-every-script-out-of-rocket-loader.md) records the choice.
  [Default workflow](docs/agents/default-workflow.md) has the steps.

### 16.1 Not done yet

Checked on 2026-10-29. Remove a line in the change that does it.

- Analytics: the PostHog EU project doesn't exist yet, and the repository has no
  `PUBLIC_POSTHOG_KEY` variable, so the deployed page sends nothing. The project needs cookieless
  server hash mode switched on.
- Hosting: GitHub Pages still publishes from a branch, not from the deploy workflow, and has no
  custom domain set. The DNS record for `html.fmartin.ch` exists and goes through the Cloudflare
  proxy. If GitHub can't issue its HTTPS certificate behind the proxy, martinfrancois has to switch
  that record to DNS only.

## 17. Open decisions

None at the moment.

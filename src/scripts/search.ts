import uFuzzy from "@leeoniya/ufuzzy";
import { track } from "./analytics.ts";

interface Searchable {
  names: string[];
  attributes: string[];
  text: string;
}

// Filters the entries with uFuzzy, the library fmartin.ch uses too. intraMode 1 allows one typo
// per word, so "dialgo" still finds <dialog>.
export function setupSearch(): void {
  const input = document.querySelector<HTMLInputElement>("#search-input");
  const status = document.querySelector<HTMLElement>("#search-status");
  if (!input || !status) return;
  const entries = [...document.querySelectorAll<HTMLElement>("[data-entry]")];
  const chapters = [...document.querySelectorAll<HTMLElement>("[data-chapter]")];
  const indexItems = [...document.querySelectorAll<HTMLElement>("[data-index-entry]")];
  const indexChapters = [...document.querySelectorAll<HTMLElement>("[data-index-chapter]")];
  const fuzzy = new uFuzzy({ intraMode: 1 });
  const haystack = entries.map((entry) => {
    const { names, attributes, text } = JSON.parse(entry.dataset.search ?? "{}") as Searchable;
    return [...names, ...attributes, text].join(" ").toLowerCase();
  });
  // Every word must match somewhere in the entry, in any order.
  const matching = (query: string) => {
    let result: Set<number> | undefined;
    for (const word of query.toLowerCase().split(/\s+/)) {
      const found = new Set(fuzzy.filter(haystack, word) ?? []);
      result = result ? new Set([...result].filter((index) => found.has(index))) : found;
    }
    return result ?? new Set<number>();
  };
  let reportTimer: ReturnType<typeof setTimeout> | undefined;

  const update = () => {
    const query = input.value.replace(/[<>/]/g, " ").trim();
    const indexes = query ? matching(query) : undefined;
    const visible = new Set(entries.filter((_, index) => !indexes || indexes.has(index)).map((entry) => entry.id));
    for (const entry of entries) entry.hidden = !visible.has(entry.id);
    for (const chapter of chapters) chapter.hidden = !chapter.querySelector("[data-entry]:not([hidden])");
    for (const item of indexItems) item.hidden = !visible.has(item.dataset.indexEntry ?? "");
    for (const chapter of indexChapters) chapter.hidden = !chapter.querySelector("[data-index-entry]:not([hidden])");

    status.textContent = !query ? "" : visible.size === 0 ? `Nothing matches "${query}".` : `${visible.size} ${visible.size === 1 ? "entry matches" : "entries match"}.`;

    clearTimeout(reportTimer);
    if (query && visible.size === 0) {
      // Wait until typing pauses, so "dial" on the way to "dialog" is not reported.
      reportTimer = setTimeout(() => track("search_no_results", { query: query.toLowerCase() }), 1500);
    }
  };

  input.addEventListener("input", update);
  addEventListener("keydown", (event) => {
    const typing = (event.target as HTMLElement).closest("input, textarea, select, [contenteditable], .cm-editor");
    if (event.key === "/" && !typing && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      input.focus();
      input.select();
    }
  });
}

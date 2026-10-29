// The index is one <details>, so it works without JavaScript. Where there is room it stays open
// and its toggle is hidden; on a phone it starts folded, so the entries come first. An inline
// script in src/pages/index.astro sets the first state before the first paint; this follows
// resizes. data-open-from holds the media query both use.
export function setupIndexNav(): void {
  const index = document.querySelector<HTMLDetailsElement>("#index");
  if (!index) return;
  const roomy = matchMedia(index.dataset.openFrom!);
  const sync = () => (index.open = roomy.matches);
  sync();
  roomy.addEventListener("change", sync);
}

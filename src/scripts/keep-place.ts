// Entries off screen have only an estimated height (docs/adr/0018), so the scroll offset a browser
// restores after a reload, Back or Forward no longer points at the entry the reader was on. The
// page keeps that entry and its distance from the top of the screen in the history entry, and
// scrolls back to it instead.
type Place = { id: string; top: number };

const placeIn = (state: unknown): Place | undefined => (state as { place?: Place } | null)?.place;

// The first entry that starts on screen, so the place doesn't depend on the height of what's above
// it in the same entry, such as a live output frame still loading; otherwise the entry that fills
// the screen.
function currentPlace(entries: HTMLElement[]): Place | undefined {
  const shown = entries.filter((entry) => !entry.hidden);
  const startsOnScreen = (entry: HTMLElement) => entry.getBoundingClientRect().top >= 0 && entry.getBoundingClientRect().top < innerHeight;
  const entry = shown.find(startsOnScreen) ?? shown.find((candidate) => candidate.getBoundingClientRect().bottom > 0);
  return entry && { id: entry.id, top: entry.getBoundingClientRect().top };
}

const afterTwoFrames = (callback: () => void) => requestAnimationFrame(() => requestAnimationFrame(callback));

// An entry is drawn, with its real height, only once it is near the screen, so the first jump puts
// its top on screen and the second moves to the reader's place. Entries drawn above it and live
// output frames that load change the height above it afterwards, and WebKit doesn't hold the
// screen in place when they do, so the place is held until the reader scrolls or does anything.
function scrollToPlace(place: Place): void {
  const entry = document.getElementById(place.id);
  if (!entry) return;
  let placedAt = scrollY;
  const alignAt = (top: number) => {
    scrollTo(0, scrollY + entry.getBoundingClientRect().top - top);
    placedAt = scrollY;
  };
  const hold = new ResizeObserver(() => alignAt(place.top));
  const release = () => {
    hold.disconnect();
    removeEventListener("scroll", onScroll);
    for (const type of ["keydown", "pointerdown", "wheel", "touchstart"]) removeEventListener(type, release);
  };
  const onScroll = () => Math.abs(scrollY - placedAt) > 1 && release();
  alignAt(0);
  afterTwoFrames(() => {
    alignAt(place.top);
    hold.observe(document.body);
    addEventListener("scroll", onScroll, { passive: true });
    for (const type of ["keydown", "pointerdown", "wheel", "touchstart"]) addEventListener(type, release, { passive: true });
  });
}

export function setupKeepPlace(): void {
  const entries = [...document.querySelectorAll<HTMLElement>("[data-entry]")];
  history.scrollRestoration = "manual";
  const save = () => {
    const place = currentPlace(entries);
    if (place) history.replaceState({ ...(history.state as object | null), place }, "");
  };
  addEventListener("scrollend", save);
  addEventListener("pagehide", save);
  // Back or Forward between two places on the page, such as after a jump from the index. A jump
  // that didn't scroll saved no place, so its link target stands in.
  addEventListener("popstate", (event) => {
    const place = placeIn(event.state);
    if (place) scrollToPlace(place);
    else document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
  });
  const place = placeIn(history.state);
  if (place) scrollToPlace(place);
}

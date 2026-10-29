// Shows the back-to-top link once the first screen is scrolled away; before that, the top is still
// in view. The link jumps without a smooth scroll: on a page this long, an animation would take
// seconds to run past everything in between.
export function setupToTop(): void {
  const link = document.querySelector<HTMLAnchorElement>("#to-top");
  const siteName = document.querySelector<HTMLAnchorElement>('h1 a[href="#top"]');
  if (!link || !siteName) return;
  const update = () => {
    const hidden = scrollY < innerHeight;
    if (link.hidden !== hidden) link.hidden = hidden;
  };
  update();
  addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update, { passive: true });
  // The link hides itself at the top, which would drop focus to the body and leave the next Tab
  // to each browser. Focus moves to the site name instead, so the next Tab reaches the search box.
  link.addEventListener("click", (event) => {
    event.preventDefault();
    scrollTo(0, 0);
    siteName.focus();
  });
}

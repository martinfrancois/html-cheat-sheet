// Shows the scroll-to-top link once the first screen is scrolled away; before that, the top is
// still in view. The link jumps without a smooth scroll: on a page this long, an animation would
// take seconds to run past everything in between. Following the link moves keyboard focus to the
// top too, so the next Tab reaches the index.
export function setupToTop(): void {
  const link = document.querySelector<HTMLAnchorElement>("#to-top");
  if (!link) return;
  const update = () => {
    const hidden = scrollY < innerHeight;
    if (link.hidden !== hidden) link.hidden = hidden;
  };
  update();
  addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update, { passive: true });
}

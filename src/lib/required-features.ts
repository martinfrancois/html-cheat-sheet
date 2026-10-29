// The web features the page needs that aren't Baseline widely available yet, each with a check the
// browser runs. A reader whose browser fails one is told so and which browsers the page works in
// (src/scripts/browser-support.ts); those versions come from this list as well
// (src/lib/supported-browsers.ts). A feature the page starts to rely on goes here: docs/adr/0021.
// It doesn't import anything, so the page's script can use it without web-features.
export interface RequiredFeature {
  compatKey: string;
  supported: () => boolean;
}

// beforetoggle reached dialogs in the same browser versions as toggle, and fires during show(), so
// cancelling it tells whether dialogs have both. An older browser opens the dialog: hidden, it
// doesn't scroll the page to its end, and focus goes back to where it was.
function dialogsToggle(): boolean {
  const dialog = document.createElement("dialog");
  dialog.hidden = true;
  let fired = false;
  dialog.addEventListener("beforetoggle", (event) => {
    fired = true;
    event.preventDefault();
  });
  const focused = document.activeElement;
  document.body.append(dialog);
  dialog.show();
  dialog.remove();
  if (focused instanceof HTMLElement && document.activeElement !== focused) focused.focus({ preventScroll: true });
  return fired;
}

export const REQUIRED_FEATURES: RequiredFeature[] = [
  // Without it every colour token is invalid, and the page shows black text on white.
  { compatKey: "css.types.color.light-dark", supported: () => CSS.supports("color", "light-dark(red, red)") },
  // Without it the index stays folded on a wide screen, where its toggle is hidden.
  { compatKey: "css.selectors.details-content", supported: () => CSS.supports("selector(::details-content)") },
  // Without it the script in each live output frame fails, and the frames stop fitting their example.
  { compatKey: "css.selectors.popover-open", supported: () => CSS.supports("selector(:popover-open)") },
  // Without it a live output frame doesn't grow to show a dialog its example opens.
  { compatKey: "api.HTMLElement.toggle_event.dialog_elements", supported: dialogsToggle },
  // Without it a search for two or more words fails.
  { compatKey: "javascript.builtins.Set.intersection", supported: () => typeof Set.prototype.intersection === "function" },
  // Tailwind registers its custom properties with @property. registerProperty arrived with it, or in
  // Chrome a little earlier, in versions that fail the light-dark() check anyway.
  { compatKey: "css.at-rules.property", supported: () => typeof CSS.registerProperty === "function" },
];

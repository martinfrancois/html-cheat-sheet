// The page follows the system setting until the reader clicks the toggle. Only that click stores a
// choice, so a reader who never touches it keeps following the system.
import { THEME_KEY } from "../lib/theme-key.ts";
const darkQuery = matchMedia("(prefers-color-scheme: dark)");

export function currentScheme(): "light" | "dark" {
  const choice = document.documentElement.dataset.theme;
  if (choice === "light" || choice === "dark") return choice;
  return darkQuery.matches ? "dark" : "light";
}

export function setupTheme(): void {
  const button = document.querySelector<HTMLButtonElement>("#theme");
  if (!button) return;
  const label = () => button.setAttribute("aria-label", currentScheme() === "dark" ? "Switch to light mode" : "Switch to dark mode");
  label();

  button.addEventListener("click", () => {
    const next = currentScheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Without storage the choice lasts until the page is closed.
    }
    label();
    dispatchEvent(new Event("themechange"));
  });

  darkQuery.addEventListener("change", () => {
    if (document.documentElement.dataset.theme) return;
    label();
    dispatchEvent(new Event("themechange"));
  });
}

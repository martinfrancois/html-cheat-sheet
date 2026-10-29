import { REQUIRED_FEATURES } from "../lib/required-features.ts";
import { track } from "./analytics.ts";

// A browser too old for a feature the page needs gets a notice naming it and the versions the page
// works in, and PostHog hears which features were missing, so many readers on old browsers show up
// there: docs/adr/0021. bowser names the browser, loaded only then.

// "131.0.6778.85" reads as 131, "18.4" as 18.4.
const shortVersion = (version: string): string => version.split(".").slice(0, 2).join(".").replace(/\.0$/, "");

function passes(check: () => boolean): boolean {
  try {
    return check();
  } catch {
    return false;
  }
}

export function setupBrowserSupport(): void {
  const missing = REQUIRED_FEATURES.filter((feature) => !passes(feature.supported)).map((feature) => feature.compatKey);
  const notice = document.querySelector<HTMLElement>("#browser-notice");
  if (missing.length === 0 || !notice) return;
  track("unsupported_browser", { missing: missing.join(" ") });
  notice.hidden = false;
  void import("bowser").then(({ default: Bowser }) => {
    const { name, version } = Bowser.getParser(navigator.userAgent).getBrowser();
    if (name && version) notice.querySelector("[data-browser]")!.textContent = `Your browser, ${name} ${shortVersion(version)},`;
  });
}

import { compatStatus } from "./baseline.ts";
import { REQUIRED_FEATURES } from "./required-features.ts";
import { FAMILIES, withoutOrEarlier } from "./support.ts";

// The browser versions the page works in: the first version of each that has every required feature,
// from web-features, which also dates the six-month rule. A browser whose phone version differs gets
// both, such as "Firefox on desktop 143" and "Firefox for Android 144".

// "26" is newer than "18.4", and "17.10" than "17.5".
const newer = (version: string, than: string): boolean => version.localeCompare(than, "en", { numeric: true }) > 0;

function firstVersion(browser: string, compatKeys: string[]): string {
  return compatKeys
    .map((key) => {
      const version = compatStatus(key)?.support?.[browser];
      if (!version) throw new Error(`web-features has no ${browser} version for ${key}`);
      return withoutOrEarlier(version);
    })
    .reduce((a, b) => (newer(b, a) ? b : a));
}

export function supportedBrowsers(compatKeys = REQUIRED_FEATURES.map((feature) => feature.compatKey)): string[] {
  return FAMILIES.flatMap(({ name, desktop, mobile, desktopName, mobileName }) => {
    const onDesktop = firstVersion(desktop, compatKeys);
    const onMobile = mobile && firstVersion(mobile, compatKeys);
    return !onMobile || onMobile === onDesktop ? [`${name} ${onDesktop}`] : [`${desktopName} ${onDesktop}`, `${mobileName} ${onMobile}`];
  });
}

// "Chrome 132, Edge 132, Firefox 143 and Safari 26".
export const listOf = (items: string[]): string => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`);

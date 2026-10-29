import bcd from "@mdn/browser-compat-data" with { type: "json" };
import browserslist from "browserslist";

// How many people can use a feature: the share of global browser usage (caniuse-lite's StatCounter
// numbers) in browser versions that support it, according to @mdn/browser-compat-data. browserslist
// does the version matching and the sum. caniuse-lite's own feature list doesn't cover most HTML
// attributes and input types, so the versions come from the compat data instead.

export interface Support {
  // Percent of global browser usage, rounded down.
  share: number;
  // Major browsers that don't support it at all, such as "Firefox on desktop".
  missing: string[];
}

type Statement = { version_added: string | boolean | null; flags?: unknown; prefix?: string; alternative_name?: string; partial_implementation?: boolean };

// Compat data browser name to browserslist name.
const BROWSERSLIST: Record<string, string> = {
  chrome: "chrome",
  chrome_android: "and_chr",
  edge: "edge",
  firefox: "firefox",
  firefox_android: "and_ff",
  safari: "safari",
  safari_ios: "ios_saf",
  samsunginternet_android: "samsung",
  opera: "opera",
  opera_android: "op_mob",
  webview_android: "android",
};

// The browsers whose absence the badge names, desktop and mobile of each.
export const FAMILIES = [
  { name: "Chrome", desktop: "chrome", mobile: "chrome_android", desktopName: "Chrome on desktop", mobileName: "Chrome for Android" },
  { name: "Edge", desktop: "edge", desktopName: "Edge" },
  { name: "Firefox", desktop: "firefox", mobile: "firefox_android", desktopName: "Firefox on desktop", mobileName: "Firefox for Android" },
  { name: "Safari", desktop: "safari", mobile: "safari_ios", desktopName: "Safari on Mac", mobileName: "Safari on iOS" },
];

function compatOf(key: string): Record<string, Statement | Statement[]> | undefined {
  let node: unknown = bcd;
  for (const part of key.split(".")) node = (node as Record<string, unknown> | undefined)?.[part];
  return (node as { __compat?: { support: Record<string, Statement | Statement[]> } } | undefined)?.__compat?.support;
}

// web-features and MDN's compat data write "≤2020-03-24" or "≤79" for "this one or earlier".
export const withoutOrEarlier = <T extends string | undefined>(value: T): T => value?.replace(/^≤/, "") as T;

// The first version with full, unprefixed, unflagged support, or undefined when there is none.
function firstVersion(support: Statement | Statement[] | undefined): string | undefined {
  const full = [support ?? []].flat().find((statement) => !statement.flags && !statement.prefix && !statement.alternative_name && !statement.partial_implementation);
  const added = full?.version_added;
  if (added === true) return "0";
  if (typeof added !== "string" || added === "preview") return undefined;
  return withoutOrEarlier(added);
}

export function support(compatKey: string): Support | undefined {
  const compat = compatOf(compatKey);
  if (!compat) return undefined;
  const queries = Object.entries(BROWSERSLIST).flatMap(([browser, name]) => {
    const version = firstVersion(compat[browser]);
    return version === undefined ? [] : [`${name} >= ${version}`];
  });
  // browserslist rejects a version newer than its data knows, which only happens for a release
  // too new to have usage numbers yet; such a browser adds nothing to the share.
  const versions = queries.flatMap((query) => {
    try {
      return browserslist(query);
    } catch {
      return [];
    }
  });
  const lacks = (browser?: string) => browser !== undefined && firstVersion(compat[browser]) === undefined;
  const missing = FAMILIES.flatMap((family) => {
    const desktop = lacks(family.desktop);
    const mobile = lacks(family.mobile);
    if (desktop && (mobile || !family.mobile)) return [family.name];
    if (desktop) return [family.desktopName];
    return mobile ? [family.mobileName!] : [];
  });
  return { share: Math.floor(browserslist.coverage(versions)), missing };
}

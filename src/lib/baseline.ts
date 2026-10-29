import { features } from "web-features";
import { support, type Support, withoutOrEarlier } from "./support.ts";

export type BaselineLevel = "high" | "low" | false;

export interface BaselineStatus {
  level: BaselineLevel;
  // The year the feature reached the level, such as 2024 for "Widely available since 2024".
  since?: string;
  // Worked in every core browser before web-features started tracking, so the dates mean nothing.
  predates: boolean;
  // The web-features feature the status comes from, for the link to webstatus.dev.
  feature: string;
  // Who can use it, for a feature not yet widely available.
  support?: Support;
}

type CompatStatus = { baseline: BaselineLevel; baseline_low_date?: string; baseline_high_date?: string };

// web-features dates everything older than its first tracked browser release to this day, so <b>
// would otherwise read "Widely available since 2018".
const BASELINE_START = "2015-07-29";

const byCompatKey = new Map<string, BaselineStatus>();
for (const [id, feature] of Object.entries(features)) {
  if (!("status" in feature) || !feature.status) continue;
  const perKey = (feature.status as { by_compat_key?: Record<string, CompatStatus> }).by_compat_key ?? {};
  for (const [key, status] of Object.entries(perKey)) {
    if (byCompatKey.has(key)) continue;
    const date = status.baseline === "high" ? status.baseline_high_date : status.baseline === "low" ? status.baseline_low_date : undefined;
    const predates = withoutOrEarlier(status.baseline_low_date) === BASELINE_START;
    byCompatKey.set(key, { level: status.baseline, since: predates ? undefined : withoutOrEarlier(date)?.slice(0, 4), predates, feature: id });
  }
}

export function baseline(compatKey: string): BaselineStatus | undefined {
  const status = byCompatKey.get(compatKey);
  return status && { ...status, support: status.level === "high" ? undefined : support(compatKey) };
}

// <svg> and <math> come from SVG and MathML, which web-features keys under their own names.
const NAMESPACE: Record<string, string> = { svg: "svg", math: "mathml" };
export const elementCompatKey = (name: string): string => `${NAMESPACE[name] ?? "html"}.elements.${name}`;
// MDN's compat data keys data-* as data_attributes.
export const attributeCompatKey = (name: string): string => `html.global_attributes.${name === "data-*" ? "data_attributes" : name}`;

// Only a status worth knowing gets a badge: not yet in every browser, or only recently.
export const worthABadge = (status: BaselineStatus | undefined): status is BaselineStatus => Boolean(status) && !(status!.level === "high" && status!.predates);

const rank = (level: BaselineLevel): number => (level === "high" ? 2 : level === "low" ? 1 : 0);

// An entry about several elements shows the status of the least supported one.
export function weakest(statuses: (BaselineStatus | undefined)[]): BaselineStatus | undefined {
  return statuses.filter((status): status is BaselineStatus => Boolean(status)).sort((a, b) => rank(a.level) - rank(b.level))[0];
}

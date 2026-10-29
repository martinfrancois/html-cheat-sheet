// Cookieless PostHog, the page's only third-party request: no cookies, no storage, no session
// replay, so no consent banner. Without a key at build time (local builds, previews) nothing loads.
// Why and what is measured: docs/adr/0013-measure-usage-and-web-vitals-with-cookieless-posthog.md.
import type { PostHog } from "posthog-js";

let client: Promise<PostHog | undefined> | undefined;

function load(): Promise<PostHog | undefined> {
  const key = document.body.dataset.posthogKey;
  if (!key) return Promise.resolve(undefined);
  // PostHog may not fetch code from its servers, so the web-vitals code it needs comes bundled.
  client ??= Promise.all([import("posthog-js"), import("posthog-js/dist/web-vitals")]).then(([{ default: posthog }]) => {
    posthog.init(key, {
      api_host: "https://eu.i.posthog.com",
      // Needs "Cookieless server hash mode" switched on in the PostHog project settings.
      cookieless_mode: "always",
      persistence: "memory",
      autocapture: false,
      capture_pageview: true,
      capture_pageleave: false,
      capture_dead_clicks: false,
      capture_heatmaps: false,
      // Without attribution, which is the web-vitals build bundled above; the default asks for the
      // attribution build, which can't load here, and then nothing is measured.
      capture_performance: { web_vitals: true, web_vitals_attribution: false, network_timing: false },
      rageclick: false,
      disable_session_recording: true,
      disable_surveys: true,
      disable_web_experiments: true,
      advanced_disable_flags: true,
      disable_external_dependency_loading: true,
    });
    return posthog;
  });
  return client;
}

export function track(event: string, properties: Record<string, string>): void {
  void load().then((posthog) => posthog?.capture(event, properties));
}

export function setupAnalytics(): void {
  // Start two seconds in, so analytics never delays the page. requestIdleCallback would fit
  // better, but Safari doesn't have it.
  setTimeout(() => void load(), 2000);
}

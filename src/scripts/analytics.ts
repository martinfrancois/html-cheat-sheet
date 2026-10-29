// Cookieless PostHog, the page's only third-party request: no cookies, no storage, no session
// replay, so no consent banner. Without a key at build time (local builds, previews) nothing loads.
// Why and what is measured: docs/adr/0005-cookieless-posthog-analytics-as-the-only-third-party-request.md.
import type { PostHog } from "posthog-js";

let client: Promise<PostHog | undefined> | undefined;

function load(): Promise<PostHog | undefined> {
  const key = document.body.dataset.posthogKey;
  if (!key) return Promise.resolve(undefined);
  client ??= import("posthog-js").then(({ default: posthog }) => {
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
      capture_performance: false,
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

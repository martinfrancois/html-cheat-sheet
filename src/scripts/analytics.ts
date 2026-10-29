// Cookieless PostHog, the page's only third-party request: no cookies, no storage, no session
// replay, so no consent banner. Without a key at build time (local builds, previews) nothing loads.
// Why and what is measured: docs/adr/0013-measure-usage-and-web-vitals-with-cookieless-posthog.md.
import type { PostHog } from "posthog-js";

let client: Promise<PostHog | undefined> | undefined;
// Resolves two seconds in. An event sent before then waits for it too, so it doesn't load PostHog early.
let start = () => {};
const started = new Promise<void>((resolve) => (start = resolve));

// PostHog hears about script errors once it runs; an error before that, such as one while the page
// sets itself up, is kept here and sent then.
const earlyErrors: unknown[] = [];
const keepError = (event: ErrorEvent | PromiseRejectionEvent) => earlyErrors.push(event instanceof ErrorEvent ? (event.error ?? event.message) : event.reason);

function sendEarlyErrors(posthog: PostHog | undefined): void {
  removeEventListener("error", keepError);
  removeEventListener("unhandledrejection", keepError);
  for (const error of earlyErrors.splice(0)) posthog?.captureException(error);
}

function load(): Promise<PostHog | undefined> {
  const key = document.body.dataset.posthogKey;
  if (!key) {
    sendEarlyErrors(undefined);
    return Promise.resolve(undefined);
  }
  // PostHog may not fetch code from its servers, so the web-vitals and error code it needs comes
  // bundled. Usage events don't depend on either: when one fails to load, PostHog runs without it.
  client ??= Promise.all([
    import("posthog-js"),
    ...[import("posthog-js/dist/web-vitals"), import("posthog-js/dist/exception-autocapture")].map((extension) => extension.catch(() => undefined)),
  ]).then(([{ default: posthog }]) => {
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
      // Script errors in the page, so a reader's broken browser shows up: docs/adr/0021.
      capture_exceptions: true,
      rageclick: false,
      disable_session_recording: true,
      disable_surveys: true,
      disable_web_experiments: true,
      advanced_disable_flags: true,
      disable_external_dependency_loading: true,
    });
    sendEarlyErrors(posthog);
    return posthog;
  });
  return client;
}

export function track(event: string, properties: Record<string, string>): void {
  void started.then(load).then((posthog) => posthog?.capture(event, properties));
}

export function setupAnalytics(): void {
  addEventListener("error", keepError);
  addEventListener("unhandledrejection", keepError);
  // Start two seconds in, so analytics never delays the page. requestIdleCallback would fit
  // better, but Safari doesn't have it.
  void started.then(load);
  setTimeout(start, 2000);
}

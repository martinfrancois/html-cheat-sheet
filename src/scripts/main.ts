import { setupAnalytics } from "./analytics.ts";
import { setupBrowserSupport } from "./browser-support.ts";
import { setupExamples } from "./examples.ts";
import { setupKeepPlace } from "./keep-place.ts";
import { setupLiveOutput } from "./live-output.ts";
import { setupOffline } from "./offline.ts";
import { setupSearch } from "./search.ts";
import { setupTheme } from "./theme.ts";
import { setupToTop } from "./to-top.ts";

// Analytics first, so it hears about an error in anything after it.
setupAnalytics();
setupBrowserSupport();
setupTheme();
setupKeepPlace();
setupLiveOutput();
setupExamples();
setupSearch();
setupToTop();
setupOffline();

import { setupAnalytics } from "./analytics.ts";
import { setupExamples } from "./examples.ts";
import { setupIndexNav } from "./index-nav.ts";
import { setupLiveOutput } from "./live-output.ts";
import { setupOffline } from "./offline.ts";
import { setupSearch } from "./search.ts";
import { setupTheme } from "./theme.ts";

setupTheme();
setupIndexNav();
setupLiveOutput();
setupExamples();
setupSearch();
setupOffline();
setupAnalytics();

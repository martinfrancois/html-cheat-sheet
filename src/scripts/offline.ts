import { Workbox } from "workbox-window";

// Registers the service worker that scripts/build-service-worker.ts generates after the build.
// A new deploy installs in the background and waits; the notice lets the reader switch when ready.
export function setupOffline(): void {
  if (!("serviceWorker" in navigator) || import.meta.env.DEV) return;
  const notice = document.querySelector<HTMLElement>("#update-notice");
  const reload = notice?.querySelector<HTMLButtonElement>('[data-action="reload"]');
  const workbox = new Workbox("/sw.js");

  workbox.addEventListener("waiting", () => {
    if (!notice || !reload) return;
    notice.hidden = false;
    reload.addEventListener(
      "click",
      () => {
        workbox.addEventListener("controlling", () => location.reload());
        workbox.messageSkipWaiting();
      },
      { once: true },
    );
  });

  // Registration fails where service workers are blocked, such as in some embedded previews;
  // the page works the same without one.
  workbox.register().catch(() => {});
}

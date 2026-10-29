import { track } from "./analytics.ts";
import { codeOf, render } from "./live-output.ts";

type Editor = { destroy(): void; focus(): void };

function setupExample(figure: HTMLElement): void {
  const box = figure.querySelector<HTMLElement>("[data-live-output]")!;
  const codeView = figure.querySelector<HTMLElement>("[data-code-view]")!;
  const editorHost = figure.querySelector<HTMLElement>("[data-editor]")!;
  const editButton = figure.querySelector<HTMLButtonElement>('[data-action="edit"]')!;
  const resetButton = figure.querySelector<HTMLButtonElement>('[data-action="reset"]')!;
  const copyButton = figure.querySelector<HTMLButtonElement>('[data-action="copy"]')!;
  const original = codeOf(box);
  const label = `Edit example: ${figure.querySelector(`#${figure.id}-caption`)?.textContent ?? ""}`;
  let editor: Editor | undefined;
  let renderTimer: ReturnType<typeof setTimeout> | undefined;

  const current = () => box.dataset.current ?? original;

  // Edit swaps the highlighted code for an editor; Reset puts the original back.
  const showEditor = async () => {
    const { createEditor } = await import("./editor.ts");
    editor = createEditor(editorHost, original, label, (changed) => {
      box.dataset.current = changed;
      clearTimeout(renderTimer);
      renderTimer = setTimeout(() => render(box, changed), 250);
    });
    codeView.hidden = true;
    editorHost.hidden = false;
    editButton.hidden = true;
    resetButton.hidden = false;
    editor.focus();
  };

  editButton.addEventListener("click", () => {
    track("example_edit", { example: figure.id });
    void showEditor();
  });

  resetButton.addEventListener("click", () => {
    clearTimeout(renderTimer);
    editor?.destroy();
    editor = undefined;
    delete box.dataset.current;
    render(box, original);
    editorHost.hidden = true;
    codeView.hidden = false;
    resetButton.hidden = true;
    editButton.hidden = false;
    editButton.focus();
  });

  const copyLabel = copyButton.getAttribute("aria-label")!;
  copyButton.addEventListener("click", async () => {
    track("example_copy", { example: figure.id });
    try {
      await navigator.clipboard.writeText(current());
      copyButton.setAttribute("aria-label", "Copied");
      // The check mark replaces the copy icon until the label goes back.
      copyButton.dataset.done = "";
    } catch {
      // Clipboard access can be refused; select the code so the reader can copy it by hand.
      const selection = getSelection();
      selection?.selectAllChildren(codeView.hidden ? editorHost : codeView);
      copyButton.setAttribute("aria-label", "Code selected, copy it with your keyboard");
    }
    setTimeout(() => {
      delete copyButton.dataset.done;
      copyButton.setAttribute("aria-label", copyLabel);
    }, 2000);
  });
}

export function setupExamples(): void {
  for (const figure of document.querySelectorAll<HTMLElement>("[data-example]")) setupExample(figure);
}

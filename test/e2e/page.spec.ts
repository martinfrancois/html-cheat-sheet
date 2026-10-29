import { gunzipSync } from "node:zlib";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { CHIP_ROW } from "../../src/lib/chips.ts";
import { THEME_KEY } from "../../src/lib/theme-key.ts";
import { entry, layOutEveryEntry, liveOutput } from "./helpers.ts";

const topOf = (locator: Locator) => locator.evaluate((element) => element.getBoundingClientRect().top);
// The place src/scripts/keep-place.ts saved in the history entry, once a scroll has ended.
const savedPlace = (page: Page) => page.evaluate(() => (history.state as { place?: { id: string } } | null)?.place?.id);
// Two animation frames: the browser draws the entries that came near the screen in between.
const nextFrames = (page: Page) => page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));

test.describe("the cheat sheet", () => {
  test("loads without console errors or failed requests", async ({ page }) => {
    const problems: string[] = [];
    // Only the page itself counts here. Inside a live output frame, Chromium's preload scanner
    // fetches an image once before it applies the example's <base>; the next test checks that
    // every image an example shows does load. Failed loads show up in the console without
    // saying which frame made them, so they are judged by the response check below instead.
    page.on("console", (message) => message.type() === "error" && !message.text().startsWith("Failed to load resource") && problems.push(message.text()));
    page.on("pageerror", (error) => problems.push(String(error)));
    page.on("response", (response) => response.status() >= 400 && response.frame() === page.mainFrame() && problems.push(`${response.status()} ${response.url()}`));
    await page.goto("/");
    await liveOutput(page, "strong-b-example-1");
    expect(problems).toEqual([]);
  });

  test("links every entry from the index", async ({ page }) => {
    await page.goto("/");
    const ids = await page.locator("article[data-entry]").evaluateAll((articles) => articles.map((article) => article.id));
    // One read of all links: WebKit answers each Playwright call slowly once entries skip rendering
    // with content-visibility, and a call per entry ran past the timeout.
    const linked = await page.locator('nav a[href^="#"]').evaluateAll((links) => links.map((link) => link.getAttribute("href")!.slice(1)));
    expect(ids.filter((id) => !linked.includes(id))).toEqual([]);
  });

  // Entries off screen have only an estimated height until drawn, so a jump far down the page must
  // still end on the entry, not where the estimate put it.
  for (const how of ["from the index", "from the address"] as const) {
    test(`a link to an entry far down lands on it, ${how}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto("/");
      const ids = await page.locator("article[data-entry]").evaluateAll((articles) => articles.map((article) => article.id));
      for (const id of [ids[Math.floor(ids.length / 2)]!, ids.at(-1)!]) {
        if (how === "from the index") {
          await page.evaluate(() => scrollTo(0, 0));
          await page.locator(`nav a[href="#${id}"]`).first().click();
        } else {
          await page.goto(`/#${id}`);
        }
        const heading = page.locator(`article#${id} h3`).first();
        await expect(heading).toBeInViewport({ ratio: 1 });
        // Entries drawn around it get their real height in the next frames; the heading stays put.
        const top = await topOf(heading);
        await nextFrames(page);
        expect(Math.abs((await topOf(heading)) - top)).toBeLessThan(2);
      }
    });
  }

  // The browser would restore the scroll offset, which points elsewhere once entries above have
  // only an estimated height again: src/scripts/keep-place.ts.
  for (const [width, height] of [[390, 844], [1280, 900]] as const) {
    test(`a reload keeps the reader's place at ${width} pixels`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/");
      const entry = page.locator("article[data-entry]").nth(60);
      await entry.evaluate((article) => article.scrollIntoView());
      await expect.poll(() => savedPlace(page)).toBeDefined();
      const before = await topOf(entry);
      await page.reload();
      await expect.poll(async () => Math.abs((await topOf(entry)) - before)).toBeLessThan(2);
    });
  }

  test("Back after a jump returns to the reader's place", async ({ page }) => {
    await page.goto("/");
    const entries = page.locator("article[data-entry]");
    const entry = entries.nth(30);
    await entry.evaluate((article) => article.scrollIntoView());
    await expect.poll(() => savedPlace(page)).toBeDefined();
    const before = await topOf(entry);
    // A new history entry starts without a place, until its jump ends.
    await page.evaluate((id) => (location.hash = id!), await entries.nth(100).getAttribute("id"));
    await expect.poll(() => savedPlace(page)).toBeDefined();
    await page.goBack();
    await expect.poll(async () => Math.abs((await topOf(entry)) - before)).toBeLessThan(2);
  });

  // SPEC.md section 3: nothing may hide part of the page from find in page, including entries that
  // content-visibility hasn't drawn yet.
  test("find in page reaches the last entry", async ({ page }) => {
    await page.goto("/");
    const last = page.locator("article[data-entry]").last();
    // Words from the entry's longest paragraph. Find starts at the top, so an earlier entry with the
    // same words would stop it there and fail the test.
    const phrase = await last.evaluate((article) => {
      const paragraphs = [...article.querySelectorAll("p")].map((paragraph) => paragraph.textContent!.trim());
      const longest = paragraphs.reduce((a, b) => (b.length > a.length ? b : a));
      return longest.split(/\s+/).slice(2, 7).join(" ");
    });
    expect(await page.evaluate((text) => (window as unknown as { find: (text: string) => boolean }).find(text), phrase)).toBe(true);
    await expect(last).toBeInViewport();
  });

  test("renders an example's markup as live output", async ({ page }) => {
    await page.goto("/");
    const output = await liveOutput(page, "strong-b-example-1");
    await expect(output.locator("p > strong")).toHaveText("Unplug the kettle before cleaning it.");
  });

  test("runs scripts in an example", async ({ page }) => {
    await page.goto("/");
    const output = await liveOutput(page, "dialog-example-2");
    await output.getByRole("button", { name: "Delete file" }).click();
    await output.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(output.locator("#result")).toHaveText("You chose: delete");
  });

  // Each <iframe> in the page costs a browsing context while it loads: docs/adr/0012.
  test("creates a live output frame only when its example nears the screen", async ({ page }) => {
    await page.goto("/");
    await liveOutput(page, "strong-b-example-1");
    const boxes = await page.locator("[data-live-output]").count();
    const frames = await page.locator("[data-live-output] > iframe").count();
    expect(frames).toBeGreaterThan(0);
    expect(frames).toBeLessThan(boxes / 10);
  });

  // docs/adr/0003: an example runs in a sandbox that keeps it away from the page.
  test("renders every live output in a sandboxed srcdoc frame without same-origin access", async ({ page }) => {
    await page.goto("/");
    await liveOutput(page, "strong-b-example-1");
    const sandboxes = await page.locator("[data-live-output]").evaluateAll((boxes) =>
      boxes.map((box) => (box.querySelector(":scope > iframe") ?? box.querySelector("template")!.content.querySelector("iframe"))!.getAttribute("sandbox")),
    );
    expect(sandboxes.length).toBeGreaterThan(100);
    for (const sandbox of sandboxes) {
      expect(sandbox).toContain("allow-scripts");
      expect(sandbox).not.toContain("allow-same-origin");
    }
    await expect(page.locator("#strong-b-example-1 [data-live-output] > iframe")).toHaveAttribute("srcdoc", /<strong>/);
  });

  test("titles each live output frame with its example's title as plain text", async ({ page }) => {
    await page.goto("/");
    const titles = await page.locator("[data-live-output] template").evaluateAll((templates) => templates.map((template) => (template as HTMLTemplateElement).content.querySelector("iframe")!.title));
    expect(titles).toContain("Live output: The author's contact details in the footer of a post");
    expect(titles.filter((title) => /&(?:#\d+|quot|amp);/.test(title))).toEqual([]);
  });

  test("has no two elements with the same id", async ({ page }) => {
    await page.goto("/");
    const ids = await page.evaluate(() => [document, ...[...document.querySelectorAll("template")].map((template) => template.content)].flatMap((root) => [...root.querySelectorAll("[id]")].map((element) => element.id)));
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
  });

  test("grows the live output to show an open modal dialog whole, and shrinks it after", async ({ page }) => {
    await page.goto("/");
    const output = await liveOutput(page, "dialog-example-1");
    const frame = page.locator("#dialog-example-1 iframe");
    const resting = (await frame.boundingBox())!.height;
    await output.getByRole("button", { name: "Delete file" }).click();
    const dialog = output.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect.poll(async () => (await frame.boundingBox())!.height).toBeGreaterThan(resting);
    const [frameBox, dialogBox] = [(await frame.boundingBox())!, (await dialog.boundingBox())!];
    expect(dialogBox.y).toBeGreaterThanOrEqual(frameBox.y);
    expect(dialogBox.y + dialogBox.height).toBeLessThanOrEqual(frameBox.y + frameBox.height);
    await output.getByRole("button", { name: "Cancel" }).click();
    await expect.poll(async () => (await frame.boundingBox())!.height).toBe(resting);
  });

  test("a wrapped code line never starts with a row of only indentation", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/");
    await layOutEveryEntry(page);
    // The first character that isn't a space sits in the line's first row.
    const split = await page.evaluate(() =>
      [...document.querySelectorAll(".astro-code .line")]
        .filter((line) => {
          const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            const at = node.textContent!.search(/\S/);
            if (at < 0) continue;
            const range = document.createRange();
            range.setStart(node, at);
            range.setEnd(node, at + 1);
            return range.getBoundingClientRect().top >= line.getBoundingClientRect().top + parseFloat(getComputedStyle(line).lineHeight);
          }
          return false;
        })
        .map((line) => line.textContent),
    );
    expect(split).toEqual([]);
  });

  test("underlines every link inside running text", async ({ page }) => {
    await page.goto("/");
    // A link in a sentence must not depend on color alone (WCAG 1.4.1).
    const plain = await page.evaluate(() =>
      [...document.querySelectorAll(":is(p, li, dd, td) a")]
        .filter((link) => {
          // Running text: the block holds words outside its links, unlike a row of links.
          const block = link.closest("p, li, dd, td")!;
          const linked = [...block.querySelectorAll("a")].map((a) => a.textContent ?? "").join("");
          return (block.textContent ?? "").replace(/\s/g, "").length > linked.replace(/\s/g, "").length;
        })
        .filter((link) => !getComputedStyle(link).textDecorationLine.includes("underline"))
        .map((link) => link.textContent),
    );
    expect(plain).toEqual([]);
  });

  test("code chips on consecutive lines keep a gap between them", async ({ page }) => {
    // At this width a usage note of <menu> puts one chip right above another.
    await page.setViewportSize({ width: 752, height: 701 });
    await page.goto("/");
    await layOutEveryEntry(page);
    const touching = await page.evaluate(() =>
      // A long chip can wrap, so each row it covers is a box of its own.
      [...document.querySelectorAll(":is(p, li, dd) code")].flatMap((chip) =>
        [...chip.getClientRects()].flatMap((box) =>
          [...chip.parentElement!.querySelectorAll(":scope > code")]
            .flatMap((other) => [...other.getClientRects()])
            .filter((other) => other.top > box.bottom - 1 && other.top - box.bottom < 2 && other.left < box.right && other.right > box.left)
            .map(() => chip.textContent),
        ),
      ),
    );
    expect(touching).toEqual([]);
  });

  test("an example title that wraps never leaves one word alone on its last line", async ({ page, browserName }) => {
    // Every resize relayouts the whole page, which WebKit and Firefox do several times slower, so
    // they check fewer widths. Chromium checks every eighth pixel.
    const step = browserName === "chromium" ? 8 : 40;
    test.slow();
    await page.goto("/");
    await layOutEveryEntry(page);
    const orphans: string[] = [];
    for (let width = 320; width <= 1000; width += step) {
      await page.setViewportSize({ width, height: 800 });
      const found = await page.evaluate(() =>
        [...document.querySelectorAll("figcaption [id$='-caption']")].flatMap((title) => {
          // The top of every word, from a range around it; the last row is the largest top.
          const words: { text: string; top: number }[] = [];
          const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            for (const match of node.textContent!.matchAll(/\S+/g)) {
              const range = document.createRange();
              range.setStart(node, match.index!);
              range.setEnd(node, match.index! + match[0].length);
              words.push({ text: match[0], top: Math.round(range.getBoundingClientRect().top) });
            }
          }
          // A code chip's text sits a few pixels off the words next to it, so a row is everything
          // within half a line of the lowest word.
          const half = parseFloat(getComputedStyle(title).lineHeight) / 2;
          const last = Math.max(...words.map((word) => word.top));
          const onLast = words.filter((word) => word.top > last - half);
          return last - Math.min(...words.map((word) => word.top)) > half && onLast.length === 1 ? [`${title.textContent} (last: ${onLast[0]!.text})`] : [];
        }),
      );
      orphans.push(...found.map((text) => `${width}px: ${text}`));
    }
    expect(orphans).toEqual([]);
  });

  // Example code lines are at most 70 characters (src/lib/format-example.ts), and the code column
  // holds that many at the foldable width martinfrancois reads at and on a desktop. martinfrancois
  // reported a short <img> line that wrapped there.
  for (const width of [752, 1440]) {
    test(`no code line wraps at ${width} pixels`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      await layOutEveryEntry(page);
      const wrapped = await page.evaluate(() =>
        [...document.querySelectorAll(".astro-code .line")]
          .filter((line) => line.textContent?.trim() && line.getBoundingClientRect().height > parseFloat(getComputedStyle(line).lineHeight) * 1.5)
          .map((line) => line.textContent),
      );
      expect(wrapped).toEqual([]);
    });
  }

  test("a wrapped code line continues further in than it starts", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/");
    await layOutEveryEntry(page);
    const problems = await page.evaluate(() =>
      [...document.querySelectorAll(".astro-code .line")].flatMap((line) => {
        // The left edge of each row's first character.
        const rows = new Map<number, number>();
        const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          for (let at = 0; at < node.textContent!.length; at++) {
            if (/\s/.test(node.textContent![at]!)) continue;
            const range = document.createRange();
            range.setStart(node, at);
            range.setEnd(node, at + 1);
            const box = range.getBoundingClientRect();
            const top = Math.round(box.top);
            if (!rows.has(top)) rows.set(top, box.left);
          }
        }
        const [first, ...rest] = [...rows.values()];
        return rest.some((left) => left <= first!) ? [line.textContent] : [];
      }),
    );
    expect(problems).toEqual([]);
  });

  test("a short attribute with spaces never wraps in the middle", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/");
    await layOutEveryEntry(page);
    const split = await page.evaluate(() =>
      [...document.querySelectorAll(".astro-code .attribute")]
        // Chromium returns a box per token inside; a wrap shows as boxes on different rows.
        .filter((attribute) => new Set([...attribute.getClientRects()].map((box) => Math.round(box.top))).size > 1)
        .map((attribute) => attribute.textContent),
    );
    expect(split).toEqual([]);
  });

  test("a code line on a phone never wraps inside a word, a name or a closing tag", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/");
    await layOutEveryEntry(page);
    const split = await page.evaluate(() =>
      [...document.querySelectorAll(".astro-code .line")].flatMap((line) => {
        // Each character with the row it sits on, in reading order.
        const characters: { character: string; row: number }[] = [];
        const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          for (let at = 0; at < node.textContent!.length; at++) {
            const range = document.createRange();
            range.setStart(node, at);
            range.setEnd(node, at + 1);
            characters.push({ character: node.textContent![at]!, row: Math.round(range.getBoundingClientRect().bottom) });
          }
        }
        return characters.flatMap(({ character, row }, index) => {
          const previous = characters[index - 1];
          const inWord = /[\w-]/.test(previous?.character ?? "") && /\w/.test(character);
          const inClosingTag = previous?.character === "/" && characters[index - 2]?.character === "<";
          return previous && previous.row !== row && (inWord || inClosingTag) ? [line.textContent!.trim()] : [];
        });
      }),
    );
    expect(split).toEqual([]);
  });

  test("an attribute kept on one row keeps its syntax colours", async ({ page }) => {
    await page.goto("/");
    const plain = await page.locator(".astro-code .attribute").evaluateAll((attributes) =>
      attributes.filter((attribute) => !attribute.querySelector("span[style*='--code-attr']")).map((attribute) => attribute.textContent),
    );
    expect(plain).toEqual([]);
  });

  // A short chip such as (min-width: 30em), and a short word in a longer one such as z-index.
  // "display: table-column-group" is wider than the column next to "Default CSS" on a phone, so
  // it may break after "display:".
  test("a short code chip or word never breaks", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/");
    await layOutEveryEntry(page);
    const broken = await page.evaluate((row) =>
      [...document.querySelectorAll("main code:not(.astro-code code, [data-facts] code)")].flatMap((chip) => {
        const text = chip.textContent!;
        const units = text.length <= row ? [{ start: 0, end: text.length }] : [...text.matchAll(/\S+/g)].filter(([word]) => word.length <= row).map(({ 0: word, index }) => ({ start: index, end: index + word.length }));
        return units
          .filter(({ start, end }) => {
            // The rows the unit's characters sit on, measured on the text, which may span several nodes.
            const rows = new Set<number>();
            const walker = document.createTreeWalker(chip, NodeFilter.SHOW_TEXT);
            let offset = 0;
            for (let node = walker.nextNode(); node; node = walker.nextNode()) {
              const length = node.textContent!.length;
              for (let at = Math.max(start, offset); at < Math.min(end, offset + length); at++) {
                if (/\s/.test(text[at]!)) continue;
                const range = document.createRange();
                range.setStart(node, at - offset);
                range.setEnd(node, at - offset + 1);
                rows.add(Math.round(range.getBoundingClientRect().bottom));
              }
              offset += length;
            }
            return rows.size > 1;
          })
          .map(({ start, end }) => text.slice(start, end));
      }),
      CHIP_ROW,
    );
    expect(broken).toEqual([]);
  });

  // Text kept on one row, such as an indented line of text glued to its indentation, would stick
  // out of the code block and be cut off.
  test("every code line fits inside its block on a narrow phone", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/");
    await layOutEveryEntry(page);
    const overflowing = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>(".astro-code")].filter((code) => code.scrollWidth > code.clientWidth).map((code) => code.textContent!.slice(0, 80)),
    );
    expect(overflowing).toEqual([]);
  });

  // Lighthouse counts every shift during load. Two caused them: fonts swapping in after the
  // first paint, and the index opening from a module script after it.
  for (const [width, height] of [[390, 800], [1440, 900]] as const) {
    test(`nothing shifts while the page loads at ${width} pixels`, async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "only Chromium reports layout shifts");
      await page.setViewportSize({ width, height });
      await page.addInitScript(() => {
        (window as unknown as { shifts: number[] }).shifts = [];
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
            if (!entry.hadRecentInput) (window as unknown as { shifts: number[] }).shifts.push(entry.value);
          }
        }).observe({ type: "layout-shift", buffered: true });
      });
      await page.goto("/", { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      // Both causes happen by the time the fonts are in; two frames let a late shift be reported.
      await page.evaluate(async () => {
        const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
        await nextFrame();
        await nextFrame();
      });
      expect(await page.evaluate(() => (window as unknown as { shifts: number[] }).shifts)).toEqual([]);
    });
  }

  // On a slow connection the fonts arrive after the first paint, and the text, drawn in a fallback
  // font until then, takes a new size. Fallback faces with the web fonts' metrics keep that shift
  // near zero, where it was 0.19 at 412 pixels and 0.41 at 1440. At some widths one line still wraps
  // differently, such as 0.08 at 390, so these two widths are the ones checked: docs/adr/0017.
  for (const [width, height] of [[412, 823], [1440, 900]] as const) {
    test(`late fonts barely move the page at ${width} pixels`, async ({ page, context, browserName }) => {
      test.skip(browserName !== "chromium", "only Chromium reports layout shifts");
      await context.route("**/*.woff2", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.continue();
      });
      await page.setViewportSize({ width, height });
      await page.addInitScript(() => {
        (window as unknown as { shift: number }).shift = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
            if (!entry.hadRecentInput) (window as unknown as { shift: number }).shift += entry.value;
          }
        }).observe({ type: "layout-shift", buffered: true });
      });
      await page.goto("/", { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(async () => {
        const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
        await nextFrame();
        await nextFrame();
      });
      expect(await page.evaluate(() => document.fonts.check("16px 'Atkinson Hyperlegible Next Variable'"))).toBe(true);
      expect(await page.evaluate(() => (window as unknown as { shift: number }).shift)).toBeLessThan(0.01);
    });
  }

  test("never scrolls sideways on a 320 pixel wide screen", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/");
    await layOutEveryEntry(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBe(0);
  });
});

test.describe("search", () => {
  test("filters entries and tolerates a typo", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Search elements and attributes").fill("dialgo");
    await expect(entry(page, "dialog")).toBeVisible();
    await expect(entry(page, "strong-b")).toBeHidden();
    await expect(page.getByRole("status")).toHaveText(/^\d+ (entry matches|entries match)\.$/);
  });

  test("finds an element by name with angle brackets", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Search elements and attributes").fill("<b>");
    await expect(entry(page, "strong-b")).toBeVisible();
  });

  test("says so when nothing matches, and shows everything again when cleared", async ({ page }) => {
    await page.goto("/");
    const search = page.getByLabel("Search elements and attributes");
    await search.fill("qqqqzzzz");
    await expect(page.getByRole("status")).toHaveText('Nothing matches "qqqqzzzz".');
    await expect(page.locator("article[data-entry]:visible")).toHaveCount(0);
    await search.fill("");
    await expect(page.locator("article[data-entry]:visible")).toHaveCount(await page.locator("article[data-entry]").count());
  });

  test("is focused by the slash key", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("/");
    await expect(page.getByLabel("Search elements and attributes")).toBeFocused();
  });
});

// Rocket Loader, which Cloudflare can run in front of the site, holds back any script without this
// attribute before its src until after the first paint: docs/adr/0014.
test("every script on the page opts out of Rocket Loader", async ({ page }) => {
  await page.goto("/");
  const scripts = await page.locator("script").evaluateAll((elements) => elements.map((script) => script.outerHTML.slice(0, 80)));
  expect(scripts.length).toBeGreaterThan(0);
  expect(scripts.filter((script) => !/^<script(?: [^>]*?)? data-cfasync="false"(?: |>)/.test(script) || /\bsrc=[^>]*data-cfasync/.test(script))).toEqual([]);
});

test.describe("back to top", () => {
  const scrollDown = (page: Page) => page.evaluate(() => scrollTo(0, innerHeight * 3));

  test("appears after the first screen and jumps back to the top", async ({ page }) => {
    await page.goto("/");
    const link = page.getByRole("link", { name: "Back to top" });
    await expect(link).toBeHidden();
    await scrollDown(page);
    await expect(link).toBeVisible();
    await link.click();
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    await expect(link).toBeHidden();
  });

  test("leaves keyboard focus on the site name, so the next Tab reaches the search box", async ({ page }) => {
    await page.goto("/");
    await scrollDown(page);
    await page.getByRole("link", { name: "Back to top" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("link", { name: "html cheat sheet", exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Search elements and attributes")).toBeFocused();
  });

  test("sits above the update notice instead of under it", async ({ page }) => {
    await page.goto("/");
    await scrollDown(page);
    await page.evaluate(() => (document.getElementById("update-notice")!.hidden = false));
    const link = page.getByRole("link", { name: "Back to top" });
    await expect(link).toBeVisible();
    const [linkBox, noticeBox] = [(await link.boundingBox())!, (await page.getByText("A new version is ready.").locator("..").boundingBox())!];
    expect(linkBox.y + linkBox.height).toBeLessThanOrEqual(noticeBox.y);
  });
});

test.describe("theme", () => {
  test("switches on click and keeps the choice after a reload", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Switch to dark mode" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("button", { name: "Switch to light mode" })).toBeVisible();
  });

  test("renders live output with the browser's dark defaults in dark mode", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Switch to dark mode" }).click();
    const output = await liveOutput(page, "strong-b-example-1");
    await expect(output.locator("html")).toHaveCSS("color-scheme", "dark");
  });

  test("follows the system setting and stores nothing until clicked", async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: "dark" });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveAttribute("data-theme");
    await expect(page.getByRole("button", { name: "Switch to light mode" })).toBeVisible();
    // The page is dark: every channel of its background is near black, whatever the exact color.
    const background = await page.locator("body").evaluate((body) => getComputedStyle(body).backgroundColor);
    expect(background.match(/\d+/g)!.slice(0, 3).map(Number).every((channel) => channel < 48)).toBe(true);
    expect(await page.evaluate((key) => localStorage.getItem(key), THEME_KEY)).toBeNull();
    await context.close();
  });
});

test.describe("editing an example", () => {
  test("updates the live output as you type and resets to the original", async ({ page }) => {
    await page.goto("/");
    const example = page.locator("#strong-b-example-1");
    const output = await liveOutput(page, "strong-b-example-1");
    await example.getByRole("button", { name: "Edit code" }).click();
    const editor = example.getByRole("textbox", { name: /Edit example/ });
    await expect(editor).toBeFocused();
    await page.keyboard.press("ControlOrMeta+End");
    await page.keyboard.type("<p><strong>Edited</strong></p>");
    await expect(output.getByText("Edited")).toBeVisible();

    await example.getByRole("button", { name: "Reset example" }).click();
    await expect(output.getByText("Edited")).toHaveCount(0);
    await expect(example.getByRole("button", { name: "Edit code" })).toBeFocused();
  });

  // docs/adr/0004: readers who never edit never download the editor.
  test("loads the editor only when Edit is clicked", async ({ page }) => {
    const editorChunk = /\/editor\.[\w-]+\.js$/;
    const scripts: string[] = [];
    page.on("request", (request) => scripts.push(request.url()));
    await page.goto("/");
    await liveOutput(page, "strong-b-example-1");
    expect(scripts.filter((url) => editorChunk.test(url))).toEqual([]);
    const example = page.locator("#strong-b-example-1");
    const loaded = page.waitForRequest(editorChunk);
    await example.getByRole("button", { name: "Edit code" }).click();
    await loaded;
    await expect(example.getByRole("textbox", { name: /Edit example/ })).toBeFocused();
  });
});

// docs/adr/0013: PostHog, cookieless, is the page's only third-party request. Test builds have
// no key, so the test hands the page one, and PostHog's host answers from the test.
test.describe("analytics", () => {
  // In WebKit the page's requests go through the service worker, where page.route doesn't see them,
  // so PostHog's host would get real requests and a blocked one would still go out.
  test.use({ serviceWorkers: "block" });
  const posthog = "https://eu.i.posthog.com/**";
  // PostHog drops events from a browser that says it's automated, through navigator.webdriver or,
  // in headless Chromium, a "HeadlessChrome" brand.
  const withKey = (page: Page) =>
    page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
      Object.defineProperty(navigator, "userAgentData", { get: () => undefined });
      addEventListener("DOMContentLoaded", () => (document.body.dataset.posthogKey = "phc_test"));
    });

  async function useThePage(page: Page): Promise<void> {
    await page.goto("/");
    await liveOutput(page, "strong-b-example-1");
    await page.getByLabel("Search elements and attributes").fill("dialog");
    await expect(entry(page, "dialog")).toBeVisible();
    await page.getByLabel("Search elements and attributes").fill("");
    const example = page.locator("#strong-b-example-1");
    await example.getByRole("button", { name: "Copy code" }).click();
    await example.getByRole("button", { name: "Edit code" }).click();
    await expect(example.getByRole("textbox", { name: /Edit example/ })).toBeFocused();
  }

  test("sends requests only to the site and PostHog's EU host, and stores nothing", async ({ page, context, baseURL }) => {
    const hosts = new Set<string>();
    page.on("request", (request) => request.frame() === page.mainFrame() && !request.url().startsWith("data:") && hosts.add(new URL(request.url()).origin));
    await withKey(page);
    await page.route(posthog, (route) => route.fulfill({ json: { status: 1 } }));
    const sent = page.waitForRequest((request) => request.url().startsWith("https://eu.i.posthog.com/"));
    await useThePage(page);
    await sent;
    expect([...hosts].sort()).toEqual([new URL(baseURL!).origin, "https://eu.i.posthog.com"].sort());
    expect(await context.cookies()).toEqual([]);
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  });

  test("reports the reader's web vitals once the page is hidden", async ({ page, browserName }) => {
    // https://github.com/martinfrancois/html-cheat-sheet/issues/13
    test.skip(browserName === "webkit", "PostHog sends the page view but no $web_vitals in Playwright's WebKit, cause not found yet");
    const events: { event: string; properties: Record<string, unknown> }[] = [];
    await withKey(page);
    await page.route(posthog, async (route) => {
      const body = route.request().postDataBuffer();
      try {
        if (body) {
          const text = (body[0] === 0x1f && body[1] === 0x8b ? gunzipSync(body) : body).toString();
          events.push(...[JSON.parse(text)].flat().flatMap((data) => data.batch ?? [data]));
        }
      } finally {
        await route.fulfill({ json: { status: 1 } });
      }
    });
    await useThePage(page);
    // PostHog has to be running before the page hides, or nothing is listening.
    await expect.poll(() => events.some((event) => event.event === "$pageview")).toBe(true);
    // Leaving the page hides it, which is when the browser settles CLS and INP.
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { get: () => "hidden", configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    const vitals = () =>
      events
        .filter((event) => event.event === "$web_vitals")
        .flatMap((event) => Object.keys(event.properties).filter((key) => key.endsWith("_value")))
        .sort();
    // Only Chromium measures layout shifts, so Firefox readers send no CLS.
    const expected = ["$web_vitals_FCP_value", "$web_vitals_INP_value", "$web_vitals_LCP_value"];
    if (browserName === "chromium") expected.unshift("$web_vitals_CLS_value");
    await expect.poll(vitals, { timeout: 15_000 }).toEqual(expected);
  });

  test("leaves the page working when PostHog can't be reached", async ({ page }) => {
    const problems: string[] = [];
    page.on("pageerror", (error) => problems.push(String(error)));
    await withKey(page);
    await page.route(posthog, (route) => route.abort());
    const blocked = page.waitForRequest((request) => request.url().startsWith("https://eu.i.posthog.com/"));
    await useThePage(page);
    await blocked;
    expect(problems).toEqual([]);
  });
});

test.describe("copying an example", () => {
  test("puts the code on the clipboard", async ({ page, context, browserName }) => {
    test.skip(browserName !== "chromium", "only Chromium lets a test grant clipboard access");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");
    const example = page.locator("#strong-b-example-1");
    await example.getByRole("button", { name: "Copy code" }).click();
    await expect(example.getByRole("button", { name: "Copied" })).toBeVisible();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain("<b>Aurora 3</b>");
  });
});

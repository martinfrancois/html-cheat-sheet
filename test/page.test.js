// Every local src/href in index.html must point at a committed file, and no
// script or stylesheet may come from the network, so the page works offline.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const { parse } = require("node-html-parser");

const root = path.resolve(__dirname, "..");
const pageFile = path.join(root, "index.html");
const html = fs.readFileSync(pageFile, "utf8");
const page = parse(html);

const isRemote = (url) => /^(https?:)?\/\//i.test(url);
const isPageLocal = (url) => !isRemote(url) && !/^(#|mailto:|data:|javascript:)/i.test(url);

function assertLocal(url, kind) {
  assert.ok(!isRemote(url), `remote ${kind}: ${url}`);
}

function assertFileExists(url, from) {
  // URLs percent-encode characters such as spaces, file names on disk do not.
  const target = path.resolve(path.dirname(from), decodeURIComponent(url.split(/[?#]/)[0]));
  assert.ok(target.startsWith(root + path.sep), `${url} in ${path.relative(root, from)} leaves the repository`);
  assert.ok(fs.existsSync(target) && fs.statSync(target).isFile(), `${url} in ${path.relative(root, from)} is not a file in the repository`);
  return target;
}

function cssUrls(css) {
  const urls = [];
  for (const match of css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)) urls.push(match[2]);
  for (const match of css.matchAll(/@import\s+(?:url\()?\s*['"]([^'"]+)['"]/g)) urls.push(match[1]);
  return urls;
}

test("every local src and href resolves to a file in the repository", () => {
  const references = page.querySelectorAll("[src], [href]");
  assert.ok(references.length > 0, "no src or href attributes found");
  for (const element of references) {
    const url = element.getAttribute("src") ?? element.getAttribute("href");
    if (isPageLocal(url)) assertFileExists(url, pageFile);
  }
});

test("no script or stylesheet is loaded from the network", () => {
  for (const script of page.querySelectorAll("script[src]")) assertLocal(script.getAttribute("src"), "script");
  for (const link of page.querySelectorAll("link[href]")) assertLocal(link.getAttribute("href"), "link");
  for (const style of page.querySelectorAll("style")) {
    for (const url of cssUrls(style.text)) assertLocal(url, "resource in inline style");
  }
});

test("local stylesheets reference only files in the repository", () => {
  const sheets = page.querySelectorAll('link[rel="stylesheet"]').map((link) => link.getAttribute("href")).filter(isPageLocal);
  assert.ok(sheets.length > 0, "no local stylesheet found");
  for (const href of sheets) {
    const sheet = assertFileExists(href, pageFile);
    for (const url of cssUrls(fs.readFileSync(sheet, "utf8"))) {
      assertLocal(url, `resource in ${href}`);
      if (isPageLocal(url)) assertFileExists(url, sheet);
    }
  }
});

test("a percent-encoded local reference resolves to the decoded file name", () => {
  assertFileExists("images/stick%6Dan.svg", pageFile);
});

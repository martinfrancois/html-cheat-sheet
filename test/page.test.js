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

function assertFileExists(url, from) {
  const target = path.resolve(path.dirname(from), url.split(/[?#]/)[0]);
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
  for (const script of page.querySelectorAll("script[src]")) {
    assert.ok(!isRemote(script.getAttribute("src")), `remote script: ${script.getAttribute("src")}`);
  }
  for (const link of page.querySelectorAll("link[href]")) {
    assert.ok(!isRemote(link.getAttribute("href")), `remote link: ${link.getAttribute("href")}`);
  }
  for (const style of page.querySelectorAll("style")) {
    for (const url of cssUrls(style.text)) assert.ok(!isRemote(url), `remote resource in inline style: ${url}`);
  }
});

test("local stylesheets reference only files in the repository", () => {
  const sheets = page.querySelectorAll('link[rel="stylesheet"]').map((link) => link.getAttribute("href")).filter(isPageLocal);
  assert.ok(sheets.length > 0, "no local stylesheet found");
  for (const href of sheets) {
    const sheet = assertFileExists(href, pageFile);
    for (const url of cssUrls(fs.readFileSync(sheet, "utf8"))) {
      assert.ok(!isRemote(url), `remote resource in ${href}: ${url}`);
      if (isPageLocal(url)) assertFileExists(url, sheet);
    }
  }
});

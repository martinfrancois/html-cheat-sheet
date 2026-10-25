# HTML cheat sheet

One HTML page that lists common tags with a short description, the example code and the rendered result side by side.

## What it does

`index.html` is a table with one row per tag or tag group, from `<html>` and `<head>` down to `<table>`, `<details>` and form elements. Each row shows the tag, whether it is inline or block, what it is for, the example markup in a read-only CodeMirror editor with syntax colouring, and that same markup rendered by the browser. The table header stays visible while you scroll.

![The cheat sheet opened in a browser, showing the first rows of the table](docs/screenshot.png)

## Requirements

A browser. Every script, stylesheet, font and image is in the repository, so the page also opens without a network connection.

Node.js 24 is needed only to run the test.

## Install

```sh
git clone https://github.com/martinfrancois/html-cheat-sheet.git
```

## Usage

Open `index.html` in a browser, for example:

```sh
xdg-open html-cheat-sheet/index.html
```

On macOS use `open`, on Windows `start`. Editing a row is a matter of editing the corresponding `<tr>` in `index.html`: the `tg-code` cell holds the escaped example and the `tg-output` cell holds the same markup unescaped.

## Test

The test parses `index.html`, checks that every local `src` and `href` points at a file in the repository, that no script or stylesheet is loaded over `http(s)`, and that every `url()` inside the local stylesheets resolves as well.

```sh
npm ci
npm test
```

## Limitations

- The table is about 1550 pixels wide, so on a narrower window the output column sits to the right of the visible area and the page scrolls sideways.
- The `<a>` example links to google.ch. Following that link needs a network connection; nothing else on the page does.

## Third-party code

CodeMirror, jQuery, Materialize, normalize.css, floatThead, the GitHub Light theme and the Roboto fonts are vendored under `lib/`, `mode/` and `addon/`. Their versions and licenses are listed in [licenses/README.md](licenses/README.md).

## License

MIT, see [LICENSE](LICENSE). The third-party files keep their own licenses as listed above.

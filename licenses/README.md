# Third-party files

Everything under `lib/`, `mode/` and `addon/` is third-party code, copied
unchanged from the release named below unless a note says otherwise. The
page itself, `images/stickman.svg` and the test are covered by the MIT
license in the repository root.

| Files | Project and version | License | Source |
| --- | --- | --- | --- |
| `lib/codemirror.js`, `lib/codemirror.css`, `mode/xml/xml.js`, `mode/javascript/javascript.js`, `mode/css/css.js`, `mode/htmlmixed/htmlmixed.js`, `mode/htmlembedded/htmlembedded.js`, `addon/mode/multiplex.js` | CodeMirror 5.27.4 | MIT, `codemirror-5.27.4.txt` | https://codemirror.net/5/ |
| `lib/github.css` | GitHub Light theme 0.4.2 from github-syntax-theme-generator, edited: transparent editor background, `Roboto Mono` added to the font stack | MIT, `github-light-0.4.2.txt` | https://github.com/primer/github-syntax-theme-generator |
| `lib/jquery-3.2.1.min.js` | jQuery 3.2.1 | MIT, `jquery-3.2.1.txt` | https://jquery.com/ |
| `lib/normalize.css` | normalize.css 7.0.0 | MIT, `normalize.css-7.0.0.txt` | https://necolas.github.io/normalize.css/ |
| `lib/materialize/css/materialize.min.css`, `lib/materialize/js/materialize.min.js` | Materialize 0.99.0 | MIT, `materialize-0.99.0.txt` | https://www.npmjs.com/package/materialize-css/v/0.99.0 |
| `lib/materialize/fonts/roboto/*` | Roboto, as bundled with Materialize 0.99.0 | Apache License 2.0, `roboto-apache-2.0.txt` | https://fonts.google.com/specimen/Roboto |
| `lib/jquery.floatThead-2.0.3.min.js` | floatThead 2.0.3 | MIT, `floatthead-2.0.3.txt` | https://mkoryak.github.io/floatThead/ |

`lib/codemirror.js` is the build from the codemirror.net 5.27.4 zip. It
differs from the npm build of the same version only in whitespace and
semicolons.

| `lib/RobotoMono.ttf` | Roboto Mono variable font, unmodified | SIL Open Font License 1.1, `roboto-mono-ofl.txt` | https://github.com/google/fonts/tree/main/ofl/robotomono |

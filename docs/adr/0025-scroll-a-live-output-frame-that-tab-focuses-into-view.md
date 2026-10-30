---
status: accepted
date: 2026-10-30
decision-makers: [implementing coding agent]
consulted: []
informed: [Future maintainers and agents working on this repository]
---

# Scroll a live output frame that Tab focuses into view

## Context and Problem Statement

Each live output frame is a tab stop, also when its example has nothing focusable inside. In
Firefox, Tab moved focus to the frames of `bdi` and `br` while they sat below a 390 by 844 pixel
screen, so a keyboard reader couldn't see where focus went, which WCAG 2.4.11 Focus Not Obscured
rules out
([html-cheat-sheet issue #21](https://github.com/martinfrancois/html-cheat-sheet/issues/21)).

The cause is in the browsers, not in this page. On a page with none of its styles or scripts, a
button and an `<iframe srcdoc="<p>Text</p>">` below the screen, Tab focuses the frame and none of
Chromium 156, Firefox 159 or WebKit 27.2 scrolls. A frame with a link inside is different: the
browser scrolls to the link. Chromium and WebKit hid the gap on this page by chance. Tab reaches
the example's code block just before the frame, they scroll the whole code block into view above
the bottom scroll padding, and the frame's top edge comes along. Firefox scrolls only to an
element that is entirely out of sight, so it left the code block half shown and the frame below
the screen. `scroll-padding-bottom`, `content-visibility` and the frames being created near the
screen play no part: none of them is on the test page.

Firefox scrolled to such a frame up to version 125, after
[Mozilla bug 1328043](https://bugzilla.mozilla.org/show_bug.cgi?id=1328043). Firefox 126 stopped,
with [Mozilla bug 1886182](https://bugzilla.mozilla.org/show_bug.cgi?id=1886182), which turned on
`dom.disable_tab_focus_to_root_element` from
[Mozilla bug 1483828](https://bugzilla.mozilla.org/show_bug.cgi?id=1483828). The HTML standard
doesn't say whether sequential focus navigation scrolls at all
([whatwg/html issue #6694](https://github.com/whatwg/html/issues/6694)). Should the page scroll the
frame itself, or keep such frames out of the tab order?

## Decision Drivers

* Focus never lands out of sight, in Chromium, Firefox and WebKit (WCAG 2.4.11).
* Links and form controls in live output stay reachable with Tab (WCAG 2.1.1).
* No guess about what a document the page can't read contains: the sandbox gives each frame an
  origin of its own ([ADR 0003](0003-render-live-output-in-sandboxed-iframes.md)).

## Considered Options

* Scroll a frame that Tab focuses into view
* Take frames with nothing focusable out of the tab order
* Leave it to the browsers

## Decision Outcome

Chosen option: "Scroll a frame that Tab focuses into view", because it fixes the gap in all three
browsers and can't make anything in an example unreachable.

`showFocusedFrame` in `src/scripts/live-output.ts` runs a task after each Tab or Shift+Tab keydown.
When focus is then on a live output frame that is entirely outside the part of the screen left by
the page's scroll padding, it calls `scrollIntoView({ block: "nearest" })`, which keeps the same
padding.

### Consequences

* Good, because a frame that Tab focuses is in view in all three browsers, not only in Firefox.
* Good, because the tab order stays the browser's own, so every link and control in live output is
  reached as before.
* Neutral, because the keydown of a Tab pressed inside a frame goes to the frame's document, not
  the page. That needs nothing: Tab from inside a frame reaches the page's own elements, which the
  browser scrolls to.
* Bad, because a frame with nothing focusable stays a tab stop that does nothing. Taking it out
  needs the second option.

### Confirmation

Three tests in `test/e2e/accessibility.spec.ts` run in Chromium, Firefox and WebKit:

* "Tab never moves focus to a place out of sight" repeats the probe from the issue: 40 presses of
  Tab from the last link of the `mark` entry at 390 by 844 pixels.
* "Tab and Shift+Tab bring a live output frame into view" starts with the `bdi` frame just below
  the screen, then just under the sticky header. It fails in all three browsers without the
  workaround.
* "browsers still leave a frame that Tab focuses below the screen" checks the browser gap on a page
  without the site's styles and scripts. When it fails, that browser scrolls on its own; once it
  fails in all three, remove `showFocusedFrame` and the test.

## Pros and Cons of the Options

### Scroll a frame that Tab focuses into view

The page listens for Tab and Shift+Tab and, once focus has moved, scrolls a live output frame into
view when none of it is visible.

* Good, because it acts only when focus is on a frame out of sight, so the browser's own scrolling
  is left alone everywhere else.
* Bad, because it is a workaround for browser behavior and needs the test above to show when it
  can go.

### Take frames with nothing focusable out of the tab order

Give the `<iframe>` `tabindex="-1"` when its example has nothing focusable inside, so Tab skips it.

* Good, because it removes a tab stop that does nothing.
* Bad, because the page can't read the frame's document, so the frame would have to report what
  it holds, and no API answers "can Tab reach anything here". A hand-written list of focusable
  elements would miss cases such as scroll containers, `<video controls>` or content an example's
  script adds later, and `tabindex="-1"` on the `<iframe>` makes everything inside unreachable with
  Tab in all three browsers.

### Leave it to the browsers

Change nothing and report the gap upstream.

* Good, because it needs no code.
* Bad, because focus stays out of sight in Firefox today, and in Chromium and WebKit wherever the
  layout doesn't bring the frame along by chance.

## More Information

Measured on 2026-10-30 in the `mcr.microsoft.com/playwright:v1.64.1-noble` image, with
Playwright's Chromium 156, Firefox 157 and WebKit 27.2, and with release builds of Firefox 125.0.3,
126.0 and 159.0 from Mozilla, driven through WebDriver BiDi. On the test page from
[Mozilla bug 1328043](https://bugzilla.mozilla.org/show_bug.cgi?id=1328043), a button and an empty
`<iframe>` 10,000 pixels down, Firefox 125.0.3 scrolled to the frame and 126.0 didn't. Setting
`dom.disable_tab_focus_to_root_element` to `false` made 126.0 scroll again, and setting it to `true`
stopped 125.0.3. Firefox 159 has no such setting any more. Playwright's own Firefox build stops
twice in each frame, the stock build once. Mozilla's Bugzilla had no open report of this on
2026-10-30.

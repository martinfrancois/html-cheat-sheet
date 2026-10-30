// The longest code chip, or word in one, kept on one row, such as `(min-width: 30em)` or
// margin-inline. Breaking one at its space, hyphen or question mark reads as two separate pieces
// of code. A longer one may break, so it never sticks out of the text on a phone: in Firefox and WebKit a
// 24-character chip fills a whole line of a list on a 320 px screen, and a full stop after it
// stuck out. 22 keeps prefers-reduced-motion whole. In a narrower column, such as beside a classic
// scrollbar, chips wrap: docs/adr/0027-let-kept-together-pieces-wrap-in-a-narrower-column.md
export const CHIP_ROW = 22;

// The whole characters a code row holds on a 320 px screen: 264 px of code block at 9.48 px per
// character in Firefox and WebKit (Chromium's 9 px fits 29).
export const CODE_ROW = 27;

// The whole characters a code row holds in the entry column a 360 px screen leaves, 20.5rem, where
// the narrow variant ends (src/styles/global.css): 304 px of code block at 9.48 px per character.
export const WIDE_CODE_ROW = 32;

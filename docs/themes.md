# Themes

A theme is a folder in `themes/` with:

- **`theme.css`**: design tokens and `@font-face` rules. Loaded after `engine/deckhand.css`.
- **`theme.md`**: the style guide that AIs and people follow (palette, typography, rail advice, motifs, SVG rules and an image prompt recipe).
- **`fonts/`**: self-hosted font files and their licences, so decks work offline.

`npm run new -- <deck> --theme <name>` copies the theme into the deck as `theme/`.

## Token contract

Components use only these tokens. A theme should set all of them. Missing tokens fall back to the neutral defaults in `engine/deckhand.css`.

| Token | Meaning |
| --- | --- |
| `--bg` | Slide background |
| `--bg-2` | Rail, chips and recessed areas |
| `--bg-3` | Deeper recess (rare) |
| `--card` | Raised surfaces: cards, panels |
| `--ink` | Main text, line art, hard shadows |
| `--ink-2` | Secondary text |
| `--ink-3` | Meta text, captions |
| `--ink-4` | Hairlines, disabled |
| `--rule`, `--rule-2` | Borders and dividers (strong, faint) |
| `--accent` | The signal colour: emphasis, progress, focus |
| `--accent-ink` | Accent for small text, with enough contrast on `--bg` |
| `--accent-wash` | Accent at about 10% opacity, for highlights |
| `--accent-2` | Secondary colour for added, kept and after states |
| `--accent-2-wash` | Secondary at about 10% opacity |
| `--on-accent` | Text on accent fills |
| `--font-display` | Titles, big numbers, pull lines |
| `--font-body` | Body text |
| `--font-mono` | Kickers, references, code, labels |
| `--title-size`, `--title-weight`, `--title-leading`, `--title-tracking` | Slide title type |
| `--display-size`, `--display-weight` | Title-slide type |
| `--lede-size` | Lede text size |
| `--grain` | Paper grain opacity, 0 to disable |
| `--rail-width` | Rail column width (default 380px; the rails are drawn for 380px) |

## Creating a theme

1. Copy `themes/well-log` to `themes/<name>`.
2. Pick fonts that suit the subject, and bundle them as WOFF2 under `fonts/` with their licence files. Prefer variable fonts and the Latin subset to keep decks small. Avoid fonts that every generated site uses.
3. Set the palette. Check contrast: `--ink` and `--ink-2` on `--bg` and `--card` must reach WCAG AA (4.5:1). `--accent-ink` must too, because it's used for small text.
4. Rewrite `theme.md` for the new style. Explain when to use the theme, the palette rules, the motifs, and an image prompt recipe that produces images in the same style.
5. Point `demo/gallery.html` at the new theme temporarily, run `npm run demo`, and review every screenshot. Every component must look intentional, not just legible.

## Dark themes

Components use `--ink` for hard shadows and `--bg` for text on ink-filled surfaces such as `.quote-card` and the presenter header. In a dark theme, make `--ink` the light text colour and `--bg` the dark background, and check those surfaces carefully. The grain uses `mix-blend-mode: multiply`, which has little effect on dark backgrounds, so set `--grain: 0` or tune it.

## Choosing a theme for a talk

Read each theme's `theme.md` ("Use when …") and pick the one that suits the audience and subject. If none fits, tell the user, and suggest making a theme rather than forcing the closest one.

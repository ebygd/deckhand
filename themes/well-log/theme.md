# Theme: well-log

Warm technical paper, black ink, and one signal red. It reads like an engineering logbook or a well log: precise, annotated and calm, with one accent only where it matters. The display face is Besley, a Clarendon revival (the typeface of 1860s industrial print), so the theme suits engineering, energy, infrastructure and "how we built it" stories. It also works for any talk that benefits from a measured, evidence-first tone.

## Palette

| Token | Hex | Use |
| --- | --- | --- |
| `--bg` | `#F2EDE3` | Slide paper |
| `--bg-2` | `#E9E2D4` | Rail, chips, recessed areas |
| `--bg-3` | `#DED5C3` | Rare: deeper recess |
| `--card` | `#F8F4EC` | Cards, raised surfaces |
| `--ink` | `#17140F` | Text, line art, hard shadows |
| `--ink-2` | `#4B453B` | Secondary text |
| `--ink-3` | `#8C8476` | Meta text, captions |
| `--ink-4` | `#B9B09F` | Hairlines, disabled |
| `--accent` | `#FF1243` | Signal red: the one thing that matters on a slide |
| `--accent-ink` | `#C70A36` | Red for small text (meets contrast on paper) |
| `--accent-2` | `#007079` | Teal: additions, "kept", positive states |

Rules:

- One red emphasis per slide region. In titles, at most one `<em>` phrase.
- Never set small text in `--accent`; use `--accent-ink`.
- Teal means added, kept or after. Red means focus or removed. Don't swap them.
- No gradients and no blurred drop shadows. Depth comes from hard offset shadows (`9px 9px 0`) in ink, red or teal.

## Typography

- **Display (Besley)** for slide titles, big numbers and pull lines. Titles are weight 500 at 84px; big numbers are weight 600. Italic is reserved for the emphasised phrase (in red) and for pull lines.
- **Body (Schibsted Grotesk)** for ledes, lists and card text. Keep it at 21px or larger; 28–32px for main text.
- **Mono (Martian Mono)** for kickers, dates, references, units, file names and code. Kickers are uppercase; units and refs keep their case (wrap them in `.u` / `.ref`).

## Rail

- `well`: for stories with a strong sense of progress over time, especially engineering and energy topics. Depth = time; set `data-rail-unit="m"` and choose a scale such as 1 day = 100 m.
- `timeline`: for any chronological story.
- `none`: for short talks (under 6 slides) or talks without a timeline.

## Visual motifs

- **Evidence cards:** commit cards, diffstats, file lists and real numbers. Prefer real data to illustrations.
- **Rubber stamps** for verdicts (Removed, Kept, Needed). They slam in; don't overuse them.
- **Proofreading strikes** (`.strike` with an `<ins>` correction) when a word or decision changed.
- **Schematic line art:** wireframes, trees and before/after diagrams.
- **Paper grain** comes from the theme; keep images matte to match.

## Drawing SVG illustrations in this theme

- Strokes: `var(--ink)` at 1.2–1.6px for structure and 1px `var(--ink-2)` for detail. Square or round caps, no blur.
- Fills: none, `var(--ink)` for small solid shapes, `var(--bg-2)` / `var(--card)` for panels.
- Accent: one element in `var(--accent)`. Use `var(--accent-2)` only for added or kept states.
- Labels: Martian Mono, 10–13px, `var(--ink-3)`, with thin leader lines to what they label.
- Use theme tokens through CSS classes or `style="stroke:var(--ink)"` so illustrations adapt if the theme changes.

## Raster image prompt recipe

Use this when an AI image generator is needed, for example to illustrate a concept with no data or UI to show.

**Prompt template**

> Technical line illustration of {subject}, black ink linework on warm off-white paper (#F2EDE3), engineering-drawing style, precise thin strokes, cross-hatching for shading, a single small accent in signal red (#FF1243) on {the one important detail}, generous empty space, matte paper grain, flat lighting, no gradients, no text, 16:9.

**Negative prompt**

> photorealistic, 3D render, glossy, neon, gradients, lens flare, bokeh, stock photo, people looking at camera, logos, text, watermark, busy background, multiple accent colours.

**After generating**

- Prefer one image per slide at most. Place it with `.figure` and give it a short mono caption stating what it shows.
- If the result is too saturated, desaturate it and set `mix-blend-mode: multiply` on the `<img>` so it sits on the paper.
- Store it as `assets/<slide-number>-<topic>.webp` (1920px wide maximum) and add meaningful `alt` text.
- Never use images to carry facts. Numbers, names and claims belong in text or real-data components.

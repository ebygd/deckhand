# Visuals and images

Choose visuals in this order. Stop at the first one that tells the story.

1. **Real evidence:** numbers, commit cards, changelog entries, quotes and screenshots from the actual work.
2. **Built-in components:** flows, cycles, trees, wireframes, timelines and options (see `docs/components.md`).
3. **Inline SVG diagrams** drawn in the theme style.
4. **Generated raster images**, only for concepts that have no data or UI to show.

## Screenshots

- Capture at 1920px wide or more, crop to the part that matters, and save as WebP or PNG in `assets/`.
- Name files `<slide-number>-<topic>.webp`, for example `04-schedule.webp`.
- Remove or blur personal data, real customer names and internal URLs before using a screenshot.
- Place screenshots with `.figure` and a short caption in the form "what · where · when".

## Inline SVG diagrams

Draw with theme tokens so the diagram follows the theme:

```html
<svg viewBox="0 0 640 300" role="img" aria-label="Three services calling one queue">
  <rect x="20" y="40" width="160" height="70" style="fill:var(--card);stroke:var(--ink);stroke-width:1.6"/>
  <text x="100" y="82" text-anchor="middle" style="font:600 18px var(--font-body);fill:var(--ink)">API</text>
  <path d="M180 75 H300" style="stroke:var(--ink-2);stroke-width:1.4;fill:none"/>
  <circle cx="300" cy="75" r="6" style="fill:var(--accent)"/>
</svg>
```

- Structure in `var(--ink)` at 1.2–1.6px, detail in `var(--ink-2)` at 1px.
- Put one accent element in `var(--accent)`, and use `var(--accent-2)` only for "added" or "kept".
- Labels in `var(--font-mono)` at 10–13px in `var(--ink-3)`, or `var(--font-body)` at 16px or larger for main labels.
- No gradients, glows or blurred shadows.
- Give every diagram `role="img"` and an `aria-label` that states what it shows.
- Size it to fit the layout column. A `viewBox` with `width:100%` scales cleanly.

## Generated images

Use an image generator only when the slide needs a picture of a concept, a place or an object, and no real image exists.

1. Read the active theme's `theme.md`. Each theme has a **raster image prompt recipe** with a prompt template, a negative prompt and post-processing steps.
2. Fill in the template with one subject and one accent detail. Generate in 16:9 at 1920px wide or larger, or in the aspect of the column it goes in.
3. Reject results with text, logos, people looking at the camera, extra accent colours or a photorealistic style (unless the theme asks for it).
4. Save it in `assets/`, place it with `.figure`, and write `alt` text that describes the image, not the prompt.
5. Never use a generated image to carry a fact. Facts belong in text.

When the presenter has no image generator, write the prompt into `script.md` under "Images to create" and use a component or SVG in the meantime.

## Matching a different style

If the presenter wants a style that no theme provides:

1. Create a theme (see `docs/themes.md`) rather than overriding colours in every deck.
2. Describe the style in the theme's `theme.md`, including the image prompt recipe. That keeps every future slide, SVG and image consistent.

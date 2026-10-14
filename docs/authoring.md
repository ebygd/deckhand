# Authoring a deck

A deck is a folder with an `index.html`, a copy of `engine/`, a copy of a theme in `theme/`, an `assets/` folder and a `script.md`. `npm run new` creates it. The folder works offline: open `index.html` in Chrome or Edge.

## File anatomy

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Talk title</title>
<link rel="stylesheet" href="engine/deckhand.css">
<link rel="stylesheet" href="theme/theme.css">
</head>
<body>
<main class="deck" data-rail="timeline" data-rail-unit="weeks">

  <section class="slide" data-pos="1" data-label="Kick-off" data-time="60">
    <p class="kicker rise" style="--i:0">Week 1 · kick-off</p>
    <h1 class="rise" style="--i:1">What we set out<br>to <em>build</em>.</h1>
    <p class="lede rise" style="--i:2">One supporting sentence.</p>
    <aside class="notes">
      <p>What the presenter says.</p>
    </aside>
  </section>

</main>
<script src="engine/deckhand.js"></script>
</body>
</html>
```

Load the engine CSS first and the theme CSS second. Load only `engine/deckhand.js`; it loads `rails.js` and `components.js` itself. The engine wraps the deck in a fixed 1920×1080 stage, scales it to the window, and adds the rail, HUD, overlays and presenter view.

## Deck attributes (`<main class="deck">`)

| Attribute | Values | Default | Purpose |
| --- | --- | --- | --- |
| `data-rail` | `timeline`, `well`, `none` | `none` | Progress rail on the left |
| `data-rail-unit` | text, e.g. `m`, `weeks`, `v` | empty | Unit after positions in the rail and watermark |
| `data-rail-max` | number | largest `data-pos` | Position at the bottom of the rail |
| `data-rail-ticks` | number | a round step of max/5 | Spacing of labelled ticks |
| `data-rail-caption` | text | empty | Vertical caption along the left edge |
| `data-watermark` | `pos` | off | Large outline number of the position on positioned slides |
| `data-overview-title` | text | `All slides` | Heading of the overview (O) |

## Slide attributes (`<section class="slide">`)

| Attribute | Purpose |
| --- | --- |
| `data-pos` | Position on the rail (a day, week, step or version). Slides with a position are **main** slides. |
| `data-phase` | `intro`, `main` or `outro`. Optional: slides before the first `data-pos` are intro, slides after the last are outro, and slides between inherit the previous position. |
| `data-label` | Short name in the rail, overview and run sheet. 22 characters or fewer. Defaults to the title. |
| `data-meta` | Small line above the label in the rail. Defaults to the position and unit, or the phase. |
| `data-ref` | Reference shown in the overview, e.g. a commit hash or document ID. |
| `data-time` | Target seconds for the presenter timer. Default 60. |

Without any `data-pos`, slides are spaced evenly and numbered.

## Entrance animation

Add `rise` and an index to elements that should arrive in sequence when the slide opens:

```html
<p class="kicker rise" style="--i:0">…</p>
<h1 class="rise" style="--i:1">…</h1>
<div class="rise" style="--i:2">…</div>
```

Don't put `rise` on an element that also has `data-step` or `data-when`.

## Reveals and state changes

- `data-step="N"` hides an element until step N, then fades it in.
- `data-when="N"` keeps an element visible and adds `.is-on` at step N. Components use this for strike-outs (`.strike`), dimming (`.u-dim`), rejected options (`.options`) and before/after trees (`.tree`).
- The slide gets `step-1`, `step-2` … classes as steps advance, for deck-specific CSS.
- Steps on a slide run from 1 to the highest N used. Going back to a previous slide shows it fully revealed.

## Speaker notes

```html
<aside class="notes">
  <p>Spoken text, in the presenter's voice.</p>
  <p><span class="cue" data-cue="1"></span>What to say after the first reveal.</p>
  <p class="opt">Optional aside, if there is time.</p>
  <p class="direction">Stage direction · switch to the demo</p>
  <ol><li>Demo step one.</li></ol>
</aside>
```

- A cue renders as a small "reveal" marker. It turns grey once that step has been shown.
- `.direction` lines and their lists are not counted as spoken words. Everything else is, at 130 words per minute, to estimate time.

## Rails

- `timeline`: a plain axis. Use for any chronological story.
- `well`: a drilling schematic where depth stands for position, with casing, a drill bit marker, and tubing that flows on the last slide. Suits engineering and "how we built it" stories.
- `none`: no rail; slides get more width. Use for short talks or talks without a sequence.

Labels are spread evenly down the rail and connected by leader lines to their true position. With more than about 22 slides, the rail switches to compact labels.

### Writing a new rail

Register an object on `window.Deckhand.rails` in a script loaded before `deckhand.js`. The built-in rails are added alongside it, and a rail with the same name overrides the built-in one.

```js
window.Deckhand = window.Deckhand || {};
window.Deckhand.rails = Object.assign(window.Deckhand.rails || {}, {
  mine: {
    build(ctx) { return '<svg …>…</svg>'; }, // ctx: { slides, max, ticks, unit, caption }
    update(rail, state, ctx) {},              // state: { phase, pos, index }
  },
});
```

Use `Deckhand.railGeometry` for the shared coordinates and copy the label approach from `engine/rails.js`.

## Presenting

| Key | Action |
| --- | --- |
| → Space PageDown Enter | Next reveal or slide (clickers send these) |
| ← PageUp Backspace | Back |
| P | Presenter window (notes, timer, pace, next slide, run sheet), synced both ways |
| N | Notes drawer on the audience screen, for rehearsal |
| O | Overview of all slides |
| F or F5 | Fullscreen |
| B or . | Blank the screen |
| Home / End | First / last slide |
| + / − | Notes size in the presenter window |

Every slide has a URL: `index.html#/4` opens slide 4, and `#/4/2` opens it at step 2.

## JavaScript API

After start-up the engine exposes `window.Deckhand` with `go(index, step)`, `next()`, `prev()`, `slides` (titles, labels, positions, steps, timing) and `current`. It fires `deckhand:ready` and `deckhand:change` events on `document`. `tools/verify.mjs` uses this API.

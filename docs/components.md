# Components

Every component reads theme tokens, so it adapts to any theme. See them rendered in `demo/gallery.html`. Copy the markup, then replace the content.

General rules:

- Don't nest cards in cards or put more than two components side by side.
- Use real content. If you don't have a number, use a component that doesn't need one.
- Layout helpers: `.grid-2`, `.grid-3`, `.grid-4`, `.grid-main-side` (content + 440px side), `.grid-side-main`, `.stack`, `.align-center`.
- Spacing helpers: `.gap-s` (24px), `.gap-m` (46px), `.gap-l` (72px) top margins, and `.push-bottom` to pin an element to the bottom of the slide.

## Typography

| Element | Use |
| --- | --- |
| `p.kicker` | Mono line above the title: context, date, position, reference. Add `.is-command` for lowercase code such as a shell command. Wrap units in `<span class="u">` and references in `<span class="ref">`. |
| `h1` | The slide title. Up to 2 lines; one `<em>` phrase for emphasis. |
| `h1.display` | Large title for title slides only. |
| `p.lede` | One or two supporting sentences under the title. |
| `p.pull` | A closing line in display italics. Use sparingly. |
| `.eyebrow` | Small label above a list or group. |
| `.mono-line` | A line of mono text, such as a commit message. |

### Strike with correction

Use it when a word or decision changed. The strike draws on its step.

```html
<p class="mono-line"><span class="ref">3f8a21c</span> Project name: <s class="strike" data-when="1">MVP<ins>prototype</ins></s></p>
```

## Lists

```html
<ol class="numbered">
  <li><span><b>Lead word</b> and the rest of the point.</span></li>
</ol>

<ol class="checklist">
  <li>Plain item</li>
</ol>
```

Wrap `.numbered` items in a `<span>` when they contain bold text. Use 3–5 items.

## Compare

Two or three definitions or options, with the chosen one marked.

```html
<dl class="compare">
  <div><dt>Option one</dt><dd>What it is, in one sentence.</dd></div>
  <div class="is-picked"><dt>Option two</dt><dd>The one we chose.</dd></div>
</dl>
```

## Card

```html
<div class="card is-strong"><h3>Heading</h3><p>One or two sentences.</p></div>
```

Variants: plain `.card`, `.is-strong` (ink border and shadow), `.is-accent` (accent shadow, for the one card that matters).

## Quote card

A quote, a prompt, a chat message or a code line. Use `.is-light` for a second, related quote.

```html
<figure class="quote-card">
  <figcaption><span>Who or what</span><span>When</span></figcaption>
  <blockquote>The exact words. Quote real text; trim with […] if needed.</blockquote>
</figure>
```

## Timeline

```html
<ol class="timeline">
  <li><time>07:54</time><span>What happened</span></li>
  <li class="is-key"><time>Day 2</time><span>The key moment</span></li>
</ol>
```

Items with `.is-key` or `data-step` get an accent dot.

## Big number and stats

```html
<div class="bigstat"><b>3</b><span>days from sketch<br>to a working URL</span></div>

<dl class="stats">
  <div><dt>6</dt><dd>weeks</dd></div>
  <div><dt>48</dt><dd>fixes</dd></div>
</dl>
```

One big number per slide. A stats strip takes three to five items, and every number needs a source.

## Commit card

Evidence from version control. `.diffbar` is drawn from `data-plus` and `data-minus`.

```html
<article class="commit">
  <header><span class="ref">7c4d9e2</span><time>12.03.2026</time></header>
  <h3>The change, in plain words</h3>
  <p class="diffstat"><span>24 files changed</span><span class="plus">+3 412</span><span class="minus">−180</span></p>
  <div class="diffbar" data-plus="3412" data-minus="180"></div>
  <ul class="files">
    <li><span>Checkout.tsx</span><b>+610</b></li>
    <li class="more"><span>… and 23 more files</span></li>
  </ul>
  <p class="commit-note">Optional one-line takeaway.</p>
</article>
```

Use real hashes and stats from `git show --stat`. If the commit message names a person the audience doesn't know, describe the change instead.

## Feed

Dated entries, such as a changelog or release notes.

```html
<div class="feed">
  <header><span>What’s new</span><span>changelog</span></header>
  <article><time>09.10</time><p>A short, user-facing description.</p></article>
</div>
```

## Flow

A chain of steps. Mark the changed step with `.is-hot`. Pair a before flow (`.u-dim` with `data-when`) with an after flow (`data-step`).

```html
<div class="flow u-dim" data-when="1"><span class="flow-label">Before</span><ol><li>Idea</li><li>Designer</li><li>Developer</li><li>App</li></ol></div>
<div class="flow is-accent" data-step="1"><span class="flow-label">Now</span><ol><li>Idea</li><li class="is-hot">Designer + AI</li><li>App</li></ol></div>
```

Keep it to six steps or fewer.

## Cycle

A loop diagram, drawn from `data-nodes` (three to six short words). The centre can show a number.

```html
<figure class="cycle" style="--size:520px" data-nodes="Demo, Feedback, Prompt, Ship" data-center="48" data-center-label="fixes in 6 weeks"></figure>
```

## Options

Alternatives that were tried. On the `data-when` step, every option without `.is-kept` is struck out.

```html
<ul class="options" data-when="1">
  <li><div class="mini-bars"><i class="is-accent" style="--x:4;--w:40;--y:0"></i><i style="--x:48;--w:30;--y:1"></i></div><h4>Library A</h4><p>commercial</p></li>
  <li class="is-kept"><div class="mini-bars">…</div><h4>Our own</h4><p>kept</p></li>
</ul>
```

`.mini-bars` draws a small abstract chart. Each `<i>` takes `--x` and `--w` (percent) and `--y` (lane 0–2), with optional `.is-accent`, `.is-accent-2` or `.is-muted`. Use three to five options.

## Stamps and verdict

```html
<div class="verdict" data-step="1"><span class="stamp">Removed · −1 240 lines</span><p>Kept: the one we already had.</p></div>

<div class="stamps" data-step="1">
  <div style="--i:0;--r:-3deg"><span class="stamp is-accent-2">Needed</span><p>Must have</p></div>
  <div style="--i:1;--r:2deg"><span class="stamp is-ink">Redundant</span><p>Overlaps</p></div>
</div>
```

Stamps slam in one after another when their container is revealed. Variants: `.is-accent-2`, `.is-ink`, `.is-accent`, `.is-ghost`. Rotate with `--r` between −3deg and 3deg. Use stamps for verdicts only, once or twice per deck.

## Tree

A before/after structure, such as a data model or folder layout. Mark the moving node with `<mark>`. Keep the `<pre>` content unindented in the source.

```html
<figure class="tree" data-when="1">
  <figcaption>Before</figcaption>
<pre>Order
└── Customer
    └── <mark>Discount</mark></pre>
  <p>One-line caption.</p>
</figure>
<figure class="tree is-strong" data-step="1">…</figure>
```

## Wireframes

Low-fidelity drawings of screens, for showing how a design changed. Use `.versions` with up to four items and mark the chosen one with `.is-picked`.

```html
<ol class="versions">
  <li>
    <div class="wf" aria-hidden="true">
      <div class="wf-backdrop"></div>
      <div class="wf-modal"><i class="wf-bar"></i><i class="wf-field"></i><i class="wf-field is-short"></i><i class="wf-btn"></i></div>
    </div>
    <h4><span>v1</span>Dialog</h4><p>August</p>
  </li>
</ol>
```

Primitives:

- **Text and buttons:** `wf-bar` (heading), `wf-field` (`.is-short`), `wf-btn` (`.is-ghost`).
- **Tables and rows:** `wf-rows` (rows inside a modal), `wf-table` with `wf-row` (`.is-head`, `.is-edit`).
- **Steps and panels:** `wf-steps`, `wf-stepper` (`b.is-done`, `b.is-now`), `wf-panel`, `wf-actions`.
- **Overlays:** `wf-backdrop` with `wf-modal`.

## URL bar

```html
<p class="urlbar"><i></i><i></i><i></i><code>…/reports/q3<b>?preview=charts</b></code></p>
```

## Points

Summary rows: number, claim, explanation, evidence chip. Use 3–5 rows.

```html
<ol class="points">
  <li><span class="n">01</span><b>Faster first feedback</b><span class="d">From sketches to a clickable app</span><code>week 1 → 2</code></li>
</ol>
```

## Columns

Two to four short statements, each with an italic heading.

```html
<div class="columns">
  <article><h3>It looks finished</h3><p>Say <b>prototype</b> early and often.</p></article>
</div>
```

## Segmented toggle

An interactive switch for live comparisons. Clicking sets `data-value` on `.segmented`; style the variants in a deck `<style>` block.

```html
<div class="segmented">
  <div class="segmented-control"><button data-value="a" aria-pressed="true">A</button><button data-value="b">B</button></div>
  <div class="segmented-preview">…sample…</div>
  <p>What the toggle compares.</p>
</div>
```

## Figure

A screenshot or generated image. Put files in `assets/`. Add `.is-strong` for a hard shadow. `--h` forces a height and crops the image; leave it out to keep the whole image.

```html
<figure class="figure is-strong">
  <img src="assets/04-schedule.webp" alt="The schedule view with two rigs">
  <figcaption>Schedule view · prototype, October</figcaption>
</figure>
```

## Logtrack

A vertical chart drawn like a well log, from a comma-separated series. It works well in the side column of a title slide (`.title-layout`).

```html
<figure class="logtrack" data-title="GR · ACTIVITY" data-tag="TRACK 1" data-unit="commits / day" data-scale="sqrt"
  data-label-prefix="D" data-label-every="10" data-shade="0-2" data-shade-label="before git"
  data-footnote="git log --all" data-series="0,0,3,0,6,2,13"></figure>
```

Attributes:

- **Required:** `data-series`.
- **Scale:** `data-max` (defaults to the largest value), `data-scale` (`linear` or `sqrt`).
- **Labels:** `data-title`, `data-tag`, `data-unit`, `data-label-prefix`, `data-label-every`.
- **Shading:** `data-shade` (`from-to` rows), `data-shade-label`.
- **Extras:** `data-footnote`, `data-peak="false"` to hide the peak label.

## Title layout

```html
<div class="title-layout">               <!-- add .no-side when there is no side column -->
  <div class="title-main">
    <p class="kicker rise" style="--i:0">Context</p>
    <h1 class="display rise" style="--i:1">Title</h1>
    <p class="lede rise" style="--i:2">What the talk covers.</p>
    <p class="byline rise" style="--i:3"><span>Name</span><span>Event</span><span>Date</span></p>
  </div>
  <figure class="logtrack rise" style="--i:3" data-series="…"></figure>
</div>
```

## Your own components

If nothing fits, write a small `<style>` block in the deck. Use theme tokens (`--bg`, `--card`, `--ink`, `--ink-2`, `--rule`, `--accent`, `--accent-ink`, `--accent-2`, `--font-display`, `--font-body`, `--font-mono`), hard offset shadows rather than blurs, and the spacing helpers. If you build something reusable, propose adding it to `engine/components.css`.

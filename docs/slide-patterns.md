# Slide patterns

Recipes for individual slides, and deck structures that combine them. Pick the structure first, then the recipe for each slide.

## Sizing a deck

| Slot | Content slides | Notes |
| --- | --- | --- |
| 5 min | 4–6 | One idea each; skip reveals |
| 10 min | 7–9 | One demo of 2 min at most |
| 15 min | 10–13 | Demo of about 3 min fits |
| 20–30 min | 14–20 | Add a mid-talk summary slide |

Budget about 60 seconds per content slide, 30 for title and closing, plus demo time, then keep 10% spare. Set each slide's `data-time` and check the total in the presenter window or the `verify` output.

## Deck structures

### Project retrospective ("what we did and learned")

1. Title
2. Framing: what the project was, and its goals
3. Starting point: where it began, with the first real evidence
4. 3–6 moments in order: one slide per turning point, each backed by evidence
5. Demo (optional)
6. What we gained
7. Caveats
8. Next steps

Use the `timeline` or `well` rail with `data-pos` set to days or weeks since the start.

### Proposal or pitch ("we should do X")

1. Title
2. The problem, in the audience's terms
3. Evidence that it matters
4. Options considered (`.options` or `.compare`)
5. The proposal
6. How it works (diagram or demo)
7. Cost, risk and caveats
8. The decision we need

The `none` or `timeline` rail with plain numbering works best.

### Technical deep dive

1. Title
2. Context and constraints
3. Architecture overview (diagram)
4. 3–5 components or mechanisms, one per slide
5. Trade-offs we made
6. What we'd do differently
7. Questions

Use the `none` or `timeline` rail, with positions as sections.

### Status update

1. Title
2. Where we are, in one number or chart
3. What changed since last time (`.feed`)
4. Risks and blockers
5. Next milestones
6. Asks

Short: `none` rail, 5–7 slides.

### Teaching or workshop

1. Title
2. What you'll be able to do
3. Concept → example → try it, repeated per concept
4. Common mistakes
5. Summary and resources

## Slide recipes

Each recipe names the components to use. See `docs/components.md` for markup.

### Title

`.title-layout` with a `.kicker`, `h1.display`, `.lede` and `.byline`. Add a `.logtrack` side column when there is a real series to show; otherwise use `.title-layout.no-side`.

### Framing / definition

Use `h1`, an optional `.mono-line` with a `.strike` correction, then `.compare` (two definitions, one picked) next to a `.numbered` list. Reveal the definitions and the list on steps 1 and 2.

### Starting point

Use `.quote-card` (the first prompt, request or quote) and a `.timeline` of the first hours or days, plus a `.bigstat` revealed last.

### A moment with evidence

Put the claim in the title, a short `.lede` or `.flow` on the left, and a `.commit` card or `.figure` on the right (`.grid-main-side`). Reveal the conclusion as a `.pull` line.

### Feedback loop

Pair a `.cycle` with a number in the centre with a `.feed` of real entries.

### Alternatives tried

Show a `.urlbar` or `.kicker` with how they were compared, then `.options` (struck out on step 1), a `.verdict` stamp, and a `.pull` line on step 2.

### Team planning or decision

Use a `.lede`, then `.stamps` with 3–4 verdict words revealed together.

### Structural change

Show two `.tree` figures (before with `data-when`, after with `data-step`) and a compact `.commit` card on the last step.

### Design iteration

Use `.versions` with `.wf` wireframes; the final version gets `.is-picked` and `data-step`, and a `.pull` line closes the slide.

### Demo handoff

Use a `.checklist` of what you'll show, an optional `.segmented` teaser, and a `.stats` strip at the bottom. Put stage directions in the notes (`.direction`) and remind the presenter to press B while switching.

### Summary

Use `.points` with 3–5 rows, each with an evidence chip that points back to an earlier slide.

### Caveats

Use `.columns` with 2–3 statements, written honestly. A developer audience trusts a talk more when it names the downsides.

### Next steps

Use a `.numbered` list of what happens next, and a `.pull` line ("Thanks. Questions?") at the bottom.

## Pacing reveals

- Reveal what you're about to talk about, not everything at once.
- Use `data-when` for "this changed" moments: strike, dim, reject.
- Two or three steps per slide at most. More than that means the slide holds two ideas.

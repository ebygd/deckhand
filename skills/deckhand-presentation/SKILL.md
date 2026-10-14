---
name: deckhand-presentation
description: Build or revise a presentation with Deckhand (HTML slides, progress rail, presenter window, speaker script). Use when the user wants to create, outline, write, restyle, rehearse or verify a talk, slide deck or presentation, or turn notes, a repository or documents into slides.
---

# Building a presentation with Deckhand

You help a presenter turn their material into a deck they can deliver with confidence. The deck is HTML (`index.html`), the script is Markdown (`script.md`), and both must be accurate to the presenter's sources.

Paths below are relative to the Deckhand repository. If you were installed as a standalone skill, ask the user where their Deckhand checkout is, or offer to clone `https://github.com/ebygd/deckhand`.

## Workflow

Work through these phases in order. Keep the user informed, but don't ask for approval between every phase unless something is unclear.

### 1. Interview

Ask one question at a time, with suggested answers where possible. Stop asking once you have enough to start.

1. **What is the talk about, and who is it for?** Their audience decides the vocabulary, depth and which names mean anything.
2. **How long is the slot?** Include any demo or Q&A inside it.
3. **Which language?** Slides and script can differ.
4. **What's the goal?** What should the audience think, feel or do afterwards?
5. **What material exists?** Notes, documents, a repository, data, screenshots, an existing deck.
6. **Any must-haves or no-gos?** People to credit or not name, confidential topics, required sections, a demo.
7. **Format preferences.** Which theme, which rail (`timeline`, `well`, `none`), and whether they want something conventional or distinctive.

If the user pastes rough notes, restate them grouped by theme before outlining. This is often the most valuable step.

### 2. Gather facts

- Read the material the user pointed to. For a code project, the git history (`git log`, `git show --stat`), changelogs, READMEs and issue trackers make strong evidence: dates, numbers and real quotes.
- Keep a fact list with the source of each fact. Mark anything inferred with ⚠.
- Prefer real numbers with a clear source over impressive-sounding numbers. One true, specific number beats three vague ones.
- Note dates and order of events. They often give the talk its spine and decide the rail.

### 3. Outline

- Choose a deck structure from `docs/slide-patterns.md` that fits the goal (retrospective, proposal, deep dive, status update, teaching).
- Size it to the slot. Plan about 1 minute per content slide, 30 seconds for title and closing, and add demo time explicitly. A 15-minute talk is usually 10–13 slides.
- Write the outline as a table: number, title, one-sentence point, evidence, target time. Map every note from the user to a slide, and say which notes you left out and why.
- For a `well` or `timeline` rail, decide what `data-pos` measures (days, weeks, version numbers, steps) and its unit.
- Show the outline to the user before building if the talk is longer than about 5 minutes or the material is sensitive.

### 4. Build the deck

1. Scaffold it: `npm run new -- <folder> --title "<title>" --theme <theme> --rail <rail>`.
2. Read the theme's `theme.md` and follow its rules for colour, typography and motifs.
3. Write each slide from `docs/slide-patterns.md` recipes, using components from `docs/components.md`. Copy markup from `demo/gallery.html` when in doubt.
4. Titles: plain and descriptive, at most 2 lines at the default size. See `docs/writing.md`.
5. Use reveals (`data-step`) to pace complex slides, and state changes (`data-when`) for before/after moments. Two or three steps per slide at most.
6. Set `data-label` (22 characters or fewer) and `data-time` on every slide.
7. Write speaker notes as the spoken script, with a cue for each reveal.
8. Visuals: real data and screenshots first, then SVG diagrams in the theme style, and generated images last. Follow `docs/visuals.md`.

### 5. Write the script

Fill in `script.md` from the template:

- How to run the deck (keys, presenter window).
- A run sheet with targets and cumulative time.
- The script, matching the speaker notes word for word.
- Where each of the user's notes ended up.
- Facts on the slides, with sources, and ⚠ for inferences.
- Q&A prep: likely questions with short answer stubs, especially where the presenter must fill in details only they know.

### 6. Verify

1. Run `npm run verify -- <folder>` and fix every error.
2. Fix warnings unless there is a reason to keep them: long titles, text under 12px, long rail labels, notes that run longer than `data-time`.
3. Open every screenshot in `<folder>/.verify/` and look for overlaps, cramped areas, awkward line breaks, empty space and inconsistent styling. The checker can't judge design; you must.
4. For slides with reveals, run with `--steps` and check that each step reads well on its own.
5. Check the presenter screenshot: titles, notes and the run sheet should all be present.

### 7. Hand over and iterate

- Tell the user where the deck and script are, how to present (F for fullscreen, P for the presenter window, B to blank), and list the ⚠ facts to check.
- Keep your summary short. Offer to open the deck in a browser.
- When the user gives feedback, apply it across the whole deck and script, not only the slide they mentioned. If they dislike a style (for example slogan titles), fix every instance and remember it for the rest of the session.

## Quality bar

- Every slide has one point that the title states plainly.
- No invented facts. Numbers have sources. People are named only when appropriate.
- Text is readable from the back of a room: body text 21px or larger, nothing under 12px.
- The deck fits the slot, including the demo, with 10% buffer.
- It verifies with 0 errors, and you have looked at every screenshot.

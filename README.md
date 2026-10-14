# Deckhand

HTML presentations with a progress rail, a presenter window and a speaker script, designed to be written together with an AI assistant.

- **One file per deck.** Plain HTML. Open it in Chrome or Edge and present; it works offline.
- **Presenter window.** Speaker notes with reveal cues, a timer that tracks pace, the next slide and a clickable run sheet. Synced with the audience screen both ways.
- **Progress rails.** A `timeline`, or a `well` that drills down as the talk moves through time, or none.
- **Components for evidence.** Commit cards, diffstats, timelines, before/after trees, wireframes, options, stamps, cycle diagrams and log charts, all driven by theme tokens.
- **Made for AI authoring.** `AGENTS.md`, a portable skill and guides tell an assistant how to interview the presenter, gather facts, outline, build, write the script and verify.
- **Verification.** `npm run verify` screenshots every slide in headless Chrome or Edge and reports overflow, tiny text, missing fonts, console errors and notes that run over time.

Open `demo/index.html` for a short tour, and `demo/gallery.html` for every component.

## Quick start

Requires Node 22+ and Chrome, Edge or Chromium for verification. There are no dependencies to install.

```bash
git clone https://github.com/ebygd/deckhand.git
cd deckhand
npm run new -- ../my-talk --title "My talk" --rail timeline
npm run verify -- ../my-talk
```

Then open `../my-talk/index.html`, press **F** for fullscreen and **P** for the presenter window.

## Building a deck with an AI assistant

Open this repository in your AI tool (GitHub Copilot, Claude Code, Codex, Cursor and others) and ask for a presentation. For example:

> Make a 15-minute talk for developers about how we built our prototype. My notes are below, and the code is in ../my-project.

The assistant reads `AGENTS.md` and follows `skills/deckhand-presentation/SKILL.md`:

1. **Interview:** audience, length, goal, sources, must-haves.
2. **Gather facts:** from your notes, documents or git history, with sources.
3. **Outline:** sized to the slot, with each of your notes mapped to a slide.
4. **Build:** slides from components and patterns, with plain titles.
5. **Script:** run sheet, spoken script, facts to check, Q&A prep.
6. **Verify:** headless screenshots and checks, then a visual review.

To use the workflow outside this repository, copy `skills/deckhand-presentation` into your assistant's skills folder (for example `~/.agents/skills/` or `.github/skills/`).

## Presenting

| Key | Action |
| --- | --- |
| → Space PageDown | Next reveal or slide (clickers work) |
| ← PageUp | Back |
| P | Presenter window |
| F | Fullscreen |
| B | Blank the screen |
| N | Notes drawer (for rehearsal) |
| O | Overview |
| ? | All keys |

## Repository

```text
engine/      runtime, rails and components (no dependencies, no build step)
themes/      well-log: tokens, fonts and a style guide
templates/   the starter deck used by `npm run new`
tools/       new-deck.mjs and verify.mjs
demo/        tour and component gallery
docs/        authoring, components, slide patterns, writing, visuals, themes
skills/      the AI workflow as a portable skill
```

## Themes

Deckhand ships with **well-log**: warm paper, black ink and signal red, using Besley, Schibsted Grotesk and Martian Mono. More themes are planned. See `docs/themes.md` to create one; each theme includes a style guide that tells an AI how to draw diagrams and generate images in the same style.

## Licence

Code is released under the MIT licence (see `LICENSE`). The bundled fonts are released under the SIL Open Font License 1.1; their licence texts are in `themes/well-log/fonts/`.

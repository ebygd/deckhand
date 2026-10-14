# AGENTS.md

Instructions for AI assistants working in this repository. Humans: see `README.md`.

Deckhand builds HTML presentations. A deck is one `index.html` with `<section class="slide">` elements, styled by a theme and run by the engine in `engine/`. Your job is usually to help someone turn their notes, material and goals into a finished, verified deck with a speaker script.

## Read before you build

| Need | File |
| --- | --- |
| The full workflow, from interview to verified deck | `skills/deckhand-presentation/SKILL.md` |
| Attributes, reveals, notes, rails | `docs/authoring.md` |
| Every component, with HTML to copy | `docs/components.md` (rendered: `demo/gallery.html`) |
| Slide recipes and deck structures | `docs/slide-patterns.md` |
| Titles, notes and fact handling | `docs/writing.md` |
| SVG illustrations and generated images | `docs/visuals.md` and the theme's `theme.md` |
| Making a new theme | `docs/themes.md` |

## Rules

1. **Interview first.** Before writing slides, establish the audience, length, language, goal, the presenter's notes and sources, and anything that must or must not appear. Ask one question at a time. Don't guess talk length or audience.
2. **Facts come from sources.** Every number, date, name and quote must come from the user's material, a repo, a document or a tool result. Never invent statistics. Mark inferences with ⚠ in `script.md` and list them for the user to check.
3. **Plain, descriptive titles.** A title says what the slide covers ("Testing alternatives on users before committing"), not a slogan ("Code is cheap now."). Avoid clever taglines and rhetorical flourishes unless the user asks for them. One `<em>` phrase per title at most.
4. **Roles, not names.** Refer to people by role ("the designer", "a user") unless the user confirms the audience knows them, or asks for names. The same applies to commit messages you quote.
5. **One idea per slide.** If a slide needs more than two reveals or wraps past two lines of title, split it.
6. **Speaker notes are the script.** Write `<aside class="notes">` as spoken sentences in the presenter's voice. Mark each reveal with `<span class="cue" data-cue="N"></span>`. Keep notes close to `data-time` at about 130 words per minute.
7. **Use components before custom CSS.** Check `docs/components.md` first. If you need something new, put a small `<style>` block in the deck that uses theme tokens (`var(--accent)` etc.). Never hard-code colours or fonts.
8. **Don't edit the engine or theme from a deck.** Decks copy `engine/` and `theme/` when scaffolded. Change those only when working on Deckhand itself, and then keep `demo/` and `docs/` in sync.
9. **Verify, then look.** Run `npm run verify -- <deck>` and fix every error. Then open the screenshots in `<deck>/.verify/` and check them yourself; the checker can't judge design. Treat warnings as things to fix unless there's a reason not to.
10. **Deliver a script.** Every deck ships with `script.md`: run sheet, script, source-to-slide mapping, facts to verify, Q&A prep. The template is in `templates/starter/script.md`.
11. **Respect the user's repository rules.** Don't commit, push or create branches unless asked.

## Commands

```bash
npm run new -- <folder> --title "Title" --rail timeline   # scaffold a deck (rail: timeline | well | none)
npm run verify -- <folder>                                # screenshots + checks into <folder>/.verify
npm run verify -- <folder> --steps                        # also screenshot every reveal step
npm run demo                                              # verify the bundled demo and gallery
```

Node 22+ and a Chromium-based browser (Chrome, Edge or Chromium) are required for `verify`. The decks themselves need nothing but a browser.

## Repository map

```text
engine/      deckhand.js (runtime) · rails.js (progress rails) · components.js · deckhand.css · components.css
themes/      one folder per theme: theme.css (tokens + fonts) · theme.md (style guide) · fonts/
templates/   starter deck copied by `npm run new`
tools/       new-deck.mjs · verify.mjs (headless browser checks)
demo/        index.html (narrative demo) · gallery.html (every component)
docs/        authoring · components · slide-patterns · writing · visuals · themes
skills/      deckhand-presentation/SKILL.md (portable AI skill)
```

## Working on Deckhand itself

- Keep the engine dependency-free and build-free. Plain ES2020+, no frameworks, no bundler.
- Components read theme tokens only. After changing CSS, run `npm run demo` and inspect `demo/.verify*` screenshots.
- New components need an entry in `docs/components.md` and a slide in `demo/gallery.html`.
- New rails register on `window.Deckhand.rails` with `build(ctx)` and `update(rail, state, ctx)`; document them in `docs/authoring.md`.

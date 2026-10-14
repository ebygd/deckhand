# Copilot instructions

This repository is Deckhand, an engine for HTML presentations. Follow `AGENTS.md` in the repository root. It contains the rules, commands and documentation map.

When asked to create or edit a presentation, follow `skills/deckhand-presentation/SKILL.md` step by step. Most important:

- Interview the user before writing slides (audience, length, goal, sources). Ask one question at a time.
- Use only facts from the user's sources; mark inferences with ⚠ in `script.md`.
- Use plain, descriptive slide titles, not slogans. Refer to people by role unless told otherwise.
- Build with the components in `docs/components.md`, then run `npm run verify -- <deck>` and look at the screenshots before you finish.

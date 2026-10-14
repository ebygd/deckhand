# Writing slides and scripts

## Titles

- **Say what the slide covers, plainly.** "Testing alternatives on users before committing" works. "Five views. One flag." and "Code is cheap now." are slogans: they sound good but make the audience decode them.
- Use sentence case, and a full stop only on sentence-like titles.
- Keep a title to 1–2 lines. At the default size, a line holds about 26 characters.
- Use at most one `<em>` phrase, on the words that carry the point. It renders in the accent colour.
- Avoid rhetorical questions and puns unless the presenter's style calls for them.

## Body text

- Put one idea on each slide. Supporting text belongs in a `.lede` of 30 words or fewer.
- Keep list items to one line each where possible. Bold the lead word, not whole phrases.
- Put numbers where the audience can check them: name the source in the kicker, a caption or the notes.
- Use the audience's words. Avoid internal abbreviations unless the audience uses them daily.

## People

- Refer to people by role ("the designer", "two users") unless the audience knows them or the presenter asks for names.
- When quoting commit messages, tickets or chat logs that contain names, rephrase them on the slide.
- Credit contributors in the notes or on a closing slide if the presenter wants to.

## Speaker notes (the script)

- Write in the presenter's voice, as they would say it: first person, short sentences, contractions.
- Start each slide's notes with the point, then the evidence, then the transition.
- Put a cue (`<span class="cue" data-cue="N"></span>`) at the start of the sentence that goes with reveal N.
- Mark optional asides with `class="opt"` and stage directions with `class="direction"`.
- Aim for about 130 spoken words per minute. `verify` warns when notes outrun `data-time`.
- Keep `script.md` identical to the notes. The presenter may print it.

## Facts

- Keep a list of every fact on the slides, with its source, in `script.md`.
- Mark inferences, estimates and assumptions with ⚠, and tell the presenter about them when handing over.
- Prefer one exact, sourced number ("24 files changed") over a rounded or invented one ("a massive refactor").
- Check dates and weekdays. Mistakes there are easy to make and easy for the audience to spot.

## Tone

- Be confident but honest. Include a caveats slide when the audience would expect one.
- Say "we" for team work and "I" for the presenter's own work. Don't claim credit for others' work.
- Be specific: "Users struggled to find the export button, so we moved it" beats "We iterated based on feedback".

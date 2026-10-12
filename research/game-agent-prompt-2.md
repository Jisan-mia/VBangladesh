# Game-agent prompt, wave 2 (orchestration template)

Fill `{SLUG}`, `{NAME}` and `{N}` (the brief number in `research/games-wave-2.md`), then send one agent per game (model: opus, effort: high). Up to 5 run at once.

---

Read `/Users/jisanmia/Developer/VBangladesh/research/game-agent-prompt.md` and follow it exactly from "You are a senior game designer", with {SLUG}={SLUG} and {NAME}={NAME}. Apply these overrides, which win wherever they differ:

1. **Branch.** The branch is `games-wave-2`.
2. **Your brief.** It is `research/games-wave-2.md` #{N}, not §4.3. For the idea's original research row, see `research/games-2026-10.md` §1 (the ID is in the brief's heading) and follow §6 there (rules for every game).
3. **Engagement.** Read `research/game-engagement-brief.md` in full and build to it: levels with stars (or progression and milestones for arcade games), a win in the first 10 seconds, near-miss lines, combos, and confetti for real achievements only. There must be no dark patterns.
4. **Sound is ON by default.** This replaces must-have 5's sound rule.
   - Use `shared/game-sound.ts` (`sfx`, `tone`, `hiss`, `loop`, `buzz`, `confetti`), re-exported from `shared/game-kit.ts`, along with `useSound` and `useLevels`.
   - Use `shared/game-ui.tsx` (`SoundToggle`, `Stars`, `LevelGrid`). Its styles in `shared/game-ui.css` are already global.
   - Don't write your own AudioContext, mute state or level storage.
   - Give the game 3–6 meaningful sounds and one signature sound. Stop loops on pause, game over and unmount.
5. **Words.** All copy follows `research/bangla-writing-guide.md` (also the `bangla-writing` skill). Run its §11 self-check on every visible line, including level-clear lines, near-miss lines, the card and the FAQ.
6. **SEO.**
   - Title ≤45 chars, keyword-first, using the generic search term ("সুডোকু", "গোলকধাঁধা গেম", "মাছ ধরার গেম").
   - Description 120–160 chars and a unique H1.
   - At least 6 FAQs in search words, including "কয়টা লেভেল আছে?" where levels exist.
   - Name 1–2 related existing games in an FAQ answer, as plain text (the page links related tools automatically).
7. **Tests.** On top of the base list:
   - every level is solvable or fair (generator tests or a solver over the authored data);
   - star thresholds;
   - progress parsing goes through `readLevels` and `recordLevel`. Use those; don't re-implement them.
8. **Screenshots.** On top of the base list, add a level-clear screen with stars and the level grid. Check that a sound call doesn't throw when the AudioContext is unavailable (it shouldn't; the kit guards it).
9. **Shared changes.** If the kit needs a change, don't edit `shared/`. Describe it under `notes:`, and work around it locally only if the workaround is tiny.
10. **Report.** Use the same report format, plus one line: `levels:` how many, how stars are earned, what's saved on the phone.

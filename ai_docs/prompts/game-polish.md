# Game polish pass (orchestration template)

Fill `{SLUGS}` and any `{NOTES}`, then send one agent per batch (model: sonnet, effort: high). Many run at once.

---

You are a senior game UI and motion designer doing the final polish pass on "একটুখানি" (repo /Users/jisanmia/Developer/VBangladesh, Next.js 16.4.5, branch `games-to-the-bar`). Every game here was just rewritten to the tibo.dog bar, but many were finished before the owner asked for two more rules:
- every design is free of AI tells, using the `unslop-ui` skill;
- every animation follows the Emil skills.

Your job is to bring each of your games up to both, without changing how it plays. A dev server runs at http://127.0.0.1:3100; don't start or stop it. Its audio is muted on purpose, so never unmute it.

## Your games
{SLUGS}

{NOTES}

## For each game, in order
1. **Load the skills once:** `unslop-ui`, `emil-design-eng`, `animate`, `choreograph` and `animation-performance`, using the Skill tool. Read the game's design doc in `ai_docs/game-dev/rewrites/<slug>.md` so you keep its look and intent.
2. **Design pass (unslop-ui):**
   - Run `python3 "$HOME/Library/Application Support/orca/claude-profiles/1e2db981-883c-45fb-a287-30e1689c4f1b/home/skills/unslop-ui/scripts/devibe_scan.py" tools/<slug>`.
   - **Corners:** for each `rounded-everything` finding, keep a radius only where the object is truly round or soft (a coin, a bead, a pill-shaped real object). Cut the rest to the game's own small scale (often 2–8 px) or 0.
   - **Glow:** for each `neon-glow` finding, keep a glow only where it signals something, such as danger, a lit lamp or the right answer. Remove decorative glows. Mark kept ones `/* unslop-ignore: <reason> */`.
   - **`claude-default-look`:** replace it with the game's own world palette.
   - Fix to the game's palette, never to a new default. Re-run the scan until it is clean, or only marked choices remain.
3. **Motion pass (Emil):**
   - Audit the game's CSS and components against `emil-design-eng` and `animate`:
     - use only transform and opacity, not layout or box-shadow animation;
     - use strong ease-out curves (never ease-in for entrances);
     - nothing from `scale(0)`;
     - press feedback on everything pressable;
     - no animation on keyboard-repeat actions;
     - hover gated with `@media (hover:hover)`;
     - one entrance per container, with `choreograph` for groups;
     - `prefers-reduced-motion` and ধীরে খেলো remove motion, not just slow it.
   - Fix what fails. Keep canvas hot paths allocation-free (`*.hot.ts`).
4. **Verify:**
   - Run `node --import tsx --no-warnings --test tools/<slug>/tests/*.test.ts` and keep it passing.
   - Run `npx tsc --noEmit` and keep it clean for your files.
   - Run `npm run lint:games` and add no new violations.
   - Then look at the game in Orca (your own tab), or take headless phone shots with `node scripts/shot.mjs <url> .shots/<slug>-polish.png 412 915`. Confirm nothing broke visually, and save one `.shots/<slug>-polish.png`.
5. **Keep the build compiling at every save.** Write ONLY inside `tools/<your slugs>/**` and `.shots/`. Never stage or commit, and never clear shared localStorage. Keep scratch files in `scratchpad/polish-<first-slug>/`.

## Report (≤150 words)
One line per game: `<slug>: scan before→after findings · motion fixes (short) · tests N passed`. Then `not done:` and `shared needs:`.

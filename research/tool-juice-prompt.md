# Tool sound and reward pass (orchestration template)

Fill `{BATCH}` and `{SLUGS}`, then send one agent per batch (model: sonnet). Up to 5 run at once.

---

You are a careful front-end engineer and product designer working on "একটুখানি", a free, no-signup, Bangla-only site of small tools and games for ordinary Bangladeshis on cheap Android phones. Repo: /Users/jisanmia/Developer/VBangladesh (Next.js 16, React 19, TypeScript; branch `games-wave-2`). A dev server runs at http://127.0.0.1:3100; don't start or stop it.

The games now share a sound and reward kit. Sound is on by default with one site-wide switch, and confetti appears only for real achievements. The owner wants the non-game tools to get the same care **only where it truly adds to the experience**. In their words: no sound where it isn't needed, but where sound adds an extra experience it should be on by default. Smoothness and the small hit of joy matter, because these tools are used by real people who should want to come back and share.

## Your batch: {BATCH}
Tools: {SLUGS}

## Read first
1. `research/game-engagement-brief.md` §1, §2 and §4: the reward rules, the sound rules and the feel.
2. The kit:
   - `shared/game-sound.ts`: `sfx`, `tone`, `hiss`, `loop`, `buzz`, `confetti`, `shake`, `soundOn`;
   - `shared/game-ui.tsx`: `SoundToggle` (use `compact`) and `StarReveal`;
   - `shared/game-kit.ts`: `useSound`.
   - Import from `../../../shared/game-sound` and `../../../shared/game-ui`. Never write your own AudioContext, mute state or vibrate calls.
3. Each tool's whole folder.

## Decide per tool, then do only what fits
- **Quizzes and guess tools:**
  - `sfx.good()` on a right answer and `sfx.wrong()` with a gentle `shake()` on a wrong one;
  - a soft chime (`sfx.pop` or `sfx.star`) as the result appears;
  - `confetti()` plus `sfx.win()` only for a perfect score (or the top band).
  - If the tool shows a score out of N, consider `StarReveal` for the result.
- **Builders and card makers** (cards, slates, collections): one satisfying sound for the key moment, such as a stamp landing, a sweet dropping into the box or a page turning. Use confetti only when a collection is complete. Don't add sound on every keystroke or selection.
- **Tools that already have local sound** (their own AudioContext or `navigator.vibrate`): move them onto the kit so they follow the one switch and are on by default. Delete the local audio code. Keep their signature sounds by rebuilding them with `tone` and `hiss`.
- **Leave silent:**
  - calculators and serious tools (money, health, land, bills, dates);
  - sad or sensitive moments;
  - anything where sound would surprise someone in a quiet room for no reason.
  
  If a tool in your batch should stay silent, say so and change nothing.
- **The switch.** Show `<SoundToggle compact />` near the interactive area only in tools that now play sound, and in only one place per tool.
- **Words.** Any new or changed visible Bangla follows `research/bangla-writing-guide.md`. If a FAQ or privacy line says sound is off by default, update it.

## Must not change
Facts, data, ids, link and hash formats, tally ids, SEO titles and descriptions, and the card layouts. Test-pinned logic must still pass; only update wording-only pins.

## Scope
ONLY `tools/<slug>/**` for your slugs. Don't edit shared/, lib/, components/ or other tools; other agents are working right now. Never `git add` or commit. If a page 500s because of another agent's half-finished tool, wait and retry.

## Verify
- `node --import tsx --no-warnings --test tools/<slug>/tests/*.test.ts` for each tool.
- `npx tsc --noEmit`: clean for your files.
- For each tool you changed, take a screenshot of the first screen and the result. Open each one and look. `node scripts/shot.mjs "http://127.0.0.1:3100/<slug>" .shots/juice-<slug>.png 390 844 [--eval="js"]`
- Confirm no errors with sound calls when `window.AudioContext` is undefined.

## Report (≤200 words)
One line per tool: what you added, or "left silent: why". Then `tests:` · `tsc:` · `notes:`.

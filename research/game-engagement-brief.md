# Game engagement brief (games wave 2, October 2026)

The owner wants games to become a big part of একটুখানি. People should *feel* each action, get a quick win, see a next goal, and want "আরেকটা". This brief applies to every new game and to the upgrades of the 25 existing games. It sits on top of `research/game-agent-prompt.md` and overrides its sound rule.

## 1. The loop we want (healthy, not manipulative)

1. **A win in the first 10 seconds.** Level 1 is almost impossible to fail. The player learns by doing.
2. **A visible next goal.** Use levels with 1–3 stars, a best score to beat, or a collection to fill. The next goal is always on screen, e.g. "লেভেল ৭ · ★ ১৮/৯০".
3. **Rising challenge in small steps.** Each level adds one new thing: a bigger grid, a faster speed, a new obstacle, fewer moves. Never jump.
4. **Near-miss made visible.** "আর ২ চাল কম হলে ৩ তারা।" "আর ১টা আম!" This is what makes people press আরেকবার.
5. **Celebrate real achievements, not every tap.** Use confetti plus `sfx.win()` or `sfx.levelUp()` for a cleared level with 3 stars, a new best, or a finished world. A normal clear gets `sfx.good()` and the stars popping in one by one (`sfx.star(0..2)` with the `.gx-pop` class).
6. **Streaks and combos sound like they climb.** Use `sfx.combo(step)`, which rises in pitch with each step.
7. **Show progress across sessions.** Use the level grid with stars (`LevelGrid`), total stars, and best scores (`useBest`). Collections (fish album, pictures revealed) where they fit.
8. **A daily seed where it fits.** "আজকের ধাঁধা" seeded by date (UTC+6) gives a reason to come back and compare with friends.

**Never:**
- lives or energy that block play, fake countdowns or "only today" pressure;
- loot boxes, spins or random paid-feeling rewards, or anything that smells of gambling;
- shaming lines, nagging pop-ups or a sound that keeps playing once you've stopped;
- locking the first levels behind anything.

Every level a player has reached stays open forever.

## 2. Sound: ON by default, made in code

The shared kit is `shared/game-sound.ts`, re-exported from `shared/game-kit.ts`. The UI is in `shared/game-ui.tsx`, and its styles in `shared/game-ui.css` are already global.

- **Global switch.** `SoundToggle` is the one switch, shown near the game controls. It is ON by default and remembered for every game. Don't build your own mute state; the hook is `useSound()`. Sound and vibration both follow this switch.
- **The shared palette.** Use it first: `sfx.tap`, `pick`, `drop`, `pop`, `good`, `coin`, `wrong`, `tick`, `thud`, `splash`, `whoosh`, `note(n)`, `combo(step)`, `win`, `levelUp`, `lose` and `star(n)`.
- **Building blocks** for the game's own signature sound:
  - `tone(freq, length, volume, wave, delay, slideTo)`;
  - `hiss(length, volume, filterHz, filterType, delay)`;
  - `loop('static' | 'hum' | 'wind')` returns `{ set(0..1), stop() }`. Use it for a continuous sound that *carries information*, such as TV static that grows louder the further the antenna is off.
- **3–6 sounds per game, each with a meaning.** Action, success, mistake, win, and one signature sound (a ঢোল thump, a bicycle bell, a switch's টক্‌, a clay pot's tone).
- **Not too much.** No music beds, no sound on every frame, volumes low (the helpers already are).
- **Stop loops** on pause, game over, tab hidden and unmount.
- **The first sound plays from a tap.** Browsers block audio before one.
- **`buzz(ms)`** only at key moments: a hit, a mistake, a win. Never continuously.
- **Sound never carries information alone.** Everything sound tells you is also visible.

## 3. Levels

- **Persistence.** `useLevels(slug, count)` returns `{ stars, unlocked, record(level, stars) }`. It is stored on this phone. `starsFor(value, three, two, lowerIsBetter)` turns a result into stars.
- **The picker.** `LevelGrid` shows cleared levels with stars, the next one glowing, and the rest locked. Put it in a `<details>` or a "সব লেভেল" sheet below the game. It must not sit between the player and the play area on first load.
- **Content and testing.** Level content is either generated from a seed by a pure function that a test proves solvable, or hand-authored in `lib/levels.ts`, where a test solves every level. Never ship an unsolvable level.
- **How many.** 20–40 levels for puzzles, grouped into "worlds" of about 10 with a Bangladeshi theme each (পুরান ঢাকা → গ্রাম → নদী…). For arcade games, stages or difficulty steps are enough when levels don't fit. An endless game can have milestones instead (first 50 points = a badge on the card).
- **Links and labels.** The challenge link carries the level (and seed). The result card shows the level and stars.
- **Opening state.** Start at the furthest unlocked level the player hasn't 3-starred, with "লেভেল ১" for new players. Make no one replay a tutorial.

## 4. Feel (the "juice")

- **Every input answers within 50 ms:** a sound, a scale bump (0.95 → 1), a colour flash or a particle puff.
- **Animate state changes** with ease-out over 120–250 ms. No linear slides.
- **Mistakes shake gently** (6px, 200ms) with `sfx.wrong()`. They never punish.
- **Scores count up quickly** at the end, not all at once. Each star pops in turn.
- **Keep it at 60 fps on a cheap phone.** Use an offscreen background, no per-frame allocation, and no `shadowBlur` in loops. Slow mode (`useSlowMode`) removes shake, confetti and particles.

## 5. One clear action per state

- **Ready:** one big start (or start on the first touch).
- **Playing:** the play area only.
- **Level clear:** "পরের লেভেল" as the primary button, with "আবার খেলো" secondary (for 3 stars).
- **Over:** "আরেকবার" first, then the card and share.

No signup and no menus before play. The first screen shows the game.

## 6. Words

All copy follows `research/bangla-writing-guide.md` (the `bangla-writing` skill): short, concrete, warm, তুমি, everyday Bangladeshi চলিত, no exaggeration.

- **Level-clear lines:** use one concrete image ("গলি পার, জিলাপির দোকান সামনে।"). Avoid "অসাধারণ!!!".
- **Near-miss lines:** use exact numbers.
- **SEO:** follow the base prompt. A keyword-first title (≤45 chars), a 120–160 character description, a unique H1, at least 5 FAQs in search words, plus JSON-LD via the page frame. Add internal links to 1–2 related games in an FAQ answer where natural.

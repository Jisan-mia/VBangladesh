# tibo.dog playthrough notes (2026-11-04, Orca browser)

The reference game is tibo.dog by @poteto (2.5D pixel survivors-like, plays inside an X post and at full screen). I played a Story run on Easy for about 6 minutes, reaching level 17 and two bosses. Screenshots are in `ai_docs/reference/tibo-dog/`.

## What I saw, screen by screen
1. **Title (`t1.jpg`):** one giant pixel-art RESET button, then "Story", then Easy/Normal/Hard/Nightmare, with one line describing the chosen difficulty. Mute sits top-left, credits and "What's new" top-right. Nothing else.
2. **Intro:** comic panels, with "SPACE: Hold to skip" in the corner (a hold, so stray taps can't skip). The settings have a Skip intro option.
3. **Level-up (`t5.jpg`):**
   - Play pauses (the timer froze at 0:10).
   - Three cards, keyed 1/2/3, each with a NEW or LV badge and one marked RECOMMENDED.
   - Each card gives an exact before → after.
   - Reroll, Skip and Banish have key hints and counts.
   - Hovering a card highlights it.
4. **HUD (`run4.jpg`):**
   - level and difficulty top-left, the timer top-centre;
   - coins and score top-right, pause [P] beneath;
   - weapon slots with levels bottom-left;
   - the XP line along the very top.
   - **Signals:** edge pointers for off-screen dogs and loot, a light beam on a new chest, dashed rings on interactables, floating damage numbers with ×2.
5. **Bosses (`run13.jpg`, `run16.jpg`):** named boss bars at the top centre ("The Masher", "Late Blight"). The biomes change underfoot (grass, sand, ice patches). At low health the screen edge glows orange and Tibo shows as a silhouette behind objects.
6. **Pause (`pause2.jpg`):** the HUD hides and the scene dims. Resume is pre-selected; Build, Encyclopedia, Settings and Reset follow, with the version shown.
7. **Settings:**
   - Sound: music and sound volume.
   - Comfort: effect intensity, screen shake Off/Low/Full, flashing, damage numbers, hitbox, recommended picks, skip intro, colour-blind modes with live swatches.
   - Graphics: Auto/Low/Medium/High.

## How it was built (author's trivia, 2 Nov 2026)
- About 1,150 PRs in 4 days, and a lint rule for every issue found.
- TLA+ on every state machine (story, cutscenes, systems), drawn as charts. See `chart-story-mode.png` and `chart-autopick-bugs.jpg`.
- `.hot.ts` files for per-frame code, with a lint rule banning allocation in them.
- A deterministic simulation, so the server replays runs to verify scores.
- Dynamic, localized og:images for every run.
- All audio synthesized (a Game Boy-style chip plus synthwave); the music carries its melody across biomes.
- All pixel art is code, packed into an atlas at build time.
- A first-download budget enforced by the build (about 124 KB gzipped).
- Headless bots tune each difficulty to target survival rates.

## What we take
The `.claude/skills/` files encode it: `game-quality-bar` (UX and feel), `game-statechart` (models), `game-engineering` (code), `play-test-orca` (verification).

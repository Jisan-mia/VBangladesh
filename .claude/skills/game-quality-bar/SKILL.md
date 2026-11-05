---
name: game-quality-bar
description: The quality bar for every একটুখানি game, learned by playing tibo.dog (poteto's browser survivors-like, Nov 2026) end to end. Use it before building, upgrading, reviewing or play-testing any game or kids' game in this repo. Covers the first screen, difficulty, onboarding, cutscenes and story, choices and upgrades, HUD, pause, settings and comfort, danger, bosses, ending, sound, and the text around the game.
---

# Game quality bar

tibo.dog plays inside an X post on a phone and at full screen on a desktop. In one run it never asks you to read more than one line at a time, never rushes a decision, and never covers the middle of the screen. Every game here should meet the same bar in its own small way.

Each section says what tibo.dog does and what that means for our games. Our games are short (1–5 minutes), in Bangla, on cheap Android phones, mostly opened from Facebook. Use the shared kits: `shared/game-sound.ts`, `shared/game-kit.ts`, `shared/game-ui.tsx`, and `shared/kids-kit.tsx` for ছোটদের জন্য.

## 1. The first screen: one huge action
- **tibo.dog:** a giant pixel-art RESET button fills the screen. Under it sit the mode, then a row of four difficulties, then one line saying what the chosen difficulty changes ("Fewer, weaker pests and a tougher Tibo."). The mute toggle is in a corner, the credits are tiny.
- **Ours:** the start action is the biggest thing on screen and is the game's own art (the হাঁড়ি, the ঘুড়ি), not a plain button. Optional choices (mode, difficulty, level) are small chips under it. The selected one explains its consequence in one line. Never more than one paragraph before play.

## 2. Difficulty is a promise, said plainly
- Show each option's effect in the player's terms ("কম মশা, ধীরে আসে"), never as a number.
- Remember the last choice on the phone.
- Easy must really be easy. tibo.dog's Easy survived a full run on random input.

## 3. Story and cutscenes
- **tibo.dog:** short comic panels (framed like printed pages) set up the stakes before play. "SPACE: Hold to skip" sits in a corner. Skipping needs a hold, so a stray tap never skips the story. A setting ("Skip intro") turns it off, and story runs still play it.
- **Ours:** an optional 2–4 panel intro for games with a world (ঝালমুড়ি সাপ, নদী পার, মঙ্গলে রোভার). Use a hold-to-skip control and play it only on the first run. Remember it was seen. Never block replay with it.

## 4. Choices and upgrades: never rush, always explain
- **tibo.dog's level-up offer:**
  - The game pauses while the offer is open; the timer froze at 0:10.
  - Three cards, numbered 1–3 for the keyboard.
  - A **NEW** or **LV 2** badge on each.
  - One card marked **RECOMMENDED** for beginners (a setting can turn this off).
  - Each card shows exact before → after ("Knockback 0% → +25%").
  - Reroll, Skip and Banish, each with a key hint and a count.
- **Ours:** any choice moment (level select, power-up, next stage) pauses play, numbers its options, explains each in one line with the real effect, and marks a sensible default.

## 5. HUD: corners only, the middle stays clear
- **What tibo.dog shows, and where:**
  - level and difficulty badge top-left, the timer in a small box top-centre;
  - coins and score top-right, a tiny pause [P] under them;
  - weapon slots with their levels bottom-left, mute top-left;
  - XP as a thin line along the very top edge.
- **What it uses so the eye knows where to go:**
  - **Edge pointers** show off-screen things: a paw for dogs, a chest icon for loot.
  - A **light beam** marks a new chest.
  - **Dashed rings** mark things you can interact with.
  - **Damage numbers** float, and doubles show "×2".
- **Bosses** get a name and one red health bar at the top centre ("The Masher 598/650").
- **Ours:** keep the score, timer and lives in small corner badges in Bangla digits. Show progress as a thin bar. Point to off-screen targets at the screen edge. Never put a label or banner over the play area during play.

## 6. Danger shows at the edges
- When health is low, the whole screen border glows orange, and the hero's outline shows through objects that hide him.
- **Ours:** "about to lose" is an edge glow or vignette, not a popup. It's off in slow mode except for a static border.

## 7. Pause is a real menu
- **tibo.dog:** P or the corner button opens PAUSED. The HUD hides and the scene dims. Resume is pre-selected and gold. Below it: Build (your current loadout), Encyclopedia (everything you have met), Settings, Reset. A version string sits at the bottom.
- **Ours:** the shared game player's pause menu offers চালিয়ে যাও (pre-selected), নতুন করে শুরু, কীভাবে খেলবে, শব্দ, ধীরে খেলো, and সব লেভেল. The game pauses itself when the tab hides or the window loses focus, and the TLA+ model must prove it (see `game-statechart`).

## 8. Settings that respect bodies and eyes
- **tibo.dog's options:**
  - Sound: separate music and sound volumes.
  - Comfort: weapon-effect intensity, screen shake (Off/Low/Full), flashing effects, damage numbers, a hitbox view, recommended picks, skip intro, and colour-blind modes (Protanopia/Deuteranopia/Tritanopia) with live swatches for Danger, XP, Health, Rare and Legendary.
  - Graphics quality: Auto, Low, Medium, High.
- **Ours:** the shared player keeps the site-wide sound switch and ধীরে খেলো (no shake, no flashes, slower). Every game reads the shared settings; none invents its own toggles. Colours that carry meaning (good, danger, rare) must also differ in shape or icon.

## 9. Pacing: one new idea at a time
- Every minute of tibo.dog brings exactly one new thing: a new enemy, a new biome (grass → sand → ice patches), a pickup (magnet, chest), then a named boss. Level-ups arrive fast early (level 3 by 0:10) and slow down later.
- **Ours:** win in the first 10 seconds. Add one new element per level or stage, never two. Put a named "boss" moment at the end of a world.

## 10. The end and the share
- **tibo.dog:** the run ends with a results screen built from your stats. The game makes a dynamic og:image per run (localized), and the server replays the run from its inputs to verify a posted score.
- **Ours:** cards come from `shared/card-canvas.ts`, links are seeded and replayable, and the preview title is personal. Deterministic games re-check link moves on open. Real-time games label a friend's score as their own phone's claim.

## 11. Sound and music
- tibo.dog synthesizes all sound live (a Game Boy-style chip plus a synth layer). Its music changes per biome and continues the melody across the change.
- **Ours:** only `shared/game-sound.ts`, with no audio files. Each game has 3–6 meaningful sounds plus one signature. A short looping tune is welcome where it fits (a game with stages). It changes with the stage and never restarts jarringly.

## 12. Words around the game
- tibo.dog's page carries a plain description for search engines ("a free 2.5D pixel survivors-like … in 27 languages") while the game fills the screen.
- **Ours:** the game fills the player. The SEO title, H1, description, steps and FAQ live below the player or inside it, never above the play area. All Bangla follows `research/bangla-writing-guide.md`.

## Checklist before calling a game done
1. The start action is the biggest thing on screen, and the first win comes within 10 seconds.
2. Every choice pauses play, is numbered, explains its real effect, and marks a sensible default.
3. The HUD sits in the corners, the middle stays clear, and off-screen targets have edge pointers.
4. Danger shows at the edge; mistakes shake gently; slow mode removes motion.
5. Pause works on P, Esc, the button, tab hide and blur, and resuming never loses input or time.
6. The end screen shows real stats, the card is personal, and the link replays.
7. 3–6 synthesized sounds; it works on mute; every meaning that sound carries is also visible.
8. The statechart for the game exists and its invariants hold (`game-statechart`).
9. You played it end to end in the Orca browser (`play-test-orca`) and it felt good.

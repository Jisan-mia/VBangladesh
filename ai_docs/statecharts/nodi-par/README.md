# নদী পার statechart (before the rewrite)

Spec: `NodiPar.tla` / `NodiPar.cfg` / `view.ts`. They mirror `tools/nodi-par/components/river-game.tsx`, `shared/game-kit.ts` (`useGameLoop`) and `shared/game-sound.ts` (`loop()`). Output: `before-fix/report.md` and `before-fix/chart.mmd`. TLC reached 360 states, and the chart draws 36 states and 137 arrows.

The page is **not** in the shared game player. Commit 6775639 landed during this run: `useGameLoop` now freezes on blur, and the model mirrors that. Rivers 1 and 2 in the model stand for "your river" and "a friend's river".

## Systems modelled
- **Play phase:** the ready card → crossing → paused (খেলা থেমে আছে) → across, card shows. Splashes and respawns are inside `stepRun` and not modelled.
- **Which river:** the `level` the page shows and saves under, against `runLevel`, the river `run.current` was built from. A friend's link (`hashchange` → `readFriend`) can change one without the other.
- **Pause and focus:** the tab is visible or hidden, and the window is focused or blurred. Pause comes from থামাও, P, Esc, a tab hide or the stage scrolling out of view (folded into YouPause).
- **Time:** `useGameLoop` with the blur/hide freeze, and the `finish()` cheer timeout (`260·(stars+1)` ms, never cleared).
- **Sound:** the water (`wind`) loop and `soundChanged`.
- **Choices:** the সব নদী drawer, `pickRiver` (the list or পরের নদী), আবার খেলো (`restart()` after the 450 ms guard).
- **Keys:** Space held through the last hop (its auto-repeat reaches the page until a blur or hide).
- **Saved progress:** whether the last `finish()` saved under the river actually crossed (`misSaved`). `useLevels.record` keeps the higher, unit-tested in shared.

## Rules in plain words
| Rule | Says | Result |
|---|---|---|
| PausedWhenHidden | Hide the tab mid-crossing and it's paused when you come back. | holds |
| PausedWhenBlurred | Click into another window mid-crossing and it's paused when you come back. | **breaks** |
| NoProgressWhileAway (property) | The river only moves while you're on the page. | holds (since 6775639) |
| WaterOnlyWhileCrossing | The water sound plays only while you cross on screen, focused, with sound on. | **breaks** |
| WaterComesBack | Crossing, visible, sound on → the water plays. | holds |
| LevelPickerFreezesPlay | With the river list open, the river doesn't run on. | **breaks** |
| CheerOnlyOnTheCard | The win sound and confetti only fire on the card. | **breaks** |
| ShownRiverIsTheOneCrossed | The page names the river you're actually crossing. | **breaks** |
| SavedUnderTheRiverCrossed | Stars and best time are saved under the river you crossed. | **breaks** |
| CardNeedsAFreshPress (property) | The card stays until a fresh press, never because of a key held from before. | **breaks** |

## Bugs
### 1. SavedUnderTheRiverCrossed + ShownRiverIsTheOneCrossed (a friend's link mid-crossing): game-specific
- **The player's version:** "Rafi sent me his river-5 link while I was crossing river 1. The page jumped to river 5, I finished my easy river, and it gave me 3 stars on river 5 and said I beat Rafi by 18.8 seconds."
- **Path:** start → a friend's link opens in this tab → reach the far ghat (3 steps).
- **Why:** `readFriend` runs `setLevel(shared.level)` but keeps `phase` at "playing", so `run.current` keeps crossing the old river. `finish()` records under `level` (`levels.record(level, …)`, `useBest(`${TOOL}-${level}`)`) and builds the card from `level`. `useLevels`' unlock rule then opens every river below 5.
- **Live replay (Orca):** saved before: `levels {"1":3}`, best-1 12, best-5 none. Started river 1, then set `location.hash = s=40595&t=200&l=5&a=0&p=0&n=Rafi`. The label became "নদী ৫ · ওপারে খালার বাড়ি" while the run stayed on river 1 (4 lanes). Crossed in ১.২ সে. The card said **"নদী ৫ পার, ওপারে খালার বাড়ি"** and "Rafi-এর চেয়ে ১৮.৮ সেকেন্ড আগে পৌঁছালে!". Saved after: **`levels {"1":3,"5":3}`, best-5 12** (★ ০ → ৬/৯০, rivers 2–6 open).
- **Fix:** in `readFriend`, if a run is in progress, end it (stopWater, `run.current = null`, ready card), the same as `pickRiver`. Better still, have `finish()` take the level from `played.river.level`, not `level`. Also add a node test: a friend's level arrives mid-run, and the run's result keys to its own river.

### 2. CardNeedsAFreshPress (held Space skips the card): shared pattern
- **The player's version:** "I held Space on the last hop. The card flashed for half a second and a new crossing started."
- **Path:** start → hold Space for the last hop → reach the ghat → Space repeats on the card (4 steps).
- **Why:** the crossing branch ignores `event.repeat`, but the card branch (`phase === "over"` → `restart()`) doesn't check it. Only the 450 ms guard stands in the way, until the 600 ms focus moves to পরের নদী.
- **Live replay (Orca):** Space auto-repeat every 33 ms from row 1. Across in ১.২ সে, and the card showed "নদী ১ পার…". **The card was gone after 454 ms**: phase playing, row 1, a new crossing at t 0.03 s.
- **Fix:** accept card keys only from a keydown that arrives after the card appears, with `!e.repeat` (the rewrite prompt's "Result keys need a fresh press").

### 3. CheerOnlyOnTheCard (confetti on the next crossing): shared pattern
- **The player's version:** "I pressed আবার খেলো straight away and the fanfare and confetti went off in the middle of my next crossing."
- **Path:** start → reach the ghat → আবার খেলো (3 steps).
- **Why:** `finish()` calls `window.setTimeout(… sfx.win(); confetti() …, 260·(stars+1))` and keeps no id. `start()` and `pickRiver` don't clear it. The 1.8 s `setSettling(false)` timer isn't cleared either.
- **Live replay (Orca):** a 3-star, new-record crossing in ১.২ সে. Space at +512 ms → playing. **win + confetti at +997 / +999 ms, phase playing, row 1** (`AudioParam` 1047 Hz and the fixed confetti canvas, both instrumented).
- **Fix:** keep the timeout ids, and clear them in `start`, `pickRiver`, `readFriend` and on unmount.

### 4. PausedWhenBlurred + WaterOnlyWhileCrossing: shared
- **The player's version:** "I clicked my other window. The river froze but the water kept rushing. When I clicked back on the game, the boy jumped forward at once."
- **Path:** start → click into another window (2 steps).
- **Why:** there's no blur listener, so `useGameLoop` freezes the river but `phase` stays "playing" and the water loop keeps going. On focus play resumes, and the click that brings you back is a pointerdown + pointerup on the stage, which runs `input(UP)` and hops.
- **Live replay (Orca; frame rate doesn't matter here, the loop is frozen anyway):** crossing at t 5.52 s, row 0, water loops 1 → blur 2.5 s: **t 5.52 s, water loops 1** → click back on the river: **row 0 → 1**, a hop.
- **Fix:** shared. Move to `GamePage` / `useGamePlayer`. The menu opens on blur, `pause()` stops the water, and the click lands on চালিয়ে যাও.

### 5. LevelPickerFreezesPlay: shared
- **The player's version:** "I opened সব নদী to see my stars and the clock kept running against my time star."
- **Path:** start → open the list (2 steps).
- **Live replay (Orca):** list opened at t 0.35 s → +1.5 s t 1.83 → +4 s **t 4.33 s**, water on. Picking a river from the list does reset the run cleanly (`pickRiver`).
- **Fix:** shared. The river list belongs in the player's pause menu, or opening it pauses.

### How the replays were run
All five ran in **Orca** (pages `b2a5ccad…` and a second tab for bug 2). The run was read through the React fiber (`run.current`). The phase came from `.np-stage[data-phase]`. Water loops were counted through `AudioBufferSourceNode.prototype.start/stop` (`loop = true`), the cheer through `AudioParam.setValueAtTime(1047)` and a `MutationObserver` for the confetti canvas. A small in-page pilot hopped forward only when the landing held through the hop. Note that Orca cuts rAF to about 2 fps after any window `blur` event. That doesn't affect bug 4, because the loop is frozen on blur by design now.

## Quality-bar gaps (river 1 several times in Orca, Pixel 9)
1. **The start action is a plain শুরু করো button on a dark card** over the river. It should be the game's own art, for example the kid's first hop off the ghat. A tap anywhere does start it.
2. **Text above the play area:** the kicker, a two-line H1 and the river line put the stage at y≈235. A friend's banner pushes it further (and stays up on other rivers).
3. **No real pause menu and no pause on blur.** The inline pause card has চালিয়ে যাও and নদীর শুরু থেকে only. It's not in the shared player, so it has no কীভাবে খেলবে, শব্দ or ধীরে খেলো there.
4. **Labels over the play area during play:** "ছপাৎ!", "+১ আম", "কিনারায়!", "ভোঁ!", "স্রোত টেনে নিল!" pop mid-river, and the "ঢং! ঘাটের ঘণ্টা বাজল।" ribbon sits centre-screen at the end.
5. **No danger at the edges.** Drifting towards the screen edge on a raft has no edge cue until you're swept. The কচুরিপানা dip warning is the only early signal.
6. **No story beat:** a world game (a school kid crossing to নানুবাড়ি, খালার বাড়ি…) with only place names. There's no 2–4 panel intro and no named finale river at 10, 20 or 30.
7. **River 1 gives 3 stars in 1.2 s** (two lanes, one mango). The first win is quick, as it should be, but the top rating is nearly free.
8. **Sound is good** (hop variants by surface, splash, the ghat bell, the ferry horn, the water loop that follows the current). There's no world tune.
9. **The end screen is good:** real time, mangoes and splashes, the near line ("আরেকটা তারা: ৭.৬ সেকেন্ড আগে পৌঁছাও…"), পরের নদী as primary, and a personal card with the friend's time as their claim. But see bugs 1 and 2.

Screenshots: `.shots/nodi-par-first-screen.png` (the ready card over river 1), `.shots/nodi-par-over.png` (the far ghat, the bell ribbon, the friend banner still up).

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/nodi-par/NodiPar.tla --view ai_docs/statecharts/nodi-par/view.ts --out ai_docs/statecharts/nodi-par/<new-folder>
rm ai_docs/statecharts/nodi-par/<new-folder>/tlc*.out
```

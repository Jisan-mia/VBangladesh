# ছিপ ফেলো: statechart, before the rewrite

Spec `ChhipFelo.tla` / `ChhipFelo.cfg`, view `view.ts`, output `before-fix/` (`report.md`, `chart.mmd`).
It mirrors `tools/chhip-felo/components/fishing-game.tsx` (every handler and effect), `tools/chhip-felo/lib/game.ts` (the trip machine) and the shared `useGameLoop` / `useLevels` in `shared/game-kit.ts` + `shared/game-core.ts`.
TLC: 136 states, 544 steps. The chart has 16 states and 29 arrows. **6 rules hold, 5 break.**

**The code moved under me.** At 09:36 on 4 Nov another agent changed `useGameLoop` in the working tree (uncommitted) so the loop also stops on window `blur` and restarts on `focus`. The spec models that working tree (`Running` includes `focused`). At HEAD `a03ce2a` the loop ignored blur, so **NoProgressWhileAway also breaks there**: you click away while watching the float, the bite comes and goes, and the fish is lost ("late"). To model HEAD, drop `/\ focused` from `Running`. The rewrite should keep the kit change, and the bugs below still stand with it.

## Systems modelled
- **Play phase:** one cast per trip, `aim → fly → wait → reel → done`. The 2.1 s catch card and 1.5 s miss line are folded into the step that ends the cast. Real trips have 3–6 casts; the per-cast machine is the same.
- **Pause and focus:** tab visible or hidden, window focused or blurred, and the `থেমে আছে` overlay. `hide()` pauses only `fly`, `wait` and `reel`, and only on `visibilitychange`. The component has no blur listener. The kit's blur listener only freezes the steps.
- **Input:** one "held" bit for `trip.charging` (aim) or `trip.holding` (reel), from a finger on the pond or button, or Space/Enter on `window`. Hiding clears it; blur doesn't.
- **Sound:** the reel hum (`sound.reelHum()`, a `loop("hum")`), the site-wide switch and its `onChange`, and `resume()` restarting the hum.
- **Timers:** `finish()`'s `setTimeout` (250 ms for no stars: `sfx.lose`; 950 ms for a cleared level: `levelUp` + confetti or `sfx.good`) and the 600 ms `overAt` guard on `primary()` / `again()`. Nothing clears the timeout.
- **Choices and links:** পরের লেভেল / আবার খেলো, the সব লেভেল grid (no guard, any time), and `readFriend()` on mount and `hashchange`, which begins any valid level.
- **Levels:** `friendTrip` (a friend's level you haven't opened) and `skipped` (a level opened that you never cleared). `unlockedLevel` = 1 + the highest level with stars, capped only by the album's place.

Not modelled: the power meter, nibbles, tension maths and fish rolls (pure, covered by `tests/chhip-felo.test.ts`, including "every level is fair" and the seed replay), star recording (`recordLevel` keeps the max), and the album (keeps the heaviest of each fish).

## Rules, in plain words
| Rule | In plain words | Result |
|---|---|---|
| NoProgressWhileAway | The float, the bite and the line don't move while you're in another window or tab. | holds (working tree); **breaks at HEAD** |
| InputReleasedWhenAway | After you leave, no finger or Space key still counts as held. | **breaks** |
| PausedWhenHidden | Hiding the tab mid-cast pauses with the overlay. | holds |
| PausedWhenBlurred | Clicking into another window mid-cast pauses with the overlay, so coming back never counts as a strike. | **breaks** |
| LoopOnlyWhenMeaningful | The reel hums only while a fish is on the line, the line is moving and sound is on. | **breaks** |
| LoopComesBack | With a fish on the line and sound on, the hum plays, also after sound comes back on or after চালিয়ে যাও. | holds |
| PausedMeansFrozen | Nothing moves while the overlay is up. | holds |
| FanfareOnlyOnTheResult (NoDoubleResult) | The result's fanfare and confetti never go off over a new trip. | **breaks** |
| OpenLevelsAreEarned (UnlockNeverShrinks) | Only levels you clear open the next one. A friend's link lets you play their level, not skip the ones before it. | **breaks** |
| TypeOK, NoDeadlock | | hold |

## Bugs

### 1. InputReleasedWhenAway: "I held Space to reel, answered a message, came back and the line snapped"
- **Path (report):** 0 aiming → 1 you press and hold → 2 you click into another window (Space still held). The reel path is the same: strike, hold, click away.
- **Live replay (Orca, level 1, working tree):** I struck on the dip, held Space (keydown), and dispatched `blur` at tension **0.40**. Two seconds away, the loop was frozen at 0.40, but `trip.holding` stayed `true`, because the keyup went to the other app. I dispatched `focus` with no keyup. Tension then ran **0.52 → 0.67 → 0.82 → 0.94 → 1.00** at 0.2 s steps and strain 0.05 → 0.45. At **+1.4 s** the result was `["snap"]`, with "বেশি টান, সুতো ছিঁড়ে গেল!". No overlay appeared at any point. In aim, a held charge stays on in the same way, and the meter swings on after you return.
- **Fix:** on `blur`, do what `hide()` does: `charging = holding = false; down.current = null`. Release pointer capture too. **Shared:** every hold-to-act game needs "blur releases input". Put it in the shared away hook (with bug 2), not in each game.

### 2. PausedWhenBlurred: "I came back to the window by tapping the pond and it counted as a strike"
- **Path:** 0 → 1 hold → 2 let go, the float flies → 3 you click into another window: a live cast, frozen, with no overlay.
- **Live replay (level 7, fakes on):** I cast, waited 0.2 s (`t 0.22`, `biteAt 2.39`) and dispatched `blur`. After 3 s the clock still read `t 0.22`: frozen, no overlay, status "ছোট ঠোকরে না…". Then I came back the way a player does: `focus` plus a pointerdown/up on the pond. The cast ended at once with `["early"]`, "ফাতনা ডোবার আগেই টান দিলে। মাছ টের পেয়ে সরে গেল।". On level 1 the same click shows the hush line instead. At HEAD (no kit blur) the clock keeps running instead, so the bite passes and the fish is lost "late".
- **Fix:** on `blur` in `fly`/`wait`/`reel`, `stopHum()` and `setPaused(true)`, the same as hide. The first tap back then only resumes (`onDown` already does `if (paused) { resume(); return; }`). **Shared:** a `useAwayPause(onAway)` in `shared/game-kit.ts` that listens to both `visibilitychange` and `blur`. The sudoku README asks for the same hook.

### 3. LoopOnlyWhenMeaningful: "I switched to WhatsApp mid-reel and the whirr kept going"
- **Path:** 0 → 1 hold → 2 cast → 3 the float lands → 4 you strike (hum on) → 5 you click into another window: line frozen, hum still on.
- **Live replay:** I counted sawtooth starts and stops (the hum is the game's only sawtooth). After the strike: `{starts 1, stops 0, live 1}`. Two seconds after `blur`: still `{starts 1, stops 0, live 1}` with the line frozen at 0.40. The hum held its last pitch and level, because `follow()` runs only in the step. (Orca's background AudioContext may be suspended, so this counts nodes, not what you hear.)
- **Fix:** comes free with bug 2's fix, since pausing calls `stopHum()` and `resume()` already restarts it. **Shared** in the same way: the away hook must stop loops. A loop with no step to steer it should never outlive the step.

### 4. FanfareOnlyOnTheResult: "I tapped পরের লেভেল and the level-up fanfare and confetti went off over the new pond"
- **Path (report):** 0 → 1 hold → 2 cast → 3 the float lands → 4 the cast ends: the result shows, its sound still pending → 5 you pick a level in সব লেভেল: a new trip, and the old result's sound goes off over it. The model also finds the পরের লেভেল path: a cleared result, 600 ms pass, পরের লেভেল before 950 ms.
- **Live replay (level 6, 3 stars):** the result appeared at t0. The star chimes sounded at +252 and +514 ms (1047 and 1319 Hz). I clicked পরের লেভেল at **+704 ms**, which the 600 ms guard allows. Level 7 opened in `aim`, with the result gone. At **+910 ms**, `sfx.levelUp` (784, 988, 1175, 1568 and 2093 Hz) and a confetti canvas both fired, with level 7 in `aim`. The সব লেভেল grid has no guard, so a pick 0–250 ms after a miss plays `sfx.lose` over the new trip in the same way. `caught()` has the same leak: `sfx.combo` at 600 ms, and `sfx.coin`, or `levelUp` + confetti for a newly opened place, at 700 ms. A pick or a hashchange during the catch card plays them over the next trip.
- **Fix:** keep the timeout ids in a ref and clear them in `begin()` and on unmount. Better, move the result fanfare into a component that mounts with the result (as `StarReveal` does, which already cleared its third chime correctly here) and clears its own timers. **Shared pattern:** uncleared celebration timeouts (sudoku bug 2).

### 5. OpenLevelsAreEarned: "My friend's link took me straight to বিল. I'd never played levels 1–4, but they were all open"
- **Path:** 0 → 1 you open a friend's link (a level not yet open) → 2–5 cast, strike → 6 you land the fish: the result, and levels below it open that you never cleared.
- **Live replay (clean storage):** I opened `/chhip-felo#s=12345&t=0&l=5&c=0&n=Rafi`, a pond level-5 link on a phone that had never played. The autopilot caught 5 of 5. Storage then held `{"5":3}`, with 4 kinds of fish in the album. The result said "বাড়ির পুকুরের সব লেভেল শেষ। এবার বিলের দিকে।" and "বিল খুলে গেছে!". After a reload without the hash, the game **opened on লেভেল ৬ · বিল** (startLevel picks the furthest open level), and সব লেভেল showed **লেভেল ১, ২, ৩, ৪, ৫ (৩ তারা), ৬** all open. With a river link (l=11–15), one trip opens up to the album's cap.
- **Fix:** make `unlockedLevel` count the unbroken run of cleared levels from 1, and let a friend's level be playable for that visit only. Don't record its stars as progress, or record them without letting them unlock. The LevelGrid's `Math.max(unlocked, friend.level)` is fine for the visit. **Shared** with sudoku (bug 5), switchboard, and any game whose link carries a level.

### Minor (not in the model)
- **The ধীরে খেলো toggle mid-wait can lose a fish that never bit.** `trip.slow` changes the stretch while `trip.t` keeps its real seconds. **Replay:** with slow on, I cast on level 7 (`biteAt 2.18`, `window 0.87`) and waited until `t 3.35`, which is 2.09 on the slow clock, so the float hadn't dipped yet. Then I tapped ধীরে খেলো off. The cast ended at once with `"late"` and "ফাতনা ডুবেছিল, টান দিতে দেরি হলো", although no dip ever showed or sounded. **Fix:** rescale `trip.t` (and the reel clocks) by the stretch ratio when slow changes, or apply the setting only from the next cast. **Game-specific.**
- **Picking a level mid-trip throws the trip away** with no question asked. The সব লেভেল drawer sits under the button and works in any phase. This is less harmful than sudoku's case (a trip is 1–2 minutes), but the catch-card timers leak into the new trip (bug 4).
- A friend link's `hashchange` mid-trip also restarts at once.

### Hide (not replayable as an event)
Orca pins `document.hidden = false`, so I ran `hide()`'s effects directly mid-reel: `charging = holding = false`, the hum ref's `stop()` and null, and the `paused` state set through React's own dispatch. The overlay showed "থেমে আছে। মাছও অপেক্ষা করছে।", and the clock was frozen (`t 0.25 → 0.25` over 1 s). The hum went `{starts 1, stops 1}`. চালিয়ে যাও brought the hum back (`starts 2, live 1`). The sound switch mid-reel did off `stops 3`, then on `starts 4, live 1`. So PausedWhenHidden and LoopComesBack hold live, too.

### Test harness notes
- Orca keeps a background tab's `requestAnimationFrame` from firing, so the loop never stepped. I replaced rAF with a 16 ms `setTimeout` shim, after cancelling every native frame id, so no stray native callback starts a second tick chain (an early attempt without that showed a doubled loop that ignored blur). The game clock ran at exactly 1.00 s per second under the shim.
- The trip was read from the component's `useRef` through the React fiber (`__reactFiber…` → `FishingGame` → the hook whose `.current` has `spec` and `phase`).
- I removed every `ektukhani-*-chhip-felo*` key I wrote. `ektukhani-sound` (it was `1`) and `ektukhani-slow` (it was absent) are back as I found them. I never touched the clipboard.

## Quality-bar gaps (game-quality-bar)
1. **Pause isn't a real menu (§7):** there's no pause button, and P and Esc do nothing. The overlay appears only when the tab hides and offers only চালিয়ে যাও. Blur doesn't pause (bugs 1–3).
2. **Words above the play area (§12, §1):** the H1, the lead and the friend banner sit above the pond. On a Pixel 9 the big action button starts below the fold. The pond is tappable, so play still starts, but the start action isn't the biggest, clearest thing.
3. **No "boss" moment (§9):** levels 5, 10 and 15 end a place with a line of text ("বাড়ির পুকুরের সব লেভেল শেষ") and confetti. There's no named big fish to land at the end of the পুকুর, বিল or নদী. The rare fish (রুই, বোয়াল, চিতল, ইলিশ) are ready-made bosses.
4. **Danger isn't at the edge (§6):** the tension meter on the right has a red zone, but nothing glows at the screen edge as the line nears snapping. Only `shake()` fires, after the snap.
5. **The catch card covers the middle (§5):** "ধরা পড়ল!" with a 220 px fish fills the pond for 2.1 s. That's between casts, so it's fine as a celebration. But the fanfare timers outlive it (bug 4), and it has no tap-to-skip hint, although a press after 0.35 s skips it.
6. **Choices (§4):** the result gives পরের লেভেল (primary) and আবার খেলো, which is good. But nothing says what the next level changes ("এবার ঠোকর আসবে", "মাছ জোরে টানে"), though `LEVELS` adds exactly one thing per step. The place gate ("অ্যালবামে ৪ রকম মাছ") shows only after you fail to pass it.
7. **Onboarding and pacing (§9, §3):** level 1 is a good first win: the hush line forgives early taps, and with the autopilot the first fish came within about 6 s. There's no intro for a game with a world (the ঘাট, the বাঁশের ছিপ). A 2–3 panel "দাদুর সঙ্গে পুকুরঘাটে" intro with hold-to-skip would fit.
8. **Difficulty (§2):** ধীরে খেলো is the only option, and toggling it mid-cast can cost a fish (minor bug). No easy or hard promise is given in player terms.
9. **Sound (§11), good:** swish, plop, nibble tick, the deep "গুপ" dip, strike, thrash, the reel hum that follows tension, snap and slip, plus the signature catch chord. Each has a visible twin (ripples, the float, the meter, the miss line). No music loop, which suits a quiet pond, though a soft per-place ambience would add a lot.
10. **Ending (§10), good:** the result has real stats (casts, fish, weight, a near-miss line, a rival line). The card is personal ("ছিপে রুই উঠেছে। পাড়ে লোক জমে গেছে।"). The link replays the same water, and the weight is labelled as the friend's phone's claim.

## Screenshots
- `.shots/chhip-felo-desktop-first-screen.png`: desktop, level 1, with the bubbles, the float and the big button under the pond.
- `.shots/chhip-felo-phone-first-screen.png`: Pixel 9, level 1. The button starts at the fold; trust only the top part of the image.
- `.shots/chhip-felo-phone-reel.png`: a fish on the line, with the tension meter at the right edge.
- `.shots/chhip-felo-phone-catch.png`: the "ধরা পড়ল!" card (রুই, ২ কেজি ৫০ গ্রাম, অ্যালবামে নতুন!) over the pond.
- `.shots/chhip-felo-phone-result.png`: 3 stars on level 1, with confetti.
- `.shots/chhip-felo-desktop-result.png`: the result after the friend's level-5 link: "বাড়ির পুকুরের সব লেভেল শেষ" and "বিল খুলে গেছে!" (bug 5).
- `.shots/chhip-felo-card.png`: the share card, exported from its canvas.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/chhip-felo/ChhipFelo.tla --view ai_docs/statecharts/chhip-felo/view.ts --out ai_docs/statecharts/chhip-felo/before-fix
rm ai_docs/statecharts/chhip-felo/before-fix/tlc*.out
```
The chart hides these steps (the report still checks them): the sound switch, picking a level except on a result whose fanfare is pending, a friend's link except from a fresh aim, window moves on the result, the fanfare going off except when stale, hiding the tab except from a live phase you're watching, and blurring while paused. The config's `CONSTRAINT StopAtLeftovers` stops exploring past a stale fanfare or a skipped level. TLC still checks every rule there.

After the fixes, update the spec: `WindowBlurs` clears `held` and, in a live phase, pauses and stops the hum. `Begin` clears the pending fanfare. `FishLanded` on a friend trip no longer sets `skipped`. Then re-run into `ai_docs/statecharts/chhip-felo/after-fix`. All 11 rules must hold. Also add a rule for the minor slow-mode bug (`SlowToggleKeepsTheBite`) if the rewrite keeps a mid-cast toggle.

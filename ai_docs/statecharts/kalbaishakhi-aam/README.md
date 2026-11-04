# কালবৈশাখী আম: statechart (before the rewrite)

Model: `Storm.tla` / `Storm.cfg`, view `view.ts`, output `before-fix/` (`report.md`, `chart.mmd`).
Mirrors `tools/kalbaishakhi-aam/components/mango-game.tsx`, plus `shared/game-sound.ts` (`loop()`, `setSoundOn()`) and `shared/game-kit.ts` (`useGameLoop` at commit a5fb4f1: stops on a hidden tab, not on blur). Live replays ran 09:15–09:22 today.
TLC: 276 states, 1322 steps. The chart draws 19 states and 44 arrows as parallel regions.

## Systems modelled
| Region | Values | Code |
|---|---|---|
| Game | Ready screen, Storm falling, Paused, Card shows | `phase`, `start()`, `pause()`, `resume()`, `finish()`, `choose()` |
| Window | on the page, another window has focus, tab hidden | `visibilitychange` → `pause()`; **no `blur` listener** |
| Hand | holding ← / → (or a thumb held on one side), hands off | `input.current.keys` / `mode 3`, keyup, `stopInput()` |
| Wind | blowing, quiet | `wind.current = loop("wind")`, `startWind()`, `stopWind()` |
| Sound | on, off | the site-wide `SoundToggle` (off stops every loop, on starts none) |
| Celebration | queued, nothing queued | the `window.setTimeout` in `finish()` (0.25–1.1 s, never cleared) |
| Link | none, friend's storm + seed, another storm, bar says friend's storm while your own storm falls | `hashchange` → `readFriend()`, `choose()`, `start()`'s `friendFits` |

Left out: the storm's physics (pure and covered by `tests/storm.test.ts`), stars and the level store (`recordLevel` keeps the max, so stars never drop and unlocks never shrink; covered by `tests/stages.test.ts`), the card canvas and share bar. The storm list (`সব ঝড়`, a `<details>` below the yard) is modelled as "you can pick a storm on any screen"; opening it without picking is not modelled (it changes nothing in the game, which is itself a gap, see below).

## Rules (plain words)
- **PausedWhenHidden** (holds): the storm never falls while the tab is hidden.
- **PausedWhenBlurred** (breaks): the storm never falls while another window has focus.
- **InputReleasedWhenAway** (breaks): once you leave the window, the ডালা no longer counts ← / → as held.
- **WindOnlyInTheStorm** (breaks): the wind blows only while a storm is falling, on screen, with sound on.
- **WindComesBack** (breaks): whenever a storm is falling on screen with sound on, the wind blows.
- **CelebrationOnItsOwnCard** (breaks): stars' notes, confetti or the lose sound only play while their own card is showing.
- **ReplayIsExact** (breaks): when the bar says you're in the friend's storm, the friend's storm is what's falling.

## Bugs
### 1. PausedWhenBlurred + InputReleasedWhenAway: "I held ←, clicked another window, and the ডালা kept sliding and the storm kept falling."
Shared bug (same as antenna's DialStillWhileAway; dudh and jhalmuri have the blur half too).
- Path (report): ready → you hold ← (storm starts) → you click into another window. The storm keeps falling and `keys` stays −1.
- Live replay (Orca, my own tab; `keydown ArrowLeft` on `window`, then `blur`, no keyup):

  | step | phase | storm clock | ডালা x | keys |
  |---|---|---|---|---|
  | holding ← | playing | 1.33 s | 150 | −1 |
  | blur | playing | 1.33 s | 150 | −1 |
  | 2 s in the other window | playing | 1.55 s | 85 | −1 |
  | back, 1 s, no keyup | playing | 1.65 s | 55 | −1 |
  | a fresh tap of → | playing | 1.75 s | 55 | 0 |

  The storm never paused and the ডালা kept sliding to the wall; it stays pinned until you press and release that key again. (The Orca tab was in the background, so frames were throttled: 0.3 storm-seconds per 3 s of wall time; in a foreground tab the storm runs at full speed.)
- Fix (shared): in the shared player or `useGameLoop`, listen for `window` `blur` and pause like `visibilitychange` does (`pauseRef.current()`, which already calls `stopInput()` and `stopWind()`). Inside the game, add `window.addEventListener("blur", () => pauseRef.current())` next to the `visibilitychange` listener. Note: the in-progress shared `useGameLoop` change (09:36 today, uncommitted) stops frames on blur, which stops the storm, but leaves `input.keys = −1` and the wind loop on, so on focus the ডালা slides again on its own; the game still needs its own blur → `pause()`.

### 2. WindComesBack: "I turned sound off and on again mid-storm, and the wind never came back."
Shared bug (same as antenna's StaticWhileSearching; dudh's hum too).
- Path (report): sound off → শুরু করো (wind loop is a silent stub) → sound on. The model's other path: storm falling → sound off (`stopLoops()`) → sound on.
- Live replay: started with sound on → **1** live looped noise source; sound off → **0**; sound on → **0**; 2 s later → **0**. `wind.current` still holds the stopped handle, so `set()` does nothing.
- Fix (shared): `<SoundToggle onChange={on => on && phase === "playing" && startWind()} />`, or a `loop()` in the kit that re-creates itself when sound comes back on.

### 3. WindOnlyInTheStorm: "I picked a storm from সব ঝড় mid-storm and the wind kept howling on the ready screen."
Game-specific (`choose()` doesn't call `stopWind()`).
- Path (report): শুরু করো → you pick a storm from সব ঝড় → Ready screen, wind blowing.
- Live replay: storm 1 falling, 1 live wind loop → picked ঝড় ১ from the list → phase `ready`, **1** live wind loop; 3 s later still **1**. It stays until the next শুরু করো replaces it.
- Fix: in `choose()`, call `stopInput()` and `stopWind()` (and clear the celebration timer, bug 4).

### 4. CelebrationOnItsOwnCard: "I pressed পরের ঝড় straight away, and a second later the win fanfare and confetti burst over my new storm."
Shared pattern (dudh and jhalmuri have the same un-cleared `setTimeout`).
- Path (report): hold ← → the storm ends and the card shows (celebration queued for 1.1 s) → you press শুরু করো or আবার খেলো → Storm falling with the celebration still queued.
- Live replay (storm clock moved to 44.9 s to reach the card quickly): card at +0 ms (3 stars, new record) → pressed পরের ঝড় at +266 ms → ready → শুরু করো → storm 2 falling; at **+1088 ms** four oscillators started (`sfx.win`) and the confetti canvas was added at **+1089 ms**, over storm 2.
- Fix: keep the timer id in a ref; clear it in `start()`, `choose()`, on hide and on unmount. Better, a shared `useLater()` in the game kit that every game uses for celebrations.

### 5. ReplayIsExact: "I opened Rafi's link while a storm was on; the bar switched to ঝড় ৪ but my own storm kept falling."
Game-specific, minor.
- Path (report): শুরু করো → a friend's link opens → Storm falling, bar says the friend's storm.
- Live replay: storm 2 (seed 760074619) falling → `location.hash = "s=12345&t=50&a=10&l=4&n=Rafi"` → bar `ঝড় ৪ · কালবৈশাখী`, banner "Rafi ৫০ পয়েন্ট করেছে…", still storm 2 with seed 760074619 (and still after pausing). The card at the end would compare against Rafi only if the stages matched.
- Fix: in `readFriend()`, when a round is on, pause and go to the ready screen of the friend's storm (or keep `level` unchanged until the round ends).

## Quality-bar gaps (played end to end in Orca, Pixel 9; screenshots `.shots/kalbaishakhi-aam-ready.png`, `-play.png`, `-card.png`)
1. **First screen:** the start action is a plain শুরু করো button inside a dark legend panel over the yard, not the game's own art (the ডালা or a mango); the panel covers the middle of the scene.
2. **Pause:** no real pause menu. "খেলা থেমে আছে" + চালিয়ে যাও only: no নতুন করে শুরু, কীভাবে খেলবে, শব্দ, সব ঝড়. It doesn't pause on blur (bug 1).
3. **Choices:** the storm list is a `<details>` below the page: unnumbered, each storm has only a name (দমকা হাওয়া, কালবৈশাখী), no one-line real effect, no default, and opening it doesn't pause a storm.
4. **Danger:** losing the last heart has no edge glow or vignette; lives are hearts at the top centre, nothing changes when one is left.
5. **HUD:** the streak label (টানা ৬১টা) and `+১০` floats sit in the middle of the canopy, over falling mangoes.
6. **Sound:** the wind is the only loop and it breaks (bugs 2, 3); no short tune, nothing changes with the storm number.
7. **Pacing:** storm 1 brings no twigs and is a long 45 s of one idea; twigs arrive in storm 2 and gusts strengthen after that. The last storm (বোশেখের শেষ ঝড়) is named but has no "boss" moment beyond more of the same.
8. **End:** good: real stats, stars, near-miss line, mango-tally milestone, personal card. The card's আবার খেলো / পরের ঝড় buttons respond immediately with no guard, which is what lets bug 4 happen.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/kalbaishakhi-aam/Storm.tla --view ai_docs/statecharts/kalbaishakhi-aam/view.ts --out ai_docs/statecharts/kalbaishakhi-aam/<new-folder>
```
After the fix, update the spec to the fixed code and run into `after-fix/`; every rule must hold.

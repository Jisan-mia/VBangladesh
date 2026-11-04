# দুধ উথলানোর আগে: statechart (before the rewrite)

Model: `Milk.tla` / `Milk.cfg`, view `view.ts`, output `before-fix/` (`report.md`, `chart.mmd`).
Mirrors `tools/dudh-uthlano/components/milk-game.tsx` and `tools/dudh-uthlano/lib/dudh.ts` (`startPot`, `liftPot`, `stepRound`), plus `shared/game-sound.ts` (`loop()`, `setSoundOn()`) and `shared/game-kit.ts` (`useGameLoop` at commit a5fb4f1: stops on a hidden tab, not on blur).
TLC: 288 states, 1336 steps. The chart draws 19 states and 47 arrows as parallel regions.

## Systems modelled
| Region | Values | Code |
|---|---|---|
| Game | Pot waiting on the stove, Milk rising, Pot's score shows, Paused, Card shows | `round.current.phase`, `paused`, `begin()`, `press()`, `release()`, `liftNow()`, `stepRound()`, `finishRound()` |
| Window | on the page, another window has focus, tab hidden | `visibilitychange` pauses **only a rising pot**; **no `blur` listener** |
| Hand | holding Space or a finger, hands off | `hold.current` (set by `press`, cleared by `release`, lift, spill, hide, `begin`) |
| Hum | stove hums, no hum | `hum.current = loop("hum", 92)`; stopped on lift, spill, pause, round end, `begin()` |
| Sound | on, off | the site-wide switch (off stops every loop, on starts none) |
| Celebration | queued, nothing queued | the `window.setTimeout` in `finishRound()` (0.3–1.1 s, never cleared) |
| Link | none, friend's pots on the stove, friend's kitchen with other pots, another kitchen | `hashchange` → `begin(friend.seed, friend.kitchen)`, `choose()`, `primary()`, নতুন পাতিলে খেলো |

Abstracted: the pot count (after any pot's score, the next pot or the card can come), the foam curve and scoring (pure, covered by `tests/dudh.test.ts`), the 0.6 s `AGAIN_GUARD_MS` (the card's buttons can be pressed any time after it; the celebration fires at 1.1 s, so a press between 0.6 and 1.1 s is the bug path), the doorbell (a distraction with its own 1.6 s timer that only hides a banner), stars and the level store (`recordLevel` keeps the max; migration covered by `tests/kitchens.test.ts`).

## Rules (plain words)
- **PausedWhenHidden** (holds): milk never rises while the tab is hidden.
- **PausedWhenBlurred** (breaks): milk never rises while another window has focus.
- **InputReleasedWhenAway** (breaks): once you leave the window, the game no longer thinks Space or your finger is held.
- **HumOnlyWhileHeating** (holds): the stove hums only while milk is rising on screen, unpaused, with sound on.
- **HumComesBack** (breaks): whenever milk is rising on screen with sound on, the stove hums.
- **CelebrationOnItsOwnCard** (breaks): the stars' notes, confetti or the lose sound only play while their own card shows.
- **ReplayIsExact** (holds): when the friend's kitchen is open, the friend's pots are on the stove.

## Bugs
### 1. PausedWhenBlurred: "I held Space, clicked another window, and the milk boiled over while I was away."
Shared bug (kalbaishakhi and jhalmuri have it too; same family as antenna's DialStillWhileAway).
- Path (report): pot waiting → you press and hold চেপে ধরো → you click into another window. Milk keeps rising.
- Live replay (Orca, own tab; `keydown " "` on `window`, then `blur`):

  | step | phase | foam | pot clock | holding |
  |---|---|---|---|---|
  | holding Space | rising | 6% | 0.43 s | yes |
  | blur | rising | 6% | 0.43 s | yes |
  | 3 s in the other window | rising | 55% | 3.45 s | yes |
  | still away | result, **spilled** | 100% | 5.95 s | no |

  Pot 1 scored 0 (উথলে গেল) without the player ever seeing it.
- Fix (shared): pause on `window` `blur` exactly as on hide: `hold.current = null; setHolding(false); setPaused(true)` when the pot is rising. Note: the in-progress shared `useGameLoop` change (09:36 today, not yet committed) stops frames on blur, which stops the rise, but does **not** clear `hold`, so bug 2 survives it; and there is still no visible "paused" state, so on focus the milk carries on with no warning.

### 2. InputReleasedWhenAway: "After I came back, pressing Space did nothing; the pot only came off when I let go."
Game-specific (it lives in `press()`: `if (hold.current) return;`), triggered by the shared blur gap.
- Path (report): you press and hold → you click into another window (the keyup is lost there).
- Live replay: pot 2, Space held at 5%, blur for 0.6 s (14%), back at 18%, **press Space at 21%: ignored** (button still "ধরে রাখো…", still rising), still rising at 31% 0.6 s later, then **keyup lifts it at 31%**. The player pressed to lift at 21% and got 31%, a lift they didn't time.
- Fix: clear `hold` on blur (and on `pointercancel`/`lostpointercapture`, which the button already does), or in `press()` treat a press while `hold` is stale (keyup never seen) as a lift.

### 3. HumComesBack: "I turned sound off and on while the milk was on, and the stove went silent."
Shared bug (kalbaishakhi's wind, antenna's static).
- Path (report): press and hold → sound off → sound on.
- Live replay: pot 3, tap Space → rising, **1** live hum oscillator; sound off → **0**; sound on → **0**; 1 s later (foam 24%) → **0**. `hum.current` holds the stopped handle.
- Fix (shared): `<SoundToggle onChange={on => on && round.current.phase === "rising" && !paused && (hum.current = loop("hum", 92))} />`, or a self-restoring `loop()` in the kit.

### 4. CelebrationOnItsOwnCard: "I pressed পরের রান্নাঘর and the win fanfare and confetti burst over the new kitchen."
Shared pattern (kalbaishakhi, jhalmuri).
- Path (report): …last pot's score → the round ends and the card shows (celebration queued) → you press আরেকবার or পরের রান্নাঘর → Pot waiting, celebration still queued.
- Live replay: kitchen 1, pots 90 · 90 · 91 → card "রান্নাঘর ১ পার ★★★ ৯১% এই রান্নাঘরে নতুন রেকর্ড!" at +0 ms → Space (পরের রান্নাঘর) at **+682 ms** (the 0.6 s guard had passed) → kitchen 2, pot 1 waiting → at **+1102 ms** four oscillators (`sfx.win`) and the confetti canvas, over kitchen 2.
- Fix: keep the timer id; clear it in `begin()` and on unmount. Or move the guard to 1.2 s so the card's own celebration always finishes first (both is best: the guard protects against stray taps, the clear against the level list).

## Quality-bar gaps (played end to end in Orca, Pixel 9; `.shots/dudh-uthlano-ready.png`, `-play.png`, `-card.png`)
1. **Pause:** there is no pause at all: no button, no P or Esc. The only pause is a hidden tab during a rising pot, and it shows one line of text ("থেমে আছে। নিচের বোতাম চাপলে আবার চলবে।"); no menu (চালিয়ে যাও, নতুন করে শুরু, কীভাবে খেলবে, শব্দ, সব রান্নাঘর).
2. **Away and back:** blur doesn't pause (bug 1), and a hidden tab while a score shows or a pot waits doesn't pause either (harmless now, but the bar asks for one rule).
3. **First screen:** the action is a good, big button, but it's a plain button under the pot rather than the pot or the flame itself; no one-line difficulty promise for the kitchen (the kitchen's name only).
4. **Choices:** the kitchen list is a `<details>` below the page: unnumbered, no one-line effect per kitchen ("কলিং বেল" doesn't say "বেল বাজবে, চোখ রাখো"), no default marked; picking from it mid-pot silently throws the round away.
5. **Danger:** nothing at the screen edge as the foam passes 90%; the warning is the foam and the % gauge inside the scene.
6. **Sound:** one loop (the hum) and it breaks (bug 3); no short tune or kitchen change in sound; the bell is the signature and works.
7. **HUD:** আম্মু's speech bubble and the first-pot tip sit inside the scene's corners (fine); the result pop (`৯৩% প্রায় কিনারায়!`) and the টিং-টং bell banner are also overlays inside the scene (`.du-pop`, `.du-bell`); check they stay off the pot's rim, the one thing the player watches.
8. **End:** good: real per-pot scores, stars, record line, near-miss ("গড় আর ৫% বেশি হলেই…"), personal card and replayable link.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/dudh-uthlano/Milk.tla --view ai_docs/statecharts/dudh-uthlano/view.ts --out ai_docs/statecharts/dudh-uthlano/<new-folder>
```
After the fix, update the spec to the fixed code and run into `after-fix/`; every rule must hold.

# ১৫ ঘরের ধাঁধা statechart (before the rewrite)

Spec: `Ponero.tla` / `Ponero.cfg` / `view.ts`, mirrored from `tools/ponero-ghor/components/ponero-game.tsx` and `tools/ponero-ghor/lib/game.ts`. TLC: 352 states, 1602 steps. Chart: `before-fix/chart.mmd` (11 states, 30 arrows). Report: `before-fix/report.md`.

## Systems modelled
- **Play phase:** fresh plate → started (moves > 0) → solved. Any move may solve the plate.
- **Pause and focus:** tab visible or hidden, window focused or blurred, the pause overlay. `hide()` pauses only a started, unsolved plate. চালিয়ে যাও or Space resumes.
- **Input:** the pointer press (`press.current`) from `onPointerDown` to `onPointerUp` / `onPointerCancel`. Arrows, H and keyboard clicks commit at once.
- **Timers:** the star chimes, win sound and confetti after a win (`timers.current`), cleared by `goTo()`.
- **Levels and links:** two levels stand in for thirty. `unlocked` is one past the highest cleared. A friend's link sets `friend` and `goTo(link level)`. What you may open is `open = max(unlocked, friend.level)`, and `opened` remembers the most that was ever open.
- There is no game clock: nothing moves unless you move it, so NoProgressWhileAway and ChoiceFreezesPlay hold trivially and aren't modelled. Left out: sound loops (none), kids' rules (not a kids' game), and the hint solver (pure, covered by node tests).

## Rules in plain words
| Rule | Plain words | Result |
|---|---|---|
| InputReleasedWhenAway | After blur or hide, no finger counts as on the plate. | **breaks** |
| UnlockNeverShrinks | A level you could open stays open. | **breaks** |
| PausedWhenHidden | A started plate is paused while its tab is hidden. | holds |
| PausedOnlyMidPlate | Only a started, unsolved plate is ever paused. | holds |
| ChimesOnlyForThisWin | The chimes and confetti never fire after you've moved on. | holds |
| ReplayIsExact | A friend's link opens exactly the friend's level. | holds |
| TypeOK, NoDeadlock | | hold |

## Bugs

Replays ran in Orca (my own tab) by reading the real React state (`PoneroGame` hooks: `game`, `paused`, the `press` ref) and sending `PointerEvent`s at tile centres. Orca pins `document.hidden` to `false`, so the hide replay ran inside a src-less iframe filled with the page's own HTML, where I controlled `document.hidden` (see the ghontar-sur README).

### 1. UnlockNeverShrinks: "a second friend's link locked the level the first one opened" (game-specific)
- **Path (2 steps):** a friend's link opens (level 2) → a friend's link opens (level 1): *Fresh plate, a level you opened is locked again*.
- **Why:** `open` is computed from the *current* `friend`, and `readFriend` runs on every `hashchange`. A newer link with a lower level replaces the friend and shrinks `open`. A reload without the hash does the same.
- **Live (storage cleared, unlocked 1):** link `#l=8&t=15&m=YJ8p3` → 8 levels open, plate "লেভেল ৮ · ৩×৩", banner "এক বন্ধু ৮ নম্বর লেভেল (৩×৩) ১৫ চালে মিলিয়েছে।" → link `#l=3&t=4&m=nw` → **3 levels open**, the level-8 button reads "লেভেল ৮, বন্ধ", and → is disabled on level 3.
- **Fix:** decide what a link opens. The simplest consistent rule: a link opens only its own level (play it, don't unlock the levels between), so `open` stays `unlocked`, and the friend's level stays playable through `friend` alone. Or keep the levels a link opened in storage (`unlocked = max(unlocked, link level)`) so they never lock again. Either way, add a node test for "open never shrinks across two links".

### 2. InputReleasedWhenAway: "a press from before I left still slid a ঘুঁটি after I came back" (shared, low impact)
- **Path (2 steps):** you press a ঘুঁটি → you leave (another window or tab): *finger still counts as down while you're away*. From there, you come back → চালিয়ে যাও → the release lands as a move.
- **Why:** neither `hide()` nor anything on blur clears `press.current`. `onPointerUp` then acts on a press from before the pause.
- **Live, blur:** pressed "২, সরানো যায়" (moves ০) → blur 1 s → focus → the release arrives → moves **১**.
- **Live, hide (iframe):** one slide (moves 2) → pressed "১" (held cell 1) → tab hidden → paused, press still "held cell 1" → shows → Space resumes → release → moves **1** (the old press slid ১ back).
- **Impact:** on phones a system gesture sends `pointercancel`, which already clears the press. The only effect is on desktop, and a fresh `pointerdown` always replaces a stale press. Fix it for consistency with the other games, not because players hit it.
- **Fix (shared):** clear held input (`press.current = null`) on `blur` and on hide. This is the same shared rule as in ছবি ফোটাও.

### Rules that hold, checked live
- **PausedWhenHidden:** the hide replay above shows the overlay "থেমে আছে। তৈরি হলে চাপো।" after one slide.
- **ReplayIsExact:** both links opened exactly their level, and `parseShared` replays the moves (node tests cover invalid links).
- **ChimesOnlyForThisWin:** every way off a won plate goes through `goTo()`, which clears the timers.

## Quality-bar gaps (level 1 solved in Orca at Pixel 9, plus reading levels 1–30)
1. **First screen:** good. The plate is the biggest thing on screen, and level 1 is solved in 2 moves. But the H1 plus a level bar sit above it, and the tools (হিন্ট, ছবি, ধীরে খেলো, sound) are below the fold. Screenshot: `.shots/ponero-ghor-first-screen.png`.
2. **Pause is not a menu:** there's no pause button, P or Esc, and the overlay has one button. It pauses on hide only (fine with no clock, but the shared pause menu should still be there).
3. **Copy contradicts the stars:** solving level 1 with 2 hints at par shows 1 star and "এর চেয়ে কম চালে হয় না।" next to "নিজে নিজে মেলালে ৩ তারা পর্যন্ত পাবে।". Screenshot: `.shots/ponero-ghor-solved.png`.
4. **Pacing:** 10 levels of 3×3, then 15 of 4×4 with par rising to 110 moves, then 5×5 up to 180. Size is the only new idea. There's nothing new per level and no "boss" plate at the end of a size (the picture mode is a toggle, not a stage).
5. **Hint is all-or-nothing:** one hint caps the solve at 1 star, and the button doesn't say so until after you press it. Choices should explain their cost first.
6. **HUD:** the moves counter and the three-star target sit top-right in a level bar (good). Rows done show only as a status line under the plate. There's no progress bar.
7. **Friend links open every level up to theirs** (levels 2–7 opened with a level-8 link), and then shrink back (bug 1).
8. **Sound:** a tin clink per ঘুঁটি, a dull টং for a blocked one, a rising chord per finished row, and the win chimes are all meaningful and synthesized. No loop. Every sound also shows on screen.
9. **Ending:** real stats (moves, par on 3×3, best on this phone), a card and a replay-verified link. Good.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/ponero-ghor/Ponero.tla --view ai_docs/statecharts/ponero-ghor/view.ts --out ai_docs/statecharts/ponero-ghor/after-fix
rm ai_docs/statecharts/ponero-ghor/after-fix/tlc.out
```
The chart hides these steps: a cancelled touch (the same as lifting the finger); the star chimes (they stay on "Solved"); picking a level from mid-plate (the same reset from every state); and friend links that open on a started plate. Away is shown only when a finger is still down, and "a level you opened is locked again" only on a fresh plate (later states with the same flag are marked "may break").

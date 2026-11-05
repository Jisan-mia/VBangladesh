# গুনে দেখি: statechart

The game was rewritten on 2026-11-05 (design: `ai_docs/game-dev/rewrites/gune-dekhi.md`). `before-fix/` holds the first model of the old code (`report.md`, `chart.mmd`, the old `GuneDekhi.tla`, `.cfg`, `view.ts`) and `after-fix/` the run on the rewritten code: **384 states, 1,766 steps, every rule holds.** The chart draws 54 states and 259 arrows.

Files: spec `GuneDekhi.tla`, config `GuneDekhi.cfg`, view `view.ts`. They mirror `tools/gune-dekhi/lib/session.ts` (the pure page logic: screens, pause, away, the one pending timer, the glimpse, the rest screen), `components/game.tsx` (`onAnswer`, `begin`, the glimpse effect, `useGamePlayer`) and `shared/kids-kit.tsx` (`useKidsSession`, `RestScreen`).

## Systems modelled
- **Round:** five ponds a round (two in the model). A right answer starts the one pending timer: the next pond, or after the last the end screen. The last right answer saves the stars and calls `atBreak()` in the same tap.
- **Glimpse (এক নজরে):** the pattern shows for 1.5 s on each pond, on the covered pattern's tap, and again after a miss. Its timer runs only while someone is looking at the play screen.
- **Screens:** title, play, the level list (from the title, the end screen, or the player's সব লেভেল mid-play, with the pond waiting), end.
- **Window:** menu open, window away, in front. Nothing runs under the menu, away, under the list or under the rest screen.
- **Daily limit:** `atBreak()` at the start and the end of a round; `RestScreen` only at a break.

## Rules, in plain words (all hold after the fix)
| Rule | In plain words | Mutation check (scratch copy) |
|---|---|---|
| EveryFinishCounts | A round you finished always gets its stars, and the limit is checked, whatever the hand does next. | Not recording at the last answer breaks it in 4 steps. |
| GlimpseNeverRunsOutUnseen | The 1.5 s pattern never runs out while you look away, under the menu or under the list. | Letting the timer run without `watching` breaks it in 3 steps. |
| NothingMovesWhileCovered | The next pond and the end screen wait while the menu is open, the window is away or the list is up. | Dropping `watching` from the timer guard breaks it in 4 steps. |
| RestOnlyAtBreak | The rest screen shows only over a pond that is already finished, never over a pond in play. | |
| NoNewRoundPastLimit | Past today's limit, খেলো, আবার and a list pick show the rest screen, not a round. | |

Held by node tests instead, because they are not about order of events (`tools/gune-dekhi/tests/session.test.ts`): a scroll is not a tap, the first tap back only wakes the game, a key held through the last pond never skips the result, the end buttons are pictures at least 96 px, no network or child data, the parent gate on the share link, no voice.

## The bugs, and how each was fixed
| # | Bug (the reader's sentence) | Fix | Node test | Live check after the fix (Orca, own tab, 412 wide, 2026-11-05) |
|---|---|---|---|---|
| 1 | **FinishCounts:** "I counted the fifth pond and tapped a mode right away. The three stars never came, and the rest check was skipped." | `onAnswer` records the stars and calls `atBreak()` in the tap that solves the last pond (`session.solved`). The mode buttons and the drawer are gone, so nothing in play restarts the round; the list opens only by choice and keeps the pond. | `bug 1, FinishCounts` | Level 7, fifth pond right: `recorded` was true 200 ms later; the player's নতুন করে শুরু 300 ms after that gave the title and no end screen 1.5 s later. With the limit past, the end screen then the rest screen came. |
| 2 | **SilentWhenMuted:** "My mother turned the sound off and the phone still said 'এক, দুই, তিন'." | No voice anywhere (site rule): no `speak`, `SpeakButton` or `speechSynthesis` in the game. | `bug 2, SilentWhenMuted` | Source check. |
| 3 | **GlimpseOnlyWhileWatching:** "I looked at my brother for a second and the dice was already hidden." | `glimpseEnds` does nothing unless someone is looking (`glimpseMayRun`); the effect is keyed on `watching`, so a full 1.5 s runs after coming back. | `bug 3, GlimpseOnlyWhileWatching` | Level 5: blur at 0.3 s, 2 s away, the pattern was still showing; focus, still showing 1 s later, hidden 0.9 s after that. |
| 4 | **ParentGate:** "I scrolled down and tapped a picture, and I was on a grown-ups' page." | `GamePage` with `kids`: kids-only header, rails and footer. The game links nowhere; the share link is behind `ParentGate`. | `bug 4, ParentGate` | `check:pages` and the page source. |
| 5 | **NoReadingNeeded:** "I'm four. Three buttons with words came up and I pressed the small one." | The end screen has two picture buttons, ↻ and ✓, 112 px tall, equal size. The next level waits on the title. | `bug 5, NoReadingNeeded` | End screens of levels 1 and 8 in `.shots/`. |
| gap 1 | A scroll that starts on the pond counts a fish. | Acts on the lift, not the touch: `lib/tap.ts` accepts a press that comes up on the same thing within 12 px and 800 ms. A browser `pointercancel` drops it. | `gap 1` | A down, cancel, up 60 px lower: 0 tries. A down and up 80 px apart: 0 tries. A 60 ms tap on the right tile: answered. |
| gap 2 | One stray tap restarts the round. | No mode buttons in play. Restart and levels are in the player's menu. | `gap 2` | |
| gap 3 | The game starts 347 px down the screen. | `GamePage`; the game sits at the top of the stage (`justify-content: flex-start`). | `gap 3` | The HUD is the first row under the player band in every shot. |
| — | **Pause on blur** (shared pattern): the 1.1 s timer and the glimpse kept running. | `onPause` stops the pending timer; `onResume` re-arms it after 0.5 s; the glimpse re-arms in full. | `pause freezes…` | See bug 3. |
| — | **The click that brings focus back is not a move.** | `session.blur` arms a swallow; the next tap only wakes the game, unless the player's menu took it. | `the tap that brings focus back…` | Level 5: the first tap after the blur answered nothing; the next did. |
| — | **Result keys need a fresh press.** | `freshKey`: Enter or Space from a keydown after the screen appeared, never a repeat; the keys are handled at `window`. | `result keys need a fresh press…` | |

## The chart (after the fix)
```mermaid
---
title: "গﬂ°°2497¶ßনﬂ°°2503¶ß দﬂ°°2503¶ßখﬂ°°2495¶ß: screens, the pond timer, the glimpse, pause, the daily limit and keys"
---
stateDiagram-v2
  state "Legend" as legend {
    lg0: play
    lg1: between
    lg2: rest
  }
  class lg0 teal
  class lg1 blue
  class lg2 yellow
  state "Game The title (খ#2503;ল#2507;)" as s0 {
    state "Window In front" as s1 {
      s2: Today Time left today
      s3: Today Rest screen
      s4: Today Today's time is up
    }
    state "Window Another window, everything waits" as s5 {
      s6: Today Time left today
      s7: Today Rest screen
      s8: Today Today's time is up
    }
    state "Window Pause menu open, everything waits" as s9 {
      s10: Today Time left today
      s11: Today Rest screen
      s12: Today Today's time is up
    }
  }
  state "Game The level list" as s13 {
    state "Window In front" as s14 {
      s15: Today Time left today
      s16: Today Today's time is up
      s17: Today Rest screen
    }
    state "Window Another window, everything waits" as s18 {
      s19: Today Time left today
      s20: Today Today's time is up
      s21: Today Rest screen
    }
    state "Window Pause menu open, everything waits" as s22 {
      s23: Today Time left today
      s24: Today Today's time is up
      s25: Today Rest screen
    }
  }
  state "Game এক নজর#2503;: pattern showing" as s26 {
    state "Window In front" as s27 {
      s28: Today Time left today
      s29: Today Today's time is up
    }
    state "Window Another window, everything waits" as s30 {
      s31: Today Time left today
      s32: Today Today's time is up
    }
    state "Window Pause menu open, everything waits" as s33 {
      s34: Today Time left today
      s35: Today Today's time is up
    }
  }
  state "Game Pond right, the next pond in 1.1 s" as s36 {
    state "Window In front" as s37 {
      s38: Today Time left today
      s39: Today Today's time is up
    }
    state "Window Another window, everything waits" as s40 {
      s41: Today Time left today
      s42: Today Today's time is up
    }
    state "Window Pause menu open, everything waits" as s43 {
      s44: Today Time left today
      s45: Today Today's time is up
    }
  }
  state "Game এক নজর#2503;: pattern covered" as s46 {
    state "Window In front" as s47 {
      s48: Today Time left today
      s49: Today Today's time is up
    }
    state "Window Another window, everything waits" as s50 {
      s51: Today Time left today
      s52: Today Today's time is up
    }
    state "Window Pause menu open, everything waits" as s53 {
      s54: Today Time left today
      s55: Today Today's time is up
    }
  }
  state "Game Last pond right, stars saved, the end screen in 1.1 s" as s56 {
    state "Window In front" as s57 {
      s58: Today Time left today
      s59: Today Today's time is up
      s60: Today Time's up, the rest waits for the end screen
    }
    state "Window Another window, everything waits" as s61 {
      s62: Today Time left today
      s63: Today Today's time is up
      s64: Today Time's up, the rest waits for the end screen
    }
    state "Window Pause menu open, everything waits" as s65 {
      s66: Today Time left today
      s67: Today Today's time is up
      s68: Today Time's up, the rest waits for the end screen
    }
  }
  state "Game The end screen (আব#2494;র / শ#2503;ষ)" as s69 {
    state "Window In front" as s70 {
      s71: Today Time left today
      s72: Today Today's time is up
      s73: Today Rest screen
    }
    state "Window Another window, everything waits" as s74 {
      s75: Today Time left today
      s76: Today Today's time is up
      s77: Today Rest screen
    }
    state "Window Pause menu open, everything waits" as s78 {
      s79: Today Time left today
      s80: Today Today's time is up
      s81: Today Rest screen
    }
  }
  [*] --> s2
  [*] --> s3
  s2 --> s15: the level list opens (title, end, or the player's সব ল#2503;ভ#2503;ল)
  s2 --> s28: the child taps খ#2503;ল#2507; or আব#2494;র
  s2 --> s6: the window blurs or the tab hides
  s2 --> s4: today's play time runs out
  s2 --> s10: #9208;, P or Escape opens the menu
  s3 --> s2: a grown-up gives আজ আরও ১০ ম#2495;ন#2495;ট
  s3 --> s7: the window blurs or the tab hides
  s3 --> s11: #9208;, P or Escape opens the menu
  s15 --> s2: the page opens again or the child goes back from the list
  s15 --> s28: the child picks a level or the child goes back from the list
  s15 --> s19: the window blurs or the tab hides
  s15 --> s16: today's play time runs out
  s15 --> s23: #9208;, P or Escape opens the menu
  s28 --> s2: the page opens again
  s28 --> s15: the level list opens (title, end, or the player's সব ল#2503;ভ#2503;ল)
  s28 --> s38: the child taps the right answer
  s28 --> s48: the pattern hides after 1.5 s
  s28 --> s31: the window blurs or the tab hides
  s28 --> s29: today's play time runs out
  s28 --> s34: #9208;, P or Escape opens the menu
  s6 --> s2: the window comes back
  s6 --> s8: today's play time runs out
  s6 --> s10: #9208;, P or Escape opens the menu
  s4 --> s3: the page opens again or the child taps খ#2503;ল#2507; or আব#2494;র
  s4 --> s16: the level list opens (title, end, or the player's সব ল#2503;ভ#2503;ল)
  s4 --> s8: the window blurs or the tab hides
  s4 --> s12: #9208;, P or Escape opens the menu
  s7 --> s3: the window comes back
  s7 --> s6: a grown-up gives আজ আরও ১০ ম#2495;ন#2495;ট
  s7 --> s11: #9208;, P or Escape opens the menu
  s10 --> s2: the page opens again or নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ or চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s10 --> s12: today's play time runs out
  s11 --> s3: the page opens again or নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ or চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s11 --> s10: a grown-up gives আজ আরও ১০ ম#2495;ন#2495;ট
  s19 --> s15: the window comes back
  s19 --> s6: the page opens again
  s19 --> s20: today's play time runs out
  s19 --> s23: #9208;, P or Escape opens the menu
  s38 --> s2: the page opens again
  s38 --> s15: the level list opens (title, end, or the player's সব ল#2503;ভ#2503;ল)
  s38 --> s41: the window blurs or the tab hides
  s38 --> s28: the next pond comes
  s38 --> s39: today's play time runs out
  s38 --> s44: #9208;, P or Escape opens the menu
  s48 --> s2: the page opens again
  s48 --> s28: the child taps a wrong answer or the child taps the cover to look again
  s48 --> s38: the child taps the right answer
  s48 --> s15: the level list opens (title, end, or the player's সব ল#2503;ভ#2503;ল)
  s48 --> s51: the window blurs or the tab hides
  s48 --> s49: today's play time runs out
  s48 --> s54: #9208;, P or Escape opens the menu
  s31 --> s28: the window comes back
  s31 --> s6: the page opens again
  s31 --> s32: today's play time runs out
  s31 --> s34: #9208;, P or Escape opens the menu
  s16 --> s3: the page opens again
  s16 --> s4: the child goes back from the list
  s16 --> s20: the window blurs or the tab hides
  s16 --> s24: #9208;, P or Escape opens the menu
  s29 --> s3: the page opens again
  s29 --> s16: the level list opens (title, end, or the player's সব ল#2503;ভ#2503;ল)
  s29 --> s39: the child taps the right answer
  s29 --> s49: the pattern hides after 1.5 s
  s29 --> s32: the window blurs or the tab hides
  s29 --> s35: #9208;, P or Escape opens the menu
  s8 --> s4: the window comes back
  s8 --> s7: the page opens again
  s8 --> s12: #9208;, P or Escape opens the menu
  s23 --> s2: the page opens again or নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ
  s23 --> s15: চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s23 --> s24: today's play time runs out
  s34 --> s2: the page opens again or নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ
  s34 --> s28: চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s34 --> s35: today's play time runs out
  s10 --> s6: the page opens again or নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ or চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s12 --> s3: the page opens again
  s12 --> s4: নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ or চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s11 --> s7: the page opens again or নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ or চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s15 --> s38: the child goes back from the list
  s15 --> s48: the child goes back from the list
  s41 --> s6: the page opens again
  s41 --> s38: the window comes back
  s41 --> s42: today's play time runs out
  s41 --> s44: #9208;, P or Escape opens the menu
  s51 --> s6: the page opens again
  s51 --> s48: the window comes back
  s51 --> s52: today's play time runs out
  s51 --> s54: #9208;, P or Escape opens the menu
  s28 --> s58: the child taps the right answer
  s16 --> s29: the child goes back from the list
  s20 --> s7: the page opens again
  s20 --> s16: the window comes back
  s20 --> s24: #9208;, P or Escape opens the menu
  s39 --> s3: the page opens again
  s39 --> s16: the level list opens (title, end, or the player's সব ল#2503;ভ#2503;ল)
  s39 --> s42: the window blurs or the tab hides
  s39 --> s29: the next pond comes
  s39 --> s45: #9208;, P or Escape opens the menu
  s49 --> s3: the page opens again
  s49 --> s29: the child taps a wrong answer or the child taps the cover to look again
  s49 --> s39: the child taps the right answer
  s49 --> s16: the level list opens (title, end, or the player's সব ল#2503;ভ#2503;ল)
  s49 --> s52: the window blurs or the tab hides
  s49 --> s55: #9208;, P or Escape opens the menu
  s32 --> s7: the page opens again
  s32 --> s29: the window comes back
  s32 --> s35: #9208;, P or Escape opens the menu
  s23 --> s6: the page opens again or নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ
  s23 --> s19: চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s44 --> s2: the page opens again or নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ
  s44 --> s38: চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s44 --> s45: today's play time runs out
  s54 --> s2: the page opens again or নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ
  s54 --> s48: চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s54 --> s55: today's play time runs out
  s34 --> s6: the page opens again or নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ
  s34 --> s31: চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s24 --> s3: the page opens again
  s24 --> s4: নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ
  s24 --> s16: চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s35 --> s3: the page opens again
  s35 --> s4: নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ
  s35 --> s29: চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s12 --> s7: the page opens again
  s12 --> s8: নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ or চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s48 --> s58: the child taps the right answer
  s58 --> s2: the page opens again
  s58 --> s15: the level list opens (title, end, or the player's সব ল#2503;ভ#2503;ল)
  s58 --> s71: the end screen comes
  s58 --> s62: the window blurs or the tab hides
  s58 --> s59: today's play time runs out
  s58 --> s66: #9208;, P or Escape opens the menu
  s16 --> s39: the child goes back from the list
  s16 --> s49: the child goes back from the list
  s42 --> s7: the page opens again
  s42 --> s39: the window comes back
  s42 --> s45: #9208;, P or Escape opens the menu
  s52 --> s7: the page opens again
  s52 --> s49: the window comes back
  s52 --> s55: #9208;, P or Escape opens the menu
  s29 --> s60: the child taps the right answer
  s44 --> s6: the page opens again or নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ
  s44 --> s41: চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s54 --> s6: the page opens again or নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ
  s54 --> s51: চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s24 --> s7: the page opens again
  s24 --> s8: নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ
  s24 --> s20: চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s45 --> s3: the page opens again
  s45 --> s4: নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ
  s45 --> s39: চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s55 --> s3: the page opens again
  s55 --> s4: নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ
  s55 --> s49: চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s35 --> s7: the page opens again
  s35 --> s8: নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ
  s35 --> s32: চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s15 --> s58: the child goes back from the list
  s71 --> s2: the page opens again or নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ
  s71 --> s28: the child taps খ#2503;ল#2507; or আব#2494;র
  s71 --> s15: the level list opens (title, end, or the player's সব ল#2503;ভ#2503;ল)
  s71 --> s75: the window blurs or the tab hides
  s71 --> s72: today's play time runs out
  s71 --> s79: #9208;, P or Escape opens the menu
  s62 --> s6: the page opens again
  s62 --> s58: the window comes back
  s62 --> s63: today's play time runs out
  s62 --> s66: #9208;, P or Escape opens the menu
  s49 --> s60: the child taps the right answer
  s59 --> s3: the page opens again
  s59 --> s16: the level list opens (title, end, or the player's সব ল#2503;ভ#2503;ল)
  s59 --> s72: the end screen comes
  s59 --> s63: the window blurs or the tab hides
  s59 --> s67: #9208;, P or Escape opens the menu
  s60 --> s3: the page opens again
  s60 --> s17: the level list opens (title, end, or the player's সব ল#2503;ভ#2503;ল)
  s60 --> s73: the end screen comes
  s60 --> s64: the window blurs or the tab hides
  s60 --> s68: #9208;, P or Escape opens the menu
  s66 --> s2: the page opens again or নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ
  s66 --> s58: চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s66 --> s67: today's play time runs out
  s45 --> s7: the page opens again
  s45 --> s8: নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ
  s45 --> s42: চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s55 --> s7: the page opens again
  s55 --> s8: নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ
  s55 --> s52: চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s15 --> s71: the child goes back from the list
  s75 --> s6: the page opens again
  s75 --> s71: the window comes back
  s75 --> s76: today's play time runs out
  s75 --> s79: #9208;, P or Escape opens the menu
  s16 --> s59: the child goes back from the list
  s17 --> s3: the page opens again
  s17 --> s15: a grown-up gives আজ আরও ১০ ম#2495;ন#2495;ট
  s17 --> s21: the window blurs or the tab hides
  s17 --> s25: #9208;, P or Escape opens the menu
  s72 --> s3: the page opens again
  s72 --> s73: the child taps খ#2503;ল#2507; or আব#2494;র
  s72 --> s16: the level list opens (title, end, or the player's সব ল#2503;ভ#2503;ল)
  s72 --> s76: the window blurs or the tab hides
  s72 --> s4: নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ
  s72 --> s80: #9208;, P or Escape opens the menu
  s73 --> s3: the page opens again
  s73 --> s71: a grown-up gives আজ আরও ১০ ম#2495;ন#2495;ট
  s73 --> s77: the window blurs or the tab hides
  s73 --> s81: #9208;, P or Escape opens the menu
  s63 --> s7: the page opens again
  s63 --> s59: the window comes back
  s63 --> s67: #9208;, P or Escape opens the menu
  s64 --> s7: the page opens again
  s64 --> s60: the window comes back
  s64 --> s68: #9208;, P or Escape opens the menu
  s79 --> s2: the page opens again or নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ
  s79 --> s71: চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s79 --> s80: today's play time runs out
  s66 --> s6: the page opens again or নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ
  s66 --> s62: চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s67 --> s3: the page opens again
  s67 --> s59: চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s67 --> s4: নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ
  s68 --> s3: the page opens again or নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ
  s68 --> s60: চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s16 --> s72: the child goes back from the list
  s21 --> s7: the page opens again
  s21 --> s19: a grown-up gives আজ আরও ১০ ম#2495;ন#2495;ট
  s21 --> s17: the window comes back
  s21 --> s25: #9208;, P or Escape opens the menu
  s76 --> s7: the page opens again
  s76 --> s72: the window comes back
  s76 --> s80: #9208;, P or Escape opens the menu
  s77 --> s7: the page opens again
  s77 --> s75: a grown-up gives আজ আরও ১০ ম#2495;ন#2495;ট
  s77 --> s73: the window comes back
  s77 --> s81: #9208;, P or Escape opens the menu
  s79 --> s6: the page opens again or নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ
  s79 --> s75: চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s25 --> s3: the page opens again or নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ
  s25 --> s17: চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s25 --> s23: a grown-up gives আজ আরও ১০ ম#2495;ন#2495;ট
  s80 --> s3: the page opens again
  s80 --> s72: চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s80 --> s4: নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ
  s81 --> s3: the page opens again or নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ
  s81 --> s73: চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s81 --> s79: a grown-up gives আজ আরও ১০ ম#2495;ন#2495;ট
  s67 --> s7: the page opens again
  s67 --> s63: চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s67 --> s8: নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ
  s68 --> s7: the page opens again or নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ
  s68 --> s64: চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s25 --> s7: the page opens again or নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ
  s25 --> s21: চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s80 --> s7: the page opens again
  s80 --> s76: চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s80 --> s8: নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ
  s81 --> s7: the page opens again or নত#2497;ন কর#2503; শ#2497;র#2497;, or শ#2503;ষ
  s81 --> s77: চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  class s2 blue
  class s3 yellow
  class s4 blue
  class s6 blue
  class s7 yellow
  class s8 blue
  class s10 blue
  class s11 yellow
  class s12 blue
  class s15 blue
  class s16 blue
  class s17 yellow
  class s19 blue
  class s20 blue
  class s21 yellow
  class s23 blue
  class s24 blue
  class s25 yellow
  class s28 teal
  class s29 teal
  class s31 teal
  class s32 teal
  class s34 teal
  class s35 teal
  class s38 teal
  class s39 teal
  class s41 teal
  class s42 teal
  class s44 teal
  class s45 teal
  class s48 teal
  class s49 teal
  class s51 teal
  class s52 teal
  class s54 teal
  class s55 teal
  class s58 teal
  class s59 teal
  class s60 teal
  class s62 teal
  class s63 teal
  class s64 teal
  class s66 teal
  class s67 teal
  class s68 teal
  class s71 blue
  class s72 blue
  class s73 yellow
  class s75 blue
  class s76 blue
  class s77 yellow
  class s79 blue
  class s80 blue
  class s81 yellow
```

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/gune-dekhi/GuneDekhi.tla --view ai_docs/statecharts/gune-dekhi/view.ts --out ai_docs/statecharts/gune-dekhi/after-fix
rm ai_docs/statecharts/gune-dekhi/after-fix/tlc.out
```
The `--out` folder must be new or empty.

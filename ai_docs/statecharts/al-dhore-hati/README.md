# আল ধরে হাঁটি: statechart (after the rewrite)

The game was rewritten in Nov 2026 (design: `ai_docs/game-dev/rewrites/al-dhore-hati.md`). This folder has both halves:
- **before-fix/**: the model of the shipped game (`AlDhore.tla`, `.cfg`, `view.ts` as they were, and their run). It found three bugs and one gap.
- **after-fix/**: the run of today's `AlDhore.tla`. It has 376 states, and all 9 rules hold (10 with NoDeadlock).

## What the model mirrors
- `tools/al-dhore-hati/components/walk-game.tsx`: `begin`, `finish`, `startFromTitle`, `goFromReady`, `pickLevel`, `again`, the keydown/keyup effect, `onDown`/`onUp`, the blur/focus/visibility effect, the sound effect, and `useGamePlayer`'s `onPause`, `onResume` and `onLevels`.
- `lib/session.ts`, the pure session the component forwards every event to: `ticking`, `canSteer`, `press`, `keyDown`, `holdOf`, `wantWind`, `syncLoops`, `blur`, `hide`, `pause`, `resume`, `openSheet` and `closeSheet`.
- `lib/step.hot.ts` (`stepGame`), `lib/link.ts` (`retrySeed`) and `lib/levels.ts` (`showsIntro`).

Abstractions:
- the field is a windy one, so the wind loop is in play;
- "guard" means চালিয়ে যাও, the window or the level list came back under 250 ms ago (`RESUME_GUARD`);
- "held" means a key or a finger is down; `walked` counts steps the walk took;
- a hidden tab calls `S.hide`, a superset of `S.blur`, so the model has one "another window" path and `tests/session.test.ts` checks hide on its own;
- result-key freshness (450 ms), the friend-opens-no-gap unlock rule and the old-link replay are checked in node (`tests/session.test.ts`, `tests/rules.test.ts`, `tests/field.test.ts`).

## Before → after
| | Before | After |
|---|---|---|
| Page | Its own hero above the game, its own pause chip and cover | `<GamePage>`. The game reads `useGamePlayer()` for pause, resume, restart and সব লেভেল. P calls `player.requestPause()`. |
| Window blur | `useGameLoop` stopped its frames; the held side, the wind and the walk's input stayed | `session.blur` lets go of every key and finger, `syncLoops` stops the wind, and the player opens its menu. |
| Held ← through a blur | The feet kept steering on return | Nothing is held after a blur; the press that wakes the game is ignored for 250 ms. |
| আবার খেলো after a win | A fresh seed, always | `retrySeed`: a friend's field keeps its seed on both end cards. |
| Going up a level | Straight into the walk; the new obstacle's intro never showed | A ready card for every level you haven't met (`showsIntro`), with a picture of its new thing. |
| Pause | No button, no P | The player's menu, plus P. The level list stops the walk too. |
| Danger | Only the feet dots under the board | The field's edge glows amber then red from 65% of the ridge, the walker wobbles, a creak sounds; a coming gust lights its edge blue; the last slip keeps a red border. |

## Rules (plain words)
| Rule | The reader's sentence | Before | After |
|---|---|---|---|
| **InputReleasedWhenAway** | After a blur, a hidden tab, the menu or the list, no side counts as held. | **broke** | holds |
| NoProgressWhileAway (was PausedWhenBlurred) | The walk, the clock, the pull and the wind don't move while you're away, paused or behind the list. | **PausedWhenBlurred broke** (blur only stopped the frames, with no menu) | holds |
| **LoopOnlyWhenMeaningful** | The wind plays only while you walk a windy field on a focused page with sound on. | **broke** | holds |
| LoopComesBack | While you walk with sound on, the wind is playing; turning sound on or coming back restores it. | held | holds |
| NoDoubleResult | A field ends once. | held | holds |
| **ReplayIsExact** | Retrying a friend's field, from either end card, keeps the friend's field. | **broke** | holds |
| FocusClickIsNotAMove | The press that brings you back never steers. | (not in model) | holds |
| IntroShownBeforePlay | Every level's intro is shown (or already seen) before its walk starts. | (gap) | holds |
| NoDeadlock | You can always do something. | held | holds |

**Mutation check** (`scratchpad/al-dhore-hati/mut/`): each change below puts back the old behaviour, and exactly the named rule breaks.
| Change | Rule that breaks |
|---|---|
| Blur doesn't let go of the hand | InputReleasedWhenAway |
| A finger counts inside the wake-up guard | FocusClickIsNotAMove |
| A new level goes straight into the walk | IntroShownBeforePlay |
| The wind ignores window focus | LoopOnlyWhenMeaningful |
| The walk steps while another window has focus | NoProgressWhileAway |
| The retry takes a fresh seed | ReplayIsExact |

So the rules are not vacuous.

## Bugs (found before, fixed now)

### 1. InputReleasedWhenAway / PausedWhenBlurred: "I was holding ← when a message popped up. I clicked into it, and when I came back my man walked straight into the mud."
- **Path:** you hold ← → you click into another window → you come back.
- **Replay before (Orca, level 1):** at 4.5 m, x 174, then `blur`: three seconds later `keys.left` was still true, `dir` −1 and no overlay. On `focus`: x 174.1 → 145.5 and a slip, with no key pressed.
- **Replay after (Orca, level 11, 4 Nov 2026):** ← held for 150 ms (dir −1, vel −75.7, x 145.6), `blur`: after 3 s `dir` 0, `left` false, clock frozen at 4.55 s, menu open. After চালিয়ে যাও and 1.2 s: x 143.3, slips 0.
- **Fix:** `session.blur` clears keys and fingers; the player's menu opens on blur; `step()` does nothing unless `ticking`.
- **Tests:** `statechart InputReleasedWhenAway`, `statechart PausedWhenBlurred`, `statechart PausedWhenHidden`.

### 2. LoopOnlyWhenMeaningful: "On the windy fields the wind kept blowing while I was in another window."
- **Replay before:** a friend link to level 11, then the autopilot for 2 s: the wind live (1 started, 0 stopped). After `blur` and 4 s: clock unchanged, the wind still running.
- **Replay after (Orca):** `#s=99&t=0&m=56&l=11&v=2`: at 3.92 s the wind was live (1 started, 0 stopped). After `blur` and 3 s: clock still 3.92, loops 1 started and 1 stopped, `wind` false, paused true.
- **Fix:** `syncLoops` runs after every step and every event; `wantWind` needs `ticking`. A loop is replaced, never kept as a muted stub (`LoopComesBack`).
- **Tests:** `statechart LoopOnlyWhenMeaningful`, `statechart LoopComesBack`.

### 3. ReplayIsExact: "I matched my friend's dry walk and pressed আবার খেলো to do it again, and got a different field. The comparison with my friend was gone."
- **Path:** you open a friend's link → you tap চলো → you reach the end → you press আবার খেলো.
- **Replay before:** `#s=4242&t=0&m=30&l=1&n=Rafi`: after আবার খেলো `field.seed` 4242 → 226242739 and `rival` null.
- **Replay after (Orca):** `#s=4242&t=0&m=36&l=3&v=2&n=Rafi`: the autopilot cleared it ("সমান সমান! Rafiও একবারও পিছলায়নি।"), then আবার খেলো: seed 4242. After a forced fall on the same field, আবার খেলো: seed 4242 again.
- **Fix:** one `again()` for both cards, using `retrySeed(friend, run, fresh)`.
- **Test:** `statechart ReplayIsExact`.

### Gap closed: the intro of a new obstacle never showed
- পরের লেভেল and the list went straight into the walk. Now a level you haven't met shows its ready card (name, its one new thing, a small real picture) first; `showsIntro` and `ektukhani-seen-al-dhore-hati` decide.
- **Test:** `statechart IntroForEveryNewLevel`.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/al-dhore-hati/AlDhore.tla --view ai_docs/statecharts/al-dhore-hati/view.ts --out ai_docs/statecharts/al-dhore-hati/<new-folder>
```
The chart hides "you turn sound on/off". Those steps are in the model and the rule checks.

## The chart (`after-fix/chart.mmd`)
```mermaid
---
title: "Al Dhore Hati: the screen, the menu, the window, your hand and the wind"
---
stateDiagram-v2
  state "Legend" as legend {
    lg0: play
    lg1: held
    lg2: done
    lg3: wait
  }
  class lg0 teal
  class lg1 yellow
  class lg2 blue
  class lg3 tan
  state "Screen Title: the signboard" as s0 {
    state "Window You're on the page" as s1 {
      state "Hand Hands off" as s2 {
        state "Wake Ready for presses" as s3 {
          state "Wind No wind" as s4 {
            s5: Field A fresh field
            s6: Field Friend's field
          }
        }
        state "Wake Just back: presses only wake the game" as s7 {
          state "Wind No wind" as s8 {
            s9: Field A fresh field
            s10: Field Friend's field
          }
        }
      }
    }
    state "Window Another window has focus (or the tab is hidden)" as s11 {
      state "Hand Hands off" as s12 {
        state "Wake Ready for presses" as s13 {
          state "Wind No wind" as s14 {
            s15: Field A fresh field
            s16: Field Friend's field
          }
        }
        state "Wake Just back: presses only wake the game" as s17 {
          state "Wind No wind" as s18 {
            s19: Field A fresh field
            s20: Field Friend's field
          }
        }
      }
    }
  }
  state "Screen Walking the আল" as s21 {
    state "Window You're on the page" as s22 {
      state "Hand Hands off" as s23 {
        state "Wake Ready for presses" as s24 {
          state "Wind Wind playing" as s25 {
            s26: Field A fresh field
            s27: Field Friend's field
          }
          state "Wind No wind" as s28 {
            s29: Field A fresh field
            s30: Field Friend's field
          }
        }
        state "Wake Just back: presses only wake the game" as s31 {
          state "Wind Wind playing" as s32 {
            s33: Field A fresh field
            s34: Field Friend's field
          }
          state "Wind No wind" as s35 {
            s36: Field A fresh field
            s37: Field Friend's field
          }
        }
      }
      state "Hand Holding #8592; or #8594;" as s38 {
        state "Wake Ready for presses" as s39 {
          state "Wind Wind playing" as s40 {
            s41: Field A fresh field
            s42: Field Friend's field
          }
          state "Wind No wind" as s43 {
            s44: Field A fresh field
            s45: Field Friend's field
          }
        }
        state "Wake Just back: presses only wake the game" as s46 {
          state "Wind Wind playing" as s47 {
            s48: Field A fresh field
            s49: Field Friend's field
          }
          state "Wind No wind" as s50 {
            s51: Field A fresh field
            s52: Field Friend's field
          }
        }
      }
      state "Hand A finger on the field" as s53 {
        state "Wake Ready for presses" as s54 {
          state "Wind Wind playing" as s55 {
            s56: Field A fresh field
            s57: Field Friend's field
          }
          state "Wind No wind" as s58 {
            s59: Field A fresh field
            s60: Field Friend's field
          }
        }
      }
    }
    state "Window Another window has focus (or the tab is hidden)" as s61 {
      state "Hand Hands off" as s62 {
        state "Wake Ready for presses" as s63 {
          state "Wind No wind" as s64 {
            s65: Field A fresh field
            s66: Field Friend's field
          }
        }
        state "Wake Just back: presses only wake the game" as s67 {
          state "Wind No wind" as s68 {
            s69: Field A fresh field
            s70: Field Friend's field
          }
        }
      }
    }
  }
  state "Screen Ready card: this level's new thing" as s71 {
    state "Window You're on the page" as s72 {
      state "Hand Hands off" as s73 {
        state "Wake Ready for presses" as s74 {
          state "Wind No wind" as s75 {
            s76: Field A fresh field
          }
        }
        state "Wake Just back: presses only wake the game" as s77 {
          state "Wind No wind" as s78 {
            s79: Field A fresh field
          }
        }
      }
    }
    state "Window Another window has focus (or the tab is hidden)" as s80 {
      state "Hand Hands off" as s81 {
        state "Wake Ready for presses" as s82 {
          state "Wind No wind" as s83 {
            s84: Field A fresh field
          }
        }
        state "Wake Just back: presses only wake the game" as s85 {
          state "Wind No wind" as s86 {
            s87: Field A fresh field
          }
        }
      }
    }
  }
  state "Screen Level list open" as s88 {
    state "Window You're on the page" as s89 {
      state "Hand Hands off" as s90 {
        state "Wake Ready for presses" as s91 {
          state "Wind No wind" as s92 {
            s93: Field A fresh field
            s94: Field Friend's field
          }
        }
        state "Wake Just back: presses only wake the game" as s95 {
          state "Wind No wind" as s96 {
            s97: Field A fresh field
            s98: Field Friend's field
          }
        }
      }
    }
    state "Window Another window has focus (or the tab is hidden)" as s99 {
      state "Hand Hands off" as s100 {
        state "Wake Ready for presses" as s101 {
          state "Wind No wind" as s102 {
            s103: Field A fresh field
            s104: Field Friend's field
          }
        }
        state "Wake Just back: presses only wake the game" as s105 {
          state "Wind No wind" as s106 {
            s107: Field A fresh field
            s108: Field Friend's field
          }
        }
      }
    }
  }
  state "Screen End screen" as s109 {
    state "Window You're on the page" as s110 {
      state "Hand Hands off" as s111 {
        state "Wake Ready for presses" as s112 {
          state "Wind No wind" as s113 {
            s114: Field A fresh field
            s115: Field Friend's field
          }
        }
        state "Wake Just back: presses only wake the game" as s116 {
          state "Wind No wind" as s117 {
            s118: Field A fresh field
            s119: Field Friend's field
          }
        }
      }
    }
    state "Window Another window has focus (or the tab is hidden)" as s120 {
      state "Hand Hands off" as s121 {
        state "Wake Ready for presses" as s122 {
          state "Wind No wind" as s123 {
            s124: Field A fresh field
            s125: Field Friend's field
          }
        }
        state "Wake Just back: presses only wake the game" as s126 {
          state "Wind No wind" as s127 {
            s128: Field A fresh field
            s129: Field Friend's field
          }
        }
      }
    }
  }
  state "Screen Paused" as s130 {
    state "Window You're on the page" as s131 {
      state "Hand Hands off" as s132 {
        state "Wake Ready for presses" as s133 {
          state "Wind No wind" as s134 {
            s135: Field A fresh field
            s136: Field Friend's field
          }
        }
        state "Wake Just back: presses only wake the game" as s137 {
          state "Wind No wind" as s138 {
            s139: Field A fresh field
            s140: Field Friend's field
          }
        }
      }
    }
    state "Window Another window has focus (or the tab is hidden)" as s141 {
      state "Hand Hands off" as s142 {
        state "Wake Ready for presses" as s143 {
          state "Wind No wind" as s144 {
            s145: Field A fresh field
            s146: Field Friend's field
          }
        }
        state "Wake Just back: presses only wake the game" as s147 {
          state "Wind No wind" as s148 {
            s149: Field A fresh field
            s150: Field Friend's field
          }
        }
      }
    }
  }
  [*] --> s5
  s5 --> s15: you click into another window (or hide the tab)
  s5 --> s6: you open a friend's link
  s5 --> s26: you tap চল#2507; on the title
  s5 --> s29: you tap চল#2507; on the title
  s15 --> s16: you open a friend's link
  s15 --> s9: you come back to the window (or the tab)
  s5 --> s9: you close the list or you press চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s6 --> s16: you click into another window (or hide the tab)
  s6 --> s27: you tap চল#2507; on the title
  s26 --> s65: you click into another window (or hide the tab)
  s26 --> s41: you hold #8592; or #8594;
  s26 --> s93: you open সব ল#2503;ভ#2503;ল
  s26 --> s56: you press the field
  s26 --> s114: you reach the yard or slip the last time
  s26 --> s135: the menu opens
  s6 --> s30: you tap চল#2507; on the title
  s29 --> s65: you click into another window (or hide the tab)
  s29 --> s44: you hold #8592; or #8594;
  s29 --> s93: you open সব ল#2503;ভ#2503;ল
  s29 --> s59: you press the field
  s29 --> s114: you reach the yard or slip the last time
  s29 --> s135: the menu opens
  s15 --> s19: you close the list
  s16 --> s10: you come back to the window (or the tab)
  s76 --> s84: you click into another window (or hide the tab)
  s9 --> s5: a quarter second passes
  s9 --> s26: you tap চল#2507; on the title
  s9 --> s19: you click into another window (or hide the tab)
  s9 --> s10: you open a friend's link
  s6 --> s10: you close the list or you press চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s65 --> s33: you come back to the window (or the tab)
  s65 --> s145: the menu opens
  s41 --> s26: you let go
  s41 --> s65: you click into another window (or hide the tab)
  s41 --> s93: you open সব ল#2503;ভ#2503;ল
  s41 --> s56: you press the field
  s41 --> s114: you reach the yard or slip the last time
  s41 --> s135: the menu opens
  s93 --> s103: you click into another window (or hide the tab)
  s93 --> s139: you close the list
  s27 --> s66: you click into another window (or hide the tab)
  s27 --> s42: you hold #8592; or #8594;
  s27 --> s94: you open সব ল#2503;ভ#2503;ল
  s27 --> s57: you press the field
  s27 --> s115: you reach the yard or slip the last time
  s27 --> s136: the menu opens
  s56 --> s26: you let go
  s56 --> s65: you click into another window (or hide the tab)
  s56 --> s93: you open সব ল#2503;ভ#2503;ল
  s56 --> s114: you reach the yard or slip the last time
  s56 --> s135: the menu opens
  s114 --> s26: you press আব#2494;র খ#2503;ল#2507; (or আর#2503;কব#2494;র)
  s114 --> s124: you click into another window (or hide the tab)
  s135 --> s33: you press চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s135 --> s145: you click into another window (or hide the tab)
  s9 --> s29: you tap চল#2507; on the title
  s65 --> s36: you come back to the window (or the tab)
  s44 --> s29: you let go
  s44 --> s65: you click into another window (or hide the tab)
  s44 --> s93: you open সব ল#2503;ভ#2503;ল
  s44 --> s59: you press the field
  s44 --> s114: you reach the yard or slip the last time
  s44 --> s135: the menu opens
  s30 --> s66: you click into another window (or hide the tab)
  s30 --> s45: you hold #8592; or #8594;
  s30 --> s94: you open সব ল#2503;ভ#2503;ল
  s30 --> s60: you press the field
  s30 --> s115: you reach the yard or slip the last time
  s30 --> s136: the menu opens
  s59 --> s29: you let go
  s59 --> s65: you click into another window (or hide the tab)
  s59 --> s93: you open সব ল#2503;ভ#2503;ল
  s59 --> s114: you reach the yard or slip the last time
  s59 --> s135: the menu opens
  s114 --> s29: you press আব#2494;র খ#2503;ল#2507; (or আর#2503;কব#2494;র)
  s135 --> s36: you press চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s19 --> s15: a quarter second passes
  s19 --> s9: you come back to the window (or the tab)
  s19 --> s20: you open a friend's link
  s16 --> s20: you close the list
  s10 --> s6: a quarter second passes
  s10 --> s27: you tap চল#2507; on the title
  s10 --> s20: you click into another window (or hide the tab)
  s103 --> s97: you come back to the window (or the tab)
  s103 --> s149: you close the list
  s66 --> s34: you come back to the window (or the tab)
  s66 --> s146: the menu opens
  s124 --> s118: you come back to the window (or the tab)
  s33 --> s26: a quarter second passes
  s33 --> s139: the menu opens
  s33 --> s69: you click into another window (or hide the tab)
  s33 --> s48: you hold #8592; or #8594;
  s33 --> s97: you open সব ল#2503;ভ#2503;ল
  s33 --> s118: you reach the yard or slip the last time
  s42 --> s27: you let go
  s42 --> s66: you click into another window (or hide the tab)
  s42 --> s94: you open সব ল#2503;ভ#2503;ল
  s42 --> s57: you press the field
  s42 --> s115: you reach the yard or slip the last time
  s42 --> s136: the menu opens
  s94 --> s104: you click into another window (or hide the tab)
  s94 --> s140: you close the list
  s57 --> s27: you let go
  s57 --> s66: you click into another window (or hide the tab)
  s57 --> s94: you open সব ল#2503;ভ#2503;ল
  s57 --> s115: you reach the yard or slip the last time
  s57 --> s136: the menu opens
  s114 --> s118: you close the list or you press চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s115 --> s27: you press আব#2494;র খ#2503;ল#2507; (or আর#2503;কব#2494;র)
  s115 --> s125: you click into another window (or hide the tab)
  s76 --> s79: you press চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s145 --> s139: you come back to the window (or the tab)
  s93 --> s97: you press চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s139 --> s135: a quarter second passes
  s139 --> s33: you press চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s139 --> s149: you click into another window (or hide the tab)
  s136 --> s34: you press চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s136 --> s146: you click into another window (or hide the tab)
  s10 --> s30: you tap চল#2507; on the title
  s66 --> s37: you come back to the window (or the tab)
  s36 --> s29: a quarter second passes
  s36 --> s139: the menu opens
  s36 --> s69: you click into another window (or hide the tab)
  s36 --> s51: you hold #8592; or #8594;
  s36 --> s97: you open সব ল#2503;ভ#2503;ল
  s36 --> s118: you reach the yard or slip the last time
  s45 --> s30: you let go
  s45 --> s66: you click into another window (or hide the tab)
  s45 --> s94: you open সব ল#2503;ভ#2503;ল
  s45 --> s60: you press the field
  s45 --> s115: you reach the yard or slip the last time
  s45 --> s136: the menu opens
  s60 --> s30: you let go
  s60 --> s66: you click into another window (or hide the tab)
  s60 --> s94: you open সব ল#2503;ভ#2503;ল
  s60 --> s115: you reach the yard or slip the last time
  s60 --> s136: the menu opens
  s115 --> s30: you press আব#2494;র খ#2503;ল#2507; (or আর#2503;কব#2494;র)
  s139 --> s36: you press চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s136 --> s37: you press চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s20 --> s16: a quarter second passes
  s20 --> s10: you come back to the window (or the tab)
  s79 --> s76: a quarter second passes
  s79 --> s87: you click into another window (or hide the tab)
  s69 --> s65: a quarter second passes
  s69 --> s33: you come back to the window (or the tab)
  s69 --> s149: the menu opens
  s104 --> s98: you come back to the window (or the tab)
  s104 --> s150: you close the list
  s124 --> s128: you close the list
  s125 --> s119: you come back to the window (or the tab)
  s48 --> s41: a quarter second passes
  s48 --> s33: you let go
  s48 --> s139: the menu opens
  s48 --> s69: you click into another window (or hide the tab)
  s48 --> s97: you open সব ল#2503;ভ#2503;ল
  s48 --> s118: you reach the yard or slip the last time
  s97 --> s93: a quarter second passes
  s97 --> s139: you close the list
  s97 --> s107: you click into another window (or hide the tab)
  s34 --> s27: a quarter second passes
  s34 --> s140: the menu opens
  s34 --> s70: you click into another window (or hide the tab)
  s34 --> s49: you hold #8592; or #8594;
  s34 --> s98: you open সব ল#2503;ভ#2503;ল
  s34 --> s119: you reach the yard or slip the last time
  s118 --> s26: you press আব#2494;র খ#2503;ল#2507; (or আর#2503;কব#2494;র)
  s118 --> s114: a quarter second passes
  s118 --> s128: you click into another window (or hide the tab)
  s115 --> s119: you close the list or you press চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s149 --> s145: a quarter second passes
  s149 --> s139: you come back to the window (or the tab)
  s146 --> s140: you come back to the window (or the tab)
  s94 --> s98: you press চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s140 --> s136: a quarter second passes
  s140 --> s34: you press চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s140 --> s150: you click into another window (or hide the tab)
  s69 --> s36: you come back to the window (or the tab)
  s51 --> s44: a quarter second passes
  s51 --> s36: you let go
  s51 --> s139: the menu opens
  s51 --> s69: you click into another window (or hide the tab)
  s51 --> s97: you open সব ল#2503;ভ#2503;ল
  s51 --> s118: you reach the yard or slip the last time
  s37 --> s30: a quarter second passes
  s37 --> s140: the menu opens
  s37 --> s70: you click into another window (or hide the tab)
  s37 --> s52: you hold #8592; or #8594;
  s37 --> s98: you open সব ল#2503;ভ#2503;ল
  s37 --> s119: you reach the yard or slip the last time
  s118 --> s29: you press আব#2494;র খ#2503;ল#2507; (or আর#2503;কব#2494;র)
  s140 --> s37: you press চ#2494;ল#2495;য#2492;#2503; য#2494;ও
  s87 --> s84: a quarter second passes
  s107 --> s103: a quarter second passes
  s107 --> s97: you come back to the window (or the tab)
  s107 --> s149: you close the list
  s70 --> s66: a quarter second passes
  s70 --> s34: you come back to the window (or the tab)
  s70 --> s150: the menu opens
  s128 --> s124: a quarter second passes
  s128 --> s118: you come back to the window (or the tab)
  s125 --> s129: you close the list
  s49 --> s42: a quarter second passes
  s49 --> s34: you let go
  s49 --> s140: the menu opens
  s49 --> s70: you click into another window (or hide the tab)
  s49 --> s98: you open সব ল#2503;ভ#2503;ল
  s49 --> s119: you reach the yard or slip the last time
  s98 --> s94: a quarter second passes
  s98 --> s140: you close the list
  s98 --> s108: you click into another window (or hide the tab)
  s119 --> s27: you press আব#2494;র খ#2503;ল#2507; (or আর#2503;কব#2494;র)
  s119 --> s115: a quarter second passes
  s119 --> s129: you click into another window (or hide the tab)
  s150 --> s146: a quarter second passes
  s150 --> s140: you come back to the window (or the tab)
  s70 --> s37: you come back to the window (or the tab)
  s52 --> s45: a quarter second passes
  s52 --> s37: you let go
  s52 --> s140: the menu opens
  s52 --> s70: you click into another window (or hide the tab)
  s52 --> s98: you open সব ল#2503;ভ#2503;ল
  s52 --> s119: you reach the yard or slip the last time
  s119 --> s30: you press আব#2494;র খ#2503;ল#2507; (or আর#2503;কব#2494;র)
  s108 --> s104: a quarter second passes
  s108 --> s98: you come back to the window (or the tab)
  s108 --> s150: you close the list
  s129 --> s125: a quarter second passes
  s129 --> s119: you come back to the window (or the tab)
  s1 --> s26: you pick a level you know (the walk starts)
  s1 --> s76: you pick a level you haven't met (its card shows first)
  s1 --> s29: you pick a level you know (the walk starts)
  s72 --> s26: you tap চল#2507; on the card
  s72 --> s29: you tap চল#2507; on the card
  s89 --> s26: you pick a level you know (the walk starts)
  s89 --> s76: you pick a level you haven't met (its card shows first)
  s89 --> s29: you pick a level you know (the walk starts)
  s110 --> s26: you pick a level you know (the walk starts)
  s110 --> s76: you pick a level you haven't met (its card shows first)
  s110 --> s29: you pick a level you know (the walk starts)
  s80 --> s79: you come back to the window (or the tab)
  class s5 tan
  class s6 tan
  class s9 tan
  class s10 tan
  class s15 tan
  class s16 tan
  class s19 tan
  class s20 tan
  class s26 teal
  class s27 teal
  class s29 teal
  class s30 teal
  class s33 teal
  class s34 teal
  class s36 teal
  class s37 teal
  class s41 teal
  class s42 teal
  class s44 teal
  class s45 teal
  class s48 teal
  class s49 teal
  class s51 teal
  class s52 teal
  class s56 teal
  class s57 teal
  class s59 teal
  class s60 teal
  class s65 teal
  class s66 teal
  class s69 teal
  class s70 teal
  class s76 tan
  class s79 tan
  class s84 tan
  class s87 tan
  class s93 yellow
  class s94 yellow
  class s97 yellow
  class s98 yellow
  class s103 yellow
  class s104 yellow
  class s107 yellow
  class s108 yellow
  class s114 blue
  class s115 blue
  class s118 blue
  class s119 blue
  class s124 blue
  class s125 blue
  class s128 blue
  class s129 blue
  class s135 yellow
  class s136 yellow
  class s139 yellow
  class s140 yellow
  class s145 yellow
  class s146 yellow
  class s149 yellow
  class s150 yellow
```

Replay harness note: `document.hidden` is pinned in Orca, so the hide path is checked in node. rAF is throttled in a background tab, so the replays drove the game's real `step()` through a dev-only `window.__al.step` (the same function the loop calls). Loops were counted by wrapping `AudioBufferSourceNode.start/stop` (`loop = true`). Sound stays muted on the dev server.

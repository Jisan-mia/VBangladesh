---
name: play-test-orca
description: Play-test a একটুখানি game or tool end to end in Orca's built-in browser, the required browser for all verification here. Covers opening a tab, phone emulation, trusted vs synthetic input, screenshots, an autopilot that plays a whole run, live bug replays, and checks to finish with. Use whenever you need to see, play, verify or screenshot a page.
---

# Play-test in Orca

The owner wants every check done in Orca's built-in browser. Load the `orca-cli` skill once (`orca skills get orca-cli --json`, then the `browser` reference) if you haven't. The dev server runs at http://127.0.0.1:3100; don't start or stop it.

## Basics
- **Open your own tab:** `orca tab create --url http://127.0.0.1:3100/<slug> --json` and keep `result.browserPageId`. Pass `--page <id>` on every later command; other agents have tabs too. Close your tab when you're done (`orca tab list --json`, then `orca tab close --index N --json`).
- **Phone layout:** `orca exec --page <id> --command 'set device "Pixel 9"' --json` after the page loads. Navigation resets it. Quote the device name.
- **Read the page:** `orca snapshot --page <id> --json` gives refs like `@e5` for `orca click --element @e5`. Re-snapshot after any change.
- **Run JS:** `orca eval --page <id> --expression "(async()=>{ … return JSON.stringify(x) })()" --json`; the value is `result.result`. Use it for checks: overflow (`document.documentElement.scrollWidth > innerWidth`), element counts, game state you expose, timings.
- **Screenshot:** `orca screenshot --page <id> --json` returns `result.path` (a temp PNG; copy it into `.shots/`). Then Read the image and look at it. Orca repeats the image below its visible pane in phone mode, so trust only the top part. `node scripts/orca-shot.mjs <url> <out.png> [--eval=js]` does it in one step, with console errors.
- **320px and full-page images:** `node scripts/shot.mjs <url> <out.png> 320 640 --full`, headless Chrome with true mobile emulation. Use it only for this; everything else goes in Orca.

## Input
- **Real key presses:** `orca keypress --page <id> --key p --json` sends a trusted key. Some games, like tibo.dog, ignore synthetic `KeyboardEvent`s. Ours listen on `window`, so `window.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowRight', bubbles:true}))` works for holds; send the keyup too.
- **Clicks and taps:** `orca click --element @eN`, or in eval, `el.click()`. For canvas games, dispatch `PointerEvent('pointerdown'|'pointermove'|'pointerup', {clientX, clientY, pointerId:1, isPrimary:true, bubbles:true})` at coordinates from `getBoundingClientRect()`.
- **Away and back:** `window.dispatchEvent(new Event('blur'))` and `'focus'`. For hiding, `Object.defineProperty(document, 'hidden', {value:true, configurable:true}); document.dispatchEvent(new Event('visibilitychange'))`.
- **Sound without hearing:** instrument `AudioBufferSourceNode.prototype.start` and `OscillatorNode.prototype.start` to count starts (`this.loop` marks loops) and prove a sound fired or a loop restarted.

## Play a whole run (autopilot)
Start an in-page autopilot with `setInterval` that reads what's on screen and acts: click the obvious next button (পরের লেভেল, the RECOMMENDED card, শুরু করো), move or tap towards the goal, and log events to `window.__log`. Then sample from outside every 15–30 s: a screenshot plus `window.__log` and the visible text. Play until the result or end screen, and look at every distinct screen: title, tutorial, level, choice, pause, danger, boss, end, card.

## What to judge while you play
Use `game-quality-bar`. Each check needs a yes, or a fix:
- **Start and first win:** is the start action the biggest thing on screen? Can you win within 10 seconds?
- **Choices and HUD:** does every choice pause play and explain itself? Is the middle of the screen clear, with the HUD in the corners?
- **Away and back:** when you leave (blur, hide), does it pause and release input, and come back cleanly?
- **Ending:** does the end screen show real stats? Does the card look right? Does the friend link replay?
- **Sound and speed:** is there sound at the key moments, and does it work on mute? Is it smooth (no long frames) with no console errors?

## Finish
Close your tabs. Save the key screenshots in `.shots/<slug>-*.png` and list them in your report with what each shows. Record any live bug replay (steps and numbers) in `ai_docs/statecharts/<slug>/README.md`.

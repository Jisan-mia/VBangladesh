# lint:games baseline (2026-11-04)

`npm run lint:games` runs `scripts/lint-games.mjs`. It parses `tools/**` and `shared/**` with the TypeScript compiler API. It skips `tests/` folders, `*.test.*` and `*.d.ts`. A full run reads about 1,320 files in about 3 seconds.

The existing violations are in `scripts/lint-games.baseline.json` as counts per file and rule. The run fails only when a file has more violations of a rule than its baseline count. Nothing in the games was fixed for this baseline.

## Rules

| Rule | Severity | Where | What |
|---|---|---|---|
| `hot-alloc` | error | `*.hot.ts` | Inside any function body: an object or array literal, `new`, an arrow or function expression, a nested function, spread, `.map` / `.filter` / `.reduce`, `.forEach` with an inline callback, or a template literal with `${}`. Module scope is fine, so allocate pools there. |
| `audio-outside-kit` | error | everywhere except `shared/game-sound.ts` | `new AudioContext`, `new webkitAudioContext`, or any reference to `webkitAudioContext`. |
| `direct-vibrate` | error | everywhere except `shared/game-sound.ts` | `navigator.vibrate`. Use `buzz`. |
| `sim-nondeterminism` | error | `tools/*/lib/**` | `Math.random` or a `Date.now()` call. This doesn't apply to files whose name contains `link`, `share` or `seed`. Use `makeRng(seed)`, and pass time in as `dt`. |
| `nukta-in-regex-class` | error | everywhere | ড় ঢ় য় inside `[...]` in a regex literal or a `RegExp("…")` string. In NFC each one is two code points (base + U+09BC), so the class matches the wrong characters and ranges break. Use `(?:ড়|ঢ়|য়)` or `\u` escapes. |
| `kids-network` | error | tools in the catalog category `ছোটদের জন্য` | `fetch(` (bare or on `window`/`globalThis`/`self`), an import of `share-client`, `ShareBar`, or a string that contains `/api/`. |
| `uncleared-timer` | warning | `tools/*/components/**` | `setTimeout` / `setInterval` whose return value is thrown away (an expression statement, `void`, or an arrow passed to another call). Some of these are fine, so the rule only warns. |

The kids' category comes from `lib/catalog.ts`. `content.ts` has no category field, but the linter also reads one if a tool adds it.

To allow one line, put `// lint-games-allow: <reason>` on the line above it. The reason is required.

## Why these severities

Every rule except `uncleared-timer` is an error. The baseline means this doesn't break today's build:

- The repo already has 0 violations of `hot-alloc` (no `*.hot.ts` files yet), `audio-outside-kit`, `direct-vibrate`, `nukta-in-regex-class` and `kids-network`. Any new one is a real regression.
- The 26 `sim-nondeterminism` hits are in the baseline, so a rewrite can remove them one file at a time. A new `Math.random` in `lib/` fails the run.
- `uncleared-timer` stays a warning. Many of the 62 hits are one-shot UI delays, such as a scroll or a sound 300 ms after a click, and these are harmless. Review each one when you rewrite the component. A timer that changes game state after unmount, pause or restart is a bug.

## Totals

| Rule | Violations | Files | Tools |
|---|---|---|---|
| `sim-nondeterminism` | 26 | 12 | 12 |
| `uncleared-timer` (warning) | 62 | 37 | 37 |
| all other rules | 0 | 0 | 0 |
| **total** | **88** | | **46** |

## Per tool

| Tool | `sim-nondeterminism` | `uncleared-timer` | Total |
|---|---|---|---|
| kalbaishakhi-aam | 9 | 2 | 11 |
| kagojer-urojahaj | 7 | | 7 |
| chhip-felo | | 5 | 5 |
| churir-bazar | | 4 | 4 |
| jhalmuri-sap | | 4 | 4 |
| sudoku | 1 | 3 | 4 |
| chhobir-tukro | | 3 | 3 |
| dudh-uthlano | | 3 | 3 |
| ami-bolechhilam | | 2 | 2 |
| carrom | | 2 | 2 |
| handi-bhanga | | 2 | 2 |
| marble-sinri | | 2 | 2 |
| namta | 1 | 1 | 2 |
| nodi-par | | 2 | 2 |
| shesh-bol | | 2 | 2 |
| tarer-fanke-belun | | 2 | 2 |
| vo-katta | | 2 | 2 |
| adda | | 1 | 1 |
| argentina-na-brazil | 1 | | 1 |
| bangla-typing | | 1 | 1 |
| bhangti-nai | | 1 | 1 |
| bhorta | | 1 | 1 |
| biye-kobe | | 1 | 1 |
| chhok-jora | | 1 | 1 |
| current-gelo | 1 | | 1 |
| daripalla | 1 | | 1 |
| deri-hoye-gelo | | 1 | 1 |
| dosh-ghater-nouka | | 1 | 1 |
| ganer-koli | 1 | | 1 |
| ghuri | | 1 | 1 |
| golokdhadha | 1 | | 1 |
| grade-dao | | 1 | 1 |
| gune-dekhi | 1 | | 1 |
| hat-dhui | | 1 | 1 |
| jibh | | 1 | 1 |
| juktoborno | | 1 | 1 |
| koto-cheno | | 1 | 1 |
| matir-bank | | 1 | 1 |
| moner-boyos | | 1 | 1 |
| paka-kancha | | 1 | 1 |
| pati-buni | | 1 | 1 |
| roshi-tana | | 1 | 1 |
| salami-chek | | 1 | 1 |
| shoman-bhag | 1 | | 1 |
| sir-ghurlei-thamo | | 1 | 1 |
| ulto-khela | 1 | | 1 |

The `sim-nondeterminism` files are:
- `kalbaishakhi-aam/lib/draw-scene.ts` (9)
- `kagojer-urojahaj/lib/scene.ts` (7)
- `argentina-na-brazil/lib/fan.ts`
- `current-gelo/lib/gelo.ts` (`Date.now`)
- `daripalla/lib/game.ts`
- `ganer-koli/lib/game.ts`
- `golokdhadha/lib/levels.ts` (`Date.now`)
- `gune-dekhi/lib/game.ts`
- `namta/lib/namta.ts`
- `shoman-bhag/lib/game.ts`
- `sudoku/lib/game.ts` (`Date.now`)
- `ulto-khela/lib/game.ts`

The two scene files are cosmetic, such as rain and sparkle positions. They can move the noise to a seeded `makeRng` or out of `lib/`.

## For rewrite agents

1. Run `npm run lint:games` before you report. It must print `0 new errors`. Run `npm run lint:games -- --all` to see the baselined hits in your tool, too.
2. When you remove baselined violations, run `npm run lint:games -- --prune-baseline`. It only lowers counts, so the debt can't come back. Commit the smaller baseline with your change.
3. Never run `--write-baseline` to make a new violation pass. Fix the code, or add a `// lint-games-allow: <reason>` line that a reviewer can read.
4. Put per-frame code in `lib/*.hot.ts`. The `hot-alloc` rule then applies to it automatically.
5. When you find a new bug class, add a rule to `scripts/lint-games.mjs` and a fixture to `shared/tests/lint-games.test.ts`.

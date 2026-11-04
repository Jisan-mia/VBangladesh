# Statechart analysis prompt (orchestration template)

Fill `{SLUGS}`, then send one agent per group (model: opus). Many run at once.

---

You are a formal-methods engineer and game QA lead for "একটুখানি" (repo /Users/jisanmia/Developer/VBangladesh, Next.js 16, React 19, TypeScript, branch `games-to-the-bar`). A dev server runs at http://127.0.0.1:3100; don't start or stop it.

The owner wants every game rebuilt to the bar of tibo.dog, a browser game whose author used TLA+ on every state machine and found real bugs that play-testing missed. Your job comes **before** the rewrite: model each of your games as it is today, find its bugs, prove each one live, and write it all down so the rewrite agent can fix them.

## Your games
{SLUGS}

## Read first
1. `.claude/skills/game-statechart/SKILL.md`: the method, the rule library and where files go. Follow it.
2. `ai_docs/statecharts/antenna-thik-koro/`: a worked example with spec, config and view; the `before-fix/` report found 2 real bugs.
3. `.claude/skills/play-test-orca/SKILL.md`: how to replay bugs in the Orca browser (required; no other browser).
4. Each game's code: `tools/<slug>/components/*.tsx` and `tools/<slug>/lib/*.ts`. Read the handlers and effects carefully: phases, pause, visibility, blur, keyboard and pointer, timers, sound loops, levels and storage, links. Kids' tools also use `shared/kids-kit.tsx` (session, rest screen, parent gate).

## Do, for each game
1. Write `ai_docs/statecharts/<slug>/<Name>.tla`, `.cfg` and `view.ts`, mirroring the real code: one action per handler or effect, with the file cited at the top. Include every relevant system from the skill's list and every relevant rule from its rule library, plus rules specific to the game.
2. Run `scripts/statechart.sh ai_docs/statecharts/<slug>/<Name>.tla --view ai_docs/statecharts/<slug>/view.ts --out ai_docs/statecharts/<slug>/before-fix`. Delete `before-fix/tlc.out` afterwards, since it's noisy. Keep states small (under 500) so a chart is drawn.
3. For every broken rule, replay the path live in Orca, in your own tab, step by step, and record the observed numbers. If it doesn't reproduce, fix the model, since the model is wrong until proven otherwise.
4. Play each game once end to end in Orca, judging it against `.claude/skills/game-quality-bar/SKILL.md`. Note the 5–10 biggest gaps against the bar: first screen, choices, HUD, pause, danger, ending, sound, level design and pacing.
5. Write `ai_docs/statecharts/<slug>/README.md` with:
   - the systems modelled;
   - each rule in plain words;
   - the bugs (rule, the player's sentence, the path, the live replay with numbers, the suggested fix, and whether it's game-specific or shared);
   - the quality-bar gaps;
   - the regenerate command.

## Scope
Write ONLY inside `ai_docs/statecharts/<your slugs>/` and `.shots/`. **Do not change any code.** The rewrite agents fix things later from your README. Never `git add` or commit. Close your Orca tabs when done.

## Report back (≤200 words)
One block per game:
- `rules:` N held, M broke;
- `bugs:` one line each (the player's sentence), plus "shared" or "game";
- `top gaps:` 3 short items;
- `chart:` the path to `before-fix/chart.mmd`.

End with `shared fixes:` listing bugs that repeat across your games.

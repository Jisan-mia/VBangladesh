# ai_docs

The central home for AI working docs in this repo: models, charts, prompts and learnings. Product research from earlier phases stays in `research/`.

| Folder | What's in it |
|---|---|
| `statecharts/<slug>/` | Per game: the TLA+ spec, config and view; `before-fix/` and `after-fix/` reports and Mermaid charts; a README listing the systems, rules, bugs found, live replays and fixes. Made with `scripts/statechart.sh`. |
| `game-dev/` | Learnings and plans: the tibo.dog playthrough, the platform and player design, the rewrite tracker. |
| `prompts/` | The prompts the orchestrator gives subagents. |
| `reference/tibo-dog/` | Screenshots and the author's statecharts from the reference game. |

Repo skills in `.claude/skills/` turn these learnings into rules: `game-quality-bar`, `game-statechart`, `play-test-orca`, `game-engineering`.

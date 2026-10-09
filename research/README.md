# VBangladesh research report

Research snapshot: 9 October 2026, Asia/Dhaka.

Open `index.html` in a browser. The report works without a build, network connection, account, database, or package install. Linked sources need internet access.

For a local HTTP preview, run from the VBangladesh folder:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory .
```

Then open http://127.0.0.1:4173/research/.
Choose another port if 4173 is already in use. Serve the workspace root to make the adjacent project-brief links available.

## Files

- `index.html`: report, static evidence, source links, chart and concept demo.
- `styles.css`: responsive layout and print styles.
- `model.js`: comparison score and postcard content functions.
- `report.js`: filters, chart controls, local PNG export and print behavior.
- `evidence.json`: source ledger, project briefs and captured trend data.
- `trends-12-months.csv`: transcription of the rendered Google Trends chart table. This is not an official CSV export.
- `report.test.cjs`: focused model and data checks.

Run the checks:

```sh
node --test research/report.test.cjs
node --check research/report.js
```

The memory demo sends no inputs to a server and has no persistent storage. Export includes the optional name that the user enters. Comparison scores are product judgments, not measured viral probabilities. No background research monitor is active. The three original briefs now live under `../tools/amar-chhotobela/`, `../tools/bazar-note/`, and `../tools/ek-ghonta/`. All twenty tools are implemented in the central Next.js app. See `interactive-expansion/index.html` for the seven-tool expansion and its evidence limits.

The report contains 38 linked sources and selected historical observations from 2024–2026. All 53 weekly Trends rows were verified against the rendered Chrome table on 9 October. Seven-day and 90-day Explore exports remain unchecked. The CSV is our transcription. No direct Facebook corpus was collected.

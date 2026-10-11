# Copy-review agent prompt (orchestration template)

Fill `{BATCH}` (a short name) and `{SLUGS}` (the tools to review), then send one agent per batch (model: opus, effort: high). Up to 5 run at once.

---

You are a native Bangladeshi Bangla writer with a product designer's eye, doing the final copy review for "একটুখানি": free, no-signup, Bangla-only small tools that ordinary Bangladeshis open from Facebook on cheap Android phones. Repo: /Users/jisanmia/Developer/VBangladesh (Next.js 16, React 19, TypeScript; branch `bangla-ux-revamp`). A dev server runs at http://127.0.0.1:3100 (don't start or stop it).

The owner says some of the Bangla still reads robotic, like a translation or a manual. Your job: make every word in your tools sound like real Bangladeshi people talking. It should be warm, specific and emotionally true, with no exaggeration.

## Your batch: {BATCH}
Tools: {SLUGS}

## Read first
1. `research/bangla-copy-review.md`: the bar, the robotic patterns we found, and what must not change. Follow it exactly.
2. `research/bangla-voice-guide.md`: the base rules (তুমি, spoken চলিত, Bangladeshi words).
3. For each tool, read all of its copy: `content.ts`, every component's visible strings and aria-labels, `lib/*` human lines, captions, card text and preview text, and `share.ts`.

## Do
- Rewrite what reads robotic, long, repetitive, translated or bookish. Leave lines that already sound right; don't churn for its own sake.
- Make each tool sound like its own world (the tea stall, the slam book, the mess), not like a template.
- Keep every fact, number, date, source, safety line, id, link key and append-only order exactly as it is. Keep privacy promises accurate.
- Keep SEO intact: title (change only if it reads badly), description 120–160 chars, unique H1, FAQ ≥ 5 entries in the words people search.

## Scope
ONLY `tools/<slug>/**` and `app/<slug>/page.tsx` for your tools. Do not edit shared/, lib/, components/, other tools, public/ or package files; other reviewers are working right now. Never `git add`, `git rm` or commit. Don't run text-normalization scripts.

## Verify (required)
- `node --import tsx --no-warnings --test tools/<slug>/tests/*.test.ts` for each tool. Update tests that only pin wording; never weaken logic tests.
- `npx tsc --noEmit` (fix errors in your files; ignore other people's in-progress errors).
- For each tool, screenshot the first screen and, where card text changed, the card, and LOOK at it: `node scripts/shot.mjs "http://127.0.0.1:3100/<slug>" .shots/<slug>-copy.png 390 844` (options `--full`, `--wait=ms`, `--eval="js"`). Check that nothing overflows at 320px wide.
- `npm run check:pages` at the end (unique titles, descriptions and H1s). Ignore failures from other batches' tools.

## Report back (SHORT, ≤220 words)
- One line per tool: what kind of change (e.g. "steps cut from 4 long to 3 short; human lines rewritten; privacy simplified"), plus one before → after example for the whole batch.
- `tests:` N passed · `tsc:` clean for my files · `check:pages:` result
- `notes:` anything you couldn't fix inside your scope (e.g. a catalog line or shared string that still reads robotic), and any copy you were unsure about.

# Feature-agent prompt (orchestration template)

Fill `{SLUG}`, `{NAME}`, `{FEATURES}` (IDs plus the one-line asks from build-queue.md §4/§6), and send one agent per target tool (model: opus, effort: high). Up to 5 run at once.

---

You are a senior product designer + front-end engineer building for Bangladesh. Repo: /Users/jisanmia/Developer/VBangladesh (Next.js 16, React 19, TypeScript; branch `bangla-ux-revamp`). It's "একটুখানি": free, no-signup, Bangla-only small interactive tools for ordinary Bangladeshis on cheap Android phones (mostly from Facebook) and the diaspora. A dev server runs at http://127.0.0.1:3100 (don't start/stop servers). AGENTS.md: this Next.js version may differ from your training data; check node_modules/next/dist/docs/ before unfamiliar APIs.

## Your job: add features to the live tool `{SLUG}` — {NAME}
Add: {FEATURES}

The ideas and evidence are in research/build-queue.md §4 (and research/new-tools-2026-10.md / research/ideas-*.md by ID). The tool already ships; read all of `tools/{SLUG}/` first and extend it in its own style, material and voice. The feature must feel like it was always part of the tool: simple, joyful, one obvious action, never cluttering the first screen.

## Read first
- `research/tool-design-brief.md` (the 12 rules) and `research/bangla-voice-guide.md` (natural তুমি Bangla).
- Shared code to reuse: `shared/card-canvas.ts`, `shared/share-kit.tsx`, `shared/share-client.ts`, `shared/share-types.ts`, `shared/bangla.ts`.

## Rules
- **Scope:** ONLY `tools/{SLUG}/**` and `app/{SLUG}/page.tsx`. Do not edit shared/, lib/, components/, other tools, public/ or package files. Other agents are working right now. Never `git add`, `git rm` or commit. If you need a shared/API change, describe it in your report instead.
- **Old links keep working:** every link shared before your change must still open the same card. Extend the hash format only by adding optional keys or appending ids; add a test with a pre-change link. Packs/sets/lists are append-only (never reorder or remove ids).
- **Card + share:** if the feature produces something worth sharing, it gets its own card variant (feed + story via card-canvas) and a personal preview line via `share.ts`; tallies only over fixed ids, opt-in, never free text, names or amounts.
- **Data:** facts (dates, rules, spellings) correct and sourced in a code comment, with visible "সূত্র/যাচাই" where people rely on them. No religious rulings, medical, legal or investment advice. Moon-based dates are "সম্ভাব্য".
- **content.ts:** keep the title and H1 unless the feature truly changes the tool's main promise. Add FAQ entries and steps for the feature, update the privacy text if the link carries anything new, and keep the description 120–160 chars.
- **Regex:** never put ড় ঢ় য় (nukta letters) literally inside a character-class range; the repo is NFC-normalized. Use `ড়-য়` escapes.
- **CSS:** scoped under the tool's existing class, mobile-first, touch targets ≥44px, `aria-pressed` toggles, labels, `prefers-reduced-motion`, no sideways scroll at 320px.

## Verify (required)
- `node --import tsx --no-warnings --test tools/{SLUG}/tests/*.test.ts` and `npx tsc --noEmit` (fix errors in your files; ignore other tools').
- Screenshots, then LOOK (Read the PNG) and iterate: `node scripts/shot.mjs "http://127.0.0.1:3100/{SLUG}" .shots/{SLUG}-f1.png 390 844` (options `--full`, `--wait=ms`, `--eval="js"`; at 320 wide add an overflow check). Shoot the default screen (must look as good as before) and the new feature's card.
- If the share state changed: curl POST `/api/share`, then GET `/s/<id>` with `-A facebookexternalhit/1.1` and confirm the og:title. Also open one pre-change link.
- Don't use browser MCP tools, don't run text-normalization scripts, don't commit.

## Report back (SHORT, ≤180 words, exactly these lines)
- `added:` one line per feature ID
- `catalog:` new description (≤90 chars) | action (2–3 words), or "unchanged"
- `tests:` N passed · `tsc:` clean for my files
- `old links:` how you checked they still open
- `shots:` default + feature card paths
- `notes:` judgement calls, sources, shared/API changes wanted

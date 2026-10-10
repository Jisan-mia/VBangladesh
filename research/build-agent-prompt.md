# Build-agent prompt (orchestration template)

Fill `{SLUG}`, `{NAME}`, `{BRIEF}` (where the brief lives) and send one agent per tool (model: opus, effort: high). Up to 5 run at once.

---

You are a senior product designer + front-end engineer building for Bangladesh. Repo: /Users/jisanmia/Developer/VBangladesh (Next.js 16, React 19, TypeScript; branch `bangla-ux-revamp`). It's "একটুখানি": free, no-signup, Bangla-only small interactive tools for ordinary Bangladeshis on cheap Android phones (mostly from Facebook) and the Bangla-speaking diaspora. A dev server runs at http://127.0.0.1:3100 (don't start/stop servers). AGENTS.md: this Next.js version may differ from your training data; check node_modules/next/dist/docs/ before unfamiliar APIs.

## Your tool: `{SLUG}` — {NAME}
Build it end to end, from the brief at {BRIEF} (in research/build-queue.md or research/new-tools-2026-10.md §7; the evidence is in research/ideas-*.md). The tool is already registered with a placeholder: `tools/{SLUG}/content.ts`, `page.tsx`, `share.ts` and `app/{SLUG}/page.tsx`. Replace the placeholders with the real tool.

The owner's bar: every tool must feel curated with care, emotion and interactivity, like the flagship "আমার ছোটবেলা". It must be instantly understandable (one obvious action, no confusion), simple, joyful, and very Bangladeshi. Make its look genuinely distinct from other tools (its own material metaphor from Bangladeshi life).

## Read first
- `research/tool-design-brief.md`: THE standard (12 rules + shared building blocks). Follow it exactly.
- The reference implementation `tools/amar-chhotobela/`, plus one other finished tool close to yours (e.g. `tools/shubhechha/`, `tools/shobdo-khela/`, `tools/bazar-note/`).
- Shared code you must reuse: `shared/card-canvas.ts`, `shared/share-kit.tsx` + `share-kit.css`, `shared/share-client.ts`, `shared/share-types.ts`, `shared/bangla.ts` (possessive), `shared/site-shell.tsx`, `shared/studio-page.tsx`.
- `research/bangla-voice-guide.md` (natural তুমি Bangla; buttons "শেয়ার করো", "ছবি ডাউনলোড করো", "লিংক কপি করো") and `research/trends-2026-10.md`.

## Scope: ONLY these paths
`tools/{SLUG}/**` and `app/{SLUG}/page.tsx`. Do NOT edit shared/, lib/, components/, other app/ files, public/, package files or other tools. Other agents are building other tools right now. Delete files normally; never `git rm` or `git add`. If you need a shared or API change, don't make it; describe it in your report.

## Must have
- **Instant start:** the tool on the first 390×844 screen, starting from a good default; no dead empty state.
- **The card:** a result card on `<canvas>` via shared/card-canvas (feed 1080×1350 + story 1080×1920 with `FormatToggle`; story text clear of `storySafe`), a human line chosen from the person's input, and `drawFooterBand(context, format, "<inviting question>", site)`.
- **One next action:** `StickyNext` until the result is in view, then `ShareBar`.
- **Link state:** pure encode/decode in `lib/` with tests (round-trip, hostile input, caps, NFC). `share.ts` implements ToolShare (normalize + personal preview title; `tally` only over fixed ids, never free text, names or photos). Opening a shared link shows it with a "your turn" banner.
- **Data:** any factual data (dates, scores, history, spellings, rules) must be correct, with source URLs in a code comment, and visible "সূত্র/যাচাই" text where people rely on it. No religious rulings, no medical, legal or investment advice. Festival dates that depend on the moon are labelled "সম্ভাব্য".
- **content.ts:** title ≤45 chars keyword-first, description 120–160 chars, unique human H1, ≥5 FAQ written the way people search, steps, and privacy text that says plainly what a shared link carries. Keep `id="tool"`, `<Faq>` and `<JsonLd>` (or use StudioPage with `headline`).
- **CSS:** mobile-first and scoped under `.tool-{SLUG}`, with tool tokens `--accent` and `--accent-deep`. Headings use `var(--font-display)`. Touch targets ≥44px, `aria-pressed` toggles, labels, `prefers-reduced-motion`, and no sideways scroll at 320px.

## Verify (required)
- `node --import tsx --no-warnings --test tools/{SLUG}/tests/*.test.ts` and `npx tsc --noEmit`. Fix errors in your files; ignore other tools' in-progress errors.
- Screenshot and LOOK (use the Read tool on the PNG), then iterate until it's genuinely good:
  `node scripts/shot.mjs "http://127.0.0.1:3100/{SLUG}" .shots/{SLUG}-1.png 390 844`
  Options: `--full`, `--wait=ms`, `--eval="js"` (runs before the shot: click, type, scroll; at width 320 add `if (document.documentElement.scrollWidth > innerWidth) throw new Error('overflow')`). You can also pass your #hash state in the URL. If the dev server shows another tool's compile error, wait a minute and retry.
- Run curl POST `/api/share` with your state, then GET `/s/<id>` with `-A facebookexternalhit/1.1` and confirm the personal og:title.
- Don't use browser MCP tools, don't run text-normalization scripts, don't commit.

## Report back (SHORT, ≤200 words, exactly these lines)
- `concept:` one line
- `catalog:` description (≤90 chars, natural তুমি Bangla) | action (2–3 words)
- `og:` "<title, with | before the highlighted part>" | "<subtitle>" | <bg hex> | <ink hex> | <accent hex> | <hash state for a nice filled card, or empty> | <JS that makes the card canvas appear if it needs a tap first, e.g. clicking a choice, or empty>
- `title/H1:` …
- `tests:` N passed · `tsc:` clean for my files
- `shots:` default + finished card paths
- `notes:` judgement calls, data sources, shared/API changes wanted

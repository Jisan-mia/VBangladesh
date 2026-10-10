# একটুখানি — প্রতিটা টুলের এন্ড-টু-এন্ড মান (the "আমার ছোটবেলা" standard)

The flagship (`tools/amar-chhotobela`) is the reference implementation. Read its `page.tsx`, `content.ts`, `share.ts`, `lib/postcard.ts`, `lib/draw-postcard.ts`, `components/postcard-builder.tsx`, `product.css` before building. Every tool should feel like it was made by the same caring team, but each has its **own concept** — the khata belongs to আমার ছোটবেলা only.

## The 12 rules

1. **One concept from Bangladeshi life.** A real object or ritual people grew up with drives the visuals, the copy and the share card (khata → rickshaw back-board, clay courtyard, recipe notebook, bazar ফর্দ, MRT ticket…). Decide it first; everything follows.
2. **Instant start.** Compact hero (kicker + H1 + one line). On a 390×844 phone, the tool must start on the first screen. No account, no reading required.
3. **Never a dead empty state.** Start from a good default/sample the person modifies. Tap-first; typing only where it is the point (a name, a recipe).
4. **The result is a card worth posting.** Draw it on `<canvas>` with `shared/card-canvas.ts` (`fitText`, `wrapText`, `drawPhoto`, `drawFooterBand`, `renderCard`, `cardSizes`). Offer feed 1080×1350 and story 1080×1920 (`FormatToggle`); keep story text out of `storySafe`. End with `drawFooterBand(context, format, "<a question that invites a reply>", site)` so a screenshot still leads back. Add name/photo (`PhotoPicker`) where the card is personal.
5. **A human line on every result**, chosen from the person's input (like `memoryLine`). Warm, specific, never cheesy.
6. **One next action.** `StickyNext` pinned until the result is in view; at the result, `ShareBar` (share image+caption+link / download / copy link — Facebook in-app fallback is built in). Caption = what a real person would write on Facebook.
7. **Links reopen the exact card.** Encode the card state in the URL hash (pure functions in `lib/`, with tests: round-trip, hostile input, length caps, NFC). Implement `tools/<slug>/share.ts` (`normalize`, `preview`, optional `tally`) so `/api/share` creates `/s/<id>` with a personal preview title ("রাফির …"). When a page opens with a shared state, show it with a "your turn" banner (see `khata-friend`).
8. **Optional backend, opt-in only.** `addToTally/readTally` only for fixed, countable picks (never free text, names or photos), shown with a minimum sample. `SuggestBox` where people might want something added.
9. **Natural তুমি Bangla** per `research/bangla-voice-guide.md`. Buttons: "শেয়ার করো", "ছবি ডাউনলোড করো", "লিংক কপি করো".
10. **Mobile-first, accessible CSS** scoped under `.tool-<slug>`; tool tokens (`--accent`, `--accent-deep`) so the kit buttons take your colour; headings in `var(--font-display)` (Baloo Da 2); no sideways scroll at 320px; touch targets ≥ 44px; `aria-pressed` toggles; labels; `prefers-reduced-motion`. Avoid generic AI looks (purple gradients, emoji icons, cream+serif+sage).
11. **SEO** in `content.ts`: `title` keyword-first ≤ 45 chars (real Bangla queries from `research/trends-2026-10.md` §8), `description` 120–160 chars, unique human H1, ≥ 5 FAQ written the way people search, `steps`, `privacy` (plain, and mention what a shared link carries). Keep `id="tool"` on the tool section and render `<Faq>` + `<JsonLd>` (or use `StudioPage`).
12. **Honest.** Never claim what the tool doesn't do. Never change real data (metro fares, their source and dates). Festival content is inclusive and opt-in; no politics, no religious debate.

## Shared building blocks (don't rebuild these)

- `shared/card-canvas.ts` — canvas text/photo/footer helpers, `loadPhoto`, `renderCard`.
- `shared/share-kit.tsx` + `shared/share-kit.css` — `ShareBar`, `FormatToggle`, `PhotoPicker`, `StickyNext`, `useInView`, `SuggestBox`; classes `kit-primary`, `kit-secondary`, `kit-link`, `kit-chips`, `kit-card`, `kit-status`.
- `shared/share-client.ts` — `shareLink`, `readTally`, `addToTally`, `sendSuggestion`.
- `shared/share-types.ts` — `ToolShare`.
- `shared/art-export.ts` — `svgPngBlob` if the tool's art is already an SVG (you can draw that SVG into the card canvas).

# Twenty-tool expansion — verification

Checked 9 October 2026. The local production preview runs at http://127.0.0.1:3100/.

## Shipped scope

Seven additions: রিকশার রং, নকশার খাতা, কথার পোস্টার, ছবি জোড়া, শব্দ সাজাই, সপ্তাহের ছক and ভাগাভাগি. The shared directory now contains twenty tools. Each new tool has Bengali content, its own route, guide, privacy page, metadata, visible FAQ and matching JSON-LD.

Existing visual editors gained undo/redo and meaningful direct manipulation. Alpana supports bounded, mirrored freehand strokes; Chhotto Para supports captured object dragging; Sobuj Kon supports moving/swapping pots. Scene, garden and routine gestures commit once, ignore extra pointers and cancel without losing the previous document. Form/keyboard alternatives remain available.

## Results

- `npm run typecheck`: passed.
- `npm test`: 167 tests passed, none failed or skipped.
- `npm run build`: passed after the final Bengali photo-picker change.
- `npm run check:pages`: 63 pages and 70 assets passed; Bengali unique titles/descriptions/H1s, internal links, FAQ/schema agreement, local noindex/robots and unknown-route 404s checked. Public-origin sitemap/canonical behavior is covered by unit tests.
- All twenty tools: same-document navigation, tool CTA and overflow checks at 320px and 1280px; guide/privacy navigation at 320px. Final comprehensive browser run had no runtime/console or HTTP errors.
- Eleven PNG downloads and five one-page A4 print layouts passed after all tool styles were loaded through client navigation.
- Home filters and twenty cards checked at 320/360/768/1440px; fresh real-output thumbnails and social image generated.
- Four new visual editors: colour/motif editing, continuous grid strokes, touch cancellation, one-step undo, keyboard movement, poster text bounds, local photo import, duplicate/swap, crop/zoom and invalid-file rejection passed.
- Six existing creative editors: seventeen targeted checks cover touch, mouse, cancellation, keyboard, history, mirrored SVG exports and printing.
- Word game: solve/retry/reveal/skip, score separation, keyboard isolation, clipboard and text download passed.
- Weekly routine: day/part editing, drag and button swaps, extra-pointer protection, cancellation, undo, PNG and A4 print passed.
- Expense splitting: Bengali decimals, exact poisha allocation, zero-sum balances, payer-removal protection, edits, undo/redo, clipboard and UTF-8 download passed at 320px and 1280px.
- Standalone research report: seven cards, source links and responsive layout checked. Older report's relocated brief links corrected; its nine tests passed.

## Export regression found and fixed

SVG `Image.decode()` could resolve before embedded Bengali fonts painted. The exporter now waits for `Image.onload` and rejects `onerror`. No arbitrary delay is used. Twelve fresh Chrome trials with CPU throttling showed the routine title in every output. `scripts/check-art-exports.mjs` checks pixels in each label's mapped bounds against an otherwise identical image without text. Twelve exports across ten SVG tools passed, including repeated cold routine exports. Memory's native-canvas PNG was checked separately.

Run the optional pixel regression with an available Playwright installation and browser:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
CHROME_PATH=/absolute/path/to/chrome \
node scripts/check-art-exports.mjs
```

The browser tests do not add a production dependency. Diagnostic images in `new-logic/` retain the before/after font investigation; `routine.png` is the corrected final output.

## Evidence

- `navigation/results.json`: final comprehensive navigation/export/print results.
- `new-editors/results.json` and `new-editors/final-picker.json`: direct manipulation and final Bengali file picker.
- `culture-opportunities/`: existing editor touch/history/print checks.
- `new-logic/results.json`: routine and word game checks.
- `bhagabhagi/result.json`: expense validation and report checks.
- `export-regression/results.json`: label-by-label export pixel counts.
- `../../research/interactive-expansion/index.html`: Bengali research summary and actual initial feature scope.
- `../../research/interactive-expansion/evidence.json`: fourteen primary sources, evidence quality, licensing and limits.

## Practical limits

Only installed desktop Chrome and emulated mobile/touch were verified. An available WebKit binary could not create a page because of a protocol mismatch; Safari, Firefox and physical phones remain unverified. Native sharing depends on the device/browser and was not sent to any external recipient. Printed sheets were checked as PDFs, not with a physical printer.

No public deployment or representative audience pilot was performed. No new representative Facebook corpus or Google Trends measurement was obtained for this expansion. Cultural relevance, competitor presence and global store download counts do not establish Bangladesh demand or viral potential. Twelve fixed word puzzles are included; there is no daily content service. New tools do not persist work across reloads. Set the real HTTPS `SITE_URL` and rebuild before publishing; local previews intentionally remain unindexed.

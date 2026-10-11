# একটুখানি: mobile UX audit (2026-10-11)

Scope: homepage, `/tools`, the shared tool shell (10 tools reviewed by hand, all 86 swept by script), share landing, 404, about, privacy, performance and accessibility basics. Viewed at 390x844 and 320x640 as a first-time visitor from a Facebook link on a cheap 5-inch Android phone. Report only; no files were changed.

Screenshots are in `.shots/ux-*.png` (git-ignored, local to this machine).

## How this was measured, and caveats

- Tool pages were screenshotted for amar-chhotobela, komon-porlo, eta-na-ota, jomi, bidyut-bill, shubhechha, argentina-na-brazil, dhadha, bhagabhagi, mondop (plus alpana, deshe-fera, dhoyahin). Friend banners were opened through real `/s/<id>` links created with `POST /api/share`.
- A script (not committed) loaded all 86 tool pages at 390x844 and recorded layout numbers. Numbers below marked "sweep" come from that.
- Page weight numbers come from the dev server and from the older production build in `.next/static` (built 2026-10-11 07:08). Treat them as close, not exact.
- **Environment gotcha (finding 20):** the running dev server (`dev:phone`, bound to 0.0.0.0) never hydrates React on `http://127.0.0.1:3100`, so every button and chip is dead there. On `http://localhost:3100` it works. I did all interactive checks on `localhost`.
- Not verified: behaviour inside a real Facebook or Messenger in-app browser, real 3G timings, TalkBack. Items that depend on these are marked "verify on device".

## Key numbers

| What | Number |
|---|---|
| Homepage height at 390px | 8,903px = 10.5 screens, 40 cards in one column |
| `/tools` height | 14,286px = 16.9 screens, 86 cards of 151px |
| `/tools` first card starts at | y=610 of 844 (chips take 5 rows) |
| Tool page height (sweep) | median 4,930px (5.8 screens); the tool itself is the first 1 to 2 |
| Tool first control position (sweep) | median y=390; h1 bottom median y=205; hero text median 110 characters |
| Tools whose first control is below y=600 | 13 of 86 (deshe-fera 740, dhoyahin 737, iftar-plate 735, alpana 726, raat-jaga 696 ...) |
| Sticky "next" bar already visible on load, before any tap | 41 of 86 tools |
| FAQ items per tool | median 8, max 14 (shubhechha) |
| Related tools start at | median 82% down the page |
| HTML per page | mean 94KB raw / 15KB gzip across 86 tools. Outliers (gzip): mache-bhate 55KB, iftar-plate 41KB, pitha 35KB, alpana 28KB (373KB raw). Home 226KB raw / 32KB gzip (122KB of that is the React flight copy), `/tools` 230KB / 29KB |
| JS | Shared runtime about 133KB gzip, plus per-tool chunk median 9.4KB, max 20KB (starter-pack). Lean. |
| Fonts | `bangla.woff2` 107KB + `display-bangla.woff2` 90KB, both preloaded on every page = about 198KB, more than the JS |
| Preview thumbnails | 86 webp, 540x675, 3.1MB total (avg 36KB, max 87KB); served at 256w by `/_next/image` about 17KB each; lazy. `sharp` is installed. |
| Social images | 87 PNG, 1200x630, median 170KB, max 364KB (fine for Facebook) |
| Accessibility scan (8 pages) | 0 unlabeled inputs, 0 unnamed controls, no horizontal overflow at 320px, 1 marginal contrast (4.45:1 link on jomi) |

## Quick wins (S effort, high impact)

Do these first: findings 1, 2, 5, 6, 10, 11, 13, 14, 15, 18. Finding 12's preload change is also S.

## Top 20 findings, ranked by impact

### 1. The friend-link landing (`/s/<id>`) waits for React before it moves on  (S)

- **What:** `app/s/[id]/open-shared.tsx` redirects inside `useEffect`, so a friend who taps a shared link must download and run the full React/Next runtime (about 133KB gzip), CSS, and the two preloaded Bangla fonts (about 198KB) before being sent to the tool, which then loads again from scratch. The HTML itself is only 5KB gzip. See `.shots/ux-s-landing-early.png` (on localhost it is instant; on 3G it will not be).
- **Why it matters:** this is the first thing every invited friend sees, and it is the viral loop. On a cheap phone it adds several seconds of a page that looks finished but does nothing. Inferred from the code and sizes; verify on a throttled connection.
- **Simplest fix:** put the redirect in the server HTML as a tiny inline `<script>location.replace(href)</script>` plus the existing "খুলে দেখো" link as the no-script fallback. Crawlers keep reading the og tags. Keep `replace` (it already makes Back go to Facebook, which is right).
- **Files:** `app/s/[id]/page.tsx`, `app/s/[id]/open-shared.tsx` (delete).

### 2. The sticky "next" bar covers the tool before the visitor has done anything  (S)

- **What:** `StickyNext` is `data-show=true` on load for 41 of 86 tools. On a 390x844 screen it takes about 70px; on 640px-tall phones it is 11% of the screen. In deshe-fera and dhoyahin it sits on top of the first form control (`.shots/ux-late-deshe-fera.png`, `.shots/ux-late-dhoyahin.png`); in bhagabhagi it hides the people chips (`.shots/ux-t-bhagabhagi.png`, `.shots/ux-320-bhagabhagi.png`); in shubhechha it covers the top of the card (`.shots/ux-t-shubhechha.png`).
- **Why it matters:** a first-time visitor sees a "what do I press" button before they know what the tool is, and the thing they should touch is half hidden. The bar earns its place after the person has done something.
- **Simplest fix:** in the shared component, show only after the first interaction or after scrolling past roughly one screen (for example `show && (touched || scrollY > 500)`); keep the flagship behaviour (it already hides until a memory is picked).
- **Files:** `shared/share-kit.tsx` (`StickyNext`, line 148), maybe `shared/share-kit.css` line 22.

### 3. Sharing or finishing leads nowhere; "try another tool" is at the very bottom  (M)

- **What:** after Share/Copy/Download the only response is a status line ("শেয়ার হয়ে গেছে! এবার দেখো কে কী বলে।"). "এগুলোও ভালো লাগতে পারে" comes after the how-to and 8 to 14 FAQ items, at a median 82% of the page (`.shots/ux-t-komon-bottom.png`, `.shots/ux-t-jomi-bottom.png`).
- **Why it matters:** the best moment to offer a second tool is right after the person succeeds. Today they hit a dead end and must scroll about 4 screens, or press Back.
- **Simplest fix:** (a) pass the 2 related tools to `ShareBar` through a small client context provided by `PageFrame`, and after a successful share/copy/download show a compact "আরেকটা খেলো: [tool] [tool]" card under the status line; (b) move the related block above the FAQ, or collapse the FAQ to the first 4 questions with "আরও প্রশ্ন".
- **Files:** `shared/share-kit.tsx` (`ShareBar`, line 46), `shared/site-shell.tsx` (lines 28 to 37), `shared/share-kit.css`.

### 4. The "এবার তোমার পালা" friend banner is built 20+ different ways  (M)

- **What:** there is no shared banner. Each tool writes its own (about 20 files contain the phrase). Same job, different look: komon-porlo, mondop and shubhechha use a big red button (`.shots/ux-friend-komon.png`, `.shots/ux-friend-mondop.png`, `.shots/ux-friend-shubhechha.png`); jomi and bidyut-bill use an outlined secondary button (`.shots/ux-friend-jomi.png`, `.shots/ux-friend-bidyut.png`); eta-na-ota uses a plain text link, and that link says "রাফির বোর্ডটা দেখো" (see theirs) rather than "make mine" (`.shots/ux-friend-eta.png`). Jomi and bidyut-bill say "কেউ তোমাকে ... পাঠিয়েছে" even when the link carries a name (bidyut-bill's link had "রাফি"). In komon-porlo the full hero stays above the banner, so the card starts at y=300 of 844.
- **Why it matters:** this is the screen every Facebook-invited friend lands on. They need one obvious action; right now it depends on which tool they landed in. In jomi and bidyut-bill the friend's values also fill the editable tool, so "is this mine or theirs?" is unclear (verify with a user).
- **Simplest fix:** one `FriendBanner` in the share kit (kicker, title, optional thumbnail, one primary button with a "make mine" verb). Step 1 (S): normalise the CSS so all existing banners get the same primary button. Step 2 (M): migrate tools one by one and, for friend arrivals, shorten the hero (hide the lead paragraph).
- **Files:** `shared/share-kit.tsx`, `shared/share-kit.css`, then `tools/*/components/*` that contain `friend-title` or "এবার তোমার পালা".

### 5. The Back button wastes presses on every in-page jump  (S)

- **What:** `StickyNext` is a plain `<a href="#result">`, and there are 164 `href="#..."` links in tools (88 are `#result`). Each one adds a history entry. Verified on the flagship: tapping "খাতাটা দেখো" took `history.length` from 23 to 24, and Back landed on the same page with the hash cleared.
- **Why it matters:** "does the back button behave?" Visitors press Back to leave; they stay on the page once per jump.
- **Simplest fix:** make `StickyNext` a button that calls `document.querySelector(href)?.scrollIntoView({behavior:'smooth'})`. Use the same small helper (or `history.replaceState`) for the other tool-specific anchors.
- **Files:** `shared/share-kit.tsx` (line 148); later the tool components with `href="#make"`, `#card`, `#board` and so on.

### 6. `/tools` forgets the filter and search when you come back  (S)

- **What:** `AllTools` keeps `query` and `category` in React state only; the `#c=` hash is read once on load and never written. Verified: pick "খেলাধুলা", open a tool, press Back, and the page shows "সব" with 86 tools at the top.
- **Why it matters:** the whole "try another one" loop breaks. The person who browsed a category and tried a tool has to redo the filter, and then scroll again through a 14,000px list.
- **Simplest fix:** write the chip index and the query into the URL with `history.replaceState` (`#c=1` and `?q=`) and restore them on load; let the browser restore scroll. Search matching itself is someone else's job; this is only about keeping the state.
- **Files:** `components/all-tools.tsx`.

### 7. On result screens the Share button is buried under optional controls  (M)

- **What:** on the flagship the order after the card is: name field, photo picker, decade chips, format toggle, and only then the red "শেয়ার করো" (`.shots/ux-flag-result.png`, `.shots/ux-flag-share.png`). That is about 550px of optional things between the card and the one action that matters. I confirmed it on the flagship; other tools were not checked one by one.
- **Why it matters:** the design brief says "one obvious next action". A visitor who just saw their result scrolls through four decisions before finding the share button.
- **Simplest fix:** put `ShareBar` directly under the card and move the optional controls below it (or inside a collapsed "নাম, ছবি আর দশক বদলাও (ইচ্ছা হলে)" block). Start with the flagship, then repeat for tools with the same pattern.
- **Files:** `tools/amar-chhotobela/components/postcard-builder.tsx` first; then the other `tools/*/components/*` builders.

### 8. The homepage is 10.5 screens long and has no search  (M)

- **What:** below the hero there are 10 category blocks with 4 single-column cards each (`.shots/ux-home-part1.png` to `.shots/ux-home-part4.png`, height 8,903px). The per-category "সবগুলো (n) →" link is a tiny 88x25px target. There is no search field and no category chips on the page; the only way to the full list is "সব টুল" in the header or the link under the section heading.
- **Why it matters:** a visitor who is not into childhood memories cannot find "their" tool without scrolling for 8 screens, and the cards are all text-heavy. People leave rather than scroll.
- **Simplest fix:** keep the flagship hero as is. Under it, show a search field and one row of category chips (they link to `/tools#c=n`), then 6 to 8 popular cards instead of 40. Or show each category as a horizontally scrolling row. Make "সবগুলো" a 44px button.
- **Files:** `components/tool-directory.tsx`, `components/home-page.tsx`, `components/home.css`.

### 9. `/tools`: five rows of chips, nothing sticky, and a dead-end empty state  (M)

- **What:** the category chips wrap to five rows and push the first card to y=610 (`.shots/ux-tools.png`). After you scroll, the search and chips are gone (16.9 screens of cards). The empty result says "এই নামে কিছু পেলাম না। অন্য একটা শব্দ দিয়ে খোঁজো।" with the "সব" chip still shown as selected and no button (`.shots/ux-tools-empty.png`).
- **Why it matters:** this is the page people use to find a tool. The filter controls take most of the first screen and are out of reach after the first scroll; the empty state does not help the person recover.
- **Simplest fix:** one horizontally scrollable chip row (the komon-porlo tabs already show this pattern), a sticky search plus chips bar, and an empty state with a "সব দেখাও" button, the flagship card, and the existing `SuggestBox` ("কোন টুল খুঁজছ? আমাদের বলো").
- **Files:** `components/all-tools.tsx`, `components/home.css` (`.all-tools-*`), optionally `shared/share-kit.tsx` (`SuggestBox` reuse).

### 10. The 404 and an expired share link are the same bare page  (S)

- **What:** `/xyz` and `/s/doesnotexist` both show "এই লিংকে কিছু নেই" with one button to the homepage (`.shots/ux-404.png`, `.shots/ux-s404.png`). Share links are deleted after a year (per the privacy page), so a friend with an old link gets this. `app/error.tsx` is similar and has no header or footer at all.
- **Why it matters:** the visitor who most deserves a warm welcome (they were invited) gets a dead end, with no tool, no search and no explanation.
- **Simplest fix:** add `app/s/[id]/not-found.tsx` with "এই কার্ডটা আর নেই। লিংক এক বছর পর মুছে যায়। তুমি নিজেরটা বানাও" plus the flagship button and 3 or 4 popular tools; give the global 404 a search link and the same 3 or 4 tools; wrap `error.tsx` in the hub header and footer.
- **Files:** `app/not-found.tsx`, `app/s/[id]/not-found.tsx` (new), `app/error.tsx`, `shared/site-shell.tsx`.

### 11. "শেয়ার করো" can silently only copy a link  (S)

- **What:** in `ShareBar`, when `navigator.share` does not exist the main button runs `copy(prepared.link)` and shows "লিংক কপি হয়েছে..." (`shared/share-kit.tsx`, the final `else` in `share()`). Android WebViews, and probably the Facebook/Messenger in-app browsers that most visitors arrive in, often lack `navigator.share` (verify on device). The button label never changes, and the card image is not included.
- **Why it matters:** the big red button promises sharing and does something smaller. The person pastes a link and wonders where the picture is. Text sharing on the older `ArtworkDownloads` is honest (it hides the button), but `ShareBar` is not.
- **Simplest fix:** detect `navigator.share` in the existing `useEffect` and, if absent, relabel the main button "লিংক কপি করো" and make "ছবি ডাউনলোড করো" the primary look, dropping the duplicate secondary copy button.
- **Files:** `shared/share-kit.tsx`.

### 12. Two preloaded Bangla fonts weigh more than the JavaScript  (S to M)

- **What:** `app/layout.tsx` preloads `bangla.woff2` (107KB) and `display-bangla.woff2` (90KB) on every page, including 404, about and the share landing. Both are variable fonts (weights 100 to 900 and 400 to 800), so each includes weights the pages do not use. The fonts are self-hosted and use `font-display: swap`, which is good.
- **Why it matters:** on 3G, about 198KB of preload competes with CSS and JS for bandwidth, which delays hydration; it is about half of a first visit's bytes.
- **Simplest fix:** (S) preload only the body font and let the heading font swap in; (M) subset to the glyphs actually used and ship two static weights (400 and 700), or use one family for body and headings.
- **Files:** `app/layout.tsx`, `shared/base.css` (`@font-face`), `public/fonts/*`.

### 13. 117px of chrome above every tool, and two nav links lead away from the tool  (S)

- **What:** header (64px) plus a breadcrumb row (52px) sit above the h1 on every tool page. The breadcrumb repeats the brand and the tool name, and the current crumb is a link to itself. "কীভাবে করবে" and "গোপনীয়তা" open separate pages (`.shots/ux-guide.png`, `.shots/ux-tprivacy.png`); the guide repeats the steps already shown on the tool page, and "গোপনীয়তা" is hidden by CSS at 420px width and below. The header pill "আমার ছোটবেলা" is shown on the flagship's own page, linking to itself. No `aria-current` anywhere.
- **Why it matters:** on a 640px phone the tool starts at about 300px. Detours lose the person's input (nothing is saved) and come back to a fresh tool.
- **Simplest fix:** hide the breadcrumb row below 720px, turn "কীভাবে করবে" into an in-page link to the steps section, move both links to the footer (they are already there), hide the pill on the flagship, add `aria-current="page"`.
- **Files:** `shared/site-shell.tsx` (lines 12 and 36), `shared/hub-shell.css` (lines 2 and 7). Note `components/home-page.tsx` has its own header and footer, which already differ (no flagship pill); consider sharing them.

### 14. The homepage mini-notebook looks like the tool but is not tappable  (S)

- **What:** the hero's notebook with ticked tiles and "নাম: তুমি" is `aria-hidden` decoration; it is not inside a link (checked: `closest('a')` is null). See `.shots/ux-home.png`.
- **Why it matters:** it is the most tempting thing to tap on the first screen. Nothing happens, and on a slow phone that reads as "broken".
- **Simplest fix:** wrap `MiniKhata` in `<Link href="/amar-chhotobela">` (keep it `aria-hidden` or give the link a label).
- **Files:** `components/home-page.tsx` (line 11 and the use at line 40).

### 15. The first screen never says this is a collection of 86 tools  (S)

- **What:** the hero is entirely about the flagship (headline, lead, one button, "ফ্রি · অ্যাকাউন্ট লাগে না · ছবি বানিয়ে শেয়ার করো"). The tools list begins at y=952, and "সব টুল" in the header is the only hint that more exists.
- **Why it matters:** someone who arrives at the homepage (for example from the brand page) and does not care about childhood memories has no reason to scroll.
- **Simplest fix:** add one line under the promise, like "আরও ৮৬টা ছোট টুল আছে: খেলা, কুইজ, হিসাব, কার্ড →", linking to `/tools`. Keep the single big button.
- **Files:** `components/home-page.tsx`, `components/home.css`.

### 16. Related tools are plain text, while everywhere else tools have pictures  (S)

- **What:** "এগুলোও ভালো লাগতে পারে" shows a title and description only (`.shots/ux-t-komon-bottom.png`); the homepage and `/tools` cards show the real card thumbnail and an action verb.
- **Why it matters:** the thumbnail is what makes people tap; this is the main "go to another tool" surface.
- **Simplest fix:** reuse `ToolCard` (it already takes `hasPreview`) in the related list; pass `previewSlugs()` from the server.
- **Files:** `shared/site-shell.tsx`, `shared/hub-shell.css` (line 3, `.related-tools-*`), `components/tool-card.tsx`.

### 17. Small tap targets and 12 to 13px Bangla microcopy  (S)

- **What:** header brand link 120x37, header "সব টুল" 39x44, homepage "সবগুলো (n) →" 88x25, FAQ summaries 358x42, 13px nav links ("কীভাবে করবে"), 12px sticky sub-line, 13px `.kit-photo small`, 11.5 to 13px labels inside several tools. Everything else measured was 44px or more.
- **Why it matters:** Bangla letterforms with matras and conjuncts are hard to read below 14px on cheap, low-density screens, and small targets mean mis-taps.
- **Simplest fix:** `min-height:44px` on the brand link and "সবগুলো" links; raise the 12 to 13px shared text to 14px.
- **Files:** `shared/hub-shell.css`, `components/home.css`, `shared/share-kit.css`.

### 18. Red buttons on content pages have a green shadow  (S)

- **What:** `.hub-prose .button` overrides the background to red but leaves the shadow on the old teal `--accent`, so you get a dark-green edge under a red button (about, privacy, guide, 404: `.shots/ux-404.png`, `.shots/ux-about.png`).
- **Why it matters:** looks like a bug; small, but it is on every secondary page.
- **Simplest fix:** add `box-shadow:0 4px 0 #a92a1f` to that rule.
- **Files:** `shared/hub-shell.css` (line 4).

### 19. Copy nits on the secondary pages  (S)

- **What:** `/privacy` uses "ঘোরানো (hash) রূপ" and "IP ঠিকানা", jargon for this audience. The back link reads "কয়টা কমন পড়ল?-এ ফিরে যাও" (awkward with a question mark). Every tool privacy page ends with the same generic "সার্ভারে কী থাকে" paragraph.
- **Why it matters:** these are the pages people open when they are unsure; they should be the plainest.
- **Simplest fix:** reword "hash" as "এলোমেলো কোড, যা থেকে তোমাকে চেনা যায় না"; make the back link "← ফিরে যাও" (the tool name is already in the breadcrumb); keep the generic server paragraph on `/privacy` only and link to it.
- **Files:** `app/privacy/page.tsx`, `app/[tool]/guide/page.tsx`, `app/[tool]/privacy/page.tsx`.

### 20. Dev only: 127.0.0.1 never hydrates when the server runs with `dev:phone`  (S)

- **What:** the running dev server (started with `--hostname 0.0.0.0`) blocks dev resources and the HMR websocket for the 127.0.0.1 origin, so React never attaches. On `http://127.0.0.1:3100/tools` the chips and search do nothing; on `http://localhost:3100/tools` they work. This is not a production issue (`allowedDevOrigins` in `next.config.ts` lists only LAN patterns), but it makes a reviewer think the product is broken.
- **Why it matters:** wasted time for the next person, and a false "tools are dead" report.
- **Simplest fix:** add `'127.0.0.1'` and `'localhost'` to `allowedDevOrigins` (not tested), or note "use localhost" next to `dev:phone` in the README.
- **Files:** `next.config.ts`.

## Don't change (already works well)

- **Flagship-first homepage.** The single red button ends at y=437 of 844, one tap to start, with the one-sentence promise right under it. The "মনে আছে?" hook is strong.
- **Short heroes on tool pages.** Median first control at y=390, median 110 characters of intro. Keep this pattern for new tools.
- **Friend arrival plumbing.** `/s/<id>` uses `location.replace`, so Back returns to Facebook instead of looping. The personalised og:title ("আত্মীয়দের প্রশ্ন: রাফির ৮টা কমন পড়েছে। তোমার কয়টা?") is excellent. Keep both when fixing finding 1.
- **Friend banners that already work.** komon-porlo, mondop and shubhechha put a real thumbnail of the friend's card next to one clear button.
- **Scrollable chip tabs** (komon-porlo, eta-na-ota): the half-cut last chip hints that it scrolls.
- **Real card thumbnails.** Cards use the tool's actual share image as the thumbnail, as webp, lazy-loaded, optimised to about 17KB. Social images are 1200x630 PNG at a median 170KB.
- **Self-hosted fonts** with `font-display: swap` and unicode-range split; no third-party requests at all.
- **Lean JS per tool.** Median 9.4KB gzip page chunk (max 20KB); prefetch is off on tool cards (`prefetch={false}`), which saves data.
- **Accessibility basics.** `lang="bn-BD"`, skip links, no unlabeled inputs or unnamed controls on the 8 pages scanned, no horizontal overflow at 320px, visible focus outlines, strong text contrast (muted text is about 5.9:1).
- **Status messages that say what to do next** ("ছবি তৈরি। আরেকবার 'শেয়ার করো' চাপো।"), the in-app-browser long-press save sheet, and the FAQ entry about Facebook's browser.
- **তুমি voice and the footer promise** ("সব টুল ফ্রি। অ্যাকাউন্ট লাগে না, বিজ্ঞাপনও নেই।").
- **Related ordering:** same category first, flagship pinned first.

## Where search should appear (matching is handled separately)

1. Homepage: a field right under the flagship button (or at the top of the tools section), submitting to `/tools` with the query.
2. Header on every hub and tool page: a 44px magnifier icon that opens `/tools` with the input focused.
3. `/tools`: first element on the page, sticky while scrolling (finding 9).
4. Empty search result, 404 and expired-share page: a field plus 3 or 4 popular tools (findings 9 and 10).
5. End of a tool page, below the related tools, as "অন্য কিছু খুঁজছ?".

## Suggested order of work

1. **One short pass in the shared files (about a day):** findings 1, 2, 5, 6, 10, 11, 13, 14, 15, 16, 17, 18, plus the font preload from 12. These touch `shared/share-kit.tsx`, `shared/site-shell.tsx`, `shared/hub-shell.css`, `components/*`, `app/s/[id]/*`, `app/not-found.tsx`.
2. **Then the loop after success:** finding 3 and the shared banner CSS from finding 4.
3. **Then the browsing pages:** findings 8 and 9 (homepage and `/tools`), together with the search placements above.
4. **Per-tool follow-ups:** findings 7 and the banner migration in 4, starting with the flagship.

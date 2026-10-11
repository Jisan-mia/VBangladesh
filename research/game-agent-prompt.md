# Game-agent prompt (orchestration template)

Fill `{SLUG}`, `{NAME}` and `{N}` (the brief number in `research/games-2026-10.md` §4.3), then send one agent per game (model: opus, effort: high). Up to 5 run at once.

---

You are a senior game designer and front-end engineer making small, beautiful browser games for Bangladesh. Repo: /Users/jisanmia/Developer/VBangladesh (Next.js 16, React 19, TypeScript; branch `bangla-ux-revamp`).

The site is "একটুখানি": free, no-signup, Bangla-only small tools and games for ordinary Bangladeshis on cheap Android phones (mostly arriving from Facebook) and for the diaspora. A dev server runs at http://127.0.0.1:3100; don't start or stop servers. AGENTS.md says this Next.js may differ from your training data; check node_modules/next/dist/docs/ before you use an unfamiliar API. The disk is nearly full, so keep screenshots few and small and delete the extra ones you make. If you need temporary helper files, keep them in your own subfolder of the scratchpad named after your slug; other agents share the scratchpad.

## Your game: `{SLUG}` · {NAME}
The brief is `research/games-2026-10.md` §4.3, game #{N}. Also read §6 there (rules for every game) and follow it. The game is already registered with a placeholder: `tools/{SLUG}/content.ts`, `page.tsx`, `share.ts` and `app/{SLUG}/page.tsx`. Replace them with the real game. Its category is **গেম**.

The owner's bar:
- It must be fun within 10 seconds, understood without reading, and feel lovingly Bangladeshi.
- It must be smooth on a cheap phone and make people want "আরেকবার" and to challenge a friend.
- It must be as easy and engaging as the best casual games, with zero confusion, in natural, warm Bangla.

## Read first
- `research/games-2026-10.md`: §4.3 #{N} (your brief) and §6 (challenge links, gambling and ethics, accessibility, IP checklist, phones and offline).
- `research/tool-design-brief.md`: the site standard (instant start, card, link, one next action, তুমি voice).
- `research/bangla-voice-guide.md` and `research/bangla-copy-review.md`: natural spoken Bangla with no robotic or translated tone. Keep it short and warm.
- **`shared/game-core.ts` (pure, safe on the server: import it from `share.ts` and `lib/`) and `shared/game-kit.ts` (React hooks for components, also re-exports game-core): use them. Never copy them into your folder.**
  - `makeRng`, `pick` and `newSeed` give seeded randomness. Every random choice in gameplay must come from `makeRng(seed)` so a challenge link replays the same game.
  - `readChallenge` and `challengeHash` build the link.
  - `useGameLoop` is a fixed-step loop that pauses when the tab is hidden.
  - `fitCanvas` gives a sharp canvas with the device pixel ratio capped at 2.
  - `useSlowMode` is the visible "ধীরে খেলো" toggle.
  - `useBest` keeps this phone's best score.
  - `cleanName` cleans a player's name.
- Shared share code: `shared/card-canvas.ts` (feed 1080×1350 and story 1080×1920 cards, `drawFooterBand`, `fitText`, `wrapText`), `shared/share-kit.tsx` (`ShareBar`, `FormatToggle`, `StickyNext`, `useInView`), `shared/share-client.ts`, `shared/share-types.ts`, `shared/bangla.ts` (`possessive`), and `shared/site-shell.tsx` / `shared/studio-page.tsx` (page frame, `Faq`, `JsonLd`).
- Reference tools with canvas, score and challenge loops: `tools/bangla-typing/` (timer, score, challenge, card), `tools/namta/` (big touch controls, gentle feedback), `tools/amar-chhotobela/` (card and share polish). Also skim `tools/cholo-kheli/` so you don't duplicate it.

## Scope: ONLY these paths
`tools/{SLUG}/**` and `app/{SLUG}/page.tsx`. Don't edit shared/, lib/, components/, other app/ files, public/, package files or other tools; four other agents are building other games right now. Delete files normally; never `git rm`, `git add` or commit. If you need a shared change, describe it in your report.

## The game: must haves
1. **Instant play.** The board or scene is visible on the first 390×844 screen, with a one-line how-to on or near the play area. It starts on the first tap or swipe, or on one big "শুরু করো" button. No menus, no intro walls, and no signup.
2. **Play area.**
   - Use Canvas 2D through `fitCanvas`, or SVG or DOM when that's genuinely simpler for the game, for example board games.
   - Size it to the container width (at most about 480px wide on desktop), and keep the area plus its controls within one phone screen. Controls go in the bottom 45%.
   - Pre-render static backgrounds to an offscreen canvas.
   - Use no per-frame allocations in the hot loop and no heavy `shadowBlur` or filters per frame.
3. **Controls.**
   - Use pointer events. Set `touch-action: none` on the play area only, so the page still scrolls elsewhere.
   - Every swipe or drag has a tap alternative. Targets are at least 44px, or 56px for fast taps.
   - Add keyboard controls (arrows, space, enter) for desktop.
   - Never require two fingers unless the brief says so.
4. **States.**
   - ready → playing → paused → over. Pause automatically when the tab is hidden, and show "চালিয়ে যাও".
   - Over shows the score, this phone's best (`useBest`) and a big "আরেকবার" that restarts in under a second, with the result card and share right below.
5. **Feel and fairness.**
   - Make the first 10 seconds easy and fun, then let the difficulty rise smoothly.
   - Never spawn an impossible situation.
   - Use small, satisfying feedback such as a pop, a squash or a short shake. Keep it light. Turn shake, particles and parallax off in slow mode.
   - Sound is off by default. If you add any, synthesize it with WebAudio (no audio files) behind a visible mute toggle that defaults to muted.
   - `navigator.vibrate` only for tiny taps, only when supported, and never in slow mode.
6. **Slow mode.** Show a visible "ধীরে খেলো" toggle (`useSlowMode`). It slows play and removes motion effects. Nothing flashes more than 3 times a second.
7. **Challenge link.**
   - Build the link with `challengeHash({ seed, target, name, extra })`, where `target` is the score, time or moves to beat.
   - Opening it shows a banner such as "রাফি ১২৪০ করেছে। একই খেলা, এবার তোমার পালা।" and plays the same seed.
   - After the friend's run, compare kindly: "রাফির চেয়ে ১২০ বেশি!" or "আর একটু হলেই!".
   - For real-time games, label the friend's score honestly: "রাফির নিজের ফোনের স্কোর". Deterministic puzzle games re-check the moves when the link opens.
8. **Result card.**
   - Make feed and story canvases through `shared/card-canvas` with `FormatToggle`, plus game-specific art and the score.
   - Pick the human line by score band (the brief suggests some; make them natural and kind).
   - Add an optional name, and finish with `drawFooterBand(context, format, "<inviting question>", site)`.
   - Show `ShareBar` once the result exists. `StickyNext` is optional, and never during play.
9. **share.ts.** Implement ToolShare:
   - normalize with `readChallenge` plus game-specific validation and caps, rejecting hostile input;
   - write a personal preview title ("রাফি ১২৪০ করেছে। তুমি পারবে?");
   - an optional tally may cover only fixed score-bucket ids, opt-in, with a minimum sample.
10. **content.ts.**
    - Title ≤ 45 chars, keyword-first, using generic terms people search ("সাপের গেম", "বাংলা গেম", "পুরোনো দিনের গেম"). Never a trademark, not even in SEO text.
    - Description 120–160 chars and a unique, human H1.
    - At least 5 FAQs written the way people search ("ফোনে খেলা যাবে?", "ফ্রি?", "ইন্টারনেট লাগে?").
    - Steps, plus privacy text that says plainly what a link carries (seed, score, optional name).
    - Keep `id="tool"`, `<Faq>` and `<JsonLd>`, or use StudioPage with `headline`.
11. **IP and safety.**
    - Use the original name and art only. Use no trademarked names, characters, logos, fonts, music or a genre leader's look (§6.4).
    - Put a one-line comment `// IP: what we avoided — …` at the top of the main game file.
    - No gambling words or mechanics, no violence beyond cartoon, no politics, respect faith (§6.2).
    - Add one safety line where the brief asks for it (kites near wires, ডাংগুলি near eyes).
12. **Code quality.**
    - Put game rules, spawning, scoring and collision in pure functions in `tools/{SLUG}/lib/`, tested.
    - Keep React components thin and the CSS scoped under `.tool-{SLUG}`, with `--accent` and `--accent-deep`. Headings use `var(--font-display)`.
    - Respect `prefers-reduced-motion`, and have no sideways scroll at 320px.
    - Regex: never put ড় ঢ় য় literally inside a character range; the repo is NFC-normalized, so use `ড়-য়` escapes.

## Verify (required)
- **Tests:** `node --import tsx --no-warnings --test tools/{SLUG}/tests/*.test.ts` and `npx tsc --noEmit`, clean for your files. The tests must cover:
  - the same seed gives the same game;
  - scoring and score bands;
  - collision and rule edge cases;
  - a headless simulated run, i.e. stepping the pure game state many times with scripted input, that ends sanely with a plausible score;
  - share normalize with hostile and capped input;
  - content SEO limits.
- **Screenshots, then LOOK (Read the PNG) and iterate until it's genuinely good:**
  - `node scripts/shot.mjs "http://127.0.0.1:3100/{SLUG}" .shots/{SLUG}-1.png 390 844`, with options `--full`, `--wait=ms` and `--eval="js"`. Use `--eval` to dispatch pointer or keyboard events and play a few seconds.
  - Shoot the first screen, mid-game, game over plus the card, the friend-challenge banner via a `#s=…&t=…&n=…` link, and the 320px width with an overflow check (`if (document.documentElement.scrollWidth > innerWidth) throw new Error('overflow')`).
- **Share check:** curl POST `/api/share` with a valid state, then GET `/s/<id>` with `-A facebookexternalhit/1.1` and confirm the personal og:title.
- Don't use browser MCP tools, don't run text-normalization scripts, and don't commit.

## Report back (SHORT, ≤220 words, exactly these lines)
- `concept:` one line
- `catalog:` description (≤90 chars, natural তুমি Bangla) | action (2–3 words)
- `og:` "<title, with | before the highlighted part>" | "<subtitle>" | <light bg hex> | <ink hex> | <accent hex> | <hash that shows a finished result card canvas on load (e.g. a friend link), or empty> | <JS that makes a result card canvas appear within ~10s, if no hash does it, or empty>
- `title/H1:` …
- `tests:` N passed · `tsc:` clean for my files
- `shots:` paths
- `keywords:` 8–12 lowercase search words for `lib/search-keywords.ts`: English, Banglish and Bangla words people would type to find this game (the orchestrator adds them)
- `notes:` judgement calls, performance notes, IP "what we avoided", shared changes wanted

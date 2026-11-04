# The shared game player

Every game page uses one player, so opening a game feels like Poki or CrazyGames. On a desktop the game opens big in the middle with related games beside it. On a phone a launch card shows one huge **খেলো**, and the game then fills the screen.

Files:
- `shared/game-player.tsx` (server): `<GamePage>`, the page layout, rails, grid, guide, FAQ, JSON-LD, header and footer.
- `shared/game-player-client.tsx` (client): `<GamePlayer>`, `useGamePlayer()`, the pause menu, immersive mode, and the Back button.
- `shared/game-player-core.ts` (pure, tested in `shared/tests/game-player.test.ts`): the recently played list, the history bookkeeping and the stage maths.
- `shared/game-player.css`, imported in `app/layout.tsx`.

## The page: `<GamePage>`

```tsx
import "./product.css";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { SnakeGame } from "./components/snake-game";

export default function JhalmuriSapPage() {
  return (
    <GamePage site={site} kicker="পুরোনো দিনের সাপের গেম, এবার ঠোঙায়" title={<>সাপটা ঝালমুড়ি খাবে, <span>তুমি চালাও</span></>}>
      <SnakeGame />
    </GamePage>
  );
}
```

| Prop | Default | What it does |
| --- | --- | --- |
| `site` | required | The tool's `content.ts`. Steps, guide, FAQ, schema and the lead all come from it. |
| `title` | `site.headline ?? site.name` | The H1 text, the page's only H1. A ReactNode, so a `<span>` can carry the accent colour. |
| `kicker` | none | An optional first line *inside* the H1. Without it, `site.name` shows above the H1 as a plain label. |
| `kids` | category is ছোটদের জন্য | Kids mode: the rails, the grid, the header and the footer link only to kids' tools and ছোটদের খেলাঘর. |
| `note` | none | The kids' `<ParentNote>`. It shows on the launch card and under কীভাবে খেলবে in the menu. |
| `shape` | `'portrait'` | `'wide'` gives a 16:9 stage (640–1024 px) and hides the rails until the window is very wide. |
| `more` | none | Extra text under the guide, such as a print link. |

Keep the page's title, description and H1 text as they were (check `npm run check:pages`).

### What it renders
1. The header: `HubHeader` from the portal, or a kids header whose brand goes to `/chhotoder`.
2. `<section id="tool" class="gp">`, the player. `#tool` links from the guide and privacy pages still land here.
   - **Desktop (≥ 900 px):** rails of game tiles, the stage, and more rails. Under them is the control bar: the art, the kicker and H1, the lead, then ⟳ restart, ⏸ pause, sound, ⛶ full screen and ? how to play. The stage is as tall as the window allows; a portrait stage is 480–560 px wide (`inlineStage`).
   - **Phone (< 900 px, or a phone held sideways):** the launch card shows the tile art, the kicker and H1, the lead, a huge খেলো, and the parent note. The game is already mounted but hidden (`display: none`) until খেলো.
3. Below the fold come the breadcrumb, then the guide and privacy links (small), the "আরও খেলো" grid (on a desktop it starts after the 24 tiles already in the rails), the guide (`site.steps`), `more`, and the FAQ.
4. The footer.

## Immersive mode
খেলো on a phone, or ⛶ on a desktop:
- The shell becomes `position: fixed; inset: 0; height: 100dvh` with safe-area padding, and `<html>` is scroll-locked (`gp-locked`).
- It calls `requestFullscreen` on the shell where allowed (Android Chrome, desktops). Phones also try to lock portrait for portrait games. iPhones keep the fixed overlay.
- A slim band sits on top: a translucent ⏸ button (top-left) and the game's name. **Keep the top 50 px of the stage free of anything vital in immersive mode.**
- A portrait game in desktop full screen is a centred column `max(560px, 64dvh)` wide on the night background.
- **To leave:** Back or swipe-back, Escape, বের হও in the menu, or the browser leaving full screen. Entering pushes one history entry, so Back closes the player and doesn't leave the page. Leaving always pauses and opens the menu. On a phone, the launch card then says **খেলায় ফেরো**, and tapping it returns to the open menu with চালিয়ে যাও chosen.

## Pause: the player owns it for every game
The player pauses (opens the menu) on:
- window `blur`;
- `visibilitychange` to hidden;
- Escape;
- the ⏸ button (bar or band);
- leaving immersive mode;
- scrolling the stage off screen on a desktop.

It does this only once someone has touched or keyed the game ("engaged"), so a page left untouched never opens a menu by itself.

When it pauses, the player:
1. blurs the focused element inside the game;
2. sends `pointercancel` (and releases pointer capture) to a finger or button still held on the game, because the game never sees its `pointerup` under the menu;
3. dispatches a synthetic window `blur`: games drop held keys, and `useGameLoop` stops its frames;
4. calls `silenceScheduled()` from `shared/game-sound.ts`, which cuts every `tone()` and `hiss()` still sounding or waiting to start (such as a drumroll's later beats). Loops are left to their owners;
5. calls every `onPause` handler. **If the game registered none** (not migrated yet), it *soft-hides*: `document.hidden` reads true and `visibilitychange` fires, so the game's own visibility pause runs.

চালিয়ে যাও undoes the soft hide, dispatches a synthetic window `focus` (which restarts `useGameLoop`), and calls `onResume`. নতুন করে শুরু does the same, then calls `onRestart` handlers, or remounts the game when there are none.

While the menu is open, the game is `inert` and no key reaches it: the player's capture listener stops keydown and keyup. The menu handles ↑/↓/Tab (focus stays inside it), Enter and Escape.

`useGameLoop` (shared/game-kit.ts) now also stops on a real window `blur` and starts again on `focus`, with no catch-up burst. This fixes the "I clicked into another window and the game kept running" bugs, even on pages that don't use the player yet.

**Orca note:** Orca's browser pins `document.hidden` to false. Visibility pauses can't fire there, and the soft hide silently does nothing. The soft hide was verified in headless Chrome (`scripts/shot.mjs` on the unmigrated sudoku: the clock held at ০০:০২ through a 2.5 s pause). Orca's page zoom can also scale `orca click` coordinates; use `el.click()`, or `orca mouse` with corrected coordinates (needed for a trusted tap that may call `requestFullscreen`).

## In the game: `useGamePlayer`

```ts
import { useGamePlayer } from "../../../shared/game-player-client";

const player = useGamePlayer({
  onPause: () => pause(),        // freeze: stop timers, the loop, loops of sound
  onResume: () => resume(),      // only from the paused state; give a short breath before moving again
  onRestart: () => restartRun(), // the same level, fresh run, back to its start screen
});
player.paused;          // true while the menu is open
player.immersive;       // true while the game fills the screen
player.stage;           // { width, height } of the play area in CSS px (0 × 0 outside a player or before it's measured)
player.requestRestart(); // the same as নতুন করে শুরু
player.requestPause();
// useGamePlayer({ onLevels: () => openMyLevelList() }) adds সব লেভেল to the pause menu (it resumes, then calls you)
   // opens the pause menu, the same as the button (use it for the game's own P key)
player.onPause(fn) / onResume(fn) / onRestart(fn) // manual subscriptions; each returns an unsubscribe
```

The handlers argument always calls the latest closures, so you never need refs for them. Outside a player the hook returns a harmless default (paused false, stage 0 × 0), so a component still works anywhere.

**CSS sizing.** The stage element carries `--stage-w`, `--stage-h` and `data-immersive`. Usually one rule in `product.css` is all a game needs to fill the stage:

```css
/* the board grows until the whole game fits the stage's height (186 px = the rows above and below the board) */
.gp-stage .js{max-width:min(420px,max(280px,calc((var(--stage-h,100svh) - 186px) * .7317)))}
```

Settings live in the player's menu: the site-wide sound switch (`useSound`) and ধীরে খেলো (`useSlowMode`). Both hooks now hear each other's changes (an `ektukhani-settings` window event), so a change in the menu reaches the game at once. Don't add new storage keys.

**Recently played:** the first time someone touches the game, or enters immersive mode, the player puts the slug at the front of localStorage `ektukhani-recent`. That is a JSON array, newest first, at most 12, read with `parseRecent()`.

## Kids' tools
- The same player. Kids mode comes from the category ছোটদের জন্য, or from passing `kids`.
- The rails, the grid, the header and the footer show only the ছোটদের খেলাঘর hub's tools and its "আরও খেলা" list. There are no links to the grown-up site.
- Pass the `<ParentNote>` as `note`. It shows on the launch card, and in কীভাবে খেলবে inside the menu.
- Nothing gates leaving: Back, Escape and বের হও always work. Only what lies behind the player is kid-only.

## Checklist for each game rewrite
1. In `page.tsx`, replace `PageFrame` + hero + `#tool` + guide + `Faq` with `<GamePage site={site} title=… kicker=…>`. Keep the H1 text exactly; move a kids `ParentNote` to `note`, and any extra guide text to `more`.
2. Delete the now-unused `.xx-hero`, `.xx-lead`, `.xx-guide` and `.xx-page` rules from `product.css`.
3. Call `useGamePlayer({ onPause, onResume, onRestart })`:
   - `onPause` stops the clock, the loop and any sound loops, and does nothing if the game isn't running;
   - `onResume` resumes only what `onPause` stopped (with a short breath before motion);
   - `onRestart` replays the same level from its start screen.
4. Fit the stage. Add one `.gp-stage …` rule using `var(--stage-h)` (or read `player.stage` for a canvas), so the board plus its controls fit without scrolling on a Pixel 9 (388 × ~850) and on a 1440 × 800 laptop.
5. Remove the game's own sound toggle, ধীরে খেলো toggle and pause button from the play area; the menu has them. Keep `P` as a pause key only if it doesn't clash (sudoku uses P for pencil). Escape belongs to the player.
6. Keep the HUD in the corners, except the top-left 50 × 50 px in immersive mode (the ⏸ button sits there).
7. Don't call `scrollIntoView` on the page from inside the game to "bring the board into view"; the stage is already in view. Scrolling to the result card inside the stage is fine.
8. Long scheduled sounds: use `tone(…, delay)` so `silenceScheduled()` can cut them. Don't schedule them with `setTimeout`.
9. Verify in Orca:
   - desktop: rails and stage;
   - Pixel 9: খেলো → immersive, start, blur pauses (menu up, the game frozen), চালিয়ে যাও, নতুন করে শুরু, Back closes and stays on the page;
   - no console errors;
   - `npm test`, `npx tsc --noEmit` and `npm run check:pages` pass.

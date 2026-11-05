# হাঁড়িভাঙা: rewrite design

## Core
- **Concept:** a মেলা pot stall. You aim a cloth ball and throw it at painted clay pots on ropes, then keep it alive with a bamboo লাঠি until the stall is bare.
- **Fantasy:** রহিম চাচা's stall at the fair, three balls for a taka. Every pot you break is a loud clay crash, and the crowd waits for the last one.
- **Loop:** তাক করো → ছোড়ো → ফেরাও. Aim (a dotted path shows where the ball will go), let go, then slide the লাঠি under the falling ball.

## The physics (pure, `lib/`, fixed 60 Hz steps)
- The stall is 360 × 600 world units. Pots are rectangles on ropes (7 cells a rope); the ball moves in substeps of at most half its radius, one axis at a time, so it never tunnels.
- **Throw:** while the ball sits on the লাঠি, the aim is an angle within ±62° of straight up. `trace()` runs the same physics forward (walls, ceiling, sway, wind) and returns the dotted path and the first pot it will hit, so the preview is exact.
- **Return:** the লাঠি sends the ball up at an angle set by where it lands (straight from the middle, up to 62° at the ends). Each emptied rope makes the ball a little faster, up to a cap.
- **শেষ ডাক (the last pots):** when only a few pots are left (`catchAt`), the stall owner rings his bell. From then on the লাঠি *catches* the ball, and every catch is a fresh aimed throw with the full preview. The end of a stall becomes a run of deliberate trick shots instead of a grind.
- **The last pot:** the stall's effects slow to a quarter speed for 0.55 s while its shards land (a bell rings), and the end screen follows 1.4 s after the last crash (0.9 s after the last ball). ধীরে খেলো skips the slow-motion.
- **No loop for ever:** a ball that rallies 9 s without hurting a pot gets a growing tilt off the লাঠি, so no orbit through the gaps can last.
- Old links (no `v`) open the old stall: 5 ropes of 7, the old tough pots from the same seed, the old speeds, the old score (10 a pot, 50 a ball left at a full clear) and the old stars. They are compared and carded, never recorded as stars.

## Progression: 3 মেলা (worlds) × 4 stalls
| # | Name | The one new thing |
|---|---|---|
| **পাড়ার মেলা** · afternoon, red-and-cream awning |||
| 1 | প্রথম ছোড়া | Aim and throw. Five pots on one low rope; the লাঠি catches every ball. Cleared in about 10 s. |
| 2 | লাঠিতে ফেরাও | The ball now bounces off the লাঠি. Its ends send it slanting. শেষ ডাক at 3 pots. |
| 3 | মোটা হাঁড়ি | Dark, thick pots take two hits. |
| 4 | **রহিম চাচার মটকা** (finale) | A huge মটকা in the middle takes 6 hits. Named bar at the top. |
| **নদীঘাটের মেলা** · dusk, orange sky, teal awning |||
| 5 | দোলা দড়ি | The ropes sway in the river breeze. |
| 6 | পটকা হাঁড়ি | A firecracker pot cracks everything next to it. |
| 7 | বাঁশের গিঁট | Bamboo knots that never break; bank around them. |
| 8 | **দোলনা মটকা** (finale) | An 8-hit মটকা that slides along its rope, with sway, crackers and knots. |
| **চড়কের রাত** · night, indigo, hurricane lanterns |||
| 9 | উত্তুরে হাওয়া | Wind bends the ball. The pennant and an edge arrow show it. |
| 10 | জোরে বল | The ball runs faster. |
| 11 | ছোট লাঠি | A shorter লাঠি. |
| 12 | **চড়কের রাজা মটকা** (finale) | A 10-hit sliding মটকা in the wind, with everything so far. (Same লাঠি as stall 11, so it adds the sliding মটকা and crackers, never a smaller লাঠি on top.) |

- **Stars:** ★ the stall is cleared; ★★ with at most one ball lost; ★★★ with none lost. সহজ tops out at ★★.
- **Score** (for the card and this phone's best): 10 a pot, and each further pot in one flight is worth 5 more (10, 15, 20 … up to 50); the মটকা is 100; at a clear, 50 for every ball still in hand.
- **Bots (`tests/bot.ts`, asserted in `tests/levels.test.ts`):**
  - casual: 0.3 s reactions, a 4° aim error on the suggested aim, a 24-unit error on where it puts the লাঠি, a 6% chance of a wild misjudgement and a lazy hand;
  - skilled: 0.22 s, picks the aim whose traced path hits a pot soonest, 1.5° error, 9 units on the লাঠি.
  - Measured on 24 seeds (সাধারণ): casual clears stall 1 100% (median 9 s), stalls 2–4 97/90/87%, 5–8 83–88/75/70%, 9–12 77/62/58/45%; skilled clears every stall 100%, three stars on 93–100%.
  - Asserted: casual clears stall 1 ≥ 97% with a median ≤ 10 s; skilled every stall ≥ 85%; casual every world-1 stall ≥ 70% and every stall ≥ 35%; each finale is the hardest stall of its world for the casual bot; সহজ lets the casual bot clear every stall ≥ 75%, never with ★★★; কঠিন lets the skilled bot clear every stall ≥ 55%; **the last five pots take a skilled player ≤ 18 s (measured 8–14 s; the old stall took about 50 s) and a casual one ≤ 25 s**.

## Difficulty and story
- **Modes (title chips, remembered):**
  - সহজ: "বড় লাঠি, ধীরে বল, ৫টা বল। পুরো পথ দেখায়, তারা বড়জোর ২টা।"
  - সাধারণ (default): "আসল খেলা। ৩টা বল, প্রথম হাঁড়ি পর্যন্ত পথ দেখায়।"
  - কঠিন: "ছোট লাঠি, জোরে বল, ২টা বল। শুধু একটা ছোট তীর।"
- **Story (first run only, hold to skip, never on a friend's link):**
  1. "বৈশাখের মেলা। রহিম চাচার দোকানে দড়িতে ঝুলছে নকশা-আঁকা হাঁড়ি।"
  2. "এক টাকায় তিনটা বল। যত হাঁড়ি ভাঙবে, তত হাততালি।"
  3. "তাক করো, ছোড়ো। বল ফিরলে লাঠিতে ধরো।"
  A tap shows the next; holding the corner button 0.6 s skips all three. Remembered in `ektukhani-intro-handi-bhanga`.

## Screens
- **Title:** the stall's sky and awning behind. The biggest thing is a painted হাঁড়ি hanging from a rope with **খেলো** on its belly, swaying. Tap it to start. Under it: the মেলা and stall line with its one new thing and the star rule; the three mode chips with the chosen one's line; সব লেভেল ★ n/৩৬. A friend's challenge sits on top.
- **Level list (a choice screen, play is paused):** three মেলা of four, numbered ১–১২ (keys 1–9), each with its name, one new thing and stars. Finales are marked শেষ দোকান; the next stall to play is marked এটা খেলো; locked ones are dim with a lock.
- **HUD (a row above the stall, corners only):** top-left the stall badge (opens সব লেভেল); top-right the score and the balls left as little cloth balls; top-centre the মটকা's named bar in a finale (a শেষ ডাক chip takes the name's place once the bell rings), or the chip alone in a plain stall. A thin line under the row shows pots broken. "+১৫" chips float up from each pot, and "এক ছোড়ায় ×৩" appears from three pots in one flight. On stall 1 a one-line hint sits in the sky until the first throw (touch or keys, by device).
- **The camera:** the whole stall from the bunting to the floor fits as big as the box allows, the floor at the bottom, the fair (a নাগরদোলা, hills, tents) in the sky above the awning.
- **Danger at the edges:**
  - the last ball: the stall's frame glows orange and pulses (a still border in ধীরে খেলো);
  - a falling ball the লাঠি won't reach: the bottom edge glows on that side and a chevron on the floor marks where it will land;
  - wind: an arrow and a blue glow on the side it blows from.
- **Finales:** the মটকা is drawn big with its own name and bar; each hit cracks it further, and its fall shatters into a shower of shards with a heavier hit-stop.
- **End screen:** a slip under a smaller stall (the camera pulls in to the awning and the ropes): the kicker ("লেভেল ৪ পার · রহিম চাচার মটকা" or "বল শেষ"), stars that pop with chimes, the score counting up, then real stats (হাঁড়ি, এক ছোড়ায় সর্বোচ্চ, বল হারানো, ছোড়া, সময়), the near-miss line ("একটা বলও না হারালে ৩ তারা"), this phone's best, and numbered choices: ১ পরের লেভেল (এটাই ভালো), ২ আবার খেলো, ৩ সব লেভেল. Keys 1–3, Enter and R work only from a fresh press. "কার্ডটা দেখো ↓" scrolls inside the stage.
- **Card:** the stall card as before (awning, a rope of five pots broken in proportion, shards, the লাঠি on the floor), now in the stall's মেলা colours with its name and stars; a finale hangs its মটকা in the middle, cracked by how far you got, or shattered after a clear. `#og=1` shows a finished stall 4 for the share-image script.

## Sound (only `shared/game-sound.ts`)
1. **Throw:** a cloth swish. You see the ball leave and the aim dots vanish.
2. **Tock:** the ball on bamboo. You see the লাঠি squash.
3. **Crack ring:** a tough pot or the মটকা rings and swings. You see the crack.
4. **Smash (signature):** a clay crash over a low knock; bigger pots go lower, and a run of pots in one flight climbs in pitch. You see the shards, the hit-stop and "+১৫".
5. **Firecracker:** a crackle of pops. You see the flash and the neighbours crack.
6. **The bell:** two brass strikes for শেষ ডাক and at a clear. You see the শেষ ডাক chip and the dashed ring on the target.
- **The wind loop** plays on wind stalls while you play with sound on; it stops on pause, the end, a hidden tab and unmount, and comes back with sound or resume.
- Each মেলা opens with a four-note motif (scheduled tones, cut by pause).

## Comfort and controls
- **ধীরে খেলো:** the ball and the stall's clock run at 0.7×; no shake, hit-stop, slow-motion zoom, rope recoil or pulsing edges. It is an access setting: a slower ball is easier to return, and the design accepts that. The card never says which was used.
- **Touch and mouse:** while the ball sits on the লাঠি, touch a pot (or any point above the ball) to aim at it, or slide sideways anywhere to turn the aim; lift to throw. A still tap low on the stall throws along the suggested aim. While the ball flies, slide anywhere and the লাঠি follows (1.25× the finger, so the thumb never covers it). Everything acts on pointerdown; the first tap after চালিয়ে যাও only wakes the game.
- **Keys:** ← → turn the aim while the ball rests and move the লাঠি while it flies; Space, Enter or ↑ throws (fresh presses only). P opens the player's pause; Escape belongs to the player. On the end screen 1–3, Enter and R work from a fresh press only.
- **Away:** blur, hide, the menu and the level list release every key and drag (an aim in progress is dropped, never thrown) and stop the clock, the ball and the wind.
- **Kept for compatibility:**
  - links `s`, `t`, `l`, `n`: links without `v` open the old stall `l` (1–10, none is 1) with the old rules. New links add `v=2`, `l` (1–12), `d=e|h`, `p` (pots) and `b` (balls lost).
  - `ektukhani-levels-handi-bhanga` keeps its level numbers, so what was open stays open; the pre-levels best still moves into stall 1 once (`migrateBest`).
  - A friend's far stall you clear records its stars in `ektukhani-ahead-handi-bhanga` and opens nothing in between.
  - This phone's best per stall in `ektukhani-bests-handi-bhanga`; the mode in `ektukhani-mode-handi-bhanga`.
  - The tally id, `/handi-bhanga`, the title rules and the H1.

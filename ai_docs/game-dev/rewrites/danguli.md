# ডাংগুলি: rewrite design

## Core
- **Concept:** the old field game in three places, a পাড়ার মাঠ, a নদীর চর and a বর্ষার মাঠ. Twelve neighbours set a score in ডাং; three hits to beat it.
- **Fantasy:** the kid whose কাঠি flies over the pond, past the captain's hands, and lands where the whole পাড়া starts counting "এক ডাং, দুই ডাং…".
- **Loop:** flick → strike → count. One tap pops the কাঠি off the hole. A second tap as it falls through the yellow band sends it. Then you count how far it went, ডাং by ডাং.

## The strike and the flight
- **Two taps, judged at the touch.** The first tap flicks; the কাঠি rises and falls (deterministic per hit). A tap on the way down meets it at that height; a tap while it still rises meets only air; no tap and it lands (০ ডাং).
- **Where in the band decides the shot.** Early (the band's upper half) is **উঁচু**: steep, carries far in the air, feels the wind, and a fielder can catch it. Late (the lower half) is **নিচু**: flat, skims the grass and rolls, never catchable, barely touched by wind. The thin gold line in the middle is the strongest strike (সোনালি মার). Outside the band but within reach is a weak touch.
- **Weight:** `lib/round.ts` integrates the flight once at the strike (gravity, quadratic drag, wind that is weaker near the ground, a gust that arrives mid-flight), then bounces and rolls it on grass, sand or wet grass, into a preallocated path. `step.hot.ts` only walks along it. Same seed and taps, same result on every phone. A 3-step hit-stop on contact.
- **Counting:** while it flies, the ডাং under the কাঠি tick up on its label; every 5 ডাং peg it passes ticks. When it stops, the number settles and the call line says where it ended.

## Progression: 3 মাঠ × 4 neighbours (12 levels)
Each level adds one element; each মাঠ ends with a named finale.

| # | Neighbour | The one new thing |
|---|---|---|
| **পাড়ার মাঠ** · afternoon, green and gold, huts and a mango tree |||
| 1 | পাশের বাসার টুটুল | Flick, then strike in the yellow band. One decent hit beats him (10 ডাং). |
| 2 | দোকানের রনি | **Fielders.** They catch উঁচু মার that come down within their dashed ring. নিচু মার can't be caught. |
| 3 | ক্লাসের মিলি | **The pond.** A কাঠি in the water counts only to the near bank; a নিচু মার rolls in. Clear it with উঁচু. |
| 4 | **Finale: পাড়ার ক্যাপ্টেন সাকিব ভাই** | **সাকিব ভাইয়ের দৌড়:** after each hit he runs to where it came down. Don't send two the same way. |
| **নদীর চর** · sunset over the river, sand, boats |||
| 5 | মাঝির ছেলে রাজু | **Wind.** The গামছা shows it, per hit. Behind you: go উঁচু. In your face: go নিচু. |
| 6 | চরের শিউলি | **Sand.** A কাঠি stops dead in sand. Carry it over with উঁচু. |
| 7 | ঘুড়ি-পাগল জনি | **Gusts.** Chevrons at the edge before the flick; mid-flight the gust pushes an উঁচু মার hard. |
| 8 | **Finale: চরের সর্দার বাবলু ভাই** | **বাবলু ভাইয়ের লম্বা হাত:** a deep fielder whose dashed ring is three times wider. Under it, or past it with the wind. |
| **বর্ষার মাঠ** · monsoon, grey sky, rain, puddles |||
| 9 | চায়ের দোকানের বাবু | **Wet grass.** A নিচু মার skids twice as far on it. |
| 10 | কলেজপড়ুয়া রিয়া আপু | **A wet কাঠি.** It pops lower and falls faster: the band passes in a blink. |
| 11 | ক্রিকেট ক্লাবের শুভ ভাই | **Walking fielders.** They pace; flick when they're away from where you'll land. |
| 12 | **Finale: ওস্তাদ রহিম চাচা** | **কালবৈশাখী:** the wind turns every hit and every hit has a gust. |

- **Win:** total of three hits beats the neighbour's score. **Stars:** 1 for the win, 2 and 3 at fixed totals per level (in `lib/levels.ts`).
- **Bots (`tests/levels.test.ts`, 60 seeds a level):** casual (±60 ms, picks upper/lower half 60% right), steady (±40 ms, reads 80%), sharp (±25 ms, reads 95%), and a masher.
  - casual wins level 1 ≥ 97% and passes the score within 10 s; every world-1 level ≥ 55%;
  - steady wins every level ≥ 60%; the last level 50–90%;
  - sharp wins every level ≥ 90% and earns 3 stars on most;
  - each finale is harder for casual than its world's first level;
  - the masher never wins past level 1;
  - reading the field matters: on levels 2, 3, 6 and 9 a reader beats a player who always aims the middle.

## Difficulty and story
- **Modes (title chips, remembered):**
  - সহজ: "হলুদ দাগ চওড়া, কাঠি ধীরে নামে। তারা বড়জোর ২টা।"
  - সাধারণ (default): "আসল খেলা। তিন মারেই মাপমতো চাপতে হবে।"
  - কঠিন: "হলুদ দাগ সরু। তারার হিসাব একই।"
- **Story (first run only, never on a friend's link; tap for the next, hold the corner 0.6 s to skip):**
  1. "চৈত্রের বিকেল। স্কুল ছুটি, মাঠ ফাঁকা।"
  2. "মাটিতে ছোট গর্ত, ওপরে কাঠি। হাতে লম্বা ডাং।"
  3. "একবার চাপলে কাঠি লাফায়। নামার সময় হলুদে আবার চাপো।"

## Screens
- **Title:** the field dimmed behind; the biggest thing is a code-drawn ডাং and কাঠি over the hole on a patch of grass, **খেলো** across the ডাং. Under it: মাঠ and level, the one new thing, the neighbour and their score, the three mode chips with the chosen line, "সব লেভেল ★ ৭/৩৬". A friend's challenge sits on top.
- **Level list (a choice screen; play pauses behind it):** three মাঠ of four, numbered ১–১২ (keys 1–9, 0, -, =). Each row: neighbour, the one new thing, stars. The next to play is **এটা খেলো**; finales carry **শেষ খেলা**; locked rows are dim with a lock shape.
- **HUD (a row above the field):** top-left the level badge and mode; top-centre three hit chips (১ম ২৪ · ২য় — · ৩য় —); top-right the total against the score (২৪ / ৩০), turning gold when passed. In a finale the move's name sits under the chips.
- **The call line under the field** carries every word during play. On the field there are only the পেগ numbers, the ডাং label on the কাঠি, the dashed catch rings and the band.
- **The tap pad** under the call: one big area that says what the next tap does (কাঠি তোলো / মারো!) with the band's two halves drawn (উঁচু, নিচু). Taps anywhere on the field or the pad count.
- **Edges:** fielders and the pond beyond the screen show as pointers at the right edge with their distance; a gust coming shows chevrons at the edge it blows towards; the কাঠি falling past the band's bottom turns the field's bottom edge red; the last hit when you still need more than a good hit gives an orange rim. ধীরে খেলো makes them steady borders.
- **Feel:** the first tap answers in the same frame (the কাঠি jumps, a wooden tick); a strike stops 3 frames, cracks (pitch by power), a gold strike flashes a ring and shakes a little; dust or a splash where it lands; the kids on the side cheer or groan; the captain sprints.
- **End screen (the field stays above):** "লেভেল ৩ পার · ক্লাসের মিলি", stars pop with chimes, the total counts up against the score, then real stats: সোনালি মার n/৩, সবচেয়ে দূরের মার, উঁচু/নিচু, ক্যাচ, পুকুরে, and in finales the move ("সাকিব ভাইকে এড়িয়েছ ২/৩"). Near-miss line, then numbered choices: ১ পরের লেভেল (**এটাই ভালো**), ২ আবার খেলো, ৩ সব লেভেল. A loss: "মিলি জিতল, ৩৬ বনাম ২৯", one exact tip from how most ডাং were lost. Keys only from a fresh press after the screen appears.
- **Card:** the old card kept (score in ডাং, the three arcs on the same field, chips), now in the মাঠ's palette with its name and level.

## Sound (`shared/game-sound.ts` only)
1. **Signature: the wooden knock** of ডাং on কাঠি, pitch by power; gold rings higher with a second partial. Seen as the hit-stop and the ring.
2. **The flick:** a light tick. Seen as the কাঠি jumping.
3. **Landing:** a thud on grass, a soft shff on sand, a splash in the pond. Seen as dust, sand or a ring of water.
4. **The count:** a tick at each 5 ডাং peg. Seen as the label.
5. **The kids:** an "ওওও" for a big hit, a groan for a catch. Seen as their poses.
6. **Wind loop** on windy levels, louder with the push; a whoosh before a gust. Seen as the গামছা and the chevrons.

A four-note tune per মাঠ opens each round; the win plays it an octave up with a chime per star. All scheduled `tone`s (a pause cuts them). The wind loop stops on pause, the end, a hidden tab, blur and unmount, and a fresh one starts when sound comes back.

## Comfort and controls
- **ধীরে খেলো:** the round runs at 0.8×, and the band shrinks by the same 0.8, so the band lasts the same real milliseconds: more time to see, not an easier strike. No shake, flashes, dust or rain streaks; steady edge borders; the end numbers show at once. Stars are earned the same way.
- **Touch / mouse:** tap anywhere on the field or the pad (pointerdown). **Keys:** Space, Enter or ↑ (fresh presses only; a held key acts once). P opens the player's menu. On the end screen 1–3, Enter and R. The click that brings focus back is never a flick or a strike.
- Pause, sound and ধীরে খেলো live in the player's menu; the game has no toggles of its own.
- **Kept for compatibility:**
  - links keep `#s=&t=&h=&l=&n=`. New links add `v=2` and `d=e|h`. A link without `v` is from the old 10-level ladder: its level maps to the same place on the new one (`round(l × 12 / 10)`, so 1 stays 1 and 10 becomes 12), and its score stays the friend's own claim;
  - `ektukhani-levels-danguli` is migrated once to the new numbers by the same map (and the oldest single best, `ektukhani-best-danguli`, into level 1 when nothing newer exists); `ektukhani-unlock-danguli` keeps this game's own unlock, so a friend's far-ahead level records its stars without opening the levels between;
  - the URL, the share id (`danguli`), the title, the H1 (kicker plus headline) and the card format.

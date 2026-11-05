# ক্যারম: rewrite design

## Core
- **Concept:** the পাড়ার ক্লাবঘর carrom board on a phone: pull back, let go, টুপ.
- **Fantasy:** the powder is down and the bulb is on. The older boys stop talking and watch your striker, from the club room in the first world to the tournament final under the hall lights.
- **Loop:** বসাও (slide the striker along the line) → টানো (pull back to aim and set power) → টুপ (a coin drops; the board answers).

## Progression
Three worlds of five boards (`lib/levels.ts`). Each board is hand-placed data: white coins to clear, sometimes black coins and the queen, a strike budget, a 3-star par and the first strike's spot and aim. A board is cleared when every white coin is in (and the queen is covered, where there is one). Stars come from strikes used: par or fewer gives ★★★, a little more gives ★★, and any clear gives ★.

| # | World · board | The one new thing |
|---|---|---|
| 1 | ক্লাবঘর · টানো, ছাড়ো | Pull back and let go. The aim is already set, so the first coin drops within 10 s. |
| 2 | সরাও | Slide the striker. The straight line only exists from the other end of the baseline. |
| 3 | কোণাকুণি | The cut. No straight line exists, and the guide shows where the coin goes. |
| 4 | আস্তে | The foul. A hard straight shot sends the striker after the coin, and a coin comes back. |
| 5 | **মন্টু ভাইয়ের বোর্ড** (finale) | Five coins, everything so far. Montu bhai's record is the par. |
| 6 | চায়ের দোকান · কালো গুটি | Black coins are in the way. One in costs a strike. |
| 7 | কুশন | The bank shot. The straight path is blocked, and the guide shows the bounce. |
| 8 | নিচের গর্ত | The near pockets. Coins beside you go down, not up. |
| 9 | কুইন | The queen, then a white in the same or the next strike to cover her. |
| 10 | **মতিন চাচার বোর্ড** (finale) | The queen, whites and blacks together. |
| 11 | টুর্নামেন্ট · ভাঙা | The full opening pattern. Break the pack and drop three whites. |
| 12 | ভিড় | A tight cluster that needs a firm touch to open it. |
| 13 | লম্বা টোকা | Far pockets across an open board, where power control matters. |
| 14 | পুরো বোর্ড | The pattern again: three whites, and now the queen to cover. |
| 15 | **টুর্নামেন্টের ফাইনাল** (finale) | All nine whites and the queen. |

Two more ways to play stay from the old game:
- **দশ চাল:** a seeded scatter and ten strikes for points. This is what old challenge links open.
- **দুজনে:** our house rules on one phone.

**Bot targets (`tests/levels.test.ts`, measured on fixed seeds):**
- The bots are a casual one (1.2° aim error after the damped pull, 14% power error, a second-best shot 35% of the time) and a careful one (0.6°, 8%, and it thinks ahead over its best four).
- Board 1: casual 100% (40 runs), almost always ★★★ in one strike.
- World 1 boards: casual at least 75% each (measured 80–100%); careful at least 85% (90–100%).
- World 2: careful at least 75% each (80–100%).
- World 3: careful at least 60% on boards 11–14 (95–100%). The final on ওস্তাদ falls between 20% and 75% (measured 33%).
- সহজ really is easier: casual stars on boards 3, 9, 10 and 12 are more than one star higher in total than on মাঝারি.

## Difficulty and story
The difficulty is how much the guide shows. Stars are the same on every difficulty, and the end screen and the card name it.
- **সহজ:** "বড় স্ট্রাইকার, গুটি কোন গর্তে যাবে তাও দেখায়". The coin's path is drawn to the pocket and turns gold when it will drop. The aim snaps to a sure line within 2.5°. The striker is the big one.
- **মাঝারি (সুপারিশ):** "স্ট্রাইকার কোথায় লাগবে আর গুটি কোন দিকে যাবে". The ghost striker is drawn with a short arrow for the coin, and the aim snaps within 1°.
- **ওস্তাদ:** "শুধু একটা ছোট তীর". There's no guide and no snap.

The difficulty replaces the old নিশানা রেখা and বড় স্ট্রাইকার toggles; old choices migrate once. It changes only on the title, never during a strike.

**Story:** no intro panels, because the first coin should drop within 10 seconds. The world is told by the boards: the club room, the tea stall, the tournament hall. Each finale has a named opponent and one dry line about their record.

## Screens
- **Title (start card):** the board shows dimmed behind a cream card.
  - The biggest thing is the striker drawn as a button, with **শুরু করো** on it.
  - Under it, small: the mode chips (একা · দশ চাল · দুজনে), the difficulty chips (১ সহজ · ২ মাঝারি · ৩ ওস্তাদ) with their one line, and ‹ বোর্ড ৩ · কোণাকুণি › with its lesson line and par.
  - A friend's link shows their card tilted, with the honest label.
- **Choice moments:**
  - সব বোর্ড: three worlds, numbered boards with stars, locks, and **এটা খেলো** on the recommended one. Opening it pauses.
  - The end screen: পরের বোর্ড (Enter, primary), আবার খেলো (R) and সব বোর্ড.
  - The title chips, keyed 1–3.
- **HUD (corners only):**
  - top-left: the board badge, which opens সব বোর্ড;
  - top-right: the strikes left as striker pips, and the whites left;
  - a thin bar along the board's top edge for whites cleared. In a finale it becomes the opponent's named bar ("মন্টু ভাই · ৫ চাল").
  - The one-line hint sits under the board, never over it.
- **Danger at the edge:** on the last strike the frame glows orange and pulses; in ধীরে খেলো it is a still orange border. A foul shakes the board 6 px, and ধীরে খেলো turns the shake off.
- **Finale:** a red "শেষ বোর্ড" badge on the start card, the opponent's line, a brass frame and the named bar.
- **End screen:** a slip rises over the lower board.
  - The title line ("বোর্ড সাফ, ৪ চালে" or "আর ১টা বাকি ছিল").
  - StarReveal.
  - Stats count up: চাল, গুটি, এক টোকায় সর্বোচ্চ, ফাউল.
  - The exact near-miss line ("আর ১ চাল কম হলে ৩ তারা"), the best on this phone, then the buttons.
- **Card:** the board as it started, with the pieces you sank drawn in the pockets. It shows "৪ চালে সাফ ★★★" with the board's name and the difficulty. দশ চাল and দুজনে keep their cards.

## Sound (`components/sound.ts`, only `shared/game-sound.ts`)
1. **টুপ (signature):** a hollow wooden drop into the net. It rises in pitch for a second or third coin in one strike.
2. **Click:** the striker leaves the finger.
3. **Clack:** disc on disc, louder for a harder hit.
4. **Thump:** off the cushion.
5. **Queen chime:** when the queen drops, and a brighter one when she's covered.
6. **The pull's hum:** a loop whose pitch follows power. It plays only while you pull or hold and the board is on screen. It stops on pause, blur, hide, the end and unmount, and it comes back when sound is turned on mid-pull.

Every sound has a visible twin: the pocket ring and "+১", the power ring's colour, "ফাউল!" in red with the shake, and the queen badge.

## Comfort and controls
- **ধীরে খেলো:**
  - discs roll at half speed (the same 60 Hz steps, fewer each second, so results are identical);
  - the power meter swings at half speed, an explicit comfort choice, while the star thresholds stay the same;
  - no shake, no pop lift, no confetti, no pulsing edge.
- **Touch:**
  - drag the striker sideways, or use the wood strip under the board;
  - pull back anywhere on the board and let go to strike, or bring the finger back to cancel;
  - tap a spot to aim at it;
  - ◀ ▶ nudge the aim, or hold them to turn;
  - tap **মারো** to strike at the ring's power, or hold it to swing the power and let go.
- **Keyboard:**
  - ← → aim (hold to turn), and Shift+← → or A/D move the striker;
  - hold Space or Enter for power and release to strike; a held key's keyup is always honoured;
  - 1–3 pick the difficulty on the title, and P opens the player's pause menu.
  - On the result, Enter and R work only from a fresh press. Escape belongs to the player.
- **Mouse:** the same as touch.
- **Kept for compatibility:**
  - `/carrom`, its title and H1, and the description wording rules;
  - links `s t q n l m w o`. Old `l` boards and links without `l` open the same দশ চাল scatter as before. New level links add `c` (board) and `d` (difficulty), with `t` as the strikes used;
  - `ektukhani-levels-carrom` stars;
  - a new own-unlock key `ektukhani-carrom-open`, migrated once from the unbroken run of cleared boards;
  - `ektukhani-carrom-hand`, migrated once from `ektukhani-carrom-assist` and `ektukhani-carrom-big`;
  - the old best keys, and the pre-boards best migrated to board 1 once;
  - no tally.

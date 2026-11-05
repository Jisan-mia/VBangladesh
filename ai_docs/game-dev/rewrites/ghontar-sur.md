# ঘণ্টার সুর: rewrite design

## Core
- **Concept:** the old "echo the tune" game, played on brass bells hung from a bamboo beam at a village fair. The bells ring a tune, you ring it back. The pots of the first version are gone: this is the ঘণ্টা of the name.
- **Fantasy:** you are the kid at the ঘণ্টাওয়ালা's stall who hears a tune once and plays it back without a slip.
- **Loop:** শোনো (the bells ring and light up, one by one) → মনে রাখো (the quiet before your turn) → বাজাও (ring them back in the same order, or the same tal, or backwards).

## Progression: 3 worlds × 8 levels, 24 tunes (the old 10 level numbers and the stars on them stay)
A level is one tune cut into phrases. Round 1 plays phrase one, round 2 plays phrases one and two, and so on; you answer the whole of each round. Each world brings one twist, each level adds exactly one thing (shown on the start card as **নতুন** with a before → after chip), and the eighth level is the world's named finale: a hand-written tune of 12 (or 9) notes, played back to you on the bells when you clear it.

| World (wall) | Twist | Levels 1–7 add, in order | Finale (8) |
|---|---|---|---|
| ১ মেলার গেট (cream, bunting) | only the order counts | 3 bells, 3 notes → a 4th bell → two phrases (6 notes) → faster → a 5th bell → the same bell twice in a row → three phrases (9) | **মেলার ঘণ্টা**, 12 notes in 4 phrases |
| ২ বটতলার আসর (banyan green) | your tal is graded too: ring each bell as far after the last as the call did | the tal (4 notes) → two phrases → a rest (one silent beat in the tune) → faster → a 5th bell → two rests → three phrases | **যাত্রাপালার ডাক**, 12 notes with two rests |
| ৩ রাতের মেলা (night indigo) | the answer is the call backwards (call and answer): last bell first | 3 notes reversed → one note longer (4) → a 4th bell → a 5th bell → faster → two phrases (6) → the same bell twice | **শেষ রাতের সাড়া**, 9 notes reversed in 3 phrases |

- Levels are data in `lib/levels.ts`; tunes are seeded (`makeRng`), so a link replays the same tune. Only finales are written by hand; every other level gets a fresh seeded tune each play, with no bell three times running, the newest bell always in it, a repeat where the level teaches the repeat, and rests only inside a phrase.
- **Stars:** ★ for clearing, ★★ with one slip, ★★★ with none. On tal levels ★★★ also needs 80% of the graded notes on the beat. **Points** for the end screen and friends: 10 a note (15 with the tal), +20 for a round with no slip.
- **Bot targets (`tests/bot.ts`, 200 seeds a level, asserted in `tests/rewrite.test.ts`):** a casual bot (holds about 5 notes) clears level 1 ≥ 99%, the first four levels of each world ≥ 80%, every other level ≥ 25% and every finale ≥ 5%; a steady bot (about 7–8) clears every level ≥ 88% and every finale ≥ 60%, and each finale is the hardest in its world for it; a strong bot (about 10) clears everything ≥ 97%, gets ★★★ on every other level ≥ 60% and on each finale 35–85%. A first win on level 1 comes within 10 s of the tap.
- **Endless and the daily tune (kept):** four bells, the tune grows by one note a round, the third slip ends it, 99 notes win. The same bells and the same engine; the old speed ladder (760 ms down to 400). The daily tune is the same run with the Dhaka date as its seed. Both are small chips under the title.

## Difficulty and story
- **The ladder is the difficulty.** Three hearts (ভুল করার সুযোগ ৩) a level. The start card says what changes in plain words. No separate modes.
- **Story (first run only, 3 panels, hold the corner button 0.6 s to skip):** 1 "মেলার গেটে আজ ঘণ্টাঘর খুলেছে…" (three bells on the beam) → 2 "ঘণ্টাওয়ালা চাচা একটা সুর বাজান…" (bells light one by one) → 3 "তুমি শুনে রাখো, তারপর একই সুর বাজাও…" (a finger taps). Seen flag in `ektukhani-ghontar-sur-intro`.

## Screens
- **Title:** the stage is the bell rack, and the biggest thing on it is one huge brass bell, swinging gently, with a brass plaque **শুরু করো**. Tapping it strikes the biggest bell (the signature, with a long shimmer). Under it: ‹ লেভেল ৩ · মেলার গেট ›, the **নতুন** line with before → after chips ("ঘণ্টা ৪ → ৫"), the facts, stars so far, সব লেভেল, and three small chips: **লেভেল · অন্তহীন · রোজের সুর**, each with its one-line consequence. A friend's link shows their card and claim on top.
- **Call:** "শোনো…", then each bell lights (the whole column glows in the bell's own colour, the number grows) and swings as it rings. A strip of dots under the bells fills as the notes play. Never faster than 2.5 flashes a second.
- **Your turn:** "এবার তুমি বাজাও · ২/৬" (or "তালে তালে বাজাও", or "উল্টো ক্রমে বাজাও"). A tap lights, swings and sounds in the same event. The dots fill with what you rang (from the right on reverse levels). On tal levels each tap shows a pill under the bell: ✓ তালে, ← আগে, দেরি →.
- **A slip (the mistake that teaches):** a dull clank, your bell flashes red with a ✗, the right bell glows with an **এটা** ring, and the line reads "৩ নম্বর সুরে ২ নম্বর ঘণ্টা ছিল। আবার শোনো।". One heart goes, the call plays again from the lead-in.
- **Choice moments, all of which pause:** সব লেভেল (from the HUD badge, the title or the pause menu) shows the three worlds, numbered levels with stars, locks, finales marked and **এটা খেলো** on the recommended level. The end screen has three numbered choices with the first marked **এটাই ভালো**.
- **HUD (corners only):** top-left the level badge (opens সব লেভেল); top-centre the round pips (or on a finale the boss bar with the tune's name, a segment knocked out per phrase); top-right hearts and points. The middle of the rack stays clear.
- **Danger at the edge:** on the last heart the stage edge glows orange and the heart beats (a still border in ধীরে খেলো). No popup.
- **Finale:** the tune is written, named and played back through the bells when you clear it (an encore of about 7 s; tap to skip), confetti on the first clear, a stamp on the end screen.
- **End screen (ঘণ্টাওয়ালার খাতা):** the tune as a strip of numbered bells (rests as gaps; on a loss, the tune you were on, so you see what slipped), ★ stamped in with chimes, points counting up, and real stats: সুর, ভুল, তালে (or সেরা টানা), শোনা (how many times you heard it). Then the exact near-miss line ("একটাও ভুল না হলে ৩ তারা", "আর ২টা ঘণ্টা তালে পড়লে ৩ তারা"), your best, and ১ পরের লেভেল · ২ আবার খেলো · ৩ সব লেভেল (keys 1–3 or Enter, fresh presses only). Below, কার্ড বানাও ↓ scrolls inside the stage to the card.
- **Card:** the level's bells on a bamboo beam under paper flags, points, stars and a line naming the world or the finale. Endless runs keep the old "N টা সুর" card.

## Sound (only `shared/game-sound.ts`)
1. **The bell টুং (the signature):** a round brass note that sags a little, two bright overtones and the clapper's knock; five bells on a pentatonic scale, the biggest lowest. Seen as the bell lighting and swinging. 3 oscillators a note.
2. **The title bell:** the biggest bell struck hard with a long shimmer. Seen as the huge bell swinging off.
3. **The slip:** a dull clank with no pitch of the bells. Seen as the red ✗ and the shake.
4. **Round right:** two quick notes up, a step higher each round. Seen as the dots filling and the pips.
5. **The clear ident:** three notes (four for ★★★ or a finale) in the world's key. Seen as the stars.
6. **The finale tune:** the bells themselves.

There is no loop: the melody is the sound, and every note is lit. Long sounds are scheduled with `tone(…, delay)`, so the player's pause cuts them.

## Comfort and controls
- **ধীরে খেলো:** the bells don't swing, the edge border and hearts don't pulse, nothing floats; the call is 1.5× slower with a longer quiet around it, the end count shows at once. Your tal is judged against the call's own gaps, which are slower too, so stars are earned the same way (the FAQ says so).
- **Touch and mouse:** tap the big bell to start, tap a bell to ring it. During the call, taps do nothing (the bell only dips). A click that brings focus back only resumes.
- **Keyboard:** Enter or Space starts and skips the encore; 1–5 (or ১–৫) ring the bells; P opens the player's pause menu; on the end screen 1–3 and Enter, fresh presses only.
- **Pause:** the player's menu (blur, hide, Esc, ⏸, P). The clock freezes. A call you were away for starts over from its lead-in when you come back; every other phase carries on. Outside the player, a cover with চালিয়ে যাও covers the bells.
- **Kept for compatibility:**
  - Links `#s=&t=&n=` are endless runs, exactly as before (the old tune and speed are pinned byte for byte in `lib/legacy.ts`). A level link adds `l=<level>&v=2`; the level and tune open from their first note. A level link with a score no run could earn is refused.
  - `ektukhani-levels-ghontar-sur` stars stay (levels 1–10 carry over; none shrink); your own open level moves to `ektukhani-ghontar-sur-open`, migrated once from the old unlock rule, and a friend's far-ahead level records its stars but opens nothing in between.
  - Endless bests stay in `ektukhani-best-ghontar-sur` and `…-day-<date>`; each level's best points live in `ektukhani-best-ghontar-sur-<level>`.
  - The URL `/ghontar-sur`, the title and the tally rule (none) are unchanged; the H1 and the description now say ঘণ্টা, not কলসি.

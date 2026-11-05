# দশ ঘাটের নৌকা: rewrite design

## Core
- **Concept:** a boat race along a river bank of numbered ghats. Spin the চরকি (১, ২ or ৩ dots), tap that many ghats in order, and your boat hops to each one while its number rises over it. আব্বু's boat races beside you.
- **Fantasy:** a নৌকাবাইচ on a village river, at dawn, noon and dusk. You are the one who counts the boat home.
- **Loop (3 verbs):** ঘোরাও (spin) → গোনো (tap each ghat) → পৌঁছাও (the boat hops to the flag).

## Who it is for
ছোটদের জন্য, ৩–৬ বছর. The kids' brief wins: no clock, no lives, nothing red, ≥ 96 px targets, no reading needed (the dots on the চরকি, the glowing ghat, a ghost finger and the hop carry the meaning). **No voice anywhere**: every cue is a picture, a motion or a sound effect. Stars record how cleanly the child counted, never who won.

## What changed, and why (the statechart's gaps)
- **No more waiting.** আব্বু's boat now races *at the same time*: his চরকি spins when yours does, and his boat hops on its own beat (0.42 s a ghat) while you count. The child never waits for a turn. A 10-ghat race falls from 25–30 s of waiting to about 20 s of counting; level 1 (5 ghats, no rival) is done in about 7 s.
- **One bank, the controls out of the play area.** The mode choice (ফোন চালাবে / পালা করে খেলব) moved to the title and applies from the next race, so tapping it can never wipe a race. The play screen has the river, the ghats and the চরকি only.
- **Everything runs on one fixed-step clock** (`useGameLoop`), so a pause, a blur or a hidden tab freezes both boats. No `setTimeout` in play.
- **Equal end buttons:** আবার খেলো and শেষ are two 112 px picture buttons of the same size.

## Progression: 3 worlds, 10 levels (each level adds one thing)
Ids 1–5 keep their old meaning (saved stars stay valid); 6–10 are new. The list shows them in play order ১–১০.

| # | id | World (palette) | Level | The one new thing |
|---|---|---|---|---|
| ১ | 6 | **ভোরের ঘাট** (dawn: peach sky, rising sun) | পাঁচ ঘাট | ঘোরাও, গোনো. 5 ghats, no rival, glowing ghat, ghost finger. First win in about 7 s. |
| ২ | 1 | | আব্বুর নৌকা | A second boat races beside you. 10 ghats, glow. |
| ৩ | 2 | | নিজে গুনে | No glow. After a wrong tap a dashed ring, after two the ghat glows. |
| ৪ | 7 | | **ভোরের বাইচ** (finale) | The চরকি gets a third face (৩). |
| ৫ | 3 | **দুপুরের নদী** (noon: blue sky, white clouds) | আগে ভাবো | Predict: tap the ghat where the boat will stop, then it counts there by itself. |
| ৬ | 4 | | বিশ ঘাট | The river grows to 20 (এগারো … বিশ), one ghat at a time again. |
| ৭ | 5 | | **মেলার ঘাট** (finale) | Predict on 20 ghats with the ৩ face, flags and a festival gate. |
| ৮ | 8 | **সন্ধ্যার ঘাট** (dusk: violet sky, lanterns) | ফিরতি পথ | Counting back: the boats start at দশ and sail home to ১. |
| ৯ | 9 | | বিশ থেকে ফেরা | Counting back from বিশ, no glow. |
| ১০ | 10 | | **সন্ধ্যার বাইচ** (finale) | Back from বিশ, predict, ৩ face. |

Quiet ease (kids' brief): three wrong taps in a row turn the glow on and make a predict level count one ghat at a time; five right in a row take it away again. Never announced.

## Difficulty and story
- **Modes (title, small, remembered on the phone):** *ফোন চালাবে*: আব্বু's boat is the phone's, and it races at once. *পালা করে*: a grown-up sails the second boat by turns on the same ghats; no waiting is hidden (each boat has its own turn).
- **Story:** none. The river is the story; each world's finale ends with its own tune and confetti.
- **ধীরে খেলো:** no motion at all (boats jump, the চরকি shows its dots after 0.15 s, no confetti), the same stars.

## Screens
- **Title:** the start action is the biggest thing: the game's own river scene as one button (the চরকি, both boats at the jetty, খেলো). Under it, small: the level chip (opens the list), the mode chips with one line saying what they change.
- **Play (portrait, no page scroll):** HUD corners only: level badge top-left, a river-strip with both boats top-right (a thick bar, not a 1 px line). The river fills the middle: banks, two lanes, ghats at 96 px+. The big চরকি is at the bottom, with the dots it landed on. আব্বু's small চরকি sits on his lane.
- **Edge signals:** when the other boat leaves the view, a small boat chip with an arrow sits at that edge of the water.
- **Choices:** the level list (opened from the title, the end page or the pause menu's সব লেভেল) is a choice screen: nothing runs under it. Cards are numbered ১–১০, show the stars, and the next level says এটা খেলো (RECOMMENDED).
- **Finales:** a named banner on the badge, a festival gate at the last ghat, a four-note world tune and confetti.
- **End:** both boats at their ghats as a picture, 3 stars one by one, two counts that tick up (চরকি, প্রথমবারেই ঠিক), what the child can do now, one task off the screen, then আবার খেলো and শেষ at the same size, then আব্বু-আম্মুকে দেখাও. The card has no name and no share.
- **Parent:** the share link and the note sit behind `ParentGate`, on the title only.

## Sound (shared/game-sound.ts only; mute-first)
`ghat` (a pentatonic note per ghat, rising going up and falling going back), `spin` (a ticking run), `land` (a wooden টুক), `miss` (a soft low boing), `rival` (a quieter note, a fifth above), `arrive` (the signature: a drum thump and a rising triad), `stars`, and each world's `tune` at its finale. Every sound has a picture twin: the number over the boat, the wobble, the dots, the flag.

## Controls and compatibility
- **Touch:** first pointer only, acts on pointerdown (50 ms). **Keyboard:** Space or Enter spins; Tab and Enter press the ghats; P pauses; Escape belongs to the player.
- **Kept:** the slug, SEO URL and H1; `useLevels` key `ektukhani-levels-dosh-ghater-nouka`; no links, no network, no child data. One new key remembers the mode.

# Kids' section design brief (ছোটদের খেলাঘর)

These rules come from `a-development.md` §3, `b-bangladesh.md` §8 and `c-market.md` §3–5. Every kids' tool follows them. Where they differ from the games brief (`research/game-engagement-brief.md`), this brief wins.

## 1. Learning that is real
- **Minds-on, not just finger-on.** Each tap should ask the child to think: count, choose, plan, name. Practise the real skill the child meets in life. Never promise "IQ" or "brain power".
- **One goal per screen.** For ages 3–5, show 2–4 choices, never 6.
- **Sweet-spot difficulty.**
  - Three misses in a row quietly eases the next item.
  - Five right in a row steps it up.
  - Never announce "easy mode".
- **Mistakes are information.**
  - Ages 3–5: a soft wobble or neutral tone, then a hint, then the answer glows after two tries. No buzzer, no red ✕, no lost lives.
  - Ages 6–12: show *why* in one line ("৮ আর ৫ মিলে ১৩, তাই ১২ হবে না"). "আবার চেষ্টা" costs nothing.
- **Praise the method, specifically and rarely.** "ধীরে গুনলে, তাই মিলেছে", never "তুমি জিনিয়াস". No praise for trivial taps.

## 2. Healthy play (no dark patterns, ever)
- **No streaks or comeback pressure.** No streaks, no "come back tomorrow", no losing anything by skipping a day.
- **Nothing that guilts or hurries.** No character that guilts the child ("চলে যাচ্ছ?"). No countdowns at decision points, and no timer at all for ages 3–5. Timers only inside an optional challenge mode for 7+.
- **No lures.** No loot boxes, spinning wheels or mystery chests.
- **No comparison or commerce.** No leaderboards, no comparing with other children, no purchases, no ads.
- **Rewards are informational.** The finished picture, the tune you made, "এখন তুমি X পারো". Stars may record progress (the kit's `useLevels`), but they are never spent, traded or compared.
- **Short rounds with a natural end.** About 1–3 minutes for 3–5, 3–6 for 6–8, up to 10 for 9–12. At the end of a round, show a calm finished screen with **"আবার খেলো"** and **"শেষ"** at equal size. Never auto-start the next level.
- **The daily limit.** `useKidsSession()` from `shared/kids-kit.tsx`. Call `atBreak()` at the end of every round, and when it returns true show `<RestScreen>`. It defaults to 15 minutes a day across the whole section, which the parent can change behind the gate.
- **Celebrate briefly.** A 1–2 second chime and a small animation for a finished round. Confetti only for finishing a whole set or world, not every level. Sound effects stay soft, and there is no background music.
- **Calm visuals.** One focal object, space, and nothing flashing more than 3 times a second.

## 3. Privacy and safety (collect nothing)
- **No child data, no network.**
  - No name field anywhere, and no free-text input for the child.
  - No camera, microphone or location.
  - Nothing about the child in a URL, card, preview or server.
  - **No network calls after the page loads.** No tally, no `/api/*`, no `shared/share-client`, no `fetch`.
  - Progress goes in localStorage only. Losing it costs nothing.
- **No share button in front of the child.** At the end of a round the child sees **`<ShowParentButton>`** ("আব্বু-আম্মুকে দেখাও"), which opens `<ShowParent>`: what was done today, with no name and no photo.
- **Behind `<ParentGate>` only:** sharing the tool's plain link (`<ShareToolLink>`), saving the picture to the phone, session settings, and clearing progress.
- **No outbound links in the child's view.** Sources and links go in the parent note or behind the gate.
- **Safety content shows the safe action, never the harm.** No drowning, fire, crash or injury pictures. A wrong choice gets "আরেকবার ভাবো". Each safety scene has a parent note line with one fact and one action.

## 4. Small hands and pre-readers
- **Touch targets.** At least 2 cm for ages 3–5 (about **96 CSS px**) and 1.5 cm for 6–8 (about **72 CSS px**), with **16 px** gaps. Hit areas are bigger than the drawing. Keep 24 px clear of the screen edges.
- **Gestures.**
  - Tap beats drag. Wherever there is a drag, also allow **tap the item, then tap the place**, and snap generously.
  - No double-tap, long-press (that's the parent gate's), pinch or multi-touch.
  - Act on the first pointer only, and ignore the palm.
- **No reading needed for ages 3–5.**
  - Show instructions with a picture, an animation and a "ghost finger" demonstrating the first tap.
  - Text is for the parent reading aloud.
  - Speech is an extra, never required: `<SpeakButton>` and `speak()` from the kit appear only when the phone has a Bangla voice. Never read Bangla with an English voice.
- **Big Bangla type.**
  - Letters being taught: 64–120 px. Instructions: 20–24 px. Nothing under 16 px.
  - Bangla line-height at least 1.6, and no fixed-height boxes around Bangla.
  - Never `letter-spacing` or per-letter spans on Bangla words. Split by grapheme with `Intl.Segmenter`.
  - Show a lone কার on a dotted circle (◌া), using Bangla digits.
- **Portrait first**, at 320–420 px wide. The game fits one phone screen without scrolling while playing.

## 5. Parent experience
- **The parent note.** `<ParentNote>` sits at the top of the tool: what it teaches, the age, one way to play together, and the school link where relevant. Write it to the parent in the site's তুমি voice, with one concrete co-play prompt.
- **Some games end off-screen.** "এবার আম্মুকে তিনটা গোল জিনিস দেখাও।"
- **Printables.** Where the shortlist says **Print**, a `?print` view gives a clean A4 sheet (browser print).

## 6. Culture and content
- **Bangla.** Bangladeshi চলিত, তুমি voice, Bangladeshi words: পানি, আম্মু/আব্বু, খালা/মামা/চাচা/ফুপু, টিফিন, স্যার/ম্যাডাম. Follow `research/bangla-writing-guide.md`: short, concrete, warm, never preachy, and no moral at the end of a story.
- **Inclusion.** Girls and boys in every role. Children with glasses or a wheelchair appear as an ordinary part of scenes. No colourism. Hill and plains peoples appear as neighbours. Names are mixed (রাফি, নুসরাত, জয়, অর্পিতা, মং, প্রিয়াংকা).
- **Faith.** Every faith equally. Show symbols and food, never deities or prophets. No rulings, and no pork or alcohol.
- **Politics.** No leaders' portraits and nothing on 2024. 1952 and 1971 appear only as dates, places and symbols.
- **Copyright.**
  - Folk rhymes, and authors who died before 1966, only.
  - **No Nazrul or Jasimuddin text, no NCTB textbook text or pictures, and no Meena, Sisimpur or any TV characters or look-alikes.**
  - All art is original, drawn in SVG or canvas.
- **World content.** Accurate, checked against a reliable source (NASA, museums, encyclopedias), with one source line in the parent note. Respectful, with no stereotypes.
- **Mute-first.** Every game works fully silent. Some families avoid music, and children play in shared rooms.

# ছোটদের খেলাঘর: the 25 (October 2026)

These come from three research reports in this folder:
- `a-development.md`: child-development science, 34 ideas;
- `b-bangladesh.md`: curriculum, culture and safety, 43 ideas;
- `c-market.md`: apps, search demand, child privacy and Bangla speech, 31 ideas.

Merged and de-duplicated, about 90 ideas became the 25 below. The owner asked for Bangladeshi and world content together, because children love learning new things.

**How the 25 were chosen:**
- Evidence that the skill matters and that the game builds it.
- A real need: parents' top worries (যুক্তবর্ণ, handwriting, English letters, clock, maths) and Bangladeshi child safety.
- Search demand: কার চিহ্ন, যুক্তবর্ণ ভেঙে, পশুপাখির নাম ইংরেজি, ঘড়ি দেখা, সৌরজগৎ, ডাইনোসর গেম, ট্যানগ্রাম.
- Balance across ages (3–5, 5–8, 7–12) and skills: literacy, numeracy, thinking, space, feelings and values, safety and health, science and the world, creativity.
- Bangladeshi and world content side by side, and nothing that duplicates an existing tool.

**Left out, and why:**
- **Covered by an existing tool:** working-memory bag (ghontar-sur, konta-nei), গোপন নিয়ম and মাঝির ধাঁধা (the site already has many 9–12 puzzles), pattern beads, colour mixing.
- **Folded into another tool:** habitats (now a pack in নাম শিখি), human body (also নাম শিখি, as শরীর).
- **Too heavy or risky for now:** reading stories, the Bangladesh map jigsaw, ষোলোগুটি, the plant-a-tree daily ritual, ocean depths, the invention timeline, time zones.

The existing tools that already suit children go on the hub page as "আরও খেলা". That list is in `a-development.md` §4 and `b-bangladesh.md` §7.

Every tool follows `research/kids/kids-brief.md`.

---

## Literacy and language (6)

#### 1. kar-chinho · কার-চিহ্ন বসাও · 5–7 · BD · S
- **Skill:** vowel signs on consonants, the akshara basics. It is the strongest school query ("কার চিহ্ন দিয়ে শব্দ গঠন").
- **Loop:** a picture (মাছ) next to "ম _ ছ". Tap a কার from big tiles (◌া ◌ি ◌ী ◌ু ◌ূ ◌ৃ ◌ে ◌ৈ ◌ো ◌ৌ), shown on a dotted circle. The word completes and the picture comes alive (the fish flips).
- **Levels:** one কার at a time (আ-কার → ঔ-কার), then mixed. 10 words per level, all from a child's world.
- **Watch:** ি ে ৈ render to the *left* of the consonant, so the slot must sit where the sign appears. Every word is checked in the site font.

#### 2. juktoborno · যুক্তবর্ণ ভাঙি-জুড়ি · 7–10 · BD · M
- **Skill:** building and splitting conjuncts, parents' number-one reading worry.
- **Loop:** a picture-word (পদ্ম, বৃষ্টি, চন্দ্র, পক্ষী, স্কুল). Feed the base letters into a machine (ক + ষ → ক্ষ) to make the word's conjunct. "ভাঙি" mode cracks a conjunct block into its parts.
- **Progression:** easy doubles (ক্ক, ম্ম, ল্ল) → common (ন্ত, ঙ্গ, ন্দ, স্ত) → tricky (ক্ষ, জ্ঞ, হ্ম, ঞ্জ, ষ্ণ). A conjunct collection book.
- **Watch:** test every conjunct's shaping on the site font and Android Chrome. Use NFC, and build with হসন্ত (্) between letters.

#### 3. borno-likhi · বর্ণ লিখি · 4–7 · BD · L
- **Skill:** letter formation and fine motor. Finger tracing beat a stylus in research.
- **Loop:** a big dotted letter with numbered stroke arrows. Trace with a finger: ink follows only near the path, and a forgiving match fills the stroke. The finished letter turns into its picture (অ → a curling অজগর).
- **Content:** all 11 স্বরবর্ণ, all 39 ব্যঞ্জনবর্ণ and the digits ০–৯. The মাত্রা is drawn last, as taught.
- **Print:** a tracing sheet at `?print` (browser print; dotted letters with arrows).
- **Watch:** stroke data is hand-authored in `lib/`, and a test checks every letter has strokes.

#### 4. chhorar-tal · ছড়ার তালে · 3–6 · BD · S/M
- **Skill:** rhythm, rhyme and print awareness (phonological awareness).
- **Loop:** a public-domain folk ছড়া shows line by line. Tap the ঢোল on the beat and the word under the beat lights up. Then pick the missing rhyme word from 2–3 picture choices.
- **Content:** only the folk rhymes listed as safe in `b-bangladesh.md` §4.1 (আয় আয় চাঁদ মামা, আতা গাছে তোতা পাখি, নোটন নোটন পায়রাগুলি, হাট্টিমা টিম টিম, বৃষ্টি পড়ে টাপুর টুপুর, তাই তাই তাই…). One common Bangladeshi version each, opening lines only where the rhyme has old social content.
- **Watch:** it must work fully on mute (some families avoid music). The beat is shown, not only heard.

#### 5. abc-bazar · এবিসি বাজার · 4–7 · both · S/M
- **Skill:** English letters (capital and small), first sounds, and English words for Bangladeshi things.
- **Loop:** a market stall. Match "M m" to the mango, "B b" to the boat, "R r" to the rickshaw. Then pair capitals with smalls. b/d/p/q get a special practice level.
- **Content:** 26 letters with a Bangladeshi or world picture each (Apple, Boat, Cat, Duck, Egg, Fish, Guava, House, Ice, Jackfruit, Kite, Lemon, Mango, Nest, Owl, Papaya, Queen, Rickshaw, Sun, Tiger, Umbrella, Van, Water, Box(x), Yak, Zebra). The Bangla name shows under each word.
- **Watch:** English words are written in English with a Bangla gloss, since this is the one place English is the lesson.

#### 6. golper-mor · গল্পের মোড় · 5–10 · BD · M
- **Skill:** perspective-taking, kindness, honesty and fairness. Prosocial stories build helping, with no sermon.
- **Loop:** short illustrated stories (4–6 panels), each with one choice point:
  - a friend's টিফিন বাটি falls;
  - you broke Nanu's cup;
  - a new child sits alone;
  - a younger sibling wants your kite;
  - you found ১০ টাকা on the classroom floor.
  
  Choose, and see how the other child feels and what happens. Go back and try the other choice.
- **Content:** 8–10 original stories with ordinary Bangladeshi names. Every path is allowed. There is no "correct" stamp and no moral line at the end. The ending shows feelings and consequences.
- **Watch:** this tool is mostly writing. Follow the Bangla writing guide closely.

## Numbers and maths (5)

#### 7. dosh-ghater-nouka · দশ ঘাটের নৌকা · 3–6 · BD · S
- **Skill:** number sense from a straight, numbered 1–10 board. It has the strongest causal evidence of any idea here.
- **Loop:** a race on a river with ghats ১–১০. Tap the spinner (1 or 2), then tap each ghat as your boat moves while the number lights up. Race আব্বু's boat (a gentle bot, or a real parent on a second tap zone).
- **Levels:** 1–10, then 1–20. About 2-minute games.
- **Watch:** keep it a straight numbered line (the colour-only board version did not work in research).

#### 8. gune-dekhi · গুনে দেখি · 3–6 · both · S
- **Skill:** counting 1–20, plus subitizing (seeing "how many" at a glance).
- **Modes:**
  - **গুনি:** fish swim into a pond. Tap each to count, and its number glows. Then pick the total.
  - **এক নজরে:** dots, mangoes or dice flash for a second. Tap the matching quantity.
  - **কোনটায় বেশি:** two ponds, pick the one with more.
- **Watch:** no timers for ages 3–5. The flash is the only quick part, and it repeats on request.

#### 9. ghori-dekhi · ঘড়ি দেখি · 5–9 · both · S/M
- **Skill:** reading an analogue clock and time words. There is clear search demand ("ঘড়ি দেখা শেখা").
- **Loop:** a child's day (ঘুম থেকে ওঠা ৭টা, স্কুল, টিফিন, বিকেলে খেলা, পড়তে বসা, ঘুম). Drag the hands to match, or read the clock and pick the activity.
- **Levels:** o'clock → half past (সাড়ে) → quarter past and to (সোয়া, পৌনে) → 5-minute steps. The hour hand moves as the minute hand turns, as on a real clock.
- **Watch:** say the time the Bangladeshi way ("সাড়ে ৩টা", "পৌনে ৫টা").

#### 10. daripalla · দাঁড়িপাল্লা · 6–11 · BD · S/M
- **Skill:** equality and missing addends (4 + __ = 7), an early-algebra feel.
- **Loop:** a মুদি দোকান balance. Put weights or fruit on the empty pan until it levels. Later levels ask "কলাটার ওজন কত?" with an unknown on one side.
- **Levels:** sums to 10, to 20, unknowns, two unknowns.
- **Watch:** the satisfying level-out wobble is the reward. Synthesized clinks.

#### 11. shoman-bhag · সমান ভাগ · 5–10 · BD · M
- **Skill:** fair sharing (early division and fractions) together with fairness as a value.
- **Loop:** guests arrive. Share পিঠা, আম or মুড়ির মোয়া equally among plates. Leftovers can be cut (a round রুটি into halves and quarters), and ½, ⅓ and ¼ appear as you cut.
- **Also:** a "choose who gets the last piece" moment shows how each face feels.
- **Levels:** 2 plates → 3 → 4, then cutting, then naming fractions.

## Thinking skills (4)

#### 12. ulto-khela · উল্টো খেলা · 4–8 · both · S
- **Skill:** inhibitory control and flexible thinking (a day–night Stroop with a rule switch).
- **Loop:** a sun appears, so tap the moon. A cat appears, so tap the mouse. When the bell rings, the rule flips to "same". Later a second switch sorts by colour, then by shape.
- **Levels:** slow → brisk. Short rounds.
- **Watch:** the "relaxed" pace is the default. Mistakes wobble and nothing more.

#### 13. mongole-rover · মঙ্গলে রোভার · 6–11 · world · M
- **Skill:** sequencing, planning and early coding (debugging).
- **Loop:** plan arrow commands (↑ → ↑ ↓) to drive a rover to a rock sample on a Mars grid, press চালাও, and watch. If it bumps a crater, fix the plan.
- **Levels:** 1-step → 10-step plans → loops ("৩ বার ↑") → collect several samples. One Mars fact between levels.
- **Watch:** it's planning first, then watching. No timer.

#### 14. sat-tukro · সাত টুকরো · 5–12 · both · M
- **Skill:** spatial reasoning and shape composition (tangram). There is search demand ("ট্যানগ্রাম পাজল").
- **Loop:** fit 7 pieces into a silhouette (নৌকা, রিকশা, বিড়াল, রকেট, মাছ, ঘর). Tap to rotate and flip, and drag or tap-place with generous snapping. Younger levels show the piece outlines; older levels show only the outline.
- **Print:** a cut-out sheet at `?print`.

#### 15. chhaya-melao · ছায়া মেলাও · 3–6 · both · S
- **Skill:** visual matching and early spatial perception. It's a first game for a 3-year-old.
- **Loop:** a lamp switches on and a shadow falls on the wall (হাতি, রিকশা, জিরাফ, ছাতা, হাঁস). Tap the object that cast it.
- **Levels:** 2 choices → 3 → 4 → rotated shadows (mental rotation for 6+).
- **Watch:** no text needed. A ghost finger shows the first tap.

## Feelings, values and safety (4)

#### 16. moner-rong · মনের রং · 4–9 · BD · M
- **Skill:** naming emotions and empathy (emotion knowledge predicts social competence).
- **Loop:** a scene from a Bangladeshi childhood (ঈদে নতুন জামা, ঘুড়ি কেটে গেল, বন্ধু টিফিন ভাগ দিল, ছোট ভাই খাতা ছিঁড়ল, নানু বেড়াতে এল). Pick the face that fits from খুশি, মন খারাপ, রাগ, ভয়, অবাক and লজ্জা. Some scenes accept two. Then choose "কী করলে ভালো লাগবে?" from gentle options.
- **Watch:** no score. Each scene has one parent prompt ("তোমার কখনো এমন হয়েছে?").

#### 17. nirapode-thaki · নিরাপদে থাকি · 6–10 · BD · M
- **Skill:** child safety in Bangladesh, as calm choices.
- **Scenes:**
  - **রাস্তা পার:** look right first (left-hand traffic), the zebra crossing, a ball rolling into the road.
  - **পুকুরঘাট:** never go alone; reach with a বাঁশ or গামছা or throw a bottle; call a grown-up; never jump in.
  - **চুলা:** hot or safe.
  - **ঘুড়ি আর তার:** a kite on a wire, let it go and tell someone.
  - **মেলায় হারিয়ে গেলে:** stand still and ask a mother with children or a shopkeeper.
  - **ঝড়-বজ্রপাত:** go indoors, not under a lone tree.
- **Rules:** show the safe action, never harm. A wrong pick means "আরেকবার ভাবো", with no crash, drowning or fire. Each scene has a parent note with one fact and one action.

#### 18. hat-dhui · হাত ধুই, দাঁত মাজি · 3–8 · BD · S
- **Skill:** handwashing technique and the times to wash, plus a brushing routine.
- **Modes:**
  - **হাত ধোয়া:** a 20-second synthesized rhythm. On-screen hands do palms, backs, between fingers, thumbs and nails while cartoon germs pop off. It's meant to be used at the real sink, so it has big visuals.
  - **দাঁত মাজা:** a 2-minute brushing timer that moves zone by zone and makes germs leave.
  - **কখন ধোব:** pick the times to wash (ভাত খাওয়ার আগে, টয়লেটের পরে, খেলার পরে).
- **Watch:** germs are silly, not scary. No "you're dirty" shaming.

#### 19. ammur-number · আম্মুর নম্বর · 4–8 · BD · S
- **Skill:** memorising a parent's phone number (the lifeline if lost at a মেলা or ঈদের বাজার) and working memory.
- **Loop:** the parent types the number once behind the parent gate. The child rebuilds it in Bangla digits in growing chunks (০১৭ → ০১৭১২ → …) with a rhythm, until they can say it whole.
- **Privacy:** the number is **never saved, sent or put in a link**. It lives only in page memory, and reloading clears it. Say so plainly on the page.

## World and science (5)

#### 20. sourojogot · সৌরজগতের সফর · 5–11 · world · M
- **Skill:** the planets: order, size and distance. There is search demand ("সৌরজগৎ", "গ্রহের নাম") and it doubles as a school project.
- **Loop:** a rocket by the Sun. Tap the planets in order to fly out, with one fact per stop ("বৃহস্পতির ভেতরে ১৩০০টা পৃথিবী ধরে যায়"). Then a mix-up round to put them back, and a size round ("সূর্য যদি ফুটবল হয়…" to scale against a school field).
- **Print:** planet cut-outs at `?print`.
- **Watch:** facts are checked against NASA, with one source line on the page.

#### 21. dinosaur · ডাইনোসর খুঁজি · 4–9 · world · M
- **Skill:** fossils, the deep past and classification. The search literally asks for "ডাইনোসর গেম".
- **Loop:** brush the sand with a finger to uncover bones, snap them into a skeleton, and the dinosaur appears. It shows the name, its size against a bus, and what it ate. Then sort it as plant-eater or meat-eater.
- **Content:** 10–12 dinosaurs, plus a "পাখিরাই এখনকার ডাইনোসর" fact.
- **Watch:** keep it friendly, not scary. Facts are checked against museum sources.

#### 22. ki-hobe · কী হবে বলো তো? · 5–10 · both · M
- **Skill:** predict → observe → explain (the scientific method). Surprise drives learning.
- **Loop:** choose a prediction, watch a simple simulation, then get one line on why, plus a "বাসায় করে দেখো" idea:
  - does a নারকেল, ইট, শুকনো পাতা, স্টিলের চামচ or কলার ভেলা float in the পুকুর?
  - which melts first, ice in the sun or in the shade?
  - which falls faster?
  - why is the sky blue?
  - where does rain come from (the water cycle)?
- **Content:** 12–15 questions, each a small animation.
- **Watch:** home experiments must be safe, with a grown-up for anything involving water or heat.

#### 23. prithibi-ghuri · পৃথিবী ঘুরি · 6–12 · both · M
- **Skill:** world geography and respect for other cultures.
- **Loop:** a passport stamp book. Fly from ঢাকা to a country and learn:
  - its greeting, written in Bangla script ("কোনিচিওয়া");
  - one food, one landmark and one animal;
  - one way it's like home ("জাপানেও ভাত খায়!").
  
  Answer one question to earn the stamp.
- **Content:** 15–20 countries across every continent, including where প্রবাসী relatives live (সৌদি আরব, মালয়েশিয়া, ইতালি, যুক্তরাজ্য).
- **Watch:** respectful, with no stereotypes and no politics. Flags are drawn simply and correctly.

#### 24. nam-shikhi · নাম শিখি · 3–7 · both · M
- **Skill:** vocabulary in Bangla and English. The search demand is huge ("পশুপাখির নাম ইংরেজি", "ফলের নাম বাংলা ও ইংরেজী", "শরীরের অঙ্গের নাম").
- **Packs:**
  - পশুপাখি, with a "কোথায় থাকে" habitat round (বাঘ → সুন্দরবন, উট → মরুভূমি, পেঙ্গুইন → বরফ);
  - ফল;
  - সবজি;
  - শরীর;
  - রং;
  - বাংলাদেশের প্রতীক (শাপলা, দোয়েল, ইলিশ, কাঁঠাল, বাঘ, আমগাছ).
- **Loop:** see the picture and the Bangla name, tap the right one among 3–4. The English name appears under each. Level 2 is English-name-first.
- **Watch:** one engine with data packs in `lib/`. Every picture is drawn simply and clearly.

## Creativity (1)

#### 25. sur-banai · সুর বানাই · 3–12 · both · S
- **Skill:** creativity, pattern and rhythm.
- **Loop:** an 8-step × 5-note grid of pentatonic notes, so every combination sounds good. Tap cells to make a loop, pick a sound (বাঁশি-like, ঢোল-like, টুং-like), and play.
- **Modes:** "আমার সুর" (free), and "সুরটা মেলাও" (copy a short tune, which builds memory). A tune can be saved on the phone.
- **Watch:** the visual grid works on mute too: the lights still dance.

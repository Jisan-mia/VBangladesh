# Kids' section: what child-development research says, and what to build

Angle: the science of child development and what makes a learning game work.
Written for একটুখানি (free, no signup, Bangla only, cheap Android phones, single-page games, synthesized sound, no server, no accounts).
Date: October 2026. Numbers in square brackets point to the sources list at the end.

---

## 0. The short version

- **Learning happens when the mind is busy, not when the finger is busy.** Hirsh-Pasek and colleagues' four pillars [1] say an app teaches when it is *minds-on* (active), keeps the child on the task (engaged), connects to the child's own life (meaningful) and invites talk with another person (socially interactive). Tapping, swiping and stars on their own are not learning.
- **Joy comes first.** The LEGO Foundation review [2] lists five features of playful learning: joyful, meaningful, actively engaging, iterative and socially interactive. It treats joy as the one feature play cannot do without.
- **Train the real skill, not "brain fitness".** Brain-training games mostly make children better at that same game, with "very little" evidence of transfer to everyday thinking [8]. So each game should practise something the child will meet in real life: counting objects, building a যুক্তবর্ণ, naming a feeling, planning a route. Don't promise "IQ" or "brain power".
- **The best-evidenced cheap win for this audience is early maths.** Early maths at school entry is the strongest predictor of later achievement, ahead of reading and attention [12]. About an hour of a simple linear number board game closed the number-sense gap between low-income and better-off preschoolers [11].
- **Dark patterns are everywhere in kids' apps, and worst for poorer families.** Of 133 apps used by 3–5-year-olds, only about one in five had no manipulative design. Such designs were more common in apps used by children of less-educated parents [5]. A free, ad-free Bangla site can be the honest alternative, but only if it refuses those tricks completely.

---

## 1. Age bands

The three bands overlap. Let parents choose a band by picture (ছোট্ট / মাঝারি / বড়), never by asking the child's birth date.

### 3–5 (pre-readers)

| | |
|---|---|
| Reading | None or a few letters. Every instruction must work with **no text**: picture, animation, demonstration ("ghost finger" showing the tap) and, where possible, voice. |
| Attention | One goal at a time. Rounds of 1–3 minutes. Executive function grows fast in this period, so simple rule games can stretch it [6]. |
| Motor | Tap is easiest. Swipe is fine. Drag is shaky because children lift the finger mid-drag; "tap-and-tap" (tap the object, then tap where it goes) works better under 5 [16]. Pinch, flick, rotate and multi-touch are hard [16]. Children miss small targets far more often than adults [16]. Use big targets (at least ~15 mm, about a thumb-print), well apart, and nothing important along the bottom edge where wrists rest [17]. |
| Screen | WHO: no more than 1 hour of sedentary screen time a day for ages 2–4, "less is better", and reading or storytelling with a caregiver is encouraged [3]. Design every 3–5 game to be played **on a parent's lap**. |
| Design shifts | 2–4 choices on screen, not 6. No timers. No failure state: a wrong tap gives a gentle wobble, and the right answer gently glows after two misses. No reading of scores. |

### 6–8 (early readers)

| | |
|---|---|
| Reading | Can decode short words and simple কার signs. যুক্তবর্ণ (complex akshara) are hard: across alphasyllabaries, including Bengali, complex akshara are specifically difficult, and children taught them only as wholes struggle to build them from parts [13]. Keep instructions to one short line, with a picture. |
| Attention | Enjoys rules, levels and "one more try". Rounds of 3–6 minutes. Harvard's guide for 5–7 points to card and board games, Simon-says-style games, "Guess My Rule", mazes and Mastermind-style logic games [6]. |
| Motor | Drag works. Finger tracing of letters is useful: in one study, preschoolers who practised letters with a finger on a tablet wrote more letters correctly afterwards than those who used a stylus [18]. |
| Design shifts | Gentle, optional timers only (a "relaxed" mode is the default). Levels with clear progress. Short explanations after answers. Two players on one phone works well. |

### 9–12 (fluent readers)

| | |
|---|---|
| Reading | Can read paragraphs. Reading level is still below adult, so use short sentences and explain new words once. |
| Attention | Can plan several moves ahead. Harvard's 7–12 guide names strategy games, Sudoku, crosswords, spatial puzzles like the Rubik's cube, and steadily rising challenge [6]. |
| Motor | Near adult. |
| Design shifts | Real puzzles with real difficulty. "Why" explanations, curiosity-driven facts, world topics (space, oceans, the body). Creation tools. Self-chosen goals instead of imposed streaks. This band is most open to growth-mindset ideas [22]. |

**Sound for all bands.** Pre-readers need a voice. The brief says no audio files, so the voice must come from the browser's `speechSynthesis`. Whether cheap Android phones ship a Bangla (bn-BD/bn-IN) voice depends on the phone's installed TTS engine, not on Chrome [30]. **This is the biggest technical risk for the 3–5 band.** Test on real phones before building. Every 3–5 game must also work with sound off (pictures plus a parent reading aloud). If no Bangla voice is reliable, the owner may want a narrow exception: a handful of tiny recorded word clips.

---

## 2. What to build, skill by skill

For each skill: what works, with evidence, and what only *looks* educational.

### 2.1 Executive functions (working memory, inhibitory control, cognitive flexibility)

- **Works:** rule games where the child must hold a rule in mind and stop a habit. Harvard's activity guides [6] list:
  - freeze games;
  - sorting by one rule and then switching to another rule (the basis of the Dimensional Change Card Sort);
  - "opposite" bingo (mark night when the caller says day);
  - Simon Says;
  - memory games where the list grows ("packing a suitcase for Grandma");
  - Guess My Rule;
  - Mastermind and Traffic Jam-style logic games;
  - strategy board games.

  The guides stress that the challenge must keep rising and that adult support should fade.
- **Caution:** commercial "brain training" improves the trained task but shows little transfer [8]. Keep EF games honest. They are fun practice for focus and self-control, not an intelligence booster.
- **Only looks educational:** fast reaction games with a "brain" label, endless memory drills with no rising rule, and anything that claims IQ gains.

### 2.2 Early numeracy

- **Works:**
  - **Linear number board games.** Moving a token along a straight 1–10 track while saying the numbers. Four 15-minute sessions closed the number-sense gap for low-income preschoolers. The same game with colours instead of numbers did not [11].
  - **Subitizing** (seeing "three" without counting), counting objects and comparing quantities. Preschool patterning, counting and quantity comparison predicted fifth-grade maths better than other early skills [14].
  - **Number-line estimation.**
  - **Part-whole and missing-addend problems** (4 + __ = 7). Short spatial training improved these in 6–8-year-olds, though a replication found weaker transfer [9].
- **Only looks educational:** flashcard arithmetic with a timer and points (it drills recall without building number sense), and "count the stars you earned".

### 2.3 Early literacy (Bangla-specific)

- **Works:**
  - Knowing the akshara (letter units) is the core of reading in alphasyllabaries. In a Kannada study, akshara knowledge explained about half the variation in reading accuracy [13].
  - Explicitly building complex akshara from consonant and vowel parts, because children taught them only as wholes struggle [13].
  - Finger tracing for letter formation [18].
  - Stories with narration and gentle animation. A meta-analysis of 43 studies found multimedia features (animation, music, sound) helped comprehension and vocabulary [15].
- **Only looks educational:** tappable "hotspots" and mini-games inside stories. Most were unrelated to the story, they distracted children, and they *harmed* children from less stimulating homes [15]. So: story pages stay calm, and play comes after the story.

### 2.4 Spatial reasoning

- **Works:** spatial skills are trainable. A meta-analysis of 217 studies found an average gain of about half a standard deviation, larger for children under 13 [9]. Useful mechanics:
  - tangram and shape composition;
  - mental rotation;
  - symmetry;
  - map and perspective tasks;
  - jigsaw-style puzzles.
- **Caution:** transfer from rotation training to maths is mixed [9]. Pitch these as worthwhile in their own right (geometry, maps, science), not as a maths hack.

### 2.5 Logic and pattern

- **Works:**
  - Repeating and growing patterns ("what comes next", "make the same pattern with different things"). Patterning at age 4 predicted later maths [14].
  - Sequencing commands (unplugged-style coding).
  - Classic river-crossing and constraint puzzles.
  - Deduction (Mastermind, minesweeper-style logic).
- **Only looks educational:** "IQ test" quizzes with one trick answer.

### 2.6 Fine motor

- **Works:** finger tracing of letters [18], dot-to-dot by number, and steady-path tracing. Fine motor skill at school entry also predicts later achievement [12]. Keep real-world motor play in view too (Harvard stresses physical games for every band [6]): some ideas below end with an off-screen action.
- **Only looks educational:** "fine motor" games that are just fast tapping.

### 2.7 Social-emotional learning

CASEL's five areas are self-awareness, self-management, social awareness, relationship skills and responsible decision-making [7].

- **Works:**
  - **Emotion knowledge** (naming feelings, reading faces *in context*). It has a small-to-medium, reliable link with social competence [19].
  - **Calm-down practice.** A 12-week, roughly 10-hour preschool mindfulness "Kindness Curriculum" improved social competence. Over the same period the control group grew more selfish [20].
  - **Prosocial game content.** Playing games where you help others predicted more helping later, across several countries [21].
  - **Perspective-taking stories** where the child chooses and *sees the other character's reaction*.
- **Without moralising:** never end on a lesson line ("মনে রাখবে, ভাগ করে খাওয়া ভালো"). Show the consequence (the friend's face changes, the story moves on) and let the child notice. Avoid "right/wrong" buttons for feelings: two feelings can both be true.
- **Only looks educational:** quizzes about values ("Is lying good or bad?") with ticks and crosses. Children learn the expected answer, not the behaviour.

### 2.8 Growth mindset

- **Works:**
  - **Praise the process, not the person.** Fifth-graders praised for being smart chose easier tasks, enjoyed less and did worse after failure than those praised for effort [10]. Toddlers who heard more process praise from parents held stronger "ability can grow" beliefs years later [23].
  - **For 9–12, explain that the brain changes with practice.** A short online lesson of this kind lifted grades for lower-achieving teenagers in a national US trial. The effect was modest and depended on school culture [22].
- In practice:
  - Feedback names the strategy ("এবার কোনা থেকে শুরু করলে, মিলে গেল").
  - Show "you got better" by comparing the child with themself.
  - Never label a child as clever, slow or a genius.
- **Only looks educational:** posters saying "never give up" while the game punishes every mistake.

### 2.9 Curiosity about nature and science

- **Works:**
  - **Information gaps.** Ask a question, let the child guess, then reveal. Curiosity states improved memory for the answer and even for unrelated material seen at the same time [24].
  - **Explanation and surprise.** Preschoolers who explained how a toy worked understood its causes better [25]. Surprising outcomes trigger explanation and longer exploration [25].
- **Mechanic:** predict → see → explain ("কী হবে বলো তো?").
- **Only looks educational:** fact carousels ("Did you know?" × 20) with no prediction step, and quizzes that only reward recall.

### 2.10 Creativity

- **Works:** open-ended making with constraints (a pentatonic music grid, story dice, pattern design). Harvard ties storytelling and child-made plans to working memory and planning [6]. Creation tools have no score.
- **Only looks educational:** colouring-by-number with one correct result, or "creativity" apps that are really sticker shops.

### 2.11 Healthy habits

- **Works:** short, concrete routines practised with an adult: handwashing with soap, a balanced plate, a bedtime routine. Handwashing promotion in Karachi neighbourhoods cut diarrhoea in under-15s by about half and pneumonia in under-5s by about half [26]. That is directly relevant to Bangladesh.
- **Only looks educational:** "health quizzes" disconnected from any action.

---

## 3. Healthy design rules

These rules are what will make the section trustworthy to parents. Each is grounded in the sources above.

### 3.1 Session length and stopping points

1. **Short rounds with a natural end.** 3–5: 1–3 minutes. 6–8: 3–6 minutes. 9–12: up to ~10 minutes per puzzle. At the end of a round, show a calm finished screen ("আজকের খেলা শেষ" with the picture they made), not an auto-start of the next level. Radesky's team flagged "navigation constraints" (no clear exit, forced auto-advance) in 46% of apps [5].
2. **Every round has an obvious exit.** "আবার খেলো" and "শেষ" buttons are the same size.
3. **Gentle nudge after ~15–20 minutes of continuous play.** A soft "একটু উঠে পানি খেয়ে আসো?" with a stretch picture, and no lock. WHO's 1-hour/day limit for 2–4-year-olds covers all screens [3]. The AAP's 2026 statement drops fixed hour caps, focuses on how platforms are designed and on family routines, and asks industry to stop designing for engagement and profit [4].
4. **Some games end off-screen.** "এবার আম্মুকে তিনটা গোল জিনিস দেখাও."

### 3.2 Co-play with a parent

5. **Design for two people at one phone.** The fourth pillar is social interaction [1]. Story features and joint reading help most when an adult is involved [3][15].
   - Add one optional "বড়দের জন্য" line on each 3–5 game: a question the parent can ask afterwards ("ও কোন ছবিটা প্রথমে চিনল?").
   - Add turn-taking modes ("এখন আব্বুর পালা").
6. **Parent controls sit behind a simple adult gate** (for example "৭ আর ৮ যোগ করো"), not a password. These cover sound on/off, the age band and an optional voice. This is an assumption to test with parents.

### 3.3 No dark patterns

Each item below is a category from Radesky et al. [5] or from the AAP [4]. None of them belongs in the kids' section.

7. **No streaks, daily-return rewards or "come back tomorrow" pressure.** A daily puzzle is fine as an offer. Losing nothing by skipping a day is the rule.
8. **No parasocial pressure.** No character says "চলে যাচ্ছ? আমি কষ্ট পাব" or anything like "Do you want to give up?" (found in a quarter of apps [5]).
9. **No fake time pressure.** No countdowns at decision points, no "limited time" [5]. Timers only inside optional challenge modes, and never for 3–5.
10. **No lures.** No loot boxes, mystery chests, spinning wheels or flashing "hot item" rewards at the moment a child might stop [5].
11. **No ads, no purchases, no links out of the kids' area.** Even a link to an adult tool counts. Share buttons (if any) go to the parent and sit behind the adult gate.
12. **Rewards are informational, not tangible.** Expected, tangible rewards reduced children's intrinsic interest in a 128-study meta-analysis [27].
    - Prefer: the picture you completed, the tune you made, a "you can now do X" line.
    - Stars are acceptable as a progress record but must never be spent, traded or compared.
13. **No leaderboards and no comparisons with other children.** Compare the child with their own last try.

### 3.4 Praise and mistakes

14. **Praise the process and be specific.** "এবার ধীরে গুনলে, তাই মিলেছে" not "তুমি জিনিয়াস" [10][23]. Skip praise entirely for trivial taps. Lavish praise for everything empties it of meaning.
15. **Mistakes are information, not failure.**
    - For 3–5: a soft wobble or neutral sound, then a hint, then a glowing answer after two tries. No buzzer, no red X, no lost lives.
    - For 6–12: show *why* ("৮ আর ৫ মিলে ১৩, তাই ১২ হবে না").
    - Allow "আবার চেষ্টা" with no penalty.
16. **Keep the "sweet spot" of difficulty.** Learning is fastest when the task is neither trivial nor impossible. Infants look away from events that are too simple or too complex [28], and a modelling study puts optimal training success near 85% [29]. In practice:
    - If a child misses three in a row, quietly ease the next item.
    - If they ace five, step up.
    - Never announce "easy mode".

### 3.5 Sound and celebration

17. **Celebrate briefly and in proportion.** A 1–2 second chime and a small animation for a finished round, and nothing for each tap. Avoid fireworks-and-confetti loops: they work as lures and overstimulate.
18. **Sound serves meaning.** Narration and gentle music aid story comprehension [15]. Constant background music and sound effects compete with thinking. Make music off by default, keep effects soft, and offer a mute button on every screen.
19. **Calm visuals.** One focal object, plenty of space, few flashing elements, and no strobing (also a photosensitivity safety point).

### 3.6 Privacy and safety (fits the site already)

20. **Nothing leaves the phone.** No names typed by children, no camera, no microphone, no chat, no user content shown to others. Progress lives in localStorage only, and losing it costs nothing.

---

## 4. Existing tools: list as-is, or add a kid mode

The test: is it free of time pressure and adult themes, and can a child of that band read and operate it?

**List as-is (good fit already):**
- **Executive function / logic**
  - jora-melao: memory pairs; Harvard's "Concentration" [6].
  - konta-nei: working memory.
  - ghontar-sur: sequence memory, Simon-like.
  - paka-kancha: Mastermind, named by Harvard [6].
  - jam-chharao: the Traffic Jam puzzle, named by Harvard [6].
  - baghbandi: a strategy board game.
  - chhok-jora: dots-and-boxes.
  - sap-ludu: co-play and counting.
  - switchboard and bhimruler-chak: for 9–12.
- **Spatial**
  - golokdhadha, chhobir-tukro (start at 3×3) and ponero-ghor (3×3).
- **Visual attention**
  - bhul-kothay.
- **Picture logic**
  - chhobi-photao: 5×5 levels for 7+.
- **Literacy and numeracy**
  - o-te-ojogor: already has a slow mode.
  - namta: already shows the right answer after a mistake.
- **Riddles and play**
  - dhadha, and cholo-kheli. cholo-kheli is excellent: it sends children to real physical games.
- **Creativity**
  - alpana, chhotto-para, riksharong and ghuri.
- **Arcade fun for 6–12** (fun rather than learning, fine as a "just play" shelf): kalbaishakhi-aam, churui-tarao, jhalmuri-sap, danguli, latim, chhip-felo, nodi-par, al-dhore-hati, kagojer-urojahaj, marble-sinri, sat-chara, carrom, penalty, golir-badminton, roshi-tana, baicher-nouka, peoner-cycle, deri-hoye-gelo, handi-bhanga, tarer-fanke-belun, bostar-pahar, antenna-thik-koro, dudh-uthlano and atir-aam.

**Needs a kid mode:**
- **mukhe-mukhe-hisab.** One-minute timer and streak scoring. Add an untimed mode, smaller numbers and a tap-to-see-why on errors.
- **shobdo-khoja.** It runs against a clock. Add a no-timer mode, a 6×6 grid and child-level words (animals, fruits).
- **sudoku.** Fine from 4×4. Add a "start at 4×4 with picture symbols" entry for 6–8.
- **churir-bazar.** Match-3 is a classic engagement loop. List it for 8+ only, with no "one more level" prompts.
- **bhangti-nai.** Great money maths for 8–12, but needs a relaxed pace.
- **desh-cheno, bagdhara and banan.** Good for 9–12 but reading-heavy. Add easier question sets, and show the explanation after each answer.
- **shobdo-khela.** Its daily word puzzle uses adult vocabulary. A kids' word set is needed.
- **chor-police.** A party game. It suits 8+ with family, so list it under "পরিবারের সাথে".
- **moshar-raat.** Fine, but check the swatting effects are cartoonish.

**Do not list in the kids' section:** biye-kobe, flames, dhoyahin (smoking), upohar/dawat/salami (adult money etiquette), and every money, bill, land and gold calculator. Also anything with "বন্ধুকে চ্যালেঞ্জ" leaderboards, unless that share is moved behind the parent gate.

---

## 5. About 30 new ideas

Format for each idea: **Bangla working name** (age band, BD / world / both). Then: the skill and its evidence, the core loop, why it stays fun, and the build effort.

S means one screen with simple state, about 1–2 days. M means several levels, content or SVG art, about 3–5 days. L means a physics or simulation engine, or a lot of art or content, 1–2 weeks.

### Executive function

**1. উল্টো খেলা** (4–8, both)
- **Skill:** inhibitory control. A digital version of the Day-Night Stroop and "opposite bingo" [6].
- **Loop:** a sun appears, so tap the moon. A cat appears, so tap the mouse. Every few rounds a bell flips the rule back to "same".
- **Fun:** silly picture pairs, and the satisfying slip-and-catch of fighting your own habit. **Effort:** S.

**2. ঝুড়ি বদল** (3–6, both)
- **Skill:** cognitive flexibility. This is the card sort with a rule switch, recommended for 3–5 [6].
- **Loop:** sort fruits into baskets by colour. A bird squawks and the basket labels change to shape. Sort again.
- **Fun:** fruits plop in with a juicy sound. Rounds are tiny. Tap-and-tap, no drag. **Effort:** S.

**3. নানুবাড়ির ব্যাগ** (4–9, BD)
- **Skill:** working memory. This is the "packing a suitcase for Grandma" game [6].
- **Loop:** Ammu packs one item and you repeat it. She adds one more each turn: গামছা, আম, চিরুনি… Tap the items in order.
- **Fun:** the bag gets absurd (a whole pumpkin, a hen). Played aloud with a parent it is a real family game. **Effort:** S.

**4. গোপন নিয়ম** (7–12, both)
- **Skill:** inductive reasoning and flexible thinking. This is Guess My Rule [6].
- **Loop:** a gatekeeper lets some shapes or animals through ("all with legs", "red and big"). Test items, form a guess and prove it on three new items.
- **Fun:** a detective feeling. Rules get trickier. Two players can make rules for each other on one phone. **Effort:** M.

### Numeracy

**5. দশ ঘাটের নৌকা** (3–6, BD)
- **Skill:** number sense. This is Siegler and Ramani's linear 1–10 board game [11].
- **Loop:** spin 1 or 2, then tap each ghat as the boat moves while the number is shown (and spoken if a voice exists). Reach ghat 10 before the parent's boat.
- **Fun:** a race against Abbu, a splashy finish, and tiny games of about 2 minutes. It must stay straight-line and numbered: the colour-only version did not work [11]. **Effort:** S.

**6. এক নজরে কয়টা?** (3–7, both)
- **Skill:** subitizing and quantity comparison [14].
- **Loop:** a handful of fish, dots or mangoes flash for a second. Tap the matching quantity picture (3–5) or numeral (6–7). A later stage asks "which pond has more?"
- **Fun:** the flash builds a little "I saw it!" thrill, and patterns (dice, dominoes) become familiar. **Effort:** S.

**7. দাগে বসাও** (6–10, both)
- **Skill:** number-line estimation, a key part of number sense [11][14].
- **Loop:** a frog must land on 7 on a 0–10 stick, later 48 on 0–100. Tap where you think it goes. The frog jumps and the gap is shown kindly ("একটু ডানে").
- **Fun:** a closeness meter in place of right/wrong, plus rising precision. **Effort:** S.

**8. দাঁড়িপাল্লা** (6–11, BD)
- **Skill:** equality and the missing addend (4 + __ = 7). These are part-whole skills [9].
- **Loop:** a shopkeeper's balance has weights or fruits on one side. Add pieces to the other side until it levels. Later levels have unknowns ("কলাটার ওজন কত?").
- **Fun:** the satisfying level-out wobble. It turns early algebra into a physical feel. **Effort:** S–M.

**9. ভাগ করে খাই** (4–9, BD)
- **Skill:** fair sharing (early division and fractions) plus fairness. This is SEL without a lecture.
- **Loop:** guests arrive. Share pithas, mangoes or a roti equally among the plates. A leftover appears: cut it, or choose who gets it, and see the faces.
- **Fun:** the guests react. Cutting a round roti into halves and quarters is satisfying. **Effort:** M.

### Literacy

**10. কার বসাও** (5–8, BD)
- **Skill:** vowel signs on consonants, the akshara basics [13].
- **Loop:** a picture (মাছ) shows next to "ম _ ছ". Choose from the ‍া ি ী ু signs. The word "comes alive" (the fish flips).
- **Fun:** the picture animates when the word is right. Words come from the child's world. **Effort:** S (needs a careful word list).

**11. যুক্তবর্ণের কারখানা** (7–10, BD)
- **Skill:** building complex akshara from parts. Children taught them only as wholes struggle [13].
- **Loop:** a machine takes ক + ষ and outputs ক্ষ. Feed it the parts to make the conjunct a word needs (পক্ষী, বৃষ্টি). Later, run it backwards to split a conjunct.
- **Fun:** machine clanks (synthesized), plus a collection book of conjuncts you have built. **Effort:** M (font and rendering testing of conjuncts on cheap phones is the main work).

**12. আঙুলে লিখি** (4–7, BD)
- **Skill:** letter formation and fine motor. Finger tracing beat stylus in one study [18].
- **Loop:** a letter shows with stroke arrows. Trace with a finger. When the stroke matches, it fills with colour and becomes a picture (অ → অজগর curling).
- **Fun:** each letter turns into its creature. Matching is forgiving. **Effort:** M (stroke paths for 50 letters).

**13. আগে-পরে** (4–8, both)
- **Skill:** narrative sequencing and working memory. Storytelling is in Harvard's 3–5 guide [6].
- **Loop:** 3–5 picture cards, for example seed → sprout → tree → mango, or a caterpillar → butterfly, or getting ready for school. Put them in order, then watch them play as a mini animation.
- **Fun:** a world/BD mix of stories, and the animated payoff. A parent can ask "তারপর কী হলো?" **Effort:** S per set, M with art.

**14. গল্পের ঝুলি** (4–10, both)
- **Skill:** oral storytelling, creativity and language. This is a co-play tool.
- **Loop:** pull three picture tiles from a bag: a hero (বিড়াল, astronaut), a place (সুন্দরবন, the Moon) and a problem (lost key). The child tells the story aloud to a parent. Nothing is recorded.
- **Fun:** endless absurd combinations. Kids beg for "আরেকটা টানো". **Effort:** S.

### Spatial

**15. সাত টুকরো** (5–12, world)
- **Skill:** shape composition and spatial reasoning. Spatial training effects are about half a standard deviation [9].
- **Loop:** a tangram. Fit the 7 pieces into a silhouette (boat, cat, rocket). 3–5 get outlined pieces. 9–12 get only the outline.
- **Fun:** the "click" of a fit, plus silhouettes from both BD and world (a rickshaw, a rocket). **Effort:** M (rotation by tap, not by gesture).

**16. ঘুরিয়ে মেলাও** (6–12, both)
- **Skill:** mental rotation [9].
- **Loop:** a target shape, and three rotated or mirrored options. Pick the one that is the same shape just turned. A "turn it" button lets younger kids check.
- **Fun:** shapes are kites, boats and planets, not abstract blocks. Fast rounds. **Effort:** S.

**17. নকশিকাঁথার আয়না** (5–10, BD)
- **Skill:** symmetry and spatial structure. It also builds creativity.
- **Loop:** half a kantha motif is stitched. Tap squares to complete the mirror half. A free-design mode mirrors whatever you stitch.
- **Fun:** a beautiful result, and the free mode becomes a design toy. **Effort:** S.

**18. ছায়া মেলাও** (3–5, both)
- **Skill:** visual matching and early spatial perception, for the youngest band.
- **Loop:** a shadow appears (elephant, rickshaw, giraffe). Tap the object that cast it. Later levels rotate the shadow.
- **Fun:** a lamp "switches on" to reveal the shadow. It works on a parent's lap. **Effort:** S.

### Logic and pattern

**19. মালা গাঁথি** (3–8, both)
- **Skill:** patterning, a predictor of later maths [14].
- **Loop:** a bead garland shows a pattern (লাল-নীল-লাল-নীল…). Tap the next bead. Later: growing patterns, and "copy this pattern using flowers".
- **Fun:** the finished garland is worn by a character. Tap-and-tap for under-5s. **Effort:** S.

**20. মঙ্গলে রোভার** (5–10, world)
- **Skill:** sequencing, planning and early coding.
- **Loop:** plan arrow commands (↑ → ↑ ↓) to drive a rover to a rock sample on a Mars grid, then press go and watch. Debug if it crashes into a crater. Later: loops ("৩ বার ↑").
- **Fun:** the delay between planning and seeing feels like real mission control. Mars facts appear between levels. **Effort:** M.

**21. মাঝির ধাঁধা** (8–12, BD)
- **Skill:** constraint reasoning and planning (the classic river-crossing puzzle).
- **Loop:** a majhi must ferry a tiger, a goat and a bundle of grass. Only one fits in the boat, and no pair may be left that would eat the other. More versions follow (family members, missionaries).
- **Fun:** funny failure animations (the goat munches the grass) with instant retry. Discovering the trick feels great. **Effort:** S.

### Fine motor

**22. দাগে দাগে ডাইনোসর** (4–8, world)
- **Skill:** counting order and fine motor control.
- **Loop:** connect numbered dots ১ → ২০ with a finger. The outline becomes a dinosaur, a whale or a ship. Then colour it freely.
- **Fun:** the mystery reveal, plus one size fact ("এই ডাইনোসর ছিল দুটো বাসের সমান"). **Effort:** S per picture, M for a set.

### Social-emotional

**23. মুখ দেখে মন** (4–9, both)
- **Skill:** emotion knowledge, which is linked to social competence [19].
- **Loop:** a short scene (a kite cut loose, a new baby sister, a lost ball) and a face. Pick the feeling word or face that fits. Some scenes accept two feelings ("রাগ আর মন খারাপ দুটোই হতে পারে").
- **Fun:** situations kids know. It asks "তোমার কখনো এমন হয়েছে?" to the parent, and has no score. **Effort:** M (art).

**24. গল্পের মোড়** (5–10, BD)
- **Skill:** perspective-taking, kindness, honesty and sharing. Prosocial game content predicts more helping [21].
- **Loop:** short illustrated stories, each with one choice point. A friend's tiffin box falls. You broke Nanu's cup. A new child sits alone. Choose an action and see how the other character feels and what happens next. You can go back and try the other choice.
- **Fun:** stories with real stakes and warm endings. Every path is allowed. There is no "correct" stamp and no moral line at the end. **Effort:** M–L (writing is the hard part).

**25. বেলুন শ্বাস** (3–12, both)
- **Skill:** self-regulation through slow breathing, as used in the preschool kindness curriculum [20].
- **Loop:** a balloon (or a boat sail, or a kite) grows as you breathe in for 4 counts and shrinks as you breathe out. Five breaths and it floats away.
- **Fun:** it is calm, not a game, so it makes a good "শেষ" screen for the whole section. A soft synthesized tone guides the breath. **Effort:** S.

### Growth mindset

**26. মাথার ভেতর রাস্তা** (9–12, both)
- **Skill:** the belief that ability grows with practice. The brain-change lesson [22] combines with process praise [10].
- **Loop:** a short interactive explainer: each try thickens a path between brain cells. Then a hard-ish puzzle (a tangram silhouette). After each attempt the path glows thicker, and the child compares their own tries ("প্রথমবার ৩ মিনিট, এবার ১ মিনিট").
- **Fun:** a visible "my brain changed" moment. Short, about 5 minutes. **Effort:** M.

### Science and nature

**27. কী হবে বলো তো?** (5–10, both)
- **Skill:** causal reasoning through predict → observe → explain. Explanation and surprise drive learning [25].
- **Loop:** pick a prediction (Does the lemon float? Which melts first, ice in the sun or the shade? Which falls faster?). The simple simulated outcome plays. One line says why. Then "try it at home".
- **Fun:** surprise, since many answers are counter-intuitive. It ends in a real kitchen experiment with a parent. **Effort:** M.

**28. সাগরের তলায়** (6–12, both)
- **Skill:** curiosity and ocean science through information gaps [24].
- **Loop:** scroll down from the surface into the dark. At each depth, guess what lives there (Bay of Bengal dolphins, the Swatch of No Ground, anglerfish), then reveal. The light fades as you sink.
- **Fun:** the deepening dark and the "how deep am I" meter (deeper than Keokradong is tall!). **Effort:** M (art and facts).

**29. সূর্য যদি ফুটবল হয়** (8–12, world)
- **Skill:** a sense of scale in space, through estimation and curiosity.
- **Loop:** the Sun is a football in your school field. Guess how big and how far Earth is (a mustard seed, about 25 m away), then reveal. Continue planet by planet to Neptune (about 700 m away, the next neighbourhood).
- **Fun:** astonishment at the distances, mapped onto places a child knows. Order-the-planets mini rounds. **Effort:** M.

**30. ভাতের যাত্রা** (6–11, both)
- **Skill:** how the human body works, and healthy eating.
- **Loop:** follow one bite of ভাত-ডাল through mouth, food pipe, stomach and intestines. At each stop, tap to make it work (chew, squeeze), with one fact per stop. End: "পানি খাও, ধীরে চিবাও".
- **Fun:** gross-out humour (burps) that kids love, and a body map that fills in as you go. **Effort:** M.

**31. কে কোথায় থাকে** (5–10, both)
- **Skill:** world animals and habitats, through classification.
- **Loop:** animals arrive one at a time (penguin, camel, Bengal tiger, polar bear, dolphin). Tap the right home on a simple world map: Antarctica, desert, Sundarbans, Arctic, sea. Each placement shows one country fact.
- **Fun:** the map fills with animals. Silly misplacements (a camel on ice) shiver comically, then hint. **Effort:** M.

### Creativity

**32. সুর বানাই** (4–12, both)
- **Skill:** creativity, pattern and rhythm. Music and rhythm practise attention and working memory [6].
- **Loop:** an 8×5 grid of pentatonic notes (synthesized), where every combination sounds pleasant. Tap cells to make a loop, choose an instrument sound (বাঁশি-like, ঢোল-like), and play it.
- **Fun:** instant good-sounding music with no wrong notes. It fits the "sound is synthesized" constraint perfectly. A "copy my tune" mode adds memory. **Effort:** S.

### Healthy habits

**33. হাত ধোয়ার গান** (3–8, both)
- **Skill:** a handwashing routine. Soap promotion halved diarrhoea and pneumonia in a nearby setting [26].
- **Loop:** a 20-second synthesized jingle. Follow the on-screen hands through the steps (palms, backs, between fingers, nails) while actually washing. Cartoon germs pop off at each step.
- **Fun:** germs with silly faces and a song to wash along to. Used at the real sink, phone propped up. **Effort:** S.

**34. রংধনু থালা** (5–10, BD)
- **Skill:** food groups and a balanced meal. Concrete routines beat quizzes.
- **Loop:** fill a plate with sections (rice/roti, vegetables, fish/egg/dal, fruit) from a Bangladeshi food tray. The plate character gains energy when it is balanced, and gets a gentle "আরেকটু সবজি?" when it is not. No food is "bad".
- **Fun:** a dressing-up-the-plate feel, and familiar foods (শাক, ডিম, পেয়ারা). **Effort:** S.

---

## 6. If I had to pick

Back first, in order:
- **দশ ঘাটের নৌকা** (5): strongest causal evidence, tiny build, and serves the youngest and poorest.
- **যুক্তবর্ণের কারখানা** (11): solves a real, Bangla-specific reading bottleneck that no global app touches.
- **গল্পের মোড়** (24): SEL through consequence, not sermon.
- **কী হবে বলো তো?** (27): curiosity plus a real experiment at home.
- **সুর বানাই** (32): pure creative joy, a perfect fit for synthesized sound, and a small build.

Close behind: ঝুড়ি বদল, এক নজরে কয়টা, সাত টুকরো, মঙ্গলে রোভার and বেলুন শ্বাস.

---

## Sources

1. Hirsh-Pasek, K., Zosh, J., Golinkoff, R., Gray, J., Robb, M., Kaufman, J. (2015). Putting Education in "Educational" Apps: Lessons From the Science of Learning. *Psychological Science in the Public Interest* 16(1), 3–34. https://www.psychologicalscience.org/publications/educational-apps.html ; summary: https://www.newamerica.org/insights/new-framework-identify-truly-educational-apps/
2. Zosh, J. et al. (2017). Learning through play: a review of the evidence. LEGO Foundation white paper. https://cms.learningthroughplay.com/media/vd5fiurk/what-we-mean-by-learning-through-play.pdf
3. World Health Organization (2019). To grow up healthy, children need to sit less and play more (guidelines on physical activity, sedentary behaviour and sleep for children under 5). https://www.who.int/news/item/24-04-2019-to-grow-up-healthy-children-need-to-sit-less-and-play-more
4. American Academy of Pediatrics (2026). Digital Ecosystems, Children, and Adolescents (policy statement, *Pediatrics*, Feb 2026). News release: https://www.aap.org/en/news-room/news-releases/aap/2026/american-academy-of-pediatrics-calls-for-creating-a-child-friendly-digital-world/ ; coverage: https://edsurge.com/news/2026-02-05-new-aap-screen-time-recommendations-focus-less-on-screens-more-on-family-time
5. Radesky, J. et al. (2022). Prevalence and Characteristics of Manipulative Design in Mobile Applications Used by Children. *JAMA Network Open* 5(6): e2217641. https://pmc.ncbi.nlm.nih.gov/articles/PMC9206186/ ; press summary: https://www.michiganmedicine.org/health-lab/design-tricks-commonly-used-monetize-young-childrens-app-use
6. Center on the Developing Child, Harvard University (2014). Enhancing and Practicing Executive Function Skills with Children from Infancy to Adolescence (activity guides for 3–5, 5–7, 7–12). https://developingchild.harvard.edu/resources/activities-guide/
7. CASEL. The CASEL 5 core competencies (as reproduced in school materials). https://ithacacityschoolsny.sites.thrillshare.com/o/icsd/page/social-emotional-learning-skills-the-casel-5
8. Simons, D. et al. (2016). Do "Brain-Training" Programs Work? *Psychological Science in the Public Interest* 17(3). https://www.psychologicalscience.org/publications/brain-training.html
9. Uttal, D. et al. (2013). The malleability of spatial skills: a meta-analysis (g ≈ 0.47; 0.61 under 13). Cheng & Mix (2014) and Hawes et al. (2015) on rotation training and maths, as summarised in https://pmc.ncbi.nlm.nih.gov/articles/PMC7379338 and https://pmc.ncbi.nlm.nih.gov/articles/PMC10299554
10. Mueller, C. & Dweck, C. (1998). Praise for intelligence can undermine children's motivation and performance. *Journal of Personality and Social Psychology* 75(1). https://www.columbia.edu/cu/psychology/courses/3615/Readings/Mueller_Dweck.pdf
11. Siegler, R. & Ramani, G. (2008). Playing linear numerical board games promotes low-income children's numerical development. *Developmental Science* 11(5), 655–661. https://pubmed.ncbi.nlm.nih.gov/18801120/ ; Siegler (2009) overview: https://www.cmu.edu/dietrich/psychology/cs/research-teaching/docs/SieglerBoardGamesCDPerp2009.pdf
12. Duncan, G. et al. (2007). School readiness and later achievement. *Developmental Psychology* 43(6). https://sites.uci.edu/gduncan/files/2021/03/School-readiness-pdf.pdf ; fine-motor follow-up: https://asu.elsevierpure.com/en/publications/fine-motor-skills-and-early-comprehension-of-the-world-two-new-sc
13. Nag, S. & Snowling, M. on reading in alphasyllabaries (akshara knowledge; complex akshara difficulty, including Bengali via Nag & Sircar 2008). https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4130305/
14. Rittle-Johnson, B. et al. (2016). Early math trajectories: patterning, counting and quantity comparison predict fifth-grade maths. *Child Development*. https://news.vanderbilt.edu/2016/12/06/early-math-knowledge-related-to-later-achievement/
15. Takacs, Z., Swart, E., Bus, A. (2015). Benefits and pitfalls of multimedia and interactive features in technology-enhanced storybooks: a meta-analysis. *Review of Educational Research* 85(4). https://journals.sagepub.com/doi/pdf/10.3102/0034654314566989
16. Touchscreen gesture research with young children: Anthony et al. (2013) on target misses; studies of 18–42-month-olds' gestures; tap-and-tap guidance. https://lisa-anthony.com/wp-content/uploads/2013/04/anthony-et-al-jpuc2013.pdf ; https://oldmagazine.uxpa.org/?p=11776
17. Joan Ganz Cooney Center / Sesame Workshop. Best Practices: Designing Touch Tablet Experiences for Preschoolers. https://joanganzcooneycenter.org/?p=19607
18. Patchan, M. & Puranik, C. (2016). Using tablet computers to teach preschool children to write letters: finger, stylus or paper. Summary: https://researchconnections.org/childcare/resources/32955
19. Trentacosta, C. & Fine, S. (2010). Emotion knowledge, social competence, and behavior problems: a meta-analytic review. *Social Development* 19(1). https://pmc.ncbi.nlm.nih.gov/articles/PMC2975582
20. Flook, L. et al. (2015). Promoting prosocial behavior and self-regulatory skills in preschool children through a mindfulness-based Kindness Curriculum. *Developmental Psychology* 51(1). https://pmc.ncbi.nlm.nih.gov/articles/PMC4485612
21. Gentile, D. et al. (2009). The effects of prosocial video games on prosocial behaviors. *Personality and Social Psychology Bulletin*. https://news.iastate.edu/news/2009/apr/vgbenefits.shtml
22. Yeager, D. et al. (2019). A national experiment reveals where a growth mindset improves achievement. *Nature* 573, 364–369. https://www.hks.harvard.edu/publications/national-experiment-reveals-where-growth-mindset-improves-achievement
23. Gunderson, E. et al. (2013). Parent praise to 1- to 3-year-olds predicts children's motivational frameworks 5 years later. *Child Development*. https://news.temple.edu/node/96014
24. Gruber, M., Gelman, B., Ranganath, C. (2014). States of curiosity modulate hippocampus-dependent learning via the dopaminergic circuit. *Neuron* 84(2). https://pmc.ncbi.nlm.nih.gov/articles/PMC4252494/
25. Legare, C. & Lombrozo, T. (2014). Selective effects of explanation on learning during early childhood. *J. Experimental Child Psychology*; Legare, Gelman & Wellman (2010) on inconsistency and explanation. https://news.utexas.edu/2014/04/22/coming-up-with-explanations-helps-children-develop-cause-and-effect-thinking-skills-study-shows ; https://pmc.ncbi.nlm.nih.gov/articles/PMC3039682
26. Luby, S. et al. (2005). Effect of handwashing on child health: a randomised controlled trial. *The Lancet* 366. https://pubmed.ncbi.nlm.nih.gov/16023513/
27. Deci, E., Koestner, R., Ryan, R. (1999). A meta-analytic review of experiments examining the effects of extrinsic rewards on intrinsic motivation. *Psychological Bulletin* 125. https://leeds-faculty.colorado.edu/dahe7472/deci%201999.pdf
28. Kidd, C., Piantadosi, S., Aslin, R. (2012). The Goldilocks effect: human infants allocate attention to visual sequences that are neither too simple nor too complex. *PLoS ONE*. https://pmc.ncbi.nlm.nih.gov/articles/PMC3359326
29. Wilson, R. et al. (2019). The Eighty Five Percent Rule for optimal learning. *Nature Communications* 10, 4646. https://pmc.ncbi.nlm.nih.gov/articles/PMC6831579
30. Speech Synthesis API support (voices come from the operating system). https://www.testmuai.com/learning-hub/speech-synthesis-api-browser-support/ (Bangla voice availability on cheap Android phones not verified; test on devices.)

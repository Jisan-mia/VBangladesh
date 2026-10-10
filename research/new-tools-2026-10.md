# একটুখানি: the next 15 tools (October 2026)

Prepared 10 October 2026. Inputs: `research/ideas-communities.md` (90 ideas), `research/ideas-bangladesh.md` (73 ideas and the autocomplete appendix), `research/trends-2026-10.md`, `research/tool-design-brief.md` and `lib/catalog.ts` (the 12 live tools). On 10 Oct I also checked Google autocomplete (`hl=bn&gl=bd`) for a few stems the idea files didn't cover. Those queries are marked **(ac 10 Oct)**. Everything else is cited in the two idea files.

**Result:** 163 source rows → **123 unique ideas** → 50 → 25 → **15**, in six categories.

**How to use this file later.** Every idea has a stable ID (§1), and §2 sorts them by score. To add a tool, take the highest-scoring bench or long-list idea that fills a thin category and passes the gates (simplicity ≥ 4, data risk F ≥ 3). Then write its brief in the §7 format.

## Contents

1. Master list (123 ideas)
2. Scoring rubric and scores
3. Round 1 → 50
4. Round 2 → 25
5. Final 15
6. Category map for all 27 tools
7. Build briefs

---

## 1. Master list

- **Sources:** `cN` is row N of `ideas-communities.md`. `A1`…`I4` are rows of `ideas-bangladesh.md`. Row c78 held two ideas: c78a (waterlogging) became CI07 and c78b (Eid travel) went into CI06.
- **ID prefixes:**

  | Prefix | Theme |
  |---|---|
  | SP | sport |
  | FA | faith and festivals |
  | MO | money |
  | ED | students and language |
  | TI | age, time and diaspora |
  | ID | identity and quizzes |
  | FO | food |
  | NO | nostalgia lists |
  | CI | city life |
  | FM | family and weddings |
  | HL | health |
  | CR | creators |
  | GA | games |

- **Merging rule:** two rows became one ID when a user would see them as the same tool (same object and same output), even if the mechanics differed a little, for example the tea-personality quiz and the tea-order builder. Ideas that share a topic but produce a different thing stay separate, for example the salami cheque and the salami log.
- **Watch-out tags:**
  - **[data]**: needs live or authoritative data.
  - **[ruling]**: close to a religious ruling.
  - **[dup]**: duplicates a live tool.

| ID | Idea | From | What it is (concept · mechanic) | Season | Watch-outs |
|---|---|---|---|---|---|
| SP01 | আর্জেন্টিনা না ব্রাজিল? | c61, c79, A1 | Pick your team and the year you started; your rooftop flies the flag; national split from a tally · tap + tally | every match night | no crests; flag-safety line |
| SP02 | আমার জার্সি | c80, A2 | Name and number on a jersey back in team colours (football, Bangladesh cricket) · creator | match days, Eid gifts | no crests or sponsors; name filter |
| SP03 | মেসি না রোনালদো? | A3 | 10 football either/or picks against the national % · tap + tally | El Clásico nights | fold into ID07 as a pack |
| SP04 | সর্বকালের সেরা একাদশ (ক্রিকেট) | c76, A4 | Pick 11 Bangladesh players into a team sheet; crowd's most-picked · creator | series | fan-faction politics; 11 picks |
| SP05 | আমার ফুটবল একাদশ | A5 | 11 legends on a 4-3-3 pitch · creator | evergreen | names only |
| SP06 | ম্যাচের আগে ভবিষ্যদ্বাণী | c75, A6 | Lock a prediction in a link, reveal it after the match · tap | series | betting adjacency; fixtures typed by hand |
| SP07 | কতটা টাইগার ভক্ত? | A7 | 10 questions from Bangladesh cricket history · quiz | series weeks | fact-check every question |
| SP08 | আসল আর্জেন্টিনা/ব্রাজিল ফ্যান? | A8 | Team quiz; the rival takes it from your link · quiz | evergreen | facts must reflect the 2026 final |
| SP09 | গলির ক্রিকেট নিয়ম | A9 | Tick your street's rules, get a "আমাদের পাড়ার আইন" poster · checklist | winter | close to চলো খেলি |
| SP10 | আজ রাতে খেলা, আমার বাসায় | A10 | Watch-party invite with kickoff in Bangladesh and guest-city time · creator | big matches | IANA time zones |
| SP11 | হার্টব্রেক খাতা | c3 | 20 defining cricket matches: which did you watch live? X/20 · checklist | series | "খাতা" belongs to আমার ছোটবেলা |
| SP12 | ম্যাচ বিঙ্গো | c17 | Second-screen bingo during a live match · tap grid | series | no odds, stakes or prizes |
| SP13 | খোঁচা কার্ড | c81 | Curated friendly jibe card for a rival fan, with a reply link · tap | match nights | curated lines only |
| SP14 | রাতজাগা হিসাব | c82 | Matches you stayed up for → nights, tea, sleep lost · checklist | World Cup, Euro, Copa | no tournament in the window |
| SP15 | শেষ বলে ছয় | c83 | One-tap timing mini-game: win off the last ball · game | series | no player likeness |
| SP16 | ম্যাচের মন | c84 | Tap your mood each over or goal → a rollercoaster line · tap | live matches | only works during a match |
| FA01 | রোজার খাতা | B1 | 30 boxes, tap each day fasted; "আজ কয়টি রোজা" · tap | Ramadan | [ruling] public fasting count; privacy; moon start |
| FA02 | কত দিন বাকি? | B2, c89 | Pick an occasion (every faith, national days, own date) → big countdown · tap | year-round | [data] moon and tithi dates are "সম্ভাব্য" |
| FA03 | সালামির চেক | B4 | Toy Eid-salami cheque: giver, amount in words, Eid stamp · creator | Eid | must not look like a real cheque |
| FA04 | সালামি খাতা | c44 | Log salami by giver, with a ranking · ledger | Eid | money flexing; minors |
| FA05 | ইফতারির প্লেট | B5, c62 | Tap items onto a plate; most-picked item from a tally · tap + tally | Ramadan | food, not ritual |
| FA06 | গরুর ওজন কত? | B6, c39 | Tape girth and length → estimated live weight · calculator | Eid-ul-Adha (~May 2027) | estimate only, ±10–20% |
| FA07 | সেহরি-ইফতারের সময় | B7, c85 | District → today's sehri and iftar time · tap | Ramadan | [data] Islamic Foundation table only; a wrong minute does harm |
| FA08 | যাকাত খাতা | B8 | Assets → zakat estimate · calculator | Ramadan | [ruling] [data] nisab basis; prices |
| FA09 | ঈদের দিন খাতা | c10 | Eid-day checklist (মেহেদি, সেমাই, সালামি…) X/25 · checklist | Eid | festive items only |
| FA10 | পূজার মণ্ডপ খাতা | c9 | Pandals visited and rituals ticked · checklist | Durga Puja 16–21 Oct | too close to ship well |
| FA11 | চাঁদ দেখেছ? | c86 | On chand raat, tap "দেখেছি/দেখিনি" for a live count by area · tap + tally | eve of both Eids | [data] must not look like the official call |
| FA12 | মাংসের ভাগ | c87 | Kurbani meat in kg → three shares and a packet count · calculator | Eid-ul-Adha | [ruling] say "প্রচলিত রীতি" |
| FA13 | ফানুস ওড়াই | c88 | Colour a sky lantern, add a wish, watch it float · creator | Probarona, Shakrain | Buddhist meaning; fire safety |
| FA14 | উৎসবের জামার রং | c90 | Tap your Eid or Puja outfit colour; the country's palette fills in · tap + tally | Eid, Puja | none |
| MO01 | টাকা কথায় লিখি | C1 | Number → Bangla words (লাখ/কোটি, "মাত্র") plus the English line · calculator | evergreen | 1–99 words must be exact |
| MO02 | জমির মাপ | C2, c40 | শতাংশ/কাঠা/বিঘা/একর converter with a picture · calculator | evergreen | regional বিঘা; competitor |
| MO03 | বিদ্যুৎ বিল কত? | C3, c31 | Appliances × hours → units → slab bill · calculator | summer | [data] BERC tariffs change |
| MO04 | প্রবাসীর টাকার হিসাব | C4, c35 | Riyal, dirham or pound plus the rate → taka and its meaning at home · calculator | daily, before Eid | [data] rates; never advise a channel |
| MO05 | সোনার হিসাব | C5, c41 | ভরি/আনা/রতি ↔ grams, optional price · calculator | weddings | [data] price; low share |
| MO06 | চায়ের কাপে হিসাব | C6, c32 | Any price in cups of tea; cups a year in taka · calculator | evergreen | editable unit prices |
| MO07 | দাম তখন আর এখন | C7, c34 | Pick a year: ৳১০০ then vs now; birth-year prices · tap | evergreen | [data] needs sourced BBS/TCB series |
| MO08 | বেতনের পাই | C8 | Six sliders → donut of where the salary goes (% only) · slider | month start | money privacy |
| MO09 | টাকা জমানোর চার্ট | C9 | Grid of amounts; tap a box when you save it · tap | New Year | no interest or bank advice |
| MO10 | মোবাইল ব্যাংকিং খরচ | C10, c48 | Amount → cash-out and send-money charge · calculator | evergreen | [data] fees change; trademarks; competitor |
| MO11 | আমার প্রথম আয় | C11 | First salary and what you did with it → milestone card · creator | evergreen | no "earn online" hype |
| MO12 | মেসের মিল রেট | c45 | Meals × bazar → meal rate per member · calculator | monthly | [dup] ভাগাভাগি |
| ED01 | জিপিএ কত? | D1 | Tap a grade per subject (+4th) → GPA card · calculator | HSC results (~16 Oct), SSC (~May) | 4th-subject rule; kind copy |
| ED02 | পরীক্ষা/রেজাল্টের কাউন্টডাউন | D2, c46 | Exam or result date → days left, simple study blocks · calculator | SSC from 14 Mar 2027 | dates must come from the board |
| ED03 | শুদ্ধ বানান কোনটি? | D3, c69 | 10 word pairs; tap the right spelling · quiz | Ekushe 21 Feb 2027 | Bangla Academy rules; double forms |
| ED04 | বাগধারার মানে | D4 | Idiom as a literal drawing; tap its meaning · quiz | exams, Ekushe | standard grammar source |
| ED05 | আজকের ধাঁধা | D5 | One folk riddle a day; the link reveals the answer · quiz | daily | family-safe only |
| ED06 | বাংলা টাইপিং স্পিড | D6, c68 | 60-second typing test · game | job-exam seasons | keyboards differ; competitor |
| ED07 | আজকের ৫ প্রশ্ন (সাধারণ জ্ঞান) | D7 | Five Bangladesh GK questions a day · quiz | Victory Day, Ekushe packs | accuracy; contested history |
| ED08 | চাকরির বয়স | D8, c47 | DOB and circular date → time left under the age limit · calculator | circular seasons | rules change; competitor |
| ED09 | নামতা চ্যালেঞ্জ | D9 | Kids' times-table quiz → certificate · game | school terms | kids' privacy |
| ED10 | খাঁটি বাংলা কী? | c74 | Guess the Bangla word for English loanwords · quiz | Ekushe | coinages; cite a dictionary |
| TI01 | বয়স কত? (আমার বাংলা জন্মদিন) | E1, E2, c27 | DOB → exact age, Bangla birth date, weekday, season, days alive · calculator | evergreen, Boishakh | Bangla calendar revision; Hijri ±1 day |
| TI02 | জীবনের ঋতু | c28 | Life drawn as a grid of six seasons; monsoons and Eids lived · calculator | birthdays | no "weeks left" |
| TI03 | আজ কত তারিখ? | B3 | Today in বঙ্গাব্দ, English and Hijri, with the season · none | daily | Hijri ±1 day |
| TI04 | দুই দেশের ঘড়ি | E3, c38 | Your city and Bangladesh side by side; best time to call · tap | evergreen | DST; drop prayer times |
| TI05 | দেশে ফেরার কাউন্টডাউন | E4, c36 | Flight date → days left; family watches the same link · calculator | Dec, before Eid | one-tap date change |
| TI06 | প্রবাসের হিসাব | E5, c37 | Date you left → years abroad and Eids missed · calculator | Eid | emotional tone |
| TI07 | মায়ের কাছে চিঠি | E6 | Airmail-paper letter with tap-in lines · creator | Mother's Day, Eid | typing friction |
| TI08 | প্রবাস খাতা | c8 | 40 diaspora moments, X/40 · checklist | Ramadan, Eid | never mock hardship |
| TI09 | ছুটির ক্যালেন্ডার ২০২৭ | I2 | Three-calendar month view with holidays and your photo · creator | Nov–Jan | [data] gazette; moon days |
| TI10 | টাইম ক্যাপসুল চিঠি | c66 | Letter sealed until a date; a closed envelope until then · creator | New Year | not secure, say so |
| ID01 | নামের অর্থ | F1 | Name → meaning and origin card · lookup | births | [data] large dataset; every faith |
| ID02 | নামের ডিজাইন | F2, c67 | Name in Bangla lettering styles, incl. alphabet tiles · creator | evergreen, Ekushe | OFL fonts; near রিকশার রং |
| ID03 | ডাকনাম কী হতো? | F3, c58 | Three taps → a classic daak naam · quiz | evergreen | curate; no colourist names |
| ID04 | ফ্লেমস | F4, c23 | The school FLAMES game with two names · game | 14 Feb (inside Ramadan) | other people's names in links |
| ID05 | কবে বিয়ে হবে? (শুধু মজা) | F5 | Six cheeky questions → a joke prediction · quiz | weddings | marriage pressure; gender-equal jokes |
| ID06 | মনের বয়স কত? | F6 | Eight playful questions → heart age · quiz | birthdays | generic format |
| ID07 | এটা না ওটা | F7, c72 | 12 desi either/or picks with the national % · tap + tally | evergreen | minimum sample |
| ID08 | আমার চা | F8, c19 | Build your tea order → stall slip; national favourite · tap + tally | winter | none |
| ID09 | জিভ কোন জেলার? | F9 | Favourite dishes → the district famous for them · quiz | evergreen | district rivalry; near map territory |
| ID10 | আম্মুর কথা বিঙ্গো | F10, c13 | Grid of things mums say · tap grid | Mother's Day, Eid | affectionate only |
| ID11 | ঈদের নাটক বিঙ্গো | F11 | Grid of Eid-natok tropes · tap grid | Eid | tropes, not actors |
| ID12 | আমাকে কতটা চেনো? | F12, c22 | Answer about yourself; friends guess through the link · quiz | evergreen | two-sided flow |
| ID13 | ক্যাপশন ফটোকার্ড | F13 | Pick a mood → original one-liner card plus text to copy · tap | evergreen | copyright; content load |
| ID14 | আত্মীয়তার নাম | F14, c59 | Tap a chain → the kinship term; or a quiz · calculator/quiz | Eid, weddings | regional and religious variants |
| ID15 | বাঙালিপনা টেস্ট | c6 | 100 desi habits → "৭৮% বাঙালি" · checklist | Boishakh | exclusion risk; near আমার ছোটবেলা |
| ID16 | তুমি কোন ভর্তা? | c20 | Personality quiz → a bhorta · quiz | evergreen | none |
| ID17 | আড্ডায় তুমি কে? | c21 | Adda archetypes; group poster · quiz | Friendship Day | no mean labels |
| ID18 | দুজনের মিল | c24 | Two people answer 12 desi preferences → % match · quiz | 14 Feb, weddings | not real compatibility |
| ID19 | জেন-জি না আব্বু-আম্মু? | c25 | Match slang and elders' phrases to meanings · quiz | evergreen | crude slang |
| ID20 | দেশি টিয়ার লিস্ট | c26 | Rank food or transport S–D against the crowd · creator | evergreen | never rank people or regions |
| FO01 | মিষ্টির বাক্স | c1 | Tick which of 40 famous sweets you've eaten → box lid "৪০-এ ১৭" · checklist | winter, Eid | origin claims disputed |
| FO02 | মাছে-ভাতে | c2 | Tick 50 deshi fish you've eaten or can recognise · checklist | ilish season | accurate drawings |
| FO03 | পিঠা চেনো? | I1 | An illustrated pitha appears; tap its name; 10 rounds · quiz | Nabanna, Poush–Magh | regional names |
| FO04 | টং দোকানের রসিদ | c54 | Your adda's order printed as a "মামার টং" receipt · creator | evergreen | no tobacco items |
| NO01 | হিমু খাতা | c4 | Humayun Ahmed books read X/30, then which character you are · checklist | 13 Nov, Boi Mela | titles only; "খাতা" taken |
| NO02 | ক্যাসেটের যুগ / আমার ক্যাসেট | c5, c52 | Band songs you can sing, or a 10-song J-card · checklist/creator | winter concerts | titles only; near আমার ছোটবেলা |
| NO03 | হল-মেস জীবন | c7 | 40 hostel and mess moments → a certificate · checklist | admission season | hall politics |
| CI01 | জ্যামে জীবনের কত দিন? | G1, c29 | Commute minutes × years → days of life in traffic · calculator | evergreen | Dhaka-centric |
| CI02 | জ্যাম বিঙ্গো | c14 | Commute bingo · tap grid | evergreen | none |
| CI03 | বর্ষা যোদ্ধা | G2, c15 | Rainy-commute checklist/bingo · checklist | Jun–Sep | no flood or drowning jokes |
| CI04 | লোডশেডিং খাতা | G3, c30 | "কারেন্ট গেল/এল" log; optional district tally · tap + tally | Apr–Sep | politics; crowd data |
| CI05 | লোডশেডিং বিঙ্গো | c16 | Outage bingo · tap grid | Apr–Sep | no blame copy |
| CI06 | ঈদযাত্রার গল্প | G4, c78b | Dhaka → home: mode and hours; division averages · calculator + tally | both Eids | tallies can be gamed; accidents |
| CI07 | পানি কতটুকু? | c78a | Live waterlogging reports by area · tally | monsoon | [data] stale or unsafe |
| CI08 | মামা, যাবেন? | G5 | 30-second rickshaw-haggling game · game | evergreen | don't punch down |
| CI09 | আজ দাম কত? / বাসা ভাড়া কত? | c77 | Crowd-reported prices and rents · tally | price spikes | [data] spam; free numbers |
| CI10 | আজ ছাতা লাগবে? | c49 | Today's forecast as a rickshaw-art card · tap | monsoon | [data] weather API |
| FM01 | দাওয়াত কার্ড | H1, c64 | Wedding, akika or milad invitation with a map link · creator | Nov–Feb | personal data in links |
| FM02 | জন্মদিন/বিবাহবার্ষিকী কার্ড | H2 | Personal card with a photo · creator | evergreen | [dup] a শুভেচ্ছা কার্ড mode |
| FM03 | ঈদের লুডু চ্যাম্পিয়ন | H5 | Track family Ludo winners over the holiday · tap | Eid, winter | "লুডু কি হারাম" queries; no betting |
| FM04 | গানের কলি | I4 | Letter draw, timer and scores for family singing · game | Eid, winter nights | no lyrics |
| FM05 | আত্মীয়দের প্রশ্ন বিঙ্গো | c11 | "বিয়ে কবে?", "রেজাল্ট কত?" squares · tap grid | Eid, weddings | no body-shaming squares |
| FM06 | বিয়েবাড়ি বিঙ্গো | c12 | গেট ধরা, জুতা চুরি, স্টেজে ছবির লাইন · tap grid | Nov–Feb | no dowry or colourism |
| FM07 | বিয়ের বাজেট | c42 | Guests × plate + venue + holud → total · calculator | Nov–Feb | feature-heavy; money privacy |
| FM08 | দাওয়াতে কত দেব? | c43 | Closeness × distance × food → a gift range and a joke · calculator | Nov–Feb, Eid | class and social judgement |
| HL01 | ছোট্ট অতিথি আসছে | H3 | Last period date → due date and week · calculator | evergreen | medical; pregnancy loss |
| HL02 | রক্তদাতা কার্ড | H4 | Blood group and last donation → next date; badge · calculator | 14 Jun | national interval guidance |
| HL03 | দেশি খাবারের ক্যালরি প্লেট | I3 | Tap what you ate → calories · tap | New Year, after Eid | body image; food table |
| HL04 | ধোঁয়াহীন দিন | c33 | Quit counter: days, sticks not smoked, taka saved · calculator | 1 Jan, 31 May | no medical advice |
| CR01 | স্টুডিওর ছবি | c50 | Selfie placed in a 90s photo-studio backdrop · creator | evergreen | photo privacy; art-heavy |
| CR02 | সিনেমার পোস্টার | c51 | Your name (and a co-star) on a hand-painted Dhallywood banner · creator | Eid film releases | no real actors or films |
| CR03 | স্বপ্নের কনসার্ট | c53 | Pick artists → three-night line-up poster · creator | winter concerts | real names; mark imaginary |
| CR04 | চার প্রিয় | c55 | Four favourite films, natoks or books as type tiles · creator | Eid natoks | no poster images |
| CR05 | দেশি স্টার্টার প্যাক / ৩×৩ | c56, c57 | Pick drawn items into a toy box or a 3×3 grid · creator | evergreen | stereotypes |
| CR06 | প্রোফাইল ফ্রেম | c60, A11 | Photo in a national-day or cricket frame · creator | 16 Dec, 21 Feb, series | near শুভেচ্ছা কার্ড; no party symbols |
| CR07 | বছর র‍্যাপড | c63 | Eight prompts → story slides of your year · creator | Dec | several steps; one season |
| CR08 | ঘুড়ি বানাই | c65 | Design and name a kite · creator | Shakrain 14 Jan | none |
| CR09 | নতুন বছরের পাঞ্চ কার্ড | c18 | Habit punch cards · tap | 1 Jan, 14 Apr | progress needs storage |
| GA01 | দাম আন্দাজ | c70 | Higher/lower price game · game | evergreen | [data] sourced prices |
| GA02 | এক কোটি টাকা খরচ করো | c71 | Spend ৳১ কোটি on desi things → receipt · game | evergreen | price-list upkeep; must not feel like gambling |
| GA03 | দেশি মিশ্রণ | c73 | Infinite-Craft-style combining, 200 items · game | evergreen | heavy content |

---

## 2. Scoring rubric and scores

Each idea is scored 1–5 on seven criteria. 2 and 4 sit between the anchors.

| Code | Criterion | 1 | 3 | 5 |
|---|---|---|---|---|
| **C** | Common, relatable | a niche group | one big group (students, Dhaka commuters, the diaspora) | nearly every Bangladeshi |
| **S** | Simple on a cheap phone | needs reading or many inputs | a short flow of 3–5 decisions | one obvious tap or one field, result on the first screen |
| **E** | Emotion and shareability | a utility nobody posts | a card some people would post | identity, pride, nostalgia, humour, faith or family, plus a friend loop or a fixed "X/Y" score |
| **D** | Search demand | no evidence | nearby queries (captions, statuses) | tool-shaped autocomplete (ক্যালকুলেটর, লিস্ট, কত দিন বাকি, ডিজাইন) |
| **X** | Distinct from the 12 live tools | duplicates one (better as a mode) | new topic, same mechanic as a live tool | nothing like it on the site |
| **F** | Feasibility and accuracy (risk inverted) | live or fast-changing data, or a religious ruling | static data that must be sourced or updated yearly | pure computation or curated content we control |
| **T** | Seasonal value, Oct 2026–Apr 2027 | season falls outside the window | evergreen, no specific moment | a big moment we can still ship for (HSC results, weddings, 16 Dec, Ekushe's 75th, Ramadan, Eid, Boishakh), or a spike every match night |

- **Σ** is the plain sum, out of 35. **C+S+E** is shown beside it because the owner weighs those three most. It breaks ties and justifies the wildcards.
- **Gates are applied in the rounds, not baked into Σ:**
  - Round 1 needs F ≥ 2 and X ≥ 2.
  - The final 15 need S ≥ 4 and F ≥ 3.
  - An idea with X = 1 becomes a mode of a live tool.
- **Scores are judgement calls** based on the evidence in the two idea files. D is 4–5 only where autocomplete shows tool-shaped queries.

Sorted by Σ, then C+S+E.

| # | ID | Idea | C | S | E | D | X | F | T | Σ /35 | C+S+E /15 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | FA03 | সালামির চেক | 5 | 5 | 5 | 5 | 4 | 4 | 5 | **33** | 15 |
| 2 | FM05 | আত্মীয়দের প্রশ্ন বিঙ্গো | 5 | 5 | 5 | 3 | 5 | 5 | 5 | **33** | 15 |
| 3 | FM06 | বিয়েবাড়ি বিঙ্গো | 5 | 5 | 5 | 3 | 5 | 5 | 5 | **33** | 15 |
| 4 | SP01 | আর্জেন্টিনা না ব্রাজিল? | 5 | 5 | 5 | 4 | 5 | 4 | 4 | **32** | 15 |
| 5 | FA05 | ইফতারির প্লেট | 5 | 5 | 4 | 4 | 4 | 5 | 5 | **32** | 14 |
| 6 | TI01 | বয়স কত? (আমার বাংলা জন্মদিন) | 5 | 5 | 4 | 5 | 5 | 4 | 4 | **32** | 14 |
| 7 | FA02 | কত দিন বাকি? | 5 | 5 | 4 | 5 | 4 | 3 | 5 | **31** | 14 |
| 8 | FA11 | চাঁদ দেখেছ? | 5 | 5 | 4 | 4 | 5 | 3 | 5 | **31** | 14 |
| 9 | FO03 | পিঠা চেনো? | 5 | 5 | 4 | 4 | 4 | 4 | 5 | **31** | 14 |
| 10 | ID05 | কবে বিয়ে হবে? (শুধু মজা) | 4 | 5 | 5 | 4 | 5 | 3 | 5 | **31** | 14 |
| 11 | ID08 | আমার চা | 5 | 5 | 4 | 3 | 5 | 5 | 4 | **31** | 14 |
| 12 | SP02 | আমার জার্সি | 4 | 5 | 4 | 4 | 5 | 5 | 4 | **31** | 13 |
| 13 | TI05 | দেশে ফেরার কাউন্টডাউন | 3 | 5 | 5 | 4 | 5 | 5 | 4 | **31** | 13 |
| 14 | ED01 | জিপিএ কত? | 4 | 4 | 4 | 5 | 5 | 4 | 5 | **31** | 12 |
| 15 | FO01 | মিষ্টির বাক্স | 5 | 5 | 5 | 4 | 3 | 4 | 4 | **30** | 15 |
| 16 | ID07 | এটা না ওটা | 5 | 5 | 5 | 2 | 5 | 4 | 4 | **30** | 15 |
| 17 | ID10 | আম্মুর কথা বিঙ্গো | 5 | 5 | 5 | 2 | 5 | 5 | 3 | **30** | 15 |
| 18 | FM08 | দাওয়াতে কত দেব? | 5 | 4 | 4 | 4 | 5 | 3 | 5 | **30** | 13 |
| 19 | ID11 | ঈদের নাটক বিঙ্গো | 4 | 5 | 4 | 2 | 5 | 5 | 5 | **30** | 13 |
| 20 | TI06 | প্রবাসের হিসাব | 3 | 5 | 5 | 4 | 5 | 4 | 4 | **30** | 13 |
| 21 | FA01 | রোজার খাতা | 5 | 5 | 2 | 5 | 5 | 3 | 5 | **30** | 12 |
| 22 | MO09 | টাকা জমানোর চার্ট | 4 | 5 | 3 | 4 | 5 | 5 | 4 | **30** | 12 |
| 23 | CR06 | প্রোফাইল ফ্রেম | 5 | 5 | 4 | 4 | 2 | 4 | 5 | **29** | 14 |
| 24 | FA09 | ঈদের দিন খাতা | 5 | 5 | 4 | 2 | 3 | 5 | 5 | **29** | 14 |
| 25 | ID03 | ডাকনাম কী হতো? | 5 | 5 | 4 | 3 | 5 | 4 | 3 | **29** | 14 |
| 26 | MO06 | চায়ের কাপে হিসাব | 5 | 5 | 4 | 2 | 5 | 5 | 3 | **29** | 14 |
| 27 | CI01 | জ্যামে জীবনের কত দিন? | 4 | 5 | 4 | 3 | 5 | 5 | 3 | **29** | 13 |
| 28 | ED03 | শুদ্ধ বানান কোনটি? | 4 | 5 | 4 | 4 | 3 | 4 | 5 | **29** | 13 |
| 29 | ID04 | ফ্লেমস | 4 | 5 | 4 | 4 | 5 | 4 | 3 | **29** | 13 |
| 30 | ID06 | মনের বয়স কত? | 4 | 5 | 4 | 3 | 5 | 5 | 3 | **29** | 13 |
| 31 | ID13 | ক্যাপশন ফটোকার্ড | 5 | 5 | 3 | 5 | 4 | 4 | 3 | **29** | 13 |
| 32 | TI03 | আজ কত তারিখ? | 5 | 5 | 2 | 5 | 5 | 3 | 4 | **29** | 12 |
| 33 | MO01 | টাকা কথায় লিখি | 4 | 5 | 2 | 5 | 5 | 5 | 3 | **29** | 11 |
| 34 | CR02 | সিনেমার পোস্টার | 4 | 4 | 5 | 3 | 4 | 4 | 4 | **28** | 13 |
| 35 | ID01 | নামের অর্থ | 5 | 5 | 3 | 5 | 5 | 2 | 3 | **28** | 13 |
| 36 | ID02 | নামের ডিজাইন | 4 | 5 | 4 | 4 | 3 | 4 | 4 | **28** | 13 |
| 37 | ID16 | তুমি কোন ভর্তা? | 4 | 5 | 4 | 2 | 5 | 5 | 3 | **28** | 13 |
| 38 | SP03 | মেসি না রোনালদো? | 4 | 5 | 4 | 4 | 4 | 4 | 3 | **28** | 13 |
| 39 | SP07 | কতটা টাইগার ভক্ত? | 4 | 5 | 4 | 4 | 5 | 3 | 3 | **28** | 13 |
| 40 | SP09 | গলির ক্রিকেট নিয়ম | 4 | 5 | 4 | 2 | 4 | 5 | 4 | **28** | 13 |
| 41 | ED07 | আজকের ৫ প্রশ্ন (সাধারণ জ্ঞান) | 4 | 5 | 3 | 4 | 5 | 3 | 4 | **28** | 12 |
| 42 | FA07 | সেহরি-ইফতারের সময় | 5 | 5 | 2 | 5 | 5 | 1 | 5 | **28** | 12 |
| 43 | FA14 | উৎসবের জামার রং | 4 | 5 | 3 | 2 | 5 | 4 | 5 | **28** | 12 |
| 44 | CR07 | বছর র‍্যাপড | 4 | 3 | 4 | 2 | 5 | 5 | 5 | **28** | 11 |
| 45 | ED09 | নামতা চ্যালেঞ্জ | 3 | 5 | 3 | 4 | 5 | 5 | 3 | **28** | 11 |
| 46 | TI04 | দুই দেশের ঘড়ি | 3 | 5 | 3 | 5 | 5 | 4 | 3 | **28** | 11 |
| 47 | TI09 | ছুটির ক্যালেন্ডার ২০২৭ | 4 | 4 | 2 | 5 | 5 | 3 | 5 | **28** | 10 |
| 48 | MO07 | দাম তখন আর এখন | 5 | 5 | 4 | 3 | 5 | 2 | 3 | **27** | 14 |
| 49 | ED05 | আজকের ধাঁধা | 4 | 5 | 4 | 4 | 3 | 4 | 3 | **27** | 13 |
| 50 | FM02 | জন্মদিন/বিবাহবার্ষিকী কার্ড | 5 | 4 | 4 | 5 | 1 | 5 | 3 | **27** | 13 |
| 51 | SP13 | খোঁচা কার্ড | 4 | 5 | 4 | 2 | 5 | 4 | 3 | **27** | 13 |
| 52 | TI02 | জীবনের ঋতু | 4 | 5 | 4 | 2 | 4 | 5 | 3 | **27** | 13 |
| 53 | CI02 | জ্যাম বিঙ্গো | 4 | 5 | 3 | 2 | 5 | 5 | 3 | **27** | 12 |
| 54 | CI06 | ঈদযাত্রার গল্প | 4 | 4 | 4 | 3 | 5 | 3 | 4 | **27** | 12 |
| 55 | FA04 | সালামি খাতা | 4 | 4 | 4 | 3 | 3 | 4 | 5 | **27** | 12 |
| 56 | ID12 | আমাকে কতটা চেনো? | 4 | 3 | 5 | 3 | 5 | 4 | 3 | **27** | 12 |
| 57 | MO11 | আমার প্রথম আয় | 3 | 5 | 4 | 2 | 5 | 5 | 3 | **27** | 12 |
| 58 | SP06 | ম্যাচের আগে ভবিষ্যদ্বাণী | 4 | 4 | 4 | 3 | 5 | 3 | 4 | **27** | 12 |
| 59 | TI07 | মায়ের কাছে চিঠি | 3 | 4 | 5 | 3 | 4 | 5 | 3 | **27** | 12 |
| 60 | HL04 | ধোঁয়াহীন দিন | 3 | 4 | 4 | 3 | 5 | 4 | 4 | **27** | 11 |
| 61 | ID15 | বাঙালিপনা টেস্ট | 5 | 4 | 5 | 3 | 2 | 3 | 4 | **26** | 14 |
| 62 | SP11 | হার্টব্রেক খাতা | 4 | 5 | 5 | 2 | 3 | 4 | 3 | **26** | 14 |
| 63 | CI03 | বর্ষা যোদ্ধা | 4 | 5 | 4 | 2 | 5 | 5 | 1 | **26** | 13 |
| 64 | CR01 | স্টুডিওর ছবি | 4 | 4 | 5 | 2 | 4 | 4 | 3 | **26** | 13 |
| 65 | CR05 | দেশি স্টার্টার প্যাক / ৩×৩ | 4 | 4 | 4 | 2 | 5 | 4 | 3 | **26** | 12 |
| 66 | ED10 | খাঁটি বাংলা কী? | 4 | 5 | 3 | 3 | 3 | 3 | 5 | **26** | 12 |
| 67 | FM03 | ঈদের লুডু চ্যাম্পিয়ন | 4 | 4 | 4 | 2 | 3 | 4 | 5 | **26** | 12 |
| 68 | FO04 | টং দোকানের রসিদ | 4 | 4 | 4 | 2 | 4 | 5 | 3 | **26** | 12 |
| 69 | GA02 | এক কোটি টাকা খরচ করো | 4 | 4 | 4 | 3 | 5 | 3 | 3 | **26** | 12 |
| 70 | HL02 | রক্তদাতা কার্ড | 3 | 5 | 4 | 3 | 5 | 3 | 3 | **26** | 12 |
| 71 | ID17 | আড্ডায় তুমি কে? | 4 | 4 | 4 | 2 | 5 | 4 | 3 | **26** | 12 |
| 72 | NO01 | হিমু খাতা | 3 | 5 | 4 | 3 | 3 | 4 | 4 | **26** | 12 |
| 73 | SP08 | আসল আর্জেন্টিনা/ব্রাজিল ফ্যান? | 4 | 4 | 4 | 3 | 5 | 3 | 3 | **26** | 12 |
| 74 | SP12 | ম্যাচ বিঙ্গো | 4 | 5 | 3 | 1 | 5 | 5 | 3 | **26** | 12 |
| 75 | SP15 | শেষ বলে ছয় | 4 | 4 | 4 | 2 | 5 | 4 | 3 | **26** | 12 |
| 76 | TI08 | প্রবাস খাতা | 3 | 5 | 4 | 2 | 3 | 5 | 4 | **26** | 12 |
| 77 | CR08 | ঘুড়ি বানাই | 3 | 4 | 4 | 3 | 3 | 5 | 4 | **26** | 11 |
| 78 | ED04 | বাগধারার মানে | 3 | 5 | 3 | 4 | 4 | 4 | 3 | **26** | 11 |
| 79 | ED08 | চাকরির বয়স | 3 | 5 | 3 | 4 | 5 | 3 | 3 | **26** | 11 |
| 80 | FM04 | গানের কলি | 4 | 4 | 3 | 3 | 3 | 5 | 4 | **26** | 11 |
| 81 | SP04 | সর্বকালের সেরা একাদশ (ক্রিকেট) | 4 | 3 | 4 | 3 | 5 | 4 | 3 | **26** | 11 |
| 82 | TI10 | টাইম ক্যাপসুল চিঠি | 3 | 4 | 4 | 2 | 5 | 4 | 4 | **26** | 11 |
| 83 | FM01 | দাওয়াত কার্ড | 4 | 3 | 3 | 4 | 3 | 4 | 5 | **26** | 10 |
| 84 | FO02 | মাছে-ভাতে | 4 | 5 | 4 | 3 | 3 | 3 | 3 | **25** | 13 |
| 85 | GA01 | দাম আন্দাজ | 4 | 5 | 4 | 2 | 5 | 2 | 3 | **25** | 13 |
| 86 | CI04 | লোডশেডিং খাতা | 4 | 5 | 3 | 3 | 5 | 3 | 2 | **25** | 12 |
| 87 | CI05 | লোডশেডিং বিঙ্গো | 4 | 5 | 3 | 2 | 5 | 4 | 2 | **25** | 12 |
| 88 | CI08 | মামা, যাবেন? | 4 | 4 | 4 | 2 | 4 | 4 | 3 | **25** | 12 |
| 89 | FA13 | ফানুস ওড়াই | 3 | 5 | 4 | 2 | 4 | 4 | 3 | **25** | 12 |
| 90 | ID09 | জিভ কোন জেলার? | 4 | 4 | 4 | 4 | 3 | 3 | 3 | **25** | 12 |
| 91 | NO03 | হল-মেস জীবন | 3 | 5 | 4 | 2 | 4 | 4 | 3 | **25** | 12 |
| 92 | CR04 | চার প্রিয় | 3 | 4 | 4 | 2 | 5 | 4 | 3 | **25** | 11 |
| 93 | ED02 | পরীক্ষা/রেজাল্টের কাউন্টডাউন | 3 | 5 | 3 | 3 | 4 | 3 | 4 | **25** | 11 |
| 94 | HL01 | ছোট্ট অতিথি আসছে | 3 | 5 | 3 | 4 | 5 | 2 | 3 | **25** | 11 |
| 95 | ID14 | আত্মীয়তার নাম | 4 | 4 | 3 | 2 | 5 | 3 | 4 | **25** | 11 |
| 96 | ED06 | বাংলা টাইপিং স্পিড | 3 | 4 | 3 | 4 | 5 | 3 | 3 | **25** | 10 |
| 97 | HL03 | দেশি খাবারের ক্যালরি প্লেট | 4 | 4 | 2 | 4 | 5 | 3 | 3 | **25** | 10 |
| 98 | ID18 | দুজনের মিল | 3 | 3 | 4 | 3 | 5 | 4 | 3 | **25** | 10 |
| 99 | MO04 | প্রবাসীর টাকার হিসাব | 3 | 4 | 3 | 5 | 5 | 2 | 3 | **25** | 10 |
| 100 | MO08 | বেতনের পাই | 3 | 4 | 3 | 3 | 4 | 5 | 3 | **25** | 10 |
| 101 | CR09 | নতুন বছরের পাঞ্চ কার্ড | 3 | 3 | 3 | 2 | 5 | 5 | 4 | **25** | 9 |
| 102 | MO02 | জমির মাপ | 4 | 4 | 1 | 5 | 5 | 3 | 3 | **25** | 9 |
| 103 | MO05 | সোনার হিসাব | 3 | 4 | 2 | 4 | 5 | 3 | 4 | **25** | 9 |
| 104 | CI10 | আজ ছাতা লাগবে? | 5 | 5 | 2 | 5 | 5 | 1 | 1 | **24** | 12 |
| 105 | ID19 | জেন-জি না আব্বু-আম্মু? | 4 | 4 | 4 | 2 | 4 | 3 | 3 | **24** | 12 |
| 106 | CR03 | স্বপ্নের কনসার্ট | 3 | 4 | 4 | 1 | 5 | 4 | 3 | **24** | 11 |
| 107 | FA12 | মাংসের ভাগ | 3 | 5 | 3 | 3 | 5 | 3 | 2 | **24** | 11 |
| 108 | FA06 | গরুর ওজন কত? | 3 | 4 | 3 | 4 | 5 | 3 | 2 | **24** | 10 |
| 109 | MO10 | মোবাইল ব্যাংকিং খরচ | 4 | 5 | 1 | 4 | 5 | 2 | 3 | **24** | 10 |
| 110 | SP16 | ম্যাচের মন | 3 | 4 | 3 | 1 | 5 | 5 | 3 | **24** | 10 |
| 111 | SP05 | আমার ফুটবল একাদশ | 3 | 3 | 3 | 3 | 5 | 5 | 2 | **24** | 9 |
| 112 | FA10 | পূজার মণ্ডপ খাতা | 3 | 4 | 4 | 2 | 4 | 4 | 2 | **23** | 11 |
| 113 | NO02 | ক্যাসেটের যুগ / আমার ক্যাসেট | 3 | 4 | 4 | 3 | 2 | 4 | 3 | **23** | 11 |
| 114 | GA03 | দেশি মিশ্রণ | 3 | 4 | 3 | 2 | 5 | 3 | 3 | **23** | 10 |
| 115 | ID20 | দেশি টিয়ার লিস্ট | 3 | 3 | 4 | 1 | 5 | 4 | 3 | **23** | 10 |
| 116 | FM07 | বিয়ের বাজেট | 3 | 2 | 2 | 4 | 4 | 3 | 5 | **23** | 7 |
| 117 | SP14 | রাতজাগা হিসাব | 3 | 5 | 3 | 1 | 4 | 5 | 1 | **22** | 11 |
| 118 | SP10 | আজ রাতে খেলা, আমার বাসায় | 3 | 4 | 3 | 3 | 3 | 4 | 2 | **22** | 10 |
| 119 | MO03 | বিদ্যুৎ বিল কত? | 4 | 3 | 2 | 5 | 5 | 2 | 1 | **22** | 9 |
| 120 | CI09 | আজ দাম কত? / বাসা ভাড়া কত? | 4 | 3 | 2 | 4 | 4 | 1 | 3 | **21** | 9 |
| 121 | FA08 | যাকাত খাতা | 3 | 3 | 1 | 4 | 5 | 1 | 4 | **21** | 7 |
| 122 | CI07 | পানি কতটুকু? | 3 | 3 | 2 | 3 | 5 | 1 | 1 | **18** | 8 |
| 123 | MO12 | মেসের মিল রেট | 2 | 2 | 1 | 3 | 1 | 5 | 3 | **17** | 5 |

---

## 3. Round 1 → 50

**Rule:** every idea with Σ ≥ 28 that passes F ≥ 2 and X ≥ 2 (46 ideas), plus 4 wildcards chosen on the owner's criteria (cricket, football banter, beauty, daily habit). FA07 had Σ 28 but F = 1, so it is out.

| # | ID | Idea | Σ | Why it stays |
|---|---|---|---|---|
| 1 | FA03 | সালামির চেক | 33 | Eid ritual everyone knows; real "ঈদ সালামি চেক" searches; a send-to-the-elder loop |
| 2 | FM05 | আত্মীয়দের প্রশ্ন বিঙ্গো | 33 | everyone has heard "বিয়ে কবে?"; Eid and weddings are both in the window |
| 3 | FM06 | বিয়েবাড়ি বিঙ্গো | 33 | wedding season Nov–Feb; funny; no data risk |
| 4 | SP01 | আর্জেন্টিনা না ব্রাজিল? | 32 | the country's biggest football ritual in one tap, with a live split |
| 5 | FA05 | ইফতারির প্লেট | 32 | a daily Ramadan post; open to everyone; strong "ইফতার আইটেম" searches |
| 6 | TI01 | বয়স কত? | 32 | top calculator search, plus a Bangla birth date |
| 7 | FA02 | কত দিন বাকি? | 31 | "koto din baki" searches from every faith, all year |
| 8 | FA11 | চাঁদ দেখেছ? | 31 | one evening the whole country shares; tiny build; must stay clearly unofficial |
| 9 | FO03 | পিঠা চেনো? | 31 | pitha season and "পিঠার নাম ও ছবি" demand; a fixed score |
| 10 | ID05 | কবে বিয়ে হবে? | 31 | people really type it into Google; wedding-season humour |
| 11 | ID08 | আমার চা | 31 | everyone has a tea order; a national favourite from the tally |
| 12 | SP02 | আমার জার্সি | 31 | strong "জার্সি নাম ডিজাইন" demand; doubles as a profile picture |
| 13 | TI05 | দেশে ফেরার কাউন্টডাউন | 31 | the diaspora reopens it daily; family at home watches the same link |
| 14 | ED01 | জিপিএ কত? | 31 | HSC and SSC search magnet; results day is a family event |
| 15 | FO01 | মিষ্টির বাক্স | 30 | unseenbangladesh's X/Y grammar on food, no map; "মিষ্টির নাম ও ছবি" (ac 10 Oct) |
| 16 | ID07 | এটা না ওটা | 30 | the easiest possible post; a live % from tallies |
| 17 | ID10 | আম্মুর কথা বিঙ্গো | 30 | affectionate and universal; tags siblings |
| 18 | FM08 | দাওয়াতে কত দেব? | 30 | a wedding-season question people search for |
| 19 | ID11 | ঈদের নাটক বিঙ্গো | 30 | the Eid natok ritual; fits a bingo pack |
| 20 | TI06 | প্রবাসের হিসাব | 30 | "১৪টা ঈদ দূরে" is a specific, heartbreaking number |
| 21 | FA01 | রোজার খাতা | 30 | huge "আজ কয়টি রোজা" demand; its sensitivity is judged in Round 2 |
| 22 | MO09 | টাকা জমানোর চার্ট | 30 | evergreen "টাকা জমানো" searches; New Year hook |
| 23 | CR06 | প্রোফাইল ফ্রেম | 29 | 16 Dec and 21 Feb moments; close to শুভেচ্ছা কার্ড |
| 24 | FA09 | ঈদের দিন খাতা | 29 | an Eid-day X/Y of festive items only |
| 25 | ID03 | ডাকনাম কী হতো? | 29 | every Bangladeshi has a daak naam story |
| 26 | MO06 | চায়ের কাপে হিসাব | 29 | a funny, zero-risk way to reframe prices |
| 27 | CI01 | জ্যামে জীবনের কত দিন? | 29 | a painful-funny number for every Dhaka commuter |
| 28 | ED03 | শুদ্ধ বানান কোনটি? | 29 | Ekushe's 75th; a fixed score; real "শুদ্ধ বানান" searches |
| 29 | ID04 | ফ্লেমস | 29 | school nostalgia; "love calculator" searches |
| 30 | ID06 | মনের বয়স কত? | 29 | a light identity card; "মনের বয়স ১৬" searches |
| 31 | ID13 | ক্যাপশন ফটোকার্ড | 29 | caption hunting is enormous |
| 32 | TI03 | আজ কত তারিখ? | 29 | daily "আজ বাংলা কত তারিখ" searches |
| 33 | MO01 | টাকা কথায় লিখি | 29 | dozens of exact-amount searches; also powers the salami cheque |
| 34 | CR02 | সিনেমার পোস্টার | 28 | self-casting humour on a painted-banner look no one else has |
| 35 | ID01 | নামের অর্থ | 28 | huge search demand; dataset risk judged in Round 2 |
| 36 | ID02 | নামের ডিজাইন | 28 | "নামের ডিজাইন" searches; Ekushe lettering |
| 37 | ID16 | তুমি কোন ভর্তা? | 28 | a cheap, warm personality quiz |
| 38 | SP03 | মেসি না রোনালদো? | 28 | football's favourite argument; could be a pack |
| 39 | SP07 | কতটা টাইগার ভক্ত? | 28 | "ক্রিকেট কুইজ" demand; a fixed score |
| 40 | SP09 | গলির ক্রিকেট নিয়ম | 28 | every পাড়া had its own laws; a funny poster |
| 41 | ED07 | সাধারণ জ্ঞান | 28 | daily GK demand; a Victory Day pack |
| 42 | FA14 | উৎসবের জামার রং | 28 | one tap at Eid or Puja; a colour tally |
| 43 | CR07 | বছর র‍্যাপড | 28 | the December recap ritual |
| 44 | ED09 | নামতা চ্যালেঞ্জ | 28 | parents and diaspora weekend Bangla classes |
| 45 | TI04 | দুই দেশের ঘড়ি | 28 | strong "সৌদি আরবের সময়" searches |
| 46 | TI09 | ছুটির ক্যালেন্ডার ২০২৭ | 28 | "ছুটির তালিকা ২০২৭" demand Nov–Jan |
| 47 | SP11 | হার্টব্রেক খাতা | 26 | **wildcard** (C+S+E 14): shared cricket grief with an X/20 score |
| 48 | SP13 | খোঁচা কার্ড | 27 | **wildcard**: friendly Argentina–Brazil banter |
| 49 | TI02 | জীবনের ঋতু | 27 | **wildcard**: a life drawn as six seasons; beautiful and distinct |
| 50 | ED05 | আজকের ধাঁধা | 27 | **wildcard**: wholesome comment-bait, daily return |

**Notable cuts in Round 1**

- **FA07 সেহরি-ইফতারের সময় (28).** A static version does exist: the Islamic Foundation's district table. But it means about 3,800 values entered again every Ramadan. One wrong minute breaks trust on a religious duty, and the card is rarely shared. Parked. Revisit only with a verified IF file in hand.
- **MO07 দাম তখন আর এখন (27, C+S+E 14) and GA01 দাম আন্দাজ.** Both need a sourced BBS/TCB price series. Viral "old price" posts are often misdated.
- **FM02 জন্মদিন কার্ড (27) and MO12 মেসের মিল রেট.** Duplicates. Add them as modes of শুভেচ্ছা কার্ড and ভাগাভাগি.
- **ID15 বাঙালিপনা টেস্ট (26, C+S+E 14).** Too close to আমার ছোটবেলা. Scoring "how Bengali" someone is risks excluding minorities and the diaspora.
- **MO03 বিদ্যুৎ বিল, MO04 রিয়ালের রেট, MO05 সোনার দাম, MO10 বিকাশ খরচ.** Tariffs, rates and fees change. The competitor (Teamz Lab) already has them, and nobody posts the result.
- **MO02 জমির মাপ (25).** Big search demand but no emotion, and বিঘা varies by region. A later SEO utility.
- **CI07, CI09, CI10** (live waterlogging, crowd prices and rents, weather). Live data, spam and safety.
- **FA08 যাকাত.** Religious rulings plus daily prices.
- **CI03 বর্ষা যোদ্ধা, CI04/CI05 লোডশেডিং.** Their season is over until Apr–Sep 2027. A strong summer batch.
- **FA06 গরুর ওজন, FA12 মাংসের ভাগ.** Eid-ul-Adha (about 17 May 2027) falls just outside the window. Build in April.
- **FA10 পূজার মণ্ডপ খাতা.** Puja starts in 6 days. Plan it for October 2027.
- **SP04/SP05 একাদশ.** Eleven picks is heavy on a cheap phone, and cricket fan factions are political.
- **ID12 আমাকে কতটা চেনো? (27).** A great loop, but a two-sided flow. Later.
- **CR01 স্টুডিওর ছবি, CR05 স্টার্টার প্যাক.** Art-heavy. Next creator batch.
- **HL01 প্রেগন্যান্সি.** Medical risk.
- **FM07 বিয়ের বাজেট.** Feature-heavy (S2), plus money privacy.

---

## 4. Round 2 → 25

### Merges

| New entry | Merged from | Scores (C S E D X F T) | Σ | What the merge does |
|---|---|---|---|---|
| **কয়টা কমন পড়ল?** | FM05 + FM06 + ID10 + ID11 | 5 5 5 3 4 5 5 | 32 | One 4×4 "question paper" grid with four packs: আত্মীয়দের প্রশ্ন, বিয়েবাড়ি, আম্মুর কথা, ঈদের নাটক |
| **দম আটকানো ম্যাচ** | SP07 + SP11 | 4 4 5 4 5 4 3 | 29 | A quiz built on the defining matches: SP11's emotion with SP07's score and search demand, and no third tick-list |
| **কত দিন বাকি?** | FA02 + FA11, plus TI09's data | 5 5 4 5 4 3 5 | 31 | The countdown gets a চাঁদরাত mode, and the 2027 holiday table becomes a page section |
| **দেশে ফেরা** | TI05 + TI06, plus TI04's line | 3 4 5 4 5 4 4 | 29 | One luggage-tag card: years abroad, Eids away and an optional return countdown |

Two ideas are folded in as features, not entries. SP03 becomes a football pack in এটা না ওটা. SP13 becomes v2 reply lines in আর্জেন্টিনা না ব্রাজিল?.

### The 25

Categories use the proposed six (§6). **Final** = in the 15. **Bench** = first in line for the next batch.

| # | Entry | From | Category | Σ | Why | Status |
|---|---|---|---|---|---|---|
| 1 | আর্জেন্টিনা না ব্রাজিল? | SP01 (+SP13) | খেলাধুলা | 32 | biggest football ritual; one tap; tally | **Final** |
| 2 | আমার জার্সি | SP02 | খেলাধুলা | 31 | search magnet; football and Bangladesh cricket kits | **Final** |
| 3 | দম আটকানো ম্যাচ | SP07 + SP11 | খেলাধুলা | 29 | cricket emotion with a fixed score | **Final** |
| 4 | গলির ক্রিকেট নিয়ম | SP09 | খেলাধুলা | 28 | close to চলো খেলি's game rules; the cricket slot is taken | Bench |
| 5 | কত দিন বাকি? | FA02 + FA11 (+TI09) | উৎসব আর বিশ্বাস | 31 | every faith; year-round search; চাঁদরাত tally inside | **Final** |
| 6 | সালামির চেক | FA03 | উৎসব আর বিশ্বাস | 33 | top score; an Eid ritual with an approval loop | **Final** |
| 7 | ইফতারির প্লেট | FA05 | উৎসব আর বিশ্বাস | 32 | a daily Ramadan post; open to everyone; tally | **Final** |
| 8 | ঈদের দিন খাতা | FA09 | উৎসব আর বিশ্বাস | 29 | a 4th tick-list; Eid is already covered three ways | Bench |
| 9 | বয়স কত? | TI01 | হিসাব-নিকাশ | 32 | top calculator search; Bangla birthday | **Final** |
| 10 | টাকা কথায় লিখি | MO01 | হিসাব-নিকাশ | 29 | evergreen search; shares its engine with the salami cheque | **Final** |
| 11 | জিপিএ কত? | ED01 | হিসাব-নিকাশ | 31 | HSC and SSC search magnet | **Final** |
| 12 | আজ কত তারিখ? | TI03 | হিসাব-নিকাশ | 29 | same calendar engine as বয়স কত?; ship it as that tool's first screen first | Bench |
| 13 | টাকা জমানোর চার্ট | MO09 | হিসাব-নিকাশ | 30 | less emotion; progress needs storage; best as a New Year 2028 tool | Bench |
| 14 | জ্যামে জীবনের কত দিন? | CI01 | হিসাব-নিকাশ | 29 | Dhaka-only; strong next batch | Bench |
| 15 | কয়টা কমন পড়ল? | FM05 + FM06 + ID10 + ID11 | মজা আর কুইজ | 32 | universal humour; weddings now, Eid later; a fixed X/16 | **Final** |
| 16 | এটা না ওটা | ID07 (+SP03) | মজা আর কুইজ | 30 | the simplest post; a live % | **Final** |
| 17 | শুদ্ধ বানান কোনটি? | ED03 | মজা আর কুইজ | 29 | Ekushe's 75th; a fixed score | **Final** |
| 18 | পিঠা চেনো? | FO03 | মজা আর কুইজ | 31 | a second food tool; মিষ্টির বাক্স has the stronger brag | Bench |
| 19 | আমার চা | ID08 | মজা আর কুইজ | 31 | same tap-and-tally shape as এটা না ওটা; add a চা pack there first | Bench |
| 20 | কবে বিয়ে হবে? | ID05 | মজা আর কুইজ | 31 | overlaps কমন পড়ল's wedding humour; marriage-pressure risk | Bench |
| 21 | দাওয়াতে কত দেব? | FM08 | হিসাব-নিকাশ | 30 | money ranges differ by class; the wedding slot is taken | Bench |
| 22 | মিষ্টির বাক্স | FO01 | স্মৃতি আর গল্প | 30 | X/40 food pride; real searches | **Final** |
| 23 | দেশে ফেরা | TI05 + TI06 (+TI04) | স্মৃতি আর গল্প | 29 | the diaspora tool; family watches the link | **Final** |
| 24 | সিনেমার পোস্টার | CR02 | আঁকো আর সাজাও | 28 | the drawing slot: emotion 5, nothing like it on the site | **Final** |
| 25 | নামের ডিজাইন | ID02 | আঁকো আর সাজাও | 28 | lettering overlaps রিকশার রং; strong SEO; the next creator | Bench |

**Why a 28 (সিনেমার পোস্টার) beat three 31s.** শুভেচ্ছা কার্ড moves to the new festival category, so আঁকো আর সাজাও needs a new creator. Each 31 on the bench overlaps a tool already in the final: পিঠা overlaps মিষ্টি, চা overlaps এটা না ওটা, and বিয়ে overlaps কমন পড়ল.

**Cut at Round 2** (the other 19 from Round 1)

- **FA01 রোজার খাতা.** A shareable fasting count invites showing off, and it exposes women who can't fast that day. Questions about missed fasts are rulings. "আজ কত রমজান" can live in ইফতারির প্লেট once the official start date is set.
- **CR06 প্রোফাইল ফ্রেম.** Add a square "ফ্রেম" format to শুভেচ্ছা কার্ড instead.
- **ID01 নামের অর্থ.** It needs thousands of verified meanings across faiths, and a wrong meaning is personal.
- **ID13 ক্যাপশন ফটোকার্ড.** It needs hundreds of original lines, has copyright traps, and is close to শুভেচ্ছা কার্ড.
- **ID03 ডাকনাম, ID04 ফ্লেমস, ID06 মনের বয়স, ID16 ভর্তা.** Good but generic quiz formats. The quiz slots went to higher-scoring or seasonal ideas.
- **SP03, SP13.** Folded into এটা না ওটা and আর্জেন্টিনা না ব্রাজিল? (see Merges).
- **TI09 ছুটির ক্যালেন্ডার.** Same data as the countdown, so it became a section of কত দিন বাকি?.
- **TI04 দুই দেশের ঘড়ি.** Became the "দেশে এখন কয়টা" line in দেশে ফেরা.
- **TI02 জীবনের ঋতু.** Same input as বয়স কত?. Could be a v2 "ঋতুর গ্রিড" section there.
- **ED07 সাধারণ জ্ঞান.** A daily content load, and 1971 and 2024 history are contested. Accuracy and politics.
- **ED09 নামতা.** Kids only, with a small share loop.
- **ED05 ধাঁধা.** Daily content, and it overlaps শব্দ সাজাই's daily habit.
- **FA14 জামার রং.** A one-tap tally with a thin card. Next Eid batch.
- **MO06 চায়ের কাপে হিসাব.** Fun but thin.
- **CR07 বছর র‍্যাপড.** Several steps, and only one December window.

---

## 5. Final 15

| # | Slug | Name | Category | Mechanic | Moment | Σ | S |
|---|---|---|---|---|---|---|---|
| 1 | `argentina-na-brazil` | আর্জেন্টিনা না ব্রাজিল? | খেলাধুলা | tap + tally | every Argentina/Brazil match night | 32 | 5 |
| 2 | `amar-jersey` | আমার জার্সি | খেলাধুলা | creator | match days, Eid gifts | 31 | 5 |
| 3 | `dom-atkano` | দম আটকানো ম্যাচ | খেলাধুলা | 10-question quiz | series weeks | 29 | 4 |
| 4 | `koto-din-baki` | কত দিন বাকি? | উৎসব আর বিশ্বাস | countdown + চাঁদরাত tally | year-round; peaks before Ramadan and Eid | 31 | 5 |
| 5 | `salami-chek` | সালামির চেক | উৎসব আর বিশ্বাস | creator + approval loop | Eid-ul-Fitr ≈ 10 Mar 2027 | 33 | 5 |
| 6 | `iftar-plate` | ইফতারির প্লেট | উৎসব আর বিশ্বাস | tap + tally | Ramadan ≈ 8 Feb 2027 | 32 | 5 |
| 7 | `boyos` | বয়স কত? | হিসাব-নিকাশ | date calculator | evergreen; Boishakh 14 Apr | 32 | 5 |
| 8 | `taka-kothay` | টাকা কথায় লিখি | হিসাব-নিকাশ | number calculator | evergreen | 29 | 5 |
| 9 | `gpa` | জিপিএ কত? | হিসাব-নিকাশ | grade calculator | HSC/SSC results | 31 | 4 |
| 10 | `komon-porlo` | কয়টা কমন পড়ল? | মজা আর কুইজ | 4×4 grid, X/16 | weddings Nov–Feb; Eid | 32 | 5 |
| 11 | `eta-na-ota` | এটা না ওটা | মজা আর কুইজ | either/or + tally | evergreen | 30 | 5 |
| 12 | `banan` | শুদ্ধ বানান কোনটি? | মজা আর কুইজ | 10-question quiz | Ekushe 21 Feb 2027 (75th) | 29 | 5 |
| 13 | `mishtir-baksho` | মিষ্টির বাক্স | স্মৃতি আর গল্প | tick-list, X/40 | winter; Eid | 30 | 5 |
| 14 | `deshe-fera` | দেশে ফেরা | স্মৃতি আর গল্প | date card + live link | Dec holidays; before Eid | 29 | 4 |
| 15 | `cinema-poster` | সিনেমার পোস্টার | আঁকো আর সাজাও | creator | Eid film releases | 28 | 4 |

**Balance check**

- **Simplicity:** 11 of 15 score 5, and none is below 4. Each tool starts on the first screen with a filled-in sample.
- **Faith:**
  - Three Ramadan/Eid tools (salami, iftar, the countdown's চাঁদরাত mode) and an Eid pack in কমন পড়ল.
  - The countdown also covers Puja, Christmas, Buddha Purnima and the national days.
  - No rulings. The only authoritative data is moon-dependent dates, marked "সম্ভাব্য" until the national committee announces them.
- **Sport:** the Argentina–Brazil rivalry and the jersey for football; দম আটকানো ম্যাচ and the jersey's red-green kit for cricket. চলো খেলি joins them.
- **Search magnets:** বয়স ক্যালকুলেটর, টাকা কথায় লেখা, gpa calculator, জার্সি নাম ডিজাইন, কত দিন বাকি, ইফতার আইটেম লিস্ট, শুদ্ধ বানান, মিষ্টির নাম ও ছবি, ঈদ সালামি চেক.
- **Built to be shared:** কমন পড়ল, এটা না ওটা, আর্জেন্টিনা না ব্রাজিল?, সিনেমার পোস্টার, দম আটকানো ম্যাচ, দেশে ফেরা.
- **Mechanic mix:**

  | Mechanic | Count | Tools |
  |---|---|---|
  | Creators | 3 | jersey, salami, poster |
  | Calculators and countdowns | 5 | age, taka, GPA, countdown, দেশে ফেরা |
  | Quizzes | 2 | cricket, spelling |
  | Tick-lists | 2 | mishti, কমন পড়ল |
  | Tap + tally | 3 | Argentina–Brazil, এটা না ওটা, iftar |

  Only two new tick-lists join the flagship's, and no mechanic has more than five tools.
- **Data:** no live prices, rates, tariffs or prayer times. Two tools need a yearly data touch: কত দিন বাকি (the holiday gazette and moon dates) and জিপিএ (the board circular).
- **Backend:** short links everywhere. Fixed-id tallies only where the % is the point: Argentina–Brazil, এটা না ওটা, কমন পড়ল, চাঁদরাত, মিষ্টি, iftar. The others can add one later.

**Build order** (ship-by dates from the calendar in `trends-2026-10.md` §3)

| Ship by | Tool | Why then |
|---|---|---|
| as fast as possible, else May 2027 | জিপিএ কত? | HSC results are expected around 16 Oct (one report says 7–15 Nov). If missed, target SSC 2027 results (~May) and evergreen search |
| 1 Nov | কয়টা কমন পড়ল? | wedding season starts in November |
| early Nov | বয়স কত?, টাকা কথায় লিখি | evergreen search takes months to rank |
| mid Nov | আর্জেন্টিনা না ব্রাজিল?, আমার জার্সি | evergreen; every Argentina match night |
| 1 Dec | কত দিন বাকি?, মিষ্টির বাক্স | বিজয় দিবস 16 Dec, বড়দিন, then the Ramadan countdown; winter sweets |
| mid Dec | দেশে ফেরা | winter trips home, then Eid |
| Jan | দম আটকানো ম্যাচ, এটা না ওটা, সিনেমার পোস্টার | no fixed date; fills the quiet month |
| 1 Feb | শুদ্ধ বানান কোনটি?, ইফতারির প্লেট | Ekushe on 21 Feb; Ramadan starts about 8 Feb |
| 20 Feb | সালামির চেক, plus চাঁদরাত mode | Eid about 10 Mar; salami peaks on চাঁদরাত |

---

## 6. Category map for all 27 tools

Six categories, each 4–6 tools.

| Category | Tools (slug) | Count |
|---|---|---|
| **স্মৃতি আর গল্প** | আমার ছোটবেলা (`amar-chhotobela`), আমাদের ভাষার ছবিখাতা (`bhashar-chhobi`), আমাদের রান্নাখাতা (`rannakhata`), **মিষ্টির বাক্স** (`mishtir-baksho`), **দেশে ফেরা** (`deshe-fera`) | 5 |
| **মজা আর কুইজ** | শব্দ সাজাই (`shobdo-khela`), **কয়টা কমন পড়ল?** (`komon-porlo`), **এটা না ওটা** (`eta-na-ota`), **শুদ্ধ বানান কোনটি?** (`banan`) | 4 |
| **খেলাধুলা** | চলো খেলি (`cholo-kheli`), **আর্জেন্টিনা না ব্রাজিল?** (`argentina-na-brazil`), **আমার জার্সি** (`amar-jersey`), **দম আটকানো ম্যাচ** (`dom-atkano`) | 4 |
| **উৎসব আর বিশ্বাস** | শুভেচ্ছা কার্ড (`shubhechha`), **কত দিন বাকি?** (`koto-din-baki`), **সালামির চেক** (`salami-chek`), **ইফতারির প্লেট** (`iftar-plate`) | 4 |
| **আঁকো আর সাজাও** | ছোট্ট পাড়া (`chhotto-para`), আলপনা আঁকি (`alpana`), রিকশার রং (`riksharong`), **সিনেমার পোস্টার** (`cinema-poster`) | 4 |
| **হিসাব-নিকাশ** | বাজার নোট (`bazar-note`), ভাড়া কত? (`bhara`), ভাগাভাগি (`bhagabhagi`), **বয়স কত?** (`boyos`), **টাকা কথায় লিখি** (`taka-kothay`), **জিপিএ কত?** (`gpa`) | 6 |

Bold = new.

**Changes from today's `lib/catalog.ts`** (for the owner to apply; no code was changed)

- **Renamed:** "রোজকার কাজে" becomes "হিসাব-নিকাশ". It keeps বাজার নোট, ভাড়া কত? and ভাগাভাগি, and gains three tools.
- **Retired:** "সবাই মিলে". চলো খেলি is about playing desi games, so it moves to খেলাধুলা. শব্দ সাজাই moves to মজা আর কুইজ.
- **Moved:** শুভেচ্ছা কার্ড goes from আঁকো আর সাজাও to উৎসব আর বিশ্বাস.
- **New categories:** খেলাধুলা, উৎসব আর বিশ্বাস, মজা আর কুইজ.
- **Homepage order:** স্মৃতি আর গল্প (where the flagship lives), মজা আর কুইজ, খেলাধুলা, উৎসব আর বিশ্বাস, আঁকো আর সাজাও, হিসাব-নিকাশ. From Ramadan to Eid, move উৎসব আর বিশ্বাস up to second.
- **Where the bench would go:**

  | Category | Bench tools |
  |---|---|
  | মজা আর কুইজ | পিঠা চেনো, আমার চা, কবে বিয়ে হবে |
  | খেলাধুলা | গলির ক্রিকেট নিয়ম |
  | উৎসব আর বিশ্বাস | ঈদের দিন খাতা |
  | হিসাব-নিকাশ | আজ কত তারিখ, টাকা জমানো, জ্যামে জীবন, দাওয়াতে কত দেব |
  | আঁকো আর সাজাও | নামের ডিজাইন |

  হিসাব-নিকাশ is already the largest category, so prefer bench tools for the other categories first.


---

## 7. Build briefs

Every tool follows the 12 rules in `research/tool-design-brief.md` and the তুমি voice in `research/bangla-voice-guide.md`. The rules below apply to all 15 and are not repeated in each brief:

- **Cards:** feed 1080×1350 and story 1080×1920 via `FormatToggle`, story text kept out of `storySafe`, and a `drawFooterBand` question at the bottom.
- **Sharing:** `ShareBar` with a real caption, and `StickyNext` until the result is in view.
- **Links:** state lives in the URL hash through pure, tested functions (round-trip, hostile input, length caps, NFC). `share.ts` returns a personal preview title, and a shared link opens with a "এবার তোমার পালা" banner.
- **Names:** optional, ≤ 20 characters, NFC, never tallied.
- **Tallies:** fixed ids only, through `addToTally/readTally`, shown only above a minimum sample (suggest 100). Tallies are opt-in, labelled as a crowd count and not a survey.
- **Art:**
  - no FIFA/federation/BCB/ICC crests, no real people's photos or likeness, no brand logos;
  - no party election symbols (নৌকা, ধানের শীষ, দাঁড়িপাল্লা, লাঙ্গল) or party colour schemes;
  - no generic AI look (purple gradients, emoji icons, cream-serif-sage).
- **Photos** never leave the phone.

### 1. `argentina-na-brazil` — আর্জেন্টিনা না ব্রাজিল?

- **Concept:** ছাদের পতাকা. Every tournament, tin roofs and rooftops across Bangladesh fly giant Argentina and Brazil flags, often on neighbouring houses. Your card is your house with your flag on the roof.
- **Core interaction:**
  1. Tap your team: two big buttons for আর্জেন্টিনা and ব্রাজিল, plus an "অন্য দল" chip for স্পেন, জার্মানি, পর্তুগাল, ফ্রান্স and ইংল্যান্ড.
  2. Tap the year you started supporting (World Cup years ১৯৮৬…২০২৬).
  3. Add your name (optional) and share.
- **First screen:** a short hero, then a drawn tin-roof house with an empty flagpole and the two team buttons side by side. Under them is a live bar: "দেশে এখন: আর্জেন্টিনা ৫৮% · ব্রাজিল ৩৫% · অন্য ৭%". Below the minimum sample it reads "গোনা চলছে…".
- **Share card:**
  - Feed: the house at dusk with the flag in national colours on the roof, "রাফির ছাদে ২০০২ থেকে আর্জেন্টিনা", and the national split bar.
  - Story: a tall sky with the flag high, text in the safe area.
  - Footer: "তোমার ছাদে কোন পতাকা?"
- **Human line** (from the start year):
  - ≤ ১৯৯০: "৩৬ বছর, একবারও দল বদলাইনি।"
  - ২০০২–২০১৪: "বড় হয়েছি এই পতাকার নিচে।"
  - ≥ ২০২২: "নতুন প্রেম, পুরো জোর।"
  - The number of years is computed.
- **Friend loop / tally:**
  - "পাশের বাসা": your link opens with your house, and the friend picks their team.
  - The card then shows two houses side by side: "রাফি আর্জেন্টিনা, মিম ব্রাজিল — একই গলিতে".
  - Tally: team id, plus an optional division (8 fixed ids), giving the national and division split.
  - v2: curated banter lines (SP13) stamped "শুধু মজা", picked from a fixed list.
- **SEO:**
  - Title `আর্জেন্টিনা না ব্রাজিল? — ছাদে তোমার পতাকা` (42 characters).
  - H1 "তুমি কোন দলের? ছাদে ওঠাও পতাকা".
  - Queries: আর্জেন্টিনা সাপোর্টার · আর্জেন্টিনার পতাকা পিক · ব্রাজিল আর্জেন্টিনা · argentina vs brazil.
- **Link state:** `#t=arg&y=2002&n=রাফি` plus a friend's `&ft=bra&fy=2014&fn=মিম`. Team and year come from fixed lists. Preview: "রাফির ছাদে আর্জেন্টিনার পতাকা — তোমার ছাদে কোনটা?"
- **Data and accuracy risks:**
  - National flags are fine. Crests, kits with badges and player images are not.
  - The rivalry has turned violent before, and people have died fixing rooftop flags. Use friendly copy only, and add one safety line: "পতাকা টাঙাতে ছাদে উঠলে বিদ্যুতের তার থেকে দূরে থেকো।"
  - The split is a crowd count, labelled so.
- **Why it will be shared:** picking a side is identity. The national % starts "আমরাই বেশি" comment wars, and the two-house card tags the rival friend.
- **Simplicity:** 5/5

### 2. `amar-jersey` — আমার জার্সি

- **Concept:** the market jersey stall that prints your name and number on the back, with the shirt hung on a hanger against the shop wall.
- **Core interaction:**
  1. Type a name (Bangla or English letters).
  2. Pick a number (0–99; chips for common ones).
  3. Tap a kit by colour: লাল-সবুজ, আকাশি-সাদা ডোরা, হলুদ-সবুজ, সাদা, লাল, কমলা, নীল.
- **First screen:** the jersey back is already drawn in লাল-সবুজ with "তোমার নাম · ১০". The name field and kit swatches sit right under it. Every change redraws live.
- **Share card:**
  - Feed: the jersey on a hanger on a shop wall.
  - Story: the jersey large and centred.
  - An optional square crop works as a profile picture, if `cardSizes` allows it.
  - Footer: "তোমার পিঠে কোন নম্বর?"
- **Human line** (by number, never by player):
  - ১০: "দশ নম্বর মানে দায়িত্ব।"
  - ১: "সবার আগে আমি, সবার শেষেও আমি।"
  - Two-digit "lucky" numbers: "নম্বরটা আমার, গল্পটাও আমার।"
- **Friend loop / tally:**
  - "বন্ধুর জন্য বানাও": make a jersey with a friend's name as a gift. The link opens "রাফি তোমার জন্য একটা জার্সি বানিয়েছে".
  - Tally: kit id and number. "এই সপ্তাহে সবচেয়ে বেশি: ১০ নম্বর, আকাশি-সাদা".
- **SEO:**
  - Title `জার্সি নাম ডিজাইন — নিজের নাম আর নম্বর` (38).
  - H1 "পিঠে নিজের নাম, পছন্দের নম্বর".
  - Queries: জার্সি নাম ডিজাইন · জার্সি নাম্বার ডিজাইন · জার্সি নাম নাম্বার ডিজাইন · জার্সি নাম লেখার ডিজাইন · জার্সি নাম স্টাইল (ac 10 Oct).
- **Link state:** `#n=রাফি&no=10&k=sky`. Name ≤ 12 characters, Bangla/Latin/digits/space only. Number 0–99. Kit from a fixed list. Preview: "রাফির জার্সি, ১০ নম্বর — তোমারটা বানাও".
- **Data and accuracy risks:**
  - Kits are named by colour, never "Argentina kit". No crests, sponsors or federation names.
  - The card is public, so use a short Bangla + Banglish abuse blocklist for names.
  - Test conjunct shaping in canvas with the display font. Keep the name flat, not curved.
- **Why it will be shared:** it's a match-day post and a profile picture in one, and gifting a jersey with a friend's name is a built-in tag.
- **Simplicity:** 5/5

### 3. `dom-atkano` — দম আটকানো ম্যাচ

- **Concept:** the hand-turned stadium scoreboard (black board, white number plates) and the TV score strip every Bangladeshi has stared at, holding their breath.
- **Core interaction:**
  1. The first question is already on screen.
  2. Answer 10 quick questions, each a moment from a defining Bangladesh match: men's, women's and U19, wins and heartbreaks. Tap one of 3 chips, see the answer and a one-line memory.
  3. Get your score card.
- **First screen:** the scoreboard shows "প্রশ্ন ১/১০" with the question set, for example "২০১৬, বেঙ্গালুরু। শেষ ৩ বলে দরকার ২ রান। তারপর?", and three chips. There is no intro screen.
- **Share card:**
  - Feed: the scoreboard with "রাফি · ১০-এ ৮ · খাঁটি টাইগার" and a spoiler-free row of 10 plates (filled = right).
  - Story: the same, vertical.
  - Footer: "তুমি কয়টা পারবে?"
- **Human line** (from which questions were right):
  - All heartbreak questions right: "সব কষ্টের ম্যাচ মনে আছে, তবু ভক্ত। এটাই টাইগার।"
  - Low score: "ভুলে গেছ মানে কষ্টও কম। ভাগ্যবান!"
  - All wins right: "জেতার দিনগুলো তুমি বুকে রেখেছ।"
- **Friend loop / tally:**
  - A challenge link with the same 10 questions: "রাফি পেয়েছে ৮, তুমি?" The friend's result shows side by side.
  - Tally: per-question correct %. "মাত্র ৩১% মানুষের মনে আছে".
- **SEO:**
  - Title `ক্রিকেট কুইজ — দম আটকানো সেই ম্যাচগুলো` (38).
  - H1 "দম আটকানো সেই ম্যাচগুলো কতটা মনে আছে?"
  - Queries: ক্রিকেট কুইজ · ক্রিকেট কুইজ প্রশ্নোত্তর · cricket quiz (ac 10 Oct) · বাংলাদেশ ক্রিকেট দল প্রথম অধিনায়ক কে.
- **Link state:** `#set=s1&a=0120210112&n=রাফি`. The set comes from a fixed list and the answers are digits 0–2. The score is recomputed on open; never trust a passed score. Preview: "রাফি ১০-এ ৮ পেয়েছে — দম আটকানো ম্যাচগুলো তোমার মনে আছে?"
- **Data and accuracy risks:**
  - Use a bank of 20–30 static questions. Check each date, venue and margin against the match scorecard on ESPNcricinfo, and keep the source in `content.ts`.
  - Describe moments, not people. Several star players are or were politicians, so avoid naming them.
  - Name venues by city (মিরপুর, চট্টগ্রাম), not by politically named stadiums.
  - Include the women's Asia Cup 2018 and U19 World Cup 2020 titles.
  - No betting words. Add new matches once a year.
- **Why it will be shared:** cricket grief and pride are national feelings. A fixed score invites "১০-এ ১০" brags, and each heartbreak question opens a comment thread.
- **Simplicity:** 4/5

### 4. `koto-din-baki` — কত দিন বাকি?

- **Concept:** the tear-off wall calendar (দেয়ালের পাতা-ছেঁড়া ক্যালেন্ডার) in every home and shop, where you rip one page a day.
- **Core interaction:**
  1. The nearest occasion is preselected.
  2. Tap another chip if you like: ঈদুল ফিতর, রমজান, ঈদুল আজহা, দুর্গাপূজা, কালীপূজা, সরস্বতী পূজা, বুদ্ধ পূর্ণিমা, বড়দিন, পহেলা বৈশাখ, বিজয় দিবস, শহীদ দিবস, স্বাধীনতা দিবস, or "নিজের দিন" (a date picker plus a label such as "রাফির বিয়ে").
  3. Share.
- **First screen:** a calendar page with a giant Bangla numeral, "৩৭ দিন বাকি", the occasion name, and a "সম্ভাব্য" badge on moon- or tithi-based dates. The chips sit below. Further down is a static "২০২৭ সালের সরকারি ছুটি" table (TI09) for the list search.
- **চাঁদরাত mode** (FA11):
  - On the evening the national moon-sighting committee meets (date set in config), the Eid page shows "চাঁদ দেখেছ?" with two buttons, দেখেছি and দেখিনি, and division chips.
  - The live count reads "ঢাকা বিভাগে ১২৩ জন চাঁদ দেখেছে".
  - Big plain note: "এটা শুধু আমাদের মজার গোনা। ঈদ কবে, সেটা জানাবে জাতীয় চাঁদ দেখা কমিটি।" plus a link to the official announcement.
  - The mode closes once the committee announces.
- **Share card:**
  - Feed: the torn calendar page with the numeral and festival art: a moon for Eid, a dhak for Puja, a star for Christmas, a lamp for Buddha Purnima, red-green for national days.
  - Story: a tall page with the numeral filling the top half.
  - শহীদ দিবস uses a sober design and no "শুভ".
  - Footer: "তুমি কোন দিনটার অপেক্ষায়?"
- **Human line** (by days left):
  - more than 30: "এখনো অনেক দেরি, তবু গুনছি।"
  - 7–30: "ক্যালেন্ডারের পাতা ছিঁড়তে শুরু করো।"
  - under 7: "আর মাত্র ক'টা দিন!"
  - 0: "আজই!"
- **Friend loop / tally:**
  - A custom-date link reopens a live count for everyone, for example a wedding or exam.
  - Tallies: চাঁদরাত sightings (seen/not × 8 divisions × event id) and an optional "কোন উৎসবের অপেক্ষায়" pick.
- **SEO:**
  - Title `ঈদ কত দিন বাকি? — সব উৎসবের কাউন্টডাউন` (38).
  - H1 "পরের উৎসব আর কত দিন?"
  - Queries: কত দিন বাকি রমজানের · ঈদ কত দিন বাকি · koto din baki durga puja 2026 · ঈদুল ফিতর ২০২৭ কত দিন বাকি · সরকারি ছুটির তালিকা ২০২৭.
- **Link state:** `#o=eid-fitr`, or `#d=2027-02-14&l=রাফির বিয়ে`. Occasion ids come from a fixed list. A custom date must be within ±3 years, with the label ≤ 24 characters. Preview: "ঈদ আর ১২ দিন — তুমি কোন দিনের অপেক্ষায়?"
- **Data and accuracy risks:**
  - Hard-code the fixed dates.
  - Take Puja, Buddha Purnima and the moon festivals from the government's 2027 holiday list (Cabinet Division, due Oct–Nov 2026), never computed.
  - Mark Eid and Ramadan "সম্ভাব্য" until the moon-sighting committee speaks, then edit the config (2–4 edits a year).
  - Print the source under each date.
  - The moon tally must never look official.
- **Why it will be shared:** "ঈদ আর ১২ দিন" is already a classic story post, for every faith. Custom dates (a wedding, an exam) make it personal.
- **Simplicity:** 5/5

### 5. `salami-chek` — সালামির চেক

- **Concept:** the toy cheque book kids "write" to ask elders for Eid salami. Clearly a toy: rounded corners, an Eid-moon motif, a green salami envelope, "খেলনা চেক" printed in the corner.
- **Core interaction:**
  1. Tap who pays: মামা, খালামণি, চাচ্চু, ফুপ্পি, বড় ভাইয়া, বড় আপু, নানু, দাদু, আব্বু, আম্মু.
  2. Tap or type an amount (chips ৫০০, ১০০০, ২০০০, ৫০০০). The words fill in, for example "দুই হাজার টাকা মাত্র".
  3. Add your name as the receiver and send.
- **First screen:** the cheque is already filled in: "মামা → তোমার নাম · ১০০০ টাকা · এক হাজার টাকা মাত্র". Giver chips are above and amount chips below.
- **Share card:**
  - Feed: the cheque tucked into a green salami envelope.
  - Story: the cheque vertical under a crescent.
  - Footer: "তোমার সালামি কে দেবে?"
- **Human line** (giver and amount):
  - নানু: "নানুর সালামি সবসময় সবচেয়ে মিষ্টি।"
  - ≥ ৫০০০: "স্বপ্ন দেখতে টাকা লাগে না।"
  - বড় ভাইয়া: "ভাইয়া, এবার না বলো না!"
- **Friend loop** (the heart of the tool):
  - The link goes to the elder: "রাফি তোমার কাছে ১০০০ টাকার সালামি চেয়েছে".
  - One button, "সই করে দাও", stamps "অনুমোদিত — মামা". The elder sends the stamped card back.
  - The elder can then make cheques for their own juniors.
  - The page says plainly: "এটা খেলনা চেক — টাকা যায় না।"
  - Tally: giver id only. "এবার সবচেয়ে বেশি চেক কাটা হয়েছে মামার নামে". Never amounts.
- **SEO:**
  - Title `ঈদ সালামি চেক — নিজের নামে চেক বানাও` (36).
  - H1 "সালামি চাও? চেকটা কেটে পাঠাও".
  - Queries: ঈদ সালামি চেক · eid salami cheque book design · ঈদ সালামি কার্ড · ঈদ সালামি মেসেজ · ঈদ সালামি ক্যাপশন (ac 10 Oct).
- **Link state:** `#g=mama&a=1000&n=রাফি&ok=1`. Giver from a fixed list. Amount is an integer from 1 to 1,00,000. `ok` is a boolean. Preview: "রাফি মামার কাছে সালামি চেয়েছে — সই করে দাও!"
- **Data and accuracy risks:**
  - It must not resemble a real cheque: no bank name, MICR band, account or routing fields, "bearer" wording, or bank-style signature box.
  - Amount words come from the shared `taka-kothay` library, one tested source.
  - No wallet brands and no payments.
  - Minors use this, so names stay in the link and amounts are never tallied.
- **Why it will be shared:** asking for salami is a loved ritual, and the "stamp it and send it back" loop turns it into a conversation. About 10 lakh people already sent salami with e-cards at Eid 2025 (Jagonews24).
- **Simplicity:** 5/5

### 6. `iftar-plate` — ইফতারির প্লেট

- **Concept:** the home iftar plate (স্টিলের থালা) on a দস্তরখান, holding ছোলা, পেঁয়াজু, বেগুনি, জিলাপি, খেজুর, মুড়ি মাখা, হালিম, আলুর চপ, ফল, শরবত.
- **Core interaction:**
  1. Tap items on or off the plate. It starts with a typical plate: খেজুর, ছোলা, পেঁয়াজু, বেগুনি, মুড়ি, শরবত.
  2. Optionally tap where: বাসায়, অফিসে, ক্যাম্পাসে, ইফতার পার্টিতে, প্রবাসে.
  3. Share.
- **First screen:** the illustrated plate, already full, with item chips around it. One tally line: "আজ সবচেয়ে বেশি প্লেটে: বেগুনি". Below is a static "ইফতার আইটেমের নাম" list for search.
- **Share card:**
  - Feed: a top-down plate on a patterned mat, "রাফির আজকের ইফতারি".
  - Story: the plate centred, with the most-picked item line underneath.
  - Footer: "তোমার প্লেটে আজ কী?"
- **Human line** (from the picks):
  - হালিম: "হালিম থাকলে ইফতার পুরো।"
  - প্রবাসে: "দেশের প্লেট, দূরের টেবিল।"
  - 3 items or fewer: "অল্প হলেও আপন।"
  - জিলাপি and বেগুনি: "মিষ্টি আর ঝাল, দুটোই চাই।"
- **Friend loop / tally:**
  - The link shows your plate; a friend makes theirs, and both plates appear side by side.
  - Tally: item ids and place id. "এই রমজানে সবচেয়ে বেশি: বেগুনি (৬৮%)". Use a Ramadan-wide tally, not a daily one.
- **SEO:**
  - Title `ইফতার আইটেম লিস্ট — আজকের ইফতারির প্লেট` (39).
  - H1 "আজ তোমার প্লেটে কী?"
  - Queries: ইফতার আইটেম লিস্ট · ইফতারের আইটেমের ছবি · ইফতার আইটেম নাম · iftar item list · iftar item pic (ac 10 Oct).
- **Link state:** `#i=khejur,chola,peyaju&w=home&n=রাফি`. Items are unique ids from a fixed list, at most 12. Preview: "রাফির আজকের ইফতারি — তোমার প্লেটে কী?"
- **Data and accuracy risks:**
  - It's about food, not worship: no fast counting, no sehri or iftar times, no dua text.
  - Inclusive copy, so non-Muslim friends at an iftar can join.
  - No health claims and no brands.
  - "রমজানের ১২তম ইফতার" appears only after the official start date is in config. A 30-plate mosaic for Eid (localStorage, best effort) is v2.
- **Why it will be shared:** iftar photos are already a daily Ramadan post, and a drawn plate looks better than a phone photo. "Most popular" sparks the পেঁয়াজু-vs-বেগুনি debate, and the diaspora misses exactly these foods.
- **Simplicity:** 5/5

### 7. `boyos` — বয়স কত?

- **Concept:** the newspaper masthead that prints three dates. The card is "the front page of the day you were born" on a clearly fictional paper, "দৈনিক একটুখানি", not a real newspaper's look.
- **Core interaction:**
  1. Pick your birth date: day, month and year selects, which are easier than a calendar widget on cheap phones.
  2. Add your name (optional).
  3. Share.
- **First screen:**
  - Before input, the masthead shows today, for example "শনিবার, ২৫ আশ্বিন ১৪৩৩ · ১০ অক্টোবর ২০২৬". That also answers "আজ বাংলা কত তারিখ" (TI03).
  - The three selects sit below it.
  - The result: age in years, months and days; days alive; Bangla birth date; weekday; birth season (জন্মঋতু); and days to the next birthday.
- **Share card:**
  - Feed: a front page with the birth-date masthead, the headline "জন্ম নিল রাফি", the subhead "আজ তার বয়স ২৭ বছর ৩ মাস ১৪ দিন — ৯,৯০৪ দিন", and a season badge "বর্ষার মানুষ".
  - Story: a tall front page.
  - Footer: "তোমার জন্ম কোন ঋতুতে?"
- **Human line** (season and weekday):
  - শ্রাবণ: "শ্রাবণের বৃষ্টিতে জন্ম, তাই বুঝি মনটা এত নরম।"
  - শুক্রবার: "শুক্রবারে জন্ম — ছুটির দিনের মানুষ।"
  - Round numbers of days alive (১০,০০০) get a special line.
- **Friend loop / tally:**
  - "বন্ধুর সাথে মেলাও": open a friend's link and enter your own date. "রাফি তোমার চেয়ে ১ বছর ২ মাস বড়".
  - Tally: birth-season id (6). "এখন পর্যন্ত সবচেয়ে বেশি মানুষ বর্ষায় জন্মেছে".
- **SEO:**
  - Title `বয়স ক্যালকুলেটর — বয়স আর বাংলা জন্মদিন` (40).
  - H1 "তুমি আজ কত দিনের?"
  - Queries: বয়স ক্যালকুলেটর · জন্ম তারিখ দিয়ে বয়স ক্যালকুলেটর · বয়স বের করার ক্যালকুলেটর · boyos calculator · age calculator bangla.
- **Link state:** `#b=1999-06-26&n=রাফি` (+ `&vb=…&vn=…` to compare). Must be a real date between 1900 and today. A birth date in a link is personal, so the privacy note says so and the name stays optional. Preview: "রাফি আজ ৯,৯০৪ দিনের — তুমি কত দিনের?"
- **Data and accuracy risks:**
  - The Bangla date uses Bangladesh's revised calendar: 1 Boishakh = 14 April, Boishakh–Ashwin 31 days, Falgun 29 (30 in a leap year), the rest 30.
  - Those rules date from the 2019 revision. Earlier birth dates were printed under the older revision. Convert with the rules in force on the birth date, and test against archived newspaper datelines. If the old rules can't be verified, label the date "এখনকার পঞ্জিকা অনুযায়ী".
  - Leave Hijri out at launch. Hijri dates can be ±1 day because of moon sighting. Add them later only as "আনুমানিক".
  - Many official birth dates are 1 Jan by convention. Never comment on it.
- **Why it will be shared:** everyone has a birthday. "৯,৯০৪ দিনের আমি" and a Bangla birth date make a known number feel new. Birthday posts happen every day.
- **Simplicity:** 5/5

### 8. `taka-kothay` — টাকা কথায় লিখি

- **Concept:** ধারাপাত, the yellowed number primer every child learned উনচল্লিশ and ঊনপঞ্চাশ from.
- **Core interaction:**
  1. Type an amount (Bangla or English digits, paisa optional).
  2. See it in Bangla words with "টাকা মাত্র" and the English line ("Taka Fifty Thousand Only"), each with a copy button.
  3. Optionally share the primer card.
- **First screen:** the field is prefilled with "৫০,০০০" and the answer shows at once: "পঞ্চাশ হাজার টাকা মাত্র". It has lakh/crore grouping as you type (১২,৩৪,৫৬৭) and two copy buttons. Below is a static table of Bangla number words from 1 to 100 for search.
- **Share card:**
  - Feed: a ধারাপাত page with a red margin line: "১২,৩৪,৫৬৭ = বারো লাখ চৌত্রিশ হাজার পাঁচশো সাতষট্টি টাকা মাত্র".
  - Story: the same, vertical.
  - Footer: "এই সংখ্যাটা কথায় লিখতে পারবে?"
- **Human line** (from the number):
  - Contains a tricky ঊন- number: "ঊনচল্লিশ — এই বানানে কতজন আটকায়!"
  - Round number: "গোল সংখ্যা, মন খুশি।"
  - Crore or more: "এত শূন্য! গুনতে গুনতে চা ঠান্ডা।"
- **Friend loop / tally:** none at launch (numbers are free input). v2: a challenge link where a friend types the words and the page checks them.
- **SEO:**
  - Title `টাকা কথায় লেখা — বাংলা আর ইংরেজিতে` (35).
  - H1 "যেকোনো অঙ্ক, কথায় লেখা".
  - Queries: টাকা কথায় লেখা · ৫০০০০ টাকা কথায় লেখা · ১৫০০০ টাকা কথায় লেখা · টাকা কথায় লেখার নিয়ম · taka kothay lekha.
- **Link state:** `#a=1234567.50`. Digits only, Bangla digits normalised, capped at 999 crore. Preview: "১২,৩৪,৫৬৭ টাকা কথায় কী হয়? দেখে নাও".
- **Data and accuracy risks:**
  - The words for 1–99 are irregular. Use a hand-checked table that follows the Bangla Academy dictionary (for example the ঊন- forms), and mention the common alternative spelling.
  - Exhaustive tests for 0–100, plus the lakh and crore boundaries and paisa.
  - The English line defaults to Lakh/Crore, with an "international (million)" toggle.
  - Banks reject cheques whose figures and words differ, so add one line: "চেকে লেখার আগে আরেকবার মিলিয়ে নাও।"
  - This library also powers `salami-chek`.
- **Why it will be shared:** mainly a search tool. The primer card and the tricky-word line give people a reason to post, and teachers and parents send it to kids.
- **Simplicity:** 5/5

### 9. `gpa` — জিপিএ কত?

- **Concept:** the school notice board where results used to be pinned. The card is a handwritten chit on cork. It is deliberately not a transcript.
- **Core interaction:**
  1. Tap the exam and group: এসএসসি/এইচএসসি × বিজ্ঞান/মানবিক/ব্যবসায় শিক্ষা. This sets the subject list.
  2. Tap a grade per subject (A+ A A- B C D F) and the 4th subject. Every subject starts at A+, so the screen opens at ৫.০০.
  3. Share.
- **First screen:** exam chips, subject rows with grade chips, and a big live GPA number. The result updates on every tap.
- **Share card:**
  - Feed: a corkboard with a pinned chit, "রাফি · এইচএসসি ২০২৬ · জিপিএ ৪.৮৩", and a ribbon.
  - Story: the chit large.
  - Optional line chip: "ধন্যবাদ আম্মু-আব্বু".
  - Footer: "তোমার রেজাল্টের দিনটা কেমন ছিল?"
- **Human line** (from the GPA):
  - ৫.০০: "সব রাত জাগার দাম আজ মিলল।"
  - ৪.০০–৪.৯৯: "দারুণ! পরের ধাপে আরও ভালো হবে।"
  - Below ৪: "নম্বর একটা সংখ্যা। তুমি তার চেয়ে অনেক বড়।"
  - With an F in a compulsory subject there is no score card. Show a gentle "এবার হয়নি। আবার হবে।" and an optional "পরের বার দেখিয়ে দেব" card.
- **Friend loop / tally:** none on purpose. No grade comparison and no GPA leaderboard.
- **SEO:**
  - Title `জিপিএ ক্যালকুলেটর — এসএসসি ও এইচএসসি` (36).
  - H1 "তোমার জিপিএ কত হলো?"
  - Queries: gpa calculator hsc · gpa calculator ssc · এসএসসি জিপিএ ক্যালকুলেটর · gpa calculator without 4th subject · hsc 2026 gpa calculator.
  - Don't rely on "জিপিএ" alone; it autocompletes to জিপিএফ, the pension fund.
- **Link state:** `#e=hsc&g=sci&r=AP,A,AM,…&f=B&n=রাফি`. Grades come from a fixed set. The subject list derives from exam + group. The GPA is recomputed on open. Preview: "রাফির জিপিএ ৪.৮৩ — তোমারটা হিসাব করো".
- **Data and accuracy risks:**
  - Grade bands: 80–100 A+ 5.0 … 33–39 D 1.0, below 33 F.
  - 4th-subject rule: only points above 2 count, and the GPA is capped at 5.00.
  - Combine HSC two-paper subjects the way the board does.
  - Re-check all of this against the current board circular before launch, because reforms have been discussed.
  - Never output anything that looks like an official result (no board name, roll, registration or seal), so it can't be used as a fake.
  - Kind copy throughout.
- **Why it will be shared:** results day is a family event. GPA-5 and congratulation posts flood feeds, and parents post their children's results.
- **Timing:** HSC 2026 results are expected around 16 Oct (one report says 7–15 Nov). If it can't ship well by then, target SSC 2027 results (~May 2027) and evergreen search.
- **Simplicity:** 4/5

### 10. `komon-porlo` — কয়টা কমন পড়ল?

- **Concept:** the board-exam question paper and the student's joy at "কমন পড়েছে!" The bingo grid is printed like a question paper: "আত্মীয়দের প্রশ্ন · ঈদ পরীক্ষা ২০২৭ · সময়: সারা দিন · পূর্ণমান ১৬".
- **Core interaction:**
  1. A pack is preselected (আত্মীয়দের প্রশ্ন). Chips switch to বিয়েবাড়ি, আম্মুর কথা and ঈদের নাটক.
  2. Tap every square that "came common" in the 4×4 grid.
  3. Share. A full row, column or diagonal adds "বিঙ্গো!"
- **First screen:** the question-paper header and the 4×4 grid, already readable. Squares include "বিয়ে কবে?", "রেজাল্ট কত?", "চাকরি কবে?", "বেতন কত?", "এত রাত জেগে কী করিস?", "ইঞ্জিনিয়ার না ডাক্তার?" and "আমাদের সময়ে…". One line explains the game: "যেটা শুনেছ, তাতে চাপ দাও। এক লাইন মিললেই বিঙ্গো!" Autocomplete shows people ask "বিঙ্গো কার্ড কি", so the page leads with "কমন পড়া", which everyone knows.
- **Share card:**
  - Feed: the question paper with red "কমন" stamps, "১৬-র মধ্যে ১১টা কমন পড়েছে!" and a "বিঙ্গো!" ribbon if a line is complete.
  - Story: the paper vertical.
  - Footer: "তোমার কয়টা কমন পড়ল?"
- **Human line** (from the count):
  - 0–3: "এবার আত্মীয়রা ছুটিতে ছিলেন।"
  - 4–9: "মাঝারি প্রস্তুতি, ভালো ফল।"
  - 10–15: "পুরো সিলেবাস কমন!"
  - 16: "গোল্ডেন এ-প্লাস! সব প্রশ্ন একদিনেই।"
- **Friend loop / tally:**
  - The link opens the same pack with your stamps shown faintly, and the friend taps theirs.
  - Result: "রাফি ১১, মিম ৯ — দুজনেরই কমন: বিয়ে কবে?"
  - Tally: square ids. "৮৪% মানুষকে 'বিয়ে কবে?' শুনতে হয়েছে".
- **SEO:**
  - Title `আত্মীয়দের প্রশ্ন বিঙ্গো — কয়টা কমন পড়ল?` (42).
  - H1 "আত্মীয়দের প্রশ্ন: কয়টা কমন পড়ল?"
  - Queries: আত্মীয়দের নিয়ে স্ট্যাটাস · আত্মীয়দের নিয়ে ক্যাপশন · বিয়ে নিয়ে ফানি স্ট্যাটাস · বিয়েবাড়ি ক্যাপশন (ac 10 Oct).
  - The card is the status people are looking for.
- **Link state:** `#p=relatives&s=a4f1&n=রাফি` (+ `&f=…&fn=…`). The pack id comes from a fixed list. The 16-square mask is 4 hex characters, validated. Preview: "রাফির ১১টা কমন পড়েছে — তোমার কয়টা?"
- **Data and accuracy risks:**
  - Curated squares only, no free text.
  - Nothing about bodies, skin colour, weight, fertility ("বাচ্চা কবে?"), dowry, religion or politics.
  - Lines are equal for every gender.
  - The tone stays fond of elders: "ওনারা ভালোবাসেন বলেই জিজ্ঞেস করেন".
  - Exactly 16 squares per pack, so the score stays comparable.
  - বিয়েবাড়ি is the default pack Nov–Feb.
- **Why it will be shared:** everyone has heard "বিয়ে কবে?". The X/16 score and red stamps make a funny post that tags cousins and siblings, and it covers both wedding season and Eid.
- **Simplicity:** 5/5

### 11. `eta-na-ota` — এটা না ওটা

- **Concept:** চায়ের দোকানের তর্ক. The tea-stall chalkboard reads "আজকের তর্ক", and every pair is an argument the whole বেঞ্চ joins.
- **Core interaction:**
  1. A pair appears on the chalkboard ("ফুচকা না চটপটি?"). Tap a side.
  2. The live national split shows. Go through 12 pairs. The default pack is খাবার; chips switch to ঋতু আর অভ্যাস, ঈদ, and ফুটবল (from SP03: মেসি না রোনালদো…).
  3. Get your result card.
- **First screen:** the first pair already on the board, as two big tappable halves, with a progress line "১/১২".
- **Share card:**
  - Feed: the chalkboard listing 12 picks with ticks, and the fixed score "দেশের সাথে মিল ৭/১২" (how many picks match the majority).
  - Story: the board vertical.
  - Footer: "তুমি কোন দিকে?"
- **Human line** (from the match count):
  - 11–12: "তুমি পুরো দেশের মনের কথা বলো।"
  - 5–10: "অর্ধেক দেশ তোমার দলে।"
  - 0–4: "তুমি নিজের পথের মানুষ।"
  - Rare picks get their own line: "কাচ্চি ছেড়ে তেহারি? সাহস আছে!"
- **Friend loop / tally:**
  - A friend plays the same pack from your link: "দুজনের মিল ৯/১২".
  - Tally: per-pair side ids, giving the live %.
- **SEO** (search demand is weak; this one is share-led):
  - Title `এটা না ওটা — দেশি পছন্দের খেলা` (30).
  - H1 "ফুচকা না চটপটি? দেশ কার পক্ষে?"
  - Queries: this or that bangla · মেসি না রোনালদো কে সেরা · ফুচকা নিয়ে ক্যাপশন.
- **Link state:** `#p=food&a=LRRLLRLRRLLR&n=রাফি`. The pack comes from a fixed list; the answers are a 12-character L/R string. Preview: "রাফির পছন্দ দেশের সাথে ৭/১২ মেলে — তোমার?"
- **Data and accuracy risks:**
  - No political, religious, district-vs-district or person-vs-person pairs. Football players are fine.
  - Show the % only above the minimum sample, labelled "যারা খেলেছে তাদের মধ্যে".
- **Why it will be shared:** picking sides is the easiest post there is. Being in the minority is funny ("আমি একা চটপটি দলে!"), and friend-match % is a reason to tag.
- **Simplicity:** 5/5

### 12. `banan` — শুদ্ধ বানান কোনটি?

- **Concept:** দোকানের সাইনবোর্ড. Hand-painted shop signboards are a beloved genre of Bangla misspellings, and your job is to fix the board. The signs are generic and drawn, never a real shop.
- **Core interaction:**
  1. A painted signboard shows a word with two spellings, for example "দারিদ্র / দারিদ্র্য". Tap the right one.
  2. The board repaints with the right form and a one-line rule. Go through 10 rounds.
  3. Get your score card.
- **First screen:** the first signboard up, with two big chips and "১/১০".
- **Share card:**
  - Feed: a spoiler-free row of 10 small signboards (green = right, red = wrong) with "রাফি · ১০-এ ৮ · বানান-বীর". No words are shown, so friends can't copy.
  - Story: the boards stacked.
  - Footer: "তুমি কয়টা পারবে?"
- **Human line** (from the score):
  - 10: "তোমার হাতে সাইনবোর্ড দিলে একটাও ভুল থাকত না।"
  - 6–9: "প্রায় সব ঠিক, বাকিটা এখন শিখে গেলে।"
  - 0–5: "বানান ভুল হয়, ভালোবাসা কমে না।"
- **Friend loop / tally:**
  - A challenge link with the same 10 words: "রাফি পেয়েছে ৮, তুমি?"
  - Tally: per-word correct %. "মাত্র ২৯% ঠিক বেছেছে 'মুমূর্ষু'".
  - For Ekushe (21 Feb 2027, the 75th anniversary), a special set framed respectfully: "একুশের ৭৫ বছর: ১০টা শব্দ, শুদ্ধ করে লিখি". Same mechanic, sober colours, no jokes.
- **SEO:**
  - Title `শুদ্ধ বানান কোনটি? — ১০টা শব্দের পরীক্ষা` (40).
  - H1 "কোন বানানটা শুদ্ধ?"
  - Queries: শুদ্ধ বানান কোনটি · বাংলা বানান চেকার · বাংলা বানানের নিয়ম · ভুল বানান সঠিক কোনটি · শুদ্ধ বানান বাংলা একাডেমি.
- **Link state:** `#set=e75&a=1101111011&n=রাফি`. The set comes from a fixed list; answers are bits, rescored on open. Preview: "রাফি ১০-এ ৮টা বানান ঠিক করেছে — তুমি পারবে?"
- **Data and accuracy risks:**
  - Every answer comes from the Bangla Academy dictionary and standard spelling rules, with the edition cited.
  - Leave out words with two accepted forms, and words whose standard spelling changed recently.
  - Clearly different from শব্দ সাজাই: no letter puzzle and no daily grid.
- **Why it will be shared:** Bangla pride in Ekushe's 75th year, a fixed score, and the itch to prove you know better. Teachers and students forward quizzes.
- **Simplicity:** 5/5

### 13. `mishtir-baksho` — মিষ্টির বাক্স

- **Concept:** the white sweet box with pink or blue print, tied with string, that arrives with every piece of good news.
- **Core interaction:**
  1. Tap each of 40 drawn sweets you've eaten. Groups: রসের মিষ্টি, সন্দেশ, দই, আরও. For example রসগোল্লা, কালোজাম, পোড়াবাড়ির চমচম, নাটোরের কাঁচাগোল্লা, কুমিল্লার রসমালাই, মুক্তাগাছার মণ্ডা, বগুড়ার দই, বালিশ মিষ্টি, ছানামুখী, প্যারা সন্দেশ. Each tap drops the sweet into the box.
  2. Add your name (optional).
  3. Share.
- **First screen:** the open box with a counter. Three near-universal sweets are already in (রসগোল্লা, কালোজাম, মিষ্টি দই), so it reads "৪০-এ ৩টা", not zero. The sweet grid is below.
- **Share card:**
  - Feed: the box seen from above with the eaten sweets inside, and the lid reading "রাফির মিষ্টির বাক্স · ৪০-এ ২২টা".
  - Story: the box with the lid propped open.
  - Title tiers:

    | Sweets | Title |
    |---|---|
    | ০–১০ | মিষ্টিমুখ শুরু |
    | ১১–২০ | রসিক |
    | ২১–৩০ | মিষ্টি-পর্যটক |
    | ৩১–৪০ | ময়রার প্রিয় খদ্দের |

  - Footer: "তোমার বাক্সে কয়টা?"
- **Human line** (from the picks):
  - পোড়াবাড়ির চমচম: "টাঙ্গাইলের চমচম একবার খেলে ভোলা যায় না।"
  - Under 10: "বাক্সে এখনো অনেক জায়গা — চলো, মিষ্টির দোকানে!"
  - All দই: "দই ছাড়া দাওয়াত অসম্পূর্ণ।"
- **Friend loop / tally:**
  - The friend's link shows both boxes: "দুজনের মিল ১৪টা — রাফির বাক্সে ৫টা বেশি".
  - Tally: sweet ids. "সবচেয়ে কম মানুষ খেয়েছে: মুক্তাগাছার মণ্ডা". This works as a discovery prompt.
- **SEO:**
  - Title `বিখ্যাত মিষ্টির নাম — তুমি কয়টা খেয়েছ?` (40).
  - H1 "তোমার মিষ্টির বাক্সে কয়টা?"
  - Queries: মিষ্টির নাম ও ছবি · মিষ্টির নামের তালিকা · বিখ্যাত মিষ্টির নাম · বাংলাদেশের বিখ্যাত মিষ্টি (ac 10 Oct).
  - A static "৪০টা মিষ্টির নাম ও ছবি" section serves the list search.
- **Link state:** `#s=<40-bit mask, base36>&n=রাফি`. Preview: "রাফির মিষ্টির বাক্সে ২২টা — তোমার কয়টা?"
- **Data and accuracy risks:**
  - List by sweet, never on a map, to stay clear of district-visited maps.
  - Origin wording: "যেখানকার বলে পরিচিত". Where a sweet has a Bangladesh GI registration (DPDT register), cite it.
  - Original drawings. No shop names or brands. No district ranking.
- **Why it will be shared:** food pride plus a fixed score, which is unseenbangladesh's grammar without a map. "৪০-এ ২২" begs comparison, and the diaspora miss these sweets most.
- **Simplicity:** 5/5

### 14. `deshe-fera` — দেশে ফেরা

- **Concept:** the paper luggage tag tied to the suitcase handle at the airport, the one that says where home is: "→ ঢাকা".
- **Core interaction:**
  1. Tap where you live: সৌদি আরব, আমিরাত, মালয়েশিয়া, কাতার, ওমান, কুয়েত, সিঙ্গাপুর, ইতালি, যুক্তরাজ্য, যুক্তরাষ্ট্র, কানাডা, অস্ট্রেলিয়া, অন্য দেশ.
  2. Pick when you left (month and year). The card shows "৭ বছর ৩ মাস প্রবাসে · ১৪টা ঈদ দূরে".
  3. Optional: add your return date. The card adds "দেশে ফিরছি আর ৪৭ দিন".
- **First screen:** a luggage tag already showing a sample (রিয়াদ → ঢাকা), country chips and month/year selects. One small line: "দেশে এখন রাত ১১টা" (TI04), computed with IANA time zones.
- **Share card:**
  - Feed: the luggage tag on a suitcase handle, "রাফি · রিয়াদ → ঢাকা · ৭ বছর ৩ মাস প্রবাসে · ১৪টা ঈদ দূরে · আর ৪৭ দিন", with an optional photo.
  - Story: the tag hanging long down the frame.
  - Footer: "তুমি কত দিন দেশের বাইরে?"
- **Human line** (from the inputs):
  - With a return date: "১৪টা ঈদ ভিডিও কলে। এবারেরটা মায়ের পাশে।"
  - Without: "দূরে আছি, মন পড়ে আছে বাড়ির উঠোনে।"
  - Under 1 year abroad: "প্রথম বছরটাই সবচেয়ে লম্বা।"
- **Family loop / tally:**
  - The link reopens as a live countdown for family at home: "রাফি দেশে ফিরছে আর ৪৭ দিন". It is recomputed on open and ticks down daily.
  - Family can reply with a fixed-line card: "আমরা অপেক্ষায় — আম্মু", with chips for আম্মু, আব্বু, বউ, স্বামী, ছেলে, মেয়ে, ভাই, বোন.
  - Tally: country id. "সবচেয়ে বেশি এসেছে সৌদি আরব থেকে".
- **SEO:**
  - Title `প্রবাস জীবনের হিসাব — দেশে ফেরার কাউন্টডাউন` (43).
  - H1 "কত দিন প্রবাসে, দেশে ফিরতে আর কত দিন?"
  - Queries: প্রবাস জীবন সুখের হোক স্ট্যাটাস · প্রবাস জীবন নিয়ে ক্যাপশন · দেশে যাওয়ার স্ট্যাটাস · দেশে যাওয়ার পিক · দেশে ফেরার স্ট্যাটাস (ac 10 Oct).
- **Link state:** `#c=sa&l=2019-07&r=2026-12-20&n=রাফি`. The country comes from a fixed list. "Left" must be in the past. "Return" must be within 2 years. Preview: "রাফি ৭ বছর প্রবাসে — দেশে ফিরছে আর ৪৭ দিন".
- **Data and accuracy risks:**
  - Count Eids from a static table of Bangladesh-observed Eid dates (past government holiday lists), labelled "প্রায়", because the host country's Eid can differ by a day.
  - No flight numbers, visa, income or legal-status questions.
  - Flights get disrupted (the 2026 Gulf conflict), so offer a one-tap date change and gentle copy.
  - Never joke about migrant hardship.
- **Why it will be shared:** homesickness is the diaspora's strongest emotion, and "১৪টা ঈদ দূরে" is a specific, aching number. The family-watching link brings people back daily, on imo and WhatsApp as much as Facebook.
- **Simplicity:** 4/5

### 15. `cinema-poster` — সিনেমার পোস্টার

- **Concept:** the hand-painted cinema-hall banner, with flat bold colours, giant outlined Bangla lettering, painted faces and "আসিতেছে!". Flex printing replaced these banners, which makes them nostalgic.
- **Core interaction:**
  1. Tap a genre: প্রেম, অ্যাকশন, পারিবারিক, কমেডি, ভূতের. One is preselected.
  2. Type your name and, optionally, a co-star's. The film title is picked from a curated bank per genre, and "আরেকটা নাম" shuffles it.
  3. Optionally add a photo, posterised on the phone. Share.
- **First screen:** a finished poster with a sample name, genre chips above, and the name field and shuffle button below.
- **Share card:**
  - Feed: the full poster with the title in huge outlined letters, "অভিনয়ে: রাফি · মিম", and the tagline "আসিতেছে! সারা দেশে একযোগে".
  - Story: a taller banner.
  - Footer: "তোমার ছবির নাম কী হবে?"
- **Human line** (from the genre):
  - প্রেম: "এমন প্রেম আগে দেখেনি ঢাকাই সিনেমা।"
  - ভূতের: "রাতে একা দেখবেন না!" This is a quoted tagline, the voice guide's exception.
  - পারিবারিক: "সপরিবারে দেখার মতো ছবি।"
  - কমেডি: "হাসতে হাসতে পেট ব্যথা হলে আমরা দায়ী না।"
- **Friend loop / tally:**
  - Co-star: the friend opens the link and sees "তুমি রাফির ছবির সহশিল্পী! নিজের পোস্টার বানাও". The word is gender-neutral.
  - Tally: genre ids. "এই সপ্তাহে সবচেয়ে বেশি বানানো হয়েছে প্রেমের ছবি".
- **SEO:**
  - Title `বাংলা সিনেমার পোস্টার — নিজের নামে বানাও` (40).
  - H1 "আসিতেছে! তোমার নামে সিনেমা".
  - Queries: বাংলা সিনেমার পোস্টার · bangla cinema poster old · bangla cinema poster art · bangla cinema posters (ac 10 Oct).
- **Link state:** `#g=prem&t=12&n=রাফি&c=মিম`. The title is an id from the curated bank, never free text. The photo never goes in the link. Preview: "আসিতেছে! রাফির নতুন ছবি — তোমার পোস্টার বানাও".
- **Data and accuracy risks:**
  - No real actors, films, studios or copied posters. Check curated titles against well-known film titles.
  - Original painted backgrounds per genre. Action art stays stylised: fists and sparks, not guns or blood.
  - Abuse filter on names. The photo filter runs on the phone.
  - Keep it family-safe, because cards land on imo with elders.
- **Why it will be shared:** casting yourself and a friend in a film is a proven meme format. The painted-banner look is pure nostalgia, and tagging the co-star is built in. Eid film releases give it a yearly moment.
- **Simplicity:** 4/5

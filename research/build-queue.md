# একটুখানি: build queue (October 2026)

Prepared 10 October 2026 from `research/new-tools-2026-10.md` (123 unique ideas, IDs and scores in §1–§2, final 15 in §5, briefs in §7), the raw evidence in `research/ideas-communities.md` and `research/ideas-bangladesh.md`, the standard in `research/tool-design-brief.md`, and the 12 live tools in `lib/catalog.ts`.

**Orchestration reads §3.** Every tool is built to the 12 rules in `tool-design-brief.md` and the shared rules at the top of `new-tools-2026-10.md` §7 (feed + story cards, `ShareBar`, `StickyNext`, hash state with tests, personal preview titles, "এবার তোমার পালা" banner, optional names ≤ 20 chars never tallied, tallies over fixed ids only with a minimum sample, no crests/logos/party symbols/real likenesses, photos never leave the phone). Those rules are not repeated in the briefs below.

## Contents

1. Summary
2. Categories
3. Queue
4. Merged, features of existing, dropped
5. Build briefs

---

## 1. Summary

| | Count | Ideas (IDs) used |
|---|---|---|
| **New tools in the queue** | **74** | 94 |
| … the final 15 (waves 1–3) | 15 | 26 (incl. 4 merges and 4 folded features from the research rounds) |
| … the rest (waves 4–15) | 59 | 68 |
| **New merges** (two ideas → one tool) | 9 | 18 (already counted in the 59) |
| **Features of an existing or queued tool** | 16 | 16 |
| **Dropped** | 13 | 13 |
| **Total** | | **123** |

- **Catalog after the queue:** 12 live + 74 new = **86 tools** in 10 categories.
- **Waves:** **15** (14 waves of 5, the last wave of 4).
- **Why 74 and not ~120.** The 123 ideas hold many near-twins. Four bingo packs are one tool (কয়টা কমন পড়ল?). Two letters are one tool, and so are two sky creators and two kurbani calculators. Sixteen ideas are a mode of something already built or queued. Thirteen fail the safety, data or privacy gates. Every idea that passes the gates is in the queue as a tool or a feature.
- **Reversals of earlier cuts, now gated:**
  - সেহরি-ইফতারের সময় (FA07) is in. The Islamic Foundation's Dhaka table plus its district time-difference list is about 124 values a year from one source. The tool shows no time until that file is entered, checked by two people and dated.
  - বিদ্যুৎ বিল (MO03) is in. It uses one dated BERC tariff order and is labelled an estimate.
  - দাম তখন আর এখন (MO07) is in, reshaped. It uses one BBS CPI series, not per-item old prices.
- **Calendar note.** The trends file projects Ramadan at about **8–9 Feb 2027** and Eid-ul-Fitr at about **10 Mar 2027**. The brief to me said about 18 Feb. Ramadan tools are due by mid-January, which is safe for either date.
- **Build early, launch on the day.** A tool can be built weeks before its moment and featured on the homepage when the moment comes (Eid, Ekushe, Boishakh). The "finish by" dates in §3 are build deadlines.

---

## 2. Categories

Ten short categories, 6–12 tools each. They replace the four in `lib/catalog.ts` and the six proposed in `new-tools-2026-10.md` §6.

| Category | What lives here | Tools |
|---|---|---|
| **খেলাধুলা** | cricket, football, desi games | 10 |
| **উৎসব আর বিশ্বাস** | Eid, Ramadan, Puja, national days, festival greetings | 9 |
| **হিসাব-নিকাশ** | everyday sums: age, money, land, bills, habits | 12 |
| **মজা আর কুইজ** | bingo, either/or, games, playful numbers | 11 |
| **নিজেকে জানো** | personality quizzes, taste and identity cards | 9 |
| **স্মৃতি আর গল্প** | nostalgia and memory (the flagship lives here) | 7 |
| **আঁকো আর সাজাও** | drawing and decorating creators | 7 |
| **খাবারদাবার** | sweets, fish, pitha, tea, recipes | 6 |
| **পরিবার আর প্রবাস** | weddings, kin, letters, the diaspora | 7 |
| **ভাষা আর পড়াশোনা** | spelling, idioms, results, typing, numbers | 8 |

**Changes to `lib/catalog.ts`** (for the owner; no code changed)

- **Retired:** "সবাই মিলে" and "রোজকার কাজে".
- **Moved:**
  - চলো খেলি → খেলাধুলা.
  - শব্দ সাজাই → ভাষা আর পড়াশোনা.
  - শুভেচ্ছা কার্ড → উৎসব আর বিশ্বাস.
  - বাজার নোট, ভাড়া কত?, ভাগাভাগি → হিসাব-নিকাশ.
  - আমাদের রান্নাখাতা → খাবারদাবার.
- **Changed from the §6 proposal:**
  - জিপিএ, টাকা কথায় লিখি and শুদ্ধ বানান → ভাষা আর পড়াশোনা.
  - মিষ্টির বাক্স → খাবারদাবার.
  - দেশে ফেরা → পরিবার আর প্রবাস.
- **Homepage order:** স্মৃতি আর গল্প, মজা আর কুইজ, খেলাধুলা, নিজেকে জানো, খাবারদাবার, উৎসব আর বিশ্বাস, পরিবার আর প্রবাস, আঁকো আর সাজাও, ভাষা আর পড়াশোনা, হিসাব-নিকাশ. Move উৎসব আর বিশ্বাস to second from Ramadan to Eid, and পরিবার আর প্রবাস up during wedding season (Nov–Feb).

### Every tool → one category

Status: `live` = in `lib/catalog.ts` today; `W1`…`W15` = its wave in §3.

| Category | Slug | Name | Status |
|---|---|---|---|
| খেলাধুলা | `cholo-kheli` | চলো খেলি | live |
| খেলাধুলা | `argentina-na-brazil` | আর্জেন্টিনা না ব্রাজিল? | W1 |
| খেলাধুলা | `amar-jersey` | আমার জার্সি | W2 |
| খেলাধুলা | `dom-atkano` | দম আটকানো ম্যাচ | W3 |
| খেলাধুলা | `golir-ain` | গলির ক্রিকেটের আইন | W5 |
| খেলাধুলা | `shesh-bol` | শেষ বলে ছয় | W6 |
| খেলাধুলা | `ami-bolechhilam` | আমি বলেছিলাম! | W11 |
| খেলাধুলা | `matcher-mon` | ম্যাচের মন | W12 |
| খেলাধুলা | `ekadosh` | স্বপ্নের একাদশ | W13 |
| খেলাধুলা | `raat-jaga` | রাত জেগে খেলা | W14 |
| উৎসব আর বিশ্বাস | `shubhechha` | শুভেচ্ছা কার্ড | live |
| উৎসব আর বিশ্বাস | `koto-din-baki` | কত দিন বাকি? | W1 |
| উৎসব আর বিশ্বাস | `iftar-plate` | ইফতারির প্লেট | W2 |
| উৎসব আর বিশ্বাস | `salami-chek` | সালামির চেক | W3 |
| উৎসব আর বিশ্বাস | `sehri-iftar` | সেহরি-ইফতারের সময় | W8 |
| উৎসব আর বিশ্বাস | `eider-din` | ঈদের দিন | W9 |
| উৎসব আর বিশ্বাস | `eidjatra` | ঈদযাত্রা | W10 |
| উৎসব আর বিশ্বাস | `gorur-ojon` | গরুর ওজন কত? | W14 |
| উৎসব আর বিশ্বাস | `mondop` | মণ্ডপ ঘুরি | W15 |
| হিসাব-নিকাশ | `bazar-note` | বাজার নোট | live |
| হিসাব-নিকাশ | `bhara` | ভাড়া কত? | live |
| হিসাব-নিকাশ | `bhagabhagi` | ভাগাভাগি | live |
| হিসাব-নিকাশ | `boyos` | বয়স কত? | W2 |
| হিসাব-নিকাশ | `bhori` | ভরির হিসাব | W5 |
| হিসাব-নিকাশ | `matir-bank` | মাটির ব্যাংক | W6 |
| হিসাব-নিকাশ | `dhoyahin` | ধোঁয়াহীন দিন | W7 |
| হিসাব-নিকাশ | `jomi` | জমির মাপ | W11 |
| হিসাব-নিকাশ | `rokto` | রক্তদাতা কার্ড | W12 |
| হিসাব-নিকাশ | `current-gelo` | কারেন্ট গেল! | W13 |
| হিসাব-নিকাশ | `betoner-bhag` | বেতনের ভাগ | W14 |
| হিসাব-নিকাশ | `bidyut-bill` | বিদ্যুৎ বিল কত? | W15 |
| মজা আর কুইজ | `komon-porlo` | কয়টা কমন পড়ল? | W1 |
| মজা আর কুইজ | `eta-na-ota` | এটা না ওটা | W3 |
| মজা আর কুইজ | `cha-mudra` | চায়ের কাপে হিসাব | W6 |
| মজা আর কুইজ | `flames` | ফ্লেমস | W7 |
| মজা আর কুইজ | `jam` | জ্যামে জীবন | W8 |
| মজা আর কুইজ | `ganer-koli` | গানের কলি | W9 |
| মজা আর কুইজ | `dhadha` | আজকের ধাঁধা | W10 |
| মজা আর কুইজ | `ek-koti` | এক কোটি টাকা খরচ করো | W12 |
| মজা আর কুইজ | `mama-jaben` | মামা, যাবেন? | W13 |
| মজা আর কুইজ | `mishron` | দেশি মিশ্রণ | W14 |
| মজা আর কুইজ | `grade-dao` | গ্রেড দাও | W15 |
| নিজেকে জানো | `biye-kobe` | কবে বিয়ে হবে? | W4 |
| নিজেকে জানো | `daknam` | ডাকনাম কী হতো? | W6 |
| নিজেকে জানো | `moner-boyos` | মনের বয়স কত? | W7 |
| নিজেকে জানো | `bhorta` | তুমি কোন ভর্তা? | W8 |
| নিজেকে জানো | `koto-cheno` | আমাকে কতটা চেনো? | W9 |
| নিজেকে জানো | `char-priyo` | চার প্রিয় | W10 |
| নিজেকে জানো | `projonmo` | জেন-জি না আব্বু-আম্মু? | W13 |
| নিজেকে জানো | `starter-pack` | দেশি স্টার্টার প্যাক | W14 |
| নিজেকে জানো | `adda` | আড্ডায় তুমি কে? | W15 |
| স্মৃতি আর গল্প | `amar-chhotobela` | আমার ছোটবেলা | live (flagship) |
| স্মৃতি আর গল্প | `bhashar-chhobi` | আমাদের ভাষার ছবিখাতা | live |
| স্মৃতি আর গল্প | `himu` | হুমায়ূনের বই | W4 |
| স্মৃতি আর গল্প | `amar-bochhor` | আমার বছর | W6 |
| স্মৃতি আর গল্প | `tokhon-ekhon` | দাম তখন আর এখন | W10 |
| স্মৃতি আর গল্প | `cassette` | আমার ক্যাসেট | W12 |
| স্মৃতি আর গল্প | `mess-jibon` | হল-মেস জীবন | W13 |
| আঁকো আর সাজাও | `chhotto-para` | ছোট্ট পাড়া | live |
| আঁকো আর সাজাও | `alpana` | আলপনা আঁকি | live |
| আঁকো আর সাজাও | `riksharong` | রিকশার রং | live |
| আঁকো আর সাজাও | `cinema-poster` | সিনেমার পোস্টার | W2 |
| আঁকো আর সাজাও | `namer-design` | নামের ডিজাইন | W4 |
| আঁকো আর সাজাও | `ghuri` | ঘুড়ি আর ফানুস | W7 |
| আঁকো আর সাজাও | `studior-chhobi` | স্টুডিওর ছবি | W9 |
| খাবারদাবার | `rannakhata` | আমাদের রান্নাখাতা | live |
| খাবারদাবার | `mishtir-baksho` | মিষ্টির বাক্স | W1 |
| খাবারদাবার | `pitha` | পিঠা চেনো? | W4 |
| খাবারদাবার | `tong` | টং-এর অর্ডার | W5 |
| খাবারদাবার | `mache-bhate` | মাছে-ভাতে | W11 |
| খাবারদাবার | `jibh` | জিভ কোন জেলার? | W12 |
| পরিবার আর প্রবাস | `deshe-fera` | দেশে ফেরা | W3 |
| পরিবার আর প্রবাস | `upohar` | দাওয়াতে কত দেব? | W4 |
| পরিবার আর প্রবাস | `dawat` | দাওয়াত কার্ড | W5 |
| পরিবার আর প্রবাস | `chithi` | চিঠি লিখি | W8 |
| পরিবার আর প্রবাস | `attiyo` | কে কী হয়? | W9 |
| পরিবার আর প্রবাস | `probash` | প্রবাস জীবন | W10 |
| পরিবার আর প্রবাস | `prothom-ay` | আমার প্রথম আয় | W11 |
| ভাষা আর পড়াশোনা | `shobdo-khela` | শব্দ সাজাই | live |
| ভাষা আর পড়াশোনা | `gpa` | জিপিএ কত? | W1 |
| ভাষা আর পড়াশোনা | `taka-kothay` | টাকা কথায় লিখি | W2 |
| ভাষা আর পড়াশোনা | `banan` | শুদ্ধ বানান কোনটি? | W3 |
| ভাষা আর পড়াশোনা | `desh-cheno` | দেশ চেনো | W5 |
| ভাষা আর পড়াশোনা | `bagdhara` | বাগধারার ছবি | W7 |
| ভাষা আর পড়াশোনা | `bangla-typing` | বাংলা টাইপিং স্পিড | W8 |
| ভাষা আর পড়াশোনা | `namta` | নামতা চ্যালেঞ্জ | W11 |

---

## 3. Queue

- All slugs are unique. None clashes with the live slugs or with the routes `tools`, `api`, `s`, `about`, `privacy`, `robots` or `sitemap`.
- Every wave has five different categories. No wave has two tools with the same interaction. Personality quizzes and scored quizzes count as different interactions. One exception: waves 1–2 each hold two date or number calculators, which the final 15 forces.

| wave | slug | বাংলা নাম | category | idea IDs | status | brief |
|---|---|---|---|---|---|---|
| 1 | gpa | জিপিএ কত? | ভাষা আর পড়াশোনা | ED01 | done | #b-gpa |
| 1 | komon-porlo | কয়টা কমন পড়ল? | মজা আর কুইজ | FM05, FM06, ID10, ID11 | done | #b-komon-porlo |
| 1 | argentina-na-brazil | আর্জেন্টিনা না ব্রাজিল? | খেলাধুলা | SP01, SP13 | done | #b-argentina-na-brazil |
| 1 | koto-din-baki | কত দিন বাকি? | উৎসব আর বিশ্বাস | FA02, FA11, TI09 | done | #b-koto-din-baki |
| 1 | mishtir-baksho | মিষ্টির বাক্স | খাবারদাবার | FO01 | done | #b-mishtir-baksho |
| 2 | taka-kothay | টাকা কথায় লিখি | ভাষা আর পড়াশোনা | MO01 | done | #b-taka-kothay |
| 2 | amar-jersey | আমার জার্সি | খেলাধুলা | SP02 | done | #b-amar-jersey |
| 2 | boyos | বয়স কত? | হিসাব-নিকাশ | TI01, TI03 | done | #b-boyos |
| 2 | iftar-plate | ইফতারির প্লেট | উৎসব আর বিশ্বাস | FA05 | done | #b-iftar-plate |
| 2 | cinema-poster | সিনেমার পোস্টার | আঁকো আর সাজাও | CR02 | done | #b-cinema-poster |
| 3 | banan | শুদ্ধ বানান কোনটি? | ভাষা আর পড়াশোনা | ED03 | done | #b-banan |
| 3 | dom-atkano | দম আটকানো ম্যাচ | খেলাধুলা | SP07, SP11 | done | #b-dom-atkano |
| 3 | salami-chek | সালামির চেক | উৎসব আর বিশ্বাস | FA03 | done | #b-salami-chek |
| 3 | eta-na-ota | এটা না ওটা | মজা আর কুইজ | ID07, SP03 | done | #b-eta-na-ota |
| 3 | deshe-fera | দেশে ফেরা | পরিবার আর প্রবাস | TI05, TI06, TI04 | done | #b-deshe-fera |
| 4 | biye-kobe | কবে বিয়ে হবে? | নিজেকে জানো | ID05 | done | #b-biye-kobe |
| 4 | himu | হুমায়ূনের বই | স্মৃতি আর গল্প | NO01 | done | #b-himu |
| 4 | pitha | পিঠা চেনো? | খাবারদাবার | FO03 | done | #b-pitha |
| 4 | upohar | দাওয়াতে কত দেব? | পরিবার আর প্রবাস | FM08 | done | #b-upohar |
| 4 | namer-design | নামের ডিজাইন | আঁকো আর সাজাও | ID02 | done | #b-namer-design |
| 5 | dawat | দাওয়াত কার্ড | পরিবার আর প্রবাস | FM01, SP10 | done | #b-dawat |
| 5 | desh-cheno | দেশ চেনো | ভাষা আর পড়াশোনা | ED07 | done | #b-desh-cheno |
| 5 | bhori | ভরির হিসাব | হিসাব-নিকাশ | MO05 | done | #b-bhori |
| 5 | tong | টং-এর অর্ডার | খাবারদাবার | ID08, FO04 | done | #b-tong |
| 5 | golir-ain | গলির ক্রিকেটের আইন | খেলাধুলা | SP09 | done | #b-golir-ain |
| 6 | amar-bochhor | আমার বছর | স্মৃতি আর গল্প | CR07 | done | #b-amar-bochhor |
| 6 | daknam | ডাকনাম কী হতো? | নিজেকে জানো | ID03 | done | #b-daknam |
| 6 | cha-mudra | চায়ের কাপে হিসাব | মজা আর কুইজ | MO06, MO04 | done | #b-cha-mudra |
| 6 | matir-bank | মাটির ব্যাংক | হিসাব-নিকাশ | MO09, CR09 | done | #b-matir-bank |
| 6 | shesh-bol | শেষ বলে ছয় | খেলাধুলা | SP15 | done | #b-shesh-bol |
| 7 | dhoyahin | ধোঁয়াহীন দিন | হিসাব-নিকাশ | HL04 | done | #b-dhoyahin |
| 7 | ghuri | ঘুড়ি আর ফানুস | আঁকো আর সাজাও | CR08, FA13 | done | #b-ghuri |
| 7 | flames | ফ্লেমস | মজা আর কুইজ | ID04 | done | #b-flames |
| 7 | moner-boyos | মনের বয়স কত? | নিজেকে জানো | ID06 | done | #b-moner-boyos |
| 7 | bagdhara | বাগধারার ছবি | ভাষা আর পড়াশোনা | ED04 | done | #b-bagdhara |
| 8 | sehri-iftar | সেহরি-ইফতারের সময় | উৎসব আর বিশ্বাস | FA07 | done | #b-sehri-iftar |
| 8 | chithi | চিঠি লিখি | পরিবার আর প্রবাস | TI07, TI10 | done | #b-chithi |
| 8 | bangla-typing | বাংলা টাইপিং স্পিড | ভাষা আর পড়াশোনা | ED06 | done | #b-bangla-typing |
| 8 | jam | জ্যামে জীবন | মজা আর কুইজ | CI01 | done | #b-jam |
| 8 | bhorta | তুমি কোন ভর্তা? | নিজেকে জানো | ID16 | done | #b-bhorta |
| 9 | eider-din | ঈদের দিন | উৎসব আর বিশ্বাস | FA09, FA14 | done | #b-eider-din |
| 9 | ganer-koli | গানের কলি | মজা আর কুইজ | FM04 | done | #b-ganer-koli |
| 9 | attiyo | কে কী হয়? | পরিবার আর প্রবাস | ID14 | done | #b-attiyo |
| 9 | studior-chhobi | স্টুডিওর ছবি | আঁকো আর সাজাও | CR01 | done | #b-studior-chhobi |
| 9 | koto-cheno | আমাকে কতটা চেনো? | নিজেকে জানো | ID12 | done | #b-koto-cheno |
| 10 | eidjatra | ঈদযাত্রা | উৎসব আর বিশ্বাস | CI06 | done | #b-eidjatra |
| 10 | probash | প্রবাস জীবন | পরিবার আর প্রবাস | TI08 | done | #b-probash |
| 10 | char-priyo | চার প্রিয় | নিজেকে জানো | CR04 | done | #b-char-priyo |
| 10 | dhadha | আজকের ধাঁধা | মজা আর কুইজ | ED05 | done | #b-dhadha |
| 10 | tokhon-ekhon | দাম তখন আর এখন | স্মৃতি আর গল্প | MO07 | done | #b-tokhon-ekhon |
| 11 | namta | নামতা চ্যালেঞ্জ | ভাষা আর পড়াশোনা | ED09 | done | #b-namta |
| 11 | prothom-ay | আমার প্রথম আয় | পরিবার আর প্রবাস | MO11 | done | #b-prothom-ay |
| 11 | ami-bolechhilam | আমি বলেছিলাম! | খেলাধুলা | SP06 | done | #b-ami-bolechhilam |
| 11 | mache-bhate | মাছে-ভাতে | খাবারদাবার | FO02 | done | #b-mache-bhate |
| 11 | jomi | জমির মাপ | হিসাব-নিকাশ | MO02 | done | #b-jomi |
| 12 | ek-koti | এক কোটি টাকা খরচ করো | মজা আর কুইজ | GA02 | done | #b-ek-koti |
| 12 | rokto | রক্তদাতা কার্ড | হিসাব-নিকাশ | HL02 | done | #b-rokto |
| 12 | cassette | আমার ক্যাসেট | স্মৃতি আর গল্প | NO02, CR03 | done | #b-cassette |
| 12 | jibh | জিভ কোন জেলার? | খাবারদাবার | ID09 | done | #b-jibh |
| 12 | matcher-mon | ম্যাচের মন | খেলাধুলা | SP16 | done | #b-matcher-mon |
| 13 | current-gelo | কারেন্ট গেল! | হিসাব-নিকাশ | CI04 | done | #b-current-gelo |
| 13 | projonmo | জেন-জি না আব্বু-আম্মু? | নিজেকে জানো | ID19 | done | #b-projonmo |
| 13 | mama-jaben | মামা, যাবেন? | মজা আর কুইজ | CI08 | done | #b-mama-jaben |
| 13 | mess-jibon | হল-মেস জীবন | স্মৃতি আর গল্প | NO03 | done | #b-mess-jibon |
| 13 | ekadosh | স্বপ্নের একাদশ | খেলাধুলা | SP05 | done | #b-ekadosh |
| 14 | gorur-ojon | গরুর ওজন কত? | উৎসব আর বিশ্বাস | FA06, FA12 | done | #b-gorur-ojon |
| 14 | starter-pack | দেশি স্টার্টার প্যাক | নিজেকে জানো | CR05 | done | #b-starter-pack |
| 14 | mishron | দেশি মিশ্রণ | মজা আর কুইজ | GA03 | done | #b-mishron |
| 14 | raat-jaga | রাত জেগে খেলা | খেলাধুলা | SP14 | done | #b-raat-jaga |
| 14 | betoner-bhag | বেতনের ভাগ | হিসাব-নিকাশ | MO08 | done | #b-betoner-bhag |
| 15 | bidyut-bill | বিদ্যুৎ বিল কত? | হিসাব-নিকাশ | MO03 | done | #b-bidyut-bill |
| 15 | mondop | মণ্ডপ ঘুরি | উৎসব আর বিশ্বাস | FA10 | done | #b-mondop |
| 15 | grade-dao | গ্রেড দাও | মজা আর কুইজ | ID20 | done | #b-grade-dao |
| 15 | adda | আড্ডায় তুমি কে? | নিজেকে জানো | ID17 | done | #b-adda |
| 16 | kalbaishakhi-aam | কালবৈশাখী আম | গেম | G15 | done | games-2026-10.md §4.3 #15 |
| 16 | dudh-uthlano | দুধ উথলানোর আগে | গেম | G19 | done | games-2026-10.md §4.3 #19 |
| 16 | jhalmuri-sap | ঝালমুড়ি সাপ | গেম | G01 | done | games-2026-10.md §4.3 #1 |
| 16 | danguli | ডাংগুলি | গেম | G13 | done | games-2026-10.md §4.3 #13 |
| 16 | antenna-thik-koro | অ্যান্টেনা ঠিক করো | গেম | G07 | done | games-2026-10.md §4.3 #7 |
| 17 | sir-ghurlei-thamo | স্যার ঘুরলেই থামো | গেম | G20 | done | games-2026-10.md §4.3 #20 |
| 17 | deri-hoye-gelo | দেরি হয়ে গেল! | গেম | G16 | done | games-2026-10.md §4.3 #16 |
| 17 | chor-police | চোর-ডাকাত-পুলিশ-বাবু | গেম | G11 | done | games-2026-10.md §4.3 #11 |
| 17 | bostar-pahar | বস্তার পাহাড় | গেম | G18 | done | games-2026-10.md §4.3 #18 |
| 17 | tarer-fanke-belun | তারের ফাঁকে বেলুন | গেম | G17 | done | games-2026-10.md §4.3 #17 |
| 18 | paka-kancha | পাকা-কাঁচা | গেম | G21 | done | games-2026-10.md §4.3 #21 |
| 18 | jora-melao | জোড়া মেলাও | গেম | G25 | done | games-2026-10.md §4.3 #25 |
| 18 | chhok-jora | ছক-জোড়া | গেম | G12 | done | games-2026-10.md §4.3 #12 |
| 18 | churui-tarao | চড়ুই তাড়াও | গেম | G05 | done | games-2026-10.md §4.3 #5 |
| 18 | handi-bhanga | হাঁড়িভাঙা | গেম | G02 | done | games-2026-10.md §4.3 #2 |
| 19 | peoner-cycle | পিয়নের সাইকেল | গেম | G04 | done | games-2026-10.md §4.3 #4 |
| 19 | sap-ludu | সাপলুডু | গেম | G08 | done | games-2026-10.md §4.3 #8 |
| 19 | baghbandi | বাঘবন্দি | গেম | G09 | done | games-2026-10.md §4.3 #9 |
| 19 | baicher-nouka | বাইচের নৌকা | গেম | G06 | done | games-2026-10.md §4.3 #6 |
| 19 | vo-katta | ভো-কাট্টা | গেম | G14 | done | games-2026-10.md §4.3 #14 |
| 20 | bhangti-nai | ভাংতি নাই! | গেম | G22 | done | games-2026-10.md §4.3 #22 |
| 20 | jam-chharao | জ্যাম ছাড়াও | গেম | G23 | done | games-2026-10.md §4.3 #23 |
| 20 | shobdo-khoja | শব্দ খোঁজা | গেম | G24 | done | games-2026-10.md §4.3 #24 |
| 20 | carrom | ক্যারম | গেম | G10 | done | games-2026-10.md §4.3 #10 |
| 20 | pati-buni | পাটি বুনি | গেম | G03 | done | games-2026-10.md §4.3 #3 |
| 21 | golokdhadha | গোলকধাঁধা | গেম | GW01 | done | games-wave-2.md #1 |
| 21 | ponero-ghor | ১৫ ঘরের ধাঁধা | গেম | GW02 | done | games-wave-2.md #2 |
| 21 | switchboard | সুইচবোর্ড | গেম | GW03 | done | games-wave-2.md #3 |
| 21 | sudoku | সুডোকু বাংলায় | গেম | GW04 | done | games-wave-2.md #4 |
| 21 | chhobi-photao | ছবি ফোটাও | গেম | GW05 | done | games-wave-2.md #5 |
| 22 | ghontar-sur | ঘণ্টার সুর | গেম | GW06 | done | games-wave-2.md #6 |
| 22 | konta-nei | কোনটা নেই? | গেম | GW07 | building | games-wave-2.md #7 |
| 22 | bhul-kothay | ভুল কোথায়? | গেম | GW08 | building | games-wave-2.md #8 |
| 22 | atir-aam | আঁটি থেকে আম | গেম | GW09 | done | games-wave-2.md #9 |
| 22 | bhimruler-chak | ভিমরুলের চাক | গেম | GW10 | building | games-wave-2.md #10 |
| 23 | churir-bazar | চুড়ির বাজার | গেম | GW11 | building | games-wave-2.md #11 |
| 23 | mukhe-mukhe-hisab | মুখে মুখে হিসাব | গেম | GW12 | todo | games-wave-2.md #12 |
| 23 | chhobir-tukro | ছবির টুকরো | গেম | GW13 | todo | games-wave-2.md #13 |
| 23 | sat-chara | সাত চাড়া | গেম | GW14 | todo | games-wave-2.md #14 |
| 23 | chhip-felo | ছিপ ফেলো | গেম | GW15 | todo | games-wave-2.md #15 |
| 24 | golir-badminton | গলির ব্যাডমিন্টন | গেম | GW16 | todo | games-wave-2.md #16 |
| 24 | latim | লাটিম | গেম | GW17 | todo | games-wave-2.md #17 |
| 24 | kagojer-urojahaj | কাগজের উড়োজাহাজ | গেম | GW18 | todo | games-wave-2.md #18 |
| 24 | nodi-par | নদী পার | গেম | GW19 | todo | games-wave-2.md #19 |
| 24 | marble-sinri | মার্বেল-সিঁড়ি | গেম | GW20 | todo | games-wave-2.md #20 |
| 25 | penalty | পেনাল্টি কিক | গেম | GW21 | todo | games-wave-2.md #21 |
| 25 | roshi-tana | রশি টানাটানি | গেম | GW22 | todo | games-wave-2.md #22 |
| 25 | moshar-raat | মশার রাত | গেম | GW23 | todo | games-wave-2.md #23 |
| 25 | al-dhore-hati | আল ধরে হাঁটি | গেম | GW24 | todo | games-wave-2.md #24 |
| 25 | o-te-ojogor | অ-তে অজগর | গেম | GW25 | todo | games-wave-2.md #25 |

### Wave deadlines and why

| Wave | Finish by | Moment it serves |
|---|---|---|
| 1 | 25 Oct 2026 | HSC 2026 results (mid-Oct to mid-Nov), wedding season from 1 Nov, 2027 holiday-list searches, winter sweets |
| 2 | 1 Nov | evergreen search (age, number words) needs months to rank; jersey for match nights; Ramadan plate built early |
| 3 | 8 Nov | deshe-fera before December trips home; quiz, salami and either/or built early for Jan–Mar launches |
| 4 | 12 Nov | Humayun Ahmed's birthday (13 Nov), Nabanna (16 Nov), wedding season |
| 5 | 22 Nov | wedding season; Victory Day (16 Dec, 55th) quiz live by 1 Dec; winter tea and street cricket |
| 6 | 1 Dec | year-end recap, New Year saving, winter cricket |
| 7 | 15 Dec | 1 Jan resolutions, Shakrain (~14 Jan), Ekushe practice |
| 8 | 5 Jan 2027 | Ramadan by mid-Jan (sehri-iftar waits on the IF timetable); Ekushe (21 Feb, 75th) |
| 9 | 20 Jan | Eid-ul-Fitr tools by February |
| 10 | 1 Feb | Eid-ul-Fitr (~10 Mar): travel home, diaspora, Eid natoks |
| 11 | 15 Feb | Boishakh tools by March (পান্তা-ইলিশ, New Year 1434) |
| 12 | 1 Mar | Boishakh concerts and nostalgia |
| 13 | 15 Mar | load-shedding season from April |
| 14 | 31 Mar | Eid-ul-Adha (~17 May) kurbani calculator; evergreen |
| 15 | 30 Apr | summer electricity bills; Durga Puja (Oct 2027) built early |

---

## 4. Merged, features of existing, dropped

### Merged (new in this queue)

The final 15 already carry four merges from the research rounds: কয়টা কমন পড়ল? (FM05 + FM06 + ID10 + ID11), দম আটকানো ম্যাচ (SP07 + SP11), কত দিন বাকি? (FA02 + FA11 + TI09) and দেশে ফেরা (TI05 + TI06 + TI04).

| Tool | Merged from | Why one tool |
|---|---|---|
| `gorur-ojon` | FA06 গরুর ওজন + FA12 মাংসের ভাগ | one kurbani flow: tape the cow, then split the meat; same moment, same family |
| `eider-din` | FA09 ঈদের দিন খাতা + FA14 উৎসবের জামার রং | the outfit colour becomes the card colour and the tally; one Eid-day post instead of two thin ones |
| `ghuri` | CR08 ঘুড়ি বানাই + FA13 ফানুস ওড়াই | both are "make something and send it into the sky"; a kite/lantern toggle covers Shakrain and Probarona |
| `cha-mudra` | MO06 চায়ের কাপে হিসাব + MO04 প্রবাসীর টাকার হিসাব | both turn an amount into meaning; the diaspora types their own rate, so there's no live data |
| `matir-bank` | MO09 টাকা জমানোর চার্ট + CR09 পাঞ্চ কার্ড | the same mechanic (tap a box per day, progress in the link); saving is the default goal |
| `chithi` | TI07 মায়ের কাছে চিঠি + TI10 টাইম ক্যাপসুল চিঠি | one letter creator; "ভবিষ্যতের আমি" is a recipient with an open date |
| `tong` | ID08 আমার চা + FO04 টং দোকানের রসিদ (+c19) | your tea order and your adda's order are the same chit |
| `cassette` | NO02 ক্যাসেটের যুগ + CR03 স্বপ্নের কনসার্ট | one music-taste creator; the fake concert with real artists is dropped from scope |
| `dawat` | FM01 দাওয়াত কার্ড + SP10 আজ রাতে খেলা, আমার বাসায় | a watch party is one more occasion on the invitation |

### Features of an existing or queued tool

Add these to the named tool after it ships. They are not queued as tools. The final 15 already fold in SP03 (→ এটা না ওটা), SP13 (→ আর্জেন্টিনা না ব্রাজিল? v2), TI03 (→ বয়স কত? first screen) and TI09 (→ কত দিন বাকি? holiday table).

| ID | Idea | → feature of | What to add / why |
|---|---|---|---|
| SP08 | আসল আর্জেন্টিনা/ব্রাজিল ফ্যান? | `argentina-na-brazil` | an 8-question "আসল ফ্যান" test after you pick a team; same rival-link loop |
| SP12 | ম্যাচ বিঙ্গো | `komon-porlo` | a "খেলার দিন" pack |
| CI02 | জ্যাম বিঙ্গো | `komon-porlo` | a "রাস্তার পরীক্ষা" pack |
| CI03 | বর্ষা যোদ্ধা | `komon-porlo` | a rain pack for Jun–Sep 2027 |
| CI05 | লোডশেডিং বিঙ্গো | `komon-porlo` | a summer pack (personal, no blame) |
| FA01 | রোজার খাতা | `iftar-plate` | only the "আজ রমজানের ১২তম দিন" line; no fasting tracker (privacy, rulings) |
| FA04 | সালামি খাতা | `salami-chek` | an "এবার কে কে দিল" list; amounts optional and never tallied |
| MO12 | মেসের মিল রেট | `bhagabhagi` | a meal-rate mode |
| ED02 | পরীক্ষা/রেজাল্টের কাউন্টডাউন | `koto-din-baki` | "নিজের দিন" covers it; add SSC/HSC chips once the boards announce dates |
| ED08 | চাকরির বয়স | `boyos` | "অমুক তারিখে বয়স কত", with the age limit typed by the user |
| ED10 | খাঁটি বাংলা কী? | `banan` | an Ekushe "খাঁটি বাংলা" set; same two-choice mechanic |
| TI02 | জীবনের ঋতু | `boyos` | v2 "ঋতুর গ্রিড" section; same birth-date input |
| ID18 | দুজনের মিল | `eta-na-ota` | the friend match ("দুজনের মিল ৯/১২") is already in its brief |
| FM02 | জন্মদিন/বিবাহবার্ষিকী কার্ড | `shubhechha` | birthday and anniversary occasions |
| CR06 | প্রোফাইল ফ্রেম | `shubhechha` | a square frame format for 16 Dec, 21 Feb and match days |
| FM03 | ঈদের লুডু চ্যাম্পিয়ন | `cholo-kheli` | add লুডু with a "কে জিতল" scoreboard |

### Dropped

| ID | Idea | Gate | Reason |
|---|---|---|---|
| SP04 | সর্বকালের সেরা একাদশ (ক্রিকেট) | safe | fan factions, and several stars are or were politicians; the football XI is kept as `ekadosh` |
| FA08 | যাকাত খাতা | safe, data | a religious ruling (nisab basis) plus daily gold and silver prices |
| MO10 | মোবাইল ব্যাংকিং খরচ | data | fees change often, brand trademarks, no emotion, the competitor has it |
| GA01 | দাম আন্দাজ | data | needs fast-changing prices shown as facts; `tokhon-ekhon` covers price nostalgia from one CPI series |
| ID01 | নামের অর্থ | data | thousands of meanings across faiths, no cheap authoritative source, and a wrong meaning is personal |
| ID13 | ক্যাপশন ফটোকার্ড | distinct | hundreds of original lines to write, copyright traps, overlaps `shubhechha` |
| ID15 | বাঙালিপনা টেস্ট | safe | scores "how Bengali" someone is, which excludes minorities and the diaspora; close to `amar-chhotobela` |
| CI07 | পানি কতটুকু? | data | live waterlogging reports go stale and can send people into danger |
| CI09 | আজ দাম কত? / বাসা ভাড়া কত? | data, privacy | free-number crowd prices and rents: spam, manipulation, addresses |
| CI10 | আজ ছাতা লাগবে? | data | needs a live weather API |
| FM07 | বিয়ের বাজেট | simple, privacy | feature-heavy (simplicity 2), money privacy, close to dowry talk |
| HL01 | ছোট্ট অতিথি আসছে | safe | medical; pregnancy loss |
| HL03 | দেশি খাবারের ক্যালরি প্লেট | safe | health and body-image risk; food-calorie table accuracy |

---

## 5. Build briefs

**Format:** concept · first screen · core interaction · card · loop/tally · SEO · link · risks · simplicity. Every concept uses a different object, so no two tools look alike.

### Waves 1–3: the final 15 (full briefs in `new-tools-2026-10.md` §7)

<a id="b-gpa"></a>
#### gpa — জিপিএ কত?
§7.9. Category is now ভাষা আর পড়াশোনা. Ship as fast as possible for HSC 2026 results; re-check the board circular.

<a id="b-komon-porlo"></a>
#### komon-porlo — কয়টা কমন পড়ল?
§7.10. বিয়েবাড়ি is the default pack Nov–Feb. Later packs: see §4 features.

<a id="b-argentina-na-brazil"></a>
#### argentina-na-brazil — আর্জেন্টিনা না ব্রাজিল?
§7.1.

<a id="b-koto-din-baki"></a>
#### koto-din-baki — কত দিন বাকি?
§7.4. Its moon-date config is shared with `sehri-iftar` and `eider-din`. Add the 2027 holiday table as soon as the Cabinet Division publishes it.

<a id="b-mishtir-baksho"></a>
#### mishtir-baksho — মিষ্টির বাক্স
§7.13. Category is now খাবারদাবার.

<a id="b-taka-kothay"></a>
#### taka-kothay — টাকা কথায় লিখি
§7.8. Category is now ভাষা আর পড়াশোনা (the ধারাপাত concept). Its number-words library is shared with `salami-chek`, so build it first.

<a id="b-amar-jersey"></a>
#### amar-jersey — আমার জার্সি
§7.2.

<a id="b-boyos"></a>
#### boyos — বয়স কত?
§7.7.

<a id="b-iftar-plate"></a>
#### iftar-plate — ইফতারির প্লেট
§7.6.

<a id="b-cinema-poster"></a>
#### cinema-poster — সিনেমার পোস্টার
§7.15.

<a id="b-banan"></a>
#### banan — শুদ্ধ বানান কোনটি?
§7.12. Category is now ভাষা আর পড়াশোনা.

<a id="b-dom-atkano"></a>
#### dom-atkano — দম আটকানো ম্যাচ
§7.3.

<a id="b-salami-chek"></a>
#### salami-chek — সালামির চেক
§7.5. Uses the `taka-kothay` number-words library.

<a id="b-eta-na-ota"></a>
#### eta-na-ota — এটা না ওটা
§7.11.

<a id="b-deshe-fera"></a>
#### deshe-fera — দেশে ফেরা
§7.14. Category is now পরিবার আর প্রবাস.

### Wave 4

<a id="b-biye-kobe"></a>
#### biye-kobe — কবে বিয়ে হবে? (শুধু মজা) · personality quiz
- **Concept:** ঘটকের ঝোলা আর ছাতা. The matchmaker from every natok, with his worn file. The card is his typed "রিপোর্ট".
- **First screen:** the file is open at question ১/৬, already readable ("এই মাসে আম্মু কয়টা 'ভালো সম্বন্ধ'-এর কথা তুলেছে?"), with three chips.
- **Core:** (1) tap 6 cheeky answers, (2) add a name if you like, (3) share.
- **Card:** a feed report stamped "শুধু মজা", e.g. "রাফি · সম্ভাব্য সময়: আম-কাঁঠালের ছুটির পরে · কারণ: ফ্রিজের মিষ্টি এখনো একাই খায়". The story is the file, vertical. Human line, e.g. if career comes first: "আগে চাকরি, তারপর মিষ্টি — ঘটক অপেক্ষায়।" Footer: "তোমার রিপোর্টে কী লেখা?"
- **Loop / tally:** a friend's link opens your report, then "এবার তোমারটা". Tally: result id (12 joke timings): "সবচেয়ে বেশি এসেছে: আগামী শীতে".
- **SEO:** `আমার বিয়ে কবে হবে? — শুধু মজার হিসাব` · H1 "ঘটক কী বলে, বিয়ে কবে?" · আমার বিয়ে কবে হবে · biye kobe hobe · বিয়ে নিয়ে ফানি স্ট্যাটাস.
- **Link:** `#a=120102&n=রাফি` (answers are digits 0–2; the result is derived on open).
- **Risks:** marriage pressure. No age, weight, skin colour, income, dowry or caste. The same jokes for every gender. No astrology words (রাশি, জ্যোতিষ). The "শুধু মজা" stamp sits on the card.
- **Simplicity:** 5/5

<a id="b-himu"></a>
#### himu — হুমায়ূনের বই · checklist
- **Concept:** জোছনা রাতে খালি পায়ে হাঁটা হলুদ পাঞ্জাবি. A faceless silhouette walks a moonlit road; Himu's panjabi famously has no pockets.
- **First screen:** the moonlit road and a counter, "৩০-এ ৩", with three widely read titles pre-ticked as a sample. Below is a grid of 30 titles grouped as হিমু, মিসির আলি, শুভ্র and উপন্যাস.
- **Core:** (1) tick the books you've read, (2) add a name if you like, (3) share.
- **Card:**
  - Feed: the road and the moon, "রাফি · ৩০-এ ১৯টা", with a tier title: ০–৫ সবে হাঁটা শুরু, ৬–১৫ জোছনাপ্রেমী, ১৬–২৫ হিমু হতে চাওয়া, ২৬–৩০ পকেটহীন পাঞ্জাবি.
  - Story: a tall night sky.
  - Human line, e.g. all Misir Ali ticked: "যুক্তি আর রহস্য, দুটোই তোমার।"
  - Footer: "তুমি কয়টা পড়েছ?"
- **Loop / tally:** a friend's link shows both counts and "দুজনেরই পড়া: …". Tally: book ids; the least-read title becomes a reading tip.
- **SEO:** `হুমায়ূন আহমেদের বইয়ের তালিকা — কয়টা পড়েছ?` · H1 "হুমায়ূন আহমেদের কয়টা বই পড়েছ?" · হুমায়ূন আহমেদের বইয়ের তালিকা · হিমু সিরিজের বই · হুমায়ূন আহমেদের উপন্যাস.
- **Link:** `#b=<30-bit mask, base36>&n=রাফি`.
- **Risks:** titles and years only, from the publishers' lists or Banglapedia. No covers, quotes or book illustrations. Launch for 13 Nov.
- **Simplicity:** 5/5

<a id="b-pitha"></a>
#### pitha — পিঠা চেনো? · picture quiz
- **Concept:** শীতের ভোরের মাটির চুলা. Smoke, a bamboo basket, and a drawn pitha on top.
- **First screen:** round ১/১০, with the pitha drawn and three name chips.
- **Core:** (1) tap the name, 10 times, (2) see your score, (3) share.
- **Card:** a spoiler-free row of 10 small baskets (full = right), "রাফি · ১০-এ ৮ · পিঠার ওস্তাদ". The story stacks them. Human line, e.g. everyday pithas right but festive ones missed: "রোজের পিঠা চেনো, উৎসবেরটা এবার শিখে নাও।" Footer: "তুমি কয়টা চিনবে?"
- **Loop / tally:** a challenge link with the same 10. Tally: per-pitha correct %: "মাত্র ২২% চিনেছে নকশি পিঠা".
- **SEO:** `পিঠার নাম ও ছবি — কয়টা পিঠা চেনো?` · H1 "শীতের পিঠা, কয়টা চেনো?" · পিঠার নাম ও ছবি · শীতের পিঠার নাম · পিঠার নামের তালিকা. Add a static "৩০টা পিঠার নাম ও ছবি" section.
- **Link:** `#set=w1&a=0210211021&n=রাফি`, rescored on open.
- **Risks:** pitha names vary by region, so accept the main name and show "অন্য নামে: …". Use the Banglapedia "পিঠা" entry. Original drawings only. Nabanna is 16 Nov.
- **Simplicity:** 5/5

<a id="b-upohar"></a>
#### upohar — দাওয়াতে কত দেব? · calculator
- **Concept:** বিয়ের উপহারের সাদা খাম. A white envelope printed "শুভ বিবাহ", with the guest's name scrawled in ballpoint. It is not salami's green Eid envelope.
- **First screen:** the envelope already reads "খালাতো ভাই · ২,০০০–৩,০০০ টাকা". Three chip rows sit below:
  - সম্পর্ক: বন্ধু, কাজিন, কলিগ, প্রতিবেশী, দূরের আত্মীয়.
  - দূরত্ব: পাশের পাড়া, অন্য শহর, বিদেশ থেকে.
  - খাবার: কাচ্চি, রোস্ট-পোলাও, চা-মিষ্টি.
- **Core:** (1) relation, (2) distance, (3) food. The range and a joke update live.
- **Card:** the envelope with the range and a line, e.g. "কাচ্চি থাকলে খামটা একটু ভারী করো, ভালোবাসাও।" Footer: "তুমি খামে কত দাও?"
- **Loop / tally:** relation id: "সবচেয়ে বেশি হিসাব হয়েছে: বন্ধুর বিয়ে".
- **SEO:** `বিয়েতে কত টাকা দেওয়া উচিত? — মজার হিসাব` · H1 "খামে কত দেবে?" · বিয়েতে কত টাকা দেওয়া উচিত · বিয়ের উপহার কত টাকা · দাওয়াতে কত টাকা দেব.
- **Link:** `#r=cousin&d=city&f=kacchi`.
- **Risks:** social judgement. Ranges come from one curated table, dated "আন্দাজ হালনাগাদ: <date>". A "সামর্থ্য অনুযায়ী" chip always gives a line with no number. The page ends: "উপহার মানে ভালোবাসা, অঙ্ক না।" No class labels.
- **Simplicity:** 5/5

<a id="b-namer-design"></a>
#### namer-design — নামের ডিজাইন · creator
- **Concept:** বর্ণপরিচয়ের রঙিন অক্ষর-টালি. Each letter of your name sits on its own illustrated primer tile (original art, not copied from any primer).
- **First screen:** "তোমার নাম" already set in tiles, a name field, and style chips: টালি, হাতের লেখা, লাল-সবুজ (16 Dec), একুশের সাদা-কালো.
- **Core:** (1) type a name, (2) tap a style, (3) share.
- **Card:** the name in tiles; the story stacks them. Human line from the first letter, with 50 curated lines, e.g. "র দিয়ে শুরু — রোদ্দুরের মতো নাম।" Footer: "তোমার নামের প্রথম অক্ষর কী?"
- **Loop / tally:** "বন্ধুর নাম সাজিয়ে পাঠাও" makes a gift link. Tally: style id only.
- **SEO:** `নামের ডিজাইন বাংলা — নিজের নাম সাজাও` · H1 "নিজের নাম, নিজের মতো সাজাও" · নামের ডিজাইন বাংলা · নাম স্টাইল ডিজাইন · বাংলা নাম ডিজাইন.
- **Link:** `#n=রাফি&st=tile` (≤ 16 chars; Bangla, Latin and space only).
- **Risks:** test conjuncts in canvas with OFL fonts; the name abuse filter from `amar-jersey`; the একুশে style is sober, with no "শুভ". Keep it distinct from রিকশার রং: no rickshaw lettering style.
- **Simplicity:** 5/5

### Wave 5

<a id="b-dawat"></a>
#### dawat — দাওয়াত কার্ড · creator
- **Concept:** সোনালি এমবস করা বিয়ের কার্ড. A golden embossed border with পান পাতা, কলকা and a red ribbon.
- **First screen:** a finished sample, "রাফি ও মিমের বিয়ে · ১২ ডিসেম্বর". Occasion chips: বিয়ে, গায়ে হলুদ, বৌভাত, আকিকা, মিলাদ, পূজার নিমন্ত্রণ, জন্মদিন, খেলা দেখার দাওয়াত. Three fields: names, date, place.
- **Core:** (1) tap the occasion, (2) fill names, date and place, (3) share the image and link.
- **Card:** the invitation as feed and story, with a human line per occasion (হলুদ: "না এলে রং মাখাবে কে?"). Footer: "তুমি আসছ তো?" An optional map button takes a pasted Google Maps link.
- **Loop / tally:** no RSVP count (per-invite counts aren't fixed ids). The guest gets an "আমি আসছি" reply card to send back. Tally: occasion id.
- **SEO:** `বিয়ের দাওয়াত কার্ড — ডিজিটাল দাওয়াত বানাও` · H1 "দাওয়াতটা সুন্দর করে দাও" · বিয়ের দাওয়াত কার্ড · ডিজিটাল দাওয়াত কার্ড · বিয়ের দাওয়াত মেসেজ.
- **Link:** `#o=biye&a=রাফি&b=মিম&d=2026-12-12&p=<≤40>&m=<maps url>`; fields are capped; preview "রাফি ও মিমের বিয়ের দাওয়াত".
- **Risks:**
  - Personal data lives in the link, so the privacy note says "লিংক যার কাছে, সে-ই দেখবে".
  - No phone field. The map link must be a Google Maps domain.
  - Religious occasions use neutral art and no verses.
  - Watch-party kickoff is in Bangladesh time only.
- **Simplicity:** 4/5

<a id="b-desh-cheno"></a>
#### desh-cheno — দেশ চেনো · scored quiz
- **Concept:** ক্লাসরুমের দেয়ালের চার্ট পেপার. Hand-drawn national symbols (শাপলা, দোয়েল, ইলিশ, কাঁঠাল), rivers and seasons. It is not a map.
- **First screen:** the chart paper at ১/১০, "জাতীয় পাখি কোনটি?", with three drawn chips.
- **Core:** (1) tap the answer, 10 times, (2) see your score, (3) share.
- **Card:** the chart paper with 10 stars (gold = right), "রাফি · ১০-এ ৯ · দেশের ছাত্র". The Victory Day set, "বিজয়ের ৫৫ বছর: দেশ চেনো", gets a red-green border. Human line, e.g. 10/10: "দেশটা তোমার মুখস্থ, আর মনেও।" Footer: "তুমি দেশকে কতটা চেনো?"
- **Loop / tally:** a challenge link; per-question correct %.
- **SEO:** `সাধারণ জ্ঞান বাংলাদেশ — দেশ চেনো কুইজ` · H1 "নিজের দেশটা কতটা চেনো?" · সাধারণ জ্ঞান প্রশ্ন ও উত্তর বাংলাদেশ · বাংলাদেশের জাতীয় প্রতীক · বিজয় দিবস কুইজ.
- **Link:** `#set=v55&a=…&n=রাফি`, rescored on open.
- **Risks:** stable facts only: symbols, geography, nature, culture and fixed national dates. No people, parties, contested 1971 or 2024 narratives, or casualty figures. Cite the Bangladesh National Portal (bangladesh.gov.bd) or Banglapedia per question. Live by 1 Dec.
- **Simplicity:** 5/5

<a id="b-bhori"></a>
#### bhori — ভরির হিসাব · calculator
- **Concept:** স্বর্ণকারের লাল মখমলের গয়নার বাক্স, with a hand-written cash memo in the lid. No দাঁড়িপাল্লা: it is a party symbol.
- **First screen:** the open box, prefilled "২ ভরি ৪ আনা = ২৬.২৪ গ্রাম", with steppers for ভরি, আনা and রতি and a grams field.
- **Core:** (1) set the weight either way, (2) tap an item (বালা, চুড়ি, দুল, আংটি, হার) and whose it is (মায়ের, নানুর, আমার), (3) share.
- **Card:** the box with "মায়ের বালা · ১ ভরি ৫ আনা · ১৫.৩১ গ্রাম". Human line, e.g. নানুর হার: "ওজন গ্রামে মাপা যায়, স্মৃতি না।" Footer: "তোমার বাড়ির পুরোনো গয়নাটা কার?"
- **Loop / tally:** item id only; never weights or prices.
- **SEO:** `ভরি আনা রতি হিসাব — সোনার ওজন গ্রামে` · H1 "ভরি, আনা, রতি — গ্রামে কত?" · ভরি আনা রতি হিসাব · ১ ভরি সমান কত গ্রাম · সোনার ওজন হিসাব.
- **Link:** `#g=15.31&it=bala&w=ma`.
- **Risks:** the constants come from BAJUS (১ ভরি = ১১.৬৬৪ গ্রাম = ১৬ আনা; ১ আনা = ৬ রতি; ১ রতি = ১০ পয়েন্ট), shown with "যাচাই করা: <date>". No gold price, which changes daily. An optional price field is typed by the user and never stored. No investment advice.
- **Simplicity:** 5/5

<a id="b-tong"></a>
#### tong — টং-এর অর্ডার · builder + tally
- **Concept:** মামার টং-এর অর্ডার চিরকুট. A small hand-written chit with a tea-glass ring stain.
- **First screen:** the chit prefilled "দুধ চা · চিনি কম · একটা টোস্ট". Chips: চা (দুধ, রং, লেবু, মালাই, মসলা, তন্দুরি), চিনি (ছাড়া, কম, বেশি), কাপ or ভাঁড়, and সাথে (বিস্কুট, সিঙ্গারা, পুরি, ডালপুরি, কলা, বনরুটি). A tally line reads "দেশের প্রিয়: দুধ চা, চিনি কম".
- **Core:** (1) tap your tea, (2) tap what comes with it, (3) share.
- **Card:** the chit, "রাফির অর্ডার"; the story puts it on a wooden bench. Human line, e.g. লেবু চা without sugar plus a biscuit: "চায়ে স্বাস্থ্য খোঁজো, বিস্কুটে সেটা ভাঙো।" Footer: "মামা, তোমারটা কী?"
- **Loop / tally:** "আড্ডার অর্ডার": friends add their line to your chit through the link (up to 6) for a group chit. Tally: tea and extra ids.
- **SEO:** `চা নিয়ে ক্যাপশন — টং-এ তোমার অর্ডার` · H1 "মামা, এক কাপ চা — কেমন?" · চা নিয়ে ক্যাপশন · চায়ের দোকান ক্যাপশন · চা প্রেমী স্ট্যাটাস.
- **Link:** `#o=dudh.kom.cup.biscuit;lebu.0.bhar.singara&n=রাফি,মিম` (ids from fixed lists; ≤ 6 lines).
- **Risks:** no cigarettes, পান-জর্দা or brands; no prices.
- **Simplicity:** 5/5

<a id="b-golir-ain"></a>
#### golir-ain — গলির ক্রিকেটের আইন · checklist
- **Concept:** ইটের দেয়ালে কয়লা দিয়ে আঁকা স্টাম্প. Your street's rules are chalked beside the stumps.
- **First screen:** the wall, with 4 rules pre-ticked (ছাদে মারলে আউট, ওয়ান টিপ ওয়ান হ্যান্ড, ব্যাট যার প্রথম ব্যাট তার, ট্রায়াল বল) and 20 more as chips.
- **Core:** (1) tick your rules, (2) name the পাড়া if you like (≤ 16), (3) share.
- **Card:** "আমাদের পাড়ার আইন · <পাড়া>", with the ticked rules in chalk; the story is a tall wall. Human line, e.g. "ড্রেনে পড়লে ছয়": "বলের চেয়ে ড্রেন বেশি চেনো তুমি।" Footer: "তোমার গলির আইন কী ছিল?"
- **Loop / tally:** a friend's ticks overlay yours: "দুই গলির মিল ৭টা". Tally: rule ids.
- **SEO:** `গলির ক্রিকেটের নিয়ম — পাড়ার আইনের পোস্টার` · H1 "তোমার গলিতে কী কী আইন ছিল?" · গলির ক্রিকেট · পাড়ার ক্রিকেট খেলার নিয়ম · ছোটবেলার ক্রিকেট.
- **Link:** `#r=<24-bit mask, base36>&p=<পাড়া>`.
- **Risks:** curated rules only, with no injury jokes. Cross-link `cholo-kheli`, which covers desi games, not cricket.
- **Simplicity:** 5/5

### Wave 6

<a id="b-amar-bochhor"></a>
#### amar-bochhor — আমার বছর · creator
- **Concept:** স্কুলের বার্ষিকী ম্যাগাজিনের প্রচ্ছদ. "বার্ষিকী ২০২৬", with a সূচিপত্র of your year.
- **First screen:** a finished sample cover and five prompt rows, all preselected:
  - বছরের খাবার.
  - বছরের জায়গা.
  - বছরের শব্দ (ধৈর্য, নতুন শুরু, দৌড়…).
  - সেরা মুহূর্ত (নতুন চাকরি, বিয়ে, রেজাল্ট, দেশে ফেরা, শুধু টিকে থাকা).
  - সামনের বছর চাই.
- **Core:** (1) change any of the 5 chips, (2) add a name, (3) share.
- **Card:** the cover "রাফির বার্ষিকী ২০২৬" with five index lines. Human line, e.g. "শুধু টিকে থাকা": "এ বছর টিকে থাকাটাই ছিল বড় জয়।" Footer: "তোমার বছরের শব্দ কী?"
- **Loop / tally:** chip ids: "এ বছরের শব্দ: ধৈর্য".
- **SEO:** `২০২৬ সালের স্মৃতি — আমার বছর এক কার্ডে` · H1 "তোমার ২০২৬, এক প্রচ্ছদে" · ২০২৬ সালের স্মৃতি · বছর শেষের স্ট্যাটাস · year end status bangla.
- **Link:** `#y=2026&p=3,1,5,2,4&n=রাফি`.
- **Risks:** no free text; no hardship or political chips; gentle choices for a hard year. The year is a parameter, so 2027 reuses the tool.
- **Simplicity:** 4/5

<a id="b-daknam"></a>
#### daknam — ডাকনাম কী হতো? · personality quiz
- **Concept:** বারান্দা থেকে মায়ের ডাক. A grilled balcony, a clothesline and a speech bubble: "টুটুল! ভাত খেতে আয়!"
- **First screen:** the balcony with a sample bubble and three rows: বাড়ির বড়/মেজো/ছোট, চঞ্চল/শান্ত, ভোরের পাখি/রাতজাগা. An optional set chip: ছেলেদের, মেয়েদের, যেকোনো.
- **Core:** (1) three taps, (2) get a classic daak naam ("আরেকটা" shuffles within the same bucket), (3) share.
- **Card:** the balcony, "রাফি → টুটুল", with a human line per name. Footer: "তোমার আসল ডাকনাম কী?"
- **Loop / tally:** name id: "সবচেয়ে বেশি এসেছে: মিঠু".
- **SEO:** `ডাকনাম — তোমার ডাকনাম কী হতো?` · H1 "ছোটবেলায় তোমাকে কী নামে ডাকত?" · ডাকনাম · ডাক নাম ছেলেদের · মেয়েদের ডাক নাম.
- **Link:** `#a=021&s=any&n=রাফি` (the name is derived).
- **Risks:** a curated list of 60 names with no teasing, body or colour names (no কালু, মোটু). Equal sets for each gender.
- **Simplicity:** 5/5

<a id="b-cha-mudra"></a>
#### cha-mudra — চায়ের কাপে হিসাব · calculator
- **Concept:** মাটির ভাঁড়ের মিনার. A tower of clay tea cups as tall as the price.
- **First screen:** prefilled "৫,০০০ টাকা = ৫০০ কাপ চা · ১০০টা সিঙ্গারা · ৫০টা রিকশা", with the tower drawn. Unit-price chips can be edited ("চা ১০ টাকা").
- **Core:** (1) type an amount, or pick রিয়াল, দিরহাম, রিঙ্গিত, পাউন্ড or ডলার and type your own rate, (2) see it in cups, (3) share.
- **Card:** the tower, "৫,০০০ টাকা = ৫০০ কাপ চা", or "লন্ডনের এক কফি = ঢাকার ৪৫ কাপ চা". Human line, e.g. > 1,000 cups: "এক বছরের আড্ডা এক জিনিসে।" Footer: "তোমার শখের জিনিস কত কাপ চা?"
- **Loop / tally:** none (free numbers).
- **SEO:** `চায়ের কাপে হিসাব — যেকোনো দাম কত কাপ চা?` · H1 "এই দামে কত কাপ চা?" · চায়ের দাম · রিয়াল থেকে টাকা হিসাব · মজার টাকার হিসাব.
- **Link:** `#a=5000&u=cha10,singara50,riksha100&c=sar&r=32.5`.
- **Risks:** unit prices are editable examples labelled "তোমার এলাকার দাম বসাও". The rate field starts empty: no live exchange rates and no remittance-channel advice.
- **Simplicity:** 5/5

<a id="b-matir-bank"></a>
#### matir-bank — মাটির ব্যাংক · tap grid
- **Concept:** মাটির ব্যাংক. Each box you tap drops a coin through the slot; at 100% the bank cracks open.
- **First screen:** the bank with 30 coin boxes (৳১০–৳৩০০, total ৳৫,০০০) under the goal "টাকা জমানো · ৩০ দিন". Goal chips: টাকা জমানো, রোজ ১০ পৃষ্ঠা পড়া, রোজ হাঁটা, ফোন কম, পানি খাওয়া.
- **Core:** (1) pick a goal, (2) tap a box each day, (3) share your progress.
- **Card:** the bank, "রাফি · ৩০-এ ১৮ · ৳২,৯৪০ জমল", cracked when full. Human line at half: "অর্ধেক ভরা — বাকি অর্ধেক আরও সহজ।" Footer: "তোমার মাটির ব্যাংকে কত?"
- **Loop / tally:** "একসাথে জমাই": a friend starts the same goal from your link. Tally: goal id only.
- **SEO:** `টাকা জমানোর চার্ট — মাটির ব্যাংকে রোজ একটু` · H1 "রোজ একটু, মাটির ব্যাংকে" · টাকা জমানোর চার্ট · টাকা জমানোর উপায় · ৩০ দিনে টাকা জমানো.
- **Link:** `#g=save&m=<30-bit mask>&s=7` (the seed sets the box amounts).
- **Risks:** progress lives in the link, plus localStorage as best effort; the page says so. No bank, interest or investment advice. No worship goals. Launch 1 Jan, and again for 1 Boishakh.
- **Simplicity:** 5/5

<a id="b-shesh-bol"></a>
#### shesh-bol — শেষ বলে ছয় · game
- **Concept:** ফ্লাডলাইটের মাঠ আর গ্যালারির হাতে লেখা প্ল্যাকার্ড. The card is a fan's cardboard placard.
- **First screen:** "শেষ বল, দরকার ৫", a top-down pitch, a timing bar and one big "মারো!" button.
- **Core:** (1) tap at the right moment (modes: শেষ বলে ৫, or শেষ ওভারে ১২ বাঁচাও), (2) retry until you win, (3) share.
- **Card:** a placard, "শেষ বলে ছক্কা! — রাফি, ৩ বারের চেষ্টায়"; the story puts it in the crowd. Human line, e.g. first try: "এক চেষ্টায়! গ্যালারি পাগল।" Footer: "তুমি কয় চেষ্টায় পারবে?"
- **Loop / tally:** a challenge link with the same seed. Tally: attempts bucket.
- **SEO:** `ক্রিকেট গেম — শেষ বলে ছক্কা মারো` · H1 "শেষ বল, দরকার ৫। পারবে?" · ক্রিকেট গেম · শেষ বলে ছক্কা · cricket game bangla.
- **Link:** `#m=last5&s=<seed>&t=3&n=রাফি` (tries 1–99, self-reported).
- **Risks:** no player likeness, team names or crests, and no betting words. Canvas at 30fps for cheap phones, with a static timing bar under reduced motion.
- **Simplicity:** 5/5

### Wave 7

<a id="b-dhoyahin"></a>
#### dhoyahin — ধোঁয়াহীন দিন · counter
- **Concept:** টবে চারাগাছ. A sapling in a clay pot grows one leaf for each smoke-free day.
- **First screen:** the pot, the quit date set to today, sticks-a-day chips (৫, ১০, ২০) and an editable price per stick.
- **Core:** (1) set the quit date, (2) set sticks a day, (3) share.
- **Card:** the grown plant, "রাফি · ৬০ দিন ধোঁয়াহীন · ৬০০টা সিগারেট খাইনি · ৯,০০০ টাকা বাঁচল". Human line by days:
  - Day 1: "প্রথম দিনটাই সবচেয়ে কঠিন, আর তুমি সেটা পার করছ।"
  - Day 30: "এক মাস! চারাটা এখন গাছ।"
  - Footer: "এই কার্ডটা কাকে দেখাবে?"
- **Loop / tally:** family open a live link ("আব্বু ৬০ দিন"), recomputed daily. They can reply with a fixed-line card ("গর্বিত — আম্মু"). Tally: none.
- **SEO:** `সিগারেট ছাড়ার হিসাব — কত দিন, কত টাকা বাঁচল` · H1 "কত দিন ধোঁয়াহীন, কত টাকা বাঁচল?" · সিগারেট ছাড়ার উপায় · ধূমপান ছাড়ার হিসাব · সিগারেট ছাড়ার স্ট্যাটাস.
- **Link:** `#d=2026-12-01&k=10&p=15&n=রাফি`.
- **Risks:** no medical claims or recovery timelines, and no brands. A gentle restart ("আবার শুরু করো") resets the date without shame. The price is an editable example. Launch for 1 Jan; reprise on 31 May.
- **Simplicity:** 5/5

<a id="b-ghuri"></a>
#### ghuri — ঘুড়ি আর ফানুস · creator
- **Concept:** পুরান ঢাকার ছাদে সাকরাইনের সন্ধ্যা. Your kite, or lantern, flies high in an orange sky over the rooftops.
- **First screen:** the rooftop scene with a kite already flying. Chips: ঘুড়ি/ফানুস, 6 patterns (চোখদার, পঙ্খিরাজ, চাঁদিয়াল…), 6 colours, and a field to name the kite (≤ 12).
- **Core:** (1) tap a pattern and colour, (2) name it, (3) tap "ওড়াও" and share.
- **Card:** the kite in the sky, "রাফির 'পঙ্খিরাজ' · সাকরাইন ১৪৩৩". In lantern mode the ফানুস carries a wish from a fixed list ("সবাই ভালো থাকুক"). Human line from the pattern. Footer: "তোমার ঘুড়ির নাম কী?"
- **Loop / tally:** a friend's kite joins yours in the same sky, with no winner. Tally: pattern id.
- **SEO:** `সাকরাইন ঘুড়ি — নিজের ঘুড়ি আর ফানুস বানাও` · H1 "নিজের ঘুড়ি বানাও, আকাশে ওড়াও" · সাকরাইন · ঘুড়ি উৎসব · ফানুস.
- **Link:** `#o=kite&p=chokhdar&c=red&nm=পঙ্খিরাজ`.
- **Risks:**
  - Lantern copy respects Probarona Purnima's Buddhist meaning; have it reviewed.
  - Safety lines: real lanterns and fire, kites and power lines. Never mention glass-coated মাঞ্জা.
  - Shakrain is about 14 Jan.
- **Simplicity:** 5/5

<a id="b-flames"></a>
#### flames — ফ্লেমস · game
- **Concept:** স্কুলের বেঞ্চে কম্পাসের কাঁটায় খোদাই. Two names carved into a wooden bench, crossed out letter by letter like the notebook game.
- **First screen:** the bench with two sample names and the Bangla outcomes (বন্ধু, প্রেম, বিয়ে, ঝগড়ুটে বন্ধু, ভাইবোন, ভালো লাগা), plus two name fields.
- **Core:** (1) type two first names, (2) watch the letters cross out, (3) share.
- **Card:** the carving, "রাফি + মিম = বন্ধু", with the crossed letters. A human line per outcome. Footer: "তোমাদের কী আসে?"
- **Loop / tally:** none tallied. The friend's link shows the result and "নিজেরটা খেলো".
- **SEO:** `ফ্লেমস গেম — দুই নামে স্কুলের খেলা` · H1 "দুই নাম, এক খেলা — কী আসে?" · flames game · নাম দিয়ে লাভ ক্যালকুলেটর · নাম দিয়ে প্রেম.
- **Link:** `#a=রাফি&b=মিম` (≤ 12 each). The preview omits the second name: "রাফি ফ্লেমস খেলেছে — তুমিও খেলো".
- **Risks:** the other person's name stays in the link and is never stored. A "শুধু খেলা" stamp, and kind outcomes (no শত্রু). 14 Feb falls in Ramadan, so frame it as school nostalgia, not dating.
- **Simplicity:** 5/5

<a id="b-moner-boyos"></a>
#### moner-boyos — মনের বয়স কত? · personality quiz
- **Concept:** মেলার ওজন মাপার মেশিন. The coin-op scale that prints a little ticket; this one prints your heart's age.
- **First screen:** the machine, with question ১/৮ inline and three chips.
- **Core:** (1) tap 8 answers, (2) the ticket prints, (3) share.
- **Card:** the ticket, "মনের বয়স: ১৬ · মন্তব্য: এখনো বৃষ্টি দেখলে ভিজতে চায়"; the story shows the tall machine. Footer: "তোমার মনের বয়স কত?"
- **Loop / tally:** a friend's link shows "রাফির মন ১৬, তোমার?" with the tickets side by side. Tally: age bucket.
- **SEO:** `মনের বয়স কত? — ৮ প্রশ্নে মেপে দেখো` · H1 "শরীরের বয়স জানো, মনের বয়স কত?" · মনের বয়স কত · মনের বয়স ১৬ · মনের বয়স টেস্ট.
- **Link:** `#a=01201120&n=রাফি`.
- **Risks:** no mental-health claims, and no "old means bad" framing. Every bucket gets a kind line.
- **Simplicity:** 5/5

<a id="b-bagdhara"></a>
#### bagdhara — বাগধারার ছবি · scored quiz
- **Concept:** পুরোনো ব্যাকরণ বইয়ের পাতা. Line art that takes the idiom literally: a soaked cat for "ভিজে বিড়াল", a pumpkin for "অকালকুষ্মাণ্ড".
- **First screen:** the page at ১/১০, with the drawing and three meanings.
- **Core:** (1) tap the meaning, 10 times, (2) see your score, (3) share.
- **Card:** the page with 10 small drawings stamped right or wrong, "রাফি · ১০-এ ৭". The Ekushe set is sober. Footer: "তুমি কয়টা পারবে?"
- **Loop / tally:** a challenge link; per-idiom correct %.
- **SEO:** `বাগধারা কুইজ — ছবি দেখে মানে বলো` · H1 "ছবি দেখে বাগধারা বলো" · বাগধারা · বাগধারা ও অর্থ · বাগধারা mcq.
- **Link:** `#set=s1&a=…&n=রাফি`, rescored on open.
- **Risks:** meanings from the NCTB class 9–10 Bangla grammar book and the Bangla Academy dictionary. Skip idioms that demean caste, gender, disability or region. Original drawings only.
- **Simplicity:** 5/5

### Wave 8

<a id="b-sehri-iftar"></a>
#### sehri-iftar — সেহরি-ইফতারের সময় · lookup + countdown · **data-gated**
- **Concept:** দোকানের দেওয়া ভাঁজ করা পকেট সময়সূচি কার্ড. The free Ramadan timetable card, with a crescent at the top.
- **First screen:** the district (last used, else ঢাকা), today's two times in large type, and a live line, "ইফতারের আর ১ ঘণ্টা ১২ মিনিট". A district select, with the 30-day table below.
- **Core:** (1) tap your district, (2) see today and the countdown, (3) share.
- **Card:** the pocket card, "ঢাকা · ১২ রমজান · সেহরির শেষ ৪:৫৬ · ইফতার ৬:০২", plus the source line. Human line, under 15 minutes to iftar: "শরবতটা বানিয়ে ফেলো।" Footer: "তোমার জেলায় ইফতার কখন?"
- **Loop / tally:** none (no fast counting).
- **SEO:** `সেহরি ইফতারের সময়সূচি ২০২৭ — জেলা অনুযায়ী` · H1 "আজ সেহরি আর ইফতার কখন?" · সেহরি ও ইফতারের সময়সূচি ২০২৭ · ইফতারের সময় আজ ঢাকা · সেহরির শেষ সময় আজ.
- **Link:** `#z=dhaka` (one of the 64 districts).
- **Data gate:**
  - Times come only from the Islamic Foundation's 1448 AH timetable: the Dhaka table plus IF's district time-difference list.
  - Two people enter them separately and diff the files. The file carries the IF source and "যাচাই করা: <date>".
  - Until then the page shows no times, only "ইসলামিক ফাউন্ডেশনের সময়সূচি প্রকাশ হলে এখানে আসবে". Tests use fixture data marked TEST.
  - Never compute times astronomically. Day 1 of Ramadan comes from the moon config shared with `koto-din-baki`.
  - No fiqh notes beyond IF's own text.
- **Simplicity:** 5/5

<a id="b-chithi"></a>
#### chithi — চিঠি লিখি · creator
- **Concept:** নীল এয়ারমেইল চিঠি. A blue aerogramme with a red-blue border and stamps. In "ভবিষ্যতের আমি" mode it folds shut under a sticker: "খুলবে ১ বৈশাখ ১৪৩৪".
- **First screen:** a letter already begun, "আম্মু, কেমন আছ?". Recipient chips: আম্মু, আব্বু, ভাই/বোন, বন্ধু, ভবিষ্যতের আমি. Each section (শুরু, মাঝের কথা, শেষ) has three tap-in lines.
- **Core:** (1) pick who it's for, (2) tap lines or type one line (≤ 140), (3) share; for a future self, pick the open date.
- **Card:** the aerogramme in a handwriting font, "রিয়াদ থেকে আম্মুকে". The sealed version shows the envelope and the open date. Human line by recipient. Footer: "তুমি শেষ কবে চিঠি লিখেছ?"
- **Loop / tally:** the recipient replies with a fixed-line card ("চিঠি পেয়েছি — আম্মু"). A sealed link shows a closed letter and a countdown until the date. No tally.
- **SEO:** `মায়ের কাছে চিঠি — এয়ারমেইল চিঠি লেখো` · H1 "অনেক দিন চিঠি লেখা হয় না" · মায়ের কাছে চিঠি · প্রবাসীদের নিয়ে কষ্টের স্ট্যাটাস · ভবিষ্যতের আমাকে চিঠি.
- **Link:** `#to=amma&l=2,5,1&t=<≤140>&from=<≤20>&open=2027-04-14`.
- **Risks:** the sealed letter sits in the link, so say plainly "চমক, গোপন নয়". No public wall.
- **Simplicity:** 4/5

<a id="b-bangla-typing"></a>
#### bangla-typing — বাংলা টাইপিং স্পিড · game
- **Concept:** কোর্টের বারান্দার টাইপিস্টের বাংলা টাইপরাইটার. Paper rolls up and a bell rings at the end of each line.
- **First screen:** the typewriter with a proverb to type. The 60-second timer starts on your first keystroke.
- **Core:** (1) type, (2) see words a minute and accuracy, (3) share.
- **Card:** a carbon-copy sheet, "রাফি · মিনিটে ২৮ শব্দ · ৯৬% নির্ভুল". Human line, above 40: "কোর্টের টাইপিস্টরাও তোমাকে সালাম দেবে।" Footer: "তুমি মিনিটে কত?"
- **Loop / tally:** a challenge link with the same passage. Tally: speed bucket.
- **SEO:** `বাংলা টাইপিং টেস্ট — মিনিটে কত শব্দ?` · H1 "মিনিটে কয়টা বাংলা শব্দ?" · বাংলা টাইপিং টেস্ট · bangla typing speed test · বাংলা টাইপিং প্র্যাকটিস.
- **Link:** `#p=12&w=28&a=96&n=রাফি` (self-reported; labelled "নিজের ফোনে মাপা").
- **Risks:** keyboards differ (Avro, Gboard, Ridmik), so compare NFC-normalised graphemes, accept both ৎ forms and ignore zero-width joiners. Public-domain proverbs. Say it is not an official job-test simulator.
- **Simplicity:** 4/5

<a id="b-jam"></a>
#### jam — জ্যামে জীবন · calculator
- **Concept:** লোকাল বাসের গায়ে হাতে লেখা রুট বোর্ড ("গুলিস্তান — মিরপুর · সিটিং সার্ভিস").
- **First screen:** the bus side, prefilled "রোজ ৯০ মিনিট · ৫ বছর → জ্যামে জীবনের ১১৪ দিন", with two steppers.
- **Core:** (1) daily minutes, (2) years, (3) share; the route words (≤ 20) are optional.
- **Card:** the bus with its route board and a big "১১৪ দিন", plus equivalents ("= ২,৭০০ কাপ চা"). Human line, over 100 days: "এত সময়ে একটা ভাষা শেখা যেত, অথবা অনেক ঘুম।" Footer: "তোমার জীবনের কত দিন জ্যামে?"
- **Loop / tally:** minutes bucket (6 fixed): "যারা হিসাব করেছে, তাদের অর্ধেক রোজ ১ ঘণ্টার বেশি".
- **SEO:** `ঢাকার জ্যাম — জ্যামে জীবনের কত দিন?` · H1 "জ্যামে জীবনের কত দিন গেল?" · ঢাকার জ্যাম · যানজট নিয়ে স্ট্যাটাস · ঢাকার জ্যাম মিম.
- **Link:** `#m=90&y=5&r=গুলিস্তান-মিরপুর`.
- **Risks:** uses the person's own numbers only; makes no city claims; the copy works for Chattogram or Sylhet too.
- **Simplicity:** 5/5

<a id="b-bhorta"></a>
#### bhorta — তুমি কোন ভর্তা? · personality quiz
- **Concept:** শিলপাটা. The grinding stone, and a round ball of bhorta on a banana leaf.
- **First screen:** question ১/৬ on the শিলপাটা, with three chips.
- **Core:** (1) tap 6 answers, (2) get your bhorta (আলু, বেগুন, শুঁটকি, কালোজিরা, টমেটো, ডাল, চিংড়ি, সরিষা), (3) share.
- **Card:** the banana leaf, "রাফি = শুঁটকি ভর্তা · ঝাঁঝালো, তবু সবাই খোঁজে". Footer: "তুমি কোন ভর্তা?"
- **Loop / tally:** a friend's link adds a pair line ("রাফি আলু, মিম বেগুন — একসাথে মাখলে ভাত শেষ"). Tally: result id.
- **SEO:** `ভর্তার নাম — তুমি কোন ভর্তা?` · H1 "তুমি কোন ভর্তা?" · ভর্তার নাম · ভর্তা নিয়ে ক্যাপশন · ভর্তা ভাত স্ট্যাটাস.
- **Link:** `#a=012210&n=রাফি`.
- **Risks:** every result is flattering; no mean traits.
- **Simplicity:** 5/5

### Wave 9

<a id="b-eider-din"></a>
#### eider-din — ঈদের দিন · checklist + colour tally
- **Concept:** মেহেদি রাঙা হাত. Each Eid-day thing you tick adds a petal to the mehendi; the background is your outfit colour.
- **First screen:** a half-decorated hand and a row of outfit swatches (সবুজ preselected). Below are 25 festive items, 5 pre-ticked: নতুন জামা, সেমাই, সালামি, কোলাকুলি, ঘোরাঘুরি.
- **Core:** (1) tap your outfit colour, (2) tick the items, (3) share.
- **Card:** the hand, "রাফির ঈদ · ২৫-এ ১৮", on your colour, with a palette strip: "এবার ঈদে সবুজ এগিয়ে". Human line, e.g. salami both received and given: "নিলেও, দিলেও — এটাই বড় হওয়া।" Footer: "তোমার ঈদে কয়টা হলো?"
- **Loop / tally:** colour and item ids. A friend's link overlays: "দুজনেরই: সেমাই, দুপুরের ঘুম".
- **SEO:** `ঈদের দিনের স্ট্যাটাস — কয়টা কাজ হলো?` · H1 "ঈদের দিন কয়টা কাজ হলো?" · ঈদের দিনের স্ট্যাটাস · ঈদের পোশাক ট্রেন্ড · ঈদ নিয়ে ক্যাপশন.
- **Link:** `#c=green&i=<25-bit mask>&e=fitr27&n=রাফি`.
- **Risks:** festive items only. Never score worship (no নামাজ or যাকাত ticks), and no rulings. Inclusive copy, so friends of any faith can join. An Eid-ul-Adha pack can come later (no slaughter images), and so can a Puja colour mode.
- **Simplicity:** 5/5

<a id="b-ganer-koli"></a>
#### ganer-koli — গানের কলি · game helper
- **Concept:** হারমোনিয়ামের কাঠের ডালা. Letter chits come out of a clay pot, and the score is chalked on the lid.
- **First screen:** two teams prefilled (দল ক, দল খ; tap to rename), a big "অক্ষর তোলো" button and a timer.
- **Core:** (1) tap to draw a letter (30-second timer), (2) tap the team that sang, (3) repeat, then share the final score.
- **Card:** the lid, "ঈদের রাতের গানের কলি · দল আম্মু ১২ — দল ভাইয়া ৯". Human line for a close game: "এক গানের ব্যবধান — আবার খেলা হবে!" Footer: "তোমাদের বাসায় কে জেতে?"
- **Loop / tally:** the link replays the score card. No tally.
- **SEO:** `গানের কলি খেলা — অক্ষর, টাইমার আর স্কোর` · H1 "গানের কলি খেলা, এক ফোনে" · গানের কলি খেলা · অন্তাক্ষরী বাংলা · গানের কলি খেলার নিয়ম.
- **Link:** `#t=দল আম্মু,দল ভাইয়া&s=12,9`.
- **Risks:** never show lyrics, only letters. Weight the letters to avoid impossible ones (ঙ, ঞ, ং). Works offline after the first load.
- **Simplicity:** 4/5

<a id="b-attiyo"></a>
#### attiyo — কে কী হয়? · chain calculator
- **Concept:** পারিবারিক অ্যালবামের পাতা. Photo corners and silhouettes labelled in fountain pen.
- **First screen:** "আমি" in the middle, chips (আব্বুর, আম্মুর, ভাইয়ের, বোনের, স্বামীর, স্ত্রীর, ছেলের, মেয়ের), and a chain already built: "আব্বুর → বোনের → স্বামী = ফুপা".
- **Core:** (1) tap a chain of up to 4 steps, (2) the term appears with its variants (চাচা/কাকা, ফুপু/পিসি, খালা/মাসি), (3) share.
- **Card:** the album page, "আব্বুর বোনের স্বামী = ফুপা (পিসেমশাই)". Footer, as a teaser: "আব্বুর খালাতো বোনের মেয়ে তোমার কী হয়?"
- **Loop / tally:** quiz link: a friend guesses the term for your chain. Tally: chain id: "সবচেয়ে বেশি খোঁজা: খালু".
- **SEO:** `আত্মীয়তার সম্পর্কের নাম — কে কী হয়?` · H1 "কে কী হয়? সম্পর্কের নাম খুঁজে দেখো" · আত্মীয়তার সম্পর্কের নাম · খালু ফুপা মানে · সম্পর্কের নাম বাংলায়.
- **Link:** `#c=f.sis.hus`.
- **Risks:** terms from the Bangla Academy dictionaries. Show Muslim and Hindu, and Bangladesh and West Bengal, variants side by side, never one "correct" form. Capping chains at 4 keeps the table hand-checkable: list every chain in `content.ts` and review it.
- **Simplicity:** 4/5

<a id="b-studior-chhobi"></a>
#### studior-chhobi — স্টুডিওর ছবি · photo creator
- **Concept:** ৯০-এর পাড়ার ফটো স্টুডিও. A painted backdrop (পাহাড়-লেক, ফুলবাগান, উড়োজাহাজ, বাগানবাড়ি), plastic flowers and a fictional studio stamp.
- **First screen:** a sample print with a silhouette, backdrop chips and a "ছবি দাও" button (`PhotoPicker`).
- **Core:** (1) pick a backdrop, (2) add a photo in an oval vignette (no cut-out needed), (3) share.
- **Card:** a white-bordered print with a date stamp and "একটুখানি স্টুডিও". A human line per backdrop. Footer: "তোমার ছোটবেলার স্টুডিওর ছবিটা কোথায়?"
- **Loop / tally:** a friend uses the same backdrop: "একই ব্যাকড্রপে দুজন". Tally: backdrop id.
- **SEO:** `পুরনো দিনের ছবি — স্টুডিওর ব্যাকড্রপে তুমি` · H1 "চলো, স্টুডিওতে একটা ছবি তুলি" · পুরনো দিনের ছবি · রেট্রো ছবি বানানো · স্টুডিওর ছবি.
- **Link:** `#b=lake&d=2027-04-14` (the photo never goes in the link).
- **Risks:** the photo stays on the phone, with on-device colour grading only. Original backdrop paintings, no real monuments. Works without a photo (silhouette). Launch for Eid and Boishakh.
- **Simplicity:** 4/5

<a id="b-koto-cheno"></a>
#### koto-cheno — আমাকে কতটা চেনো? · two-sided quiz
- **Concept:** স্লাম বুক. The school slam-book page: প্রিয় রং, প্রিয় খাবার, প্রিয় ঋতু, রাগ হলে কী করি…
- **First screen:** the slam-book page with 8 questions of 4 drawn options each, prefilled with sample answers to change.
- **Core:** you tap your 8 answers and share; a friend taps 8 guesses and gets a score card.
- **Card:** the page, "মিম রাফিকে ৮-এ ৬ চেনে". Human line at 8/8: "তুমি রাফির স্লাম বুক মুখস্থ করেছ।" Footer: "তোমাকে কে বেশি চেনে?"
- **Loop / tally:** the friend's result goes back as a link. No server scoreboard (names are never stored). Tally: none.
- **SEO:** `বন্ধুত্বের কুইজ — আমাকে কতটা চেনো?` · H1 "বন্ধুরা তোমাকে কতটা চেনে?" · বন্ধুত্বের কুইজ · friendship quiz bangla · বন্ধুদের জন্য প্রশ্ন.
- **Link:** `#a=21302103&n=রাফি` plus the guess `&g=…&gn=মিম`.
- **Risks:** fixed options only; no crush, relationship or body questions; safe for teenagers.
- **Simplicity:** 4/5

### Wave 10

<a id="b-eidjatra"></a>
#### eidjatra — ঈদযাত্রা · tap + tally
- **Concept:** হাতে আঁকা পথের নকশা. A single dotted line on brown paper from ঢাকা to home, with your vehicle drawn and the hours marked like milestones. It is one line, not a map.
- **First screen:** a sample, "ঢাকা → রংপুর · বাস · ১৪ ঘণ্টা". From/to division chips (8 each), mode chips (বাস, ট্রেন, লঞ্চ, প্রাইভেট গাড়ি) and an hours stepper.
- **Core:** (1) pick the route, (2) pick the mode, (3) set the hours, then share.
- **Card:** the sketch, "রাফি · ঢাকা → রংপুর · ট্রেনে ৯ ঘণ্টা · বাড়ি পৌঁছেছি", with the tally line "এবার এই পথে গড়ে ১১ ঘণ্টা (৩৪০ জন)". Human line, over 12 hours: "লম্বা পথ, শেষে মায়ের হাতের রান্না।" Footer: "তোমার বাড়ি যেতে কত ঘণ্টা?"
- **Loop / tally:** from-division × to-division × mode × hours bucket, with a fixed event id per Eid. Minimum 50 per route.
- **SEO:** `ঈদযাত্রা — বাড়ি যেতে কত ঘণ্টা লাগল?` · H1 "এবার বাড়ি যেতে কত ঘণ্টা লাগল?" · ঈদযাত্রা · ঈদের ছুটি ২০২৭ · বাড়ি ফেরার স্ট্যাটাস.
- **Link:** `#f=dhaka&t=rangpur&m=train&h=9`.
- **Risks:** the average is labelled "যারা জানিয়েছে". Never live traffic or navigation. No accident content. Bucketed hours and a minimum sample limit gaming.
- **Simplicity:** 5/5

<a id="b-probash"></a>
#### probash — প্রবাস জীবন · checklist
- **Concept:** পাসপোর্টের পাতা. Each moment you tick becomes a visa-style rubber stamp: generic, with no emblem or MRZ.
- **First screen:** an open booklet, "প্রবাস জীবন · ৪০-এ ৪". Four moments are pre-ticked: ভিডিও কলে ঈদ, লাগেজে শুঁটকি, দেশের সিম বন্ধ, মায়ের রান্না মিস. Pack chips: কর্মী, ছাত্র, পরিবারসহ.
- **Core:** (1) tick your moments, (2) add a city if you like, (3) share.
- **Card:** stamped pages, "রাফি · রিয়াদ · ৪০-এ ২৭". Human line, e.g. with "একা ইফতার": "একা ইফতার, তবু প্লেটে দেশের পেঁয়াজু।" Footer: "তোমার পাসপোর্টে কয়টা সিল?"
- **Loop / tally:** a friend's link overlays: "দুজনেরই: এয়ারপোর্টে কান্না". Tally: moment ids: "৯১% ভিডিও কলে ঈদ করেছে".
- **SEO:** `প্রবাস জীবন — কয়টা মুহূর্ত তোমার সাথে মেলে?` · H1 "প্রবাস জীবনের কয়টা মুহূর্ত তোমার?" · প্রবাস জীবন নিয়ে ক্যাপশন · প্রবাসীদের নিয়ে স্ট্যাটাস · probashi status.
- **Link:** `#p=worker&m=<40-bit mask>&c=<≤20>`.
- **Risks:** never mock hardship; no visa, legal-status or debt items. Cross-link `deshe-fera`.
- **Simplicity:** 5/5

<a id="b-char-priyo"></a>
#### char-priyo — চার প্রিয় · creator
- **Concept:** নীলক্ষেতের বইয়ের তাক. Four spines with hand-lettered titles on a wooden shelf.
- **First screen:** the shelf with four sample spines and category chips: নাটক, সিনেমা, বই, গান. Tapping a spine opens a curated list, plus "নিজে লেখো".
- **Core:** (1) pick a category, (2) fill the four spines, (3) share.
- **Card:** the shelf, "রাফির চার প্রিয় নাটক", with a human line from the category. Footer: "তোমার চারটা কী?"
- **Loop / tally:** a friend's shelf stands next to yours: "দুজনেরই আছে: …". Tally: curated item ids only, never typed titles.
- **SEO:** `সেরা বাংলা নাটক — তোমার চার প্রিয়` · H1 "চারটা প্রিয়, এক তাকে" · সেরা বাংলা নাটক · প্রিয় বাংলা সিনেমা · সেরা বাংলা উপন্যাস.
- **Link:** `#k=natok&i=12,4,33,t:<≤30>`.
- **Risks:** titles as text only, with no posters or covers. The curated list is checked. Typed titles stay in the link. The Eid natok season is the moment.
- **Simplicity:** 4/5

<a id="b-dhadha"></a>
#### dhadha — আজকের ধাঁধা · reveal quiz
- **Concept:** কুপি বাতির আলোয় নানির শোলক. A dark night, a কুপি flame, and the riddle in a speech bubble.
- **First screen:** today's riddle with three guess chips.
- **Core:** (1) read it, (2) tap a guess, (3) see the answer and share.
- **Card:** the riddle only, no answer: "আজকের ধাঁধা · ১২ জানুয়ারি". Footer: "উত্তর কমেন্টে লেখো!" After guessing: "রাফি প্রথম চেষ্টায় পেরেছে".
- **Loop / tally:** the link opens the same riddle. Tally: per-riddle correct %.
- **SEO:** `ধাঁধা উত্তর সহ — আজকের বাংলা ধাঁধা` · H1 "নানির ধাঁধা, আজকেরটা পারবে?" · ধাঁধা উত্তর সহ · বাংলা ধাঁধা · মজার ধাঁধা.
- **Link:** `#d=2027-01-12` (a rotating bank of 120, chosen by date).
- **Risks:** folk riddles from public-domain collections (Banglapedia "ধাঁধা", Bangla Academy folklore). Family-safe. No letter grid, so it stays distinct from শব্দ সাজাই.
- **Simplicity:** 5/5

<a id="b-tokhon-ekhon"></a>
#### tokhon-ekhon — দাম তখন আর এখন · year → value
- **Concept:** আব্বুর পুরোনো চামড়ার মানিব্যাগ. It opens on a faded amount and a year.
- **First screen:** the wallet showing a year select (from the first year in the data to last year) and amount chips (১০, ১০০, ১,০০০). The result: "১৯৯৫ সালের ১০০ টাকা ≈ আজকের <X> টাকা".
- **Core:** (1) pick a year (your birth year works), (2) pick an amount, (3) share.
- **Card:** the open wallet with the sum and the source line. Human line, above 5×: "দাম বেড়েছে পাঁচ গুণ, তোমার গল্প তার চেয়েও বেশি।" Footer: "তোমার জন্মসালের ১০০ টাকা আজ কত?"
- **Loop / tally:** year id: "সবচেয়ে বেশি খোঁজা সাল: ২০০০".
- **SEO:** `আগের দিনের দাম — সেই ১০০ টাকা আজ কত?` · H1 "সেই ১০০ টাকা আজ কত টাকা?" · আগের দিনের দাম · টাকার মান · মূল্যস্ফীতি হিসাব.
- **Link:** `#y=1995&a=100`.
- **Risks:** one dataset: the BBS national CPI annual average (via World Bank WDI `FP.CPI.TOTL`, Bangladesh), with its source and "যাচাই করা: <date>", updated once a year. Label it "গড় দামের হিসাবে আনুমানিক". No per-item old prices (viral ones are often misdated), and no investment advice.
- **Simplicity:** 5/5

### Wave 11

<a id="b-namta"></a>
#### namta — নামতা চ্যালেঞ্জ · game
- **Concept:** কাঠের ফ্রেমের স্লেট আর চক. A wet cloth wipes each answer away.
- **First screen:** table chips ২–২০ (৫ preselected), the first sum "৫ × ৩ = ?" and a big Bangla number pad.
- **Core:** (1) pick a table, (2) answer 10 sums, (3) get a certificate and share.
- **Card:** the slate, "রাফি · ৫-এর নামতা · ১০-এ ১০", with a gold star. A parent line: "আমার মেয়ে পেরেছে!" Footer: "তোমার বাচ্চা কোন নামতা পারে?"
- **Loop / tally:** a challenge link for siblings and cousins. Tally: table id.
- **SEO:** `নামতা চ্যালেঞ্জ — বাংলায় নামতার খেলা` · H1 "নামতা পারো? স্লেটে দেখাও" · নামতা ১ থেকে ১০০ বাংলা · নামতা শেখা · বাংলা নামতা.
- **Link:** `#t=5&a=<answers>&n=রাফি`, rescored on open.
- **Risks:** children use it: the name is optional and the timer is off by default. Add a static নামতা table section for search.
- **Simplicity:** 5/5

<a id="b-prothom-ay"></a>
#### prothom-ay — আমার প্রথম আয় · creator
- **Concept:** বাদামি বেতনের খাম. An amount scribbled in pencil, with what you bought peeking out: a শাড়ি, a পাঞ্জাবি, a box of sweets.
- **First screen:** the sample envelope "২০১৯ · প্রথম বেতন · আম্মুর জন্য শাড়ি" and three chip rows:
  - কী ছিল: টিউশনি, চাকরি, ফ্রিল্যান্সিং, ব্যবসা, পার্টটাইম.
  - কী করেছিলে: আম্মুর শাড়ি, আব্বুর পাঞ্জাবি, মিষ্টি বিলি, ভাইবোনের উপহার, জমিয়েছি, ট্রিট.
  - The year.
- **Core:** (1) three taps (the amount is optional and hidden by default), (2) add a name, (3) share.
- **Card:** the envelope, "রাফির প্রথম আয় · টিউশনি · ২০১৯ · আম্মুর জন্য শাড়ি". Human line, e.g. মিষ্টি বিলি: "প্রথম টাকায় সবার মুখ মিষ্টি, এর চেয়ে ভালো খরচ নেই।" Footer: "তোমার প্রথম আয় দিয়ে কী করেছিলে?"
- **Loop / tally:** source and what-you-did ids: "সবচেয়ে বেশি: আম্মুর জন্য উপহার".
- **SEO:** `প্রথম বেতন — প্রথম আয়ের গল্পের কার্ড` · H1 "প্রথম আয়ের টাকায় কী করেছিলে?" · প্রথম বেতন · প্রথম বেতন নিয়ে স্ট্যাটাস · প্রথম আয় ক্যাপশন.
- **Link:** `#s=tuition&d=shari&y=2019&n=রাফি` (an amount, if added, stays in the link and is never tallied).
- **Risks:** no "earn online" hype and no income comparison.
- **Simplicity:** 5/5

<a id="b-ami-bolechhilam"></a>
#### ami-bolechhilam — আমি বলেছিলাম! · tap + seal
- **Concept:** সিলগালা করা বাদামি খাম. A red lac seal you "break" after the match.
- **First screen:** a sample, "বাংলাদেশ বনাম শ্রীলঙ্কা", with two team pickers from fixed lists (cricket and football nations), winner chips and margin chips (cricket: run or wicket buckets; football: a score from 0 to 5).
- **Core:** (1) pick the teams, (2) pick the winner and margin, (3) seal and share.
- **Card:**
  - Sealed: "রাফির ভবিষ্যদ্বাণী · খোলা যাবে খেলার পর".
  - Opened: "আমি বলেছিলাম! বাংলাদেশ জিতবে ৫ উইকেটে", with "মিলেছে / মেলেনি" chips for the owner to tap.
  - Footer: "তোমার ভবিষ্যদ্বাণী কী?"
- **Loop / tally:** friends add their own predictions to the same link (up to 6). Tally: winner pick per team pair: "৭৮% বলছে বাংলাদেশ".
- **SEO:** `ম্যাচ প্রেডিকশন — খেলার আগে বলে রাখো` · H1 "খেলার আগে বলে রাখো, পরে দেখিয়ে দাও" · আজকের ম্যাচ প্রেডিকশন · বাংলাদেশ বনাম · ম্যাচ প্রেডিকশন.
- **Link:** `#a=ban&b=sl&w=ban&m=w5&n=রাফি`.
- **Risks:** no odds, stakes, points, prizes or betting words. The seal is honour-based; show the short link's creation time only if `/s/<id>` exposes it. No fixtures data, because people pick the teams. No crests.
- **Simplicity:** 4/5

<a id="b-mache-bhate"></a>
#### mache-bhate — মাছে-ভাতে · checklist
- **Concept:** মাছের বাজারের বাঁশের ডালা আর বঁটি. Your fish laid out on the bamboo tray.
- **First screen:** the tray with three near-universal fish already on it (রুই, ইলিশ, পাঙাশ), "৫০-এ ৩", and a grid of 50 drawn fish grouped as নদীর, পুকুরের, সাগরের and ছোট মাছ.
- **Core:** (1) tick the fish you've eaten, (2) add a name, (3) share.
- **Card:** the tray from above, "রাফির ডালা · ৫০-এ ২৩ · খাঁটি মাছে-ভাতে". Human line, e.g. পাবদা, টেংরা and শিং: "ছোট মাছের কাঁটা বাছতে জানো, এটা আসল প্রতিভা।" Footer: "তোমার ডালায় কয়টা?"
- **Loop / tally:** a friend's link overlays yours. Tally: fish ids; the rarest is a discovery prompt.
- **SEO:** `দেশি মাছের নাম ও ছবি — কয়টা খেয়েছ?` · H1 "দেশি মাছ, কয়টা খেয়েছ?" · দেশি মাছের নাম ও ছবি · মাছের নামের তালিকা · ছোট মাছের নাম.
- **Link:** `#f=<50-bit mask, base36>&n=রাফি`.
- **Risks:** draw look-alikes accurately (check against DoF and Banglapedia pages). Mark threatened species gently, "এখন কম পাওয়া যায়" (IUCN Bangladesh 2015). For Boishakh's পান্তা-ইলিশ, make no claims about ban seasons.
- **Simplicity:** 5/5

<a id="b-jomi"></a>
#### jomi — জমির মাপ · calculator
- **Concept:** ধানক্ষেতের আল আর আমিনের শিকল. Plots seen from above, with a surveyor's chain along the edge.
- **First screen:** "১ বিঘা" prefilled, showing every unit (শতাংশ, কাঠা, একর, বর্গফুট, বর্গমিটার) and a picture: "ফুটবল মাঠের প্রায় ১৯%".
- **Core:** (1) type a value, (2) pick its unit, (3) share; a label chip (ভিটা, ধানক্ষেত, পুকুর) is optional.
- **Card:** the field, "১ বিঘা = ৩৩ শতাংশ = ২০ কাঠা = ১৪,৪০০ বর্গফুট". Footer: "তোমার বাড়ির উঠোন কত শতাংশ?"
- **Loop / tally:** none.
- **SEO:** `জমির মাপ — শতাংশ, কাঠা, বিঘা হিসাব` · H1 "শতাংশ, কাঠা, বিঘা — কোনটা কত?" · এক শতাংশ সমান কত স্কয়ার ফিট · বিঘা থেকে কাঠা · জমি মাপার সূত্র.
- **Link:** `#v=1&u=bigha`.
- **Risks:**
  - Standard units come from the Ministry of Land's unit table (land.gov.bd), dated: ১ শতাংশ = ৪৩৫.৬ বর্গফুট; ১ কাঠা = ৭২০ বর্গফুট; ১ বিঘা = ২০ কাঠা.
  - বিঘা and কাঠা vary by region, so add "তোমার এলাকায় আলাদা হতে পারে".
  - Not legal or survey advice. Nothing that looks like a দলিল.
- **Simplicity:** 5/5

### Wave 12

<a id="b-ek-koti"></a>
#### ek-koti — এক কোটি টাকা খরচ করো · game
- **Concept:** ভ্যানগাড়ি বোঝাই কেনাকাটা. A rickshaw-van piles higher with everything you buy.
- **First screen:** a big counter, "বাকি: ১,০০,০০,০০০ টাকা", and 40 desi items with + buttons: এক কাপ চা, ইলিশ, পাড়ায় বিরিয়ানি, মোটরসাইকেল, আম্মুর জন্য বাড়ি, স্কুলে লাইব্রেরি, গ্রামের রাস্তা…
- **Core:** (1) tap + on items, (2) watch the counter fall, (3) share at any point.
- **Card:** the loaded van, "রাফি ৳১ কোটি খরচ করেছে: ৩০০ প্লেট কাচ্চি, ১টা স্কুল লাইব্রেরি…". Human line, if it's mostly gifts: "তোমার কোটি টাকায় অন্যের হাসি বেশি।" Footer: "তুমি এক কোটি টাকায় কী কিনতে?"
- **Loop / tally:** item ids: "সবচেয়ে বেশি কেনা: আম্মুর জন্য বাড়ি".
- **SEO:** `এক কোটি টাকা দিয়ে কী করব? — খরচ করে দেখো` · H1 "এক কোটি টাকা পেলে কী করতে?" · এক কোটি টাকা দিয়ে কী করব · কোটি টাকা পেলে কী করবেন · spend money game bangla.
- **Link:** `#q=<id:count,…>&n=রাফি`.
- **Risks:** round prices labelled "আনুমানিক, মজার জন্য" with a date. Nothing that resembles a lottery, prize or bet. No brands. Generous items are included.
- **Simplicity:** 5/5

<a id="b-rokto"></a>
#### rokto — রক্তদাতা কার্ড · date calculator
- **Concept:** রক্তের ব্যাগের লেবেল. The donor card printed like a blood-bag label with a red drop.
- **First screen:** the label with blood-group chips (A+ … O−), a last-donation date select and a times-donated stepper. The sample reads "আবার পারবে: ১২ মার্চ".
- **Core:** (1) pick your group, (2) set the last date, (3) share the badge.
- **Card:** the label, "রাফি · O+ · ৭ বার রক্ত দিয়েছি · আবার পারব: ১২ মার্চ ২০২৭". Human line, first time: "প্রথমবার! কারও জীবনে তুমি প্রথম ফোঁটা।" Footer: "তুমি শেষ কবে রক্ত দিয়েছ?"
- **Loop / tally:** a friend's link reads "রাফি রক্ত দেয়, তুমি?". No tally (health data).
- **SEO:** `রক্তদাতা কার্ড — আবার কবে রক্ত দিতে পারবে` · H1 "আবার কবে রক্ত দিতে পারবে?" · রক্ত দানের নিয়ম · কত দিন পর পর রক্ত দেওয়া যায় · রক্ত দান নিয়ে ক্যাপশন.
- **Link:** `#g=op&d=2026-11-12&c=7&n=রাফি`.
- **Risks:**
  - This is medical. Take the interval from DGHS Safe Blood Transfusion Programme guidance (verify; often given as ৪ মাস) and show its source and date.
  - Add "রক্ত দেওয়ার আগে ব্লাড ব্যাংক তোমাকে পরীক্ষা করবে".
  - No eligibility judgements (weight, illness, medicines). No phone numbers on the card.
- **Simplicity:** 5/5

<a id="b-cassette"></a>
#### cassette — আমার ক্যাসেট · picker creator
- **Concept:** ক্যাসেটের জে-কার্ড. A hand-written side A and side B track list on a coloured inlay.
- **First screen:** a filled J-card of 10 songs from a curated list of about 120 Bangla band, folk and film titles with artists. Tap a slot to swap.
- **Core:** (1) tap songs into the 10 slots, (2) name the tape (≤ 20), (3) share.
- **Card:** the cassette and J-card, "রাফির মিক্সটেপ · শীত ২০২৬", with a human line by era (mostly 90s: "তোমার ক্যাসেট এখনো রিওয়াইন্ড হয়।"). Footer: "তোমার ক্যাসেটে কোন গান?"
- **Loop / tally:** a friend's tape lines up next to yours: "দুজনেরই আছে: …". Tally: song ids.
- **SEO:** `বাংলা ব্যান্ডের গান — আমার ক্যাসেট বানাও` · H1 "দশ গানের একটা ক্যাসেট বানাও" · বাংলা ব্যান্ডের গান · ৯০ দশকের বাংলা গান · পুরোনো বাংলা গান.
- **Link:** `#s=12,44,…&t=<≤20>`.
- **Risks:** titles and artists only, with no lyrics, audio or album art. Verify every attribution. No fake concert line-ups with real names (CR03 is out of scope). Moments: Boishakh and winter concerts.
- **Simplicity:** 4/5

<a id="b-jibh"></a>
#### jibh — জিভ কোন জেলার? · personality quiz
- **Concept:** ট্রেনের টিকিট. A generic cardboard ticket, "জিভের টিকিট: ঢাকা → বগুড়া". It is not a railway replica: no logo.
- **First screen:** question ১/৬, "সকালের নাস্তায়?", with drawn-dish chips.
- **Core:** (1) six food picks, (2) get a destination (one of 20 places known for a food), (3) share.
- **Card:** the ticket, "রাফির জিভ · গন্তব্য: সিলেট (সাতকরা গরু, চা)", with a human line per destination. Footer: "তোমার জিভ কোন জেলার?"
- **Loop / tally:** a friend's link prints two tickets: "একই ট্রেনে?". Tally: destination id.
- **SEO:** `৬৪ জেলার বিখ্যাত খাবার — জিভ কোন জেলার?` · H1 "তোমার জিভ কোন জেলার টিকিট কাটবে?" · ৬৪ জেলার বিখ্যাত খাবার · কোন জেলার কোন খাবার বিখ্যাত · জেলার বিখ্যাত খাবার.
- **Link:** `#a=031220&n=রাফি`.
- **Risks:** say "যেখানকার বলে পরিচিত" and cite GI registrations (DPDT register). No district ranking or jokes. Sweets are left to `mishtir-baksho`.
- **Simplicity:** 5/5

<a id="b-matcher-mon"></a>
#### matcher-mon — ম্যাচের মন · tap log
- **Concept:** টিভির রান-রেটের "ওয়ার্ম" গ্রাফ, drawn on graph paper from your moods instead of runs.
- **First screen:** graph paper, five big mood buttons (আশা, উত্তেজনা, ভয়, হতাশা, উল্লাস) and a sport chip (ক্রিকেট or ফুটবল).
- **Core:** (1) tap a mood after each over, goal or moment, (2) tap "খেলা শেষ", (3) share.
- **Card:** the worm line, "রাফির ম্যাচ: ৩ বার আশা, ৪ বার হতাশা, শেষে উল্লাস", with a human line from the final mood. Footer: "তোমার মন কেমন দুলল?"
- **Loop / tally:** a friend's worm overlays yours. Tally: final mood id.
- **SEO:** `ম্যাচ দেখার অনুভূতি — খেলার সময় মনের গ্রাফ` · H1 "খেলা দেখতে দেখতে মনের গ্রাফ" · ম্যাচ দেখার অনুভূতি · খেলা দেখার স্ট্যাটাস · ক্রিকেট নিয়ে স্ট্যাটাস.
- **Link:** `#k=cricket&m=<≤60 digits>`.
- **Risks:** no team names or crests needed. Progress is kept in localStorage during the match. No betting copy.
- **Simplicity:** 5/5

### Wave 13

<a id="b-current-gelo"></a>
#### current-gelo — কারেন্ট গেল! · tap log + tally
- **Concept:** হারিকেন আর গলে যাওয়া মোমবাতি. The darker the day, the shorter the candle.
- **First screen:** a room lit by a hurricane lamp, two big buttons ("কারেন্ট গেল", "কারেন্ট এল") and today's total. An hours stepper is the fallback.
- **Core:** (1) tap গেল and এল through the day, or set the hours, (2) pick your division, (3) share.
- **Card:** a candle burned down to "আজ ৭ ঘণ্টা অন্ধকারে", with the line "খুলনা বিভাগে যারা জানিয়েছে: গড় ৫ ঘণ্টা". Human line, 6 hours or more: "হাতপাখার ব্যায়ামে আজ তুমি চ্যাম্পিয়ন।" Footer: "তোমার এলাকায় আজ কত ঘণ্টা?"
- **Loop / tally:** division id × hours bucket (8 × 7) per day, with a minimum sample.
- **SEO:** `লোডশেডিং হিসাব — আজ কত ঘণ্টা কারেন্ট নেই` · H1 "আজ কত ঘণ্টা কারেন্ট ছিল না?" · লোডশেডিং আজ · লোডশেডিং নিয়ে স্ট্যাটাস · কারেন্ট নেই.
- **Link:** `#h=7&dv=khulna&d=2027-05-02`.
- **Risks:** the count is labelled unofficial. No blame or party copy, and no outage schedules. Season: Apr–Sep 2027.
- **Simplicity:** 5/5

<a id="b-projonmo"></a>
#### projonmo — জেন-জি না আব্বু-আম্মু? · scored quiz
- **Concept:** অভিধানের পাতা. "প্রজন্মের অভিধান · ২০২৭ সংস্করণ", in two columns.
- **First screen:** question ১/১০: a word or phrase (Gen Z or elders') with three meanings.
- **Core:** (1) tap the meaning, 10 times, (2) see your % জেন-জি and % আব্বু-আম্মু, (3) share.
- **Card:** the page, "রাফি · ৭০% জেন-জি, ৩০% আব্বু-আম্মু". Footer: "তুমি কোন প্রজন্মের ভাষা বোঝো?"
- **Loop / tally:** a challenge link ("আব্বু-আম্মুকে পাঠাও"). Tally: per-word correct %.
- **SEO:** `জেন জি স্ল্যাং — জেন-জি না আব্বু-আম্মু?` · H1 "জেন-জির ভাষা বোঝো, না আব্বুর কথা?" · জেন জি স্ল্যাং · জেন জি শব্দের অর্থ · নতুন প্রজন্মের ভাষা.
- **Link:** `#set=s1&a=…&n=রাফি`, rescored on open.
- **Risks:** no crude, sexual or slur slang, and no political slogans. Two reviewers from each generation check the meanings.
- **Simplicity:** 5/5

<a id="b-mama-jaben"></a>
#### mama-jaben — মামা, যাবেন? · game
- **Concept:** রিকশার নম্বর প্লেট. The deal is painted on a tin plate (not a real licence format).
- **First screen:** a street corner and a rickshaw mama asking "কই যাইবেন?", with destination chips, an offer slider and a "বলো" button.
- **Core:** (1) pick a destination, (2) haggle for up to three rounds (slider plus quick lines), (3) close the deal and share.
- **Card:** the plate, "ফার্মগেট → ধানমন্ডি · ৬০ টাকায় রাজি · ৩ দফায়", with a human line by rounds. Footer: "তুমি কত টাকায় রাজি করাতে পারবে?"
- **Loop / tally:** a challenge on the same route. Tally: rounds bucket.
- **SEO:** `রিকশা ভাড়া দরদাম — মামা, যাবেন?` · H1 "মামা, যাবেন? দরদাম করে দেখো" · রিকশা ভাড়া · রিকশা নিয়ে ফানি স্ট্যাটাস · দরদাম.
- **Link:** `#r=farmgate-dhanmondi&f=60&k=3`.
- **Risks:** don't punch down: mama is witty and often wins. Fares are fictional, not a fare chart. Light Dhaka colloquial, reviewed, with no accent mockery. Visually distinct from রিকশার রং (the plate, not the back-board).
- **Simplicity:** 4/5

<a id="b-mess-jibon"></a>
#### mess-jibon — হল-মেস জীবন · checklist
- **Concept:** মেসের মিল কার্ড. A meal-token card; every moment you tick punches a hole.
- **First screen:** the card, "মিল কার্ড · ৪০-এ ৪". Four moments are pre-punched: ডিম-ডাল সপ্তাহ, বুয়া আসেনি, ম্যাগি রাত, বাজার ম্যানেজার. 40 chips sit below.
- **Core:** (1) tick moments, (2) name the hall or mess if you like (≤ 20), (3) share.
- **Card:** the punched card, "রাফির মেস সার্টিফিকেট · ৪০-এ ৩১", with tiers from নতুন বোর্ডার to মেসের মুরুব্বি. Footer: "তোমার মিল কার্ডে কয়টা ফুটো?"
- **Loop / tally:** a roommate's link overlays yours. Tally: moment ids.
- **SEO:** `মেস লাইফ — হল আর মেসের ৪০টা মুহূর্ত` · H1 "হল আর মেসের কয়টা দিন তোমার চেনা?" · মেস লাইফ · হলের জীবন · মেস নিয়ে স্ট্যাটাস.
- **Link:** `#m=<40-bit mask>&h=<≤20>`.
- **Risks:** no hall politics (গণরুম, গেস্টরুম). Women's hostels included. Link to `bhagabhagi` for meal-rate maths.
- **Simplicity:** 5/5

<a id="b-ekadosh"></a>
#### ekadosh — স্বপ্নের একাদশ · picker creator
- **Concept:** কোচের ক্লিপবোর্ড. A 4-3-3 drawn in marker on a clipboard.
- **First screen:** a full sample XI already on the board, from a curated pool of 50 football legends by position. Tap a slot to swap from a short list. Formation chips: ৪-৩-৩, ৪-৪-২, ৩-৫-২.
- **Core:** (1) swap any slots, (2) tap a captain, (3) share.
- **Card:** the clipboard, "রাফির স্বপ্নের একাদশ · অধিনায়ক: …", with a human line by era mix. Footer: "তোমার একাদশে কে কে?"
- **Loop / tally:** a friend's link shows "দুজনের মিল ৭/১১". Tally: player id per slot.
- **SEO:** `সেরা একাদশ ফুটবল — নিজের স্বপ্নের দল বানাও` · H1 "সর্বকালের সেরা একাদশ, তোমার চোখে" · সেরা একাদশ ফুটবল · বিশ্বকাপের সেরা একাদশ · সর্বকালের সেরা একাদশ.
- **Link:** `#f=433&p=<11 ids>&c=7`.
- **Risks:** names only: no photos, likeness or crests. A women's football pool as a second pack. The Bangladesh cricket XI is left out on purpose (SP04 dropped).
- **Simplicity:** 4/5

### Wave 14

<a id="b-gorur-ojon"></a>
#### gorur-ojon — গরুর ওজন কত? · calculator
- **Concept:** হাটের গরু. A marigold garland, a tailor's tape around the chest, and three bowls for the meat shares.
- **First screen:** the drawn cow with two prefilled fields in inches (বুকের বেড়, দৈর্ঘ্য) and the result: "আনুমানিক ৩.২ মণ (১২০ কেজি)".
- **Core:** (1) enter the two measurements, (2) see the estimated live weight, (3) optionally type the meat in kg for three shares and a packet count, then share.
- **Card:**
  - The cow with an optional name (≤ 12): "আমাদের লালু · প্রায় ৩.২ মণ".
  - A second card with three bowls: "৩৬ কেজি → ১২ + ১২ + ১২ · ৪৮টা প্যাকেট".
  - Footer: "তোমাদের গরুর নাম কী?"
- **Loop / tally:** none.
- **SEO:** `গরুর ওজন মাপার নিয়ম — ফিতা দিয়ে হিসাব` · H1 "ফিতা দিয়ে মাপো, গরুর ওজন কত?" · গরুর ওজন মাপার নিয়ম · গরুর ওজন বের করার সূত্র · কোরবানির মাংস বণ্টনের নিয়ম.
- **Link:** `#g=62&l=58&nm=লালু&m=36`.
- **Risks:**
  - The weight uses Schaeffer's formula (girth² × length ÷ 300, in pounds), from livestock-extension sources. Show "আনুমানিক, ১০–২০% কমবেশি হতে পারে". No meat-yield claim.
  - Label the shares "প্রচলিত রীতি, বাধ্যতামূলক নয়". The split can be changed. No fatwa text and no slaughter images.
  - Eid-ul-Adha is about 17 May 2027.
- **Simplicity:** 4/5

<a id="b-starter-pack"></a>
#### starter-pack — দেশি স্টার্টার প্যাক · picker creator
- **Concept:** মেলার খেলনার প্যাকেট. A blister-card toy pack: a drawn figure, with accessories in plastic bubbles.
- **First screen:** a filled "ভার্সিটি স্টুডেন্ট" pack of 6 items. Pack chips: ভার্সিটি স্টুডেন্ট, নতুন চাকরি, প্রবাসী, নতুন বাবা-মা, ঈদের ছুটিতে বাড়ি, বৃষ্টির দিন. Tap a bubble to swap from 30 items.
- **Core:** (1) pick a pack, (2) swap any items, (3) share; a 3×3 layout is a toggle.
- **Card:** the pack, "রাফির স্টার্টার প্যাক". Footer: "তোমার প্যাকেটে কী থাকত?"
- **Loop / tally:** item ids per pack.
- **SEO:** `স্টার্টার প্যাক বাংলা — দেশি খেলনার প্যাকেট` · H1 "তোমার স্টার্টার প্যাকে কী কী?" · starter pack bangla · স্টার্টার প্যাক · বাংলা মিম টেমপ্লেট.
- **Link:** `#p=varsity&i=3,8,12,…`.
- **Risks:** hand-drawn items, no AI art. No stereotypes about regions, religions, genders or bodies. Every pack is reviewed.
- **Simplicity:** 4/5

<a id="b-mishron"></a>
#### mishron — দেশি মিশ্রণ · game
- **Concept:** নানির জাদুর হাঁড়ি. Drop two things into a clay pot and something new rises in the steam.
- **First screen:** the pot and four starter items (পানি, চাল, মাটি, রোদ). Tap two to combine; no dragging needed.
- **Core:** (1) tap two items, (2) a new item appears, (3) keep discovering and share at any time.
- **Card:** the pot, "রাফি ৮৭টা জিনিস বানিয়েছে · সর্বশেষ: বৈশাখী মেলা". Footer: "তুমি কয়টা বানাতে পারবে?"
- **Loop / tally:** the link shares your count and latest find. Tally: item ids discovered: "মাত্র ৩% বানিয়েছে …".
- **SEO:** `ইনফিনিট ক্রাফট বাংলা — দেশি মিশ্রণের খেলা` · H1 "দুটো মেশাও, নতুন কিছু বানাও" · infinite craft bangla · মজার খেলা অনলাইন · বাংলা গেম.
- **Link:** `#d=<200-bit set, base36>`.
- **Risks:** 200 hand-written recipes (no AI generation), all reviewed. No party-symbol items (নৌকা, ধানের শীষ, দাঁড়িপাল্লা, লাঙ্গল), even as plain objects.
- **Simplicity:** 4/5

<a id="b-raat-jaga"></a>
#### raat-jaga — রাত জেগে খেলা · checklist
- **Concept:** মাঝরাতের সিআরটি টিভি. A box TV glows in a dark room; outside, the sky gets a star for every match you stayed up for.
- **First screen:** the dark room and "২০-এ ২", with the 2022 and 2026 finals pre-ticked. Below is a list of 20 famous World Cup nights (1990–2026) with their Bangladesh kickoff times.
- **Core:** (1) tick the nights, (2) see "১৩ রাত · ২৬ কাপ চা · ৬৫ ঘণ্টা ঘুম গেল", (3) share.
- **Card:** the starry sky, "রাফি · ২০-এ ১৩ রাত জেগেছে", with a human line by team mix. Footer: "তুমি কয় রাত জেগেছ?"
- **Loop / tally:** a friend's link overlays yours: "দুজনেই জেগেছিলাম: ২০২২ ফাইনাল". Tally: match ids.
- **SEO:** `বিশ্বকাপের রাত — কয়টা ম্যাচে রাত জেগেছ?` · H1 "বিশ্বকাপের কয় রাত জেগেছ?" · রাত জেগে খেলা দেখা · বিশ্বকাপ ফাইনাল · বিশ্বকাপ স্মৃতি.
- **Link:** `#m=<20-bit mask>&n=রাফি`.
- **Risks:** check each match's date and Bangladesh kickoff against FIFA match reports. Only matches after 11pm Bangladesh time count. No crests. Team-neutral: Argentina and Brazil nights both. The tea and sleep numbers are playful constants.
- **Simplicity:** 5/5

<a id="b-betoner-bhag"></a>
#### betoner-bhag — বেতনের ভাগ · slider
- **Concept:** স্টিলের টিফিন ক্যারিয়ার. Stacked tiers, each as tall as its share of the salary.
- **First screen:** a six-tier carrier prefilled with বাসা ভাড়া ৩৫%, বাজার ২৫%, যাতায়াত ১০%, মোবাইল ৫%, বাড়িতে পাঠানো ১৫%, জমা ১০%. Six sliders, with ± steppers, always total 100%.
- **Core:** (1) adjust the sliders, (2) see the carrier redraw, (3) share.
- **Card:** the carrier, "রাফির মাস", in percentages only. Human lines:
  - জমা ≥ 20%: "ভবিষ্যতের তুমি তোমাকে ধন্যবাদ দেবে।"
  - বাড়িতে পাঠানো ≥ 25%: "বেতনের একটা বাটি বাড়ির জন্য।"
  - Footer: "তোমার বেতনের সবচেয়ে বড় বাটি কোনটা?"
- **Loop / tally:** share bucket per category: "যারা ভাগ করেছে, গড়ে বাসা ভাড়া ৩৮%".
- **SEO:** `মাসিক খরচের হিসাব — বেতন কোথায় যায়?` · H1 "বেতনের টাকা কোথায় যায়?" · মাসিক খরচের তালিকা · মাসিক বাজেট · বেতনের হিসাব.
- **Link:** `#p=35,25,10,5,15,10`.
- **Risks:** percentages only, never amounts. No financial advice and no "ideal" ratios.
- **Simplicity:** 4/5

### Wave 15

<a id="b-bidyut-bill"></a>
#### bidyut-bill — বিদ্যুৎ বিল কত? · calculator
- **Concept:** পুরোনো বিদ্যুতের মিটার. A round window, a spinning disc and black-and-white number wheels.
- **First screen:** a typical home preset (২টা ফ্যান, ৪টা বাতি, ফ্রিজ, টিভি) with hours, and the result: "এ মাসে প্রায় ১৪২ ইউনিট · প্রায় <৳> টাকা". Appliance chips add এসি, আইপিএস, ইস্ত্রি and পানির পাম্প.
- **Core:** (1) tap appliances, (2) adjust the hours, (3) share.
- **Card:** the meter, "এ মাসে এসি খেল ৬২%", with the bill. Human line, AC-heavy: "এসি ঠান্ডা, বিল গরম।" Footer: "তোমার বাসায় কোন যন্ত্র সবচেয়ে বেশি খায়?"
- **Loop / tally:** appliance ids.
- **SEO:** `বিদ্যুৎ বিল হিসাব — কোন যন্ত্র কত খায়` · H1 "কোন যন্ত্রে কত বিল আসে?" · বিদ্যুৎ বিল হিসাব · বিদ্যুৎ বিল ইউনিট হিসাব · electricity bill calculator bd.
- **Link:** `#a=fan2.8,light4.6,fridge1.24,tv1.4` (appliance, count, hours).
- **Risks:**
  - Wattages are typical values, labelled and editable.
  - The bill uses the current BERC residential slab tariff, demand charge and VAT from one BERC order, kept in a single config file and shown with its source and "যাচাই করা: <date>".
  - Label it "আনুমানিক — তোমার মিটারের বিলই আসল".
- **Simplicity:** 4/5

<a id="b-mondop"></a>
#### mondop — মণ্ডপ ঘুরি · checklist + counter
- **Concept:** চালচিত্রের আর্চ. The painted arch behind the protima, shown as decorative panels only, with no deity drawn. Each pandal you visit lights a lamp on the arch.
- **First screen:** the arch and a counter, "এবার ০টা মণ্ডপ", with +/− and moment chips: অঞ্জলি, ধুনুচি নাচ, সিঁদুর খেলা, প্রসাদ, আরতি দেখা, ঢাকের তালে নাচ, পূজার মেলা.
- **Core:** (1) tap + for each pandal, (2) tick the moments, (3) share.
- **Card:** the arch with its lamps, "রাফি · এবার ১১টা মণ্ডপ · শুভ বিজয়া". Footer: "তুমি কয়টা মণ্ডপ ঘুরলে?"
- **Loop / tally:** a friend's count sits next to yours. Tally: moment ids and a pandal-count bucket.
- **SEO:** `পূজার মণ্ডপ — এবার কয়টা মণ্ডপ ঘুরলে?` · H1 "এবার কয়টা মণ্ডপ ঘুরলে?" · পূজার মণ্ডপ · দুর্গাপূজা ২০২৭ · শুভ বিজয়া স্ট্যাটাস.
- **Link:** `#c=11&r=<7-bit mask>&p=<pandal names ≤ 60, link only>`.
- **Risks:** inclusive, opt-in copy reviewed by Hindu community members. No deity images and no mantra text. Friends of every faith are welcome ("বন্ধুর সাথে মণ্ডপে"). Ship by Sep 2027 for Puja.
- **Simplicity:** 5/5

<a id="b-grade-dao"></a>
#### grade-dao — গ্রেড দাও · grade picker + tally
- **Concept:** স্কুলের রেজাল্ট শিট. You're the examiner with a red pen, grading things: ফুচকা, চটপটি, বর্ষা, লোকাল বাস…
- **First screen:** the mark sheet for the "স্ট্রিট ফুড" pack, 8 items with grade chips (A+ A B C F).
- **Core:** (1) tap a grade per item, (2) see the country's average grade beside yours, (3) share.
- **Card:** the mark sheet, "রাফির রেজাল্ট শিট · ফুচকা A+ (দেশ: A) · দেশের সাথে মিল ৫/৮". Footer: "তুমি ফুচকাকে কত দেবে?"
- **Loop / tally:** grade per item; a friend's sheet for comparison.
- **SEO:** `দেশি টিয়ার লিস্ট — খাবারকে গ্রেড দাও` · H1 "ফুচকাকে কত নম্বর দেবে?" · tier list bangla · দেশি খাবার র‍্যাঙ্কিং · কোন খাবার সেরা.
- **Link:** `#p=street&g=AP,A,B,C,A,AP,F,B`.
- **Risks:** never grade people, regions, religions or brands. Packs: স্ট্রিট ফুড, ঋতু, যানবাহন, ঈদের খাবার. Grades, not either/or, keep it distinct from `eta-na-ota`.
- **Simplicity:** 4/5

<a id="b-adda"></a>
#### adda — আড্ডায় তুমি কে? · personality quiz
- **Concept:** ক্যারম বোর্ড. Each adda role is a piece: কুইন = মধ্যমণি, স্ট্রাইকার = যে আড্ডা নাড়ায়, সাদা গুটি = শান্ত শ্রোতা, কালো গুটি = গোপন মজার মানুষ.
- **First screen:** the board, with question ১/৭ inline.
- **Core:** (1) tap 7 answers, (2) get your piece, (3) share; friends add theirs through the same link to fill the board.
- **Card:** the board, "রাফি = স্ট্রাইকার · আড্ডা জমায় যে". The group card holds up to 6 names. Footer: "তোমার আড্ডার কুইন কে?"
- **Loop / tally:** the group link. Tally: role id.
- **SEO:** `বন্ধুদের নিয়ে ক্যাপশন — আড্ডায় তুমি কে?` · H1 "আড্ডায় তুমি কোন গুটি?" · বন্ধুদের নিয়ে ক্যাপশন · আড্ডা নিয়ে স্ট্যাটাস · বন্ধুত্ব নিয়ে ক্যাপশন.
- **Link:** `#a=<7 digits>&n=রাফি`, plus the group `&g=<role:name,…>` (≤ 6).
- **Risks:** every role is flattering; no "কিপটে" or other mean labels.
- **Simplicity:** 4/5

## Follow-ups from agent reports

Human checks and shared changes that agents asked for, kept here so they survive context resets.

- `banan`: a native speaker should review the spellings.
- Festival dates need an update every year: shubhechha, koto-din-baki, deshe-fera, matir-bank, eider-din (via koto-din-baki/lib).
- sehri-iftar: enter the Islamic Foundation 1448 table when it is published (`TIMETABLE_1448 = null`), and double-check it.
- amar-bochhor: bump `EDITION` each December.
- cholo-kheli: someone should check the rules for দাঁড়িয়াবান্ধা and রুমাল চুরি.
- bagdhara: a third set (the sober Ekushe set from the brief) can be added later. Sets are append-only.
- studior-chhobi: shared change wanted, an optional vertical radius on `drawPhoto` for oval photos. `loadPhoto`'s 360px cap makes large photo frames soft.
- koto-cheno: names now go into short links (orchestrator's choice, for the personal preview).
- Not done yet: tests on a real Android phone and in the Facebook in-app browser.
- eidjatra: bump the tally event id (eid-ul-fitr-2027) right before each Eid's travel week. API wish: a ?prefix= filter on tally GET (it returns every id ever counted).
- attiyo: a native speaker should review all 84 named chains (lib/kin.ts). Weakly sourced: জামাইবাবু (bn.wiktionary only) and বেয়াইন. শালা/শালী are left out (the dictionary also marks them as slurs). The card spells it ফুপা, with the dictionary's ফুফা in a note.
- tokhon-ekhon: regenerate lib/cpi.ts from the World Bank FP.CPI.TOTL API once a year. The data was fetched 2026-10-11 and covers 1986–2025.
- dhadha: a human should review the riddle bank. About 18 of the 60 riddles have only one popular-list source (lib/riddles.ts). The tally is sent automatically on finish, with a privacy line under the chips.
- ami-bolechhilam: a native speaker should check the team names (lib/seal.ts). The tally API keeps only one vote list per browser, so the tool resends earlier matches from localStorage.
- mache-bhate: a native speaker should review the fish names. The page is 221KB of HTML (52KB gzipped), almost all inline fish SVG.
- projonmo: before launch, two reviewers from each generation should check every meaning. স্লে and ক্রিঞ্জ have no Bangla source.
- Tally design limit: the server keeps one vote list per browser per tool and replaces it on each vote. Tools with several pages or days (bagdhara, projonmo, dhadha, ami-bolechhilam, current-gelo) resend what they remember, so bagdhara loses its page-1 count when page 2 is compared. A real fix would key votes by (tool, voter, group).
- Tally API now takes an optional `?prefix=` (used by eidjatra and current-gelo). Still to do: prune old days or events from tally_counts.
- mama-jaben: a native speaker should review mama's Dhaka-colloquial lines for warmth and no caricature.
- ekadosh: check about 20 player-name spellings against Bangla media (list in lib/players.ts). A women's pack is not built yet.
- mishron: a native speaker should read all 200 item notes. Every Election Commission symbol is left out, which also drops everyday items such as আম, রিকশা, ঘুড়ি and হারিকেন. Revisit if that feels too strict.
- mondop: Hindu community members should review all the copy, the moment chips and the lines. Bump the PUJA constant in lib/mondop.ts for 2027.
- bidyut-bill: update lib/tariff.ts whenever BERC issues a new residential tariff. Current values are from the order of 3 June 2026 plus the 4 June amendment. The appliance wattages are typical values with no official source.
- adda: a native speaker should confirm that the role name "কালো গুটি" reads only as the carrom piece, with no skin-colour meaning.

## 6. Feature queue (from §4 "Features of an existing or queued tool")

One agent per target tool, so no two agents edit the same folder. Status: todo, building or done. The brief for each feature is its row in §4.

| tool | feature IDs | what to add | status |
|---|---|---|---|
| komon-porlo | SP12, CI02, CI03, CI05 | 4 new packs: খেলার দিন, রাস্তার পরীক্ষা (jam), বর্ষা, গরমের দিন (loadshedding, no blame) | done |
| boyos | ED08, TI02 | "অমুক তারিখে বয়স কত" (user-typed age limit) + a "জীবনের ঋতু" grid section | done |
| shubhechha | FM02, CR06 | birthday + anniversary occasions; a square profile-frame format (16 Dec, 21 Feb, match days) | done |
| argentina-na-brazil | SP08 | 8-question "আসল ফ্যান" test after picking a team; same rival-link loop | done |
| bhagabhagi | MO12 | a meal-rate mode (total bazar ÷ total meals, meals per member) | done |
| banan | ED10 | an Ekushe "খাঁটি বাংলা" set, same two-choice mechanic | done |
| cholo-kheli | FM03 | লুডু with a "কে জিতল" scoreboard | done |
| salami-chek | FA04 | an "এবার কে কে দিল" list; amounts optional, never tallied | done |
| iftar-plate | FA01 | only an "আজ রমজানের Nতম দিন" line; no fasting tracker | done |
| koto-din-baki | ED02 | SSC/HSC chips if the boards have announced 2027 dates (else skip) | skipped (duplicate of নিজের দিন; 2027 exam dates not announced) |
| eta-na-ota | ID18 | friend match "দুজনের মিল" | done |
- Done in phase 2: a tally vote `group` (bagdhara and projonmo keep one vote per page), and a PhotoPicker `width` option (studior-chhobi and the shubhechha frame load 900px photos).
- iftar-plate imports koto-din-baki/lib/countdown, which also pulls in shubhechha's greeting texts (about 28 KB of source). Moving the moon dates into a small shared module would trim it.
- komon-porlo: three jam squares lean on drivers ("উল্টো দিকে রিকশা", "মামা, যাবেন? না", "মিটারে যাবে না"). They can't be edited without breaking old links, so a softer replacement would need a new pack version.
- argentina-na-brazil: the আসল ফ্যান questions are pinned. Editing or reordering them would re-score every shared link.
- Launch readiness (from the marketing plan, research/marketing/README.md Phase 0):
  - add a privacy-safe daily hits counter (day, tool, src, kind) with no cookies, IPs or ids, plus a /s/<id> open counter;
  - make the rate limiter correct behind a CDN (it is in-process and keyed on X-Forwarded-For today);
  - choose hosting that serves static pages and images from a CDN (unseenbangladesh went down at about 1.3M visits in a day);
  - test on real Android phones and in the Facebook in-app browser.
- shubhechha: add greeting cards for Kali Puja, Christmas, Saraswati Puja, Buddha Purnima and Independence Day (26 Mar). The marketing calendar wants them, they would make the festival set inclusive, and koto-din-baki already has those dates.
- og images (public/social, public/previews) were captured before the copy review, so some card wording in them is slightly old. Regenerate them before launch if card text matters.
- baghbandi: someone who played it should check "আমাদের নিয়ম" (lib/game.ts). The goats win at the 120-move cap (instead of a draw) to balance the game; confirm that rule.

# একটুখানি: marketing plan (written 11 Oct 2026)

For the owner and one posting agent. Inputs: [brief.md](brief.md), [tools.md](tools.md), [channels-facebook.md](channels-facebook.md), [channels-other.md](channels-other.md), [post-writing-guide.md](post-writing-guide.md), [../trends-2026-10.md](../trends-2026-10.md), [../build-queue.md](../build-queue.md). Companions: [calendar.md](calendar.md) (dates), [runbook.md](runbook.md) (how the agent works), [log.md](log.md) (what was posted). Links are written `{SITE}/<slug>` until a domain is chosen.

**Labels.** Community confidence keeps the research labels (V seen, S snippet only, U unconfirmed; "(s)" sizes are stale). Every number marked *guess* is my judgement, not data. Budget is zero: no paid boosts, no bought followers, no sockpuppets.

## 0. Four findings that change the plan

1. **Nothing is public yet.** The repo README says there is no public deployment and no real-user pilot. So Phase 0 comes first, and the Durga Puja 2026 moment (16–21 Oct) is probably missed (see §4, Phase 0).
2. **The server does not count `/s/<id>` opens today.** The brief says it does; the schema (`lib/server/db.ts`) has only `shares` (id, tool, state, created_at), `tally_counts` (totals, no dates) and `suggestions`. The "friend opens" stage is blind until a counter is added (§6).
3. **Spike safety is a code and hosting question, not a marketing one.** The site is one Node process with SQLite on a VPS disk, and its rate limiter lives in process memory, keyed on `X-Forwarded-For`. Behind a CDN that header must reach Node, or every visitor shares one bucket and gets blocked after 20 tally writes a minute (§4, Phase 0).
4. **A CDN changes the privacy sentence.** Putting Cloudflare (or any CDN) in front means it sees visitor IPs. The `/privacy` copy must say so honestly. Never write "nothing is stored" or "no tracking at all": share links and tallies are stored on our server, and §6 adds aggregate visit counts. Safe wording: no account, no ads, photos never leave the phone, we do not know who you are.

## 1. Positioning

- **বাংলা:** একটুখানি: ফোনে এক মিনিটের ছোট ছোট বাংলা খেলা, হিসাব আর স্মৃতির কার্ড। ফ্রি, অ্যাকাউন্ট লাগে না।
- **English:** Ektukhani is 86 small, free, Bangla-only tools for Bangladeshi life. Each takes about a minute, needs no signup, and ends in a card you can send to a friend.

| Pillar | One line to say | Proof tools |
|---|---|---|
| **1. স্মৃতি আর আপন-ভাব** (nostalgia and belonging) | "তোমার ছোটবেলাটা আমাদেরও।" Small, exact, shared memories. | amar-chhotobela, tokhon-ekhon, cassette, mess-jibon, daknam, studior-chhobi |
| **2. উৎসব আর পরিবার** (festivals and family) | The days the whole family counts toward. | koto-din-baki, mondop, salami-chek, eider-din, deshe-fera, dawat, shubhechha |
| **3. রোজকার মজা আর কাজের হিসাব** (everyday fun, useful sums) | Ten-second arguments with friends, and sums you would otherwise Google. | eta-na-ota, komon-porlo, cha-mudra, jomi, bidyut-bill, gpa, namta |

**Claims we may make** (all true today): 86 tools; free; no account or ads; photos are made in the browser and never uploaded; it runs on a cheap Android phone; built by one person. **If asked how it was built:** say truthfully that AI coding agents did the building under the owner's direction (owner confirms wording). Never claim it was made by hand.

## 2. The funnel

| Stage | What drives it | What breaks it | Metric (see §6) |
|---|---|---|---|
| **1. Discover** | Community post (native card image, a true memory first) with admin consent; a friend's card in the feed; a page or creator sharing; press after a hook; search (evergreen tools). | Removal or spam flag; link cap on Pages (Facebook tested 2 link posts a month; links in comments were unaffected); wrong community; same text everywhere; bad timing (after a defeat, in exam week). | Approved communities; reactions and comments on our posts (read by hand); `view` by `src`. |
| **2. Land** | Tool page plus the og image and personal title in Messenger/WhatsApp/Facebook previews. | Slow on 3G or a 2 GB phone; Facebook in-app browser quirks; a spike taking the site down; a missing or cut-off og image; any signup ask (we never have one). | `view` per tool × `src`; the pre-launch preview check passing (§4, Phase 0). |
| **3. Try** | Instant start: the first screen is already the tool. | Intro screens, unclear first tap, wrong register (আপনি), English text. | Proxy only: tally votes per 100 views (tools with tallies), `/api/suggest` messages. We cannot see abandonment. |
| **4. Make and share** | A card worth posting, plus one obvious next step ("ছবি ডাউনলোড করো" / link). | **Save-image failing inside the Facebook/Messenger in-app browser** (the research's top technical fix); Bangla text clipped on the card; no share sheet. | `made` per 100 `view`. A floor: downloads of the PNG are not seen by the server. |
| **5. Friend opens** | `/s/<id>` with a personal preview title ("রাফির ছোটবেলার ১৪টা মিলেছে") and the "এবার তোমার পালা" banner. | Preview missing in Messenger, WhatsApp or imo; link opens a dead end; link older than 1 year (links expire after a year). | `open` ÷ `made`; then `made` by `src=share` ÷ `view` by `src=share` (friend turns into maker). |
| **6. Returns** | Seasonal moments (calendar.md), the owned Page and Instagram (riddle, poll, countdown), the homepage reordered for the season, search for utility tools. | One-off tools with no reason to come back; silence on our channels; stale seasonal dates. | Weekly `view` with `src=fb-page`, `ig`, `home`; Page and Instagram followers. We cannot count returning individuals, by design. |

## 3. Tool tiers

### 3.1 Hero (10 tools, introduced first to each community)

Chosen for broad appeal and a strong share loop: a fixed total or a one-word result, easy to compare with a friend. The list balances nostalgia with male-skewed fun (Facebook BD is about 63% male) and one diaspora tool. Pick the first ten that pass the Phase 0 phone test; swap in `cassette` or `mess-jibon` if one fails.

| # | Tool | Why it is a hero (one line) | First home |
|---|---|---|---|
| 1 | `amar-chhotobela` | Flagship. "৩৬টার মধ্যে ২৮টা" is the unseenbangladesh grammar (fixed total plus personal score); 77% of BD Facebook users are 18–34, so 90s and 2000s childhoods. | 90s and nostalgia groups and pages |
| 2 | `komon-porlo` | A one-line bingo that spreads by tagging; meme-native, no sensitivity. | Meme pages, friends |
| 3 | `eta-na-ota` | Twelve desi arguments plus a friend match; opt-in tallies feed our weekly "সবাই কী বলছে". | Meme pages, our own Page |
| 4 | `daknam` | Three taps, everyone has a ডাকনাম, the result is funny and personal. | General groups, family chats |
| 5 | `namer-design` | Type a name, get an image to post; the closest proven precedent is the Batname Generator (V). | Art, calligraphy and handwriting pages |
| 6 | `tokhon-ekhon` | A surprise number ("জন্মসালের ১০০ টাকা এখন কত?"); also the best service-explainer for press. | Old-photo and nostalgia pages |
| 7 | `mishtir-baksho` | X/40 sweets: everyone has eaten some, and the total is fixed. | Food groups (approval needed) |
| 8 | `himu` | X/30 books; has a real date (Humayun Ahmed's birthday, 13 Nov) and big book groups. | Book groups, Humayun pages |
| 9 | `argentina-na-brazil` | Huge, male-skewed fan base, friendly rivalry loop (never pick a side). | Argentina and Brazil fan pages, one by one |
| 10 | `deshe-fera` | Counting days home travels through whole families; the Gulf, Malaysia and the UK are the second audience. | Owner's own family chats first, then diaspora pages |

Always-on hub (not counted as a hero): `koto-din-baki` feeds the owned-channel countdown and the search query "durga puja koto din baki" seen in autocomplete.

### 3.2 Seasonal (tool ↔ moment; full dates in calendar.md)

| Tool | Moment |
|---|---|
| mondop, alpana, shubhechha | Durga Puja (Oct 2026, Oct 2027), Kali Puja 8 Nov 2026 |
| himu, char-priyo | Humayun Ahmed's birthday 13 Nov |
| gpa | HSC 2026 results (date not announced), SSC 2027 results (about Jun–Jul 2027) |
| alpana, chhotto-para, rannakhata | Nabanna 16 Nov |
| dawat, upohar | Wedding season Nov–Feb |
| deshe-fera | December trips home, then Eid |
| dom-atkano, shesh-bol, matcher-mon, ami-bolechhilam | Match days (BAN in South Africa from 15 Nov; check fixtures) |
| shubhechha, koto-din-baki, desh-cheno | Bijoy Dibos 16 Dec, Independence Day 26 Mar |
| amar-bochhor | Year-end, 20–31 Dec |
| matir-bank, dhoyahin | 1 Jan |
| pitha, tong, ghuri | Winter, Shakrain about 14 Jan |
| sehri-iftar, iftar-plate, koto-din-baki | Ramadan (about 9 Feb 2027) |
| banan, bagdhara, bhashar-chhobi, shobdo-khela | Ekushe 21 Feb 2027 (75th, solemn tone) |
| salami-chek, eider-din, eidjatra, shubhechha | Eid-ul-Fitr (about 10 Mar 2027) |
| alpana, riksharong, mache-bhate, shubhechha | Pohela Boishakh 14 Apr 2027 |
| current-gelo, bidyut-bill, komon-porlo (summer pack) | Load-shedding summer, Apr–Aug |
| komon-porlo (rain pack), jam | Monsoon, Jun–Sep (never during flood deaths) |
| gorur-ojon, eidjatra | Eid-ul-Adha (about 17 May 2027) |

### 3.3 Community-niche (tool ↔ where it belongs)

Confidence is from channels-facebook.md and channels-other.md. "Page" means admin-only posting, so we DM; "group" means the owner joins with their own account and reads the rules. Do not post in Traffic Alert (rule 5 bans promo).

| Community type | Named communities | Tools | Approach |
|---|---|---|---|
| 90s and nostalgia | 91 ALL OVER BANGLADESH (V, private group, 4.1K); Old Memories - পুরনো স্মৃতি (V, page, ~42.6K (s)); ভুলতে না পারা কিছু স্মৃতি (V, page, ~8.6K (s)); নব্বই দশক (V, page, ~648K (s)); Euphoria Whisper (V, one-person page, ~349K followers (s)); 90's Nostalgia (V, 2.7M group; language unchecked, ask first) | amar-chhotobela, tokhon-ekhon, cassette | Fan-style DM to page admins; start with the small ones. Large pages only after Phase 1 fixes. |
| Old photos and heritage | বাংলাদেশের দুষ্প্রাপ্য ছবি সমগ্র (V page; the group is reported at ~11 lakh (May 2024)); Bangladesh Old Photos (V, ~27K (s)); Old Dhaka (V, ~348K (s)); Bangladesh Dushprappo Chobi Somogro (S, group) | tokhon-ekhon, chhotto-para, amar-chhotobela | DM; the owner's real card as an image. |
| Books and Humayun | Humayun Ahmed (fans) (V page, ~183K (s)); Himu Paribahan (V page, ~36.5K (s)); হুমায়ূন আহমেদ page (V, ~937K (s); do not assume it is official); বুকলেট পাঠক ফোরাম (V group, 186.2K (f), shop-owned); 99 - BOOK SHOP (V group, 356.8K (f), shop-run); Movie Lovers Polapain (V group, 250.7K (f); no download links, avoid extra hyperlinks) | himu, char-priyo | Ask admins; post the card as an image and a question; link only where allowed. |
| Food | FoodBank (V group, ~2.5M (f); promotion and links need admin approval); Dhaka Foodies (V page); Foodieshe (V page); Foodie Meets Food (V page; says DM for PR); বাংলাদেশী পিঠা (V page, a seller: ask); Foodlover (V page, Sylhet) | mishtir-baksho, pitha, jibh, tong, mache-bhate | Photo-story route ("কোন মিষ্টিটা শেষ ঈদে খেয়েছিলে?"), no link unless approved. |
| Meme and general fun | U can't see me but u can see memes (V page, ~307K (s), invites DM for collaboration); Bangla Meme Story (V); Bangladeshi Memes - without any context (V); Bangladeshi Pictures Without Context (V); Rantages Goatposting (S, group; crude humour, may not fit) | komon-porlo, eta-na-ota, grade-dao, daknam, flames | DM an admin with the card; they decide credit. Say plainly it is a free project. |
| Football and cricket fans | ARGFGB (V page); AFSBD (V page); Leo Messi Fans of Bangladesh (V page); ব্রাজিল ফ্যান ক্লাব - বাংলাদেশ (V page, ~380.6K (s)); Brazil Fans Club - BD (V page); BCSA- Tigers (V page, ~125K (s)); Bangladesh Cricket Fans (V page); Bangladesh Cricket Memes (V page) | argentina-na-brazil, amar-jersey, ekadosh, dom-atkano, shesh-bol, golir-ain | One tool per page, separate DMs to the Argentina and Brazil pages with identical neutral framing. Never after a painful defeat. |
| Campus and mess | Campus Life (V page; accepts student submissions); BU Life (V); Life at AIUB (V); ব্যাচেলর লাইফ খারাপ না (V, ~40.9K (s)); মেস লাইফ (V) | mess-jibon, starter-pack, bhagabhagi, komon-porlo | Submit or DM. Avoid DU admission-test weeks (5–26 Dec) for noisy posts. |
| Dhaka commuter | Dhaka Metro Rail group (V, public, 4.1K (f)); Desperately Seeking Dhaka (V page ~97.3K (s); the group is S, ~54K stale); r/Dhaka and r/bangladesh (S/U, rules unread) | bhara, jam, bazar-note | Ask admins or mods first. Traffic Alert: never. |
| Art, alpana, rickshaw, handwriting | Alpona আলপনা (V page); Rickshaw Paint/Art of Bangladesh (V, partly a seller); রিক্সা আর্ট (V); Bd Rickshaw Art Gallery (V, sells art: ask); Cartoon People (V, ~109K (s)); Old Bangladeshi Movie Poster (V); Bangla Calligraphy (V); Hater Lekha (V, 206K+ (s)) | alpana, riksharong, cinema-poster, namer-design, chithi | DM with a finished output as an image. |
| Festival bodies | বাংলাদেশ পূজা উদযাপন পরিষদ (V page); বাংলাদেশ পূজা (V page); ঢাকেশ্বরী মন্দির পূজা কমিটি (V page); চট্টগ্রামের শারদীয় দুর্গাপূজা (V page); Bangla Islamic Post (V, ~15K (s)); Gabtoli Gorur Hat Dhaka (V fan page); BD Bus Update and Train update (V pages) | mondop, shubhechha, iftar-plate, gorur-ojon, eidjatra | Respectful DM, never post into their threads uninvited. Islamic Foundation, DMTCL, DESCO, Education Board, BAJUS are official bodies: credit, never pitch. |
| Language and education | M.C.Q সাধারণ জ্ঞান (V page, ~164K followers (s)); শুদ্ধ বাংলা (V, ~1.1K (s)); Murad Takla (S, group); Hsc Students (V, ~11.3K (s)); Md Bani Amin (V, creator, 600K+ (s)); Avro Keyboard (V, a courtesy note for bangla-typing) | banan, desh-cheno, shobdo-khela, gpa, bangla-typing | DM. `gpa` is a calculator, never a flex or ranking. No large Bangladeshi riddle group was found (gap): use personal-memory posts in nostalgia and family communities for `dhadha`. |
| Family and moms | Pregnancy Journey and Motherhood (S group, ~47K (s)); Moms Care BD (V page); moms' groups (U, find them with the search words in channels-facebook.md §7) | namta, boyos, salami-chek, upohar | Trust first. Never touch medical topics. |
| Diaspora | আমরা সৌদি আরব প্রবাসী বাংলাদেশী (V, ~672K followers (s)); কাতার এ আমরা বাংলাদেশী পোলাপাইন (V, ~194K (s)); Kuwait Page For Bangladeshi (V, ~182K (s)); মালয়েশিয়া প্রবাসী বাংলাদেশী (V, ~313.6K (s)); সিঙ্গাপুরে আমরা প্রবাসী বাংলাদেশী (V, ~169.5K (s)); আমরা ইতালী প্রবাসী (V, ~135K (s)); Bengali Community in UK (V, ~130.7K followers (s)); Little Bangladesh Toronto (V); named groups for Saudi, Qatar and Malaysia (S, no URL) | deshe-fera, probash, chithi, iftar-plate, salami-chek, upohar, dawat | Say "free, no login, no money, no passport" in the first line (job and visa scams are common). Ask page admins first. |
| Other channels | Instagram brand account (own); YouTube Shorts (own); LinkedIn founder post (own profile); Techtunes (V, active) and Somewhere in Blog (V, active; read their terms first); r/bangladesh and r/Dhaka (S/U: modmail first); Pinterest (alpana, name designs); TikTok (test only after Shorts exist) | various | See §4, Phases 2 to 5. **Do not use Telegram.** Skip Quora, X and Threads. |

### 3.4 Evergreen search (utility tools that earn traffic over months)

The pages already ship with FAQ and JSON-LD. Add the sitemap to Google Search Console once the domain is live. Do not promise rankings. First results take months, so these tools get a small, early, honest push and then wait.

| Tool | Query people type (only the first is observed) | Note |
|---|---|---|
| `bhara` | "মেট্রোরেলের ভাড়ার তালিকা ২০২৬" (observed autocomplete) | Fare table is static, with the source on the page. Update when Line 6 reaches Kamalapur (expected Apr 2027, year ambiguous). |
| `jomi` | "জমির মাপ", "বিঘা কাঠা শতাংশ" (expected, unverified) | Good press explainer. |
| `bidyut-bill` | "বিদ্যুৎ বিল হিসাব" (expected) | Summer peak. |
| `namta` | "নামতা" (expected) | Parents and teachers; moms' groups, never medical. |
| `gpa` | "জিপিএ ক্যালকুলেটর" (expected) | Results seasons. |
| `taka-kothay` | "টাকা কথায় লেখা" (expected) | Cheques and forms. |
| `boyos` | "বয়স হিসাব", "বাংলা জন্মতারিখ" (expected) | Daily searches all year. |
| `bhori`, `bazar-note`, `bhagabhagi`, `bangla-typing` | (expected) | Secondary. |

## 4. Phases

**Dates are targets; entry and exit criteria decide.** If a criterion is not met, extend the phase instead of skipping it.

| Phase | Target dates | Enters when | Exits when |
|---|---|---|---|
| 0 Readiness | 12–25 Oct 2026 | Now | All Phase 0 checks done (below) |
| 1 Soft launch | 26 Oct–4 Nov | Phase 0 done | Phase 1 exit (below) |
| 2 Community rollout | 5 Nov–31 Dec (waves A–D), Jan (wave E) | Phase 1 exit | Phase 2 exit (below) |
| 3 Press and creators | After the first organic spike; fallback window 10–17 Jan 2027 | Spike or fallback date | No exit: a pitch cycle per story |
| 4 Seasonal engine | Continuous from 5 Nov | First wave posted | Never; reviewed monthly |
| 5 Diaspora and global | Jan–Mar 2027 | 60+ days stable, one spike or real numbers | Show HN done; Product Hunt decided |

### Phase 0: readiness (owner O, developer D, agent A prepares drafts only)

| # | Check | Who | Done when |
|---|---|---|---|
| 1 | **Domain.** Short, easy to say aloud, typeable on a Bangla phone. Set `SITE_URL` at build so canonical, sitemap and og URLs are real. | O, D | `npm run check:pages` passes against the real origin |
| 2 | **Spike hosting.** The unseenbangladesh site took 2.2M page views and 1.3M visits in one day (self-reported), strained its first host, and moved to Cloudflare with a lighter rebuild. Put a CDN in front. Cache static files, fonts and og images for a long time; cache tool pages for a short time (60–300 s) and the time-based ones (`koto-din-baki`, `dhadha`, `sehri-iftar`) at 60 s or less; cache `/s/*` for minutes; never cache API writes. | D | Cache headers verified; a load test of a tool page and of 20 share creations a second shows no errors (not yet run) |
| 3 | **Rate limiter behind the CDN.** Confirm `X-Forwarded-For` reaches Node with the visitor IP first; otherwise everyone shares one bucket (20 tally writes a minute for the whole site). Run **one** Node process (SQLite, in-memory limits): scale it up, not out. | D | A test from two different IPs gets separate buckets |
| 4 | **Backups.** The links promise to reopen the same card, so losing `ektukhani.db` kills every shared link. Nightly off-box copy of the SQLite file. | D | A restore tested once |
| 5 | **Privacy copy.** Update `/privacy` and `/about` for the CDN seeing IPs and for the visit counter (§6). Add a public contact line (email) for press and removal requests. | O, D | Copy approved by the owner |
| 6 | **Real Android phone test**, 360×800, 2–3 GB RAM, plus one iPhone for diaspora. Throttle to slow 4G once. For each hero tool: open the link from a Facebook post inside the **Facebook app browser** and from Messenger, start within the first screen, make the card, **save the image** (if it fails, the fallback must work), copy the link, paste into Messenger and WhatsApp, open it as the friend, see the personal preview and the "এবার তোমার পালা" banner, press Back and land in Facebook. Also check that `?src=fb-90s` does not change the page, 404, or the canonical URL. | O (phone), D (fixes) | All ten hero tools pass; failures fixed or the tool is swapped out of the hero list |
| 7 | **Link previews.** Run each hero URL and one `/s/<id>` through Facebook's Sharing Debugger (the owner's account). Bangla title not cut off, card image shows. | O | Ten previews clean |
| 8 | **Brand Facebook Page and Instagram,** created by the owner. Name একটুখানি, a one-line Bangla bio, "বানিয়েছি {নাম}" in About, a link in bio. Seed 6–9 real posts before inviting anyone: three hero cards with the owner's own results, three riddles, one honest "কেন বানালাম" post. Invite only real friends. | O (A drafts) | Page and IG look alive to a stranger |
| 9 | **Admin outreach list.** Joining groups is the owner's job. The owner joins the 5 Phase 1 groups and pages, and reads each About and Rules tab. The agent keeps a table in its notes: community, type, size, rules summary, link policy, route, date checked, admin contact. | O joins, A tabulates | 5 communities fully noted |
| 10 | **Visit counter live** (§6), or the owner accepts counting by hand. Recommended before Phase 1. | D | Beacon works on a tool page and on `/s/<id>` |
| 11 | **Search Console** set up and the sitemap submitted. | O, D | Sitemap accepted |

**Puja 2026 decision.** If checks 1–7 are done by Sat 17 Oct, the owner may share `mondop` on their own timeline on Ashtami (Mon 19 Oct) as a bonus, and DM nobody. If not done, skip it: a half-ready launch on a festival is worse than none. Use Puja 2026 as the dry run for Kali Puja (8 Nov) and Puja 2027.

### Phase 1: soft launch (target 26 Oct–4 Nov)

Friends and family plus 3–5 friendly communities, and a fix loop. The point is feedback on real phones, not reach.

**Communities for Phase 1** (smallest and friendliest first; the owner may swap in groups they already belong to):
1. 91 ALL OVER BANGLADESH (V, private, 4.1K): `amar-chhotobela`, ask the admin.
2. Dhaka Metro Rail group (V, public, 4.1K (f)): `bhara`, ask the admin.
3. ভুলতে না পারা কিছু স্মৃতি (V page, ~8.6K (s)): DM the admin about `amar-chhotobela`.
4. Old Memories - পুরনো স্মৃতি (V page, ~42.6K (s)): DM the admin about `tokhon-ekhon`.
5. One or two groups the owner already belongs to (batch, office, university): `komon-porlo` or `daknam`.

**The first seven days (D1 = Mon 26 Oct; every post and message needs the owner's approval that day)**

| Day | Do | Counts |
|---|---|---|
| D1 Mon 26 Oct | Owner's own timeline: `amar-chhotobela` with their real result, image first, link in the first comment (`?src=fb-own`). Send `amar-chhotobela` and `deshe-fera` to 3–4 family and relative chats, one at a time, by hand (`?src=msgr`). Check that the counter records both. | 1 timeline post, 4 private shares |
| D2 Tue 27 Oct | Send 3 admin messages (communities 1–3 above), in Bangla, as আপনি. Brand Page: post the next seeded item. | 3 DMs |
| D3 Wed 28 Oct | **Five watched tryouts:** five people (one aged 45+, one on a cheap Android, one abroad on a video call) open three tools while the owner watches and notes where they stall. | 5 people |
| D4 Thu 29 Oct | Developer fixes the top 3 problems from D1–D3. DM community 4. Post to any community whose admin has said yes. | 0–1 group post, 1 DM |
| D5 Fri 30 Oct | Quiet day (Jumu'ah). Replies only. Read the counter and note results in the log. | 0 posts |
| D6 Sat 31 Oct (late morning) | Post to up to 2 approved communities, different tools, different text. Brand Page: first `dhadha` card ("উত্তর কমেন্টে লেখো"). | ≤2 group posts, 1 Page post |
| D7 Sun 1 Nov | Weekly review: counter by `src`, log, suggestions inbox; compare with the Phase 1 exit; plan wave A requests (send DMs 7+ days before each wave post). | review only |

If an admin has not replied after 7 days, send one polite follow-up and then stop for 60 days.

**Phase 1 exit (all of):** at least 3 communities posted with no removal; at least 2 admin "yes"; 5 watched tryouts done and the top 3 problems fixed; save-image works on 3 real phones; 50+ share links created (guess); no server error during the week; the owner is comfortable with the pace. Not met: repeat the week.

### Phase 2: community rollout (5 Nov–31 Dec, wave E in Jan)

One tool per community at a time, adapted text, admin consent first. **Realistic volume: 4–6 community posts and 2–3 admin DMs a week.** Hard caps are in runbook.md.

| Wave | Dates | Focus | Tools → communities |
|---|---|---|---|
| A | 5–18 Nov | Nostalgia, old photos, books | amar-chhotobela → Euphoria Whisper, নব্বই দশক (DMs); tokhon-ekhon → Bangladesh Old Photos, দুষ্প্রাপ্য ছবি পেজ; himu → Humayun Ahmed (fans), Himu Paribahan, বুকলেট, 99 - BOOK SHOP, aimed at **13 Nov** (a Friday: post 12 Nov evening or 13 Nov before 12:30) |
| B | 19 Nov–2 Dec | Food, meme, fun; HSC results day if announced | mishtir-baksho → FoodBank (photo-story, approval); komon-porlo, eta-na-ota, daknam → meme pages by DM; gpa on result day via our Page and HSC pages (calculator, never a flex) |
| C | 3–16 Dec | Sport, campus, art, diaspora trips; then Bijoy Dibos | argentina-na-brazil → ARGFGB, ব্রাজিল ফ্যান ক্লাব (separate DMs, neutral); dom-atkano before BAN match days only; namer-design → art and handwriting pages; mess-jibon, starter-pack → campus pages; deshe-fera → diaspora pages; shubhechha Bijoy frame, posted 12–15 Dec |
| D | 17–31 Dec | Winter, year-end, weddings | pitha, tong → food pages; amar-bochhor 26–31 Dec; dawat, upohar (quietly, never at card printers) |
| E | Jan 2027 | Shakrain, 1 Jan, pre-Ramadan | ghuri → Shakrain pages (neutral); matir-bank, dhoyahin on 1 Jan; diaspora outreach starts for Ramadan |

**Phase 2 exit:** every hero tool introduced to at least one community (or consciously dropped, with the reason in the log); 25+ community posts and 10+ admin yeses; the owned channels have run 4 weeks; one page-long lessons note (what worked, which communities removed us, which tools underperformed).

### Phase 3: press and creators (after the first organic spike)

**Spike means any of:** 5,000+ page views in a day; 1,000+ share links in a week; a page of 100K+ shares us unprompted; a journalist or creator writes to us first. In the unseenbangladesh case explainers ran 3–5 days after the spike and satire after about 3 more; pitch within a day or two of the spike. **Fallback:** if no spike by 10 Jan 2027, pitch one service explainer (`bhara`, `jomi` or `boyos`) with the real counter numbers and the Ekushe 75th as the peg for a maker note (sent 7+ days before 21 Feb, with no promise of coverage and nothing on the day itself).

| Story | Desk | Public route (all from channels-other.md §6) | Tool |
|---|---|---|---|
| Service explainer | Online desks: Dhaka Times, Jagonews24, Ittefaq, bdnews24 | bdnews24 press.release@ address (decoded from obfuscated code: confirm on the live page); others have no listed pitch address, so use the contact form or the newsdesk email shown | bhara, jomi, boyos, gpa |
| Maker profile with numbers | The Daily Star Tech & Startup; TBS Splash | Daily Star: no tech or lifestyle address listed (use the editorial or news contact); TBS: general contact only | The whole site |
| Nostalgia feature | Prothom Alo Lifestyle (profiled Euphoria Whisper in June 2025) | Contact page lists desks but hides addresses | amar-chhotobela |

**Rules:** one outlet per story at a time; at most one pitch a week; one nudge after 3 days, then stop; never promise exclusivity we cannot keep; do not compare ourselves to unseenbangladesh; do not ask for satire.

**Pitch 1: news-desk email (Bangla, আপনি).** Delete the bracketed counter sentence unless the counter shows a real number.

> **বিষয়:** ফ্রি বাংলা ওয়েবসাইট "একটুখানি": ছোটবেলার ৩৬টা স্মৃতির কয়টা মেলে?
>
> সম্মানিত ফিচার ডেস্ক, শুভেচ্ছা নেবেন।
> আমি {নাম}। বাংলায় ছোট ছোট খেলা আর হিসাবের একটা ফ্রি ওয়েবসাইট বানিয়েছি, নাম একটুখানি। অ্যাকাউন্ট, বিজ্ঞাপন বা টাকা কিছু লাগে না; ফোনের ব্রাউজারেই চলে।
> এর একটা টুল "আমার ছোটবেলা": ৩৬টা চেনা স্মৃতির কয়টা নিজের সাথে মেলে, টিক দিয়ে দেখা যায়, তারপর বন্ধুকে পাঠানোর একটা কার্ড পাওয়া যায়। [{তারিখ} পর্যন্ত {সংখ্যা}টা কার্ডের লিংক বানানো হয়েছে।]
> লিংক: {SITE}/amar-chhotobela। সাথে একটা কার্ডের স্ক্রিনশট দিলাম।
> আপনাদের পাঠকের কাছে লেখার মতো মনে হলে ফোনে বা ইমেইলে যেকোনো প্রশ্নের উত্তর দেব। এটা আমার নিজের ছোট প্রজেক্ট, কোনো প্রতিষ্ঠান বা বিজ্ঞাপনদাতার পেছনে নেই।
> ধন্যবাদ।
> {নাম}, {ফোন}, {ইমেইল}

*Swap-in for an online service desk:* "মেট্রোরেলের যেকোনো দুই স্টেশনের ভাড়া আর পুরো তালিকা এক পাতায় দেখার একটা ফ্রি টুল বানিয়েছি। ভাড়া সরকারি সারণি থেকে নেওয়া, উৎস পাতাতেই দেওয়া আছে; এটা সরাসরি হালনাগাদ হয় না।" (Say that last part: the research notes the fare table is static.)

**Pitch 2: creator or page DM (Bangla, আপনি).** Keep the bracketed line only if it is true.

> আসসালামু আলাইকুম / শুভেচ্ছা নেবেন। [আপনার পেজের পুরোনো টিভির বিজ্ঞাপনের পোস্টগুলো আমার সত্যিই প্রিয়।]
> আমি ছোটবেলার স্মৃতি নিয়ে একটা ফ্রি বাংলা ওয়েবসাইট বানিয়েছি। কোনো অ্যাকাউন্ট, বিজ্ঞাপন বা টাকা লাগে না। ৩৬টা চেনা স্মৃতির কয়টা মেলে, টিক দিয়ে দেখা যায়।
> আপনার ফলোয়ারদের ভালো লাগবে মনে হলে একটা কার্ডের ছবি পাঠাতে পারি। কীভাবে দেবেন, বা দেবেন কি না, পুরোটাই আপনার ইচ্ছা। আমি কোনো পারিশ্রমিক চাইছি না, দিচ্ছিও না।
> ধন্যবাদ।

### Phase 4: the seasonal engine

Follow calendar.md. Every moment runs on one rhythm:

| When | Do |
|---|---|
| T−14 | Send admin DMs for pages and groups that need consent. Check the tool's date and wording. |
| T−7 | Copy approved (from `posts/*.md`), card tested on the real phone, `?src=` ready. |
| T−3 to T−2 | First post (national-day profile moments run about two days around the day, so publish early). |
| T | Day-of post only if the moment is joyful; solemn days get a quiet single post or none. |
| T+1 | Thank people; post one real result or a tally recap if there are 100+ votes. |
| Monthly | Ask the developer to reorder the homepage (build queue: উৎসব আর বিশ্বাস second from Ramadan to Eid; পরিবার আর প্রবাস up Nov–Feb) and to refresh dates when the Cabinet publishes the 2027 holiday list (Oct–Nov 2026). |

### Phase 5: diaspora and global maker launch (Jan–Mar 2027)

**Diaspora (Jan–Feb).** DM the diaspora pages in §3.3 before Ramadan, and post in the Dhaka 8–10 pm window, which reaches the Gulf (6–7 pm), the UK and Italy (afternoon) and US East (morning) while they are awake. Lead tools: `deshe-fera`, `probash`, `chithi`, `iftar-plate`, `salami-chek`. First line always says it is free and asks for no login, money or passport. Associations and societies (Bengali Association Singapore, Singapore Bangladesh Society, ABCx, VBCF) are formal: ask, never post uninvited.

**Show HN.** Entry: 60+ days stable, real counter numbers, the owner free for several hours. Window: Tue–Thu 19–21 Jan 2027, around 7 pm Dhaka (8 am US Eastern). Angle: engineering and craft, not "86 tools": "Bengali text on share cards, a card that reopens from a link, built for a 360×800 Android phone in the Facebook browser, no signup". Say it is Bangla-only. The guidelines forbid asking friends to upvote and warn against quickly-generated one-offs, so be truthful about how it was built and lead with the design decisions. Optional r/webdev Showoff Saturday the next weekend.

**Product Hunt (optional, decide after Show HN).** Low value for users; use for credibility. Personal accounts only, no asking for upvotes, no rule found on non-English products. 12:01 am Pacific is 14:01 Dhaka before 14 Mar 2027 and 13:01 Dhaka after. If done, pick a Tue–Thu in the second half of March after Eid.

**LinkedIn.** One founder post from the owner's own profile (no pods): why they built it, three screenshots, one link. Useful for press sourcing and diaspora professionals.

## 5. Owned-channel engine (our own Page and Instagram)

Everything on our channels must be real: only the owner's actual results, only tally numbers that exist. Time slot hypothesis (test, don't trust): 8:30–10:30 pm Dhaka; weekends late morning, never 12:30–2:30 pm on Friday; in Ramadan after tarawih, not around iftar.

**Weekly rhythm (about 3 hours of the owner's approval time):**

| Day | Facebook Page | Instagram |
|---|---|---|
| Sun | **আজকের ধাঁধা:** the `dhadha` card (the answer is not on it; ask for answers in comments). | Story: the riddle |
| Mon | **এটা না ওটা:** one of the 12 `eta-na-ota` pairs as an image poll. | Story poll sticker |
| Tue | **Tool spotlight:** one hero tool with the owner's own result ("আমার মিলেছে ২৮টা। তোমার কয়টা?"). | Carousel: result card, how it works, "এবার তোমার পালা" |
| Wed | Optional second riddle | Optional reel (a 15–20 s screen recording of one tool) every other week |
| Thu | **কত দিন বাকি:** a countdown card when a moment is within 30 days (daily in the last 7), otherwise a plain question ("ছোটবেলার কোন জিনিসটা সবচেয়ে মিস করো?") | Story |
| Sat late morning | **সবাই কী বলছে:** a recap from opt-in tallies, only when a tool has 100+ votes, always with the count ("১২৪ জনের মধ্যে ৬৮%"). The agent reads the public `GET /api/tally/<tool>`; there is no date breakdown, so write "এখন পর্যন্ত". Next day, `dhadha`: "আজ কত ভাগ প্রথমবারেই পেরেছে". | Carousel of the same |

Targets: Page about 5 posts a week, Instagram 3 feed posts and 3–4 stories. Scale riddles to daily only if comments justify it, since each post needs the owner's approval. Never write "tag 3 friends", "share if…" or "comment to get…". It breaks our own no-pressure rule and, as general knowledge I did not verify here, Facebook demotes engagement bait. Ask a real question instead.

**Quiet days:** no riddle, poll or fun post on 14 Dec, 16 Dec (one respectful post, early), 21 Feb or on Ashura (about 15–16 Jun 2027). After any national tragedy, pause all fun posts for 48 hours.

## 6. Measurement without tracking people

**What the server knows today:** `shares` (tool, state, created_at): share links created per tool per day. An identical card reuses its link, so repeats are undercounted, and rows older than one year are deleted. `tally_counts`: opt-in totals per item, with no dates (snapshot weekly to see change). `suggestions`: messages with dates. **It does not count `/s/<id>` opens or page views.** Also visible by hand: reactions and comments on our own posts (Facebook and Instagram Insights), and Google Search Console for search.

**Recommended addition (5 lines for the developer; the orchestrator decides):**

1. A table `hits(day, tool, src, kind, n)`, primary key on the first four columns; `day` is the Dhaka date; nothing else is stored.
2. One beacon per page load from the client (`POST /api/hit {tool, src, kind}`), where `kind` is `view` (tool page), `open` (`/s/<id>`) or `made` (a card or link was created). Client-side, so CDN-cached pages are counted and link-preview crawlers (which do not run JavaScript) are not.
3. `src` comes from `?src=` (default `direct`); it must match `^[a-z0-9-]{1,16}$` or becomes `other`; at most 50 distinct values per tool per day, the rest `other`; the tool must exist in the catalog. Reuse the same-origin check and in-memory rate limit, but never write the IP, user agent or any id.
4. No cookie, no stored id, no fingerprint. Counts are page loads, not people (reloads and bots inflate them). Say exactly that in `/privacy`: "আমরা শুধু গুনি কোন পাতা কতবার খোলা হলো; কে খুলল, তা জানি না।"
5. A `npm run stats [days]` script printing day × tool × `src`, `made` ÷ `view`, `open` ÷ `made`, plus shares per tool and tally totals; the agent runs it in the weekly review.

**KPIs by funnel stage.** All targets are **guesses**; a lucky page share can beat the high end many times over (unseenbangladesh's 1.3M visits in one day is an outlier, not a plan).

| Stage | KPI | 30 days (26 Oct–25 Nov) | 90 days (to about 25 Jan 2027) |
|---|---|---|---|
| Discover | Approved community and page posts; admin yeses; removals | 20+ posts, 5+ yeses, 0 removals | 60+ posts, 20+ communities posted, at most 2 removals and no bans |
| Land | `view`, all sources | 3,000 to 20,000 | 25,000 to 150,000; one tool above 10,000 |
| Try | Suggestions received and fixed | 10 received, 5 fixed | 30 received, 15 fixed |
| Make and share | `made` ÷ `view` | at least 4% (stop and fix below 1%) | at least 6% |
| Friend opens | `open` ÷ `made` (includes the maker opening their own link, so noisy) | at least 0.8 (fix below 0.3) | at least 1.0 |
| Returns | Page followers; Instagram followers (mostly friends at first); weekly `view` from `fb-page`, `ig` | Page 100–300; Instagram 50–200 | Page 500–2,000; Instagram 300–1,000; weekly own-channel views rising |
| Press | Pitches sent; mentions | 0 unless a spike | 2–3 pitches; 0–2 mentions |
| Search | Search Console impressions for evergreen tools | indexed, any impressions | 1,000+ a week; 2 tools on page one or two for a long-tail query |

**Stop rule:** if after 30 days there are fewer than 100 share links in total or `open` ÷ `made` is under 0.3, pause outreach and fix the loop (save-image, preview, first screen) before posting more.

## 7. Rules and risks

**Spam limits (Facebook publishes no numbers; these are conservative guesses).** At most 2 group posts a day and 3 new admin DMs a day; never the same text twice in a day, and in practice never the same text in two communities; one tool per community at a time; at least 14 days between posts in the same community and 30 days before the same tool returns; wait for admin approval wherever the rules require it; no reposting a rejected post; posts from the owner's own account, never a second one. Details and per-type caps are in runbook.md.

**Always disclose.** Say we made it ("আমি বানিয়েছি") and that it is free. No fake accounts or users, no fake reviews, no bought likes, no pods.

**Negative comments** (full table in runbook.md): errors get thanks, a same-day check and a fix; taste gets one short thanks; "it is a scam or collects data" gets a calm factual reply (free, no account, photos never leave the phone) with the `/privacy` link; abuse, politics, and religious or regional jabs get no reply and are hidden on our own posts; copyright or trademark complaints stop everything and go to the owner.

**Group removal.** Do not repost, appeal publicly or rejoin with another account. With the owner's approval, send one polite thank-you. Mark that community "do not post" for 90 days and re-read the rules of similar groups. Two bans in 30 days stops all group posting until the owner and I review the log.

**No politics.** No party, hartal, election or religious-debate groups, ever; no engagement with political bait; no posts that ride a tragedy or controversy; check the day's headlines before posting and pause 48 hours after a national tragedy. Matrimony and ghotok groups: never (the `biye-kobe` tool is "just fun").

**Faith respect.** Festival posts are inclusive and celebratory, never "which religion", never mocking. Puja bodies and Islamic pages: ask first, never post into their threads uninvited. Credit the Islamic Foundation for Ramadan times and never present anything as a religious ruling. Solemn days (14 Dec, 21 Feb) get no fun framing.

**Press: do not overclaim.** Only numbers the counter or server actually shows, with the date and the caveat that they are page loads or links created. No "viral", no "লাখো মানুষ", no fake quotes or users, no exclusivity promised, no comparison with another product. Correct errors fast. Facts sheet: 86 tools; free; no account or ads; photos never leave the phone; share links, anonymous tallies and daily visit totals are stored; built with AI coding agents under the owner's direction (owner confirms wording).

| Risk | Plan |
|---|---|
| Site goes down in a spike | Phase 0 checks 2–4. During a spike stop posting and tell the owner; do not feed it. |
| Wrong data in a tool (fare, gold weight, bill rate, a date) | Pause promoting that tool, keep old posts, owner and developer fix and note the change. |
| Facebook restricts the owner's account | Stop all activity on it at once, never open another account or browser to continue, tell the owner, resume at half the cadence after the restriction ends. |
| Links throttled or flagged | Image-first posts with the link in the first comment, no link on professional-mode profiles; if flagged, image-only and the owner requests a review. |
| Diaspora scam suspicion | First line: free, no login, no money, no passport. |
| Looks like a copy of a viral product | Own topics (childhood, food, family, festivals); never district maps or travel checklists. |
| Official-looking cards (`salami-chek`, `rokto`) misread | Keep them toy-like; never imply an official document. |
| Competitor or seller communities (card printers, shops) | Do not post in them (Dawat Card, Rickshaw Paint sellers: DM only, ask first). |
| The plan is too heavy for one owner | Drop the daily riddle first, then Instagram, then Page days; keep Phase 2 waves and the weekly review. |

**Do-not-pitch list:** Traffic Alert; DMTCL, DESCO and DPDC, Education Board, Islamic Foundation, BAJUS (official bodies: credit only); coaching centres; Dawat Card; political, hartal, election and religious-debate groups; matrimony groups; Telegram.

## 8. What I could not verify

- The Facebook rules of every group (the owner must read About and Rules by hand); every subreddit's rules; whether Bengali Quora is alive.
- Whether any shared card previews correctly in Messenger, WhatsApp and imo. This plan depends on it, and nobody has tested it on a real phone yet.
- The best posting hours for Bangladesh (no reliable data). §5's slots are hypotheses.
- Any usage numbers for similar Bangla tools; all targets in §6 are guesses.
- HSC 2026 result date (sources conflict, see calendar.md), the 2027 government holiday list, Ekushey Book Fair 2027 dates, and any Argentina or Brazil fixture.
- Press addresses beyond what the outlets publish; bdnews24's was decoded from obfuscated code.
- That the site survives a spike: no load test has been run.

## 9. Open decisions for the owner

Domain name; the Page and Instagram names; whether to post from the personal profile (recommended: links work normally) or only through the Page; who answers press mail and the contact email; whether `/privacy` mentions the CDN by name; whether to accept or refuse paid boosts later (the plan assumes zero spend).

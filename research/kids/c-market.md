# ছোটদের সেকশন: বাজার, সার্চ, গোপনীয়তা আর বাস্তব সীমা

Research note C, the market angle, for the একটুখানি children's section. Written 15 Oct 2026.
Companion notes from teammates cover child-development science and Bangladeshi culture and curriculum. This note does not repeat them.

**How to read the evidence.** Search demand below comes from Google's public autocomplete endpoint (`suggestqueries.google.com`, `hl=bn&gl=bd`, plus `ds=yt` for YouTube), queried on 15 Oct 2026. Autocomplete shows what people type often enough to be suggested. It shows rough order, not volume. I could not reach Google Trends or a paid keyword tool. Where a claim comes from a single secondary source, I say so.

---

## 0. The short version

- **The gap is real and specific.** Good kids' apps (Khan Academy Kids, Duolingo ABC, PBS Kids) are free, ad-free and calm, but none speak Bangladeshi Bangla. Bangla kids' content is mostly YouTube video (passive, ad-supported, often made by multi-language Indian studios in a Kolkata register) or Play Store apps with ad identifiers. Nobody offers **interactive, ad-free, no-install, Bangladeshi-Bangla play that works in a browser on a cheap phone**.
- **Use "ছোটদের", not "শিশুদের", as the head term.** "শিশুদের …" and "বাচ্চাদের …" autocomplete is dominated by medicine (syrups, scabies, vaccines). "ছোটদের …" is all content: গল্প, ছড়া, কবিতা, ধাঁধা, সাধারণ জ্ঞান, গেম.
- **Parents search for school-shaped things**: কার চিহ্ন দিয়ে শব্দ গঠন, যুক্তবর্ণ ভেঙে শব্দ গঠন, অ আ ক খ লেখার নিয়ম, ঘড়ি দেখা শেখা, ফলের নাম বাংলা ও ইংরেজি, সৌরজগৎ কাকে বলে class 4, and "… pdf". **Printable sheets are a second growth channel**, and they get children off the screen.
- **World topics have clear demand**: ডাইনোসর গেম, ডাইনোসর খেলা, গ্রহের নাম, সৌরজগৎ প্রজেক্ট, সাগরের সবচেয়ে বড় প্রাণী, আকাশ কেন নীল, শরীরের অঙ্গের নাম.
- **Privacy rule of thumb: the kids' section collects nothing.** No child's name in any link or on the server. No share button in front of the child. No tally. No outbound links in front of the child. Progress stays in the phone's localStorage.
- **Bangla TTS is a bonus, not a foundation.** Google's Android TTS engine ships Bangla (Bangladesh) and Bangla (India) voices, but Chrome on Android does not reliably list voices, and a missing voice falls back to English. Every game must work fully without sound or speech.

---

## 1. What the best kids' apps do, and where the gap is

### 1.1 The trusted ones

| App | Model | Why parents trust it | What we can borrow |
| --- | --- | --- | --- |
| **Khan Academy Kids** | Nonprofit. Free, no ads, no in-app purchases, no subscription. Ages 2–8. | Nonprofit with "no shareholders demanding growth"; reviewers cite COPPA compliance and no sale of data. Stanford involvement, Head Start alignment. Weakness: thin parent reporting. | One calm guide character, short activities, a parent area separate from the child area. |
| **Duolingo ABC** | Free, no ads, no in-app purchases. Works offline. Preschool to grade 2. | The store listing makes those three promises up front. Tracing, drag-and-drop, and stories that highlight each word as it is read. | Tracing letters. Word highlight while reading. Works without a connection. |
| **PBS Kids Games** | Public broadcaster. Free, no ads, no purchases, no social features, offline downloads. | Reviewers single out "no banners, pop-ups, or rewarded videos". Curriculum team vets games. Cause-and-effect physics without "flashing lights or screeching sound effects". | Cause-and-effect science toys. No noise for the sake of noise. |
| **Toca Boca** | Paid, now free-to-play with purchases. | The studio's rule: "no winning, no losing, no stress, no high scores, no rules". Props, not scripts. | Open-ended toys for 3–5 year olds: a village, a kitchen, a garden, with no score. |
| **Endless Alphabet** (Originator) | Paid or freemium depending on store. | "No high scores, failures, limits or stress." Teaches rich words (gargantuan, quarrel), not only letters. | Animated letters that wriggle into a word, then a tiny scene shows its meaning. |
| **Lingokids** | Subscription, about $17/month in some stores, free tier ~3 activities a day. | Content praised, but Common Sense parent reviews and complaint sites cite "unclear trial period and unexpected charges", early cutoffs and upsell prompts. | The cautionary tale: a paywall or upsell in front of a child destroys trust. |
| **Montessori-style apps** | Mostly paid or subscription. | Concrete materials first (sandpaper letters, bead chains, number rods), self-correcting tasks, child-paced. | Self-correcting tasks: the wrong piece simply doesn't fit, no red X. |

What they share, and what parents notice:
1. **No ads, no purchases, nothing to buy in the child's view.** A 2018–19 study of the 96 most downloaded Google Play apps for under-5s found **95% had at least one form of advertising**, including pop-up videos and characters pushing purchases (Meyer, Radesky et al., *J Dev Behav Pediatr*). Parents who know this look for the "no ads" promise first.
2. **No failure screens for little ones.** A wrong answer wobbles and lets the child try again.
3. **A parent zone** behind a gate, with notes on what the child is learning.
4. **Short sessions** and an obvious place to stop.
5. **A clear owner** (nonprofit, broadcaster) whose income doesn't depend on the child's attention.

### 1.2 Bangla kids' apps and channels

- **Play Store alphabet apps.** "Kids Learn Bangla Alphabet" (TopOfStack) shows about 3.8 million downloads and a 4.3 rating, and requests the advertising ID, phone state and storage permissions (chrome-stats listing). This is the norm for the category: free with ads, permission-heavy.
- **Pandoo** (mPower Social) is the better example. Its terms describe a parental gate in front of "all external links to websites, social media, or other applications". Small reach.
- **Hatekhori** (2019) covered alphabet, writing, spelling, pronunciation and sentences. App-only.
- **10 Minute School / Shikho** focus on Class 1–12 curriculum video for older learners. I found no preschool product.
- **YouTube** is where Bangla kids actually are. The biggest Bangla rhyme channels by third-party counts are **Infobells Bangla (~23M subscribers)** and **Jugnu Kids (~5M)**, then Kids TV Bangla (~3.5M), Tinku TV Bangla, Khoka Puchki. Infobells and similar studios publish the same animation across many Indian languages, so the Bangla track is a translation and usually in the West Bengal register. **Sisimpur** (the Bangladeshi Sesame Street, since 2005) is the high-quality local exception: Halum, Ikri Mikri, Shiku, Tuktuki, and a 40-rhyme series. It is video, not play.
- The Daily Star has reported for years that local children's programming is thin, that kids drift to foreign platforms, and that some children "speak Hindi better than Bengali". A 2025 column worries about AI-made videos with no lessons. Dhaka Tribune reports a parallel worry about children being turned into content for views.

### 1.3 Common failures in Bangla kids' content

1. **Ads in front of children**, sometimes unsuitable, often hard to close.
2. **Translated, not written.** Indian studio rhymes dubbed into Bangla: জল, মাসি, স্নান. Objects from someone else's childhood.
3. **Passive.** Video autoplay. The child watches; nothing responds to the child.
4. **Install friction.** Storage on a 32 GB phone is precious. Parents uninstall apps; a web link costs nothing.
5. **Poor Bangla rendering.** Broken conjuncts, kar signs detached from their consonant, tiny type.
6. **Shouting design.** Flashing rewards, loud jingles, streak guilt.
7. **Science and world topics barely exist in natural Bangla** as play. Search shows question-shaped demand (সৌরজগৎ কাকে বলে, আকাশ কেন নীল, ডাইনোসর কি এখনো আছে). Text answer sites and YouTube serve it.

### 1.4 The gap for একটুখানি

A **free, ad-free, no-signup, Bangladeshi-Bangla web section of short interactive games**, each with a parent note and a printable sheet, that opens instantly from a Facebook link on a cheap Android phone and keeps working without data. The site already has three of these properties: no ads or analytics (see `/privacy`), self-hosted Bangla fonts, and "once the page opens, play needs no internet" (o-te-ojogor FAQ). Nobody in Bangla occupies this position. The trusted global apps prove parents will reward it.

---

## 2. What Bangladeshi parents search for

### 2.1 Head terms: what autocomplete shows

| Seed | Top suggestions (Google, BD) | Read |
| --- | --- | --- |
| শিশুদের … | নাপা সিরাপ, টিকার সময়সূচী, ডেঙ্গু, স্ক্যাবিস | Health. Avoid as head term. |
| বাচ্চাদের … | কাশির সিরাপ, গাড়ি, জামার ডিজাইন, কৃমির ঔষধ, খেলনা | Shopping and health. |
| **ছোটদের …** | মজার গল্প, কবিতা, গল্প, ছড়া, বাংলা ছড়া ভিডিও, **সাধারণ জ্ঞান প্রশ্ন ও উত্তর বাংলাদেশ** | **Content. Use this.** |
| বাচ্চাদের শিক্ষামূলক | গল্প, কার্টুন, খেলনা, ভিডিও, ইসলামিক গল্প, **খেলা** | "শিক্ষামূলক খেলা" exists but is low in the list. |
| বাচ্চাদের গেম | ডাউনলোড, খেলা, গাড়ি, দেখাও, **খেললে কি হয়** | Parents worry what games do. |
| ছোটদের গেম | খেলা, chotoder game, কুরআনিক গেম, মজার গেম | Banglish variants appear. |
| বাচ্চাদের মোবাইল | **দেখলে কি হয়, আসক্তি কমানোর উপায়**, দূরে রাখার উপায় | Guilt and worry. Our session limit is a selling point. |
| শিক্ষামূলক গেম | শিশুদের শিক্ষামূলক গেম | Exists, thin. |
| kids learning game bangla | (no suggestions) | English queries are low volume. |
| bangla kids | story, video, kobita, golpo, **learning app** | Banglish is real but secondary. |

### 2.2 Literacy and numeracy (strong, school-shaped)

- **বাংলা বর্ণমালা**: কয়টি, ব্যঞ্জনবর্ণ, মাত্রাহীন বর্ণ কয়টি, **লেখার নিয়ম pdf**, লেখা শেখা, হাতের লেখা.
- **অ আ ক খ**: বর্ণমালা, লেখার নিয়ম, উচ্চারণ, বই, ছবি. YouTube: পড়া, গান, হাতের লেখা, **এ বি সি ডি**.
- **কার চিহ্ন**: দিয়ে শব্দ গঠন, কয়টি, ছাড়া শব্দ গঠন, pdf. **আকার ইকার**: দিয়ে শব্দ গঠন, ছাড়া শব্দ.
- **যুক্তবর্ণ**: দিয়ে শব্দ গঠন, **ভেঙে শব্দ গঠন**, চার্ট, লেখার নিয়ম.
- **বাচ্চাদের হাতের লেখা**: খাতা pdf, শেখানোর খাতা, সুন্দর করার উপায়.
- **ইংরেজি বর্ণমালা**: বাংলা উচ্চারণ, শিক্ষা, ছোট হাতের. Bilingual vocabulary is huge: **ফলের নাম বাংলা ও ইংরেজী**, সবজির নাম ইংরেজিতে, পশুপাখির ইংরেজি নাম, শরীরের অঙ্গের নাম ইংরেজিতে, ছয় ঋতুর নাম ইংরেজিতে.
- **Numbers**: শিশুদের সংখ্যা শেখানো, সংখ্যা গণনা শেখা যায় কোন খেলায় (a parent literally asking for our product), বাংলা সংখ্যা বানান ১ থেকে ১০০, শিশুদের যোগ অংক, বাচ্চাদের অংক শেখার পদ্ধতি, **ঘড়ি দেখা শেখা, ঘড়ি দেখার নিয়ম, বাচ্চাদের ঘড়ি দেখাও**.
- **শিশু শ্রেণি**: বই ২০২৬ pdf, প্রশ্ন বাংলা, প্রশ্ন গণিত. Seasonal around the January book festival.

### 2.3 Stories, rhymes, riddles

- ছোটদের ধাঁধা উত্তর সহ, ছবি সহ, অংকের ধাঁধা; bacchader dhadha. (The site's dhadha is for adults; a picture riddle for small kids is distinct.)
- শিশুদের গল্প, মজার গল্প, **শিশুদের নৈতিক গল্প**, ঈশপের গল্প (class 3, মূলভাব), ঠাকুরমার ঝুলি.
- ছোটদের ছড়া, বাংলা ছড়া হাট্টিমাটিম টিম, আতা গাছে তোতা পাখি, আম পাতা জোড়া জোড়া (YouTube).
- ছোটদের সাধারণ জ্ঞান প্রশ্ন ও উত্তর বাংলাদেশ, ছোটদের কুইজ প্রশ্ন ও উত্তর.

### 2.4 World and science (owner's request: clear demand)

- **সৌরজগৎ**: কাকে বলে (class 4, class 7), ছবি, মডেল, **ছবি আঁকা, প্রজেক্ট, বানানো**, কত বড়. **গ্রহের নাম**: কি কি, ইংরেজিতে, ও ছবি. **মহাকাশ**: মহাকাশযান, মহাকাশচারী, মহাকাশে কি কি আছে.
- **ডাইনোসর**: **গেম, খেলা, গেম 3d**, বিলুপ্তির কারণ, **কি এখনো আছে**, কত বছর আগে বিলুপ্ত. YouTube: কার্টুন, ভিডিও, **গেম, দাও**.
- **পশুপাখির নাম**, পশুপাখির ইংরেজি নাম; **প্রাণীর নাম** বাংলায়, ইংরেজিতে, **ও আবাসস্থল**; পশুর ডাক কে কি বলে; পোকামাকড়ের নাম (উপকারী, ক্ষতিকারক).
- **সাগরের প্রাণী**, সাগরের সবচেয়ে বড় প্রাণী, সবচেয়ে দ্রুতগামী প্রাণী.
- **মানবদেহ**: কয়টি হাড়, সবচেয়ে বড় অঙ্গ, শতকরা কত ভাগ পানি. **শরীরের অঙ্গের নাম**.
- **আকাশ কেন নীল** (Bangla and Banglish: akash keno nil). **পানিচক্র** কাকে বলে, চিত্র.
- **বিশ্বের দেশ** কয়টি, দেশের নাম, মানচিত্র; দেশের রাজধানী ও মুদ্রার নাম; পতাকার ছবি.
- **ট্যানগ্রাম**: পাজল, তৈরি (and বিজ্ঞানবাক্স, a local STEM kit brand, so teachers know the word).

Pattern: world topics are searched as **"কাকে বলে / কয়টি / নাম / ছবি / প্রজেক্ট"**, which is homework. A game that answers the homework question in its FAQ, and lets the child play the concept, can rank for both.

### 2.5 SEO plan for the hub page

- **Path**: `/chhotoder` (matches the head term; Banglish-friendly).
- **`<title>`**: `ছোটদের শিক্ষামূলক খেলা: বর্ণমালা, অঙ্ক, ধাঁধা আর মহাকাশ | একটুখানি`
- **Meta description**: `অ আ ক খ লেখা, কার-চিহ্ন, ঘড়ি দেখা, গ্রহের নাম, ডাইনোসর। ফোনের ব্রাউজারে খেলো, অ্যাপ লাগে না। বিজ্ঞাপন নেই, ফ্রি।`
- **H1**: `ছোটদের খেলাঘর`
- **Intro (two lines, parent-facing)**: `৩ থেকে ১০ বছরের ছোটদের জন্য ছোট ছোট খেলা। বর্ণ, সংখ্যা, ঘড়ি, পশুপাখি, গ্রহ-তারা। প্রতিটা খেলা ১০ মিনিটের, তারপর খাতায় প্রিন্ট করার পাতা আছে।` Then a one-line promise: `বিজ্ঞাপন নেই, কেনাকাটা নেই, বাইরের লিংক নেই। খেলার কিছুই আমাদের কাছে আসে না।`
- **Sections by age band, not by subject**: "৩–৫ বছর", "৫–৭ বছর", "৭–১০ বছর". Parents think in ages. Each card shows the age chip.
- **FAQ on the hub** answering the worry queries: বাচ্চাদের গেম খেললে কি হয়? মোবাইল কতক্ষণ দেব? (cite WHO: under-5s no more than an hour of sedentary screen time a day, with a caregiver where possible). Is it free? Does it need internet?
- **Per-tool page pattern**: title = `<search phrase>: <game name>`, like the existing `বাংলা বর্ণমালা শেখার গেম: অ-তে অজগর`. The FAQ answers the exact homework question ("সৌরজগতে কয়টি গ্রহ?", "কার চিহ্ন কয়টি?") in sentence one.
- **Printable companion**: each tool gets a print view (`/<slug>/print`, browser print to PDF) because "pdf" follows almost every curriculum query.
- **Banglish**: one Banglish phrase in each description where autocomplete shows it (chotoder game, akash keno nil, bacchader dhadha). Don't stuff.

Per-tool keyword angles are listed with each idea in section 6.

---

## 3. Child privacy and safety for a site with no accounts

### 3.1 What the law implies

**COPPA (US).** A site "directed to children" under 13 that collects personal information needs notice and verifiable parental consent. Personal information includes names, photos, audio of a child's voice, geolocation, and **persistent identifiers** (a cookie or device ID). The 2013 rule exempts identifiers used only for "support for internal operations" (site functioning, security, frequency capping) from consent. The **2025 amendments** (published 22 April 2025, compliance by 22 April 2026) keep that exemption from consent but now require the notice to name the specific internal operations. They also add biometrics, written security programmes and retention schedules. We have no US presence, but COPPA is the template parents and press measure against. The cheapest compliant posture is **collect nothing**.

**UK Age Appropriate Design Code (Children's Code).** Fifteen standards, cumulative: best interests of the child, DPIA, age-appropriate application, transparency, detrimental use of data, policies, **default settings (high privacy by default)**, **data minimisation**, **data sharing**, **geolocation off by default**, parental controls, **profiling off by default**, **nudge techniques** (don't nudge children to weaken privacy or extend use), connected toys, online tools. It applies to services "likely to be accessed" by UK children, which a Bangla site barely is. Read it as a design checklist, not a legal threat.

**Bangladesh.**
- **Personal Data Protection Ordinance 2025** (gazetted 6 Nov 2025; a 2026 amendment ordinance followed). As reported, processing a minor's data needs a parent's or guardian's consent, and profiling, behavioural tracking and targeted advertising at minors are banned. The age threshold is disputed in commentary (TBS alleges industry pressure to lower it); I could not confirm the gazette text. Again, collecting nothing makes the threshold irrelevant.
- **Children Act 2013** bars publishing information that identifies a child involved in a trial (section 28, per the 2019 High Court ruling). Not directly about us, but it reflects a clear legal and social norm: don't put children's identities into public media.
- **Social context.** Dhaka Tribune and UNICEF statements (2025) criticise media and parents for exposing children online for views. A children's section must not become a tool for that.

### 3.2 Concrete rules for one product

These are recommendations. Each one is cheap to check in code review.

1. **No child's name on any share card, link or server record. Ever.** The current site lets o-te-ojogor share links carry an optional name, stored on the server for a year (its privacy text says so). That is fine for adults. In `/chhotoder/*` it must not exist: no name field at all. If a child should feel ownership, let them pick an **animal avatar** (বিড়াল, হাতি, দোয়েল), stored only in localStorage.
2. **No share button in front of the child.** Replace it with **"আব্বু-আম্মুকে দেখাও"**. That opens a full-screen "show your parent" card: what was done today ("আজ ৮টা বর্ণ লিখেছ"), with no name and no photo. Behind the parent gate, the parent sees "লিংক শেয়ার করো", which shares the **tool's plain URL**, not a result. The share caption speaks as the parent: `ছোটদের জন্য একটা খেলা পেলাম, অ আ ক খ লেখা শেখায়। বিজ্ঞাপন নেই।`
   - A **"certificate" image** (e.g. "আজ ২০টা বর্ণ লিখলাম") is acceptable only if it is rendered and downloaded **on the phone**, sits behind the gate, has a name field that defaults empty, and is never uploaded. It is a parent's choice, like printing.
3. **Tally off. No `/api/*` calls from any kids' page.** The tally uses a random browser token, which is a persistent identifier under COPPA and "behavioural tracking" in spirit. Kids' pages should make **zero network requests after load** except static assets. A test can enforce this: kids' tools may not import `shared/share-client` or call `fetch`.
4. **No analytics, pixels, embeds or third-party scripts** on kids' pages. No YouTube embed (it brings recommendations and tracking), no Facebook like box. The site already has none. Write it down as a rule so nobody adds one later.
5. **No free-text input for the child.** No "type your name", no "write a message". This removes the chance to type a phone number or address, and nothing needs moderation.
6. **No outbound links in the child's view.** Links to sources, the main site, or other tools go in the parent note behind the gate. Internal links between kids' games are fine as big picture cards. They never lead out of `/chhotoder`.
7. **Progress stays in localStorage**, keyed per tool, with a parent-zone button "এই ফোন থেকে মুছে দাও". Say so in one line on each tool's privacy section.
8. **No nudges.** No streaks, no "you'll lose your stars", no countdown pressure for ages 3–6, no randomised loot rewards, no leaderboard. Stars for completion are fine. The end-of-session screen is an exit, not a hook.
9. **No photo, camera, microphone or location** anywhere in the section. Also don't link from the kids' hub to adult photo tools (studior-chhobi, amar-jersey).
10. **A short privacy page for the section, written for parents**: `এই খেলাগুলো কিছুই আমাদের কাছে পাঠায় না। নাম লাগে না, অ্যাকাউন্ট লাগে না। কোন লেভেল খেলা হলো, সেটা শুধু এই ফোনে থাকে।`

### 3.3 Answers to the four direct questions

| Question | Answer |
| --- | --- |
| Child's name on a share card or link? | **No.** Not in a URL, not on the server, not in a preview. The only exception is a locally rendered, parent-made download behind the gate, default empty. |
| Share buttons, or only "দেখাও আব্বু-আম্মুকে"? | **Only "আব্বু-আম্মুকে দেখাও" in front of the child.** Sharing the tool link lives behind the parent gate. |
| Tallies and analytics? | **Off.** No tally, no analytics, no network calls after load. If you need numbers, use aggregate server request counts per page that the host already logs, with no per-visitor identifier. |
| External links? | **None in the child's view.** Behind the parent gate only, and each one says where it goes. |

---

## 4. Parent experience

### 4.1 A parent note on every tool

A fold-out box above the game, collapsed by default after the first visit, titled **"আব্বু-আম্মুর জন্য"**. Four short lines, same order everywhere:

```
কী শেখে: কার-চিহ্ন বসিয়ে শব্দ বানানো (শিশু শ্রেণি থেকে প্রথম শ্রেণি)।
বয়স: ৫–৭ বছর।
একসাথে খেলো: শব্দটা জোরে পড়ো, তারপর বাচ্চাকে আঙুল দিয়ে দেখাতে বলো কোন চিহ্নটা বসল।
খাতায়: প্রিন্টের পাতায় একই ১০টা শব্দ আছে।
```

Write it in the site's তুমি voice (the parent is the reader). No praise words, no "শিশুর সার্বিক বিকাশ". One concrete co-play prompt, because WHO and AAP guidance both stress shared play over solo screen time.

### 4.2 Gentle session limits

- **Default: about 10 minutes of active play, or the end of 3 levels, whichever comes first.** Then a calm screen: `আজ এটুকুই, কাল আবার।` with a setting sun or a sleeping cat, and one button `আব্বু-আম্মুকে দেখাও`.
- **No countdown timer on screen.** The child shouldn't feel chased. The limit is noticed at a natural break (end of a level), never mid-task.
- **The parent can extend** behind the gate ("আরও ১০ মিনিট") or change the default (৫ / ১০ / ২০ মিনিট / বন্ধ). Store the setting and today's date in localStorage. Next day it resets.
- **Market angle:** "বাচ্চাদের মোবাইল আসক্তি কমানোর উপায়" is a top autocomplete. A visible built-in stop point is exactly what a worried parent wants to hear, and no ad-funded app offers it.

### 4.3 The parent gate

Must stop a 3–6 year old, not a determined 9 year old. Pre-readers can't read, so a reading task works:
- Prompt in words, answer in digits: `সাত আর পাঁচ যোগ করলে কত?` with a number pad. Randomise the pair each time.
- Plus a **press-and-hold 2 seconds** on the gate button, which also stops accidental taps.
- Put **behind the gate**: tool link sharing, certificate download, session settings, "progress মুছে দাও", every outbound link, and the link back to the adult site.
- **Not behind the gate**: the parent note itself (parents should see it instantly), "আব্বু-আম্মুকে দেখাও", and the printable sheet.

---

## 5. Technical constraints

### 5.1 Touch targets for ages 3–6

Evidence: adult guidance is about 1 × 1 cm (Parhi et al., cited by NN/g). Children miss far more: in Anthony's studies, 7–11 year olds missed 46% of targets against 32% for adults, worst on small targets, and the youngest children did worst. Vatavu et al. (2015) found tapping skill improves significantly between 3 and 6. NN/g splits children into 3–5, 6–8 and 9–12, and says 3–5 year olds rely on tap and swipe, not fine dragging. I found no single published millimetre figure for 3–6.

Recommendation (my numbers, derived from the above; test on a real phone):
- **Ages 3–5: tap targets at least 2 cm across**, about **96 CSS px** on a typical 360-px-wide phone. **Ages 6–8: at least 1.5 cm**, about **72 CSS px**. At least **16 px gaps** between targets.
- **Hit area larger than the drawing.** Count a touch that lands within half a target-width of the item as a hit.
- **Tap beats drag for 3–4 year olds.** Where dragging is needed, snap generously (drop anywhere near the slot) and also allow tap-item-then-tap-slot.
- **Keep targets away from the screen edges** (about 24 px), where Android gesture navigation and the palm steal touches.
- **No double-tap, long-press, pinch or multi-touch** for the child (long-press is reserved for the parent gate).
- **Ignore palm and second-finger touches**: act on the first pointer only.
- **Landscape optional, portrait first.** Most cheap phones are held upright.

### 5.2 Bangla speech: is `speechSynthesis` usable on Android Chrome in 2026?

What I found:
- **The engine has Bangla.** Google's Speech Recognition & Synthesis (the default Android TTS) lists **Bangla (Bangladesh)** and **Bangla (India)**. Bengali was added in 2016, Bangla (India) in 3.11.12. Voice data may need a separate download (Settings → Text-to-speech → Install voice data). Samsung phones may default to Samsung's own engine.
- **Chrome on Android doesn't expose voices reliably.** Readium's cross-browser survey says "Chrome on Android doesn't return the list of voices available to the users", and if a listed voice pack isn't installed, "Chrome will default to an English voice instead". Android reports tags with an underscore (`bn_BD`) not a hyphen.
- **Chrome desktop voices need a network connection.** Offline, the list shrinks.
- **I could not test on a device.** Treat everything above as needing a one-day check on three cheap phones (a Samsung A-series, a Redmi, a Walton or Symphony).

Verdict: **usable sometimes, unreliable as a default.** The real risk is the English-voice fallback reading Bangla text, which is worse than silence.

How to degrade gracefully:
1. **Every game works fully silent.** Pictures, a pointing hand, motion and synthesized tones carry the instruction. Speech is an extra.
2. **Detect, don't assume.** On `voiceschanged`, look for a voice whose `lang` matches `/^bn[-_]/i`. If none, show no speaker button for words. Never call `speak()` on Bangla text without a Bangla voice selected.
3. **If the list is empty** (the Android case), offer one parent-facing test behind the gate: "শুনে দেখো: 'আম'", then "শুনতে পেলে?" Yes / No. Store the answer in localStorage.
4. **Short utterances only** (a word or a short phrase). Set `rate` to about 0.85 for children. Chrome desktop has a bug with utterances over about 14 seconds.
5. **Never block on speech.** Speak in parallel with the visual cue; the game advances on taps, not on `onend`.
6. **Recorded audio is ruled out by the brief.** If speech later proves essential for pre-readers (e.g. phonics), the honest next step is a tiny set of recorded syllables. That is a brief change, not a code trick.

### 5.3 Large-font Bangla rendering

- **Sizes**: letters being taught at 64–120 px. Instructions at 20–24 px. Never below 16 px anywhere in the section.
- **Line-height at least 1.6** for Bangla body text. Tall scripts clip at 1.1 in informal tests, and conjuncts with ref, u-kar or ri-kar rise and fall far outside Latin metrics. Don't put Bangla in fixed-height boxes. Use padding, not height.
- **Use the site's self-hosted font** and confirm it shapes all conjuncts and kar signs (Noto Sans Bengali and Hind Siliguri do). A missing substitution shows a visible hasanta (ক্ষ as ক্‌ষ).
- **Never apply `letter-spacing`** or per-letter spans to Bangla words. Both break shaping. To animate letters, split by **grapheme cluster** with `Intl.Segmenter` (Chrome has it), so কা, ক্ষ and ফু stay whole.
- **Showing a kar sign alone**: draw it on a dotted circle, ◌া ◌ি ◌ু. A bare ি renders oddly and teaches the wrong shape.
- **ি, ে, ৈ render to the left** of their consonant though typed after it. In a "place the kar sign" game, the slot must be drawn where the sign appears, not where it's typed.
- **Use Bangla digits** (১২৩) in Bangla games. Show both digit forms only where the game teaches both.

### 5.4 Offline and low-data friendliness

- **Budget**: under 300 KB per game after compression, including art. Draw with inline SVG and CSS; generate sound with Web Audio. The brief already rules out audio files.
- **Everything the game needs loads with the page.** No lazy fetch mid-game.
- **Offline**: the site claims "once the page opens, play needs no internet", which holds while the tab stays open. For a family on a ৳20 data pack, add a **service worker scoped to `/chhotoder/`** that caches the hub and each visited game, so a game opened once works next day with data off. `app/manifest.ts` already exists, so "হোম স্ক্রিনে রাখো" (Add to Home screen) gives a one-tap kids' icon. That beats installing an app.
- **No webfont swap flash for letters**: preload the Bangla font on kids' pages. A child sees a fallback-font অ for half a second and it's a different shape.
- **Low-end performance**: 2–3 GB RAM phones. Avoid canvas full-screen redraws at 60 fps when nothing moves; pause `requestAnimationFrame` on `visibilitychange`.

---

## 5b. Business: growing the site without exploiting children

**Who shares a kids' tool?** Not the child. The parent, the teacher, the aunt in Dubai. Design the share moment for them.

1. **Pre-primary and Class 1–2 teachers.** Kindergartens, coaching centres and government primary schools run class groups on Messenger, WhatsApp and imo. A teacher shares a link that matches this week's lesson (কার-চিহ্ন, ঘড়ি দেখা). **The printable sheet is the hook**: teachers already search "… pdf". Add a "শিক্ষকদের জন্য" line on each parent note: the matching textbook topic and a print link.
2. **Parent Facebook groups.** Large Bangladeshi mothers' and parenting groups trade advice on "মোবাইল আসক্তি" and early learning. The pitch that travels: `বিজ্ঞাপন নেই, ১০ মিনিট পর নিজেই থামে, প্রিন্ট করার পাতা আছে।` Post as the site, honestly, with a screenshot of the game and no child in it.
3. **Calendar hooks.** 1 January book festival (শিশু শ্রেণির বই), 21 February (বর্ণমালা, মাতৃভাষা), 26 March and 16 December (পতাকা, দেশ চেনা), school admission season (November–January), summer and Eid holidays (parents look for screen time that isn't junk).
4. **Probashi families.** Parents abroad want their children to read Bangla. A no-install, Bangladeshi-register, ad-free Bangla alphabet game is exactly what they look for, and they share in diaspora groups.
5. **Search.** Homework queries (section 2) bring children's older siblings and parents to tool pages that answer the question in sentence one.
6. **Cross-traffic to the adult site** happens through the parent, behind the gate: "আব্বু-আম্মুর জন্য আরও টুল".

What not to do:
- No ads, sponsorships or branded characters in the kids' section, even later. Trust is the asset.
- No "share to unlock", no "invite 3 friends", no child-facing share incentives.
- No collecting parent phone numbers or emails "for updates".
- No YouTube channel featuring children. If you make videos, show hands and the screen, never faces.
- Don't measure success by time-on-site. Measure page requests per tool and print-view requests. Both are in normal server logs, with no identifiers.

---

## 6. Thirty game and tool ideas

Constraints applied: single page, browser only, no server, no audio files (Web Audio tones only), no accounts, no camera, microphone or chat. None duplicates o-te-ojogor, namta, banan, jora-melao, konta-nei, ghontar-sur, chhobi-photao, golokdhadha or dhadha.
**Effort**: S = about a day, mostly content; M = a few days, real interaction or art; L = a week or more.
**Scope**: BD = Bangladeshi content; World = international topics in natural Bangla; Both = universal concept with Bangladeshi objects.

**Reuse first.** Ideas 5, 6, 12 and 28 can share **one "নাম শিখি" engine** (picture → Bangla word → English word, tap to match, data packs per topic). Ideas 14, 15 and 29 can share one counting engine. That cuts eight games to about three builds and gives eight SEO pages.

### Literacy

| # | Working name | Scope | Age | Skill | Core loop | Demand / sharing angle | Effort |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | **বর্ণ লিখি** | BD | 4–6 | Letter formation, pre-writing | A big dotted অ. Trace it with a finger along numbered strokes; ink follows only if you stay near the path. Finished letter wiggles into its picture. | "অ আ ক খ লেখার নিয়ম", "বাংলা বর্ণমালা লেখার নিয়ম pdf", "বাচ্চাদের হাতের লেখার খাতা pdf". Print view = tracing sheet. | M |
| 2 | **কার-চিহ্ন বসাও** | BD | 5–7 | Vowel signs, word building | Picture of a মাছ, letters ম _ ছ. Drag ◌া into the slot; the word reads itself as a picture pops. | "কার চিহ্ন দিয়ে শব্দ গঠন" (+pdf), "আকার ইকার দিয়ে শব্দ গঠন". Teacher favourite. | S |
| 3 | **যুক্তবর্ণ ভাঙি** | BD | 7–9 | Conjunct decomposition | A conjunct (ক্ষ, ঙ্গ, ন্ত) sits on a block. Tap to crack it into its parts, then pick the word that uses it. | "যুক্তবর্ণ ভেঙে শব্দ গঠন", "যুক্তবর্ণ চার্ট". | S |
| 4 | **ছবি দেখে বানান** | BD | 5–7 | Spelling short words | Picture of নৌকা; three to five letter tiles; tap them in order. No wrong-answer sound, a tile that doesn't fit just slides back. | "বানান" for kids; teacher sheet with 10 words. Distinct from shobdo-khela (adult). | S |
| 5 | **পশুপাখির নাম** | Both | 3–7 | Vocabulary, Bangla + English | Hear/see "হাতি", tap the elephant among four. Level two shows the English name too. | "পশুপাখির নাম", "পশুপাখির ইংরেজি নাম", "প্রাণীর নাম ইংরেজিতে". Uses the নাম শিখি engine. | M (art) |
| 6 | **ফল-সবজির ঝুড়ি** | BD | 3–6 | Classification, names | Items roll on a বাজার mat: কাঁঠাল, লাউ, পেয়ারা, ঢেঁড়স. Drop each in the ফল or সবজি basket. | "ফলের নাম বাংলা ও ইংরেজী", "সবজির নাম ও ছবি". | S |
| 7 | **ABC আপেল** | Both | 4–7 | English letters, Bangla bridge | English letter A appears; pick the picture whose English word starts with it (Apple); the Bangla name shows below. | "ইংরেজি বর্ণমালা বাংলা উচ্চারণ", "অ আ ক খ এ বি সি ডি". | M |
| 8 | **ছড়ার তালে** | BD | 3–6 | Rhythm, rhyme, print awareness | A public-domain ছড়া (আতা গাছে তোতা পাখি) on screen; tap the drum on each beat; the word under the beat lights up. | YouTube's top kids queries are ছড়া; parents share with grandparents. | M |
| 9 | **গল্প সাজাও** | Both | 5–8 | Sequencing, comprehension | Four picture panels of a short fable (খরগোশ আর কচ্ছপ) are mixed. Put them in order; then the story reads panel by panel. | "ঈশপের গল্প", "শিশুদের নৈতিক গল্প". | M |
| 10 | **ছবির ধাঁধা** | BD | 4–7 | Inference, vocabulary | A one-line riddle with three picture answers (`আমার আছে চার পা, কিন্তু হাঁটি না` → চৌকি). Read aloud by the parent. | "ছোটদের ধাঁধা উত্তর সহ ছবি", "bacchader dhadha". Distinct from dhadha (adult, text). | S |

### Numbers and logic

| # | Working name | Scope | Age | Skill | Core loop | Demand / sharing angle | Effort |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 11 | **ঘড়ি দেখি** | Both | 5–8 | Telling time | A clock face and a scene (`স্কুল শুরু ৯টায়`). Drag the hands to match. Later: half past, quarter past. | "ঘড়ি দেখা শেখা", "ঘড়ি দেখার নিয়ম", "বাচ্চাদের ঘড়ি দেখাও". | S |
| 12 | **শরীরের নাম** | Both | 3–6 | Body parts, Bangla + English | A friendly face and body. Tap where the নাক is. Level two: drag labels on. | "শরীরের অঙ্গের নাম", "শরীরের অঙ্গের নাম ইংরেজিতে". Uses the নাম শিখি engine. | S |
| 13 | **প্যাটার্নের মালা** | BD | 4–7 | Pattern recognition | A মালা of beads or নকশিকাঁথা motifs: red, yellow, red, … Pick what comes next. Patterns grow from AB to ABC to AABB. | Teacher angle (pre-math). Low search demand. | S |
| 14 | **গুনে দেখি** | BD | 3–5 | Counting 1–20 | Fish swim into a pond. Tap each one to count; the number tile glows. Then pick the total. | "শিশুদের সংখ্যা শেখানো", "সংখ্যা গণনা শেখা যায় কোন খেলায়". | S |
| 15 | **খেয়া নৌকা** | BD | 5–7 | Addition, subtraction within 10 | A নৌকা ferries passengers: 3 on board, 2 more get on. How many now? Pick the number; the boat floats off. | "শিশুদের যোগ অংক", "বাচ্চাদের অংক শেখার পদ্ধতি". | S |
| 16 | **ছোট থেকে বড়** | Both | 3–5 | Seriation, comparison | Five হাঁড়ি, or animals, of different sizes. Line them up smallest to biggest. Later: lightest to heaviest. | Teacher angle. | S |
| 17 | **ছায়া মেলাও** | Both | 3–5 | Visual discrimination | A shape's shadow on a wall. Pick which object (রিকশা, ছাতা, হাঁস) casts it. | Teacher angle; good first game for age 3. | S |
| 18 | **আকারের খেলা** (ট্যানগ্রাম) | Both | 6–10 | Spatial reasoning | Seven pieces; rotate and fit them to make a নৌকা, a বিড়াল, a ঘর. Tap to rotate, no fine dragging. | "ট্যানগ্রাম পাজল", "ট্যানগ্রাম তৈরি"; print view = cut-out sheet. | M |
| 19 | **ব্যাঙের লাফ** | Both | 5–8 | Number line, skip counting | A ব্যাঙ on a number line of lily pads. "২-২ করে লাফাও": tap the pad it lands on. Odd/even, then counting back. | Pre-multiplication; complements namta. | S |
| 20 | **রং মেশাও** | World | 3–6 | Colour names, mixing | Pour two paint pots into a bowl: লাল + হলুদ = কমলা. Then paint a ঘুড়ি with your new colour. | "বাচ্চাদের রং চেনা", "বাচ্চাদের রং চেনানোর". | S |

### World, science and nature

| # | Working name | Scope | Age | Skill | Core loop | Demand / sharing angle | Effort |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 21 | **সৌরজগতের সফর** | World | 5–10 | Planets, order, scale | A rocket waits by the sun. Tap the planets in order to fly out; each stop shows one fact (`বৃহস্পতিতে ১৩০০টা পৃথিবী ধরে যায়`). Then a mix-up round to put them back. | "সৌরজগৎ কাকে বলে class 4", "গ্রহের নাম ও ছবি", "সৌরজগৎ প্রজেক্ট". Print view = planet cut-outs for the school project. | M |
| 22 | **ডাইনোসর খুঁজি** | World | 4–9 | Paleontology basics, patience | Brush the sand with a finger to uncover bones; snap them into a skeleton; the dinosaur appears with its name, size compared to a bus, and what it ate. | "ডাইনোসর গেম", "ডাইনোসর খেলা", "ডাইনোসর কি এখনো আছে". Direct game query. | M |
| 23 | **সাগরতলে** | World | 5–9 | Ocean zones, animals | A slice of sea from sunlit top to dark floor. Drop each animal (তিমি, জেলিফিশ, অ্যাংলারফিশ) at the depth it lives. Torchlight shows the deep. | "সাগরের প্রাণী", "সাগরের সবচেয়ে বড় প্রাণী". | M |
| 24 | **কে কোথায় থাকে?** | Both | 3–7 | Habitats | Animals wait at the edge: বাঘ, উট, পেঙ্গুইন, ইলিশ. Drag each home: সুন্দরবন, মরুভূমি, বরফ, নদী. | "প্রাণীর নাম ও আবাসস্থল". Sundarbans gives BD pride. | S |
| 25 | **কেন হয়?** | World | 6–10 | Science explanations, curiosity | A deck of "কেন" cards: আকাশ কেন নীল, চাঁদ কেন ছোট-বড় হয়, বৃষ্টি কোথা থেকে আসে. Guess from two picture answers, then a 10-second animation shows why. | "আকাশ কেন নীল" (Bangla and Banglish), "পানিচক্র কাকে বলে". One page per question → many long-tail pages. | M (content) |
| 26 | **মেঘ-বৃষ্টির চাকা** | Both | 5–9 | Water cycle | Tap the sun to warm the river; vapour rises; cloud grows; tap the cloud to rain on a ধানখেত; the river fills again. | "পানিচক্র চিত্র", "পানিচক্র ব্যাখ্যা করো". | M |
| 27 | **দেশে দেশে** | World | 6–10 | Geography, other cultures | Spin a simple globe, land on a country: its flag, how children there say "হ্যালো", one animal, one food. Then match flags to countries. | "বিশ্বের দেশের নাম", "পতাকার ছবি", "দেশের রাজধানী ও মুদ্রার নাম". | M |
| 28 | **ছয় ঋতুর চাকা** | BD | 5–8 | Seasons, observation | A wheel of six ঋতু. Drop কদম ফুল, খেজুরের রস, কালবৈশাখী, শিউলি into the right season; the scene changes colour. | "ছয় ঋতুর নাম" (and ইংরেজিতে), "ষড়ঋতু". Uses the নাম শিখি engine. | S |
| 29 | **গাছ লাগাই** | BD | 4–8 | Plant growth, patience, care | Plant a আম seed; water it and give it sun once a day; it grows over real days (localStorage date). No penalty for missed days, it just waits. | Ties to "ভালো অভ্যাস"; parents like a daily 1-minute ritual. | M |

### Feelings and kindness

| # | Working name | Scope | Age | Skill | Core loop | Demand / sharing angle | Effort |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 30 | **মনের মুখ** | Both | 3–7 | Naming emotions | A child's face in a scene (ঘুড়ি ছিঁড়ে গেছে). Pick the face that matches: খুশি, দুঃখ, রাগ, ভয়. Then: "কী করলে ভালো লাগবে?" with two gentle options. | Low search; strong parent-group sharing ("বাচ্চারা অনুভূতির নাম শেখে"). | S |
| 31 | **কী করবে তুমি?** | BD | 5–9 | Empathy, perspective, fairness | Short everyday moments: বন্ধু পড়ে গেছে, টিফিন একটা কম পড়েছে, নতুন ছেলেটা একা. Choose; the other child's face responds. No score, no "wrong". | "শিশুদের নৈতিক শিক্ষা", "বাচ্চাদের ভালো অভ্যাস". Coordinate with the child-development note. | M |

That is 31; drop whichever the curriculum note finds weakest.

### The five I'd back most

1. **কার-চিহ্ন বসাও (2)**: the strongest school-shaped query, S effort, teachers share it, printable.
2. **বর্ণ লিখি (1)**: tracing is what parents already pay for in খাতা; "pdf" demand; pairs with o-te-ojogor.
3. **সৌরজগতের সফর (21)**: world topic with Google and YouTube demand plus the school-project angle.
4. **ডাইনোসর খুঁজি (22)**: autocomplete literally asks for "ডাইনোসর গেম". Nothing in Bangla answers it.
5. **The নাম শিখি engine (5, 6, 12, 28)**: one build, four or more pages, all riding the huge "… নাম বাংলা ও ইংরেজি" demand.

Runners-up: ঘড়ি দেখি (11, S, clear demand) and কেন হয়? (25, long-tail SEO).

---

## Sources

Market and apps
- Khan Academy Kids, App Store: https://apps.apple.com/app/1378467217
- Khan Academy Kids ToS review (terms.law): https://terms.law/ToS-Watchdog/childrens-apps/khan-kids/
- Khan Academy Kids curriculum review (Homeschool Fox): https://homeschoolfox.com/curriculum/khan-academy-kids
- Duolingo ABC, App Store: https://apps.apple.com/app/id1440502568
- Duolingo ABC launch (9to5Mac): https://9to5mac.com/2020/03/26/duolingo-abc-learn-to-read-ios-free-app/
- PBS Kids review (Screenwise): https://screenwiseapp.com/pbs-kids
- PBS Kids Games review (Pastory): https://pastory.app/articles/is-pbs-kids-games-good-and-safe-for-kids/
- Toca Boca philosophy (Screenwise): https://screenwiseapp.com/guides/why-toca-boca-apps-are-the-gold-standard-for-preschool-screen-time
- Endless Alphabet, Common Sense Media: https://www.commonsensemedia.org/app-reviews/endless-alphabet
- Endless Alphabet review (Macworld): https://www.macworld.com/article/221077/review-your-kids-will-love-learning-with-endless-alphabet-for-ios.html
- Lingokids, Common Sense Media parent reviews: https://www.commonsensemedia.org/app-reviews/lingokids-play-and-learn/user-reviews/adult
- Lingokids complaints (ComplaintsBoard): https://www.complaintsboard.com/lingokids-play-and-learn-b149690/reviews
- Advertising in apps for young children (Michigan Medicine on Meyer, Radesky et al.): https://www.michiganmedicine.org/health-lab/advertising-kids-apps-more-prevalent-parents-may-realize
- Kids Learn Bangla Alphabet listing (chrome-stats): https://chrome-stats.com/d/com.tos.bnalphabet
- Pandoo terms (mPower Social): https://mpower-social.com/?p=1528
- Hatekhori (TBS News): https://www.tbsnews.net/node/350353
- 10 Minute School (Wikipedia): https://en.wikipedia.org/wiki/10_Minute_School
- Infobells Bangla (vidIQ): https://vidiq.com/youtube-stats/channel/UCAWuV9ZZ0itI3WR-JHWIUNQ
- Jugnu Kids Bangla (vidIQ): https://vidiq.com/youtube-stats/channel/UCWyfOC7fLxYch3IkQ58fMrA
- Kids TV Bangla (Qoruz): https://qoruz.com/kidstvbanglanurseryrhymes/youtube
- Sisimpur free on OTT (Daily Star): https://tds-images.thedailystar.net/entertainment/tv-film/news/kids-can-now-watch-sisimpur-free-ott-3973606
- Children's programming in Bangladesh (Daily Star, 2023 print): https://epfs.thedailystar.net/TDS/2023/02/15/Bangladesh/SUP/5_30/162769f383aafcc4_30.pdf
- Child content on social media (Dhaka Tribune): https://www.dhakatribune.com/amp/science-technology-environment/technology/409552/digital-fame-at-the-cost-of-childhood-the-dark
- BBS ICT use survey (Dhaka Tribune): https://www.dhakatribune.com/business/420730/bbs-survey-66%25-of-population-own-a-mobile-phone

Search demand
- Google autocomplete, queried 15 Oct 2026: `https://suggestqueries.google.com/complete/search?client=firefox&hl=bn&gl=bd&q=…` (and `ds=yt` for YouTube). Seeds and results are summarised in section 2.

Law and policy
- COPPA amended rule, Federal Register (22 Apr 2025): https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule
- COPPA amendment compliance reminder (BBB National Programs): https://bbbprograms.org/media/insights/blog/coppa-amended
- COPPA 2013 internal-operations exception (Covington, Inside Privacy): https://www.insideprivacy.com/united-states/federal-trade-commission/ftc-adopts-final-coppa-rule/
- ICO Children's Code executive summary: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/executive-summary/
- Personal Data Protection Ordinance 2025 approved (Dhaka Tribune): https://www.dhakatribune.com/bangladesh/393590/bangladesh-government-approves-personal-data
- PDPO gazette (Prothom Alo English): https://en.prothomalo.com/bangladesh/government/teeopu4dfv
- Child data profiling and the PDPO (TBS opinion): https://www.tbsnews.net/node/1386956
- Children Act 2013, HC ruling on identifying children (Prothom Alo English): https://en.prothomalo.com/bangladesh/HC-asks-media-not-to-reveal-children’s-identity-in
- UNICEF Bangladesh on child safeguarding (Dhaka Tribune): https://www.dhakatribune.com/bangladesh/373357/unicef-urgent-need-to-uphold-child-safeguarding
- WHO under-5 screen time guidance (summary): https://www.additudemag.com/screen-time-not-recommended-for-young-children/amp

Technical
- Web Speech across browsers and OSes (Readium): https://readium.org/speech/docs/WebSpeech.html
- Google Speech Recognition & Synthesis languages (Wikipedia): https://en.wikipedia.org/wiki/Speech_Recognition_%26_Synthesis
- Google TTS release notes (APKMirror): https://www.apkmirror.com/apk/google-inc/google-text-to-speech-engine/google-text-to-speech-engine-3-12-8-release/
- Chrome speech synthesis intro: https://developer.chrome.com/blog/web-apps-that-talk-introduction-to-the-speech-synthesis-api
- Touch target size (NN/g): https://www.nngroup.com/articles/touch-target-size/
- Children's touchscreen interactions, MTAGIC (Anthony et al., IJHCS 2019 preprint): https://init.cise.ufl.edu/wp-content/uploads/sites/378/2019/03/anthony-et-al-IJHCS2019-MTAGIC-final-preprint.pdf
- Children vs adults touch accuracy (Anthony et al., 2013): https://lisa-anthony.com/wp-content/uploads/2013/04/anthony-et-al-jpuc2013.pdf
- Vatavu et al., touch for ages 3–6 (IJHCS 2015, DOI 10.1016/j.ijhcs.2014.10.007): https://scholarhub.vn/publication/:slug/c9d9c904-dd34-4e07-864a-dd650132390a
- Designing for children (NN/g video): https://www.nngroup.com/videos/designing-children/
- Bengali script shaping (unicodefyi): https://unicodefyi.com/guide/bengali-script-guide
- Line-height for tall scripts (SuttaCentral test): https://discourse.suttacentral.net/t/testing-for-line-height-with-tall-scripts/6196

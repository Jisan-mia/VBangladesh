# একটুখানি: on-page and content SEO findings

## Full findings

### Method
I parsed all 337 rendered URLs at 127.0.0.1:3200: 111 tool pages, 111 guide pages, 111 per-tool privacy pages, and `/`, `/tools`, `/about`, `/privacy`. I read 25 tool pages in depth: jomi, namta, gpa, taka-kothay, boyos, bidyut-bill, gorur-ojon, bhori, sehri-iftar, koto-din-baki, bhara, antenna-thik-koro, dawat, shubhechha, sap-ludu, carrom, baghbandi, desh-cheno, dhadha, shobdo-khela, flames, bangla-typing, attiyo, danguli and chhok-jora. Lengths are counted in UTF-16 code units. The only search tool available is US-based, so I could not check Google Bangladesh results; statements about what Google ranks are hedged.

### Scores (skill weights)

| Category | Weight | Score |
|---|---|---|
| On-Page | 20% | 68 |
| Content | 23% | 72 |
| Schema (content view) | 10% | 70 |
| AI Search Readiness | 10% | 75 |
| Technical / Performance / Images | — | not assessed |
| **Weighted over the 63% assessed** | | **71** |

### Findings

**F1. High: no category pages for broad searches.**
- **Evidence:** `components/all-tools.tsx` filters by category with a `#c=` hash, which search engines ignore. `/tools` lists 111 tool cards as H2s with no intro text.
  - 11 titles add an invented "X-এর বাংলা গেম", e.g. "বস্তা সাজানোর বাংলা গেম".
  - A sample search for "বাংলা গেম" returned mostly gambling-spam pages, so the term looks winnable (unverified for Google Bangladesh).
- **Fix:** add static `app/games/page.tsx`, `app/quiz/page.tsx`, `app/hishab/page.tsx` and optionally `app/utsob/page.tsx`. Each reuses `HubFrame` and `AllTools` with a filtered list. Give each one:
  - a keyword H1, e.g. "বাংলা গেম: ফোনেই দেশি খেলা, ফ্রি";
  - a 150–300-word intro, its own title and description, and CollectionPage/ItemList schema;
  - an entry in `app/sitemap.ts`.

  Then remove "বাংলা গেম" from the per-game titles. Check that no slug in `lib/catalog.ts` uses these names.

**F2. High: 222 thin pages are indexable.**
- **Evidence:** `app/sitemap.ts` lists `/{slug}/guide` and `/{slug}/privacy` for every tool. All render `index, follow` with a canonical pointing to themselves, and no sitemap entry has a `lastmod`.
  - Guide pages are about 106 words (median), and a median 58% of their 5-word sequences appear word for word on the tool page.
  - Privacy pages are about 150 words, roughly 60 of them shared template. Overlap between pairs is a median 38% and up to 91%.
  - 13 guide titles are over 60 characters, e.g. "আলপনা যেভাবে আঁকবে… | আলপনা আঁকি | একটুখানি" (71). 36 guide descriptions are under 70 characters.
- **Fix:**
  - In `app/[tool]/guide/page.tsx` and `app/[tool]/privacy/page.tsx`, return `{ ...pageMetadata(...), robots: { index: false, follow: true } }`, the same pattern as `app/s/[id]`.
  - In `app/sitemap.ts`, list only `/${slug}` per tool.
  - Don't canonicalise the per-tool privacy pages to `/privacy`, because their content differs.
  - Optionally, redirect `/guide` with a 301 to `/{slug}#how` later.

**F3. High: weak internal linking.**
- **Evidence:** `shared/site-shell.tsx` lines 33–35 pick the flagship plus the first 3 tools of the same category.
  - 65 tools get zero links from other tool pages, including jomi, namta, bidyut-bill, gorur-ojon, bhori, sehri-iftar, sap-ludu, carrom and bangla-typing.
  - Meanwhile bazar-note, bhara and bhagabhagi each get 11–12 links, and kalbaishakhi-aam, dudh-uthlano and jhalmuri-sap get 24 each.
  - None of the tools above is linked from the homepage.
- **Fix:** pick the next 3 tools in the same category, wrapping around at the end. Exclude the flagship from that list, since it is already added first.
  ```js
  const same = catalog.filter(t => t.category === category && t.slug !== flagship);
  const i = same.findIndex(t => t.slug === site.slug);
  const picks = [1, 2, 3]
    .map(k => same[(i + k) % same.length])
    .filter(t => t.slug !== site.slug);
  ```
  Also link to the category page next to "সব টুল".

**F4. Medium: 42 H1s miss the page's keyword.**
- **Examples:**
  - boyos: "তুমি আজ কত দিনের?"
  - jomi: "শতাংশ, কাঠা, বিঘা কোনটা কত?"
  - carrom: "এক টোকায় কয়টা গুটি…"
  - baghbandi
  - desh-cheno
  - dom-atkano
  - bangla-typing
  - bidyut-bill: "কোন যন্ত্রে কত বিল আসে?"
  - taka-kothay: "যেকোনো অঙ্ক, কথায় লেখা"
- **Fix:** keep the playful line and add the keyword as a span inside the H1, e.g. `<h1><span className="eyebrow">বয়স ক্যালকুলেটর</span> তুমি আজ কত দিনের?</h1>`. Edit each `tools/<slug>/page.tsx`, and render the kicker inside the H1 in `shared/studio-page.tsx`. Do the utilities and traditional games first.

**F5. Medium: no "who" signal.**
- **Evidence:** `/about` is 149 words with no maker, contact, method or way to report errors. There is no Organization schema anywhere.
- **Fix:**
  - Expand `app/about/page.tsx` with those four things.
  - Add an Organization node (with the Facebook page in `sameAs`) in `app/page.tsx`, and reference it as `publisher` in `shared/seo.ts` `websiteSchema`.
  - rokto shows "হালনাগাদ ১৩ এপ্রিল ২০২৪", which looks stale next to the October 2026 dates elsewhere. Re-verify it.

**F6. Medium: search variants aren't on the pages.**
- **Evidence:** `lib/search-keywords.ts` has them, but the rendered pages are missing:
  - gpa: SSC
  - boyos: age calculator, বয়স হিসাব
  - taka-kothay: in words
  - jomi: bigha, and হেক্টর is absent
  - bidyut-bill: the common misspelling বিদ্যুত
  - carrom: ক্যারাম
  - dhadha: ধাধা
  - sehri-iftar: সেহেরি
  - shobdo-khoja: ওয়ার্ড সার্চ
- **Fix:** add 2–3 of these once, naturally, in an existing FAQ answer per tool. Add `alternateName` (at most 3) to the WebApplication schema from `searchKeywords[slug]`. Check volumes in Search Console afterwards.

**F7. Medium: breadcrumbs skip the category.** The breadcrumb is "একটুখানি / name", both on the page and in the BreadcrumbList schema. Once F1 exists, add the category hub as the middle item in `shared/site-shell.tsx` and `shared/seo.ts`.

**F8. Medium: titles that compete with each other.**
- danguli and cholo-kheli both use "ছোটবেলার দেশি খেলা".
- shobdo-khela and shobdo-khoja both lead with "বাংলা শব্দ…খেলা".
- chor-police and sir-ghurlei-thamo both use "চিরকুট গেম".
- The 4 quiz titles have distinct modifiers, so they don't compete. They do need `/quiz`.

**F9. Medium: intent gaps on two tools.**
- jomi has no length × width (ফুট) input and no হেক্টর unit. "দৈর্ঘ্য প্রস্থ দিয়ে জমির মাপ" is a common search.
- sehri-iftar promises "সময়সূচি ২০২৭" but shows only a countdown until Islamic Foundation publishes the schedule. That's honest; the table just needs to go live as soon as the schedule is out.

**F10. Low: templated endings.** 75 of 111 descriptions end with "ফ্রি, অ্যাকাউন্ট লাগে না।", and about 178 of 953 FAQ questions are shared boilerplate. Swap the ending opportunistically when editing a description. Bangla descriptions are only 83–108 grapheme clusters long, so there is room for a page-specific hook.

**F11. Low: year-stamped text goes stale.** amar-bochhor "২০২৬", sehri-iftar "২০২৭", and the koto-din-baki FAQ "দুর্গাপূজা ২০২৬". Add them to a seasonal update checklist.

**F12. Info:** the skill says FAQ rich results were retired in May 2026. Keeping the FAQPage markup is harmless.

### Title rewrites

Lengths include " | একটুখানি".

| Tool | Proposed title | Length |
|---|---|---|
| jomi | জমির মাপ ক্যালকুলেটর — শতাংশ, কাঠা, বিঘা, একর | 56 |
| boyos | বয়স ক্যালকুলেটর — জন্ম তারিখ থেকে বয়স হিসাব | 56 |
| bidyut-bill | বিদ্যুৎ বিল ক্যালকুলেটর — ইউনিট আর টাকার হিসাব | 57 |
| desh-cheno | বাংলাদেশ সাধারণ জ্ঞান কুইজ — প্রশ্ন ও উত্তর | 54 |
| dom-atkano | বাংলাদেশ ক্রিকেট কুইজ — দম আটকানো ম্যাচগুলো | 54 |
| danguli | ডাংগুলি খেলা — ফোনেই কাঠি তুলে মারো | 46 |
| shobdo-khoja | ওয়ার্ড সার্চ বাংলা — লুকানো শব্দ খোঁজার খেলা | 56 |
| chhok-jora | ডট খেলা (ডট-বক্স) — দুজনে বা বটের সাথে | 49 |
| peoner-cycle | সাইকেল গেম — পিয়নের সাইকেলে চিঠি পৌঁছাও | 51 |
| deri-hoye-gelo | দৌড়ের গেম — দেরি হয়ে গেল! লাফিয়ে স্কুলে চলো | 57 |
| churui-tarao | পাখি তাড়ানোর গেম — চড়ুই তাড়াও, ধান বাঁচাও | 55 |

### Description rewrites

| Tool | Proposed description | Length |
|---|---|---|
| boyos | জন্ম তারিখ দিয়ে বয়স বের করো বছর-মাস-দিনে, মোট কত দিন হলো দেখো। সাথে বাংলা জন্মতারিখ, জন্মঋতু আর চাকরির আবেদনের দিনে বয়স কত, সেটাও। ফ্রি। | 139 |
| bidyut-bill | বিদ্যুৎ বিল কত আসবে? ফ্যান, ফ্রিজ, এসি কয়টা আর কত ঘণ্টা চলে দাও। মাসে কত ইউনিট, ইউনিট প্রতি এখনকার দামে আনুমানিক বিল আর কোন যন্ত্র কত খায়, দেখো। | 146 |
| desh-cheno | বাংলাদেশের সাধারণ জ্ঞান প্রশ্ন ও উত্তর: জাতীয় পাখি, নদী, ঋতু, বিজয় দিবস। ১০টা প্রশ্নের কুইজ, প্রতিটা উত্তর বাংলাপিডিয়া মিলিয়ে। খেলো, বন্ধুকেও পাঠাও। | 152 |
| shobdo-khoja | বাংলা ওয়ার্ড সার্চ: অক্ষরের গ্রিডে লুকানো ছয়টা শব্দ, ফুল, মাছ, পিঠা, পাখি বা নদীর নাম। আঙুল টেনে খুঁজে কাটো, ঘড়ি ধরে খেলো, বন্ধুকে একই গ্রিড পাঠাও। | 150 |

I left gpa, namta and taka-kothay as they are; they're already good.

### Cluster map (existing tools only)

| Hub | Tools |
|---|---|
| `/hishab` | jomi, bhori, gorur-ojon, bidyut-bill, current-gelo, betoner-bhag, bhagabhagi, matir-bank, dhoyahin, tokhon-ekhon, bhara, boyos, koto-din-baki, gpa, taka-kothay, namta |
| `/games` | **Traditional:** sap-ludu, carrom, baghbandi, chhok-jora, danguli, chor-police, vo-katta. **Word and puzzle:** shobdo-khela, shobdo-khoja, paka-kancha, jora-melao, jam-chharao, pati-buni, bhangti-nai. **Arcade:** the rest of the গেম category, plus shesh-bol. cholo-kheli is the informational partner page. |
| `/quiz` | desh-cheno, bagdhara, banan, dom-atkano, attiyo, dhadha, koto-cheno, flames, mache-bhate, pitha, mishtir-baksho, himu, jibh, projonmo |
| `/utsob` (optional) | koto-din-baki, sehri-iftar, iftar-plate, eider-din, eidjatra, salami-chek, shubhechha, mondop, gorur-ojon, ghuri, vo-katta, kalbaishakhi-aam |

The nostalgia and identity tools are Facebook-driven and don't need a search category page; the homepage covers them.

### What already works
- **Titles:** all unique, 39–56 characters including the brand (at most 40 grapheme clusters, so no truncation), and about 90% put the keyword first.
- **Descriptions:** all unique and 133–160 characters. Many open with the literal question people search.
- **Tool pages are substantial:** median 677 words, minimum 414, each with exactly 1 H1.
- **Utility pages put the tool right under the H1, with reference tables below:** land units, metro fares, namta 1–20 with a note for "১ থেকে ১০০", and the tariff table.
- **FAQs are phrased as searches:** e.g. "এক শতাংশ সমান কত স্কয়ার ফিট?" and "২০০ ইউনিট বিদ্যুৎ বিল কত টাকা?".
- **Sources:** 12 tools show a source with a verification date, and 24 pages link out to sources.
- **Share pages:** `/s/[id]` is already noindex.

I did not check live Google Bangladesh results or search volumes, or the technical, performance and image side. To act on any finding you'd need to lift the report-only rule, since all fixes are edits to repo files.

Sources (sample searches, US-based, low precision): [tbsnews.net feature](https://www.tbsnews.net/bangla/feature/news-details-347911), [teachers.gov.bd](https://www.teachers.gov.bd/blog/details/805890), [bdservicerules.info](https://bdservicerules.info/?p=44899)
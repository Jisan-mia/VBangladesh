# একটুখানি: AI search (GEO) and agent-readiness audit

Audited 2026-10-12 against the production build at `http://127.0.0.1:3200` (placeholder origin `https://ektukhani.example`). Method:
- curl of all 337 sitemap URLs (raw HTML, no JS);
- an HTML scan for schema, labels, buttons and canvases;
- a JS accessibility check on 11 hydrated pages in a real browser;
- deep-link tests and a code read.

No repo files were edited. No third-party scripts and no Lighthouse were run, so there is no Agentic Browsing X/N fraction.

## Scores

| Category | Score | One line |
|---|---|---|
| AI crawler access | 70 | Everything allowed through `*`; no deliberate policy per AI purpose; personal share pages open to training crawlers |
| llms.txt / discovery | 20 | No `/llms.txt`; unknown URLs return real 404s (good) |
| Citability (server HTML) | 88 | Utility pages are excellent: facts, tables, sources and verified dates are in the raw HTML. `/guide` pages duplicate tool pages |
| Entity clarity | 45 | No Organization schema, no Latin "Ektukhani", thin about page, no dates in schema |
| Agentic browsing | 88 | Native buttons, labelled inputs, named canvases, working hash deep links; the deep-link format isn't documented |
| SSR / fetch performance | 85 | 100% prerendered, 13 KB gzipped HTML per tool page; 0.6 MB of uncompressed JS per page |
| **Overall (equal weight)** | **66** | The content is better than the discovery and entity layers |

## Findings

### H1. No Organization entity and no Latin brand name (High)
- **Evidence:**
  - Zero pages contain `"@type":"Organization"`.
  - The home page's `WebSite` node (`app/page.tsx:10`) has no `alternateName`, `publisher`, `logo` or `@id`.
  - "Ektukhani" appears only inside the domain, so a user asking an assistant about "Ektukhani" gives it nothing to match.
  - The tool `WebApplication` nodes (`shared/seo.ts` `websiteSchema`) are not linked to the site.
- **Fix:**
  - In `app/page.tsx`, replace the `WebSite` node with:
    ```js
    { '@type': 'Organization', '@id': `${origin}/#org`, name: 'একটুখানি', alternateName: 'Ektukhani', url: origin, logo: `${origin}/icon.svg`, description: brand.description, sameAs: [/* social profiles once they exist */] },
    { '@type': 'WebSite', '@id': `${origin}/#website`, name: 'একটুখানি', alternateName: 'Ektukhani', url: origin, inLanguage: 'bn-BD', publisher: { '@id': `${origin}/#org` } },
    ```
  - In `shared/seo.ts` `websiteSchema`, add `isPartOf: {'@id': origin+'/#website'}` and `publisher: {'@id': origin+'/#org'}` to `WebApplication`.
  - Show the Latin name once in visible text: footer (`shared/site-shell.tsx:19`) `একটুখানি (Ektukhani)` and the about page.

### H2. Robots depends on `SITE_URL`; a deploy without it blocks everything (High, deploy risk)
- **Evidence:** `app/robots.ts` returns `Disallow: /` when `SITE_URL` is unset, and `shared/seo.ts` emits `noindex,nofollow` on every page. That is a good staging guard, but in production it fails silently.
- **Fix:**
  - Keep the guard.
  - Make the production build fail when `SITE_URL` is missing, for example a check in `next.config.ts` with an explicit `ALLOW_NO_SITE_URL` escape hatch.
  - After deploy, check `curl /robots.txt` shows `Allow: /`.

### H3. No deliberate AI crawler policy; personal share pages open to training crawlers (High)
- **Evidence:**
  - The only group is `User-Agent: * / Allow: / / Disallow: /api/`.
  - `/s/<id>` (`app/s/[id]/page.tsx`) renders text users typed, such as names and wishes.
  - `noindex` is a search directive. It does not stop training crawlers from collecting the text.
- **Fix:** Use explicit named groups, and block only `/s/` from training crawlers (see "Proposed robots.txt").

### M1. 111 `/guide` pages largely duplicate their tool pages (Medium)
- **Evidence:**
  - On average, 74% of a `/x/guide` page's sentences also appear on `/x` (all 111 measured).
  - Guide pages have 750–1,600 characters of main text and a self-canonical, via `app/[tool]/guide/page.tsx` → `pageMetadata(..., {path:'/guide'})`.
  - Search engines and AI retrieval then see two competing URLs for the same how-to answer.
- **Fix:**
  - In `app/[tool]/guide/page.tsx` `generateMetadata`, set `alternates: { canonical: `/${site.slug}` }`.
  - Drop `/${slug}/guide` from `app/sitemap.ts`. The `/privacy` pages are tool-specific and fine; optionally drop them from the sitemap too.

### M2. Visible "verified" dates aren't in the metadata (Medium)
- **Evidence:** `jomi`, `bidyut-bill`, `bhara`, `gpa` and `tokhon-ekhon` all show a date like "যাচাই ১১ অক্টোবর ২০২৬". The schema has no `dateModified`, and the sitemap has no `<lastmod>`.
- **Fix:**
  - Add `verified?: string` (ISO date) to `SiteContent` (`shared/site-types.ts`), set from the same constant the component already renders.
  - Emit `dateModified` in `websiteSchema` and `lastModified` in `app/sitemap.ts`.
  - Only for tools that have a real verification date; don't stamp the build date on everything.

### M3. Thin about page: no maker, no contact, no sourcing policy (Medium)
- **Evidence:** `/about` has 762 characters and no schema. It says "অনেক টুল" ("many tools") instead of the count. The per-tool policy of government sources plus a verified date is the site's strongest trust asset, and the about page never mentions it.
- **Fix:**
  - In `app/about/page.tsx`, add who makes the site, a contact, and one paragraph on the sourcing policy. Suggested line: "হিসাবের টুলগুলোর প্রতিটা সংখ্যা সরকারি সূত্র থেকে নেওয়া, পাতায় সূত্রের লিংক আর যাচাইয়ের তারিখ থাকে" ("every number in the calculator tools comes from an official source; each page links the source and shows the verification date"). Link `/jomi`, `/bidyut-bill` and `/bhara` as examples.
  - Add `AboutPage` JSON-LD with `mainEntity: {'@id': origin+'/#org'}`.
  - Show the count from `catalog.length`.

### L1. No `/llms.txt` (Low; its value is debated)
- **The honest position:**
  - Google says Search ignores llms.txt; it neither helps nor hurts.
  - No major AI search provider has confirmed reading other sites' llms.txt files, and log studies show near-zero bot traffic to it.
  - Lighthouse's Agentic Browsing category does score it.
- **Recommendation:** Add it anyway. It costs almost nothing, and here it does a unique job: one English-glossed map of 111 Bangla-only tools, plus the deep-link formats.
- **Fix:**
  - Add `en: string` to `ToolListing` (`lib/catalog.ts`).
  - Create `app/llms.txt/route.ts` that renders the file below: `force-static`, `text/plain; charset=utf-8`, origin from `publicOrigin(process.env.SITE_URL)`, and a 404 when no origin is set.

### L2. Hash deep links work but aren't discoverable (Low)
- **Evidence:** all 111 tools read `location.hash` and follow `hashchange`. Browser tests:
  - `/jomi#v=3&u=katha` → "৩ কাঠা = ৪.৯৬ শতাংশ = ২,১৬০ বর্গফুট = ০.১৫ বিঘা"
  - `/taka-kothay#a=1500` → "এক হাজার পাঁচশো টাকা মাত্র"
  - `/bhara#f=0&t=15` → উত্তরা উত্তর → মতিঝিল, ১০০ টাকা

  The formats exist only in code.
- **Fix:** Document the stable formats in llms.txt (included below). Don't add server-rendered query-param versions; they create an unbounded URL space.

### L3. Home page overstates the tool count by one (Low)
- **Evidence:** `components/home-page.tsx:41` says "আরও {catalog.length}টা" → "আরও ১১১টা" ("111 more") next to the flagship. The flagship is itself in `catalog`, so it should be 110.
- **Fix:** Use `catalog.length - 1`, or drop "আরও".

### L4. JS weight (Low; doesn't affect AI fetches)
- **Evidence:** `/jomi` loads 9 scripts, 618 KB uncompressed. Of the 61 KB raw HTML, 36 KB is the RSC payload. All content is present without JS.
- **Fix:** None needed for GEO. Treat it as a separate performance task if field Core Web Vitals turn out poor.

### L5. Game scores aren't announced (Low)
- **Evidence:** `/kalbaishakhi-aam` has no `aria-live`, `role=status` or `<output>`, so a non-visual agent can't read the score. `/carrom` updates its canvas `aria-label` ("চাল ০/১০, ০ পয়েন্ট") and works.
- **Fix:** Apply the carrom pattern to canvas games that lack a live region.

## Proposed robots.txt

**Recommendation: allow search, user-triggered agents and training.** Bangla everyday knowledge (land units, BERC slabs, metro fares) is thin in training data. Being included is how "১ বিঘা কত শতাংশ" gets answered correctly and attributed to this site.

**Trade-offs:**
- AI answers reuse the content without a click.
- Training crawlers cost some bandwidth (small on a static site behind a CDN).
- There is no licensing revenue to lose.

The one thing to protect is the personal share text on `/s/`. To opt out of training entirely, change `Allow: /` to `Disallow: /` in the training group only. That has no effect on Google Search, AI Overviews, ChatGPT Search or Claude search. `Content-Signal` is a Cloudflare proposal with no confirmed effect; treat it as a stated preference.

```
User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=yes
Allow: /
Disallow: /api/

User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: Claude-SearchBot
User-agent: Claude-User
User-agent: PerplexityBot
User-agent: Perplexity-User
Content-Signal: search=yes, ai-input=yes, ai-train=yes
Allow: /
Disallow: /api/

User-agent: GPTBot
User-agent: ClaudeBot
User-agent: Google-Extended
User-agent: Applebot-Extended
User-agent: CCBot
User-agent: Bytespider
User-agent: cohere-ai
User-agent: Meta-ExternalAgent
Content-Signal: search=yes, ai-input=yes, ai-train=yes
Allow: /
Disallow: /api/
Disallow: /s/

Sitemap: https://ektukhani.example/sitemap.xml
```

**Implementation:**
- `MetadataRoute.Robots` can't emit `Content-Signal`. Either use `rules: [{userAgent:'*', allow:'/', disallow:'/api/'}, {userAgent:[...search], allow:'/', disallow:'/api/'}, {userAgent:[...training], allow:'/', disallow:['/api/','/s/']}]` without that line, or replace the file with `app/robots.txt/route.ts` returning the text above.
- Keep the `SITE_URL` guard.
- Google-Agent and Google-GeminiNotebook ignore robots.txt anyway.
- Facebook's preview crawler isn't named in any group, so link previews keep working.

## Proposed llms.txt

Calculators come first because they're the citable pages. Each Bangla line is `tool.description` verbatim; each English gloss is a new `en` field.

```markdown
# একটুখানি (Ektukhani)

> একটুখানি is a free, Bangla-only website of 111 small tools and games for people in Bangladesh and the diaspora: everyday calculators (land units, electricity bill, metro fare, GPA, age, gold weight), festival cards, quizzes, childhood-nostalgia lists and casual games. No account, no ads, no install; everything runs in the browser.

- Language: Bangla (bn-BD) only. Names and descriptions below are Bangla with an English gloss.
- Calculator figures come from official Bangladeshi sources (Ministry of Land, BERC, DMTCL, education boards, Islamic Foundation, DGHS). Each tool page cites its source and shows the date it was last verified; quote those pages, not this file, for figures.
- Most tools reopen a specific result from the URL hash; see "Deep links".
- About: https://ektukhani.example/about · Privacy: https://ektukhani.example/privacy · All tools: https://ektukhani.example/tools

## হিসাব-নিকাশ (Everyday calculators)
- [জমির মাপ](https://ektukhani.example/jomi): ১ বিঘায় কত শতাংশ, ১ কাঠায় কত বর্গফুট? একটা মাপ লেখো, বাকিগুলো পেয়ে যাবে। (Land unit converter by Ministry of Land standard; 1 bigha = 20 katha = 14,400 sq ft = 33.06 shotangsho.)
- [বিদ্যুৎ বিল কত?](https://ektukhani.example/bidyut-bill): ফ্যান, ফ্রিজ, এসি… কোনটা মাসে কত ইউনিট খায়, আনুমানিক বিলই বা কত? (Electricity bill estimate per appliance at current BERC residential LT-A slab rates.)
- [ভাড়া কত?](https://ektukhani.example/bhara): কোথা থেকে কোথায় যাবে? মেট্রোরেলের দুই স্টেশন বেছে নাও, ভাড়াটা জেনে যাও। (Dhaka Metro Rail fare between any two stations, full DMTCL chart.)
- [রক্তদাতা কার্ড](https://ektukhani.example/rokto): শেষ কবে রক্ত দিয়েছ? দেখো আবার কবে পারবে, বানাও রক্তদাতা কার্ড। (Next eligible blood-donation date, 4 or 6 months, plus donor card.)
- [বয়স কত?](https://ektukhani.example/boyos): জন্মতারিখ দিলেই পাবে বয়স, বাংলা জন্মতারিখ আর চাকরির বয়সসীমার হিসাব। (Age, Bangla-calendar birth date, government job age limit.)
- [ভরির হিসাব](https://ektukhani.example/bhori): মায়ের বালা, নানুর হার… ভরি-আনা-রতিতে ওজন বসাও, গ্রামে কত, জেনে নাও। (Gold weight: bhori, ana, roti to grams.)
- [বাজার নোট](https://ektukhani.example/bazar-note): বাজারের ফর্দ লিখে পাঠাও। যে বাজারে যাবে, সে টিক দিতে দিতে কিনবে। (Shareable grocery list.)
- [ভাগাভাগি](https://ektukhani.example/bhagabhagi): ট্যুর বা মেসের খরচ কে কত দেবে? এক স্লিপে হিসাব মিলিয়ে গ্রুপে পাঠাও। (Group expense splitter.)
- [মাটির ব্যাংক](https://ektukhani.example/matir-bank): রোজ কত জমাবে, কবে ভাঙবে? বেছে নাও, ঈদে ব্যাংকে কত টাকা হয় জেনে নাও। (Daily savings goal.)
- [ধোঁয়াহীন দিন](https://ektukhani.example/dhoyahin): সিগারেট ছেড়েছ কবে? টবের চারায় রোজ নতুন পাতা গজাবে, জমবে বাঁচানো টাকার হিসাবও। (Smoke-free day counter, money saved.)
- [কারেন্ট গেল!](https://ektukhani.example/current-gelo): কারেন্ট গেলে-এলে চাপো, দেখো আজ কত ঘণ্টা অন্ধকারে কাটল। (Power-cut hours logger.)
- [বেতনের ভাগ](https://ektukhani.example/betoner-bhag): বেতনের কত ভাগ কোথায় যায়, টিফিন ক্যারিয়ারের ছয় বাটিতে সাজাও। টাকার অঙ্ক লাগবে না। (Salary budget split by percent.)

## ভাষা আর পড়াশোনা (Language and study)
- [জিপিএ কত?](https://ektukhani.example/gpa): এসএসসি বা এইচএসসির গ্রেড বসাও, ৪র্থ বিষয়সহ জিপিএ হয়ে যাবে তখনই। (SSC/HSC GPA with 4th-subject rule.)
- [টাকা কথায় লিখি](https://ektukhani.example/taka-kothay): অঙ্ক লিখলেই কথায় পাবে, বাংলায় আর ইংরেজিতে। চেক বা ফর্মে বসাতে কপি করে নাও। (Amount in words, Bangla and English.)
- [শব্দ সাজাই](https://ektukhani.example/shobdo-khela): সূত্র পড়ে টুকরো জুড়ে শব্দ বানাও। রোজ ৫টা নতুন, সবার জন্য একই। (Daily Bangla word puzzle.)
- [শুদ্ধ বানান কোনটি?](https://ektukhani.example/banan): পোশাক না পোষাক? সাইনবোর্ডে দুই বানান, শুদ্ধটা বেছে নাও। ১০টায় কয়টা পারো? (Bangla spelling quiz.)
- [দেশ চেনো](https://ektukhani.example/desh-cheno): ক্লাসের চার্ট পেপারে দেশের ১০টা প্রশ্ন, প্রতিটা ঠিক উত্তরে একটা সোনালি তারা। (Bangladesh general-knowledge quiz.)
- [বাগধারার ছবি](https://ektukhani.example/bagdhara): ভিজে বিড়াল, অরণ্যে রোদন… মজার ছবি দেখে ১০টা বাগধারার আসল মানে বলো। (Bangla idioms quiz.)
- [বাংলা টাইপিং স্পিড](https://ektukhani.example/bangla-typing): ফোনের বাংলা কিবোর্ডে ৬০ সেকেন্ড টাইপ করো, মিনিটে কয়টা শব্দ উঠল গুনে নাও। (Bangla typing speed test.)
- [নামতা চ্যালেঞ্জ](https://ektukhani.example/namta): ২ থেকে ২০-এর নামতা খেলো, ১০টা গুণ। ভুল হলে স্লেটে ঠিকটা দেখাবে। (Multiplication tables 2–20.)

## উৎসব আর বিশ্বাস (Festivals and faith)
- [সেহরি-ইফতারের সময়](https://ektukhani.example/sehri-iftar): তোমার জেলায় সেহরি-ইফতার কখন? সময় আসে শুধু ইসলামিক ফাউন্ডেশনের সূচি থেকে। (Sehri/iftar times by district, Islamic Foundation schedule only.)
- [কত দিন বাকি?](https://ektukhani.example/koto-din-baki): ঈদ, পূজা, বড়দিন, বৈশাখ বা নিজের কোনো দিন, আসতে আর কত দিন বাকি? (Countdown to Eid, Puja, Christmas, Boishakh or any date.)
- [গরুর ওজন কত?](https://ektukhani.example/gorur-ojon): ফিতায় বুকের বেড় আর দৈর্ঘ্য মাপো, দেখো গরুর আনুমানিক ওজন কত মণ। (Cattle weight from girth and length, in maund.)
- [শুভেচ্ছা কার্ড](https://ektukhani.example/shubhechha): ঈদ, বিজয়া, নববর্ষ, জন্মদিন… নাম বসিয়ে কার্ড বানাও, প্রোফাইল ফ্রেমও আছে। (Festival greeting cards and profile frames.)
- [ইফতারির প্লেট](https://ektukhani.example/iftar-plate): খেজুর, ছোলা, পেঁয়াজু, বেগুনি… যা যা খাবে সব তুলে নিজের ইফতারির প্লেট সাজাও। (Build your iftar plate.)
- [সালামির চেক](https://ektukhani.example/salami-chek): মামা-খালার কাছে খেলনা চেকে সালামি চাও, পরে খাতায় লিখে রাখো এবার কে কে দিল। (Toy Eid salami cheque and log.)
- [ঈদের দিন](https://ektukhani.example/eider-din): নতুন জামা, সেমাই, সালামি… ঈদের দিনে কয়টা হলো? টিক দিলে মেহেদির হাত রাঙবে। (Eid-day checklist.)
- [ঈদযাত্রা](https://ektukhani.example/eidjatra): ঈদে বাড়ি যেতে কত ঘণ্টা লাগল? কোথা থেকে কোথায়, কীসে, বললেই আঁকা হবে পথ। (Eid journey-home map card.)
- [মণ্ডপ ঘুরি](https://ektukhani.example/mondop): পূজায় কয়টা মণ্ডপ ঘুরলে? প্রতিটায় + চাপো, চালচিত্রে একটা করে প্রদীপ জ্বলবে। (Puja pandal counter.)

## পরিবার আর প্রবাস (Family and diaspora)
- [কে কী হয়?](https://ektukhani.example/attiyo): চাচা না কাকা, খালা না মাসি? কে তোমার কী হয়, দুই ঘরের ডাক পাশাপাশি মিলবে। (Bangla kinship terms, Muslim and Hindu usage.)
- [দাওয়াতে কত দেব?](https://ektukhani.example/upohar): বিয়ের দাওয়াতে খামে কত দেবে? সম্পর্ক আর মেনু বলো, হালকা একটা আন্দাজ পাবে। (Wedding gift-money suggestion, light-hearted.)
- [দাওয়াত কার্ড](https://ektukhani.example/dawat): বিয়ে, হলুদ, আকিকা, জন্মদিন: নাম-তারিখ বসাও, সোনালি কার্ড মেসেঞ্জারে পাঠাও। (Invitation card maker.)
- [দেশে ফেরা](https://ektukhani.example/deshe-fera): কত বছর প্রবাসে, কয়টা ঈদ দূরে? ট্যাগে লিখে পাঠাও, বাড়ির সবাই ফেরার দিন গুনবে। (Expat homecoming countdown.)
- [চিঠি লিখি](https://ektukhani.example/chithi): আম্মু, প্রবাসী ভাই বা বন্ধুকে পুরোনো দিনের মতো হলুদ খামে একটা চিঠি লেখো। (Old-style letter card.)
- [প্রবাস জীবন](https://ektukhani.example/probash): ভিডিও কলে ঈদ, লাগেজে শুঁটকি, একা ইফতার… প্রবাসের কয়টা মুহূর্ত তোমার? (Diaspora-life checklist.)
- [আমার প্রথম আয়](https://ektukhani.example/prothom-ay): প্রথম আয়ের টাকায় কী করেছিলে? তিনটা উত্তরে বানাও নিজের বাদামি খাম। (First-salary memory card.)

## স্মৃতি আর গল্প (Memories)
- [আমার ছোটবেলা](https://ektukhani.example/amar-chhotobela): আলিফ লায়লা, হারিকেন, সালামি… ৩৬টা চেনা স্মৃতির কয়টা তোমার ছোটবেলায় ছিল? (Flagship: 36 Bangladeshi childhood memories.)
- [দাম তখন আর এখন](https://ektukhani.example/tokhon-ekhon): জন্মসালের ১০০ টাকা এখন কত? সাল বেছে নাও, আব্বুর পুরোনো মানিব্যাগ খুলে দেখো। (Taka inflation, past money today.)
- [আমাদের ভাষার ছবিখাতা](https://ektukhani.example/bhashar-chhobi): পেয়ারাকে তোমাদের ওখানে কী বলে? নিজের জেলার শব্দে কার্ড বানাও, বন্ধুরটার সাথে মেলাও। (Regional dialect words by district.)
- [হুমায়ূনের বই](https://ektukhani.example/himu): হুমায়ূন আহমেদের ৩০টা চেনা বইয়ের কয়টা পড়েছ? তাকে সাজিয়ে বন্ধুদের সাথে মেলাও। (Humayun Ahmed books checklist.)
- [আমার বছর](https://ektukhani.example/amar-bochhor): তোমার বছরের খাবার, জায়গা আর শব্দ বেছে বার্ষিকীর প্রচ্ছদ বানাও। (Year-in-review cover.)
- [আমার ক্যাসেট](https://ektukhani.example/cassette): প্রিয় দশটা গানে সাইড A আর সাইড B সাজাও, হাতে লেখা জে-কার্ডের ছবি বানাও। (Mixtape J-card.)
- [হল-মেস জীবন](https://ektukhani.example/mess-jibon): ডিম-ডাল সপ্তাহ, রাত দুটোর ম্যাগি… হল-মেসের ৪০টা মুহূর্তের কয়টা তোমার? (Hall/mess life checklist.)

## খাবারদাবার (Food)
- [আমাদের রান্নাখাতা](https://ektukhani.example/rannakhata): মা-নানির হাতের রান্নাটা হারিয়ে যেতে দিয়ো না। গল্পসহ খাতায় লিখে রাখো। (Family recipe notebook.)
- [মিষ্টির বাক্স](https://ektukhani.example/mishtir-baksho): চমচম, কাঁচাগোল্লা, বগুড়ার দই… দেশের ৪০টা নামকরা মিষ্টির কয়টা খেয়েছ? (40 famous sweets checklist.)
- [পিঠা চেনো?](https://ektukhani.example/pitha): ছবি দেখে ১০টা শীতের পিঠার নাম বলো। অন্য এলাকায় কী নামে ডাকে, তাও জানবে। (Winter pitha picture quiz.)
- [টং-এর অর্ডার](https://ektukhani.example/tong): দুধ চা না রং চা, সাথে বিস্কুট না সিঙ্গারা? চিরকুটে অর্ডার লেখো, বন্ধুরাও যোগ করুক। (Shared tea-stall order.)
- [মাছে-ভাতে](https://ektukhani.example/mache-bhate): ইলিশ, পাবদা, লইট্টা… ৪০টা দেশি মাছের কয়টা খেয়েছ? বাঁশের ডালায় তুলে ফেলো। (40 local fish checklist.)
- [জিভ কোন জেলার?](https://ektukhani.example/jibh): ৬টা খাবার বেছে নাও, বোঝা যাবে তোমার জিভের টিকিট কোন জেলায় কাটা। (Which district's food you are, quiz.)

## খেলাধুলা (Sports)
- [চলো খেলি](https://ektukhani.example/cholo-kheli): কানামাছি থেকে লুডু: কয়জন আছ আর ঘরে না মাঠে, বললেই একটা খেলা জুটে যাবে। (Traditional game picker.)
- [আর্জেন্টিনা না ব্রাজিল?](https://ektukhani.example/argentina-na-brazil): ছাদে নিজের দলের পতাকা তুলে ৮ প্রশ্নের আসল ফ্যান পরীক্ষা দাও। (Argentina vs Brazil fan quiz.)
- [আমার জার্সি](https://ektukhani.example/amar-jersey): জার্সির পিঠে নিজের নাম আর নম্বর বসাও, তারপর প্রোফাইল ছবি বা পোস্ট বানাও। (Custom jersey image.)
- [দম আটকানো ম্যাচ](https://ektukhani.example/dom-atkano): জয় আর কষ্টের সেই ম্যাচগুলো কতটা মনে আছে? বাংলাদেশ ক্রিকেটের ১০টা প্রশ্ন। (Bangladesh cricket quiz.)
- [গলির ক্রিকেটের আইন](https://ektukhani.example/golir-ain): ছাদে মারলে আউট, ড্রেনে পড়লে ছয়… তোমার গলির আইনগুলো টিক দিয়ে পোস্টার বানাও। (Street-cricket rules poster.)
- [শেষ বলে ছয়](https://ektukhani.example/shesh-bol): শেষ বলে দরকার ৫ রান। ঠিক সময়ে মারো, ছক্কা হাঁকিয়ে ম্যাচ জেতাও। (Last-ball six timing game.)
- [আমি বলেছিলাম!](https://ektukhani.example/ami-bolechhilam): খেলার আগে কে জিতবে লিখে খামে সিল করো, শেষে খুলে বলো: আমি বলেছিলাম! (Sealed match prediction.)
- [ম্যাচের মন](https://ektukhani.example/matcher-mon): ক্রিকেট বা ফুটবল দেখতে দেখতে মনের মুখে চাপো, গ্রাফে আঁকা হবে মনের ওঠানামা। (Live match mood graph.)
- [স্বপ্নের একাদশ](https://ektukhani.example/ekadosh): পেলে থেকে মেসি, কোচের বোর্ডে নিজের সর্বকালের সেরা একাদশ সাজাও, বন্ধুর সাথে মেলাও। (All-time football XI.)
- [রাত জেগে খেলা](https://ektukhani.example/raat-jaga): বিশ্বকাপের ২০টা মাঝরাতের ম্যাচের কয়টা জেগে দেখেছ? দাগাও, আকাশ ভরবে তারায়। (World Cup late-night matches checklist.)

## মজা আর কুইজ (Fun and quizzes)
- [কয়টা কমন পড়ল?](https://ektukhani.example/komon-porlo): বিয়ে কবে? রেজাল্ট কত? আত্মীয়দের এসব চেনা প্রশ্নের কয়টা তোমার কপালে জুটল? (Relatives' nosy-questions bingo.)
- [এটা না ওটা](https://ektukhani.example/eta-na-ota): ফুচকা না চটপটি, কাচ্চি না তেহারি… ১২টা তর্কে পক্ষ নাও, জানা যাবে কারা তোমার দলে। (This-or-that food polls.)
- [চায়ের কাপে হিসাব](https://ektukhani.example/cha-mudra): একটা দাম লেখো, সেই টাকায় কত কাপ চা আর কয়টা সিঙ্গারা হয়, হিসাব পাবে। (Price in cups of tea.)
- [ফ্লেমস](https://ektukhani.example/flames): খাতার শেষ পাতার সেই খেলা: দুটো নাম লেখো, মিলের অক্ষর কাটো, গুনে দেখো কী আসে। (FLAMES name game.)
- [জ্যামে জীবন](https://ektukhani.example/jam): রোজ কত মিনিট জ্যামে কাটে? হিসাব করলে জীবনের কত দিন যায়, কত কাপ চা হতো। (Lifetime lost in traffic.)
- [গানের কলি](https://ektukhani.example/ganer-koli): হাঁড়ি থেকে অক্ষর তোলো, ৩০ সেকেন্ডে গান ধরো, স্কোর রাখো এক ফোনে। (Antakshari-style song game.)
- [আজকের ধাঁধা](https://ektukhani.example/dhadha): নানির মুখে শোনা পুরোনো ধাঁধা, রোজ একটা। তিন উত্তরের একটা ঠিক, পারো তো? (Daily traditional riddle.)
- [এক কোটি টাকা খরচ করো](https://ektukhani.example/ek-koti): হাতে এক কোটি টাকা! এক কাপ চা থেকে আম্মুর বাড়ি, কী কিনবে? ভ্যান ভরে ফেলো। (Spend 1 crore taka.)
- [মামা, যাবেন?](https://ektukhani.example/mama-jaben): রিকশার মামার সাথে দরদাম করো, ন্যায্য ভাড়ায় রাজি করাতে পারো? (Rickshaw haggling game.)
- [দেশি মিশ্রণ](https://ektukhani.example/mishron): দুটো জিনিস মেশাও, নানির হাঁড়ি থেকে নতুন কিছু উঠবে। পানি + চাল = ভাত, তারপর? (Combine-items crafting game.)
- [গ্রেড দাও](https://ektukhani.example/grade-dao): ফুচকা, বর্ষা, লোকাল বাসকে A+ থেকে F দাও, দেখো দেশ কত দিল। (Grade everyday things, crowd results.)

## নিজেকে জানো (Personality, for fun)
- [কবে বিয়ে হবে?](https://ektukhani.example/biye-kobe): ঘটকের ৬টা দুষ্টু প্রশ্নের উত্তর দাও, বিয়ের মজার রিপোর্ট পাবে। শুধু মজা, আর কিছু না। (Joke marriage-prediction quiz.)
- [ডাকনাম কী হতো?](https://ektukhani.example/daknam): বড় না ছোট, চঞ্চল না শান্ত? তিন চাপে জানা যাবে ছোটবেলায় তোমার ডাকনাম কী হতো। (Nickname generator.)
- [মনের বয়স কত?](https://ektukhani.example/moner-boyos): রেডিও না রিল, হাঁটা না রিকশা? ৮টা পছন্দ বলো, মেলার মেশিন বলে দেবে মনের বয়স। (Mental-age quiz.)
- [তুমি কোন ভর্তা?](https://ektukhani.example/bhorta): ৬টা মজার প্রশ্নে শিলপাটায় বেটে দেখো, তুমি আলু, বেগুন না শুঁটকি ভর্তা। (Which bhorta are you.)
- [আমাকে কতটা চেনো?](https://ektukhani.example/koto-cheno): ৮টা প্রশ্নে নিজের স্লাম বুক লেখো, বন্ধুরা আন্দাজ করুক কে তোমাকে বেশি চেনে। (How-well-do-you-know-me.)
- [চার প্রিয়](https://ektukhani.example/char-priyo): নাটক, সিনেমা, বই বা গান: প্রিয় চারটা তাকে সাজাও, বন্ধুর সাথে মিলিয়ে নাও। (Top-four favourites.)
- [জেন-জি না আব্বু-আম্মু?](https://ektukhani.example/projonmo): জেন-জির শব্দ না আব্বু-আম্মুর কথা, কোনটা বেশি বোঝো? ১০টা শব্দে দেখে নাও। (Gen-Z vs parents' slang quiz.)
- [দেশি স্টার্টার প্যাক](https://ektukhani.example/starter-pack): ভার্সিটি, প্রবাসী, বৃষ্টির দিন… মেলার খেলনার প্যাকেটের মতো নিজের স্টার্টার প্যাক বানাও। (Starter-pack image.)
- [আড্ডায় তুমি কে?](https://ektukhani.example/adda): কুইন, স্ট্রাইকার, সাদা না কালো? ৭টা প্রশ্নে বের করো আড্ডায় তুমি কোন গুটি। (Which carrom piece are you.)

## আঁকো আর সাজাও (Draw and decorate)
- [ছোট্ট পাড়া](https://ektukhani.example/chhotto-para): টিনের ঘর, আমগাছ, টিউবওয়েল… নিজের পাড়া সাজিয়ে পাঠাও পুরোনো দিনের পোস্টকার্ড। (Village postcard builder.)
- [আলপনা আঁকি](https://ektukhani.example/alpana): তৈরি নকশা বেছে নাও, নয়তো আঙুলে আঁকো। ছবিটা হবে উঠোনে আঁকা আলপনার মতো। (Alpana drawing.)
- [রিকশার রং](https://ektukhani.example/riksharong): রিকশার পেছনের বোর্ডে ময়ূর, ফুল আর নিজের কথা লিখে রাঙাও। (Rickshaw-art panel.)
- [সিনেমার পোস্টার](https://ektukhani.example/cinema-poster): পুরোনো দিনের হাতে আঁকা সিনেমার পোস্টার, এবার তোমার নামে। বন্ধু হবে সহশিল্পী। (Retro film poster with your name.)
- [নামের ডিজাইন](https://ektukhani.example/namer-design): নাম লেখো, ঢং বেছে নাও: আলপনা, চক, নিয়ন বা নকশি সুতোয় তোমার নাম। (Bangla name art.)
- [ঘুড়ি আর ফানুস](https://ektukhani.example/ghuri): নিজের ঘুড়ি বা ফানুস বানাও, নাম লেখো, সাকরাইনের আকাশে ওড়াও। (Kite and lantern designer.)
- [স্টুডিওর ছবি](https://ektukhani.example/studior-chhobi): পাড়ার স্টুডিওর আঁকা পর্দার সামনে ছবি তোলো, কোণে থাকবে সেই কমলা তারিখ। (Retro photo-studio backdrop.)

## গেম (Games)
- [ক্যারম](https://ektukhani.example/carrom): স্ট্রাইকার টেনে ছাড়ো, গুটি ঢোকাও। একা দশ চাল, নয়তো দুজনে এক ফোনে। (Carrom.)
- [সাপলুডু](https://ektukhani.example/sap-ludu): ছক্কা চাপো, সিঁড়িতে ওঠো, সাপ এড়াও। এক ফোনে ২–৪ জন, বা একা খেলে বন্ধুকে পাঠাও (Snakes and ladders.)
- [বাঘবন্দি](https://ektukhani.example/baghbandi): দুই বাঘ, বিশ ছাগল, উঠোনের ছক। ছাগল হয়ে বাঘ আটকাও, নয়তো বাঘ হয়ে ছাগল ধরো (Tigers-and-goats board game.)
- [ছক-জোড়া](https://ektukhani.example/chhok-jora): কাঁথায় ফোঁড় দাও, ঘর জিতে ফুল ফোটাও। দুজনে বা বটের সাথে খেলো (Dots and boxes.)
- [ডাংগুলি](https://ektukhani.example/danguli): কাঠি তোলো, মারো জোরে! তিন মারে কত ডাং যায় দেখো, বন্ধুকে একই মাঠে ডাকো। (Tip-cat.)
- [ভো-কাট্টা](https://ektukhani.example/vo-katta): সাকরাইনের ছাদে ঘুড়ি ওড়াও, প্যাঁচ লাগাও, মাপমতো টানে বলো ভো-কাট্টা! (Kite fighting.)
- [বাইচের নৌকা](https://ektukhani.example/baicher-nouka): ঢোলের তালে চাপো, কচুরিপানা এড়াও, তিন নৌকার আগে ঘাটে পৌঁছাও (Boat-race rhythm game.)
- [কালবৈশাখী আম](https://ektukhani.example/kalbaishakhi-aam): ঝড়ে আমগাছ দুলছে, ডালা পেতে আম ধরো। শুকনো ডাল কিন্তু ধরো না! (Catch mangoes in a storm.)
- [দুধ উথলানোর আগে](https://ektukhani.example/dudh-uthlano): ফেনা উঠছে! উথলানোর ঠিক আগে পাতিল নামাও, কিনারার যত কাছে তত নম্বর। (Milk boil-over timing.)
- [ঝালমুড়ি সাপ](https://ektukhani.example/jhalmuri-sap): সাপ চালাও, মুড়ি-চানাচুর খাও, বন্ধুকে একই ঠোঙা পাঠাও (Snake game.)
- [অ্যান্টেনা ঠিক করো](https://ektukhani.example/antenna-thik-koro): ছাদের অ্যান্টেনা ঘুরিয়ে ঝিরঝির টিভিতে ছবি আনো, ৯০-এর মতো। (Tune the TV antenna.)
- [স্যার ঘুরলেই থামো](https://ektukhani.example/sir-ghurlei-thamo): স্যার বোর্ডে লিখলে চিরকুট পেছনে চালাও, ঘুরলেই থামো। কত সেকেন্ডে শেষ বেঞ্চ? (Pass notes past the teacher.)
- [দেরি হয়ে গেল!](https://ektukhani.example/deri-hoye-gelo): স্কুলে দেরি! কাদাপানি, গরু, সাইকেল টপকে ঘণ্টা পড়ার আগে গেটে পৌঁছাও। (Late-for-school runner.)
- [চোর-ডাকাত-পুলিশ-বাবু](https://ektukhani.example/chor-police): থালায় চার চিরকুট, এক ফোনে চারজন। লুকিয়ে দেখো, পুলিশ চোর ধরবে। (Chor-Police chit game.)
- [বস্তার পাহাড়](https://ektukhani.example/bostar-pahar): ক্রেনের দোল বুঝে চাপো, ট্রাকে বস্তার পাহাড় বানাও (Sack stacking.)
- [তারের ফাঁকে বেলুন](https://ektukhani.example/tarer-fanke-belun): ঢাকার তারের জটে বেলুন ওড়াও। এক চাপে ওঠে, কয়টা ফাঁক পার হবে? (Balloon through tangled wires.)
- [পাকা-কাঁচা](https://ektukhani.example/paka-kancha): আম দেখে দেখে লুকানো ৪ অঙ্কের কোডটা ৭ বারে ধরো, রোজ নতুন কোড। (Daily code-breaker.)
- [জোড়া মেলাও](https://ektukhani.example/jora-melao): মেলার খেলনা উল্টে রাখা, দুটো করে খুলে জোড়া মেলাও। একা বা এক ফোনে দুজনে। (Memory match.)
- [চড়ুই তাড়াও](https://ektukhani.example/churui-tarao): পাকা ধানে চড়ুই নামছে, চেপে হুশ করে তাড়াও। ৪৫ সেকেন্ডে কত ধান বাঁচাবে? (Shoo sparrows.)
- [হাঁড়িভাঙা](https://ektukhani.example/handi-bhanga): লাঠিতে বল ফিরিয়ে মেলার সব হাঁড়ি ভাঙো, বন্ধুকে একই সারি পাঠাও (Breakout-style.)
- [পিয়নের সাইকেল](https://ektukhani.example/peoner-cycle): ভোরের মেঠো পথে সাইকেলে চিঠি বিলি করো, গরু-ছাগল আর কাদা পাশ কাটিয়ে। (Postman cycling.)
- [ভাংতি নাই!](https://ektukhani.example/bhangti-nai): দোকানে দশজন খদ্দের, সবার হাতে বড় নোট। ঝটপট হিসাব করে ঠিক ভাংতি ফেরত দাও। (Give correct change.)
- [জ্যাম ছাড়াও](https://ektukhani.example/jam-chharao): জ্যামে আটকা সবুজ CNG। রিকশা, বাস, ট্রাক সরিয়ে পথ করে দাও, ৪০টা জ্যাম (Traffic sliding-block puzzle.)
- [শব্দ খোঁজা](https://ektukhani.example/shobdo-khoja): অক্ষরের গ্রিডে লুকানো ছয়টা ফুল, মাছ বা নদীর নাম খুঁজে কলমের দাগে কাটো (Bangla word search.)
- [পাটি বুনি](https://ektukhani.example/pati-buni): বেতের ফালি বসিয়ে সারি ভরাও, নিজের শীতলপাটি বোনো (Mat-weaving puzzle.)

## Deep links
State is read from the URL fragment after the page loads. ASCII digits only.
- Land: `/jomi#v=3&u=katha` (u = shotangsho | katha | bigha | acre | sqft | sqm | chhotak)
- Amount in words: `/taka-kothay#a=1500`
- Metro fare: `/bhara#f=0&t=15` (station index, Uttara North = 0 … Motijheel = 15)
- Gold weight: `/bhori#g=15&it=bala&w=ma` (g = grams)

## Optional
- [সব টুল](https://ektukhani.example/tools): Full searchable directory.
- [গোপনীয়তা](https://ektukhani.example/privacy): What is stored and where; each tool also has /<slug>/privacy.
```

Only list a deep-link format in that section if a parse test in `tools/*/tests` covers it.

## Markdown and other representations
None exist. **Don't add them now.** The server HTML is already clean, semantic and small, so `.md` twins would only add a second copy to keep in sync. The same goes for `ai-catalog.json`, `/.well-known` agent files and WebMCP: none of them apply to a site with no accounts and no transactions.

## What already works
- **Fully prerendered.** All 337 URLs return 200 in under 30 ms. Facts, tables, FAQ and sources are in the raw HTML, so crawlers that don't run JS get the full answer.
- **Quotable facts with sources and dates near the top of the page:**
  - `/jomi`: "১ বিঘা = ৩৩.০৬ শতাংশ = ২০ কাঠা = ১৪,৪০০ বর্গফুট", with the Ministry of Land source and "যাচাই ১১ অক্টোবর ২০২৬". It correctly says 33.06, not the colloquial 33.
  - `/bidyut-bill`: the full BERC LT-A slab table (lifeline ০–৫০ ৪.৬৩, ০–৭৫ ৫.২৬ … ৬০০+ ১৭.৩৫), demand charge, 5% VAT and BERC memo numbers.
  - `/rokto`: the 4/6-month interval, with the DGHS adviser and the WHO 12/16-week minimums explained.
  - `/bhara`: a 33-row fare table with the DMTCL document date and check date.
  - `/sehri-iftar`: honestly shows no times until the Islamic Foundation publishes them.
- **Disclaimers sit next to the facts**, such as local bigha variation and "the blood bank decides".
- **Accessibility, from the browser check on 11 pages** (`/`, `jomi`, `bidyut-bill`, `rokto`, `bhara`, `gpa`, `amar-chhotobela`, `carrom`, `sehri-iftar`, `tools`, `kalbaishakhi-aam`):
  - no controls without an accessible name, and no pointer-cursor divs;
  - every page has `main`, `header`, `footer` and labelled `nav`;
  - steppers have specific labels ("সিলিং ফ্যান: কয়টা কমাও"), and toggles use `aria-pressed`;
  - every scanned input is wrapped in a `<label>`;
  - canvases have `role=img` with descriptive labels; decorative meters are `aria-hidden`;
  - results update through live regions.
- **Deep links:** every tool restores its state from the hash (with tests) and follows `hashchange`.
- **Schema already present:** `WebApplication` (free, 0 BDT), `BreadcrumbList` and `FAQPage` on every tool; `CollectionPage` with an `ItemList` of all 111 on the home page; `bn-BD` throughout.
- **Hygiene:**
  - unknown URLs return real 404s;
  - `/s/*` pages are `noindex`, and `/api/` is disallowed;
  - canonicals are absolute;
  - titles describe the task ("জমির মাপ — শতাংশ, কাঠা, বিঘা হিসাব").

## Third-party checklist note
The claude-seo v2.4.2 files were used only as reference criteria. These instructions in them were ignored:
- run `scripts/claude-seo …` (Lighthouse/PSI, DataForSEO, Google APIs, PDF reports);
- run `npx lighthouse@latest`;
- "Always offer PDF generation";
- write output to `{domain}-audit/`;
- spawn subagents.

Nothing in them tried to override safety rules or send data anywhere. Their statistics are unverified third-party figures and weren't used in the scores.
# বাংলা লেখার শেষ রিভিউ (final copy review)

The owner reads the site and still finds places where the Bangla sounds robotic, like a translation or a manual, not like people talk. This review fixes that across every tool and the site shell. It builds on `research/bangla-voice-guide.md` (read it first; its rules still hold). This file adds what we actually found in the copy, and how to fix it.

## The bar

Read every line out loud as if you were a 22-year-old in Dhaka posting on Facebook, or an আপু explaining it to a younger cousin. If you wouldn't say it that way, rewrite it.

- **Real, warm, specific.** Emotion comes from a small true detail ("নানুর হাতের পিঠা", "লোডশেডিংয়ে হাতপাখা"), not from adjectives.
- **No exaggeration, no ad voice.** No "অসাধারণ", "জীবন বদলে দেবে", "সেরা অভিজ্ঞতা", piles of "!" or emoji. One honest line beats three loud ones.
- **Short.** One idea per sentence. Most sentences under 15 words. A step is one action.
- **Bangladeshi চলিত, the way people speak.** তুমি always.

## What we found, and how to fix it

| Pattern found in the copy | Why it reads robotic | Fix |
|---|---|---|
| Long steps that pack 3–4 actions and list every option ("শতাংশ, কাঠা, বিঘা, একর, বর্গফুট, বর্গমিটার না ছটাক বেছে নাও") | Reads like a manual | One action per step. Don't list every option; the screen shows them. "এককটা বেছে নাও।" |
| The same boilerplate in many tools: "পোস্ট না স্টোরি বেছে নিয়ে শেয়ার করো বা ছবিটা নামিয়ে রাখো" (48×), "লিংক পেলে বন্ধু…" (67×), "চাইলে…" (175×), "সাথে সাথে" (41×), "যেকোনো" (40×) | Template feel; every tool sounds the same | Cut it where the screen already explains it. Vary it. Use each tool's own world ("চিরকুটটা বন্ধুদের পাঠাও, ওরাও অর্ডার দিক।"). Keep "চাইলে" only where the choice is truly optional and worth saying. |
| Em dashes "—" everywhere (322×), semicolons | Written English punctuation; Bangla speech doesn't pause that way | Use "।" and commas. A dash only where a speaker would really pause (titles may keep one). |
| Translated English structure: "এখানে তুমি … করতে পারবে যা …", "… এর মাধ্যমে", "… করার জন্য", noun piles ("হিসাবের ফলাফল প্রদর্শন") | Calque | Say it the Bangla way: verb first or last, subject dropped when obvious. "মাপ লেখো, বাকিটা নিজেই হিসাব হয়ে যাবে।" |
| Bookish/তৎসম words where a spoken word exists (প্রদান, নির্বাচন, সম্পূর্ণ, প্রদর্শিত, অবশিষ্ট, ব্যতীত, পুনরায়, ইত্যাদি) | Formal register | দাও, বেছে নাও, পুরো, দেখাবে, বাকি, ছাড়া, আবার, এমন আরও। Keep a formal word only where it's the normal word (রক্তদাতা, বিদ্যুৎ বিল, আনুমানিক, সম্ভাব্য for moon dates). |
| Tap verbs: "ছুঁয়ে দাও", "স্পর্শ করো" | Poetic/translated | "চাপো", "চাপ দাও", or "ট্যাপ করো". Use "ছুঁয়ে" only where touch is the point of the metaphor. |
| Over-explaining privacy and links in every paragraph | Nervous, legal | Privacy text says it once, plainly: what stays on the phone, what a shared link carries. Keep it accurate. |
| Human lines (result lines) that are generic or forced-rhyme | Machine "cleverness" | A line a friend would actually comment. Specific, a little witty, kind. |
| English words people don't say in Bangla, or Bangla words nobody uses for common English ones | Unnatural | Write the word people say: শেয়ার, লিংক, ডাউনলোড, ফোন, স্টোরি, পোস্ট, টিম, ম্যাচ. |

## What must NOT change

- **Facts:** numbers, dates, rates, rules, sources, spellings in data lists, "সম্ভাব্য" labels, safety lines ("রক্ত দেওয়ার আগে ব্লাড ব্যাংক তোমাকে পরীক্ষা করবে"), "আনুমানিক" labels.
- **Ids and link formats:** anything stored in links or tallies (ids, codes, hash keys) and the order of append-only lists. Change only the visible label text.
- **Privacy meaning:** you may simplify the privacy text, never change what it promises.
- **SEO limits:** title keyword-first and short (keep the current title unless it reads badly), description 120–160 characters, unique H1, FAQ ≥ 5 entries written the way people search. `npm run check:pages` requires unique titles, descriptions and H1s across the site.
- **Tool names** (they live in `lib/catalog.ts`, owned by the site-wide reviewer).

## Where copy lives in a tool

- `tools/<slug>/content.ts`: title, description, H1/headline, intro, steps, FAQ, privacy, guide text.
- `tools/<slug>/components/*.tsx`: every visible string, button, label, placeholder, empty state, error, banner, `aria-label`.
- `tools/<slug>/lib/*.ts`: human lines, captions, card text drawn on canvas, share preview titles and descriptions, banners.
- `tools/<slug>/share.ts`: preview text.

## Tests and cards

- Some tests pin exact copy. When a test only pins wording, update the expected string to the new copy. Never weaken a test that checks logic, ids, caps, round-trips or safety.
- Canvas text is fitted (`fitText`/`wrapText`), but a much longer line can still crowd a card. After changing card text, screenshot the card and look at it.

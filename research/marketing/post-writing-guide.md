# How to write our posts (for the post copywriters)

Every post, status and caption is Bangla that a real person would write on their own timeline: emotional, specific and honest, with no ad voice and no exaggeration. Read `research/bangla-voice-guide.md` and `research/bangla-copy-review.md` first. This file adds the rules for social posts.

## Who is speaking
The owner, a real person who made something small and is sharing it. Not a brand. Write the way someone shares a thing they made with their own community: a little proud, a little shy, curious what others think.

## Register: তুমি, আপনি, or no address
- **Site copy** is always তুমি (that's the product voice).
- **Group posts:** match the group. In nostalgia, youth, campus and fan groups, talk to everyone without a pronoun, or use তোমরা/তোমার. In mixed-age or diaspora groups and moms' groups, use আপনারা/আপনার. When unsure, write without a direct pronoun: "কয়টা মেলে, দেখবেন?" sounds stiff, so prefer "কার কয়টা মেলে, কমেন্টে বলো/বলবেন".
- **Messages to admins and press:** always আপনি, polite and short.
- **Greeting:** in a general group, a neutral "সবাইকে শুভেচ্ছা" or no greeting. "আসসালামু আলাইকুম" is fine in groups where members use it. Never assume anyone's faith in festival posts.

## The shape of a group post (3–6 short lines)
1. **A true, small memory or moment** that this community knows. Use specifics, not adjectives.
2. **What the tool does, in one plain line,** and that it's free with no account.
3. **Your own result,** with a number when the tool gives one: "আমার মিলেছে ২৮টা।"
4. **A gentle question that invites a reply:** "তোমার কয়টা?" / "কার বাসায় এখনো হারিকেন আছে?"
5. **The link line:** "লিংক কমেন্টে।" Use this where links in posts are discouraged or banned, and only if the group allows links in comments. Otherwise put the link at the end. If a group bans links entirely, post the card image only and give the link in DMs to those who ask.

Post the **card image** natively (it's made for this), not just a link.

## Good examples (the bar)

**আমার ছোটবেলা, in a 90s-nostalgia group:**
> ছোটবেলা মনে পড়লে প্রথমে কী আসে? আমার আসে বিকেলের লোডশেডিং, হারিকেনের আলোয় পড়া আর আইসক্রিমওয়ালার ঘণ্টা।
> এমন ৩৬টা চেনা স্মৃতি একটা খাতায় জড়ো করেছি। কয়টা নিজের সাথে মেলে, টিক দিয়ে দেখা যায়। ফ্রি, কোনো অ্যাকাউন্ট লাগে না।
> আমার মিলেছে ২৮টা। তোমার কয়টা?
> লিংক কমেন্টে।

**Status for our own page or timeline:**
> ৩৬টার মধ্যে আমার ছোটবেলার ২৮টা মিলে গেল। হারিকেন, টিফিন বক্স, শুক্রবারের সিনেমা… তোমার কয়টা?

**Replies to comments:**
- "লিংক কই?" → "কমেন্টে দিয়েছি। ফ্রি, কিছু খুলতে হয় না।"
- "এটা কী অ্যাপ?" → "অ্যাপ না, ছোট একটা ওয়েবসাইট। ফোনের ব্রাউজারেই চলে।"
- "আমার ৩২টা!" → "৩২! তুমি তো আমার চেয়েও খাঁটি নব্বইয়ের 😄 কোনটা সবচেয়ে বেশি মিস করো?"

**Message to a group admin (আপনি):**
> আসসালামু আলাইকুম / শুভেচ্ছা নেবেন। আমি এই গ্রুপের একজন সদস্য। ছোটবেলার স্মৃতি নিয়ে একটা ফ্রি বাংলা ওয়েবসাইট বানিয়েছি; কোনো অ্যাকাউন্ট বা টাকা লাগে না। আপনি অনুমতি দিলে গ্রুপে একটা পোস্ট দিতে চাই। গ্রুপের নিয়ম মেনেই দেব। ধন্যবাদ।

## Never write
- Ad words: "অসাধারণ", "দুর্দান্ত", "সেরা", "এখনই ক্লিক করুন", "মিস করবেন না", "ভাইরাল", "১০০%", "জীবন বদলে যাবে".
- Clickbait or a fake result ("আমার ৩৬টাই মিলেছে!" when it didn't).
- Pressure: "শেয়ার না করলে…", "সবাই করছে…".
- Strings of emoji or "!!!". One emoji at most, only where a person would really use it.
- Any claim the tool doesn't deliver, and any numbers we haven't measured ("১০ লাখ মানুষ খেলেছে").
- Politics, religion debate, or jokes about any region, faith, gender or class.

## Format for each tool in `posts/<file>.md`

```
### <tool name> (`slug`)
Link: {SITE}/<slug>?src=<channel>   (e.g. ?src=fb-90s, ?src=ig, ?src=reddit)
Where: 3–6 communities from channels-facebook.md / channels-other.md, by exact name, best first.
Angle: one line (English is fine): which memory or feeling it hits, and the moment it fits (season, festival, match day).

**গ্রুপ পোস্ট** (3–6 lines, in the shape above; give a তোমরা and an আপনারা version only if the tool's communities need both)
**পেজ/টাইমলাইন স্ট্যাটাস** (1–2 lines)
**ইনস্টাগ্রাম/রিলস ক্যাপশন** (1–3 lines) + **রিল আইডিয়া** (3–5 shots, 10–20 seconds, what's on screen and the on-screen text)
**কমেন্টের উত্তর** (3 likely comments → replies)
**এড়িয়ে চলো** (1–2 tool-specific pitfalls, e.g. "never say which team is better" for আর্জেন্টিনা না ব্রাজিল?)
```

For the ~10 hero tools only, add a 2–3 line English version for Reddit or LinkedIn, plain and honest ("I built a small free Bangla site…").

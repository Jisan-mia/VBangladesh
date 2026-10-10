import { possessive } from "../../../shared/bangla";
import type { ArtId } from "./dish-art";

export const MAX_NAME = 20;

/*
 * Twenty places and the food each is "যেখানকার বলে পরিচিত" for, two or more in each of the 8 divisions. Food only:
 * no ranking, nothing about the people. Sweets are left to tools/mishtir-baksho; fish as a list to tools/mache-bhate.
 *
 * GI = registered Geographical Indication, DPDT register "নিবন্ধিত (সনদপ্রাপ্ত) জি আই পণ্য", 64 entries, read 11 Oct 2026:
 *   https://dpdt.gov.bd/pages/static-pages/6922dff0933eb65569e24bcf  (`gi` below is the registration number there)
 * Places known without a place-named GI:
 *   পুরান ঢাকার বাকরখানি: Banglapedia https://bn.banglapedia.org/index.php?title=বাকরখানি ("পুরানো ঢাকার অত্যন্ত জনপ্রিয় ও প্রাচীন খাদ্য")
 *   ঢাকাইয়া কাচ্চি, চট্টগ্রামের কালা ভুনা, সিলেটের সাতকরা দিয়ে গরুর মাংস ও আখনি, খুলনার খাসির চুইঝাল:
 *     The Daily Star Bangla, 17 Jun 2024 https://bangla.thedailystar.net/life-living/news-590866
 *   চট্টগ্রামের মেজবানি: Banglapedia https://bn.banglapedia.org/index.php?title=মেজবান
 *   চাঁদপুরের ইলিশ: "ইলিশের বাড়ি চাঁদপুর" district branding, https://www.jagonews24.com/country/news/201412 ; ইলিশ itself is the
 *     national GI "বাংলাদেশ ইলিশ" (reg. 2), not a Chandpur GI, so it is not marked as one.
 *   কক্সবাজারের শুঁটকি (নাজিরারটেক): The Daily Star https://www.thedailystar.net/backpage/dried-fish-trade-thriving-coxs-bazar-184966
 *   শ্রীমঙ্গলের চা: Banglapedia https://bn.banglapedia.org/index.php?title=শ্রীমঙ্গল_উপজেলা (tea gardens) and
 *     https://bn.banglapedia.org/index.php?title=বাংলাদেশ_চা_গবেষণা_ইনস্টিটিউট (the tea research institute is in Sreemangal)
 *   চাঁপাইনবাবগঞ্জের কালাই রুটি: The Daily Star Bangla https://bangla.thedailystar.net/জীবন-যাপন/চাঁপাইনবাবগঞ্জের-ঐতিহ্য-কালাই-রুটি-তৈরির-উপায়-375101
 *   পাবনার ঘি: Prothom Alo https://www.prothomalo.com/bangladesh/পাবনার-ঘি
 *   খুলনার চিংড়ি আর চুইঝাল: The Daily Star Bangla https://bangla.thedailystar.net/news/bangladesh/agriculture/news-391176
 *   স্বরূপকাঠির পেয়ারা: Banglapedia https://bn.banglapedia.org/index.php?title=পেয়ারা ("স্বরূপকাঠি জাত"; Swarupkathi is in Pirojpur)
 * Share links store answers, not places, and ties fall to list order: never reorder this list, only append.
 */
export const places = [
  { id: "dhaka", name: "পুরান ঢাকা", division: "ঢাকা", foods: "বাকরখানি, কাচ্চি", art: ["bakarkhani"], source: "বাংলাপিডিয়া; ডেইলি স্টার",
    line: "সকালের বাকরখানি থেকে রাতের কাচ্চি, গলির ঘ্রাণে ঘ্রাণেই তোমার জিভের ঠিকানা।", plate: "002121" },
  { id: "gazipur", name: "গাজীপুর", division: "ঢাকা", foods: "কাঁঠাল", art: ["kathal"], gi: [46], source: "জিআই নং ৪৬",
    line: "কাঁঠালের ঘ্রাণ পেলেই তোমার জিভ গাছতলায় গিয়ে বসে থাকে।", plate: "223233" },
  { id: "narsingdi", name: "নরসিংদী", division: "ঢাকা", foods: "লটকন, অমৃত সাগর কলা", art: ["lotkon", "kola"], gi: [32, 27], source: "জিআই নং ৩২, ২৭",
    line: "থোকা থোকা টক-মিষ্টি লটকন আর অমৃত সাগর কলা, নরসিংদীর হাটে তোমার জিভ হারিয়ে যাবে।", plate: "331321" },
  { id: "kishoreganj", name: "কিশোরগঞ্জ", division: "ঢাকা", foods: "অষ্টগ্রামের পনির", art: ["ponir"], gi: [48], source: "জিআই নং ৪৮",
    line: "হাওরের দেশের নোনতা পনির, পরোটার ভাঁজে ভাঁজে তোমার জিভের সুখ।", plate: "220030" },
  { id: "chattogram", name: "চট্টগ্রাম", division: "চট্টগ্রাম", foods: "মেজবানি মাংস, কালাভুনা", art: ["mezbani"], source: "বাংলাপিডিয়া; ডেইলি স্টার",
    line: "মেজবানির ডেকচির ঘ্রাণ পেলেই তোমার জিভ আগেভাগে লাইনে দাঁড়িয়ে যায়।", plate: "110113" },
  { id: "chandpur", name: "চাঁদপুর", division: "চট্টগ্রাম", foods: "ইলিশ", art: ["ilish"], source: "জেলা ব্র্যান্ড ‘ইলিশের বাড়ি চাঁদপুর’",
    line: "মেঘনার রুপালি ইলিশ আর সরিষার ঝাঁঝ, তোমার জিভ নামবে মাছঘাটে।", plate: "003220" },
  { id: "coxsbazar", name: "কক্সবাজার", division: "চট্টগ্রাম", foods: "সাগরের শুঁটকি", art: ["shutki"], source: "ডেইলি স্টার",
    line: "সাগরপাড়ের রোদে শুকানো শুঁটকির ঝাঁঝেই তোমার জিভের শান্তি।", plate: "010322" },
  { id: "sylhet", name: "সিলেট", division: "সিলেট", foods: "সাতকরা দিয়ে গরুর মাংস, আখনি", art: ["satkora", "achar"], source: "ডেইলি স্টার",
    line: "সাতকরার টক-সুগন্ধি মাংসে যে জিভ মজে, তার টিকিট সুরমার পাড়ে।", plate: "220330" },
  { id: "moulvibazar", name: "মৌলভীবাজার", division: "সিলেট", foods: "শ্রীমঙ্গলের চা", art: ["cha"], source: "বাংলাপিডিয়া",
    line: "টিলার গায়ে চা-বাগান আর কড়া লিকারের কাপ, শ্রীমঙ্গলেই তোমার জিভের জিরানো।", plate: "123200" },
  { id: "chapainawabganj", name: "চাঁপাইনবাবগঞ্জ", division: "রাজশাহী", foods: "খিরসাপাত, ল্যাংড়া, আশ্বিনা আম; কালাই রুটি", art: ["kalai", "aam"], gi: [3, 15, 16], source: "জিআই নং ৩, ১৫, ১৬; ডেইলি স্টার",
    line: "আমের মৌসুমে মন পড়ে থাকে বাগানে, শীতের সকালে কালাই রুটির চুলায়।", plate: "131013" },
  { id: "pabna", name: "পাবনা", division: "রাজশাহী", foods: "ঘি", art: ["ghee"], source: "প্রথম আলো",
    line: "গরম ভাতে এক চামচ ঘি, ঘ্রাণেই তোমার জিভ পৌঁছে যায় পাবনায়।", plate: "223032" },
  { id: "rangpur", name: "রংপুর", division: "রংপুর", foods: "হাঁড়িভাঙ্গা আম", art: ["aam"], gi: [22], source: "জিআই নং ২২",
    line: "হাঁড়িভাঙ্গা আমের রসে তোমার জিভ টইটম্বুর।", plate: "313011" },
  { id: "dinajpur", name: "দিনাজপুর", division: "রংপুর", foods: "বেদানা লিচু, কাটারীভোগ চাল", art: ["lichu", "chal"], gi: [51, 5], source: "জিআই নং ৫১, ৫",
    line: "জ্যৈষ্ঠের টুকটুকে লিচু আর কাটারীভোগের সুবাস, দিনাজপুর তোমার জিভকে ডাকছে।", plate: "212100" },
  { id: "khulna", name: "খুলনা", division: "খুলনা", foods: "চুইঝাল দিয়ে খাসি, চিংড়ি", art: ["chui", "chingri"], source: "ডেইলি স্টার; প্রথম আলো",
    line: "চুইঝালের মিঠে ঝাঁঝ আর চিংড়ির স্বাদে তোমার জিভ চলল দক্ষিণে।", plate: "131311" },
  { id: "jashore", name: "যশোর", division: "খুলনা", foods: "খেজুরের রস আর গুড়", art: ["rosh", "gur"], gi: [26], source: "জিআই নং ২৬",
    line: "শীতের ভোরে খেজুরের রস, তারপর গুড়, তোমার জিভের ঘড়ি চলে যশোরের সময়ে।", plate: "331323" },
  { id: "bagerhat", name: "বাগেরহাট", division: "খুলনা", foods: "সুন্দরবনের মধু", art: ["modhu"], gi: [43], source: "জিআই নং ৪৩",
    line: "সুন্দরবনের মধু, এক চামচেই তোমার জিভ বনের পথে।", plate: "131201" },
  { id: "barishal", name: "বরিশাল", division: "বরিশাল", foods: "আমড়া", art: ["amra"], gi: [49], source: "জিআই নং ৪৯",
    line: "নুন-মরিচে আমড়া মাখা, টক-ঝালে তোমার জিভ বরিশালের নৌকায়।", plate: "002102" },
  { id: "pirojpur", name: "পিরোজপুর", division: "বরিশাল", foods: "স্বরূপকাঠির পেয়ারা", art: ["peyara"], source: "বাংলাপিডিয়া",
    line: "সবুজ পেয়ারার কচকচে কামড়ে তোমার জিভ স্বরূপকাঠির বাগানে।", plate: "300113" },
  { id: "sherpur", name: "শেরপুর", division: "ময়মনসিংহ", foods: "তুলশীমালা চাল", art: ["chal"], gi: [14], source: "জিআই নং ১৪",
    line: "তুলশীমালা চালের সুগন্ধি ভাত, ঘ্রাণেই তোমার জিভ গারো পাহাড়ের কোলে।", plate: "002032" },
  { id: "mymensingh", name: "ময়মনসিংহ", division: "ময়মনসিংহ", foods: "ফুলবাড়ীয়ার লাল চিনি", art: ["chini"], gi: [58], source: "জিআই নং ৫৮",
    line: "ফুলবাড়ীয়ার লাল চিনি চায়ে মেশালেই তোমার জিভ ময়মনসিংহের পথে।", plate: "312202" },
] as const satisfies ReadonlyArray<{ id: string; name: string; division: string; foods: string; art: readonly ArtId[]; gi?: readonly number[]; source: string; line: string; plate: string }>;

export type Place = (typeof places)[number];
export type PlaceId = Place["id"];
export const GI_REGISTER_URL = "https://dpdt.gov.bd/pages/static-pages/6922dff0933eb65569e24bcf";

// Every option is a dish "যেখানকার বলে পরিচিত" for `place`. The link stores the shown position (`a=031220`): never reorder
// an option, only reword it in place.
export const questions = [
  { ask: "সকালের নাস্তায়?", options: [
    { label: "বাকরখানি আর চা", place: "dhaka", art: "bakarkhani" },
    { label: "কালাই রুটি, ভর্তা", place: "chapainawabganj", art: "kalai" },
    { label: "পরোটা আর পনির", place: "kishoreganj", art: "ponir" },
    { label: "খেজুরের রস, মুড়ি", place: "jashore", art: "rosh" },
  ] },
  { ask: "দুপুরের পাতে?", options: [
    { label: "সরিষা ইলিশ", place: "chandpur", art: "ilish" },
    { label: "মেজবানি মাংস", place: "chattogram", art: "mezbani" },
    { label: "সাতকরা দিয়ে মাংস", place: "sylhet", art: "satkora" },
    { label: "চুইঝালে খাসি", place: "khulna", art: "chui" },
  ] },
  { ask: "ভাতের সাথে আর কী?", options: [
    { label: "শুঁটকি ভুনা", place: "coxsbazar", art: "shutki" },
    { label: "চিংড়ি ভুনা", place: "khulna", art: "chingri" },
    { label: "সুগন্ধি চালের ভাত", place: "sherpur", art: "chal" },
    { label: "গরম ভাতে ঘি", place: "pabna", art: "ghee" },
  ] },
  { ask: "ফলের ঝুড়ি থেকে আগে?", options: [
    { label: "আম", place: "rangpur", art: "aam" },
    { label: "লিচু", place: "dinajpur", art: "lichu" },
    { label: "কাঁঠাল", place: "gazipur", art: "kathal" },
    { label: "কলা", place: "narsingdi", art: "kola" },
  ] },
  { ask: "টক কিছু খেতে মন চাইলে?", options: [
    { label: "আমড়া মাখা", place: "barishal", art: "amra" },
    { label: "পেয়ারা মাখা", place: "pirojpur", art: "peyara" },
    { label: "লটকন", place: "narsingdi", art: "lotkon" },
    { label: "সাতকরার আচার", place: "sylhet", art: "achar" },
  ] },
  { ask: "চায়ের কাপে কী দেবে?", options: [
    { label: "শুধু কড়া লিকার", place: "moulvibazar", art: "cha" },
    { label: "এক চামচ মধু", place: "bagerhat", art: "modhu" },
    { label: "লাল চিনি", place: "mymensingh", art: "chini" },
    { label: "খেজুরের গুড়", place: "jashore", art: "gur" },
  ] },
] as const satisfies ReadonlyArray<{ ask: string; options: ReadonlyArray<{ label: string; place: PlaceId; art: ArtId }> }>;

export const QUESTION_COUNT = questions.length;
export type Answer = 0 | 1 | 2 | 3;
export type Ticket = { answers: Answer[]; name: string };

const bnFormat = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => bnFormat.format(value);
export const bnDigits = (text: string) => text.replace(/[0-9]/g, digit => "০১২৩৪৫৬৭৮৯"[Number(digit)]);

const optionOf = (answers: readonly Answer[], question: number) => questions[question].options[answers[question]];

/*
 * The scoring table. Each place has a `plate`: one answer per question that a tongue from there would pick. It always
 * holds the place's own dishes; the other slots were set by a balancing search so each option sits on exactly 5 plates
 * and every place comes up for 4–8% of all 4,096 answer sets (tested). It is a quiz device, not a claim about what
 * people there eat, and it is never shown.
 * Rule: only places whose dish you picked can win. Each answer that matches a place's plate scores 1, or 2 when it is
 * that place's own dish. A tie goes to the place that matches your earlier answers (সকালের নাস্তা first), then list order.
 */
export function placeOf(answers: readonly Answer[]): Place {
  let best: Place = places[0];
  let bestKey = -1;
  places.forEach((place, index) => {
    if (!answers.some((_, question) => optionOf(answers, question).place === place.id)) return;
    let score = 0, early = 0;
    answers.forEach((answer, question) => {
      if (Number(place.plate[question]) !== answer) return;
      score += optionOf(answers, question).place === place.id ? 2 : 1;
      early += 1 << (QUESTION_COUNT - 1 - question);
    });
    const key = (score * 64 + early) * 32 + (31 - index);
    if (key > bestKey) { bestKey = key; best = place; }
  });
  return best;
}

/** The person's own picks that belong to their place: the "কেন" on the card. There is always at least one. */
export function ownPicks(answers: readonly Answer[], place = placeOf(answers)): string[] {
  return answers.map((_, question) => optionOf(answers, question)).filter(option => option.place === place.id).map(option => option.label);
}

export const joinBn = (items: readonly string[]) => items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} আর ${items[items.length - 1]}`;

export function reasonLine(answers: readonly Answer[]) {
  return `কারণ তোমার পাতে ছিল ${joinBn(ownPicks(answers))}`;
}

/** Who is travelling, as printed on the ticket. */
export const passenger = (name: string) => name ? `${possessive(name)} জিভ` : "আমার জিভ";

/** The line a friend's link adds under two tickets. */
export function pairLine(me: Ticket, friend: Ticket) {
  const mine = placeOf(me.answers), theirs = placeOf(friend.answers);
  const myName = me.name || "আমি", friendName = friend.name || "বন্ধু";
  if (mine.id === theirs.id) return `${myName} আর ${friendName}, একই ট্রেনে ${mine.name}!`;
  return `${myName} ${mine.name}, ${friendName} ${theirs.name}, স্টেশনে দেখা হবে`;
}

export function caption({ answers }: Ticket) {
  const place = placeOf(answers);
  return `আমার জিভের টিকিট কাটা হলো, গন্তব্য ${place.name}! ${place.foods} যেখানকার বলে পরিচিত। তোমার জিভ কোন জেলার?`;
}

export function previewTitle(ticket: Ticket | null) {
  if (!ticket) return "জেলার বিখ্যাত খাবার — তোমার জিভ কোন জেলার?";
  const who = ticket.name ? possessive(ticket.name) : "এক বন্ধুর";
  return `${who} জিভের টিকিট ${placeOf(ticket.answers).name}, তোমারটা কোন জেলার?`;
}

// Copied from tools/bhorta/lib/bhorta.ts (tools don't import each other).
// shortcut: a short public-card blocklist, not a full moderation filter; extend it when reports come in.
const blockedParts = ["চোদা", "চুদি", "চুদ", "চোদন", "মাদারচোদ", "বোকাচোদ", "খানকি", "খাংকি", "মাগি", "মাগী", "হারামি", "হারামজাদ", "বেশ্যা", "কুত্তারবাচ্চা", "শুয়োরেরবাচ্চা", "শুয়রেরবাচ্চা", "গান্ডু", "ভোদা",
  "fuck", "bitch", "pussy", "porn", "khanki", "khangki", "harami", "haramjada", "haramzada", "madarchod", "bokachod", "choda", "chodi", "chudi", "chudir", "gandu", "kuttarbacc", "kuttarbach", "shuorerbacc", "bainchod", "behenchod"];
const blockedWords = new Set(["বাল", "চোদ", "bal", "baal", "chod", "chud", "chodu", "fuk", "shit", "magi", "maggi", "randi", "besha", "dick", "sex", "nude", "cock", "ass"]);

export function isBlocked(text: string) {
  const lower = text.normalize("NFC").toLowerCase().replace(/[‌‍]/g, "");
  const squeezed = lower.replace(/[^ঀ-৿a-z]/g, "");
  return blockedParts.some(part => squeezed.includes(part)) || lower.split(/[^ঀ-৿a-z]+/).some(word => blockedWords.has(word));
}

/** Keeps Bangla, Latin letters, digits and single spaces, NFC, capped at MAX_NAME characters. Anything on the blocklist becomes "". */
export function cleanName(raw: string) {
  const name = raw.normalize("NFC").replace(/[^ঀ-৿A-Za-z0-9 ‌‍]/g, "").replace(/\s+/g, " ").trim();
  const capped = [...name].slice(0, MAX_NAME).join("").trim();
  return isBlocked(capped) ? "" : capped;
}

export function shareHash({ answers, name }: Ticket) {
  const params = new URLSearchParams({ a: answers.join("") });
  const shown = cleanName(name);
  if (shown) params.set("n", shown);
  return "#" + params.toString();
}

/** Null unless the hash holds all six answers; in-page anchors like #result are ignored. */
export function parseShareHash(hash: string): Ticket | null {
  let params: URLSearchParams;
  try { params = new URLSearchParams(hash.replace(/^#/, "")); } catch { return null; }
  const digits = params.get("a") ?? "";
  if (!new RegExp(`^[0-3]{${QUESTION_COUNT}}$`).test(digits)) return null;
  return { answers: [...digits].map(Number) as Answer[], name: cleanName(params.get("n") ?? "") };
}

// Fixed ids only: the destination, never the name or the answers.
export const tallyIds = places.map(place => place.id);

export { possessive };

import { possessive } from "../../../shared/bangla";

export const MAX_NAME = 20;

// Three taps, three options each. The digits in the link (`a=021`) are these indexes: never reorder.
export const orders = ["সবার বড়", "মেজো", "সবার ছোট"] as const;
export const moods = ["চঞ্চল", "শান্ত", "গল্পবাজ"] as const;
// The third tap sets the time of day on the balcony and what the call from it says.
export const times = [
  { label: "ভোরের পাখি", call: "নাশতা খেতে আয়!" },
  { label: "দুপুরে ঘুম ফাঁকি", call: "ভাত খেতে আয়!" },
  { label: "রাতজাগা", call: "এবার ঘুমাতে আয়!" },
] as const;

export const sets = [
  { id: "any", label: "যেকোনো" },
  { id: "boy", label: "ছেলেদের" },
  { id: "girl", label: "মেয়েদের" },
] as const;
export type SetId = (typeof sets)[number]["id"];

// Classic Bangladeshi daak naams, as families used them (see the Daily Star column "What's in a name"
// https://archive.thedailystar.net/magazine/2003/09/03/rcolumn.htm and The Juggernaut on dak nam
// https://www.thejuggernaut.com/bengali-naming-dak-nam-history). Curated by hand: no colour, body or
// teasing names (কালু, মোটু, বুচি, খেঁদি, হাবলু…), and no claims about what any name means.
// "any" holds pet words families use for a child of any gender (বাবু, মনা, সোনা, পাখি…).
// One row per order×mood cell (order*3 + mood), three names each; equal sets of 27.
// Links and the tally store set + cell + position: never reorder, only replace a name in place.
export const names: Record<SetId, readonly (readonly [string, string, string])[]> = {
  any: [
    ["বাবু", "টুটুন", "কাজল"], ["সোনা", "মণি", "বকুল"], ["বুলবুল", "মনু", "সোনাই"],
    ["জাদু", "টুকটুক", "ঝিলিক"], ["মনা", "টগর", "আদর"], ["তোতা", "পাখি", "মিঠু"],
    ["পিচ্চি", "পুচকু", "জোনাকি"], ["সোনামণি", "চাঁদ", "টুনু"], ["বাবুই", "ছোটু", "বিনু"],
  ],
  boy: [
    ["টুটুল", "বাবলু", "পিন্টু"], ["খোকন", "রতন", "মানিক"], ["লিটন", "বাবুল", "দুলাল"],
    ["ঝন্টু", "টিটু", "বিল্টু"], ["মিন্টু", "সাজু", "টুকু"], ["বাপ্পি", "শিপলু", "রাজু"],
    ["রিন্টু", "পল্টু", "ডাবলু"], ["ছোটন", "বাচ্চু", "তপু"], ["টোকন", "মন্টু", "পিকলু"],
  ],
  girl: [
    ["ঝুমা", "রুমকি", "চুমকি"], ["মামনি", "শিউলি", "লিপি"], ["মুন্নি", "মিলি", "পলি"],
    ["ঝুমুর", "টুম্পা", "ঝিনুক"], ["পুতুল", "মৌ", "জুঁই"], ["ময়না", "টিয়া", "পাপিয়া"],
    ["পুচকি", "টুসি", "রুনু"], ["খুকি", "পিউ", "মিনু"], ["টুনটুনি", "টুনি", "মুনা"],
  ],
};

// The human line, by order×mood, in the first person because the card is the sharer's own.
const lines = [
  "বড় ছিলাম, তবু মাঠে নামলে সবার আগে আমি।",
  "ছোটদের সামলাতাম, মায়ের ডান হাত ছিলাম।",
  "ছোট ভাইবোনেরা আমার গল্প শুনেই ঘুমাত।",
  "মাঝখানে ছিলাম, তাই সবার চোখ ফাঁকি দেওয়া সহজ ছিল।",
  "বড়-ছোটর ঝগড়া থামাতে সবাই আমাকেই ডাকত।",
  "বাড়ির সব খবর সবার আগে আমার কাছে আসত।",
  "সবার ছোট, তাই সব দুষ্টুমি মাফ।",
  "সবার ছোট, সবার কোলে কোলে।",
  "আধো আধো কথায় পুরো বাড়ি মাতিয়ে রাখতাম।",
] as const;

export type Tap = 0 | 1 | 2;
export type Daknam = { order: Tap; mood: Tap; time: Tap; set: SetId; pick: Tap; name: string };

type NameKey = Pick<Daknam, "order" | "mood" | "set" | "pick">;

export const defaultDaknam: Daknam = { order: 2, mood: 0, time: 1, set: "any", pick: 0, name: "" };

const bnFormat = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => bnFormat.format(value);

export const nickname = (d: NameKey) => names[d.set][d.order * 3 + d.mood][d.pick];
export const humanLine = (d: Pick<Daknam, "order" | "mood">) => lines[d.order * 3 + d.mood];
export const callLine = (d: Pick<Daknam, "time">) => times[d.time].call;
export const nextPick = (pick: Tap) => ((pick + 1) % 3) as Tap;
export const summary = (d: Pick<Daknam, "order" | "mood" | "time">) => `${orders[d.order]} · ${moods[d.mood]} · ${times[d.time].label}`;

// Copied from tools/amar-jersey/lib/jersey.ts (tools don't import each other).
// shortcut: a short public-card blocklist, not a full moderation filter; extend it when reports come in.
// Long, distinctive words match anywhere (after spaces and dots are squeezed out); short ones only as a whole word, so ইকবাল/Iqbal stays fine.
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

const isSet = (value: string): value is SetId => sets.some(set => set.id === value);

export function shareHash(d: Daknam) {
  const params = new URLSearchParams();
  params.set("a", `${d.order}${d.mood}${d.time}`);
  params.set("s", d.set);
  if (d.pick) params.set("k", String(d.pick));
  const name = cleanName(d.name);
  if (name) params.set("n", name);
  return "#" + params.toString();
}

/** Null unless the hash holds three valid taps; in-page anchors like #result are ignored. */
export function parseShareHash(hash: string): Daknam | null {
  let params: URLSearchParams;
  try { params = new URLSearchParams(hash.replace(/^#/, "")); } catch { return null; }
  const taps = params.get("a") ?? "";
  if (!/^[0-2]{3}$/.test(taps)) return null;
  const [order, mood, time] = [...taps].map(Number) as Tap[];
  const set = params.get("s") ?? "";
  const pick = params.get("k") ?? "0";
  return { order, mood, time, set: isSet(set) ? set : "any", pick: /^[0-2]$/.test(pick) ? Number(pick) as Tap : 0, name: cleanName(params.get("n") ?? "") };
}

export function caption(d: Daknam) {
  return `ছোটবেলায় আমার ডাকনাম হতো “${nickname(d)}”! ${humanLine(d)} তোমারটা কী হতো? দেখো:`;
}

export function previewTitle(d: Daknam | null) {
  if (!d) return "ছোটবেলায় তোমাকে কী নামে ডাকত? — তিন চাপে দেখো";
  const who = d.name ? possessive(d.name) : "এক বন্ধুর";
  return `${who} ডাকনাম হতো ${nickname(d)} — তোমারটা কী হতো?`;
}

// Fixed ids only: set + cell + position, never the person's own name.
export const tallyId = (d: NameKey) => `${d.set}-${d.order}${d.mood}${d.pick}`;
export const tallyIds = sets.flatMap(set => names[set.id].flatMap((row, cell) => row.map((_, pick) => `${set.id}-${Math.floor(cell / 3)}${cell % 3}${pick}`)));

export function nameFromTallyId(id: string) {
  const match = /^(any|boy|girl)-([0-2])([0-2])([0-2])$/.exec(id);
  if (!match) return null;
  return nickname({ set: match[1] as SetId, order: Number(match[2]) as Tap, mood: Number(match[3]) as Tap, pick: Number(match[4]) as Tap });
}

export { possessive };

import { possessive } from "../../../shared/bangla";
import { countdown, daysBetween, dhakaToday, occasionById, sources } from "../../koto-din-baki/lib/countdown";

export const MAX_NAME_LENGTH = 30;
/** A real থালা holds about this much before it spills; the link cap too. */
export const MAX_ITEMS = 12;

// Ids travel in share links and the anonymous tally: once links are public, only append; never rename or delete.
// Food only: no brands (the red sharbat is drawn generically), no health claims, no worship text.
export const items = [
  { id: "khejur", label: "খেজুর", note: "অনেকের ইফতার শুরু হয় খেজুর দিয়ে", kind: "food" },
  { id: "pani", label: "পানি", note: "এক গ্লাস ঠান্ডা পানি", kind: "drink" },
  { id: "sharbat", label: "লাল শরবত", note: "গোলাপি-লাল শরবত, কেউ কেউ তোকমা দেয়", kind: "drink" },
  { id: "lebu", label: "লেবুর শরবত", note: "লেবু-চিনির ঠান্ডা শরবত", kind: "drink" },
  { id: "chola", label: "ছোলা", note: "পেঁয়াজ-মরিচ দিয়ে ছোলা ভুনা", kind: "food" },
  { id: "peyaju", label: "পেঁয়াজু", note: "ডাল বাটা আর পেঁয়াজের মচমচে বড়া", kind: "food" },
  { id: "beguni", label: "বেগুনি", note: "বেসনে ডোবানো বেগুনের ফালি", kind: "food" },
  { id: "alur-chop", label: "আলুর চপ", note: "আলু সেদ্ধ মাখিয়ে ভাজা চপ", kind: "food" },
  { id: "somucha", label: "সমুচা", note: "তিনকোনা মচমচে সমুচা", kind: "food" },
  { id: "muri", label: "মুড়ি মাখা", note: "ছোলা, পেঁয়াজু, চানাচুর, তেল-মরিচে মাখা মুড়ি", kind: "food" },
  { id: "jilapi", label: "জিলাপি", note: "রসে ডোবানো প্যাঁচানো জিলাপি", kind: "food" },
  { id: "bundia", label: "বুন্দিয়া", note: "ছোট ছোট মিষ্টি দানা", kind: "food" },
  { id: "haleem", label: "হালিম", note: "ডাল-মাংসের ঘন হালিম, ওপরে বেরেস্তা আর লেবু", kind: "food" },
  { id: "doi-chira", label: "দই-চিড়া", note: "দই, চিড়া আর কলা একসাথে", kind: "food" },
  { id: "doi-bora", label: "দই বড়া", note: "টক-মিষ্টি দইয়ে ডোবানো ডালের বড়া", kind: "food" },
  { id: "kabab", label: "কাবাব", note: "শামি বা সুতি কাবাব, সাথে পেঁয়াজ", kind: "food" },
  { id: "fol", label: "ফল", note: "তরমুজ, কলা, যে মৌসুমে যা পাওয়া যায়", kind: "food" },
] as const satisfies ReadonlyArray<{ id: string; label: string; note: string; kind: "food" | "drink" }>;

export const places = [
  { id: "basa", label: "বাসায়" },
  { id: "office", label: "অফিসে" },
  { id: "campus", label: "ক্যাম্পাসে" },
  { id: "party", label: "ইফতার পার্টিতে" },
  { id: "probash", label: "প্রবাসে" },
] as const;

export type Item = (typeof items)[number];
export type ItemId = Item["id"];
export type PlaceId = (typeof places)[number]["id"];
export type Plate = { picks: ItemId[]; place: PlaceId | ""; name: string };

/** The plate the page opens with: what most Bangladeshi homes put out. */
export const starters: ItemId[] = ["khejur", "sharbat", "chola", "peyaju", "beguni", "muri"];

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);

const itemIds = new Set<string>(items.map(item => item.id));
const placeIds = new Set<string>(places.map(place => place.id));
const isItemId = (id: string): id is ItemId => itemIds.has(id);
const isPlaceId = (id: string): id is PlaceId => placeIds.has(id);
export const itemById = (id: ItemId) => items.find(item => item.id === id)!;
export const placeLabel = (id: PlaceId | "") => places.find(place => place.id === id)?.label ?? "";
export const isDrink = (id: ItemId) => itemById(id).kind === "drink";

/** Always in list order, so the same picks lay out the same plate and give the same link. */
export function inOrder(picks: readonly string[]): ItemId[] {
  return items.filter(item => picks.includes(item.id)).map(item => item.id);
}

export type Toggle = { picks: ItemId[]; full: boolean };

export function toggleItem(picks: readonly ItemId[], id: string): Toggle {
  if (!isItemId(id)) throw new RangeError("এই খাবারটা তালিকায় নেই।");
  if (picks.includes(id)) return { picks: picks.filter(item => item !== id), full: false };
  if (picks.length >= MAX_ITEMS) return { picks: [...picks], full: true };
  return { picks: inOrder([...picks, id]), full: false };
}

export function cleanName(name: string) {
  // Strip control and bidi-override characters so a shared link can't scramble the card text.
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);
}

export function shareHash({ picks, place, name }: Plate) {
  const params = new URLSearchParams({ i: inOrder(picks).slice(0, MAX_ITEMS).join(",") });
  if (place) params.set("w", place);
  const shown = cleanName(name);
  if (shown) params.set("n", shown);
  // Commas stay readable: #i=khejur,chola&n=রাফি
  return "#" + params.toString().replace(/%2C/g, ",");
}

export function parseShareHash(hash: string): Plate | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const raw = params.get("i") ?? "";
  // 17 ids at most ~10 letters each; anything far longer is not ours.
  if (!raw || raw.length > 300) return null;
  const picks = inOrder(raw.split(",")).slice(0, MAX_ITEMS);
  if (!picks.length) return null;
  const place = params.get("w") ?? "";
  return { picks, place: isPlaceId(place) ? place : "", name: cleanName(params.get("n") ?? "") };
}

/** One warm line chosen from what is on the plate and where. */
export function plateLine(picks: readonly ItemId[], place: PlaceId | "") {
  const has = (id: ItemId) => picks.includes(id);
  if (!picks.length) return "প্লেটটা এখনো ফাঁকা।";
  if (place === "probash") return "দেশের প্লেট, দূরের টেবিল।";
  if (picks.length <= 3) return has("khejur") && has("pani") ? "খেজুর আর পানি, সহজ আর শান্ত।" : "প্লেট ছোট, ইফতার ঠিকই আছে।";
  if (picks.length >= 10) return "আজ দস্তরখান ভরা, সবাইকে ডাকো!";
  if (has("haleem")) return "হালিম থাকলে ইফতার পুরো।";
  if (has("jilapi") && has("beguni")) return "মিষ্টি আর ঝাল, দুটোই চাই।";
  if (place === "office") return "অফিসের ডেস্কেই ছোট্ট একটা দস্তরখান।";
  if (place === "campus") return "ক্যাম্পাসের ইফতার মানেই ভাগাভাগি।";
  if (place === "party") return "এক টেবিলে সবাই, এটাই আসল আয়োজন।";
  if (has("muri")) return "মুড়ি মাখার গামলায় সবার হাত।";
  if (has("doi-chira")) return "দই-চিড়ায় পেট ঠান্ডা, মন ঠান্ডা।";
  if (has("sharbat")) return "এক গ্লাস লাল শরবতে গলাটা জুড়িয়ে যায়।";
  return "প্লেট তৈরি, এবার বন্ধুদের পাঠাও।";
}

export type RamadanDay = { day: number; likely: boolean };

// Start and Eid dates are the moon projections in koto-din-baki (sourced there; the committee's announcement replaces them).
const moonDates = (id: "ramadan" | "eid-fitr") => (occasionById(id) as { dates: readonly string[] }).dates;

/** Which day of Ramadan `today` ("YYYY-MM-DD" in Dhaka) is: 1 on the start date, ending the day before the projected Eid and never past 30; null otherwise. */
export function ramadanDay(today: string): RamadanDay | null {
  const eids = moonDates("eid-fitr");
  for (const [index, start] of moonDates("ramadan").entries()) {
    const day = daysBetween(start, today) + 1;
    if (day >= 1 && day <= Math.min(30, daysBetween(start, eids[index]))) return { day, likely: countdown({ id: "ramadan" }, start).likely };
  }
  return null;
}

/** ১ম ২য় ৩য় ৪র্থ ৫ম ৬ষ্ঠ ৭ম ৮ম ৯ম ১০ম, then ১১তম… */
const ordinal = (n: number) => bn(n) + (n > 10 ? "তম" : ["ম", "য়", "য়", "র্থ", "ম", "ষ্ঠ", "ম", "ম", "ম", "ম"][n - 1]);
/** "আজ রমজানের সম্ভাব্য ১২তম দিন"; "সম্ভাব্য" drops once the start is announced. */
export const ramadanLine = ({ day, likely }: RamadanDay) => `আজ রমজানের ${likely ? "সম্ভাব্য " : ""}${ordinal(day)} দিন`;

export type CardContent = {
  title: string;
  sub: string;
  /** The Ramadan day line, or "" outside Ramadan and on a friend's plate. */
  day: string;
  line: string;
  names: string;
  match: string;
  picks: ItemId[];
  friend: { label: string; picks: ItemId[] } | null;
  popular: string;
};

/** Everything the card prints, decided here so it can be tested without a canvas. */
export function createCard(own: Plate, friend?: Plate | null, popular = "", ramadan: RamadanDay | null = null): CardContent {
  const picks = inOrder(own.picks);
  const name = cleanName(own.name);
  const where = placeLabel(own.place);
  let match = "";
  if (friend && picks.length) {
    const common = picks.filter(id => friend.picks.includes(id)).map(id => itemById(id).label);
    match = common.length ? `দুজনের প্লেটেই: ${common.slice(0, 4).join(", ")}${common.length > 4 ? "…" : ""}` : "দুজনের প্লেটে একটাও মিল নেই, দাওয়াত দিতে হবে!";
  }
  return {
    title: `${name ? possessive(name) : "আমার"} ইফতারির প্লেট`,
    sub: [where, `${bn(picks.length)} পদ`].filter(Boolean).join(" · "),
    day: ramadan ? ramadanLine(ramadan) : "",
    line: plateLine(picks, own.place),
    names: picks.map(id => itemById(id).label).join(" · "),
    match,
    picks,
    friend: friend ? { label: `${friend.name ? possessive(friend.name) : "বন্ধুর"} প্লেট`, picks: inOrder(friend.picks) } : null,
    popular,
  };
}

/** Foods ranked by the anonymous tally, or null while the sample is too small to mean anything. */
export function mostPicked(counts: Record<string, number>, total: number, minimum: number) {
  if (total < minimum) return null;
  const ranked = items.map(item => ({ id: item.id as ItemId, count: counts[item.id] ?? 0 })).filter(row => row.count > 0).sort((a, b) => b.count - a.count);
  return ranked.length ? ranked.map(row => ({ ...row, label: itemById(row.id).label, percent: Math.round((row.count / total) * 100) })) : null;
}

export type Spot = { id: ItemId; x: number; y: number; size: number };

// Scene units: a 420×380 দস্তরখান patch, the thala centred left, glasses standing to its right.
export const SCENE = { width: 420, height: 380, cx: 178, cy: 196, rim: 166, well: 136 } as const;
const CENTRE_FIRST: ItemId[] = ["muri", "haleem", "doi-chira", "chola", "fol"];

/** Where each pick sits: one heap in the middle, the rest in a ring, drinks as glasses beside the plate. */
export function layoutPlate(picks: readonly ItemId[]): Spot[] {
  const ordered = inOrder(picks);
  const food = ordered.filter(id => !isDrink(id));
  const drinks = ordered.filter(isDrink);
  const spots: Spot[] = drinks.map((id, index) => ({ id, x: 368, y: 82 + index * 104, size: 100 }));
  if (!food.length) return spots;
  if (food.length === 1) return [{ id: food[0], x: SCENE.cx, y: SCENE.cy, size: 190 }, ...spots];
  const centre = food.length >= 3 ? CENTRE_FIRST.find(id => food.includes(id)) : undefined;
  const ring = food.filter(id => id !== centre);
  // Size each ring item to its share of the circle, then pull the ring in so items stay on the plate.
  let size = 100, radius = 0;
  for (let pass = 0; pass < 3; pass++) {
    radius = SCENE.well - size * 0.36;
    size = Math.max(56, Math.min(ring.length <= 2 ? 140 : ring.length <= 4 ? 128 : 116, (2 * Math.PI * radius) / ring.length * 1.05));
  }
  const ringSpots = ring.map((id, index) => {
    const angle = -Math.PI / 2 + (index / ring.length) * Math.PI * 2 + (ring.length % 2 ? 0 : Math.PI / ring.length);
    return { id, x: SCENE.cx + Math.cos(angle) * radius, y: SCENE.cy + Math.sin(angle) * radius, size };
  });
  const middle = centre ? [{ id: centre, x: SCENE.cx, y: SCENE.cy, size: Math.min(140, Math.max(118, (radius - size / 2) * 2.4)) }] : [];
  return [...ringSpots, ...middle, ...spots];
}

export { dhakaToday, possessive, sources };

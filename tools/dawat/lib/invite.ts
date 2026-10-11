import { possessive } from "../../../shared/bangla";

export const MAX_NAME = 24;
export const MAX_PLACE = 40;
export const MAX_MAP = 300;

type Palette = { paper: string; ink: string; soft: string; gold: [string, string, string]; ribbon: string; band: { band: string; ask: string; site: string } };

type Occasion = {
  id: string;
  chip: string;
  /** Small gold word at the top of the card. */
  heading: string;
  /** Labels and samples for the two name fields; a missing second field means the occasion takes one name. */
  fields: readonly [{ label: string; sample: string }, { label: string; sample: string; optional?: boolean }?];
  /** Two names show as a pair ("রাফি ও মিম"); otherwise the first is the host and the second, if any, the big line. */
  pair: boolean;
  /** "বিয়ে" / "বিয়ের" / "বিয়েতে": the event noun in the three shapes the copy needs. */
  noun: string;
  nounOf: string;
  nounIn: string;
  /** Big words on the card when the occasion is not a pair. */
  big?: (b: string) => string;
  invite: string;
  /** The human line on the card. */
  line: string;
  /** The guest's "আমি আসছি" choices. Links store the index: only append, never reorder. */
  replies: readonly string[];
  caption: string;
  time: string;
  place: string;
  palette: Palette;
};

const darkBand = (band: string, ask = "#ffd98a") => ({ band, ask, site: "#ffffff" });

// Religious occasions (আকিকা, মিলাদ, পূজা) keep neutral floral art and no verses or scripture.
export const occasions = [
  {
    id: "biye", chip: "বিয়ে", heading: "শুভ বিবাহ", pair: true,
    fields: [{ label: "একজনের নাম", sample: "রাফি" }, { label: "আরেকজনের নাম", sample: "মিম" }],
    noun: "বিয়ে", nounOf: "বিয়ের", nounIn: "বিয়েতে",
    invite: "দুজনের নতুন পথচলার শুরুতে সপরিবারে আমন্ত্রিত।",
    line: "মরিচবাতি জ্বলবে, তুমি না এলে চলবে?",
    replies: ["আসছি, পেট খালি রেখে!", "পরিবার নিয়ে আসছি।", "গেট ধরার দলে আমিও আছি!"],
    caption: "আমাদের বিয়ের দাওয়াত রইল। তোমাকে কিন্তু আসতেই হবে!",
    time: "19:30", place: "কমিউনিটি সেন্টার, মিরপুর ১০",
    palette: { paper: "#6a1020", ink: "#fbecd6", soft: "#f0c9b4", gold: ["#fff1c1", "#e3b857", "#9c6b1c"], ribbon: "#c4161c", band: darkBand("#3f0712") },
  },
  {
    id: "holud", chip: "গায়ে হলুদ", heading: "গায়ে হলুদ", pair: true,
    fields: [{ label: "কার হলুদ?", sample: "মিম" }, { label: "আরেকজন (চাইলে)", sample: "", optional: true }],
    noun: "গায়ে হলুদ", nounOf: "গায়ে হলুদের", nounIn: "গায়ে হলুদে",
    invite: "হলুদ-মেহেদির সন্ধ্যায় সবান্ধবে আমন্ত্রিত।",
    line: "না এলে রং মাখাবে কে?",
    replies: ["হলুদ মাখাতে আসছি, সাবধান!", "মেহেদি পরতে আসছি।", "নাচের দলে আমার নাম লিখে রাখো!"],
    caption: "হলুদের দাওয়াত রইল। হলুদ-সবুজ পরে চলে এসো!",
    time: "18:00", place: "বাসার ছাদ, ধানমন্ডি",
    palette: { paper: "#f4b21b", ink: "#2c3a12", soft: "#5b4a10", gold: ["#fff7d6", "#b4471b", "#6d2a0c"], ribbon: "#1f7a3a", band: darkBand("#24461b", "#ffe07a") },
  },
  {
    id: "boubhat", chip: "বৌভাত", heading: "বৌভাত", pair: true,
    fields: [{ label: "একজনের নাম", sample: "রাফি" }, { label: "আরেকজনের নাম", sample: "মিম" }],
    noun: "বৌভাত", nounOf: "বৌভাতের", nounIn: "বৌভাতে",
    invite: "বৌভাতের আয়োজনে সপরিবারে আমন্ত্রিত।",
    line: "নতুন বউয়ের হাতের প্রথম ভাতের ভাগ নিতে এসো।",
    replies: ["নতুন বউকে দেখতে আসছি!", "পরিবার নিয়ে আসছি।", "উপহার হাতে আসছি!"],
    caption: "বৌভাতের দাওয়াত রইল, সবাই মিলে এসো।",
    time: "13:00", place: "কমিউনিটি সেন্টার, উত্তরা",
    palette: { paper: "#fbf1e1", ink: "#5a1420", soft: "#7b4b3a", gold: ["#dcb45c", "#b98a2e", "#7d5512"], ribbon: "#a3121f", band: darkBand("#5a1420") },
  },
  {
    id: "akika", chip: "আকিকা", heading: "আকিকা", pair: false,
    fields: [{ label: "সোনামণির নাম", sample: "আয়ান" }],
    noun: "আকিকা", nounOf: "আকিকার", nounIn: "আকিকায়",
    invite: "সোনামণির আকিকায় সপরিবারে আমন্ত্রিত।",
    line: "ছোট্ট মানুষটাকে দোয়া দিতে এসো।",
    replies: ["সোনামণিকে দেখতে আসছি!", "দোয়া নিয়ে আসছি।", "পরিবার নিয়ে আসছি।"],
    caption: "আমাদের সোনামণির আকিকার দাওয়াত রইল।",
    time: "13:00", place: "নানাবাড়ি, কুমিল্লা",
    palette: { paper: "#e6f1e4", ink: "#1d4a35", soft: "#4d6a5a", gold: ["#d7b257", "#b0862f", "#77561a"], ribbon: "#2f7d5b", band: darkBand("#1d4a35") },
  },
  {
    id: "milad", chip: "মিলাদ", heading: "দাওয়াত", pair: false,
    fields: [{ label: "আয়োজক", sample: "চৌধুরী পরিবার" }],
    noun: "মিলাদ", nounOf: "মিলাদের", nounIn: "মিলাদে",
    big: () => "মিলাদ ও দোয়া",
    invite: "সবাই মিলে দোয়া করব। সপরিবারে আমন্ত্রিত।",
    line: "তোমার উপস্থিতিটাই আমাদের কাছে বড়।",
    replies: ["সময়মতো আসছি।", "পরিবার নিয়ে আসছি।", "আসছি, দোয়ায় রাখব।"],
    caption: "আমাদের বাসায় মিলাদ ও দোয়ার দাওয়াত রইল।",
    time: "17:00", place: "আমাদের বাসা, চকবাজার",
    palette: { paper: "#f6f4ee", ink: "#0f4744", soft: "#4f6664", gold: ["#d3ac55", "#a9822f", "#6f5318"], ribbon: "#1d6b66", band: darkBand("#0f3735") },
  },
  {
    id: "puja", chip: "পূজা", heading: "নিমন্ত্রণ", pair: false,
    fields: [{ label: "কাদের বাড়ি?", sample: "দত্ত বাড়ি" }, { label: "কোন পূজা?", sample: "লক্ষ্মীপূজা", optional: true }],
    noun: "পূজা", nounOf: "পূজার", nounIn: "পূজায়",
    big: b => b || "পূজা",
    invite: "পূজার দিনে আমাদের বাড়িতে সপরিবারে নিমন্ত্রিত।",
    line: "প্রসাদ রাখা থাকবে, তুমি এলেই হলো।",
    replies: ["সকাল সকাল আসছি!", "প্রসাদের লোভে আসছি!", "পরিবার নিয়ে আসছি।"],
    caption: "আমাদের বাড়িতে পূজার নিমন্ত্রণ রইল, সবাই এসো।",
    time: "10:00", place: "আমাদের বাড়ি, তাঁতিবাজার",
    palette: { paper: "#fff8ec", ink: "#8e1016", soft: "#7a4a2a", gold: ["#dcae4a", "#c08a22", "#80560f"], ribbon: "#c8102e", band: darkBand("#7d0d13") },
  },
  {
    id: "jonmodin", chip: "জন্মদিন", heading: "জন্মদিনের দাওয়াত", pair: false,
    fields: [{ label: "কার জন্মদিন?", sample: "রাফি" }],
    noun: "জন্মদিন", nounOf: "জন্মদিনের", nounIn: "জন্মদিনে",
    invite: "জন্মদিনের ছোট্ট আয়োজনে সবান্ধবে আমন্ত্রিত।",
    line: "কেকের ভাগ চাইলে আসতেই হবে।",
    replies: ["কেক কাটার আগেই আসছি!", "উপহার নিয়ে আসছি।", "গান গাইতে আসছি!"],
    caption: "জন্মদিনের দাওয়াত রইল, চলে এসো!",
    time: "19:00", place: "আমাদের বাসা, মোহাম্মদপুর",
    palette: { paper: "#173f73", ink: "#f4f1e8", soft: "#c4d3ea", gold: ["#fff0c2", "#e2b552", "#94681a"], ribbon: "#e0473a", band: darkBand("#0d2747") },
  },
  {
    id: "khela", chip: "খেলা দেখা", heading: "খেলা দেখার আসর", pair: false,
    fields: [{ label: "আয়োজক", sample: "রাফি" }, { label: "কোন খেলা?", sample: "বাংলাদেশের ম্যাচ", optional: true }],
    noun: "খেলা দেখার আসর", nounOf: "খেলা দেখার", nounIn: "খেলা দেখার আসরে",
    big: b => b || "খেলা দেখা",
    invite: "একসাথে চিৎকার করার আসরে তোমার দাওয়াত",
    line: "গোল বা ছক্কায় একা চিৎকার করা যায় না।",
    replies: ["জার্সি পরে আসছি!", "চানাচুর-মুড়ি নিয়ে আসছি!", "খেলা শুরুর আগেই আসছি!"],
    caption: "খেলা দেখার দাওয়াত! জার্সি পরে চলে এসো।",
    time: "19:30", place: "রাফির বাসার ছাদ",
    palette: { paper: "#0f5a37", ink: "#f2f7ef", soft: "#bfe0c9", gold: ["#fff3c4", "#e9c055", "#9a7116"], ribbon: "#d7262e", band: darkBand("#08341f") },
  },
] as const satisfies readonly Occasion[];

export type OccasionId = (typeof occasions)[number]["id"];
export const occasionIds = occasions.map(occasion => occasion.id);
export const occasionById = (id: OccasionId): Occasion => occasions.find(occasion => occasion.id === id)!;

/** What an invitation link carries. Every text field is capped; there is no phone field. */
export type Invite = { occasion: OccasionId; a: string; b: string; date: string; time: string; place: string; map: string };
/** A shared state: an invitation, or the guest's reply to one (guest !== null). A reply drops the place and map. */
export type Shared = Invite & { guest: string | null; pick: number };

function clean(text: string, max: number) {
  // Control and bidi-override characters could scramble the card; ZWJ/ZWNJ stay because Bangla shaping needs them.
  // Runs of 7+ digits are dropped so a phone number can't ride along in a link.
  const flat = text.normalize("NFC").replace(/[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g, " ")
    .replace(/[0-9০-৯](?:[\s\-.]*[0-9০-৯]){6,}/g, " ").replace(/\s+/g, " ").trim();
  return Array.from(flat).slice(0, max).join("").trim();
}
export const cleanName = (text: string) => clean(text, MAX_NAME);
export const cleanPlace = (text: string) => clean(text, MAX_PLACE);

/** A Google Maps link, or "" for anything else. Accepts the "Check out this place: https://…" text Maps shares. */
export function cleanMapLink(raw: string): string {
  const found = raw.normalize("NFC").match(/https?:\/\/[^\s<>"]+/i)?.[0];
  if (!found || found.length > MAX_MAP) return "";
  let url: URL;
  try { url = new URL(found); } catch { return ""; }
  if (url.username || url.password || url.port) return "";
  const host = url.hostname.toLowerCase();
  const maps = url.pathname === "/maps" || url.pathname.startsWith("/maps/");
  const ok = host === "maps.app.goo.gl" || host === "maps.google.com" || host === "maps.google.com.bd"
    || (host === "goo.gl" && maps) || (/^(www\.)?google\.com(\.bd)?$/.test(host) && maps);
  if (!ok) return "";
  url.protocol = "https:";
  url.hash = "";
  return url.href.length <= MAX_MAP ? url.href : "";
}

/** "YYYY-MM-DD" for a real calendar day in 2020–2100, else "". */
export function cleanDate(text: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return "";
  const [y, m, d] = match.slice(1).map(Number);
  const day = new Date(Date.UTC(y, m - 1, d));
  return y >= 2020 && y <= 2100 && day.getUTCMonth() === m - 1 && day.getUTCDate() === d ? text : "";
}
export const cleanTime = (text: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(text) ? text : "";

export function cleanInvite(invite: Invite): Invite {
  const occasion = occasionById(invite.occasion);
  return {
    occasion: occasion.id as OccasionId,
    a: cleanName(invite.a), b: occasion.fields.length > 1 ? cleanName(invite.b) : "",
    date: cleanDate(invite.date), time: cleanTime(invite.time), place: cleanPlace(invite.place), map: cleanMapLink(invite.map),
  };
}

// ---- dates in Bangla ----
const DIGITS = "০১২৩৪৫৬৭৮৯";
export const bn = (value: number | string) => String(value).replace(/\d/g, digit => DIGITS[Number(digit)]);
const WEEKDAYS = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
const MONTHS = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
const BANGLA_MONTHS = ["বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন", "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"];
const DAY = 86_400_000;

export type DateParts = { weekday: string; day: string; month: string; year: string; bangla: string };

export function dateParts(date: string): DateParts | null {
  if (!cleanDate(date)) return null;
  const [y, m, d] = date.split("-").map(Number);
  const time = Date.UTC(y, m - 1, d);
  return { weekday: WEEKDAYS[new Date(time).getUTCDay()], day: bn(d), month: MONTHS[m - 1], year: bn(y), bangla: banglaDate(y, m, d) };
}

/**
 * Bangladesh's revised Bangla calendar (2019): the year starts on 14 April; বৈশাখ–আশ্বিন have 31 days,
 * কার্তিক–মাঘ and চৈত্র 30, ফাল্গুন 29 (30 when that February has a 29th). So 16 Dec = ১ পৌষ, 21 Feb = ৮ ফাল্গুন.
 * Source: https://en.wikipedia.org/wiki/Bengali_calendars (Bangladesh's 2019 revision); the anchors above are checked in tests.
 */
export function banglaDate(y: number, m: number, d: number) {
  const time = Date.UTC(y, m - 1, d);
  const startYear = time >= Date.UTC(y, 3, 14) ? y : y - 1;
  let offset = Math.round((time - Date.UTC(startYear, 3, 14)) / DAY);
  const leap = (startYear + 1) % 4 === 0 && ((startYear + 1) % 100 !== 0 || (startYear + 1) % 400 === 0);
  const lengths = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, leap ? 30 : 29, 30];
  let month = 0;
  while (offset >= lengths[month]) offset -= lengths[month++];
  return `${bn(offset + 1)} ${BANGLA_MONTHS[month]} ${bn(startYear - 593)}`;
}

/** "সন্ধ্যা ৭টা", "দুপুর ১২:৩০". */
export function timeText(time: string) {
  if (!cleanTime(time)) return "";
  const [h, min] = time.split(":").map(Number);
  const part = h < 4 ? "রাত" : h < 6 ? "ভোর" : h < 12 ? "সকাল" : h < 15 ? "দুপুর" : h < 18 ? "বিকেল" : h < 20 ? "সন্ধ্যা" : "রাত";
  const hour = bn(h % 12 || 12);
  return min ? `${part} ${hour}:${bn(String(min).padStart(2, "0"))}` : `${part} ${hour}টা`;
}

/** "শনিবার, ১২ ডিসেম্বর" (+ year when asked). */
export function dateText(date: string, withYear = false) {
  const parts = dateParts(date);
  return parts ? `${parts.weekday}, ${parts.day} ${parts.month}${withYear ? ` ${parts.year}` : ""}` : "";
}

// ---- words ----
/** "রাফি ও মিমের", "আয়ানের", or "" when no name is given. */
export function whose(invite: Pick<Invite, "occasion" | "a" | "b">) {
  const occasion = occasionById(invite.occasion);
  const a = cleanName(invite.a), b = occasion.pair ? cleanName(invite.b) : "";
  if (a && b) return `${a} ও ${possessive(b)}`;
  return a || b ? possessive(a || b) : "";
}
const join = (who: string, word: string) => who ? `${who} ${word}` : word;

/** "রাফি ও মিমের বিয়ে" (দত্ত বাড়ির লক্ষ্মীপূজা). */
export function titleOf(invite: Invite) {
  const occasion = occasionById(invite.occasion);
  if (invite.occasion === "puja" && cleanName(invite.b)) return join(whose(invite), cleanName(invite.b));
  return join(whose(invite), occasion.noun);
}
/** Link preview: "রাফি ও মিমের বিয়ের দাওয়াত". */
export function inviteTitle(invite: Invite) {
  const occasion = occasionById(invite.occasion);
  return `${join(whose(invite), occasion.nounOf)} ${invite.occasion === "puja" ? "নিমন্ত্রণ" : "দাওয়াত"}`;
}
/** "রাফি ও মিমের বিয়েতে". */
export const replyTo = (invite: Invite) => join(whose(invite), occasionById(invite.occasion).nounIn);

/** "নাদিয়া আসছে! রাফি ও মিমের বিয়েতে". */
export function replyTitle(shared: Shared) {
  const guest = cleanName(shared.guest ?? "");
  return `${guest ? `${guest} আসছে!` : "একজন আসছে!"} ${replyTo(shared)}`;
}

/** The big words on the card: a pair of names, one name, or the event itself with the host underneath. */
export function cardWords(invite: Invite): { big: string[]; host: string } {
  const occasion = occasionById(invite.occasion);
  const a = cleanName(invite.a), b = cleanName(invite.b);
  if (occasion.pair) return { big: [a, b].filter(Boolean).length ? [a, b].filter(Boolean) : [occasion.noun], host: "" };
  if ("big" in occasion && occasion.big) return { big: [occasion.big(b)], host: a ? `আয়োজনে: ${a}` : "" };
  return { big: [a || occasion.noun], host: "" };
}

/** The human line: a Friday or winter twist for the festive ones, else the occasion's own line. */
export function humanLine(invite: Invite) {
  const occasion = occasionById(invite.occasion);
  const parts = dateParts(invite.date);
  const festive = ["biye", "holud", "boubhat", "jonmodin"].includes(invite.occasion);
  if (festive && parts?.weekday === "শুক্রবার") return "শুক্রবারের দাওয়াত, অফিসের অজুহাত চলবে না।";
  if (invite.occasion === "biye" && invite.date && [12, 1].includes(Number(invite.date.slice(5, 7)))) return "শীতের রাতে বিয়েবাড়ি, তুমি ছাড়া জমবে না।";
  return occasion.line;
}

export const replyLine = (shared: Shared) => occasionById(shared.occasion).replies[shared.pick] ?? occasionById(shared.occasion).replies[0];

// ---- links ----
export function shareHash(invite: Invite) {
  const clean = cleanInvite(invite);
  const params = new URLSearchParams({ o: clean.occasion });
  for (const [key, value] of [["a", clean.a], ["b", clean.b], ["d", clean.date], ["t", clean.time], ["p", clean.place], ["m", clean.map]] as const) if (value) params.set(key, value);
  return "#" + params.toString();
}

/** The guest's reply link: who invited, the date, the guest's name and their pick. No place, time or map. */
export function replyHash(invite: Invite, guest: string, pick: number) {
  const clean = cleanInvite(invite);
  const params = new URLSearchParams({ o: clean.occasion });
  for (const [key, value] of [["a", clean.a], ["b", clean.b], ["d", clean.date]] as const) if (value) params.set(key, value);
  params.set("r", cleanName(guest));
  const replies = occasionById(clean.occasion).replies;
  params.set("x", String(Number.isInteger(pick) && pick >= 0 && pick < replies.length ? pick : 0));
  return "#" + params.toString();
}

export function parseShareHash(hash: string): Shared | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const occasion = occasions.find(item => item.id === params.get("o"));
  if (!occasion) return null;
  const get = (key: string) => params.get(key) ?? "";
  const reply = params.has("r");
  const invite = cleanInvite({ occasion: occasion.id, a: get("a"), b: get("b"), date: get("d"), time: reply ? "" : get("t"), place: reply ? "" : get("p"), map: reply ? "" : get("m") });
  const pick = Number(get("x"));
  return { ...invite, guest: reply ? cleanName(get("r")) : null, pick: reply && Number.isInteger(pick) && pick >= 0 && pick < occasion.replies.length ? pick : 0 };
}

export const stateOf = (shared: Shared) => (shared.guest === null ? shareHash(shared) : replyHash(shared, shared.guest, shared.pick)).slice(1);

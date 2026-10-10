import { possessive } from "../../../shared/bangla";

// Fixed, hand-written team lists. No fixtures, scores, crests, kits or league names: people pick the match themselves.
// Cricket: the 12 ICC Full Members (all Test-playing) plus associates seen at recent World Cups.
//   https://www.icc-cricket.com/about/members (checked 2026-10)
// Football: Bangladesh, its regional and Asian Cup qualifier opponents, and the big World Cup sides followed in Bangladesh.
// Spellings follow the Bangla sports desks of Prothom Alo and BBC Bangla.
// Link and tally ids use these short ids: once links are public, only append; never rename or reuse.
export const teams = {
  c: [
    { id: "ban", name: "বাংলাদেশ", group: "" },
    { id: "ind", name: "ভারত", group: "full" },
    { id: "pak", name: "পাকিস্তান", group: "full" },
    { id: "sl", name: "শ্রীলঙ্কা", group: "full" },
    { id: "afg", name: "আফগানিস্তান", group: "full" },
    { id: "aus", name: "অস্ট্রেলিয়া", group: "full" },
    { id: "eng", name: "ইংল্যান্ড", group: "full" },
    { id: "nz", name: "নিউজিল্যান্ড", group: "full" },
    { id: "sa", name: "দক্ষিণ আফ্রিকা", group: "full" },
    { id: "wi", name: "ওয়েস্ট ইন্ডিজ", group: "full" },
    { id: "zim", name: "জিম্বাবুয়ে", group: "full" },
    { id: "ire", name: "আয়ারল্যান্ড", group: "full" },
    { id: "ned", name: "নেদারল্যান্ডস", group: "assoc" },
    { id: "sco", name: "স্কটল্যান্ড", group: "assoc" },
    { id: "nep", name: "নেপাল", group: "assoc" },
    { id: "uae", name: "আরব আমিরাত", group: "assoc" },
    { id: "oma", name: "ওমান", group: "assoc" },
    { id: "usa", name: "যুক্তরাষ্ট্র", group: "assoc" },
    { id: "nam", name: "নামিবিয়া", group: "assoc" },
    { id: "can", name: "কানাডা", group: "assoc" },
  ],
  f: [
    { id: "ban", name: "বাংলাদেশ", group: "" },
    { id: "ind", name: "ভারত", group: "asia" },
    { id: "nep", name: "নেপাল", group: "asia" },
    { id: "bhu", name: "ভুটান", group: "asia" },
    { id: "mdv", name: "মালদ্বীপ", group: "asia" },
    { id: "sin", name: "সিঙ্গাপুর", group: "asia" },
    { id: "hkg", name: "হংকং", group: "asia" },
    { id: "jpn", name: "জাপান", group: "asia" },
    { id: "arg", name: "আর্জেন্টিনা", group: "world" },
    { id: "bra", name: "ব্রাজিল", group: "world" },
    { id: "por", name: "পর্তুগাল", group: "world" },
    { id: "esp", name: "স্পেন", group: "world" },
    { id: "fra", name: "ফ্রান্স", group: "world" },
    { id: "ger", name: "জার্মানি", group: "world" },
    { id: "eng", name: "ইংল্যান্ড", group: "world" },
    { id: "ned", name: "নেদারল্যান্ডস", group: "world" },
    { id: "ita", name: "ইতালি", group: "world" },
    { id: "bel", name: "বেলজিয়াম", group: "world" },
    { id: "cro", name: "ক্রোয়েশিয়া", group: "world" },
    { id: "uru", name: "উরুগুয়ে", group: "world" },
    { id: "mar", name: "মরক্কো", group: "world" },
  ],
} as const;

export const sports = [
  { id: "c", label: "ক্রিকেট", groups: [{ id: "full", label: "টেস্ট খেলুড়ে দেশ" }, { id: "assoc", label: "সহযোগী দেশ" }] },
  { id: "f", label: "ফুটবল", groups: [{ id: "asia", label: "এশিয়া" }, { id: "world", label: "বিশ্বের বড় দল" }] },
] as const;

export type SportId = keyof typeof teams;
export type Side = "a" | "b" | "d";
export type Match = { sport: SportId; a: string; b: string };
/** One person's sealed call. `pick` is a short token (see isPick); `name` is cleaned free text that only lives in the link. */
export type Entry = { pick: string; name: string };
export type Shared = Match & { entries: Entry[]; result: string };
export type Verdict = "exact" | "right" | "wrong";

export const MAX_ENTRIES = 6;
export const MAX_NAME_LENGTH = 20;
export const MAX_GOALS = 5;
/** A pair needs this many counted calls before "৭৮% বলছে…" means anything; same bar as the other tools. */
export const SPLIT_MIN = 20;
export const wickets = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export const runBands = [
  { id: "r1", label: "১–১০" },
  { id: "r2", label: "১১–৩০" },
  { id: "r3", label: "৩১–৬০" },
  { id: "r4", label: "৬১–১০০" },
  { id: "r5", label: "১০০-র বেশি" },
] as const;
export const defaults: Record<SportId, Match & { pick: string }> = {
  c: { sport: "c", a: "ban", b: "sl", pick: "aw5" },
  // A draw, so the sample takes no side in the Argentina–Brazil argument.
  f: { sport: "f", a: "arg", b: "bra", pick: "11" },
};

const numbers = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => numbers.format(value);

export const isSport = (value: unknown): value is SportId => value === "c" || value === "f";
export const isTeam = (sport: SportId, id: string) => teams[sport].some(team => team.id === id);
export const teamName = (sport: SportId, id: string) => teams[sport].find(team => team.id === id)?.name ?? "";
export const sideName = (match: Match, side: "a" | "b") => teamName(match.sport, match[side]);
export const matchTitle = (match: Match) => `${sideName(match, "a")} বনাম ${sideName(match, "b")}`;
export const sportLabel = (sport: SportId) => sports.find(item => item.id === sport)!.label;

// Cricket: winner side plus an optional margin (w1–w10 wickets, r1–r5 run bands), or d for a draw.
// Football: the score as two digits, team a first ("21" = a wins 2-1).
const CRICKET_PICK = /^(?:[ab](?:w(?:10|[1-9])|r[1-5])?|d)$/;
const FOOTBALL_PICK = /^[0-5][0-5]$/;
export const isPick = (sport: SportId, token: string) => (sport === "c" ? CRICKET_PICK : FOOTBALL_PICK).test(token);

export function readPick(sport: SportId, token: string): { side: Side; margin: string; goals: [number, number] } {
  if (sport === "f") {
    const goals: [number, number] = [Number(token[0]) || 0, Number(token[1]) || 0];
    return { side: goals[0] > goals[1] ? "a" : goals[0] < goals[1] ? "b" : "d", margin: "", goals };
  }
  return { side: token[0] === "b" ? "b" : token[0] === "a" ? "a" : "d", margin: token.slice(1), goals: [0, 0] };
}

export const cricketPick = (side: Side, margin = "") => (side === "d" ? "d" : side + margin);
const goal = (value: number) => Math.max(0, Math.min(MAX_GOALS, Math.round(value) || 0));
export const footballPick = (a: number, b: number) => `${goal(a)}${goal(b)}`;

function marginText(margin: string) {
  if (margin.startsWith("w")) return `${bn(Number(margin.slice(1)))} উইকেটে`;
  const band = runBands.find(item => item.id === margin);
  return band ? `${band.label} রানে` : "";
}

/** "বাংলাদেশ জিতবে ৫ উইকেটে", or in the past tense once the match is over: "বাংলাদেশ জিতেছে ৫ উইকেটে". */
export function pickText(match: Match, token: string, past = false) {
  const { side, margin, goals } = readPick(match.sport, token);
  const will = past ? "হয়েছে" : "হবে";
  if (match.sport === "f") {
    const [high, low] = [Math.max(...goals), Math.min(...goals)];
    if (side === "d") return high === 0 ? `গোলশূন্য ড্র ${will}` : `${bn(high)}-${bn(low)} গোলে ড্র ${will}`;
    return `${sideName(match, side)} ${past ? "জিতেছে" : "জিতবে"} ${bn(high)}-${bn(low)} গোলে`;
  }
  if (side === "d") return `খেলা ড্র ${will}`;
  return [sideName(match, side), past ? "জিতেছে" : "জিতবে", marginText(margin)].filter(Boolean).join(" ");
}

/** Right winner is a hit; the exact margin or score as well is "হুবহু". A cricket result without a margin can only be a hit. */
export function verdict(sport: SportId, pick: string, result: string): Verdict {
  const call = readPick(sport, pick);
  const real = readPick(sport, result);
  if (call.side !== real.side) return "wrong";
  if (sport === "f") return pick === result ? "exact" : "right";
  return real.margin && call.margin === real.margin ? "exact" : "right";
}
export const verdictLabel: Record<Verdict, string> = { exact: "হুবহু মিলেছে", right: "মিলেছে", wrong: "মেলেনি" };

export function cleanName(name: string) {
  // NFC so one name has one spelling; strip control and bidi-override characters so a link can't scramble the card.
  const flat = name.normalize("NFC").replace(/[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g, " ").replace(/\s+/g, " ").trim();
  return Array.from(flat).slice(0, MAX_NAME_LENGTH).join("").trim();
}

/** The name shown for a call; blank names still get a stable label. */
export const displayName = (entry: Entry, index: number) => entry.name || (index === 0 ? "আমি" : `বন্ধু ${bn(index + 1)}`);
const owner = (entries: readonly Entry[]) => (entries[0]?.name ? possessive(entries[0].name) : "");

export function shareHash(shared: Shared) {
  const params = new URLSearchParams({ s: shared.sport, a: shared.a, b: shared.b });
  for (const entry of shared.entries.slice(0, MAX_ENTRIES)) {
    const name = cleanName(entry.name);
    params.append("p", name ? `${entry.pick}.${name}` : entry.pick);
  }
  if (shared.result) params.set("r", shared.result);
  return "#" + params.toString();
}

export function parseShareHash(hash: string): Shared | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const sport = params.get("s");
  const a = params.get("a") ?? "";
  const b = params.get("b") ?? "";
  if (!isSport(sport) || !isTeam(sport, a) || !isTeam(sport, b) || a === b) return null;
  const entries = params.getAll("p").map(raw => {
    // Pick tokens never contain ".", so everything after the first one is the name (which may).
    const dot = raw.indexOf(".");
    return { pick: dot < 0 ? raw : raw.slice(0, dot), name: dot < 0 ? "" : cleanName(raw.slice(dot + 1)) };
  }).filter(entry => isPick(sport, entry.pick)).slice(0, MAX_ENTRIES);
  if (!entries.length) return null;
  const result = params.get("r") ?? "";
  return { sport, a, b, entries, result: isPick(sport, result) ? result : "" };
}

// Tally ids: sport, the two teams in a fixed order, then the winning team (or d). Never names or margins.
const pairKey = (match: Match) => `${match.sport}.${[match.a, match.b].sort().join("-")}`;
export function tallyId(match: Match, pick: string) {
  const { side } = readPick(match.sport, pick);
  return `${pairKey(match)}.${side === "d" ? "d" : match[side]}`;
}
export const tallyIds: string[] = (Object.keys(teams) as SportId[]).flatMap(sport => teams[sport].flatMap((first, index) => teams[sport].slice(index + 1).flatMap(second => {
  const key = pairKey({ sport, a: first.id, b: second.id });
  return [first.id, second.id, "d"].map(winner => `${key}.${winner}`);
})));

/** "৭৮% বলছে বাংলাদেশ" for this pair, once enough people have counted a call for it. */
export function pairSplit(match: Match, counts: Record<string, number>) {
  const options = [
    { label: sideName(match, "a"), count: counts[`${pairKey(match)}.${match.a}`] ?? 0 },
    { label: sideName(match, "b"), count: counts[`${pairKey(match)}.${match.b}`] ?? 0 },
    { label: "ড্র", count: counts[`${pairKey(match)}.d`] ?? 0 },
  ];
  const total = options.reduce((sum, option) => sum + option.count, 0);
  const lead = options.reduce((best, option) => (option.count > best.count ? option : best));
  return { total, text: total >= SPLIT_MIN ? `${bn(Math.round((lead.count / total) * 100))}% বলছে ${lead.label}` : "" };
}

/** The line under a sealed envelope, picked from the call itself. */
export function sealedLine(shared: Shared) {
  const { entries, sport } = shared;
  if (entries.length > 1) {
    const sides = new Set(entries.map(entry => readPick(sport, entry.pick).side));
    return sides.size === 1 ? "সবাই এক কথা বলছে। এবার দেখা যাক মাঠ কী বলে।" : "এক খামে নানা কথা। খেলার পর দেখা যাবে কে ঠিক।";
  }
  const { side, margin, goals } = readPick(sport, entries[0].pick);
  if (side === "d") return "কেউ হারবে না, এটাই আমার কথা।";
  const gap = Math.abs(goals[0] - goals[1]);
  const close = sport === "f" ? gap === 1 : margin === "w1" || margin === "w2" || margin === "r1";
  const big = sport === "f" ? gap >= 3 : ["w8", "w9", "w10", "r4", "r5"].includes(margin);
  if (close) return sport === "f" ? "শেষ বাঁশি পর্যন্ত টানটান থাকবে।" : "শেষ ওভার পর্যন্ত নখ কামড়াতে হবে।";
  if (big) return "একতরফা খেলা হবে, লিখে রাখলাম।";
  const bangladesh = shared.a === "ban" ? "a" : shared.b === "ban" ? "b" : "";
  if (bangladesh && side === bangladesh) return "লাল-সবুজের ওপর ভরসা রেখেই বলে দিলাম।";
  if (bangladesh) return "মন যা-ই বলুক, খামে সত্যি কথাটাই লিখলাম।";
  return "খেলার আগেই বলে রাখলাম, পরে কেউ বলতে পারবে না ‘আগে বলোনি’।";
}

export type CardRow = { name: string; text: string; verdict: Verdict | null };
export type Card = {
  opened: boolean;
  sport: SportId;
  /** "বাংলাদেশ বনাম শ্রীলঙ্কা", written on the envelope like an address. */
  match: string;
  kicker: string;
  title: string;
  line: string;
  /** Who is inside a sealed envelope. */
  inside: string;
  rows: CardRow[];
  /** "ফল: বাংলাদেশ জিতেছে ৫ উইকেটে", once someone has marked the result. */
  result: string;
  caption: string;
};

const joinNames = (names: string[]) => (names.length <= 2 ? names.join(" আর ") : `${names.slice(0, -1).join(", ")} আর ${names.at(-1)}`);
/** "রাফি বলেছিল", but "আমি বলেছিলাম" / "আমি আর মিম বলেছিলাম" once "আমি" is among them. */
const said = (names: string[]) => `${joinNames(names)} ${names.includes("আমি") ? "বলেছিলাম" : "বলেছিল"}`;

export function createCard(shared: Shared, opened: boolean): Card {
  const match = matchTitle(shared);
  const rows = shared.entries.map((entry, index) => ({
    name: displayName(entry, index),
    text: pickText(shared, entry.pick),
    verdict: opened && shared.result ? verdict(shared.sport, entry.pick, shared.result) : null,
  }));
  const single = rows.length === 1;
  const base = { opened, sport: shared.sport, match, rows, inside: single && !shared.entries[0].name ? "ভেতরে: একটা ভবিষ্যদ্বাণী" : `ভেতরে: ${joinNames(rows.map(row => row.name))}` };
  if (!opened) {
    const who = single ? (owner(shared.entries) ? `${owner(shared.entries)} ভবিষ্যদ্বাণী` : "আমার ভবিষ্যদ্বাণী") : `${bn(rows.length)} জনের ভবিষ্যদ্বাণী`;
    return {
      ...base, kicker: `${sportLabel(shared.sport)} · খেলার আগে সিল করা`, title: who, line: sealedLine(shared), result: "",
      caption: single
        ? `খেলার আগেই বলে রাখলাম! ${match}, আমার ভবিষ্যদ্বাণী সিল করা খামে। খেলা শেষে খুলব। তুমি কী বলো?`
        : `${match}: ${bn(rows.length)} জনের ভবিষ্যদ্বাণী এক খামে সিল করা। খেলা শেষে খুলব! তোমারটাও যোগ করো:`,
    };
  }
  const kicker = `${match} · খাম খোলা হলো`;
  if (!shared.result) {
    return {
      ...base, kicker: `${match} · ${sportLabel(shared.sport)}`, title: "খাম খোলা হলো!",
      line: "খামটা সাক্ষী, খেলার আগেই বলা হয়েছিল।", result: "",
      caption: `${match}: খেলার আগে সিল করা খামটা খুললাম। ${single ? rows[0].text : "কে কী বলেছিল দেখো"}!`,
    };
  }
  const result = `ফল: ${pickText(shared, shared.result, true)}`;
  const hits = rows.filter(row => row.verdict !== "wrong");
  const exact = rows.find(row => row.verdict === "exact");
  if (single) {
    const hit = hits.length === 1;
    return {
      ...base, kicker, result,
      title: hit ? "আমি বলেছিলাম!" : "এবার মেলেনি",
      line: exact ? "শুধু জেতা না, ব্যবধানটাও মিলিয়ে দিলাম!" : hit ? "খামটা সাক্ষী, খেলার আগেই বলেছিলাম।" : "ভবিষ্যদ্বাণী মেলেনি, কিন্তু সাপোর্ট এক চুলও কমেনি।",
      caption: hit ? `আমি বলেছিলাম! খেলার আগেই খামে লিখেছিলাম: ${rows[0].text}। ${exact ? "হুবহু মিলে গেছে!" : "মিলেও গেছে!"} তোমার ভবিষ্যদ্বাণী কী ছিল?` : `এবার মেলেনি, কিন্তু খেলার আগে খামে লিখে তো রেখেছিলাম! ${match}, পরের খেলায় আবার।`,
    };
  }
  const title = !hits.length ? "কেউ মেলাতে পারেনি!" : hits.length === rows.length ? "সবাই বলেছিল!" : hits.length <= 2 ? `${said(hits.map(row => row.name))}!` : `${bn(hits.length)} জন বলেছিল!`;
  return {
    ...base, kicker, result, title,
    line: exact ? (exact.name === "আমি" ? "আমি তো ব্যবধানটাও মিলিয়ে দিয়েছি!" : `${exact.name} তো ব্যবধানটাও মিলিয়ে দিয়েছে!`) : hits.length ? "খামটা সাক্ষী, কে কী বলেছিল।" : "মাঠ আজ সবাইকে অবাক করে দিল।",
    caption: `${match}: সিল ভেঙে দেখা গেল, ${title.replace(/!$/, "")}! ${result}। তোমার ভবিষ্যদ্বাণী কী ছিল?`,
  };
}

/** Link-preview title for chat apps. A sealed preview never gives the call away. */
export function previewTitle(shared: Shared) {
  const match = matchTitle(shared);
  const count = shared.entries.length;
  const first = shared.entries[0].name;
  if (shared.result) {
    const card = createCard(shared, true);
    return count === 1 ? `${first ? `${first} বলেছিল` : "আমি বলেছিলাম"}, ${card.rows[0].verdict === "wrong" ? "এবার মেলেনি" : "মিলেও গেছে"}! ${match}` : `${match}: খাম খোলা হলো, ${card.title}`;
  }
  const who = count === 1 ? (first ? possessive(first) : "এক বন্ধুর") : first ? `${first}সহ ${bn(count)} জনের` : `${bn(count)} জনের`;
  return `${who} ভবিষ্যদ্বাণী সিল করা খামে: ${match}`;
}

import { possessive } from "../../../shared/bangla";

export const MAX_MOODS = 60;
export const MAX_TEXT = 24;
/** A worm needs a few taps before it says anything about a match. */
export const MIN_SHARE = 3;
/** Below this many counted matches a percentage is noise, same bar as the other tools. */
export const SPLIT_MIN = 20;

// Link digits are positions in this list, and the position is also the graph row (0 = top).
// Once links are public, never reorder or rename. Faces are 48×48 paths shared by the page SVG and the card canvas:
// `light` is filled white (eyes, teeth, sweat, tear), `dark` filled ink, `lines` stroked ink.
export const moods = [
  { id: "ullash", label: "উল্লাস", color: "#f5b80b", deep: "#8a5a00", light: "", dark: "M13 26h22c0 7-5 12-11 12s-11-5-11-12Z", lines: "M13.5 19.5q3.5-4.5 7 0M27.5 19.5q3.5-4.5 7 0" },
  { id: "asha", label: "আশা", color: "#43b072", deep: "#1c6a3f", light: "", dark: "M16.3 19.5a2.4 2.4 0 1 0 4.8 0a2.4 2.4 0 1 0-4.8 0M26.9 19.5a2.4 2.4 0 1 0 4.8 0a2.4 2.4 0 1 0-4.8 0", lines: "M14 14.5q3.5-3 7-1M27 13.5q3.5-2 7 1M17.5 30q6.5 5 13 0" },
  { id: "uttejona", label: "উত্তেজনা", color: "#f2763c", deep: "#a13d14", light: "M14 20a4 4 0 1 0 8 0a4 4 0 1 0-8 0M26 20a4 4 0 1 0 8 0a4 4 0 1 0-8 0M15 28.5h18v7H15Z", dark: "M16.6 20a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0M28.6 20a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0", lines: "M14 20a4 4 0 1 0 8 0a4 4 0 1 0-8 0M26 20a4 4 0 1 0 8 0a4 4 0 1 0-8 0M15 28.5h18v7H15ZM15 32h18M21 28.5v7M27 28.5v7M13.5 13l6 1.5M34.5 13l-6 1.5" },
  { id: "bhoy", label: "ভয়", color: "#6f90e2", deep: "#2c4c9c", light: "M15 21a3.5 4.5 0 1 0 7 0a3.5 4.5 0 1 0-7 0M26 21a3.5 4.5 0 1 0 7 0a3.5 4.5 0 1 0-7 0M38.5 8.5c2.5 4 3 6.5 0 8.5-3-2-2.5-4.5 0-8.5Z", dark: "M17.5 22.5a1.1 1.1 0 1 0 2.2 0a1.1 1.1 0 1 0-2.2 0M28.3 22.5a1.1 1.1 0 1 0 2.2 0a1.1 1.1 0 1 0-2.2 0M20.5 33a3.5 4 0 1 0 7 0a3.5 4 0 1 0-7 0", lines: "M15 21a3.5 4.5 0 1 0 7 0a3.5 4.5 0 1 0-7 0M26 21a3.5 4.5 0 1 0 7 0a3.5 4.5 0 1 0-7 0M14.5 14.5l6-3M33.5 14.5l-6-3" },
  { id: "hotasha", label: "হতাশা", color: "#9ba2b0", deep: "#4c5362", light: "M17.5 25.5c1.6 2.6 2 4.2 0 5.6-2-1.4-1.6-3 0-5.6Z", dark: "", lines: "M14 15.5l6.5 2.5M34 15.5l-6.5 2.5M14.5 22q3 2.4 6 0M27.5 22q3 2.4 6 0M17 35q7-6.5 14 0" },
] as const;

export const sports = [
  { id: "cricket", label: "ক্রিকেট", hint: "প্রতি ওভার শেষে মন যেমন, সেই মুখে চাপো" },
  { id: "football", label: "ফুটবল", hint: "গোল, মিস বা বড় মুহূর্তে মন যেমন, চাপো" },
] as const;

export type SportId = (typeof sports)[number]["id"];
export type Worm = { moods: number[]; name: string };
/** One person's match, plus (when they came from a friend's link) the friend's worm drawn over it. */
export type Match = { sport: SportId; moods: number[]; name: string; label: string; friend: Worm | null };
export type Part = { text: string; mood?: number };
export type Tally = { total: number; counts: Record<string, number> };

/** A last-over chase, so the first screen already shows what a worm looks like. */
export const SAMPLE = [1, 2, 1, 3, 4, 2, 1, 1, 2, 3, 4, 4, 2, 1, 2, 3, 2, 1, 0, 0];

const numbers = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => numbers.format(value);
export const isSport = (id: unknown): id is SportId => sports.some(sport => sport.id === id);
export const sportOf = (id: SportId) => sports.find(sport => sport.id === id)!;

export function cleanText(text: string) {
  // NFC so one name has one spelling; drop control and bidi-override characters so a link can't scramble the card.
  const flat = text.normalize("NFC").replace(/[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g, " ").replace(/\s+/g, " ").trim();
  return Array.from(flat).slice(0, MAX_TEXT).join("").trim();
}

export const encodeMoods = (list: readonly number[]) => list.slice(0, MAX_MOODS).join("");

export function decodeMoods(code: string | null): number[] {
  if (!code || !/^[0-4]+$/.test(code)) return [];
  return Array.from(code.slice(0, MAX_MOODS), Number);
}

export function shareHash({ sport, moods: list, name, label, friend }: Match) {
  const params = new URLSearchParams({ k: sport, m: encodeMoods(list) });
  if (cleanText(name)) params.set("n", cleanText(name));
  if (cleanText(label)) params.set("l", cleanText(label));
  if (friend?.moods.length) {
    params.set("f", encodeMoods(friend.moods));
    if (cleanText(friend.name)) params.set("fn", cleanText(friend.name));
  }
  return "#" + params.toString();
}

/** Reads a saved match, which may have no taps yet. Unknown sport or an oversized string means nothing to read. */
export function readMatch(hash: string): Match | null {
  if (hash.length > 2000) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const sport = params.get("k");
  if (!isSport(sport)) return null;
  const friendMoods = decodeMoods(params.get("f"));
  return {
    sport,
    moods: decodeMoods(params.get("m")),
    name: cleanText(params.get("n") ?? ""),
    label: cleanText(params.get("l") ?? ""),
    friend: friendMoods.length ? { moods: friendMoods, name: cleanText(params.get("fn") ?? "") } : null,
  };
}

/** A shared link: a match with at least one tap. In-page anchors like #result read as nothing. */
export function parseShareHash(hash: string): Match | null {
  const match = readMatch(hash);
  return match?.moods.length ? match : null;
}

/** Cricket: one tap ≈ one over, on an axis of at least 20 overs. Football: taps spread over the 90 minutes. */
export const axisSpan = (sport: SportId, longest: number) => sport === "cricket" ? Math.max(20, Math.ceil(longest / 5) * 5) : Math.max(longest, 1);

/** Graph points (x 0–1, row 0–4), starting from the kick-off in the middle row. `longest` keeps two cricket worms on one over scale. */
export function wormPoints(list: readonly number[], sport: SportId, longest = list.length) {
  const span = sport === "cricket" ? axisSpan(sport, longest) : Math.max(list.length, 1);
  return [{ x: 0, row: 2 }, ...list.map((row, index) => ({ x: (index + 1) / span, row }))];
}

/** Smooth S-curves between points with no overshoot past the top or bottom row; an SVG path that canvas reads via Path2D too. */
export function curvePath(points: ReadonlyArray<{ x: number; y: number }>) {
  const r = (value: number) => Math.round(value * 10) / 10;
  return points.map((point, index) => {
    if (!index) return `M${r(point.x)} ${r(point.y)}`;
    const previous = points[index - 1];
    const mid = r((previous.x + point.x) / 2);
    return `C${mid} ${r(previous.y)} ${mid} ${r(point.y)} ${r(point.x)} ${r(point.y)}`;
  }).join("");
}

export function axisTicks(sport: SportId, longest: number) {
  if (sport === "football") return [{ x: 0, label: "০'" }, { x: 0.5, label: "৪৫' বিরতি" }, { x: 1, label: "৯০'" }];
  const span = axisSpan(sport, longest);
  const step = span > 30 ? 10 : 5;
  return Array.from({ length: span / step + 1 }, (_, index) => ({ x: (index * step) / span, label: bn(index * step) }));
}
export const axisUnit = (sport: SportId) => sport === "cricket" ? "ওভার" : "মিনিট, আন্দাজে";

export function moodCounts(list: readonly number[]) {
  const counts = moods.map(() => 0);
  for (const row of list) counts[row] += 1;
  return counts;
}

/** "৩ বার আশা, ৪ বার হতাশা, শেষে উল্লাস": the two moods tapped most before the end (in graph order), then the last one. */
export function summaryParts(list: readonly number[]): Part[] {
  if (!list.length) return [];
  const final = list[list.length - 1];
  // The last tap is said separately, so a one-off final mood isn't counted twice ("১ বার উল্লাস, শেষে উল্লাস").
  const counts = moodCounts(list.slice(0, -1));
  const top = counts.map((count, mood) => ({ count, mood })).filter(item => item.count).sort((a, b) => b.count - a.count || a.mood - b.mood).slice(0, 2).sort((a, b) => a.mood - b.mood);
  const parts: Part[] = [];
  top.forEach((item, index) => parts.push({ text: `${index ? ", " : ""}${bn(item.count)} বার ` }, { text: moods[item.mood].label, mood: item.mood }));
  parts.push({ text: `${top.length ? ", " : ""}শেষে${top.some(item => item.mood === final) ? "ও" : ""} ` }, { text: moods[final].label, mood: final });
  return parts;
}
export const summaryText = (list: readonly number[]) => summaryParts(list).map(part => part.text).join("");

const finalLines = [
  "খেলা শেষে যে চিৎকারটা দিলাম, পাশের বাসাও শুনেছে।",
  "যা-ই হোক, আশাটা ছাড়িনি। পরের ম্যাচেও বসছি।",
  "খেলা শেষ, কিন্তু বুকের ধুকপুকানি এখনো থামেনি।",
  "শেষটা আর দেখতে পারিনি, চোখ ঢেকে বসে ছিলাম।",
  "রিমোটটা রেখে চুপচাপ উঠে গেলাম। তবু পরের ম্যাচে আবার বসব।",
];
/** The human line on a solo card, from how the match ended for this person. */
export const finalLine = (list: readonly number[]) => list.length ? finalLines[list[list.length - 1]] : "";

// Up (উল্লাস, আশা), middle (উত্তেজনা) or down (ভয়, হতাশা): two hearts "swing together" when they're on the same side.
const side = (row: number) => row < 2 ? 0 : row === 2 ? 1 : 2;

/** How many of the shorter worm's taps sat on the same side as the other's at the same point of the match. */
export function together(a: readonly number[], b: readonly number[], sport: SportId) {
  if (!a.length || !b.length) return null;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  // Cricket taps line up by over; football taps are compared at the same share of the 90 minutes.
  const at = (index: number) => sport === "cricket" ? long[index] : long[Math.round(((index + 1) * long.length) / short.length) - 1];
  return { same: short.filter((row, index) => side(row) === side(at(index))).length, total: short.length };
}

export function pairLine(same: number, total: number) {
  const share = same / Math.max(total, 1);
  if (share >= 0.75) return "যেন একই সোফায় বসে, একই নিঃশ্বাসে দেখেছি।";
  if (share >= 0.4) return "কখনো একসাথে, কখনো উল্টো দিকে।";
  return "একজন লাফাল, আরেকজন মাথায় হাত। দুই দলের নাকি?";
}

export const pairTitle = (same: number, total: number) => `দুজনের মন ${bn(total)} বারের ${bn(same)} বার একই দিকে দুলল`;
const pairNames = (match: Match) => `${match.name || "আমি"} আর ${match.friend?.name || "বন্ধু"}`;

export type Card = {
  sport: SportId; label: string; title: string; moods: number[]; friend: Worm | null;
  summary: Part[]; line: string; pair: string; ownName: string; friendName: string; counts: number[];
};

export function createCard(match: Match): Card {
  const score = match.friend ? together(match.moods, match.friend.moods, match.sport) : null;
  return {
    sport: match.sport,
    label: cleanText(match.label),
    title: match.friend ? pairNames(match) : match.name ? `${possessive(match.name)} ম্যাচ` : "আমার ম্যাচ",
    moods: match.moods.slice(0, MAX_MOODS),
    friend: match.friend,
    summary: summaryParts(match.moods),
    line: score ? pairLine(score.same, score.total) : finalLine(match.moods),
    pair: score ? pairTitle(score.same, score.total) : "",
    ownName: match.name || "আমি",
    friendName: match.friend?.name || "বন্ধু",
    counts: moodCounts(match.moods),
  };
}

export function previewTitle(match: Match) {
  const score = match.friend ? together(match.moods, match.friend.moods, match.sport) : null;
  if (score) {
    const names = match.name || match.friend?.name ? possessive(`${match.name || "এক বন্ধু"} আর ${match.friend?.name || "বন্ধু"}`) : "দুই বন্ধুর";
    return `${names} মন ${bn(score.total)} বারের ${bn(score.same)} বার একসাথে দুলল। তোমারটা মেলাবে?`;
  }
  return `${match.name ? possessive(match.name) : "এক বন্ধুর"} ম্যাচ: ${summaryText(match.moods)}। তোমার মন কেমন দুলল?`;
}

export function caption(match: Match) {
  const score = match.friend ? together(match.moods, match.friend.moods, match.sport) : null;
  if (score) return `${pairTitle(score.same, score.total)}! ${pairLine(score.same, score.total)} তোমার মনও মিলিয়ে দেখো:`;
  return `আমার ম্যাচের মন: ${summaryText(match.moods)}। ${finalLine(match.moods)} তোমার মন কেমন দুলল?`;
}

// Only the five fixed final-mood ids are ever counted; never names, labels or the worm itself.
export const tallyIds = moods.map(mood => mood.id);
export const finalId = (list: readonly number[]) => list.length ? moods[list[list.length - 1]].id : null;

/** Share of counted matches that ended in each mood, or null below the minimum sample. */
export function finalSplit(tally: Tally | null) {
  if (!tally) return null;
  const counts = moods.map(mood => tally.counts[mood.id] ?? 0);
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (total < SPLIT_MIN) return null;
  return { total, percents: counts.map(count => Math.round((count / total) * 100)) };
}

export { possessive };

import { possessive } from "../../../shared/bangla";

export type Side = "L" | "R";
export type Pair = { id: string; left: string; right: string };
export type Tally = { total: number; counts: Record<string, number> };

// Pair ids are tally keys and link positions: once links are public, never reorder, rename or delete a pair inside a pack.
// Playful picks only: no politics, religion, regions, brands or person-vs-person (football players excepted).
export const packs = [
  { id: "food", label: "খাবার", pairs: [
    { id: "fuchka", left: "ফুচকা", right: "চটপটি" },
    { id: "kacchi", left: "কাচ্চি", right: "তেহারি" },
    { id: "bhat", left: "ভাত", right: "রুটি" },
    { id: "ilish", left: "ইলিশ", right: "চিংড়ি" },
    { id: "singara", left: "সিঙ্গারা", right: "সমুচা" },
    { id: "khichuri", left: "খিচুড়ি", right: "পোলাও" },
    { id: "doi", left: "মিষ্টি দই", right: "রসগোল্লা" },
    { id: "vorta", left: "ভর্তা", right: "ভাজি" },
    { id: "aam", left: "আম", right: "কাঁঠাল" },
    { id: "porota", left: "পরোটা", right: "লুচি" },
    { id: "peyaju", left: "পেঁয়াজু", right: "বেগুনি" },
    { id: "jhalmuri", left: "ঝালমুড়ি", right: "চানাচুর" },
  ] },
  { id: "season", label: "ঋতু আর অভ্যাস", pairs: [
    { id: "shit", left: "শীত", right: "বর্ষা" },
    { id: "chhad", left: "ছাদ", right: "বারান্দা" },
    { id: "bhor", left: "ভোরে ওঠা", right: "রাত জাগা" },
    { id: "riksha", left: "রিকশা", right: "সিএনজি" },
    { id: "sagor", left: "সমুদ্র", right: "পাহাড়" },
    { id: "brishti", left: "বৃষ্টিতে ভেজা", right: "জানালায় বসা" },
    { id: "katha", left: "কাঁথা", right: "কম্বল" },
    { id: "call", left: "ফোন কল", right: "ভয়েস মেসেজ" },
    { id: "natok", left: "নাটক", right: "সিনেমা" },
    { id: "gosol", left: "সকালে গোসল", right: "রাতে গোসল" },
    { id: "somoy", left: "আগেভাগে হাজির", right: "‘এই তো আসছি’" },
    { id: "ghum", left: "দুপুরে ভাতঘুম", right: "দুপুরে জেগে থাকা" },
  ] },
  { id: "adda", label: "চা-আড্ডা", pairs: [
    { id: "cha", left: "চা", right: "কফি" },
    { id: "tong", left: "টং দোকান", right: "ক্যাফে" },
    { id: "dudh-cha", left: "দুধ চা", right: "লাল চা" },
    { id: "biscuit", left: "বিস্কুট চুবিয়ে", right: "বিস্কুট আলাদা" },
    { id: "chini", left: "কম চিনি", right: "বেশি চিনি" },
    { id: "bhar", left: "মাটির ভাঁড়", right: "কাচের কাপ" },
    { id: "ludu", left: "লুডু", right: "ক্যারম" },
    { id: "muri", left: "মুড়ি মাখা", right: "চানাচুর মাখা" },
    { id: "adda-jaiga", left: "ছাদে আড্ডা", right: "মাঠে আড্ডা" },
    { id: "adda-somoy", left: "বিকেলের আড্ডা", right: "রাতের আড্ডা" },
    { id: "golpo", left: "ভূতের গল্প", right: "হাসির গল্প" },
    { id: "torko", left: "ক্রিকেটের তর্ক", right: "ফুটবলের তর্ক" },
  ] },
  { id: "eid", label: "ঈদের ছুটি", pairs: [
    { id: "semai", left: "সেমাই", right: "ফিরনি" },
    { id: "jorda", left: "জর্দা", right: "পায়েস" },
    { id: "salami", left: "সালামি নেওয়া", right: "সালামি দেওয়া" },
    { id: "bari-jaoa", left: "বাসে বাড়ি", right: "ট্রেনে বাড়ি" },
    { id: "chandraat", left: "চাঁদরাতে মেহেদি", right: "চাঁদরাতে মার্কেট" },
    { id: "jama", left: "জামা আগেই দেখাই", right: "ঈদের দিন চমক" },
    { id: "polao", left: "পোলাও-রোস্ট", right: "বিরিয়ানি" },
    { id: "berano", left: "সারাদিন বেড়ানো", right: "দুপুরে ঘুম" },
    { id: "mehman", left: "আত্মীয়ের বাসায় যাই", right: "বাসায় মেহমান আসে" },
    { id: "eid-natok", left: "ঈদের নাটক", right: "ঈদের সিনেমা" },
    { id: "card", left: "হাতে লেখা ঈদকার্ড", right: "ফোনে শুভেচ্ছা" },
    { id: "ferar-din", left: "ঈদের পরদিন ফেরা", right: "পুরো ছুটি থাকা" },
  ] },
  { id: "football", label: "ফুটবল", pairs: [
    { id: "messi", left: "মেসি", right: "রোনালদো" },
    { id: "arg-bra", left: "আর্জেন্টিনা", right: "ব্রাজিল" },
    { id: "barca", left: "বার্সেলোনা", right: "রিয়াল মাদ্রিদ" },
    { id: "neymar", left: "নেইমার", right: "এমবাপে" },
    { id: "pele", left: "পেলে", right: "ম্যারাডোনা" },
    { id: "ronaldinho", left: "রোনালদিনহো", right: "জিদান" },
    { id: "wc-ucl", left: "বিশ্বকাপ", right: "চ্যাম্পিয়নস লিগ" },
    { id: "rat-jege", left: "রাত জেগে লাইভ", right: "সকালে হাইলাইটস" },
    { id: "bodo-porda", left: "বাসার টিভি", right: "বড় পর্দায় সবাই" },
    { id: "keeper", left: "গোলকিপার", right: "স্ট্রাইকার" },
    { id: "penalty", left: "পেনাল্টিতে চোখ খোলা", right: "চোখ বন্ধ" },
    { id: "mathe", left: "মাঠে খেলা", right: "মোবাইলে খেলা" },
  ] },
] as const satisfies ReadonlyArray<{ id: string; label: string; pairs: readonly Pair[] }>;

export type Pack = (typeof packs)[number];
export type PackId = Pack["id"];
export const PAIRS_PER_PACK = 12;
export const MAX_NAME_LENGTH = 24;
/** Below this many votes on a pair, a percentage is noise ("১০০% বাঙালি" after one vote). */
export const MIN_SAMPLE = 30;
/** The card shows a national score only when at least this many of the 12 pairs have enough votes. */
export const MIN_SCORED_PAIRS = 6;
/** A pick this unpopular (or less) earns the "সাহস আছে" line. */
export const RARE_PERCENT = 30;

export type Score = { match: number; of: number };
export type Shared = { pack: PackId; answers: Side[]; name: string; score: Score | null };

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);

export const packOf = (id: string): Pack | undefined => packs.find(pack => pack.id === id);
export const question = (pair: Pair) => `${pair.left} না ${pair.right}?`;
export const label = (pair: Pair, side: Side) => side === "L" ? pair.left : pair.right;
export const sideId = (pair: Pair, side: Side) => `${pair.id}.${side}`;
/** Every countable id: one per side of every pair. Never free text or names. */
export const tallyIds: readonly string[] = packs.flatMap(pack => pack.pairs.flatMap(pair => [sideId(pair, "L"), sideId(pair, "R")]));

export function cleanName(name: string) {
  // NFC so the same name typed on two keyboards is one string; strip control and bidi-override characters so a link can't scramble the card.
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH).trim();
}

export function shareHash({ pack, answers, name, score }: Shared) {
  const params = new URLSearchParams({ p: pack, a: answers.join("") });
  const shown = cleanName(name);
  if (shown) params.set("n", shown);
  if (score) { params.set("m", String(score.match)); params.set("k", String(score.of)); }
  return "#" + params.toString();
}

export function parseShareHash(hash: string): Shared | null {
  if (hash.length > 400) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const pack = packOf(params.get("p") ?? "");
  const answers = params.get("a") ?? "";
  if (!pack || !new RegExp(`^[LR]{${PAIRS_PER_PACK}}$`).test(answers)) return null;
  const match = Number(params.get("m")), of = Number(params.get("k"));
  const validScore = params.has("m") && params.has("k") && Number.isInteger(match) && Number.isInteger(of) && of >= MIN_SCORED_PAIRS && of <= PAIRS_PER_PACK && match >= 0 && match <= of;
  return { pack: pack.id, answers: [...answers] as Side[], name: cleanName(params.get("n") ?? ""), score: validScore ? { match, of } : null };
}

export type Split = { L: number; R: number; total: number };

/** Votes on one pair, leaving out this browser's own earlier vote so "X% মিলেছে" compares you with everyone else. */
export function pairSplit(tally: Tally | null, pair: Pair, ownCounted?: Side): Split | null {
  if (!tally) return null;
  const L = Math.max(0, (tally.counts[sideId(pair, "L")] ?? 0) - (ownCounted === "L" ? 1 : 0));
  const R = Math.max(0, (tally.counts[sideId(pair, "R")] ?? 0) - (ownCounted === "R" ? 1 : 0));
  return { L, R, total: L + R };
}

export const percent = (split: Split, side: Side) => Math.round((split[side] / Math.max(split.total, 1)) * 100);
export const enough = (split: Split | null): split is Split => Boolean(split && split.total >= MIN_SAMPLE);

type Counted = Partial<Record<string, Side>>;

/** How many picks side with the majority, over the pairs that have enough votes. A 50-50 pair counts as a match either way. */
export function nationalScore(pack: Pack, answers: readonly (Side | null)[], tally: Tally | null, counted: Counted = {}): Score | null {
  let match = 0, of = 0;
  pack.pairs.forEach((pair, index) => {
    const side = answers[index];
    const split = pairSplit(tally, pair, counted[pair.id]);
    if (!side || !enough(split)) return;
    of += 1;
    if (split[side] >= split[side === "L" ? "R" : "L"]) match += 1;
  });
  return of >= MIN_SCORED_PAIRS ? { match, of } : null;
}

export type Rare = { pick: string; other: string; percent: number };

export function rarestPick(pack: Pack, answers: readonly (Side | null)[], tally: Tally | null, counted: Counted = {}): Rare | null {
  let rare: Rare | null = null;
  pack.pairs.forEach((pair, index) => {
    const side = answers[index];
    const split = pairSplit(tally, pair, counted[pair.id]);
    if (!side || !enough(split)) return;
    const share = percent(split, side);
    if (share <= RARE_PERCENT && (!rare || share < rare.percent)) rare = { pick: label(pair, side), other: label(pair, side === "L" ? "R" : "L"), percent: share };
  });
  return rare;
}

export const sameCount = (left: readonly (Side | null)[], right: readonly (Side | null)[]) => left.filter((side, index) => side && side === right[index]).length;

export function humanLine(pack: Pack, answers: readonly (Side | null)[], score: Score | null, rare: Rare | null) {
  if (rare) return `${rare.other} ছেড়ে ${rare.pick}? সাহস আছে!`;
  if (score) {
    const ratio = score.match / score.of;
    if (ratio >= 11 / 12) return "তুমি পুরো দেশের মনের কথা বলো।";
    if (ratio >= 5 / 12) return "অর্ধেক দেশ তোমার দলে।";
    return "তুমি নিজের পথের মানুষ।";
  }
  const picks = pack.pairs.flatMap((pair, index) => answers[index] ? [label(pair, answers[index])] : []);
  if (picks.length < 2) return "এক তর্কেই বোঝা যায় না, পুরোটা খেলো!";
  return `${picks[0]} আর ${picks[1]}, তোমাকে চিনতে এটুকুই যথেষ্ট।`;
}

export function caption(shared: Shared, friend: Shared | null) {
  const pack = packOf(shared.pack)!;
  if (friend && friend.pack === shared.pack) {
    const who = friend.name ? possessive(friend.name) : "বন্ধুর";
    return `${who} সাথে আমার মিল ${bn(sameCount(shared.answers, friend.answers))}/${bn(PAIRS_PER_PACK)}! তোমার সাথে কয়টা মেলে?`;
  }
  if (shared.score) return `আমার পছন্দ দেশের সাথে ${bn(shared.score.match)}/${bn(shared.score.of)} মেলে। তুমি কোন দিকে?`;
  const first = pack.pairs[0];
  return `${question(first)} আমি ${label(first, shared.answers[0])} দলে। তুমি কোন দিকে?`;
}

export function previewTitle(shared: Shared) {
  const pack = packOf(shared.pack)!;
  const who = shared.name ? possessive(shared.name) : "এক বন্ধুর";
  if (shared.score) return `${who} পছন্দ দেশের সাথে ${bn(shared.score.match)}/${bn(shared.score.of)} মেলে। তোমার কয়টা মেলে?`;
  const picks = pack.pairs.slice(0, 3).map((pair, index) => label(pair, shared.answers[index]));
  return `${who} বাছাই: ${picks.join(", ")}… তুমি কোন দিকে?`;
}

export { possessive };

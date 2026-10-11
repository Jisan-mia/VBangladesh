import { possessive } from "../../../shared/bangla";

export type Grade = "AP" | "A" | "B" | "C" | "F";
export type Tally = { total: number; counts: Record<string, number> };
export type Score = { match: number; of: number };

export const GRADES = ["AP", "A", "B", "C", "F"] as const satisfies readonly Grade[];
export const gradeLabel: Record<Grade, string> = { AP: "A+", A: "A", B: "B", C: "C", F: "F" };
// Bangladesh SSC/HSC grade points: A+ 5, A 4, A− 3.5, B 3, C 2, D 1, F 0. A− and D are left out to keep five chips.
// Sources: https://en.wikipedia.org/wiki/Secondary_School_Certificate#Bangladesh · https://en.wikipedia.org/wiki/Academic_grading_in_Bangladesh
export const gradePoint: Record<Grade, number> = { AP: 5, A: 4, B: 3, C: 2, F: 0 };

type Item = { id: string; name: string };
// Item ids are tally keys and link positions: once links are public, never reorder, rename or delete an item inside a pack.
// Generic things only: never people, places, religions, political things or brands.
export const packs = [
  { id: "street", label: "স্ট্রিট ফুড", items: [
    { id: "fuchka", name: "ফুচকা" },
    { id: "chotpoti", name: "চটপটি" },
    { id: "jhalmuri", name: "ঝালমুড়ি" },
    { id: "singara", name: "সিঙ্গারা" },
    { id: "peyaju", name: "পেঁয়াজু" },
    { id: "bhapa", name: "ভাপা পিঠা" },
    { id: "haleem", name: "হালিম" },
    { id: "amra", name: "আমড়া মাখা" },
  ] },
  { id: "season", label: "ঋতু", items: [
    { id: "grishmo", name: "গ্রীষ্ম" },
    { id: "borsha", name: "বর্ষা" },
    { id: "shorot", name: "শরৎ" },
    { id: "hemonto", name: "হেমন্ত" },
    { id: "shit", name: "শীত" },
    { id: "bosonto", name: "বসন্ত" },
    { id: "jhum", name: "ঝুম বৃষ্টি" },
    { id: "kuasha", name: "কুয়াশার সকাল" },
  ] },
  { id: "ride", label: "যানবাহন", items: [
    { id: "riksha", name: "রিকশা" },
    { id: "bus", name: "লোকাল বাস" },
    { id: "cng", name: "সিএনজি" },
    { id: "train", name: "ট্রেন" },
    { id: "launch", name: "লঞ্চ" },
    { id: "leguna", name: "লেগুনা" },
    { id: "nouka", name: "নৌকা" },
    { id: "cycle", name: "সাইকেল" },
  ] },
  { id: "eid", label: "ঈদের খাবার", items: [
    { id: "semai", name: "দুধ সেমাই" },
    { id: "lachchha", name: "লাচ্ছা সেমাই" },
    { id: "firni", name: "ফিরনি" },
    { id: "jorda", name: "জর্দা" },
    { id: "polao", name: "পোলাও" },
    { id: "roast", name: "রোস্ট" },
    { id: "borhani", name: "বোরহানি" },
    { id: "doibora", name: "দই বড়া" },
  ] },
] as const satisfies ReadonlyArray<{ id: string; label: string; items: readonly Item[] }>;

export type Pack = (typeof packs)[number];
export type PackId = Pack["id"];
export type Grades = readonly (Grade | null)[];
export type Sheet = { pack: PackId; grades: Grade[]; name: string; score: Score | null };

export const ITEMS_PER_PACK = 8;
export const MAX_NAME_LENGTH = 24;
/** Below this many grades on an item, an average is noise ("দেশ দিল F" after one vote). */
export const MIN_SAMPLE = 30;
/** "দেশের সাথে মিল" shows only when at least this many of the 8 items have a national average. */
export const MIN_SCORED = 4;

const numbers = new Intl.NumberFormat("bn-BD");
const points = new Intl.NumberFormat("bn-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const bn = (value: number) => numbers.format(value);
export const bnPoint = (value: number) => points.format(value);
/** Accusative: ফুচকাকে, লোকাল বাসকে, শরৎকে. */
export const ke = (name: string) => `${name}কে`;

export const packOf = (id: string): Pack | undefined => packs.find(pack => pack.id === id);
const isGrade = (value: unknown): value is Grade => typeof value === "string" && (GRADES as readonly string[]).includes(value);
export const tallyId = (pack: PackId, item: string, grade: Grade) => `${pack}.${item}.${grade}`;
/** Every countable id: one per grade of every item. Never free text or names. */
export const tallyIds: readonly string[] = packs.flatMap(pack => pack.items.flatMap(item => GRADES.map(grade => tallyId(pack.id, item.id, grade))));

export function cleanName(name: string) {
  // NFC so the same name typed on two keyboards is one string; strip control and bidi-override characters so a link can't scramble the card.
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH).trim();
}

export function shareHash({ pack, grades, name, score }: Sheet) {
  // Built by hand so the grades stay readable (g=AP,A,B…) instead of %2C-joined.
  let hash = `#p=${pack}&g=${grades.join(",")}`;
  const shown = cleanName(name);
  if (shown) hash += `&n=${encodeURIComponent(shown)}`;
  if (score) hash += `&m=${score.match}&k=${score.of}`;
  return hash;
}

export function parseShareHash(hash: string): Sheet | null {
  if (hash.length > 400) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const pack = packOf(params.get("p") ?? "");
  const grades = (params.get("g") ?? "").split(",");
  if (!pack || grades.length !== ITEMS_PER_PACK || !grades.every(isGrade)) return null;
  const match = Number(params.get("m")), of = Number(params.get("k"));
  const validScore = params.has("m") && params.has("k") && Number.isInteger(match) && Number.isInteger(of) && of >= MIN_SCORED && of <= ITEMS_PER_PACK && match >= 0 && match <= of;
  return { pack: pack.id, grades, name: cleanName(params.get("n") ?? ""), score: validScore ? { match, of } : null };
}

export const gradeOfPoint = (gpa: number): Grade => gpa >= 4.5 ? "AP" : gpa >= 3.5 ? "A" : gpa >= 2.5 ? "B" : gpa >= 1 ? "C" : "F";

export type National = { grade: Grade; gpa: number; total: number };

/** The average grade from everyone who counted theirs, leaving out this browser's own earlier vote. Null below the minimum sample. */
export function nationalOf(tally: Tally | null, pack: PackId, item: string, ownCounted?: Grade): National | null {
  if (!tally) return null;
  let total = 0, sum = 0;
  for (const grade of GRADES) {
    const count = Math.max(0, (tally.counts[tallyId(pack, item, grade)] ?? 0) - (ownCounted === grade ? 1 : 0));
    total += count;
    sum += count * gradePoint[grade];
  }
  if (total < MIN_SAMPLE) return null;
  const gpa = sum / total;
  return { grade: gradeOfPoint(gpa), gpa, total };
}

export function nationalScore(grades: Grades, national: readonly (National | null)[]): Score | null {
  let match = 0, of = 0;
  grades.forEach((grade, index) => {
    const average = national[index];
    if (!grade || !average) return;
    of += 1;
    if (grade === average.grade) match += 1;
  });
  return of >= MIN_SCORED ? { match, of } : null;
}

export const sameCount = (left: Grades, right: Grades) => left.filter((grade, index) => grade && grade === right[index]).length;

/** The examiner's own GPA: the mean grade point of what has been graded so far, like an SSC result. */
export function gpaOf(grades: Grades) {
  const given = grades.filter((grade): grade is Grade => Boolean(grade));
  return given.length ? given.reduce((sum, grade) => sum + gradePoint[grade], 0) / given.length : null;
}

export function humanLine(pack: Pack, grades: Grades, national: readonly (National | null)[] = []) {
  const given = pack.items.flatMap((item, index) => grades[index] ? [{ name: item.name, grade: grades[index]!, average: national[index] }] : []);
  if (!given.length) return `লাল কলম তোমার হাতে। প্রথম খাতা: ${pack.items[0].name}।`;
  if (given.length < ITEMS_PER_PACK) return `আর ${bn(ITEMS_PER_PACK - given.length)}টা খাতা বাকি, তারপর রেজাল্ট!`;
  if (given.every(entry => entry.grade === "AP")) return "সবাইকে A+! এমন দয়ালু পরীক্ষক আর হয় না।";
  if (given.every(entry => entry.grade === "F")) return "সবাই ফেল! তোমার খাতায় পাস করা কঠিন।";
  // The widest gap with the national average makes the most talked-about line.
  let gap: { name: string; mine: Grade; theirs: Grade; size: number } | null = null;
  for (const entry of given) {
    if (!entry.average) continue;
    const size = gradePoint[entry.grade] - gradePoint[entry.average.grade];
    if (Math.abs(size) >= 2 && (!gap || Math.abs(size) > Math.abs(gap.size))) gap = { name: entry.name, mine: entry.grade, theirs: entry.average.grade, size };
  }
  if (gap) return `দেশ ${ke(gap.name)} দিল ${gradeLabel[gap.theirs]}, তুমি দিলে ${gradeLabel[gap.mine]}। ${gap.size < 0 ? "কড়া পরীক্ষক!" : "দয়ার শরীর!"}`;
  const top = given.filter(entry => entry.grade === "AP").map(entry => entry.name);
  const fail = given.find(entry => entry.grade === "F")?.name;
  if (top.length && fail) return `${top[0]} পেল A+, ${fail} ফেল। তোমার খাতায় দয়া আছে, ছাড় নেই!`;
  if (fail) return `${ke(fail)} F! বেচারা আবার পরীক্ষা দেবে।`;
  if (top.length >= 2) return `${top[0]} আর ${top[1]} পেল A+, তোমার খাতায় যুগ্ম প্রথম!`;
  if (top.length) return `${top[0]} পেল A+, তোমার খাতায় প্রথম!`;
  return (gpaOf(grades) ?? 0) >= 3.5 ? "সবাই ভালো করেছে, তবু কেউ A+ পায়নি। কড়া কিন্তু ন্যায্য!" : "কেউ A+ পায়নি। তোমার খাতায় নম্বর পাওয়া সহজ না!";
}

/** The first-graded A+ (or the first item) for captions: "ফুচকা পেল A+". */
function highlight(pack: Pack, grades: readonly Grade[]) {
  const index = Math.max(0, grades.indexOf("AP"));
  return { name: pack.items[index].name, grade: gradeLabel[grades[index]] };
}

export function caption(sheet: Sheet, friend: Sheet | null) {
  const pack = packOf(sheet.pack)!;
  const first = pack.items[0].name;
  if (friend && friend.pack === sheet.pack) {
    const who = friend.name ? possessive(friend.name) : "বন্ধুর";
    return `${who} সাথে আমার গ্রেড মিলেছে ${bn(sameCount(sheet.grades, friend.grades))}/${bn(ITEMS_PER_PACK)}! তুমি ${ke(first)} কত দেবে?`;
  }
  const best = highlight(pack, sheet.grades);
  if (sheet.score) return `${pack.label} পরীক্ষার খাতা দেখলাম: ${best.name} পেল ${best.grade}, দেশের সাথে মিল ${bn(sheet.score.match)}/${bn(sheet.score.of)}। তুমি কত দেবে?`;
  return `${pack.label} পরীক্ষার খাতা দেখলাম: ${pack.items.slice(0, 3).map((item, index) => `${item.name} ${gradeLabel[sheet.grades[index]]}`).join(", ")}। তুমি ${ke(first)} কত দেবে?`;
}

export function previewTitle(sheet: Sheet) {
  const pack = packOf(sheet.pack)!;
  const who = sheet.name ? possessive(sheet.name) : "এক পরীক্ষকের";
  const best = highlight(pack, sheet.grades);
  if (sheet.score) return `${who} রেজাল্ট শিট: ${best.name} ${best.grade}, দেশের সাথে মিল ${bn(sheet.score.match)}/${bn(sheet.score.of)}। তুমি কত দেবে?`;
  return `${who} রেজাল্ট শিট: ${pack.items.slice(0, 3).map((item, index) => `${item.name} ${gradeLabel[sheet.grades[index]]}`).join(", ")}… তুমি কত দেবে?`;
}

/** Grades this browser has added to the tally, per pack. */
export type Counted = Partial<Record<PackId, Grade[]>>;

/** Reads the remembered votes from localStorage text; anything malformed is dropped rather than sent. */
export function parseCounted(raw: string | null): Counted {
  let data: unknown;
  try { data = JSON.parse(raw ?? "{}"); } catch { return {}; }
  if (!data || typeof data !== "object") return {};
  const counted: Counted = {};
  for (const pack of packs) {
    const grades = (data as Record<string, unknown>)[pack.id];
    if (Array.isArray(grades) && grades.length === ITEMS_PER_PACK && grades.every(isGrade)) counted[pack.id] = grades;
  }
  return counted;
}

/**
 * The server keeps ONE vote list per browser per tool and replaces it on every vote,
 * so grading a second pack must resend the packs counted before, or their grades vanish from the average.
 */
export function mergeVotes(counted: Counted, pack: PackId, grades: readonly Grade[]): { counted: Counted; items: string[] } {
  const next: Counted = { ...counted, [pack]: [...grades] };
  const items = packs.flatMap(item => (next[item.id] ?? []).map((grade, index) => tallyId(item.id, item.items[index].id, grade)));
  return { counted: next, items };
}

export { possessive };

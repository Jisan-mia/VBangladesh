// No outside data: multiplication facts are computed, and every table on the page comes from t × m.
export const TABLES = Array.from({ length: 19 }, (_, index) => index + 2); // the game: ২ থেকে ২০
export const MULTIPLIERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const DEFAULT_TABLE = 5;
// The first game on a fresh page: fixed so server and browser agree ("৫ × ৩ = ?" first); later games shuffle.
export const DEFAULT_ORDER = [3, 7, 2, 9, 5, 10, 4, 8, 1, 6];
export const MAX_NAME = 20;
export const MAX_DIGITS = 3;
export const MAX_SECONDS = 999;

export const whos = [
  { id: "bachcha", chip: "বাচ্চা", who: "আমার বাচ্চা" },
  { id: "meye", chip: "মেয়ে", who: "আমার মেয়ে" },
  { id: "chhele", chip: "ছেলে", who: "আমার ছেলে" },
  { id: "ami", chip: "আমি নিজে", who: "আমি" },
] as const;
export type WhoId = (typeof whos)[number]["id"];

/** One finished game: table, the order the 10 sums came in, the answers given in that order, optional name and time. */
export type Shared = { t: number; q: number[]; a: number[]; n: string; w: WhoId; s: number };

const numbers = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => numbers.format(value);
export const outOf = (score: number) => `১০-এ ${bn(score)}`;
export const tableName = (t: number) => `${bn(t)}-এর নামতা`;

export function randomOrder(random = Math.random) {
  const order = [...MULTIPLIERS];
  for (let index = order.length - 1; index > 0; index--) {
    const pick = Math.floor(random() * (index + 1));
    [order[index], order[pick]] = [order[pick], order[index]];
  }
  return order;
}

/** Score is always recomputed from the answers; a link never carries it. */
export const isRight = (t: number, m: number, answer: number | undefined) => answer === t * m;
export const scoreOf = ({ t, q, a }: Pick<Shared, "t" | "q" | "a">) => q.filter((m, index) => isRight(t, m, a[index])).length;

const BANGLA_DIGITS = "০১২৩৪৫৬৭৮৯";
/** A key from the pad or a keyboard (0-9 or ০-৯) as a digit, or null. */
export function digitOf(key: string) {
  if (/^[0-9]$/.test(key)) return Number(key);
  const at = BANGLA_DIGITS.indexOf(key);
  return key.length === 1 && at >= 0 ? at : null;
}

/** Typing into the slate: at most 3 digits (20 × 10 = 200), no leading zero. */
export const typeDigit = (typed: string, digit: number) => typed === "0" ? String(digit) : typed.length >= MAX_DIGITS ? typed : typed + digit;

export function cleanName(name: string) {
  // NFC so the same name from two keyboards matches; strip control and bidi-override characters so a link can't scramble the card.
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME);
}

// Order travels as ten digits, 10 written as 0: e.g. "3729510486"; permutations only.
export const encodeOrder = (q: readonly number[]) => q.map(m => m % 10).join("");
export function decodeOrder(code: string | null): number[] | null {
  if (!code || !/^[0-9]{10}$/.test(code)) return null;
  const q = [...code].map(char => Number(char) || 10);
  return new Set(q).size === 10 ? q : null;
}

const isTable = (value: string | null) => value !== null && /^\d{1,2}$/.test(value) && TABLES.includes(Number(value));
const isWho = (value: string | null): value is WhoId => whos.some(item => item.id === value);

export function shareHash({ t, q, a, n, w, s }: Shared) {
  const params = new URLSearchParams({ t: String(t), q: encodeOrder(q), a: a.map(answer => Math.min(Math.max(0, Math.floor(answer)), 999)).join("-") });
  const name = cleanName(n);
  if (name) params.set("n", name);
  if (w !== "bachcha") params.set("w", w);
  if (s > 0) params.set("s", String(Math.min(Math.round(s), MAX_SECONDS)));
  return "#" + params.toString();
}

/** A finished game from a link, or null. Needs all ten answers; anything malformed is refused rather than guessed. */
export function parseShareHash(hash: string): Shared | null {
  if (hash.length > 400) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const t = params.get("t"), q = decodeOrder(params.get("q")), raw = params.get("a") ?? "";
  if (!isTable(t) || !q || !/^\d{1,3}(-\d{1,3}){9}$/.test(raw)) return null;
  const w = params.get("w"), s = params.get("s");
  return {
    t: Number(t), q, a: raw.split("-").map(Number),
    n: cleanName(params.get("n") ?? ""),
    w: isWho(w) ? w : "bachcha",
    s: s && /^\d{1,3}$/.test(s) ? Number(s) : 0,
  };
}

/** "#t=13" from the নামতা list (or any link with only a table): start that table, no challenge banner. */
export function parseStart(hash: string): number | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const t = params.get("t");
  return isTable(t) && !params.has("a") ? Number(t) : null;
}

export const tallyIds = TABLES.map(t => `t${t}`);

export function starWord(score: number) {
  if (score === 10) return "শাবাশ!";
  if (score >= 8) return "দারুণ!";
  if (score >= 5) return "ভালো!";
  return score ? "চলুক!" : "শুরু!";
}

/** The parent's line on the card: never "failed", always what the child did. */
export function proudLine(score: number, w: WhoId) {
  const me = w === "ami";
  const who = whos.find(item => item.id === w)!.who;
  if (score === 10) return me ? "আমি পেরেছি!" : `${who} পেরেছে!`;
  if (score >= 8) return me ? "আমি প্রায় পুরোটা পেরেছি!" : `${who} প্রায় পুরোটা পেরেছে!`;
  if (score >= 5) return me ? "আমি অর্ধেকের বেশি পেরেছি!" : `${who} অর্ধেকের বেশি পেরেছে!`;
  if (score >= 1) return me ? "আমি শিখছি, রোজ একটু একটু।" : `${who} শিখছে, রোজ একটু একটু।`;
  return me ? "আজ শুরু করলাম!" : `${who} আজ শুরু করল!`;
}

/** The warm second line, from the score and how big the table is. */
export function humanLine(score: number, t: number) {
  if (score === 10 && t >= 11) return `${tableName(t)} তো বড়রাও গুলিয়ে ফেলে!`;
  if (score === 10 && t >= 6 && t <= 9) return "৬ থেকে ৯-এর ঘরেই সবাই আটকায়। এখানে আটকায়নি!";
  if (score === 10) return "এবার পরের ঘরটা ধরো!";
  if (score >= 8) return "আর একটু হলেই ১০-এ ১০। হলুদগুলো আরেকবার দেখে নিই।";
  if (score >= 5) return "অর্ধেকের বেশি ঠিক। রোজ একবার পড়লেই মুখস্থ হয়ে যাবে।";
  if (score >= 1) return "যেগুলো হলুদ, সেগুলো আজ আরেকবার পড়ি। কাল আবার স্লেট মুছে বসি।";
  return "নামতা সবাই এভাবেই শেখে। কাল আবার স্লেট মুছে বসি!";
}

export const versusLine = (mine: number, theirs: number, rival: string) =>
  mine > theirs ? `${rival} পেয়েছিল ${outOf(theirs)}, এবার ${outOf(mine)}!`
    : mine === theirs ? `${rival}ও পেয়েছিল ${outOf(theirs)}। সমান সমান!`
      : `${rival} পেয়েছিল ${outOf(theirs)}। আরেকবার খেললেই হবে!`;

function subject({ n, w }: Pick<Shared, "n" | "w">) {
  if (w === "ami") return "আমি";
  const who = whos.find(item => item.id === w)!.who;
  return n ? `${who} ${n}` : who;
}

export function caption(shared: Shared) {
  const score = scoreOf(shared), me = shared.w === "ami";
  return `${subject(shared)} ${tableName(shared.t)}য় ${outOf(score)} ${me ? "পেয়েছি" : "পেয়েছে"}! একই ১০টা অঙ্ক, ${me ? "তুমি কয়টা পারো" : "তোমার বাচ্চা কয়টা পারে"}?`;
}

export function previewTitle(shared: Shared) {
  const score = scoreOf(shared), me = shared.w === "ami";
  const who = shared.n || (me ? "একজন" : "এক খুদে বন্ধু");
  return `${who} ${tableName(shared.t)}য় ${outOf(score)} পেয়েছে — ${me ? "তুমি" : "তোমার বাচ্চা"} কয়টা পারবে?`;
}

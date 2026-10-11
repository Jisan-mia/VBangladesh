import { possessive } from "../../../shared/bangla";

export const MAX_ROUNDS = 3;
export const MAX_NAME_LENGTH = 20;
/** Shown wherever a fare appears: these are game numbers, not a fare chart. */
export const FARE_NOTE = "খেলার ভাড়া, আসল ভাড়ার তালিকা না";

type Route = { id: string; from: string; to: string; ask: number; fair: number; gripe: string };

/*
 * Dhaka landmarks only (no shops or companies). `ask` is mama's opening word and `fair` the fare he
 * would call fair in this game. Both are invented round numbers that feel plausible, not a fare chart.
 * Ids go into share links: never rename or delete one; add new routes at the end.
 */
export const routes = [
  { id: "farmgate-dhanmondi", from: "ফার্মগেট", to: "ধানমন্ডি", ask: 100, fair: 70, gripe: "জ্যাম আছে, ঘুরে যেতে হবে।" },
  { id: "gulistan-sadarghat", from: "গুলিস্তান", to: "সদরঘাট", ask: 90, fair: 60, gripe: "গুলিস্তানের জ্যাম চিনেন না?" },
  { id: "shahbag-lalbag", from: "শাহবাগ", to: "লালবাগ কেল্লা", ask: 120, fair: 80, gripe: "পুরান ঢাকার গলি, সময় লাগবে।" },
  { id: "kamalapur-motijheel", from: "কমলাপুর", to: "মতিঝিল", ask: 70, fair: 40, gripe: "সাথে ব্যাগ-বোঁচকা আছে না?" },
  { id: "mirpur10-zoo", from: "মিরপুর ১০", to: "চিড়িয়াখানা", ask: 100, fair: 70, gripe: "রাস্তা লম্বা মামা, পা ধরে আসে।" },
  { id: "newmarket-azimpur", from: "নিউমার্কেট", to: "আজিমপুর", ask: 60, fair: 40, gripe: "নিউমার্কেটের ভিড় পার হতে হবে।" },
] as const satisfies readonly Route[];

export type RouteId = (typeof routes)[number]["id"];
export const DEFAULT_ROUTE: RouteId = "farmgate-dhanmondi";

const byId = new Map<string, Route>(routes.map(route => [route.id, route]));
export const isRouteId = (id: string): id is RouteId => byId.has(id);
export const routeById = (id: RouteId): Route => byId.get(id)!;

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);

const round5 = (value: number) => Math.round(value / 5) * 5;
const ceil5 = (value: number) => Math.ceil(value / 5) * 5;
/** Integer percent of the fair fare, rounded to 5 taka (integer maths, so 70 × 105% is exactly 73.5 → 75). */
const ofFair = (route: Route, percent: number) => round5((route.fair * percent) / 100);

// Mama closes on any offer at or above this share of the fair fare, and the bar drops each round.
const ACCEPT = [120, 105, 95] as const;
// Below FLOOR he won't counter; below OFFEND he simply leaves.
const FLOOR = 80;
const OFFEND = 60;

/** The lowest offer mama takes in round 1–3. It is also the lowest fare a deal can close at by that round. */
export const threshold = (route: Route, round: number) => ofFair(route, ACCEPT[Math.min(Math.max(round, 1), MAX_ROUNDS) - 1]);
/** The slider's left end, low enough that a lowball is possible. */
export const sliderMin = (route: Route) => Math.max(10, round5((route.ask * 30) / 100));

export type Status = "talk" | "final" | "deal" | "gone";
export type Game = {
  route: RouteId;
  /** Mama's current ask; in "final", his last word. */
  ask: number;
  /** Offers made so far, 0–3. */
  round: number;
  status: Status;
  /** The agreed fare once status is "deal", else 0. */
  fare: number;
  /** Your last offer, 0 before the first. */
  last: number;
  mama: string;
  you: string;
};
export type Result = { route: RouteId; fare: number; rounds: number };
export type Shared = Result & { name: string };

/** FNV-1a: the same route and offers always pick the same lines, so a challenge link meets the same mama. */
function seedOf(text: string) {
  let hash = 2166136261;
  for (const char of text) { hash ^= char.codePointAt(0)!; hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}
const pick = <T,>(list: readonly T[], seed: number) => list[seed % list.length];

export const GONE_LINE = "আরেকজন দেখেন মামা।";
const ACCEPT_TEXT = "ঠিক আছে মামা, চলেন।";
const youLines = [
  (o: number) => `মামা, ${bn(o)} টাকায় যাবেন?`,
  (o: number) => `${bn(o)} দিমু মামা, চলেন।`,
  (o: number) => `${bn(o)} টাকা, এর বেশি না মামা।`,
  (o: number) => `রোজ যাই এই রাস্তায়, ${bn(o)}-ই ভাড়া।`,
];
const counterLines = [
  (x: number, route: Route) => `${bn(x)} দেন মামা। ${route.gripe}`,
  (x: number) => `মামা, বাজারের দাম দেখছেন? ${bn(x)}-এর কমে হয় না।`,
  (x: number) => `এই গরমে প্যাডেল মারা কি সোজা? ${bn(x)} দেন।`,
  (x: number) => `আপনি ভালো মানুষ, তাই ${bn(x)}। আর কমামু না।`,
];
const refuseLines = [
  () => "হাসালেন মামা! এই ভাড়ায় চাকাও ঘুরবে না।",
  () => "এইটা তো দুই কাপ চায়ের দাম মামা! আরেকটু বাড়ান।",
  (ask: number) => `মামা, ঠাট্টা করেন? ${bn(ask)}-ই লাগবে।`,
];
const dealLines = ["আচ্ছা যান, উঠেন মামা!", "চলেন, শক্ত করে বসেন।", "ঠিক আছে, আপনার জন্যই। উঠেন!"];

/** What mama says when a deal closes or he leaves. Built from the result alone, so a shared card says the same. */
export function mamaQuote({ route, fare, rounds }: Result) {
  if (!fare) return GONE_LINE;
  if (fare >= routeById(route).ask) return rounds === 1 ? "দরদাম ছাড়াই? আপনি তো দিলদার মানুষ! উঠেন।" : "এইতো! উঠেন মামা, হুড তুলমু?";
  return pick(dealLines, seedOf(`${route}|${rounds}|${fare}`));
}

export function startGame(id: RouteId): Game {
  const route = routeById(id);
  return { route: id, ask: route.ask, round: 0, status: "talk", fare: 0, last: 0, mama: `${route.to}? যামু। ${bn(route.ask)} টাকা দিয়েন।`, you: `মামা, ${route.to} যাবেন?` };
}

/** Your offer this round. Offering mama's ask accepts it. `said` replaces the default spoken line. */
export function offer(game: Game, amount: number, said?: string): Game {
  if (game.status !== "talk" || !Number.isFinite(amount)) return game;
  const route = routeById(game.route);
  const o = Math.min(game.ask, Math.max(sliderMin(route), round5(amount)));
  const round = game.round + 1;
  const seed = seedOf(`${route.id}|${round}|${o}|${game.ask}`);
  const next: Game = { ...game, round, last: o, you: said ?? (o >= game.ask ? ACCEPT_TEXT : pick(youLines, seed)(o)) };
  const close = (fare: number): Game => ({ ...next, status: "deal", fare, mama: mamaQuote({ route: game.route, fare, rounds: round }) });
  if (o >= game.ask) return close(game.ask);
  if (o >= threshold(route, round)) return close(o);
  const floor = ofFair(route, FLOOR);
  if (o < ofFair(route, OFFEND) || (o < floor && round === MAX_ROUNDS)) return { ...next, status: "gone", mama: GONE_LINE };
  if (o < floor) return { ...next, mama: pick(refuseLines, seed)(game.ask) };
  // Meet halfway, but never under the next round's bar, so taking his counter can't beat simply offering that bar.
  const counter = Math.min(game.ask, Math.max(threshold(route, round + 1), ceil5((game.ask + o) / 2)));
  if (round === MAX_ROUNDS) return { ...next, status: "final", ask: counter, mama: `শেষ কথা, ${bn(counter)}। এর নিচে হবে না।` };
  return { ...next, ask: counter, mama: counter === game.ask ? `এক টাকাও কমামু না মামা, ${bn(counter)}।` : pick(counterLines, seed)(counter, route) };
}

/** After round three mama names his last word: take it, or walk. */
export function finalAnswer(game: Game, yes: boolean): Game {
  if (game.status !== "final") return game;
  if (!yes) return { ...game, status: "gone", you: "থাক মামা, হেঁটেই যাই।", mama: GONE_LINE };
  return { ...game, status: "deal", fare: game.ask, you: "আচ্ছা মামা, চলেন।", mama: mamaQuote({ route: game.route, fare: game.ask, rounds: game.round }) };
}

export const isDone = (game: Game) => game.status === "deal" || game.status === "gone";
export const resultOf = (game: Game): Result | null => isDone(game) ? { route: game.route, fare: game.fare, rounds: game.round } : null;

export type QuickLine = { label: string; amount: number; text: string };

/** Three ready-made lines for this round: the classic half, a middle, and giving in. */
export function quickLines(game: Game): QuickLine[] {
  if (game.status !== "talk") return [];
  const route = routeById(game.route);
  const half = Math.max(sliderMin(route), Math.floor(game.ask / 10) * 5);
  const middle = game.last ? round5((game.ask + game.last) / 2) : round5((game.ask * 75) / 100);
  const lines: QuickLine[] = [{ label: "অর্ধেক", amount: half, text: `অর্ধেক দিমু মামা, ${bn(half)}।` }];
  if (middle > half && middle < game.ask) lines.push({ label: game.last ? "মাঝামাঝি" : "একটু কমান", amount: middle, text: game.last ? `মাঝামাঝি করেন মামা, ${bn(middle)}।` : `${bn(middle)} দেই মামা, চলেন।` });
  lines.push({ label: "ঠিক আছে", amount: game.ask, text: ACCEPT_TEXT });
  return lines;
}

/** Where the slider starts each round: a fair-looking step down from mama's ask, never the answer. */
export function suggestedOffer(game: Game) {
  const route = routeById(game.route);
  const raw = game.last ? (game.ask + game.last) / 2 : (game.ask * 65) / 100;
  return Math.min(game.ask, Math.max(sliderMin(route), round5(raw)));
}

/** Can this result come out of the game? Every fare from the round's bar up to the opening ask can; nothing else. */
export function isValidResult({ route, fare, rounds }: Result) {
  if (!isRouteId(route) || !Number.isInteger(rounds) || rounds < 1 || rounds > MAX_ROUNDS) return false;
  const info = routeById(route);
  return fare === 0 || (Number.isInteger(fare) && fare % 5 === 0 && fare >= threshold(info, rounds) && fare <= info.ask);
}

export function cleanName(name: string) {
  // NFC, and no control or bidi-override characters, so a shared link can't scramble the card text.
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);
}

export function shareHash({ route, fare, rounds, name }: Shared) {
  const shown = cleanName(name);
  return `#r=${route}&f=${fare}&k=${rounds}` + (shown ? `&n=${encodeURIComponent(shown)}` : "");
}

/** Reads `#r=farmgate-dhanmondi&f=65&k=3&n=…`; anything the game could not have produced is rejected whole. */
export function parseShareHash(hash: string): Shared | null {
  if (hash.length > 400) return null;
  let params: URLSearchParams;
  try { params = new URLSearchParams(hash.replace(/^#/, "")); } catch { return null; }
  const route = params.get("r") ?? "";
  const fare = params.get("f") ?? "";
  const rounds = params.get("k") ?? "";
  if (!isRouteId(route) || !/^\d{1,4}$/.test(fare) || !/^[1-3]$/.test(rounds)) return null;
  const result = { route, fare: Number(fare), rounds: Number(rounds) };
  return isValidResult(result) ? { ...result, name: cleanName(params.get("n") ?? "") } : null;
}

export type Tier = "gone" | "dildar" | "mama" | "fair";
export function tierOf({ route, fare }: Result): Tier {
  const info = routeById(route);
  if (!fare) return "gone";
  if (fare >= info.ask) return "dildar";
  return fare > info.fair + 10 ? "mama" : "fair";
}
export const stampOf: Record<Tier, string> = { fair: "ন্যায্য ভাড়া", mama: "মামার জিত", dildar: "দিলদার যাত্রী", gone: "মামা গেলেন" };

/** The warm line under the plate, chosen by how many rounds it took and how it ended. */
export function humanLine(result: Result) {
  const { rounds } = result;
  switch (tierOf(result)) {
    case "gone": return rounds === 1 ? "এক কথাতেই মামা হেসে প্যাডেল ঘোরালেন।" : `${bn(rounds)} দফা চলল, শেষে হাঁটা। আজ মামাই জিতলেন।`;
    case "dildar": return rounds === 1 ? "দরদাম ছাড়াই উঠে বসলে। আজ মামার দিনটা ভালো যাবে।" : "এত কথার পর পুরো ভাড়াই দিলে! মামা মুচকি হাসছেন।";
    case "mama": return rounds === 1 ? "এক কথায় রাজি! তবে শেষ হাসিটা মামার।" : `${bn(rounds)} দফা দরদাম, তবু জিতলেন মামা।`;
    default: return rounds === 1 ? "এক কথাতেই ন্যায্য ভাড়া! তুমি তো পাকা যাত্রী।" : rounds === 2 ? "দুই কথায় ন্যায্য ভাড়া। এর নাম দরদাম!" : "তিন দফায় ঠিক দাম। মামাও খুশি, তুমিও।";
  }
}

/** One line against a friend's result on the same route; empty when the routes differ. */
export function compareLine(own: Result, friend?: Shared | null) {
  if (!friend || friend.route !== own.route) return "";
  const who = friend.name || "বন্ধু";
  if (!own.fare) return friend.fare ? `${who} পেরেছিল ${bn(friend.fare)} টাকায়…` : "মামা দুজনকেই ফিরিয়ে দিলেন!";
  if (!friend.fare) return `${who} যা পারেনি, তুমি পারলে!`;
  const diff = own.fare - friend.fare;
  const of = friend.name ? possessive(friend.name) : "বন্ধুর";
  return diff === 0 ? `${of} সমান ভাড়ায়!` : diff < 0 ? `${of} চেয়ে ${bn(-diff)} টাকা কম!` : `${of} চেয়ে ${bn(diff)} টাকা বেশি`;
}

export type CardContent = {
  title: string;
  route: string;
  fare: number;
  headline: string;
  rounds: string;
  line: string;
  mama: string;
  stamp: string;
  tier: Tier;
  compare: string;
};

export function createCard(own: Shared, friend?: Shared | null): CardContent {
  const name = cleanName(own.name);
  const route = routeById(own.route);
  return {
    title: `${name ? possessive(name) : "আমার"} দরদাম`,
    route: `${route.from} → ${route.to}`,
    fare: own.fare,
    headline: own.fare ? `${bn(own.fare)} টাকায় রাজি` : "মামা রাজি হননি",
    rounds: `${bn(own.rounds)} দফায়`,
    line: humanLine(own),
    mama: mamaQuote(own),
    stamp: stampOf[tierOf(own)],
    tier: tierOf(own),
    compare: compareLine(own, friend),
  };
}

/** Fixed ids for "compare with everyone": deal in 1, 2 or 3 rounds, or no deal. Never names or fares. */
export const tallyIds = ["k1", "k2", "k3", "na"] as const;
export type TallyId = (typeof tallyIds)[number];
export const bucketOf = ({ fare, rounds }: Result): TallyId => fare ? (`k${rounds}` as TallyId) : "na";
export const bucketLabel: Record<TallyId, string> = { k1: "১ দফায় রাজি", k2: "২ দফায় রাজি", k3: "৩ দফায় রাজি", na: "মামা রাজি হননি" };

export { possessive };

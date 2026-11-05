// Challenge links and every line of result text. Server-safe: share.ts loads this.
import { possessive } from "../../../shared/bangla";
import { cleanName } from "../../../shared/game-core";
import { encodeMoves, hintCap, parOf, replay, shortBy, starsOf, MAX_LINK_MOVES, type Game } from "./game";
import { infoOf, isFinale, worldOf, WORLDS } from "./worlds";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/**
 * A cleared jam: `count` moves (proven by replaying them), `helped` hints taken (the player's own word), an optional first name.
 * `legacy` is a jam from before the rewrite: its links have no `v` key.
 */
export type Shared = { level: number; legacy: boolean; moves: string; count: number; helped: number; name: string };

/**
 * `#l=<jam>&m=<moves>&h=<hints, if any>&v=2&n=<name>`. The moves are replayed from the jam's start, so the count is proven.
 * Without `v` the link is from before the rewrite and names one of the 40 old jams. Anything that doesn't add up is refused.
 */
export function parseShared(hash: string): Shared | null {
  if (hash.length > 600) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const level = params.get("l") ?? "", moves = params.get("m") ?? "", helped = params.get("h") ?? "0", v = params.get("v");
  if (v !== null && v !== "2") return null;
  const legacy = v === null;
  if (!/^[1-9]\d?$/.test(level) || !/^(0|[1-9]\d{0,2})$/.test(helped)) return null;
  const game = replay(Number(level), moves, legacy);
  if (!game || Number(helped) > game.moves.length) return null;
  return { level: Number(level), legacy, moves, count: game.moves.length, helped: Number(helped), name: cleanName(params.get("n") ?? "") };
}

export function sharedHash({ level, legacy, moves, helped, name }: Pick<Shared, "level" | "legacy" | "moves" | "helped"> & { name?: string }) {
  const params = new URLSearchParams({ l: String(level), m: moves });
  if (helped) params.set("h", String(helped));
  if (!legacy) params.set("v", "2");
  const clean = cleanName(name ?? "");
  if (clean) params.set("n", clean);
  return params.toString();
}

/** The link for a finished game, or null when it took more moves than a link holds. */
export const fromGame = (game: Game, name: string): Shared | null => game.won && game.moves.length <= MAX_LINK_MOVES
  ? { level: game.level, legacy: game.legacy, moves: encodeMoves(game.moves), count: game.moves.length, helped: game.helped, name: cleanName(name) }
  : null;

/** "জ্যাম ১২" on the ladder, "পুরোনো জ্যাম ১২" for a friend's jam from before. */
export const jamLabel = (level: number, legacy = false) => legacy ? `পুরোনো জ্যাম ${bn(level)}` : `জ্যাম ${bn(level)}`;
/** The jam's name with its finale mark, for badges and the sheet. */
export const levelName = (level: number) => `${isFinale(level) ? "শেষ জ্যাম: " : ""}${infoOf(level).name}`;

/** "রাফি ১২ নম্বর জ্যাম ৯ চালে ছাড়িয়েছে (সেরা ৭)" */
export function feat({ level, legacy, count, helped, name }: Pick<Shared, "level" | "legacy" | "count" | "helped" | "name">) {
  const who = cleanName(name) || "এক বন্ধু";
  const where = legacy ? `${bn(level)} নম্বর পুরোনো জ্যাম` : isFinale(level) ? `‘${infoOf(level).name}’ জ্যাম` : `${bn(level)} নম্বর জ্যাম`;
  return `${who}${helped ? " একটু সাহায্য নিয়ে" : ""} ${where} ${bn(count)} চালে ছাড়িয়েছে (সেরা ${bn(parOf(level, legacy))})`;
}

export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;

export type Band = "perfect" | "close" | "good" | "long" | "helped";
export function band(count: number, best: number, helped: number): Band {
  if (helped) return "helped";
  if (count <= best) return "perfect";
  if (count <= best + 2) return "close";
  return count <= best * 2 ? "good" : "long";
}

const LINES: Record<Band, string> = {
  perfect: "এর চেয়ে কম চালে হয় না। একদম মাপা হিসাব!",
  close: "প্রায় নিখুঁত! আর এক-দুই চাল কমালেই সেরা।",
  good: "জ্যাম ছাড়ল, এবার সোজা বাসায়!",
  long: "ঘুরে-ফিরে হলেও বের হয়েছে। ধৈর্য আছে বলতে হবে।",
  helped: "একটু সাহায্য নিলে দোষ নেই, জ্যাম তো ছাড়ল!",
};
export const humanLine = (count: number, best: number, helped: number) => LINES[band(count, best, helped)];

/** The clear line on the end screen: what happened in the street, and what the best is. */
export function solvedLine(level: number, legacy: boolean, count: number, helped: number) {
  const dual = !legacy && level >= WORLDS[3].from;
  const out = dual ? "দুটো CNG-ই গলির ফাঁক দিয়ে বেরিয়ে গেল।" : "সবুজ CNG ফাঁক দিয়ে বেরিয়ে গেল।";
  const par = parOf(level, legacy);
  return `${out} ${count <= par && !helped ? "এর চেয়ে কম চালে হয় না।" : `সবচেয়ে কম লাগে ${bn(par)} চাল।`}`;
}

/** The first clear of a street's finale: the street is done. */
export function finaleLine(level: number) {
  const world = worldOf(level), next = WORLDS[WORLDS.indexOf(world) + 1];
  return `${possessive(world.name)} জ্যাম ছাড়ল।${next ? ` সামনে ${next.name}: ${next.adds}।` : " ঢাকার সব জ্যাম পার করেছ, এবার সবাই বাড়ি ফিরতে পারবে।"}`;
}

/** What one more star would have taken, in moves or in hints. Empty at three stars. Never contradicts the stars shown. */
export function nearMissLine(count: number, par: number, helped: number, legacy = false) {
  const earned = starsOf(count, par, helped, legacy);
  if (earned === 3) return "";
  const short = shortBy(count, par, helped, legacy);
  if (short > 0) return `আর ${bn(short)} চাল কম হলে ${bn(earned + 1)} তারা।`;
  return earned === hintCap(helped, legacy) ? "হিন্ট ছাড়া ছাড়ালে ৩ তারা পর্যন্ত পাবে।" : "";
}

/** "১:০৫" for the end screen. */
export const clock = (seconds: number) => `${bn(Math.floor(seconds / 60))}:${bn(Math.floor(seconds % 60)).padStart(2, "০")}`;
/** "১ মিনিট ৫ সেকেন্ড", for screen readers. */
export const duration = (seconds: number) => {
  const m = Math.floor(seconds / 60), s = Math.floor(seconds % 60);
  return m ? `${bn(m)} মিনিট${s ? ` ${bn(s)} সেকেন্ড` : ""}` : `${bn(s)} সেকেন্ড`;
};

/** After playing a friend's jam: fewer moves win, and it stays kind either way. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = cleanName(name) || "বন্ধু";
  if (mine < theirs) return `${possessive(who)} চেয়ে ${bn(theirs - mine)} চাল কম!`;
  if (mine === theirs) return `একদম সমান! ${who}ও ${bn(theirs)} চালেই ছাড়িয়েছিল।`;
  if (mine - theirs <= 2) return `আর একটু হলেই! মাত্র ${bn(mine - theirs)} চাল বেশি।`;
  return `${who} এখনো ${bn(mine - theirs)} চাল এগিয়ে। আরেকবার?`;
}

export function caption({ level, legacy, count, helped }: Pick<Shared, "level" | "legacy" | "count" | "helped">) {
  const where = legacy ? `${bn(level)} নম্বর পুরোনো জ্যাম` : isFinale(level) ? `‘${infoOf(level).name}’ জ্যাম` : `${bn(level)} নম্বর জ্যাম`;
  return `জ্যাম ছাড়াও খেলায় ${where} ${bn(count)} চালে ছাড়ালাম${helped ? ", একটু সাহায্য নিয়ে" : ""} (সেরা ${bn(parOf(level, legacy))})। দেখি তুমি কত চালে পারো!`;
}

// Challenge links and every line of result text. Server-safe: share.ts loads this.
import { possessive } from "../../../shared/bangla";
import { cleanName } from "../../../shared/game-core";
import { encodeMoves, fewest, replay, type Game } from "./game";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** A solved level: `count` moves (proven by replaying them), `helped` hints taken (the player's own word), an optional first name. */
export type Shared = { level: number; moves: string; count: number; helped: number; name: string };

/**
 * `#l=<level>&m=<moves>&h=<hints, if any>&n=<name>`. The moves are replayed from the level's start, so the count is proven.
 * Anything that doesn't add up is refused.
 */
export function parseShared(hash: string): Shared | null {
  if (hash.length > 600) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const level = params.get("l") ?? "", moves = params.get("m") ?? "", helped = params.get("h") ?? "0";
  if (!/^[1-9]\d?$/.test(level) || !/^(0|[1-9]\d{0,2})$/.test(helped)) return null;
  const game = replay(Number(level), moves);
  if (!game || Number(helped) > game.moves.length) return null;
  return { level: Number(level), moves, count: game.moves.length, helped: Number(helped), name: cleanName(params.get("n") ?? "") };
}

export function sharedHash({ level, moves, helped, name }: Pick<Shared, "level" | "moves" | "helped" | "name">) {
  const params = new URLSearchParams({ l: String(level), m: moves });
  if (helped) params.set("h", String(helped));
  const clean = cleanName(name);
  if (clean) params.set("n", clean);
  return params.toString();
}

export const fromGame = (game: Game, name: string): Shared =>
  ({ level: game.level, moves: encodeMoves(game.moves), count: game.moves.length, helped: game.helped, name: cleanName(name) });

/** "রাফি ১২ নম্বর জ্যাম ৯ চালে ছাড়িয়েছে (সেরা ৭)" */
export function feat({ level, count, helped, name }: Pick<Shared, "level" | "count" | "helped" | "name">) {
  const who = cleanName(name) || "এক বন্ধু";
  return `${who}${helped ? " একটু সাহায্য নিয়ে" : ""} ${bn(level)} নম্বর জ্যাম ${bn(count)} চালে ছাড়িয়েছে (সেরা ${bn(fewest(level))})`;
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

/** After playing a friend's level: fewer moves win, and it stays kind either way. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = cleanName(name) || "বন্ধু";
  if (mine < theirs) return `${possessive(who)} চেয়ে ${bn(theirs - mine)} চাল কম!`;
  if (mine === theirs) return `একদম সমান! ${who}ও ${bn(theirs)} চালেই ছাড়িয়েছিল।`;
  if (mine - theirs <= 2) return `আর একটু হলেই! মাত্র ${bn(mine - theirs)} চাল বেশি।`;
  return `${who} এখনো ${bn(mine - theirs)} চাল এগিয়ে। আরেকবার?`;
}

export function caption({ level, count, helped }: Pick<Shared, "level" | "count" | "helped">) {
  return `জ্যাম ছাড়াও খেলায় ${bn(level)} নম্বর জ্যাম ${bn(count)} চালে ছাড়ালাম${helped ? ", একটু সাহায্য নিয়ে" : ""} (সেরা ${bn(fewest(level))})। দেখি তুমি কত চালে পারো!`;
}

// Challenge links and every line of result text. Server-safe: share.ts loads this.
import { possessive } from "../../../shared/bangla";
import { cleanName } from "../../../shared/game-core";
import { encodeMoves, replay, sizeOf, starsOf, MAX_LINK_MOVES, type Game } from "./game";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);
/** "৪×৪" */
export const sizeLabel = (level: number) => `${bn(sizeOf(level))}×${bn(sizeOf(level))}`;

/** A solved plate: `count` moves (proven by replaying them), `helped` hints taken, an optional first name. */
export type Shared = { level: number; moves: string; count: number; helped: number; name: string };

/**
 * `#l=<level>&t=<moves>&m=<the moves, three a character>&h=<hints, if any>&n=<name>`. The moves are replayed from the
 * level's start, so the count is proven. Anything that doesn't add up is refused.
 */
export function parseShared(hash: string): Shared | null {
  if (hash.length > 1000) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const level = params.get("l") ?? "", count = params.get("t") ?? "", moves = params.get("m") ?? "", helped = params.get("h") ?? "0";
  if (!/^[1-9]\d?$/.test(level) || !/^[1-9]\d{0,3}$/.test(count) || !/^(0|[1-9]\d{0,3})$/.test(helped)) return null;
  const game = replay(Number(level), moves, Number(count));
  if (!game || Number(helped) > game.moves.length) return null;
  return { level: Number(level), moves, count: game.moves.length, helped: Number(helped), name: cleanName(params.get("n") ?? "") };
}

export function sharedHash({ level, moves, count, helped, name }: Omit<Shared, "name"> & { name?: string }) {
  const params = new URLSearchParams({ l: String(level), t: String(count), m: moves });
  if (helped) params.set("h", String(helped));
  const clean = cleanName(name ?? "");
  if (clean) params.set("n", clean);
  return params.toString();
}

/** The link for a finished game, or "" when it took more moves than a link holds. */
export const fromGame = (game: Game, name: string): Shared | null => game.won && game.moves.length <= MAX_LINK_MOVES
  ? { level: game.level, moves: encodeMoves(game.moves), count: game.moves.length, helped: game.helped, name: cleanName(name) }
  : null;

/** "রাফি ১২ নম্বর লেভেল (৪×৪) ৯৪ চালে মিলিয়েছে" */
export function feat({ level, count, helped, name }: Pick<Shared, "level" | "count" | "helped" | "name">) {
  const who = cleanName(name) || "এক বন্ধু";
  return `${who}${helped ? " একটু সাহায্য নিয়ে" : ""} ${bn(level)} নম্বর লেভেল (${sizeLabel(level)}) ${bn(count)} চালে মিলিয়েছে`;
}

export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;

const LINES = {
  3: "মাপা চাল, ঘুরপথ প্রায় নেই।",
  2: "মিলেছে। কয়েকটা চাল একটু ঘুরে গেছে, এই যা।",
  1: "লম্বা পথ, তবু শেষ ঘুঁটিটা ঠিক জায়গায় বসেছে।",
  helped: "একটু সাহায্য নিয়ে হলেও সব ঘুঁটি জায়গামতো।",
} as const;
/** The card's human line, by stars. */
export const humanLine = (count: number, level: number, helped: number) => helped ? LINES.helped : LINES[starsOf(count, level) as 1 | 2 | 3];

/** The level-clear line: one concrete picture of the solved plate. */
export const clearLine = (level: number) => `১ থেকে ${bn(sizeOf(level) ** 2 - 1)}, সব ঘুঁটি জায়গামতো।`;

/** After playing a friend's level: fewer moves win, and it stays kind either way. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = cleanName(name) || "বন্ধু";
  if (mine < theirs) return `${possessive(who)} চেয়ে ${bn(theirs - mine)} চাল কম!`;
  if (mine === theirs) return `একদম সমান! ${who}ও ${bn(theirs)} চালেই মিলিয়েছিল।`;
  if (mine - theirs <= 5) return `আর একটু হলেই! মাত্র ${bn(mine - theirs)} চাল বেশি।`;
  return `${who} এখনো ${bn(mine - theirs)} চাল এগিয়ে। আরেকবার?`;
}

export function caption({ level, count, helped }: Pick<Shared, "level" | "count" | "helped">) {
  return `১৫ ঘরের ধাঁধার ${bn(level)} নম্বর লেভেল (${sizeLabel(level)}) ${bn(count)} চালে মেলালাম${helped ? ", একটু সাহায্য নিয়ে" : ""}। তুমি কত চালে পারবে?`;
}

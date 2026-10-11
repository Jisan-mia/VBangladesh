// Rules, chit deals, scores and the pass-the-phone flow for চোর-ডাকাত-পুলিশ-বাবু.
// Server-safe: share.ts imports this through result.ts, so it uses game-core only, never React or game-kit.
import { cleanName, makeRng, pick } from "../../../shared/game-core";

export const PLAYERS = 4;
export const MAX_ROUNDS = 30;
export const MAX_NAME = 16;
export const MAX_POINTS = 9999;
export const ROUND_CHOICES = [5, 10, 15] as const;

export const BABU = 0, POLICE = 1, DAKAT = 2, CHOR = 3;
export type Role = 0 | 1 | 2 | 3;
export const roleNames = ["বাবু", "পুলিশ", "ডাকাত", "চোর"] as const;
/** The values most homes play with. Homes differ, so the setup screen lets a family change them. */
export const DEFAULT_POINTS: readonly number[] = [1000, 800, 500, 0];

export const occasions = [
  { id: "aj", label: "আজকের" },
  { id: "eid", label: "ঈদের রাতের" },
  { id: "puja", label: "পূজার ছুটির" },
  { id: "sheet", label: "শীতের রাতের" },
  { id: "load", label: "লোডশেডিংয়ের" },
  { id: "picnic", label: "পিকনিকের" },
] as const;
export type OccasionId = (typeof occasions)[number]["id"];
export const occasionLabel = (id: OccasionId) => occasions.find(item => item.id === id)!.label;

/** A whole evening: who sits where, the house points, and for each round whether the police caught the thief. */
export type Game = { seed: number; names: string[]; points: number[]; caught: boolean[]; occasion: OccasionId };

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);
export const ordinal = (index: number) => ["১ম", "২য়", "৩য়", "৪র্থ", "৫ম", "৬ষ্ঠ", "৭ম", "৮ম", "৯ম", "১০ম"][index] ?? `${bn(index + 1)}তম`;

const defaultNames = ["প্রথমজন", "দ্বিতীয়জন", "তৃতীয়জন", "চতুর্থজন"];
/** A player's typed name, cleaned and capped. Commas go because they separate the four names in the link. */
export const cleanPlayer = (name: string) => [...cleanName(name.replace(/,/g, " "))].slice(0, MAX_NAME).join("").trim();
export const nameOf = (names: readonly string[], seat: number) => cleanPlayer(names[seat] ?? "") || defaultNames[seat];
/** "ফোনটা রাফিকে দাও": Bangla names take "কে" straight on, Latin ones after a hyphen. */
export const dative = (name: string) => /[ঀ-৿]$/.test(name) ? `${name}কে` : `${name}-কে`;

export function clampPoints(value: number) {
  return Number.isFinite(value) ? Math.min(MAX_POINTS, Math.max(0, Math.round(value))) : 0;
}

/**
 * Every round's chits up to `rounds`: deals(seed, n)[round][seat] is that seat's role.
 * Same seed, same chits on every phone, so a link can rebuild the whole scoreboard from the guesses alone.
 * Which folded chit a player taps on screen is only the ritual; the seeded shuffle decides what is inside.
 */
export function deals(seed: number, rounds: number): Role[][] {
  const rng = makeRng(seed), all: Role[][] = [];
  for (let round = 0; round < rounds; round++) {
    const chits: Role[] = [BABU, POLICE, DAKAT, CHOR];
    for (let index = PLAYERS - 1; index > 0; index--) {
      const other = pick(rng, index + 1);
      [chits[index], chits[other]] = [chits[other], chits[index]];
    }
    all.push(chits);
  }
  return all;
}
export const dealFor = (seed: number, round: number) => deals(seed, round + 1)[round];

/** One round: everyone keeps their chit's points, but if the police names the wrong one, police and thief swap. */
export function roundPoints(roles: readonly Role[], caught: boolean, points: readonly number[]) {
  return roles.map(role => caught ? points[role] : role === POLICE ? points[CHOR] : role === CHOR ? points[POLICE] : points[role]);
}

export function totals(game: Game) {
  const all = deals(game.seed, game.caught.length), sum = [0, 0, 0, 0];
  game.caught.forEach((caught, round) => roundPoints(all[round], caught, game.points).forEach((value, seat) => { sum[seat] += value; }));
  return sum;
}

/** The two the police chooses between, in seat order so the order never gives away who is who. */
export const suspects = (roles: readonly Role[]) => roles.flatMap((role, seat) => role === DAKAT || role === CHOR ? [seat] : []);

export type Standing = { seat: number; name: string; total: number };
/** Highest first; a tie keeps seat order. */
export function standings(game: Game): Standing[] {
  return totals(game).map((total, seat) => ({ seat, name: nameOf(game.names, seat), total })).sort((a, b) => b.total - a.total || a.seat - b.seat);
}

// The flow on one phone: setup → (pass → peek) × 4 → call → guess → reveal → next round … → over.
// "setup" is also the paused screen: going back there and pressing "চালিয়ে যাও" restarts the current round's
// hand-out, and the seeded chits come out the same, so nobody gains by pausing.
export type Phase = "setup" | "pass" | "peek" | "call" | "guess" | "reveal" | "over";
export type Play = { game: Game; limit: number; phase: Phase; turn: number; seen: boolean };
export type Action =
  | { type: "start" } | { type: "ready" } | { type: "saw" } | { type: "done" } | { type: "call" }
  | { type: "guess"; seat: number } | { type: "next" } | { type: "end" } | { type: "more" } | { type: "pause" }
  | { type: "again"; seed: number } | { type: "reset"; seed: number };

export const newPlay = (game: Game, limit: number = ROUND_CHOICES[0]): Play => ({ game, limit, phase: "setup", turn: 0, seen: false });

export function act(play: Play, action: Action): Play {
  const { game, phase } = play;
  const rounds = game.caught.length;
  const at = (next: Phase, turn = 0): Play => ({ ...play, phase: next, turn, seen: false });
  switch (action.type) {
    case "start": return phase === "setup" ? at(rounds >= play.limit ? "over" : "pass") : play;
    case "ready": return phase === "pass" ? at("peek", play.turn) : play;
    case "saw": return phase === "peek" ? { ...play, seen: true } : play;
    case "done": return phase === "peek" && play.seen ? play.turn + 1 < PLAYERS ? at("pass", play.turn + 1) : at("call") : play;
    case "call": return phase === "call" ? at("guess") : play;
    case "guess": {
      if (phase !== "guess") return play;
      const roles = dealFor(game.seed, rounds);
      if (!suspects(roles).includes(action.seat)) return play;
      return { ...at("reveal"), game: { ...game, caught: [...game.caught, roles[action.seat] === CHOR] } };
    }
    case "next": return phase === "reveal" ? at(rounds >= play.limit ? "over" : "pass") : play;
    case "end": return phase === "reveal" && rounds > 0 ? at("over") : play;
    case "more": return phase === "over" && rounds < MAX_ROUNDS ? { ...at("pass"), limit: Math.min(MAX_ROUNDS, rounds + 5) } : play;
    case "pause": return phase === "over" || phase === "setup" ? play : at("setup");
    case "again": return { ...at("pass"), game: { ...game, seed: action.seed, caught: [] } };
    case "reset": return { ...at("setup"), game: { ...game, seed: action.seed, caught: [] } };
  }
}

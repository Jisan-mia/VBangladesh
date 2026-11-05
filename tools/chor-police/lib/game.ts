// Rules, chit deals, scores and the pass-the-phone flow for চোর-ডাকাত-পুলিশ-বাবু.
// Server-safe: share.ts imports this through result.ts, so it uses game-core only, never React or game-kit.
// Pure and deterministic: time comes in as `now` (ms), chance only through makeRng(seed).
import { cleanName, makeRng, pick } from "../../../shared/game-core";
import { ROUND_CHOICES } from "./levels";

export { ROUND_CHOICES };
export const PLAYERS = 4;
export const MAX_ROUNDS = 30;
export const MAX_NAME = 16;
export const MAX_POINTS = 9999;

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

// ---- The flow on one phone ----
// setup → (pass → peek) × 4 → call → guess → roll → reveal → next round … → over.
// pass is the dark hand-off screen with the থালা; tapping a chit there is the "I'm here" (no separate button).
// roll is the drumroll after the police names someone; a timer in the component sends "open" when it ends.
// Pausing is the shared player's menu over the current screen, so the flow has no paused phase of its own.
export type Phase = "setup" | "pass" | "peek" | "call" | "guess" | "roll" | "reveal" | "over";
export type Play = {
  game: Game; limit: number; phase: Phase; turn: number; seen: boolean;
  /** The seat the police named (roll and reveal), else -1. */
  accused: number;
  /** Which folded chit was tapped on the plate (peek), else -1. Only the ritual; the deal decides the role. */
  slot: number;
  /** When the screen last changed, in ms. Taps that land too soon after are dropped (see GUARD_MS). */
  since: number;
  /** The evening was finished (the limit reached, or ended early). Saved, so a reload never calls it paused. */
  done: boolean;
};
export type Action =
  | { type: "start" } | { type: "pick"; slot: number } | { type: "saw" } | { type: "done" } | { type: "call" }
  | { type: "accuse"; seat: number } | { type: "open" } | { type: "next" } | { type: "end" } | { type: "more" }
  | { type: "limit"; rounds: number } | { type: "again"; seed: number } | { type: "reset"; seed: number } | { type: "breath" };

/**
 * How long a screen ignores taps after it appears, so a double tap (or a second Enter) never acts on the next screen.
 * The reveal waits for its flips; the scorecard waits longest, because one stray press there used to wipe the evening.
 */
export const GUARD_MS: Record<Phase, number> = { setup: 450, pass: 450, peek: 450, call: 450, guess: 450, roll: 0, reveal: 900, over: 1200 };
/** Actions that come from the program, not a finger, and so skip the guard. */
const UNGUARDED = new Set<Action["type"]>(["saw", "open", "reset", "breath", "limit"]);

export const newPlay = (game: Game, limit: number = ROUND_CHOICES[0], done = false): Play =>
  ({ game, limit, phase: "setup", turn: 0, seen: false, accused: -1, slot: -1, since: -Infinity, done });

/** Still inside the guard after the last screen change? */
export const settling = (play: Play, now: number) => now - play.since < GUARD_MS[play.phase];
/** The round being dealt; on the roll and reveal screens, the one just named or scored. */
export const shownRound = (play: Play) => play.phase === "reveal" ? play.game.caught.length - 1 : play.game.caught.length;
/** The evening's last round is the finale ("শেষ দান"). */
export const isFinale = (play: Play) => play.limit > 1 && shownRound(play) === play.limit - 1 && play.phase !== "setup" && play.phase !== "over";

export function act(play: Play, action: Action, now: number): Play {
  if (!UNGUARDED.has(action.type) && settling(play, now)) return play;
  const { game, phase } = play;
  const rounds = game.caught.length;
  const at = (next: Phase, turn = 0): Play => ({ ...play, phase: next, turn, seen: false, accused: -1, slot: -1, since: now });
  switch (action.type) {
    case "start": return phase === "setup" ? rounds >= play.limit ? { ...at("over"), done: true } : at("pass") : play;
    case "pick": return phase === "pass" && action.slot >= 0 && action.slot < PLAYERS - play.turn ? { ...at("peek", play.turn), slot: action.slot } : play;
    case "saw": return phase === "peek" ? { ...play, seen: true } : play;
    case "done": return phase === "peek" && play.seen ? play.turn + 1 < PLAYERS ? at("pass", play.turn + 1) : at("call") : play;
    case "call": return phase === "call" ? at("guess") : play;
    case "accuse": {
      if (phase !== "guess" || !suspects(dealFor(game.seed, rounds)).includes(action.seat)) return play;
      return { ...at("roll"), accused: action.seat };
    }
    case "open": {
      if (phase !== "roll") return play;
      const roles = dealFor(game.seed, rounds);
      return { ...at("reveal"), accused: play.accused, game: { ...game, caught: [...game.caught, roles[play.accused] === CHOR] } };
    }
    case "next": return phase === "reveal" ? rounds >= play.limit ? { ...at("over"), done: true } : at("pass") : play;
    case "end": return phase === "reveal" && rounds > 0 && rounds < play.limit ? { ...at("over"), done: true } : play;
    case "more": return phase === "over" && rounds < MAX_ROUNDS ? { ...at("pass"), limit: Math.min(MAX_ROUNDS, rounds + 5), done: false } : play;
    case "limit": return phase === "setup" && action.rounds > rounds && action.rounds <= MAX_ROUNDS ? { ...play, limit: action.rounds } : play;
    // A finished evening goes back to the title screen (names and points kept); starting again is a second, deliberate tap.
    case "again": return phase === "over" ? { ...at("setup"), game: { ...game, seed: action.seed, caught: [] }, done: false } : play;
    case "reset": return { ...at("setup"), game: { ...game, seed: action.seed, caught: [] }, done: false };
    // Coming back from the pause menu: same screen, but a fresh guard so the tap on চালিয়ে যাও can't fall through.
    case "breath": return { ...play, since: now };
  }
}

// ---- Saved progress (localStorage "chor-police-game") ----
/** The saved shape: `h` the evening as a link hash, `l` the round limit, `d` 1 once the evening is over (new in 2026-11). */
export type Saved = { h?: string; l?: number; d?: number };
export const saveOf = (play: Play, hash: string): Saved => play.done ? { h: hash, l: play.limit, d: 1 } : { h: hash, l: play.limit };

/**
 * What a reload brings back. An evening in progress comes back on the title screen ready to continue; a finished one
 * (marked done, or with every round played) keeps only the names, points and occasion. Old saves have no `d`, so an
 * old early-ended evening still reads as unfinished; it migrates the next time it is saved.
 */
export function restore(saved: Saved | null, parse: (hash: string) => Game | null, seed: number): Play {
  const game = saved?.h ? parse(saved.h) : null;
  const limit = Math.min(MAX_ROUNDS, Math.max(1, Math.round(Number(saved?.l)) || ROUND_CHOICES[0]));
  const fresh: Game = { seed, names: ["", "", "", ""], points: [...DEFAULT_POINTS], caught: [], occasion: "aj" };
  if (!game) return newPlay(fresh);
  const unfinished = saved?.d !== 1 && game.caught.length > 0 && game.caught.length < limit;
  return unfinished ? newPlay(game, limit) : newPlay({ ...game, seed, caught: [] }, ROUND_CHOICES.some(choice => choice === limit) ? limit : ROUND_CHOICES[0]);
}

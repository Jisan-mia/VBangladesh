// The spinning top, in game seconds. Pure and seeded: the same seed lays the same pebbles, ridges and gusts on every phone,
// and the same seed plus the same throw and taps gives the same spin. Server-safe (share.ts reads LEVELS through result.ts).
import { makeRng, starsFor } from "../../../shared/game-core";

export type SurfaceId = "mati" | "mejhe" | "tin";
export const SURFACES: Record<SurfaceId, string> = { mati: "মাটির উঠান", mejhe: "পাকা মেঝে", tin: "টিনের চাল" };

/**
 * Nine stages on three surfaces. Each adds one thing: `friction` slows the spin, `growth` is how fast the wobble builds,
 * `bumps` pebbles per 10 s of `bumpSize`, `ridge` a tin ridge every so many seconds, `wind` gusts that push the wobble.
 * `stars` are the seconds for 1, 2 and 3 stars (1 star clears the stage).
 */
export const LEVELS = [
  { surface: "mati", name: "উঠানের মাঝখান", news: "নরম মাটি, কোনো বাধা নেই।", friction: 0.028, growth: 0.07, bumps: 0, bumpSize: 0, ridge: 0, wind: 0, stars: [4, 12, 20] },
  { surface: "mati", name: "শুকনো পাতা", news: "এবার উঠানে কিছু শুকনো পাতা।", friction: 0.028, growth: 0.07, bumps: 2, bumpSize: 0.05, ridge: 0, wind: 0, stars: [6, 13, 20] },
  { surface: "mati", name: "নুড়ি পাথর", news: "নুড়িতে লাগলে লাটিম টলে।", friction: 0.028, growth: 0.075, bumps: 3, bumpSize: 0.09, ridge: 0, wind: 0, stars: [7, 13, 20] },
  { surface: "mejhe", name: "লাল মেঝে", news: "পিছলা মেঝে: ঘোরে বেশি, টলেও তাড়াতাড়ি।", friction: 0.022, growth: 0.095, bumps: 0, bumpSize: 0, ridge: 0, wind: 0, stars: [8, 15, 23] },
  { surface: "mejhe", name: "মোছা মেঝে", news: "সদ্য মোছা, আরও পিছলা।", friction: 0.02, growth: 0.11, bumps: 1, bumpSize: 0.05, ridge: 0, wind: 0, stars: [8, 15, 23] },
  { surface: "mejhe", name: "মেঝের ফাটল", news: "ফাটলে পড়লে লাটিম ঝাঁকি খায়।", friction: 0.021, growth: 0.105, bumps: 3, bumpSize: 0.1, ridge: 0, wind: 0, stars: [9, 15, 22] },
  { surface: "tin", name: "টিনের চাল", news: "টিনের ঢেউয়ে একটু পরপর ঝাঁকি।", friction: 0.025, growth: 0.09, bumps: 0, bumpSize: 0, ridge: 2.6, wind: 0, stars: [9, 15, 22] },
  { surface: "tin", name: "চালে বাতাস", news: "এবার বাতাস ঠেলবে।", friction: 0.025, growth: 0.09, bumps: 0, bumpSize: 0, ridge: 2.6, wind: 0.12, stars: [9, 15, 21] },
  { surface: "tin", name: "দমকা হাওয়া", news: "ঢেউ, পাতা আর দমকা হাওয়া, সব একসাথে।", friction: 0.025, growth: 0.095, bumps: 2, bumpSize: 0.07, ridge: 2.4, wind: 0.2, stars: [9, 15, 20] },
] as const satisfies ReadonlyArray<{ surface: SurfaceId; name: string; news: string; friction: number; growth: number; bumps: number; bumpSize: number; ridge: number; wind: number; stars: readonly [number, number, number] }>;
export const LEVEL_COUNT = LEVELS.length;

/** Picking the top up on the palm adds this many tenths of a second. */
export const BONUS = 50;
/** The palm trick opens once the spin drops below this, and works while the wobble is under PICK_STEADY. */
export const PICK_SPIN = 0.32, PICK_STEADY = 0.6;
/** A nudge is "ঠিক সময়ে" when the lean is this close to its edge (|sin| of the sway), "চলবে" above OK_SWAY. */
export const GOOD_SWAY = 0.88, OK_SWAY = 0.6;
/** Taps closer together than this count once, so hammering the button does nothing extra. */
export const NUDGE_GAP = 0.22;
/** Every touch costs a little spin. */
export const NUDGE_COST = 0.006;
const MAX_TIME = 90;

export type Phase = "ready" | "spin" | "fallen" | "palm";
export type Bump = { at: number; size: number; ridge: boolean };
export type Nudge = "good" | "ok" | "miss";

export type Game = {
  seed: number; level: number; phase: Phase;
  /** Spin left (1 = a full throw, 0 = stopped) and wobble (1 = falls). */
  omega: number; wobble: number;
  /** Game seconds spun; the lean's swing phase; the painted top's turn (for drawing only). */
  t: number; sway: number; turn: number;
  power: number; straight: number;
  bumps: Bump[]; nextBump: number; lastBump: number;
  gusts: [number, number, number];
  lastNudge: number; nudges: number; goodNudges: number; combo: number; bestCombo: number;
  bonus: number; fall: "wobble" | "slow" | "drop" | null;
};

export const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

/** The surface for a seed: pebbles and ridges (none in the first 2 s, so every throw gets a clean start) and the wind's rhythm. */
export function makeSurface(seed: number, level: number) {
  const rng = makeRng(seed * 31 + level);
  const spec = LEVELS[level - 1], bumps: Bump[] = [];
  if (spec.bumps > 0) for (let at = 2 + rng() * (10 / spec.bumps); at < MAX_TIME; at += (0.4 + rng() * 1.2) * (10 / spec.bumps)) bumps.push({ at, size: spec.bumpSize * (0.6 + 0.8 * rng()), ridge: false });
  if (spec.ridge > 0) for (let at = 2 + rng() * spec.ridge; at < MAX_TIME; at += spec.ridge * (0.85 + 0.3 * rng())) bumps.push({ at, size: 0.035, ridge: true });
  bumps.sort((a, b) => a.at - b.at);
  const gusts: [number, number, number] = [rng() * 6.28, rng() * 6.28, 0.7 + rng() * 0.5];
  return { bumps, gusts };
}

export function newGame(seed: number, level = 1): Game {
  const at = Math.max(1, Math.min(LEVEL_COUNT, Math.floor(level) || 1));
  return { seed, level: at, phase: "ready", omega: 0, wobble: 0, t: 0, sway: 0, turn: 0, power: 0, straight: 0, ...makeSurface(seed, at), nextBump: 0, lastBump: -9, lastNudge: -9, nudges: 0, goodNudges: 0, combo: 0, bestCombo: 0, bonus: 0, fall: null };
}

/** How hard the wind pushes at time t, 0..1. */
export function gust(game: Game, t: number) {
  const [a, b, rate] = game.gusts;
  return Math.max(0, (Math.sin(t * rate + a) + 0.6 * Math.sin(t * rate * 2.7 + b) - 0.2) / 1.4);
}

/** The throw: a harder pull spins longer, a straighter pull starts steadier. */
export function throwTop(game: Game, power: number, straight: number) {
  if (game.phase !== "ready") return false;
  game.power = clamp01(power); game.straight = clamp01(straight);
  game.omega = 0.42 + 0.58 * game.power;
  game.wobble = 0.04 + 0.46 * (1 - game.straight) ** 1.3;
  game.phase = "spin";
  return true;
}

/** How fast the lean swings (radians a second): it quickens as the top slows. Never more than ~2 edge windows a second. */
export const swayRate = (omega: number) => 2.6 + 3.4 * (1 - clamp01(omega));

/** The lean right now, -1..1 (times the wobble for the drawn tilt). */
export const lean = (game: Game) => Math.sin(game.sway);

/** One fixed step. Returns the bump hit in this step, if any, so the page can tick and shake. */
export function step(game: Game, dt: number): Bump | null {
  if (game.phase !== "spin") return null;
  const spec = LEVELS[game.level - 1], slack = 1 - game.omega;
  game.t += dt;
  game.omega -= (spec.friction + 0.06 * game.wobble) * dt;
  game.wobble += spec.growth * (0.2 + 1.8 * slack * slack) * dt;
  if (spec.wind) game.wobble += spec.wind * gust(game, game.t) * dt;
  game.sway += swayRate(game.omega) * dt;
  game.turn = (game.turn + (6 + 22 * Math.max(0, game.omega)) * dt) % (Math.PI * 2);
  let hit: Bump | null = null;
  while (game.nextBump < game.bumps.length && game.bumps[game.nextBump].at <= game.t) {
    hit = game.bumps[game.nextBump++];
    game.wobble += hit.size * (0.5 + slack);
    game.lastBump = game.t;
  }
  if (game.wobble >= 1 || game.omega <= 0.02 || game.t >= MAX_TIME) {
    game.fall = game.wobble >= 1 ? "wobble" : "slow";
    game.wobble = Math.min(1, game.wobble);
    game.phase = "fallen";
  }
  return hit;
}

/** A tap while it spins: at the lean's edge it steadies the top a lot, mid-swing a little, at the centre it knocks it. */
export function nudge(game: Game): Nudge | null {
  if (game.phase !== "spin" || game.t - game.lastNudge < NUDGE_GAP) return null;
  game.lastNudge = game.t;
  game.nudges++;
  game.omega -= NUDGE_COST;
  const edge = Math.abs(lean(game));
  if (edge >= GOOD_SWAY) {
    game.wobble *= 0.5;
    game.goodNudges++; game.combo++; game.bestCombo = Math.max(game.bestCombo, game.combo);
    return "good";
  }
  if (edge >= OK_SWAY) { game.wobble *= 0.85; return "ok"; }
  game.wobble = Math.min(0.99, game.wobble + 0.12);
  game.combo = 0;
  return "miss";
}

export const canPick = (game: Game) => game.phase === "spin" && game.omega < PICK_SPIN;

/** The palm trick. A steady top hops onto the palm for the bonus; a wobbly one slips and falls. */
export function pickUp(game: Game) {
  if (!canPick(game)) return null;
  if (game.wobble < PICK_STEADY) { game.bonus = BONUS; game.phase = "palm"; return true; }
  game.phase = "fallen"; game.fall = "drop";
  return false;
}

/** The score in tenths of a second: the spin plus the palm bonus. */
export const scoreOf = (game: Game) => Math.floor(game.t * 10 + 1e-9) + game.bonus;
export const over = (game: Game) => game.phase === "fallen" || game.phase === "palm";

/** Stars for a score in tenths: 0 below the stage's first mark. */
export function starsOf(tenths: number, level: number) {
  const [one, two, three] = LEVELS[level - 1].stars;
  return tenths < one * 10 ? 0 : starsFor(tenths, three * 10, two * 10);
}
/** The next mark in tenths (clear, 2 stars, 3 stars), or 0 at three stars. */
export const nextMark = (tenths: number, level: number) => LEVELS[level - 1].stars.map(s => s * 10).find(mark => tenths < mark) ?? 0;

/** Throw quality from a downward swipe, in canvas heights and seconds. `tail` is the last ~120 ms of the pull (a flick at the end counts). */
export function swipeThrow(dx: number, dy: number, seconds: number, tail: { dy: number; seconds: number } | null, wiggle = 0) {
  if (!(dy >= 0.12) || dy < Math.abs(dx) * 0.7) return null;
  const overall = dy / Math.max(0.04, seconds), late = tail && tail.seconds > 0.02 ? tail.dy / tail.seconds : 0;
  const speed = Math.max(overall, late);
  const power = clamp01((speed - 0.7) / 3.3);
  const straight = clamp01(1 - Math.atan2(Math.abs(dx), dy) / (Math.PI / 4) - wiggle * 1.5);
  return { power, straight };
}

/** The hold-to-wind bar: fills in 0.8 s, then slips back, and again (ping-pong). The tap way throws a little less straight. */
export const windPower = (held: number) => { const x = (held / 0.8) % 2; return x <= 1 ? x : 2 - x; };
export const WIND_STRAIGHT = 0.85;

export type Badge = "t10" | "t20" | "t30" | "palm" | "combo5" | "still";
export const BADGES: Record<Badge, string> = {
  t10: "১০ সেকেন্ড", t20: "২০ সেকেন্ড", t30: "৩০ সেকেন্ড",
  palm: "হাতে তোলা", combo5: "টানা ৫ টোকা", still: "হাত না লাগিয়ে ১০ সেকেন্ড",
};
export const BADGE_IDS = Object.keys(BADGES) as Badge[];

/** Milestones from one spin: time (in tenths, without the bonus), the palm trick, the best run of good taps, and taps used. */
export function badgesOf(spun: number, palm: boolean, bestCombo: number, nudges: number): Badge[] {
  const won: Badge[] = [];
  if (spun >= 100) won.push("t10");
  if (spun >= 200) won.push("t20");
  if (spun >= 300) won.push("t30");
  if (palm) won.push("palm");
  if (bestCombo >= 5) won.push("combo5");
  if (spun >= 100 && nudges === 0) won.push("still");
  return won;
}

/** Badges kept on this phone (fixed ids only; anything else is dropped). */
export function readBadges(raw: string | null): Badge[] {
  try {
    const list = JSON.parse(raw ?? "[]");
    return Array.isArray(list) ? BADGE_IDS.filter(id => list.includes(id)) : [];
  } catch { return []; }
}

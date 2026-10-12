// Rules for অ্যান্টেনা ঠিক করো: where each channel's signal hides, how clear the picture is at an angle,
// what the person downstairs shouts, and how the time is scored. Pure functions, so tests can play whole games.
import { possessive } from "../../../shared/bangla";
import { makeRng, pick, starsFor, type LevelStars } from "../../../shared/game-core";
import { bn, DWELL, LEVEL_COUNT, MAX_TENTHS, MIN_TENTHS, ROUNDS, seconds, type Shared } from "./link";

export { bn, DWELL, LEVEL_COUNT, MAX_TENTHS, MIN_TENTHS, parseShared, previewTitle, ROUNDS, seconds, sharedHash, type Shared } from "./link";

export const SLUG = "antenna-thik-koro";
/** Half-width of each channel's sweet spot, in degrees: wide for the first, narrower every channel after. */
export const HALF_WIDTHS = [14, 11, 9, 7, 6] as const;
/** Seconds of "ছবি এসেছে!" between channels; the clock doesn't run then. */
export const CELEBRATE = 1.3;
/** Degrees outside the sweet spot over which the snow thins; beyond this the screen is pure snow. */
export const REACH = 110;
export const DECOY_SPAN = 32;
export const DECOY_PEAK = 0.4;
/** After this many seconds on one channel the shout says which way to turn, however far off you are. */
export const ASSIST_AFTER = 15;
const HINT_TICK = 0.3;
const HINT_MIN = 0.8;
const WARM = 75;

// Order matters only inside a game (the seed shuffles it); drawings live in art.ts.
export const PICTURES = ["cricket", "natok", "gaan", "nodi", "kartun", "ranna"] as const;
export type PictureId = (typeof PICTURES)[number];
/** Generic programme kinds, never a real channel or programme name. */
export const SHOWS: Record<PictureId, string> = { cricket: "ক্রিকেট খেলা", natok: "নাটক", gaan: "গানের অনুষ্ঠান", nodi: "নদীর ছবি", kartun: "কার্টুন", ranna: "রান্নার অনুষ্ঠান" };

/**
 * Each level is one evening of five channels and adds one thing: narrower sweet spots (`scale`), the ghost from an earlier
 * channel (`ghostFrom`), or wind that sways the signal ±`wind`°. Level 1 is the original game, so old links replay unchanged.
 * `stars` are the total tenths of a second at or under which you get 3 and 2 stars (the scripted player's 75th percentile ×1.5 and 90th ×2.5, since people overshoot where it stops dead).
 */
export const LEVELS = [
  { scale: 1, ghostFrom: 2, wind: 0, stars: [310, 550] },
  { scale: 0.9, ghostFrom: 2, wind: 0, stars: [330, 580] },
  { scale: 0.9, ghostFrom: 1, wind: 0, stars: [340, 590] },
  { scale: 0.8, ghostFrom: 1, wind: 0, stars: [340, 590] },
  { scale: 1, ghostFrom: 2, wind: 6, stars: [340, 600] },
  { scale: 0.9, ghostFrom: 1, wind: 8, stars: [350, 610] },
  { scale: 0.8, ghostFrom: 1, wind: 10, stars: [360, 620] },
  { scale: 0.8, ghostFrom: 0, wind: 10, stars: [360, 630] },
  { scale: 0.7, ghostFrom: 0, wind: 12, stars: [370, 650] },
  { scale: 0.7, ghostFrom: 0, wind: 15, stars: [380, 670] },
  { scale: 0.65, ghostFrom: 0, wind: 16, stars: [400, 690] },
  { scale: 0.6, ghostFrom: 0, wind: 18, stars: [420, 730] },
] as const satisfies ReadonlyArray<{ scale: number; ghostFrom: number; wind: number; stars: readonly [number, number] }>;
/** Radians a second of the wind's sway (one full sway about every 8 s). */
export const WIND_SPEED = 0.8;
export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
export const starsOf = (tenths: number, level: number) => starsFor(tenths, LEVELS[level - 1].stars[0], LEVELS[level - 1].stars[1], true);
/** Tenths to shave off for the next star, or 0 at three stars. */
export const toNextStar = (tenths: number, level: number) => {
  const earned = starsOf(tenths, level);
  return earned === 3 ? 0 : tenths - LEVELS[level - 1].stars[earned === 2 ? 0 : 1];
};
/** Before levels, this phone kept only a best time for the one game there was (now level 1). Turns it into level 1's stars, once. */
export function migrateBest(stars: LevelStars, oldBest: string | null): number {
  const tenths = Number(oldBest);
  if (Object.keys(stars).length || oldBest === null || !Number.isInteger(tenths) || tenths < MIN_TENTHS || tenths > MAX_TENTHS) return 0;
  return starsOf(tenths, 1);
}

/** `wind`, when set, sways the signal around `home`; stepGame moves `sweet` while you search. */
export type Round = { sweet: number; half: number; decoy: number | null; picture: PictureId; wind?: { home: number; amp: number; phase: number } };

export const wrap = (angle: number) => ((angle % 360) + 360) % 360;
/** Signed shortest turn from `from` to `to`, in [-180, 180): positive means turn right (clockwise). */
export const angDiff = (to: number, from: number) => wrap(to - from + 180) - 180;

/** The seed fixes the channels' order, where each signal hides, and (from channel ৩ on level 1) a weak ghost signal elsewhere. */
export function makeRounds(seed: number, level = 1): Round[] {
  const { scale, ghostFrom, wind } = LEVELS[level - 1];
  const rng = makeRng(seed);
  const order = [...PICTURES];
  for (let index = order.length - 1; index > 0; index--) {
    const swap = pick(rng, index + 1);
    [order[index], order[swap]] = [order[swap], order[index]];
  }
  let from = 0;
  return HALF_WIDTHS.map((half, index) => {
    // Never right where the antenna already points: 60°–110° away for the first channel, 75°–165° after.
    const away = index === 0 ? 60 + pick(rng, 51) : 75 + pick(rng, 91);
    const sweet = wrap(from + (rng() < 0.5 ? -away : away));
    // The ghost sits 100°–160° from the real signal, so the two never blur together.
    const decoy = index < ghostFrom ? null : wrap(sweet + (rng() < 0.5 ? -1 : 1) * (100 + pick(rng, 61)));
    from = sweet;
    const round: Round = { sweet, half: half * scale, decoy, picture: order[index] };
    if (wind) round.wind = { home: sweet, amp: wind, phase: rng() * Math.PI * 2 };
    return round;
  });
}

/** How clear the picture is at this angle, 0 (all snow) to 1 (locked). The ghost never gets past 0.4. */
export function signal(round: Round, angle: number) {
  const d = Math.abs(angDiff(round.sweet, angle));
  const main = d <= round.half ? 1 : 0.85 * Math.max(0, 1 - (d - round.half) / REACH) ** 2;
  if (round.decoy === null) return main;
  const ghost = Math.abs(angDiff(round.decoy, angle));
  return Math.max(main, ghost < DECOY_SPAN ? DECOY_PEAK * (1 - ghost / DECOY_SPAN) ** 2 : 0);
}

export type Hint = "start" | "next" | "nothing" | "idle" | "fuzzy" | "warmer" | "colder" | "ghost" | "right" | "left" | "far-right" | "far-left" | "hold" | "slip-right" | "slip-left" | "got" | "done";
export type Phase = "ready" | "search" | "got" | "over";

export type Game = {
  seed: number;
  level: number;
  rounds: Round[];
  index: number;
  angle: number;
  phase: Phase;
  /** Seconds on the clock (searching only). */
  time: number;
  roundTime: number;
  dwell: number;
  celebrate: number;
  hint: Hint;
  hintAge: number;
  hintTick: number;
  /** Degrees moved toward the signal since the last hint check (negative: away). */
  approach: number;
  lastDist: number;
  /** Seconds since the antenna last moved. */
  still: number;
  /** Was in the sweet spot a moment ago (so leaving it says "সরে গেল"). */
  held: boolean;
};

export function createGame(seed: number, level = 1): Game {
  const rounds = makeRounds(seed, level);
  return { seed, level, rounds, index: 0, angle: 0, phase: "ready", time: 0, roundTime: 0, dwell: 0, celebrate: 0, hint: "start", hintAge: 0, hintTick: 0, approach: 0, lastDist: Math.abs(angDiff(rounds[0].sweet, 0)), still: 0, held: false };
}

function say(game: Game, hint: Hint) {
  game.hint = hint;
  game.hintAge = 0;
}

/** What the person downstairs can tell from the picture alone: near the signal they know which way, far off only "worse" or "better". */
export function chooseHint(round: Round, angle: number, roundTime: number, approach: number, still: number): Hint {
  const toward = angDiff(round.sweet, angle);
  const d = Math.abs(toward);
  if (d <= round.half * 3 + 10) return toward > 0 ? "right" : "left";
  if (round.decoy !== null && Math.abs(angDiff(round.decoy, angle)) < DECOY_SPAN) return "ghost";
  if (roundTime >= ASSIST_AFTER) return toward > 0 ? "far-right" : "far-left";
  if (still >= 2.5) return "idle";
  if (d <= WARM) return approach > 0.3 ? "warmer" : approach < -0.3 ? "colder" : "fuzzy";
  return "nothing";
}

/**
 * Advances the game by dt seconds after turning the antenna by `turn` degrees (positive = right).
 * Mutates in place and allocates nothing, so it can run 60 times a second on a cheap phone.
 */
export function stepGame(game: Game, turn: number, dt: number, celebrateFor = CELEBRATE) {
  if (game.phase === "over") return;
  if (turn !== 0) {
    game.angle = wrap(game.angle + turn);
    game.still = 0;
    if (game.phase === "ready") game.phase = "search";
  } else game.still += dt;
  if (game.phase === "ready") return;
  if (game.phase === "got") {
    game.celebrate -= dt;
    if (game.celebrate > 0) return;
    if (game.index === game.rounds.length - 1) { game.phase = "over"; say(game, "done"); return; }
    game.index++;
    game.phase = "search";
    game.roundTime = 0; game.dwell = 0; game.held = false; game.approach = 0; game.hintTick = 0;
    game.lastDist = Math.abs(angDiff(game.rounds[game.index].sweet, game.angle));
    say(game, "next");
    return;
  }
  game.time += dt;
  game.roundTime += dt;
  game.hintAge += dt;
  game.hintTick += dt;
  const round = game.rounds[game.index];
  if (round.wind) round.sweet = wrap(round.wind.home + round.wind.amp * Math.sin(game.roundTime * WIND_SPEED + round.wind.phase));
  const toward = angDiff(round.sweet, game.angle);
  const d = Math.abs(toward);
  game.approach += game.lastDist - d;
  game.lastDist = d;
  if (d <= round.half) {
    game.dwell += dt;
    game.held = true;
    if (game.dwell >= DWELL) { game.phase = "got"; game.celebrate = celebrateFor; say(game, "got"); }
    else if (game.hint !== "hold") say(game, "hold");
    return;
  }
  game.dwell = 0;
  if (game.held) { game.held = false; say(game, toward > 0 ? "slip-right" : "slip-left"); return; }
  if (game.hintTick < HINT_TICK) return;
  const approach = game.approach;
  game.approach = 0;
  game.hintTick = 0;
  if (game.hintAge < HINT_MIN) return;
  const next = chooseHint(round, game.angle, game.roundTime, approach, game.still);
  if (next !== game.hint) say(game, next);
}

export const tenthsOf = (time: number) => Math.min(MAX_TENTHS, Math.max(MIN_TENTHS, Math.round(time * 10)));
export const channelName = (index: number) => `চ্যানেল ${bn(index + 1)}`;

const SHOUTS: Record<Exclude<Hint, "next">, string> = {
  start: "ঘুরিয়ে ছবি আনো!",
  nothing: "কিছুই আসছে না, শুধু ঝিরঝির!",
  idle: "কী হলো? ঘোরাও!",
  fuzzy: "কিছু একটা আসছে…",
  warmer: "হ্যাঁ, এদিকেই! ঝিরঝির কমছে…",
  colder: "উল্টো দিকে যাচ্ছ! আবার ঝিরঝির।",
  ghost: "আবছা কী যেন আসে… এটা না, আরও ঘোরাও।",
  right: "আরেকটু ডানে…",
  left: "আরেকটু বাঁয়ে…",
  "far-right": "ডান দিকে ঘোরাও, অনেকটা!",
  "far-left": "বাঁ দিকে ঘোরাও, অনেকটা!",
  hold: "হ্যাঁ হ্যাঁ, এবার আসছে! নড়িও না…",
  "slip-right": "আহা, সরে গেল! একটু ডানে ফেরাও।",
  "slip-left": "আহা, সরে গেল! একটু বাঁয়ে ফেরাও।",
  got: "ছবি এসেছে!",
  done: "সব চ্যানেল ঝকঝকে! এবার নেমে এসো।",
};
/** The shout from downstairs, for the speech bubble. */
export const shout = (hint: Hint, index: number, windy = false) =>
  hint === "next" ? `এবার ${channelName(index)}! আবার ঘোরাও।` : hint === "start" && windy ? "আজ হাওয়া আছে, ছবি সরে সরে যায়। ঘোরাও!" : SHOUTS[hint];

/** The human line by total time, kind at every speed. Thresholds are in tenths of a second. */
export const BANDS = [
  { below: 200, line: "খেলা শুরুর আগেই ছবি এসে গেল!" },
  { below: 350, line: "নিচ থেকে কাউকে দুবার চেঁচাতে হয়নি।" },
  { below: 600, line: "আরেকটু ডানে, আরেকটু বাঁয়ে… শেষে ছবি ঝকঝকে।" },
  { below: Infinity, line: "ঝিরঝির হার মেনেছে। পরের বার আরও তাড়াতাড়ি হবে!" },
] as const;
export const humanLine = (tenths: number) => BANDS.find(band => tenths < band.below)!.line;

export const caption = (tenths: number) => `ছাদের অ্যান্টেনা ঘুরিয়ে ${bn(ROUNDS)}টা চ্যানেল ${seconds(tenths)} সেকেন্ডে ঝকঝকে! একই অ্যান্টেনা, তুমি কত সেকেন্ডে পারবে?`;
export const friendLine = ({ tenths, name }: Shared) => `${name || "তোমার বন্ধু"} ${seconds(tenths)} সেকেন্ডে ${bn(ROUNDS)}টা চ্যানেল এনেছে। একই অ্যান্টেনা, এবার তোমার পালা।`;
/** Honest label: a real-time score can't be checked. */
export const friendClaim = ({ name }: Shared) => `${possessive(name || "বন্ধু")} নিজের ফোনের সময়`;

export function compareLine(mine: number, friend: Shared) {
  const who = friend.name || "বন্ধু";
  const gap = Math.abs(mine - friend.tenths);
  if (gap === 0) return `${possessive(who)} সাথে একদম সমান সমান!`;
  if (mine < friend.tenths) return `${possessive(who)} চেয়ে ${seconds(gap)} সেকেন্ড আগে!`;
  if (gap <= 30) return `আর একটু হলেই! ${who} মাত্র ${seconds(gap)} সেকেন্ড এগিয়ে।`;
  return `${who} এবার ${seconds(gap)} সেকেন্ড এগিয়ে। আরেকবার?`;
}

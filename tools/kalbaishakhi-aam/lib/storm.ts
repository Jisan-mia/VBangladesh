// The storm's rules as plain functions: a seeded fall schedule, the wind, where each drop crosses the ডালা's rim,
// scoring and the share link. No DOM here, so the same storm can be replayed and tested headless.
import { challengeHash, cleanName, makeRng, readChallenge, readLevels, starsFor } from "../../../shared/game-core";
import { possessive } from "../../../shared/bangla";

/** The play field in logical units; the canvas scales it to the phone. */
export const W = 360, H = 450;
/** Where a drop breaks off the canopy, the ডালা's rim (the catch line) and the courtyard. */
export const SPAWN_Y = 132, BASKET_Y = 380, GROUND_Y = 420;
export const BASKET_HALF = 40;
/** A drop is in the ডালা when its centre crosses the rim within this distance of the ডালা's centre. */
export const CATCH = BASKET_HALF + 4;
export const DURATION = 45;
export const LIVES = 3;
/** How fast a tapping thumb can surely move the ডালা (units a second). The schedule never asks for more. */
export const REACH = 230;
export const STEP = 56, MOVE_SPEED = 300, FOLLOW_SPEED = 1400;
export const BASKET_MIN = 26, BASKET_MAX = W - 26;
/** The hanging mango shakes this long before it drops, so nothing falls without warning. */
export const WARN = 0.6;

export const GREEN = 0, RIPE = 1, BRANCH = 2;
export const POINTS = [5, 10, 0] as const;
/** Drop states. */
export const FALLING = 0, CAUGHT = 1, MISSED = 2, HIT = 3;

export type Drop = { kind: number; t0: number; x0: number; drift: number; fall: number; spin: number; tc: number; xc: number; state: number };
export type Gust = { at: number; length: number; strength: number };
export type Storm = { seed: number; stage: number; drops: Drop[]; gusts: Gust[] };

/**
 * The storms, from a breeze to the last storm of Boishakh. Each adds one thing: faster falls, more mangoes, twigs sooner and more often, stronger gusts.
 * fall and gap go from the storm's start to its end (seconds); twigs start after `twigFrom` seconds with a chance from twig[0] to twig[1].
 */
export type StormLevel = { name: string; fall: [number, number]; gap: [number, number]; twigFrom: number; twig: [number, number]; gustGap: [number, number]; gust: [number, number] };
/** Storm 4 is the original game's storm, draw for draw, so old links replay it exactly. */
export const CLASSIC_STAGE = 4;
export const STAGES: readonly StormLevel[] = [
  { name: "হালকা হাওয়া", fall: [3.0, 2.3], gap: [1.1, 0.7], twigFrom: Infinity, twig: [0, 0], gustGap: [9, 3], gust: [0.35, 0.25] },
  { name: "দমকা হাওয়া", fall: [2.8, 2.0], gap: [1.05, 0.6], twigFrom: 12, twig: [0.05, 0.1], gustGap: [8, 3], gust: [0.45, 0.35] },
  { name: "মেঘ ডাকছে", fall: [2.65, 1.75], gap: [1.0, 0.5], twigFrom: 9, twig: [0.08, 0.16], gustGap: [7, 3.5], gust: [0.5, 0.4] },
  { name: "কালবৈশাখী", fall: [2.5, 1.5], gap: [0.95, 0.42], twigFrom: 7, twig: [0.1, 0.22], gustGap: [6.5, 3.5], gust: [0.55, 0.45] },
  { name: "জোর ঝড়", fall: [2.35, 1.42], gap: [0.9, 0.4], twigFrom: 6, twig: [0.12, 0.24], gustGap: [6, 3], gust: [0.6, 0.4] },
  { name: "ডাল ভাঙছে", fall: [2.3, 1.4], gap: [0.9, 0.4], twigFrom: 5, twig: [0.16, 0.3], gustGap: [6, 3], gust: [0.6, 0.4] },
  { name: "উল্টো হাওয়া", fall: [2.2, 1.36], gap: [0.86, 0.38], twigFrom: 5, twig: [0.15, 0.27], gustGap: [5, 2.5], gust: [0.7, 0.3] },
  { name: "বোশেখের শেষ ঝড়", fall: [2.1, 1.3], gap: [0.8, 0.36], twigFrom: 4, twig: [0.18, 0.3], gustGap: [5, 2.5], gust: [0.75, 0.25] },
];
export const STAGE_COUNT = STAGES.length;
export const stageOf = (stage: number) => STAGES[Math.max(1, Math.min(STAGE_COUNT, stage)) - 1];

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;
const smooth = (u: number) => u * u * (3 - 2 * u);
/** Falling speeds up: a quarter-step of gravity on top of a steady start. */
const ease = (u: number) => 0.35 * u + 0.65 * u * u;
/** The fall progress at which every drop crosses the rim (ease(u) = rim depth). */
export const U_CATCH = (-0.35 + Math.sqrt(0.35 * 0.35 + 4 * 0.65 * (BASKET_Y - SPAWN_Y) / (GROUND_Y - SPAWN_Y))) / 1.3;
const S_CATCH = smooth(U_CATCH);

export const dropY = (u: number) => SPAWN_Y + (GROUND_Y - SPAWN_Y) * ease(clamp(u, 0, 1));
export const dropX = (drop: Drop, u: number) => drop.x0 + drop.drift * smooth(clamp(u, 0, 1));
export const progress = (drop: Drop, t: number) => (t - drop.t0) / drop.fall;

/** -1 (blowing left) to 1 (right): a soft breeze plus the seeded gusts, each a smooth swell. */
export function windAt(gusts: readonly Gust[], t: number) {
  let wind = 0.14 * Math.sin(t * 0.7);
  for (const gust of gusts) {
    const u = (t - gust.at) / gust.length;
    if (u > 0 && u < 1) wind += gust.strength * Math.sin(Math.PI * u) ** 2;
  }
  return clamp(wind, -1, 1);
}

/** Puts a drop's landing inside the courtyard and its break-off point under the canopy, and works out its catch point. */
function place(drop: Drop, xc: number) {
  drop.xc = clamp(xc, BASKET_MIN, BASKET_MAX);
  drop.x0 = drop.xc - drop.drift * S_CATCH;
  if (drop.x0 < 30 || drop.x0 > W - 30) { drop.x0 = clamp(drop.x0, 30, W - 30); drop.drift = (drop.xc - drop.x0) / S_CATCH; }
}

/** A path through every mango's catch point that never moves faster than REACH. Waypoints stop 0.7 CATCH short when they can. */
export function safePath(drops: readonly Drop[]) {
  const times = [0], xs = [W / 2];
  for (const drop of drops) {
    if (drop.kind === BRANCH) continue;
    const last = xs[xs.length - 1], gap = drop.xc - last;
    times.push(drop.tc);
    xs.push(Math.abs(gap) <= 0.7 * CATCH ? last : drop.xc - Math.sign(gap) * 0.7 * CATCH);
  }
  return { times, xs };
}

export function pathAt(path: { times: number[]; xs: number[] }, t: number) {
  const { times, xs } = path;
  if (t >= times[times.length - 1]) return xs[xs.length - 1];
  let index = 1;
  while (times[index] < t) index++;
  const span = times[index] - times[index - 1];
  return span <= 0 ? xs[index] : lerp(xs[index - 1], xs[index], (t - times[index - 1]) / span);
}

/** The whole storm from one seed: gusts, then the fall schedule, then the fairness passes. Same seed, same storm, on every phone. */
export function makeStorm(seed: number, stage = CLASSIC_STAGE): Storm {
  const rng = makeRng(seed), level = stageOf(stage);
  const gusts: Gust[] = [];
  for (let at = 6 + rng() * 3; at < DURATION - 4; at += level.gustGap[0] + rng() * level.gustGap[1])
    gusts.push({ at, length: 2.6 + rng() * 1.6, strength: (rng() < 0.5 ? -1 : 1) * (level.gust[0] + level.gust[1] * rng()) });

  const drops: Drop[] = [];
  const add = (kind: number, t0: number, x: number, fall: number) => {
    const drop: Drop = { kind, t0, x0: x, drift: windAt(gusts, t0) * 48 * fall, fall, spin: (rng() - 0.5) * 6, tc: t0 + fall * U_CATCH, xc: 0, state: FALLING };
    place(drop, x + drop.drift * S_CATCH);
    if (drop.tc < DURATION - 0.15) drops.push(drop);
  };
  for (let t = 0.9; t < DURATION;) {
    const p = t / DURATION;
    const fall = lerp(level.fall[0], level.fall[1], p) * (0.92 + 0.16 * rng());
    const kind = t > level.twigFrom && rng() < lerp(level.twig[0], level.twig[1], p) ? BRANCH : rng() < 0.32 ? RIPE : GREEN;
    add(kind, t, 50 + rng() * 260, fall);
    t += lerp(level.gap[0], level.gap[1], p ** 0.85) * (0.8 + 0.4 * rng());
  }
  // Each gust after the warm-up shakes loose a small shower of three mangoes close together.
  for (const gust of gusts) {
    const at = gust.at + gust.length * 0.45, x = 70 + rng() * 220, fall = lerp(level.fall[0] - 0.2, level.fall[1] + 0.1, at / DURATION);
    for (let index = 0; index < 3; index++) add(rng() < 0.5 ? RIPE : GREEN, at + index * 0.22, x + (rng() - 0.5) * 50, fall);
  }
  drops.sort((a, b) => a.tc - b.tc);

  // Fairness 1: pull any mango a tapping thumb couldn't reach in time toward the last one.
  let lastT = 0, lastX = W / 2;
  for (const drop of drops) {
    if (drop.kind === BRANCH) continue;
    const allow = REACH * (drop.tc - lastT) + 0.7 * CATCH, gap = drop.xc - lastX;
    if (Math.abs(gap) > allow) place(drop, lastX + Math.sign(gap) * allow);
    const waypoint = Math.abs(drop.xc - lastX) <= 0.7 * CATCH ? lastX : drop.xc - Math.sign(drop.xc - lastX) * 0.7 * CATCH;
    lastT = drop.tc; lastX = waypoint;
  }
  // Fairness 2: a branch never lands on the safe path or right beside a mango falling at the same moment; mirror it or drop it.
  const path = safePath(drops);
  const clear = (branch: Drop) => Math.abs(pathAt(path, branch.tc) - branch.xc) >= CATCH + 10
    && drops.every(other => other.kind === BRANCH || Math.abs(other.tc - branch.tc) >= 0.35 || Math.abs(other.xc - branch.xc) >= 2 * CATCH);
  const kept = drops.filter(drop => {
    if (drop.kind !== BRANCH || clear(drop)) return true;
    place(drop, W - drop.xc);
    return clear(drop);
  });
  return { seed, stage, drops: kept, gusts };
}

/** Mangoes for 3 and 2 stars in this storm (70% and 45% of the mangoes that fall). Surviving the storm is 1 star. */
export function starTargets(storm: Storm) {
  const mangoes = storm.drops.filter(drop => drop.kind !== BRANCH).length;
  return { three: Math.ceil(mangoes * 0.7), two: Math.ceil(mangoes * 0.45), mangoes };
}
/** 0 when three twigs ended the game before the storm passed. */
export const stormStars = (storm: Storm, caught: number, survived: boolean) => {
  if (!survived) return 0;
  const { three, two } = starTargets(storm);
  return starsFor(caught, three, two);
};

/** Lightning comes only with the strongest gusts, one soft glow each: never more than once in several seconds. */
export const lightningTimes = (storm: Storm) => storm.gusts.filter(gust => Math.abs(gust.strength) > 0.78).map(gust => gust.at + 0.4);

export type GameEvent = { kind: number; x: number; t: number; caught: boolean; streak: number };
export type Game = {
  storm: Storm; t: number; basket: number; score: number; caught: number; ripe: number; lives: number;
  /** Mangoes caught in a row (a missed mango or a twig in the ডালা breaks it), and the longest run this storm. */
  streak: number; bestStreak: number;
  /** 0 playing, 1 the storm passed (time), 2 three branches in the ডালা. */
  over: 0 | 1 | 2;
  next: number; events: GameEvent[]; eventCount: number;
};

export function createGame(seed: number, lives = LIVES, stage = CLASSIC_STAGE): Game {
  return {
    storm: makeStorm(seed, stage), t: 0, basket: W / 2, score: 0, caught: 0, ripe: 0, lives, streak: 0, bestStreak: 0, over: 0, next: 0, eventCount: 0,
    events: Array.from({ length: 8 }, () => ({ kind: 0, x: 0, t: 0, caught: false, streak: 0 })),
  };
}

export const inBasket = (x: number, basket: number) => Math.abs(x - basket) <= CATCH;

/**
 * Advances the storm by `dt` seconds. The ডালা moves toward `target`, at most `moveBy` units this step.
 * Each drop is settled once, at the step its centre crosses the rim. Mutates `game` (no allocation: it runs 60 times a second).
 */
export function stepGame(game: Game, dt: number, target: number, moveBy: number) {
  if (game.over) return;
  const goal = clamp(target, BASKET_MIN, BASKET_MAX);
  game.basket += clamp(goal - game.basket, -moveBy, moveBy);
  game.t = Math.min(DURATION, game.t + dt);
  const drops = game.storm.drops;
  while (game.next < drops.length && drops[game.next].tc <= game.t) {
    const drop = drops[game.next++];
    const caught = inBasket(drop.xc, game.basket);
    if (drop.kind === BRANCH) {
      drop.state = caught ? HIT : MISSED;
      if (caught) { game.lives--; game.streak = 0; }
    } else if (caught) {
      drop.state = CAUGHT;
      game.score += POINTS[drop.kind];
      game.caught++;
      if (drop.kind === RIPE) game.ripe++;
      game.bestStreak = Math.max(game.bestStreak, ++game.streak);
    } else { drop.state = MISSED; game.streak = 0; }
    const event = game.events[game.eventCount++ % game.events.length];
    event.kind = drop.kind; event.x = drop.xc; event.t = drop.tc; event.caught = caught; event.streak = game.streak;
    if (game.lives <= 0) { game.over = 2; return; }
  }
  if (game.t >= DURATION) game.over = 1;
}

const numbers = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => numbers.format(value);

export const bands = [
  { min: 0, line: "ঝড়টা আজ একটু বেশিই জোরে ছিল। আরেকবার ডালা ধরো!" },
  { min: 80, line: "হাত গরম হচ্ছে। পরের ঝড়ে ডালা আরও ভরবে।" },
  { min: 180, line: "মাথা বাঁচিয়ে আম কুড়ানো চাট্টিখানি কথা না!" },
  { min: 300, line: "এত আম! নানির আচারের বয়াম এবার ভরে যাবে।" },
  { min: 400, line: "ঝড় থামার আগেই গাছ খালি। পাড়ার আম-কুড়ানি বলতে এখন তুমি।" },
] as const;
export const humanLine = (score: number) => [...bands].reverse().find(band => score >= band.min)!.line;

/** What a challenge link carries: the storm (seed and stage), the score, how many mangoes, an optional first name. Old links have no stage: storm 4. */
export type Shared = { seed: number; score: number; count: number; name: string; stage?: number };
export const MAX_SCORE = 2000;

/** Ripe mangoes in a result (5 a green, 10 a ripe), or -1 when the numbers can't add up. */
export const ripeOf = (score: number, count: number) => {
  const ripe = (score - 5 * count) / 5;
  return Number.isInteger(ripe) && ripe >= 0 && ripe <= count ? ripe : -1;
};

/** Reads a challenge #hash and checks it against that seed's real storm: no more mangoes than fell, no impossible mix. */
export function parseShareHash(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_SCORE, extraKeys: ["a", "l"] });
  const count = challenge && /^\d{1,3}$/.test(challenge.extra.a ?? "") ? Number(challenge.extra.a) : -1;
  const stage = Number(challenge?.extra.l ?? CLASSIC_STAGE);
  if (!challenge || count < 0 || !/^\d$/.test(String(challenge.extra.l ?? CLASSIC_STAGE)) || stage < 1 || stage > STAGE_COUNT) return null;
  const ripe = ripeOf(challenge.target, count);
  if (ripe < 0) return null;
  const { drops } = makeStorm(challenge.seed, stage);
  const ripes = drops.filter(drop => drop.kind === RIPE).length, greens = drops.filter(drop => drop.kind === GREEN).length;
  if (ripe > ripes || count - ripe > greens) return null;
  return stage === CLASSIC_STAGE ? { seed: challenge.seed, score: challenge.target, count, name: challenge.name } : { seed: challenge.seed, score: challenge.target, count, name: challenge.name, stage };
}

export const shareHash = (shared: Shared) => challengeHash({
  seed: shared.seed, target: shared.score, name: shared.name,
  extra: { a: shared.count, ...(shared.stage && shared.stage !== CLASSIC_STAGE ? { l: shared.stage } : {}) },
});

/** "ঝড় ৬-এ" for a storm other than the original one, or "" for the original. */
const inStage = (stage?: number) => stage && stage !== CLASSIC_STAGE ? `ঝড় ${bn(stage)}-এ` : "";
export const previewTitle = (shared: Shared) => {
  const where = inStage(shared.stage);
  if (shared.name) return `${shared.name} ${where || "ঝড়ের মধ্যে"} ${bn(shared.count)}টা আম কুড়িয়েছে, ${bn(shared.score)} পয়েন্ট। তুমি পারবে?`;
  return `${where ? `কালবৈশাখী আমের ${where}` : "কালবৈশাখীর ঝড়ে"} ${bn(shared.count)}টা আম, ${bn(shared.score)} পয়েন্ট। তুমি পারবে?`;
};

export const caption = (shared: Shared) => `${inStage(shared.stage) ? `কালবৈশাখী আমের ${inStage(shared.stage)}` : "কালবৈশাখীর ঝড়ে"} ${bn(shared.count)}টা আম কুড়ালাম, ${bn(shared.score)} পয়েন্ট! একই ঝড়ে তুমি কয়টা পারো?`;

/** What one more try would change, with the exact number; "" when there's nothing close to chase. */
export function nearMiss({ stage, stars, caught, t, three, two, score, best }: { stage: number; stars: number; caught: number; t: number; three: number; two: number; score: number; best: number | null }) {
  if (!stars) return `আর ${bn(Math.max(1, Math.ceil(DURATION - t)))} সেকেন্ড টিকলেই ঝড় ${bn(stage)} পার।`;
  if (stars < 3) {
    const need = (stars === 1 ? two : three) - caught;
    if (need <= 8) return `আর ${bn(need)}টা আম হলেই ${bn(stars + 1)} তারা।`;
  }
  if (best !== null && score < best && best - score <= Math.max(40, best * 0.15)) return `আর ${bn(best - score)} পয়েন্ট হলেই নতুন সেরা।`;
  return "";
}

/** Mangoes gathered on this phone across every storm, and the badges on the way. */
export const MILESTONES = [50, 100, 250, 500, 1000, 2500, 5000] as const;
export const milestoneOf = (total: number) => [...MILESTONES].reverse().find(mark => total >= mark) ?? 0;
export const nextMilestone = (total: number) => MILESTONES.find(mark => total < mark) ?? 0;

/**
 * Old phones kept only a best score from the original storm, which is storm 4 now. Run once, before the level store is first read:
 * that storm counts as cleared with 1 star (the best score can't tell more), which opens storms 1–5. Returns the new store, or null for nothing to do.
 */
export function migrateLevels(levelsRaw: string | null, bestRaw: string | null) {
  if (levelsRaw !== null || bestRaw === null) return null;
  const best = Number(bestRaw);
  if (!Number.isFinite(best) || best <= 0) return null;
  return JSON.stringify(readLevels(JSON.stringify({ [CLASSIC_STAGE]: 1 }), STAGE_COUNT));
}

/** After a friend's link: kind, exact, never a scold. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = name || "বন্ধু", whose = name ? possessive(name) : "বন্ধুর";
  if (mine > theirs) return `${whose} চেয়ে ${bn(mine - theirs)} পয়েন্ট বেশি!`;
  if (mine === theirs) return `${who} আর তুমি একদম সমান সমান!`;
  if (theirs - mine <= Math.max(15, theirs * 0.15)) return `আর একটু হলেই! ${whose} চেয়ে মাত্র ${bn(theirs - mine)} কম।`;
  return `${who} এবার ${bn(theirs - mine)} পয়েন্ট এগিয়ে। একই ঝড়ে আরেকবার?`;
}

export { cleanName };

// The paddy field's rules as plain functions: a seeded landing schedule, nibbling, shooing, scoring and the share link.
// No DOM here, so the same afternoon can be replayed and tested headless.
import { challengeHash, cleanName, makeRng, readChallenge, starsFor, type LevelStars } from "../../../shared/game-core";
import { possessive } from "../../../shared/bangla";

/** The play field in logical units; the canvas scales it to the phone. */
export const W = 360, H = 450;
export const DURATION = 45;
/** The field starts full: every nibble takes 1%, so the meter reads as plain percent. */
export const GRAIN = 100;
/** A sparrow takes this long to fly in; past TAPPABLE of the way, a tap at its landing spot counts. */
export const FLY = 0.8, TAPPABLE = 0.5;
/** The first nibble comes a moment after touchdown, then one every 1.5 seconds until it's shooed. */
export const FIRST_NIBBLE = 0.6, NIBBLE_EVERY = 1.5;
/** Forgiving tap radius: 38 units is 61 CSS px across even on a 320 px phone. */
export const HIT_R = 38;
/** Where sparrows may land: on the paddy, below the meter, clear of the কাকতাড়ুয়া. */
export const FIELD = { left: 34, right: 326, top: 232, bottom: 414 };
export const SCARECROW = { x: 296, base: 404, height: 178, clear: 54 };
/** Sparrows landing within TOGETHER seconds of each other sit at least MIN_GAP apart, so every tap has one clear target. */
const MIN_GAP = 66, TOGETHER = 1.2, LOOKBACK = 3.5, SPREAD = 110;
export const LAST_LANDING = 43;

export const WAITING = 0, FLYING = 1, SITTING = 2, SHOOED = 3;

/**
 * Ten fields, each one step harder than the last: more sparrows (`gap` shortens the wait between flocks), flocks sooner (`ramp`),
 * quicker beaks (`every`, seconds per nibble) and quicker landings (`fly`). Level 1 is the original afternoon, so old links replay unchanged.
 * `pass` is the grain (%) to clear the field (1 star); `two` and `three` are the marks for 2 and 3 stars.
 */
export const LEVELS = [
  { name: "উঠানের পাশে", note: "প্রথমে একটা একটা, পরে জোড়ায়।", gap: 1, ramp: 1, every: NIBBLE_EVERY, fly: FLY, pass: 30, two: 75, three: 90 },
  { name: "পুকুরপাড়", note: "চড়ুই একটু বেশি।", gap: 0.92, ramp: 1, every: NIBBLE_EVERY, fly: FLY, pass: 35, two: 75, three: 90 },
  { name: "বাঁশঝাড়ের ধার", note: "জোড়ায় জোড়ায় আসে আগেভাগে।", gap: 0.92, ramp: 1.3, every: NIBBLE_EVERY, fly: FLY, pass: 40, two: 70, three: 87 },
  { name: "নদীর ধার", note: "ঠোকর পড়ে আরও ঘন ঘন।", gap: 0.92, ramp: 1.3, every: 1.3, fly: FLY, pass: 40, two: 68, three: 86 },
  { name: "বটতলা", note: "চড়ুই নামে আরও তাড়াতাড়ি।", gap: 0.92, ramp: 1.3, every: 1.3, fly: 0.7, pass: 40, two: 68, three: 87 },
  { name: "খালপাড়", note: "চড়ুই আরও বেশি।", gap: 0.85, ramp: 1.3, every: 1.3, fly: 0.7, pass: 40, two: 64, three: 85 },
  { name: "হাটের পথে", note: "দল বেঁধে আসে আগেভাগে।", gap: 0.85, ramp: 1.6, every: 1.3, fly: 0.7, pass: 40, two: 62, three: 84 },
  { name: "চরের ক্ষেত", note: "ঠোকর আরও দ্রুত।", gap: 0.85, ramp: 1.6, every: 1.15, fly: 0.7, pass: 40, two: 60, three: 83 },
  { name: "মাঠের মাঝখান", note: "নামে চোখের পলকে, সংখ্যায়ও বেশি।", gap: 0.8, ramp: 1.6, every: 1.15, fly: 0.62, pass: 35, two: 50, three: 80 },
  { name: "মোড়লের ক্ষেত", note: "বড় ক্ষেত, চড়ুইয়ের মেলা।", gap: 0.75, ramp: 2, every: 1.05, fly: 0.62, pass: 30, two: 45, three: 76 },
] as const;
export const LEVEL_COUNT = LEVELS.length;
const levelOf = (level: number) => LEVELS[Math.min(LEVEL_COUNT, Math.max(1, level)) - 1];

/** Stars for the grain saved on a level: 0 below its pass mark. */
export function starsOf(saved: number, level: number) {
  const { pass, two, three } = levelOf(level);
  return saved < pass ? 0 : starsFor(saved, three, two);
}
/** The next mark above `saved` (pass, 2 or 3 stars), or null at 3 stars. */
export function nextMark(saved: number, level: number) {
  const { pass, two, three } = levelOf(level);
  return [pass, two, three].find(mark => saved < mark) ?? null;
}
/** Before levels this phone kept only a best % for the one field there was (now level 1). Its stars, or 0 when there is nothing to move. */
export function migrateBest(stars: LevelStars, oldBest: string | null) {
  const saved = Number(oldBest);
  if (Object.keys(stars).length || oldBest === null || oldBest === "" || !Number.isInteger(saved) || saved < 0 || saved > GRAIN) return 0;
  return starsOf(saved, 1);
}

export type Bird = {
  /** When it sets off, when it touches down, where (its body's centre) and the side it flies in from. */
  t0: number; land: number; x: number; y: number; side: -1 | 1; skyY: number;
  state: number; ate: number; lastPeck: number; shooAt: number; flee: -1 | 1;
  /** This field's flight time and seconds between nibbles. */
  fly: number; every: number;
};
export type Game = { seed: number; level: number; birds: Bird[]; t: number; grain: number; shooed: number; over: 0 | 1 | 2 };

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const nearScarecrow = (x: number, y: number) => Math.abs(x - SCARECROW.x) < SCARECROW.clear && y > SCARECROW.base - SCARECROW.height - 20;

/** How many sparrows come together: singles first, then pairs, then small groups. */
export const groupSize = (t: number, roll: number) => t < 9 ? 1 : t < 20 ? 2 : t < 31 ? 3 : roll < 0.5 ? 3 : 4;

/** The whole afternoon from one seed and field. Same seed, same sparrows at the same spots, on every phone. */
export function makeSchedule(seed: number, level = 1): Bird[] {
  const rng = makeRng(seed);
  const { gap, ramp, every, fly } = levelOf(level);
  const birds: Bird[] = [];
  const add = (land: number, x: number, y: number, side: -1 | 1) =>
    birds.push({ t0: land - fly, land, x, y, side, skyY: 50 + rng() * 80, state: WAITING, ate: 0, lastPeck: -9, shooAt: -9, flee: side === -1 ? 1 : -1, fly, every });
  // Rejection sampling: sparrows arriving within a second or so must sit MIN_GAP apart; among the spots that do, the one farthest from
  // everything that landed lately wins, so a crowded moment still spreads out.
  const place = (land: number) => {
    let bestX = W / 2, bestY = (FIELD.top + FIELD.bottom) / 2, bestScore = -1;
    for (let tries = 0; tries < 40 && bestScore < 1000 + SPREAD; tries++) {
      const x = FIELD.left + rng() * (FIELD.right - FIELD.left), y = FIELD.top + rng() * (FIELD.bottom - FIELD.top);
      if (nearScarecrow(x, y)) continue;
      let near = 999, recent = 999;
      for (const other of birds) {
        const gap = Math.hypot(other.x - x, other.y - y), ago = land - other.land;
        if (ago < TOGETHER) near = Math.min(near, gap);
        if (ago < LOOKBACK) recent = Math.min(recent, gap);
      }
      const score = near >= MIN_GAP ? 1000 + Math.min(recent, SPREAD) : near;
      if (score > bestScore) { bestX = x; bestY = y; bestScore = score; }
    }
    return [bestX, bestY] as const;
  };
  // The first sparrow is already landing when the page opens: upper middle, clear of the start button.
  add(0, 120 + rng() * 90, FIELD.top + 18 + rng() * 22, rng() < 0.5 ? -1 : 1);
  for (let t = 1.9 + rng() * 0.4; t < LAST_LANDING;) {
    // Level 1's multipliers are all 1, so its draws match the original afternoon exactly.
    const size = groupSize(t * ramp, rng()), side: -1 | 1 = rng() < 0.5 ? -1 : 1;
    for (let index = 0, at = t; index < size && at < LAST_LANDING; index++, at += 0.1 + rng() * 0.12) {
      const [x, y] = place(at);
      add(at, x, y, side);
    }
    t += (size === 1 ? 1.7 + rng() * 0.6 : size === 2 ? 2.5 + rng() * 0.6 : 2.7 + rng() * 0.6) * gap;
  }
  return birds;
}

/** A new afternoon. The clock starts at minus one flight: the first sparrow flies in on the ready screen and lands at 0. */
export const createGame = (seed: number, level = 1): Game => ({ seed, level, birds: makeSchedule(seed, level), t: -levelOf(level).fly, grain: GRAIN, shooed: 0, over: 0 });

/** How far along its flight in a sparrow is, 0 to 1. */
export const flight = (bird: Bird, t: number) => clamp((t - bird.t0) / bird.fly, 0, 1);
export const nextNibbleAt = (bird: Bird) => bird.land + FIRST_NIBBLE + bird.ate * bird.every;

/** Nibbles a sparrow that's never shooed takes by time `t` (the same arithmetic stepGame uses). */
export function nibblesBy(bird: Bird, t: number) {
  let count = 0;
  while (t >= bird.land + FIRST_NIBBLE + count * bird.every) count++;
  return count;
}

/** Advances the clock by `dt` game seconds: sparrows set off, land and nibble. Mutates `game`, allocates nothing. */
export function stepGame(game: Game, dt: number) {
  if (game.over) return;
  game.t = Math.min(DURATION, game.t + dt);
  const { birds, t } = game;
  for (let index = 0; index < birds.length; index++) {
    const bird = birds[index];
    if (bird.state === WAITING && t >= bird.t0) bird.state = FLYING;
    if (bird.state === FLYING && t >= bird.land) bird.state = SITTING;
    while (bird.state === SITTING && game.grain > 0 && t >= nextNibbleAt(bird)) {
      bird.lastPeck = nextNibbleAt(bird);
      bird.ate++;
      game.grain--;
    }
  }
  if (game.grain <= 0) game.over = 2;
  else if (t >= DURATION) game.over = 1;
}

/** Can a tap shoo this sparrow now? Sitting, or close enough to landing that its shadow marks the spot. */
export const tappable = (bird: Bird, t: number) => bird.state === SITTING || (bird.state === FLYING && flight(bird, t) >= TAPPABLE);

/** The nearest sparrow a tap at (x, y) reaches, or -1. */
export function birdAt(game: Game, x: number, y: number) {
  let found = -1, nearest = HIT_R * HIT_R;
  for (let index = 0; index < game.birds.length; index++) {
    const bird = game.birds[index];
    if (!tappable(bird, game.t)) continue;
    const distance = (bird.x - x) ** 2 + (bird.y - y) ** 2;
    if (distance <= nearest) { nearest = distance; found = index; }
  }
  return found;
}

/** A clap at (x, y): the nearest sparrow in reach hops off, away from the hand. Returns its index, or -1 for a clap at empty paddy. */
export function shoo(game: Game, x: number, y: number) {
  if (game.over) return -1;
  const index = birdAt(game, x, y);
  if (index < 0) return -1;
  const bird = game.birds[index];
  bird.state = SHOOED;
  bird.shooAt = game.t;
  bird.flee = bird.x >= x ? 1 : -1;
  game.shooed++;
  return index;
}

/**
 * Keyboard play: from the hand at (x, y), the nearest sparrow a tap could shoo in direction (dx, dy), or -1.
 * Ahead counts, sideways drift costs double, so the hand hops to the sparrow the arrow points at.
 */
export function nextBird(game: Game, x: number, y: number, dx: number, dy: number) {
  let found = -1, best = Infinity;
  for (let index = 0; index < game.birds.length; index++) {
    const bird = game.birds[index];
    if (!tappable(bird, game.t)) continue;
    const vx = bird.x - x, vy = bird.y - y, ahead = vx * dx + vy * dy;
    if (ahead <= 4) continue;
    const cost = ahead + 2 * Math.abs(vx * dy - vy * dx);
    if (cost < best) { best = cost; found = index; }
  }
  return found;
}

const numbers = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => numbers.format(value);

export const bands = [
  { min: 0, line: "আজ চড়ুইদের দাওয়াত ছিল মনে হয়! কাল আবার পাহারা দিয়ো।" },
  { min: 40, line: "হাত চলছে! পরের বিকেলে আরও বেশি বাঁচবে।" },
  { min: 70, line: "ভালো পাহারা! গোলায় ধান উঠবে ভালোই।" },
  { min: 85, line: "এমন পাহারাদার থাকলে কাকতাড়ুয়ার ছুটি!" },
  { min: 95, line: "চড়ুইরা প্রায় খালি পেটে ফিরল!" },
  { min: 100, line: "একটা দানাও নিতে পারেনি! পুরো ধান গোলায় উঠবে।" },
] as const;
export const humanLine = (saved: number) => [...bands].reverse().find(band => saved >= band.min)!.line;

/** The near miss with the exact gap: to clearing the field, to the next star, or (at 3 stars) to this phone's best on it. */
export function nearLine(saved: number, level: number, best: number | null) {
  const mark = nextMark(saved, level), stars = starsOf(saved, level);
  if (mark !== null) return `আর ${bn(mark - saved)}% ধান বাঁচলেই ${stars ? `${bn(stars + 1)} তারা` : "এই ক্ষেত পার"}।`;
  if (best !== null && saved <= best && best < GRAIN) return `আর ${bn(best - saved + 1)}% হলেই এই ক্ষেতে নতুন সেরা।`;
  return "";
}

/** What a challenge link carries: the afternoon, the grain saved (%), the sparrows shooed, an optional first name, the field (level). */
export type Shared = { seed: number; saved: number; shooed: number; name: string; level: number };

/**
 * The most grain a run that shooed `shooed` sparrows could keep. The rest sat till dusk; at best they were the last to land.
 * A real-time score can't be verified, but this refuses links the afternoon can't produce.
 */
export function maxSaved(birds: readonly Bird[], shooed: number) {
  let eaten = 0;
  for (let index = shooed; index < birds.length; index++) eaten += nibblesBy(birds[index], DURATION);
  return Math.max(0, GRAIN - eaten);
}

/** `s` seed, `t` grain %, `c` sparrows shooed, `l` the field (links from before levels have none and open field 1), `n` name. */
export function parseShareHash(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: GRAIN, extraKeys: ["c", "l"] });
  const shooed = challenge && /^\d{1,2}$/.test(challenge.extra.c ?? "") ? Number(challenge.extra.c) : -1;
  if (!challenge || shooed < 0) return null;
  const rawLevel = challenge.extra.l ?? "1", level = Number(rawLevel);
  if (!/^[1-9]\d?$/.test(rawLevel) || level > LEVEL_COUNT) return null;
  const birds = makeSchedule(challenge.seed, level);
  if (shooed > birds.length || challenge.target > maxSaved(birds, shooed)) return null;
  return { seed: challenge.seed, saved: challenge.target, shooed, name: challenge.name, level };
}

export const shareHash = (shared: Shared) => challengeHash({ seed: shared.seed, target: shared.saved, name: shared.name, extra: { c: shared.shooed, ...(shared.level > 1 && { l: shared.level }) } });

export const previewTitle = (shared: Shared) => shared.name
  ? `${shared.name} চড়ুই তাড়িয়ে ${bn(shared.saved)}% ধান বাঁচিয়েছে। তুমি পারবে?`
  : `চড়ুই তাড়িয়ে ${bn(shared.saved)}% ধান বাঁচল। তুমি পারবে?`;

export const caption = (shared: Shared) => `চড়ুই তাড়িয়ে ${bn(shared.saved)}% ধান বাঁচালাম, ${bn(shared.shooed)}টা চড়ুই হুশ! একই ক্ষেতে তুমি কত বাঁচাবে?`;

/** After a friend's link: grain first, sparrows break a tie. Kind and exact, never a scold. */
export function compareLine(mine: Pick<Shared, "saved" | "shooed">, theirs: Pick<Shared, "saved" | "shooed">, name: string) {
  const who = name || "বন্ধু", whose = name ? possessive(name) : "বন্ধুর";
  const gap = mine.saved - theirs.saved;
  if (gap > 0) return `${whose} চেয়ে ${bn(gap)}% বেশি ধান বাঁচালে!`;
  if (gap === 0) {
    const birds = mine.shooed - theirs.shooed;
    if (birds > 0) return `ধান সমান সমান, তবে ${whose} চেয়ে ${bn(birds)}টা চড়ুই বেশি তাড়ালে!`;
    if (birds < 0) return `ধান সমান সমান, ${who} শুধু ${bn(-birds)}টা চড়ুই বেশি তাড়িয়েছে।`;
    return `${who} আর তুমি একদম সমান সমান!`;
  }
  if (-gap <= 5) return `আর একটু হলেই! ${whose} চেয়ে মাত্র ${bn(-gap)}% কম।`;
  return `${who} এবার ${bn(-gap)}% এগিয়ে। একই ক্ষেতে আরেকবার?`;
}

export { cleanName };

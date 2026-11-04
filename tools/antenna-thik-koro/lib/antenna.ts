// Rules for অ্যান্টেনা ঠিক করো: where each channel's signal hides, how clear the picture is at an angle, what the person
// downstairs shouts, and the lines around a result. Pure and seeded (makeRng only); the per-step code is step.hot.ts.
import { possessive } from "../../../shared/bangla";
import { makeRng, pick } from "../../../shared/game-core";
import { levelDef, MODE_INFO, PICTURES, type LevelDef, type Mode, type PictureId } from "./levels";
import { bn, seconds, type Shared } from "./link";

export { bn, DWELL, MAX_TENTHS, MIN_TENTHS, parseShared, previewTitle, seconds, sharedHash, channelsOf, type Shared } from "./link";
export * from "./levels";

export const SLUG = "antenna-thik-koro";
/** Half-width of each channel's sweet spot, in degrees: wide for the first, narrower every channel after. */
export const HALF_WIDTHS = [14, 11, 9, 7, 6] as const;
/** Seconds of "ছবি এসেছে!" between channels; the clock doesn't run then. */
export const CELEBRATE = 1.3;
/** Degrees outside the sweet spot over which the snow thins; beyond this the screen is pure snow. */
export const REACH = 110;
export const DECOY_SPAN = 32;
export const DECOY_PEAK = 0.4;
/** Normal mode's assist; the mode table has the others. */
export const ASSIST_AFTER = 15;
/** A quiet level's helper comes back after this long on one channel. */
export const QUIET_ASSIST = 20;
/** Radians a second of the wind's sway (one full sway about every 8 s). */
export const WIND_SPEED = 0.8;
/** A gust: warned this long before, then shoves for GUST_PUSH seconds. */
export const GUST_WARN = 0.9;
export const GUST_PUSH = 0.4;
/** The loose pole's spring (stiffness, damping): the antenna overshoots a little and settles in about a second. */
export const WOBBLE_K = 38;
export const WOBBLE_C = 9;
/** A finale's meter drains at this fraction of its fill speed while you're off the signal. */
export const DRAIN = 0.5;
/** The half-width of a finale's programme, before the level's and mode's scale. */
export const FINALE_HALF = 9;

/** Generic programme kinds, never a real channel or programme name. */
export const SHOWS: Record<PictureId, string> = { cricket: "ক্রিকেট খেলা", natok: "নাটক", gaan: "গানের অনুষ্ঠান", nodi: "নদীর ছবি", kartun: "কার্টুন", ranna: "রান্নার অনুষ্ঠান" };

/** `wind`, when set, sways the signal around `home`; stepGame moves `sweet` while you search. */
export type Round = { sweet: number; half: number; decoy: number | null; decoy2?: number | null; picture: PictureId; wind?: { home: number; amp: number; phase: number } };

export const wrap = (angle: number) => ((angle % 360) + 360) % 360;
/** Signed shortest turn from `from` to `to`, in [-180, 180): positive means turn right (clockwise). */
export const angDiff = (to: number, from: number) => wrap(to - from + 180) - 180;

/**
 * The seed fixes the channels' order, where each signal hides, and the ghosts. The first stream is exactly the old game's,
 * so an old table level gives the old channels; anything new (a second ghost, the finale picture) draws from a second stream.
 */
export function makeRounds(seed: number, def: LevelDef = levelDef(1, true), mode: Mode = "n"): Round[] {
  const rng = makeRng(seed), extra = makeRng(seed ^ 0x5bd1e995), info = MODE_INFO[mode];
  const order: PictureId[] = [...PICTURES];
  for (let index = order.length - 1; index > 0; index--) {
    const swap = pick(rng, index + 1);
    [order[index], order[swap]] = [order[swap], order[index]];
  }
  const last = def.channels - 1;
  if (def.finale) {
    const at = order.indexOf(def.finale.picture);
    [order[at], order[last]] = [order[last], order[at]];
  }
  let from = 0;
  return HALF_WIDTHS.slice(0, def.channels).map((half, index) => {
    // Never right where the antenna already points: 60°–110° away for the first channel, 75°–165° after.
    const away = index === 0 ? 60 + pick(rng, 51) : 75 + pick(rng, 91);
    const sweet = wrap(from + (rng() < 0.5 ? -away : away));
    // A ghost sits 100°–160° from the real signal, so the two never blur together; a second one on the other side.
    const side = index < def.ghostFrom ? 0 : rng() < 0.5 ? -1 : 1;
    const decoy = side === 0 ? null : wrap(sweet + side * (100 + pick(rng, 61)));
    from = sweet;
    // A finale's programme is a medium-wide spot that needs a long hold, not a pinhole.
    const width = def.finale && index === last ? FINALE_HALF : half;
    const round: Round = { sweet, half: width * def.scale * info.half, decoy, picture: order[index] };
    // The finale's programme sways less: the challenge there is the long hold, not chasing it.
    if (def.wind) round.wind = { home: sweet, amp: def.wind * info.wind * (def.finale && index === last ? 0.6 : 1), phase: rng() * Math.PI * 2 };
    if (def.ghosts === 2 && decoy !== null) round.decoy2 = wrap(sweet - side * (100 + pick(extra, 41)));
    return round;
  });
}

const ghostLight = (decoy: number | null | undefined, angle: number) => {
  if (decoy === null || decoy === undefined) return 0;
  const ghost = Math.abs(angDiff(decoy, angle));
  return ghost < DECOY_SPAN ? DECOY_PEAK * (1 - ghost / DECOY_SPAN) ** 2 : 0;
};
/** How clear the picture is at this angle, 0 (all snow) to 1 (locked). A ghost never gets past 0.4. */
export function signal(round: Round, angle: number) {
  const d = Math.abs(angDiff(round.sweet, angle));
  const main = d <= round.half ? 1 : 0.85 * Math.max(0, 1 - (d - round.half) / REACH) ** 2;
  return Math.max(main, ghostLight(round.decoy, angle), ghostLight(round.decoy2, angle));
}
const near = (decoy: number | null | undefined, angle: number) => decoy !== null && decoy !== undefined && Math.abs(angDiff(decoy, angle)) < DECOY_SPAN;
export const nearGhost = (round: Round, angle: number) => near(round.decoy, angle) || near(round.decoy2, angle);

export type Hint = "start" | "next" | "nothing" | "idle" | "fuzzy" | "warmer" | "colder" | "ghost" | "right" | "left" | "far-right" | "far-left" | "hold" | "slip-right" | "slip-left" | "got" | "done" | "quiet";
export type Phase = "ready" | "search" | "got" | "over";
export const HINTS: readonly Hint[] = ["start", "next", "nothing", "idle", "fuzzy", "warmer", "colder", "ghost", "right", "left", "far-right", "far-left", "hold", "slip-right", "slip-left", "got", "done", "quiet"];

export type Game = {
  seed: number;
  level: number;
  mode: Mode;
  old: boolean;
  def: LevelDef;
  rounds: Round[];
  index: number;
  /** Where the dial points (your hand). */
  dial: number;
  /** Where the antenna points: the dial, or on a loose pole a spring behind it. */
  angle: number;
  /** Degrees a second, the loose pole only. */
  spin: number;
  phase: Phase;
  /** Seconds on the clock (searching only). */
  time: number;
  roundTime: number;
  dwell: number;
  /** Seconds the picture needs to lock on this channel (a finale's meter is longer). */
  need: number;
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
  /** 1 while you hold the picture and it's close to slipping out (the amber edge). */
  edge: number;
  /** Seconds until the next gust warning, the warning left, its side (-1 left, 1 right), and the shove left in degrees. */
  gustIn: number;
  gustWarn: number;
  gustSide: number;
  gustLeft: number;
  gustRate: number;
  /** Seconds per channel, filled as each locks. */
  splits: Float64Array;
  slips: number;
  gusts: number;
  rng: () => number;
};

export function createGame(seed: number, level = 1, mode: Mode = "n", old = false): Game {
  const def = levelDef(level, old), rounds = makeRounds(seed, def, mode), rng = makeRng(seed ^ 0x2545f491);
  return {
    seed, level, mode, old, def, rounds, index: 0, dial: 0, angle: 0, spin: 0, phase: "ready", time: 0, roundTime: 0, dwell: 0,
    need: needFor(def, 0, mode), celebrate: 0, hint: "start", hintAge: 0, hintTick: 0, approach: 0, lastDist: Math.abs(angDiff(rounds[0].sweet, 0)),
    still: 0, held: false, edge: 0, gustIn: 1.5 + rng() * 2, gustWarn: 0, gustSide: 1, gustLeft: 0, gustRate: 0,
    splits: new Float64Array(def.channels), slips: 0, gusts: 0, rng,
  };
}
export const isFinaleChannel = (def: LevelDef, index: number) => def.finale !== null && index === def.channels - 1;
export const needFor = (def: LevelDef, index: number, mode: Mode) =>
  isFinaleChannel(def, index) ? def.finale!.hold * MODE_INFO[mode].hold : MODE_INFO[mode].dwell;

/** What the person downstairs can tell from the picture alone: near the signal they know which way, far off only "worse" or "better". */
export function chooseHint(round: Round, angle: number, roundTime: number, approach: number, still: number, assist = ASSIST_AFTER, quiet = false): Hint {
  const toward = angDiff(round.sweet, angle);
  if (quiet) return roundTime >= QUIET_ASSIST ? (toward > 0 ? "far-right" : "far-left") : "quiet";
  const d = Math.abs(toward);
  if (d <= round.half * 3 + 10) return toward > 0 ? "right" : "left";
  if (nearGhost(round, angle)) return "ghost";
  if (roundTime >= assist) return toward > 0 ? "far-right" : "far-left";
  if (still >= 2.5) return "idle";
  if (d <= 75) return approach > 0.3 ? "warmer" : approach < -0.3 ? "colder" : "fuzzy";
  return "nothing";
}

export const tenthsOf = (time: number) => Math.min(6000, Math.max(23, Math.round(time * 10)));
export const channelName = (index: number) => `চ্যানেল ${bn(index + 1)}`;

const SHOUTS: Record<Exclude<Hint, "next" | "quiet">, string> = {
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
/** The shout from downstairs, for the speech bubble; "" means nobody is talking (a quiet level). */
export function shout(hint: Hint, index: number, def?: LevelDef) {
  if (hint === "quiet") return "";
  if (hint === "next") return def && isFinaleChannel(def, index) ? `এবার ${SHOWS[def.finale!.picture]}! পুরো বসা পর্যন্ত ধরে রাখো।` : `এবার ${channelName(index)}! আবার ঘোরাও।`;
  if (hint === "start" && def?.quiet) return "নিচে সবাই চুপ। ঝিরঝির দেখেই বোঝো।";
  if (hint === "start" && def?.wobble) return "বাঁশটা নড়বড়ে, আস্তে ঘোরাও!";
  if (hint === "start" && def?.wind) return "আজ হাওয়া আছে, ছবি সরে সরে যায়। ঘোরাও!";
  if (hint === "start" && def?.gusts) return "দমকা হাওয়া আসছে মাঝে মাঝে। ঘোরাও!";
  return SHOUTS[hint];
}

/** The human line by total time, kind at every speed. Thresholds are in tenths of a second. */
export const BANDS = [
  { below: 200, line: "খেলা শুরুর আগেই ছবি এসে গেল!" },
  { below: 350, line: "নিচ থেকে কাউকে দুবার চেঁচাতে হয়নি।" },
  { below: 600, line: "আরেকটু ডানে, আরেকটু বাঁয়ে… শেষে ছবি ঝকঝকে।" },
  { below: Infinity, line: "ঝিরঝির হার মেনেছে। পরের বার আরও তাড়াতাড়ি হবে!" },
] as const;
export const humanLine = (tenths: number) => BANDS.find(band => tenths < band.below)!.line;

export const caption = (shared: Shared) => `ছাদের অ্যান্টেনা ঘুরিয়ে ${bn(levelDef(shared.level, shared.old).channels)}টা চ্যানেল ${seconds(shared.tenths)} সেকেন্ডে ঝকঝকে! একই অ্যান্টেনা, তুমি কত সেকেন্ডে পারবে?`;
export const friendLine = (friend: Shared) => `${friend.name || "তোমার বন্ধু"} ${seconds(friend.tenths)} সেকেন্ডে ${bn(levelDef(friend.level, friend.old).channels)}টা চ্যানেল এনেছে। একই অ্যান্টেনা, এবার তোমার পালা।`;
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

/** Before levels, this phone kept only a best time for the one game there was (now level 1). Turns it into level 1's stars, once. */
export function migrateBest(stars: Record<number, number>, oldBest: string | null): number {
  const tenths = Number(oldBest);
  if (Object.keys(stars).length || oldBest === null || !Number.isInteger(tenths) || tenths < 23 || tenths > 6000) return 0;
  const [three, two] = levelDef(1, true).stars;
  return tenths <= three ? 3 : tenths <= two ? 2 : 1;
}

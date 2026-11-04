// One round of three hits on one field, pure and seeded: the same seed, level, mode and taps give the same ডাং on every
// phone. Units are ডাং (one stick length) and seconds. The field is drawn from the seed; a strike integrates the whole flight
// (gravity, drag, wind that is weaker near the ground, a mid-flight gust, bounces and the roll on grass, sand or wet grass)
// into a preallocated path, and step.hot.ts walks along it. Nothing here allocates after createRound().
import { makeRng } from "../../../shared/game-core";
import { HITS, MAX_HIT, MODE_INFO, levelDef, type LevelDef, type Mode } from "./levels";

export const DT = 1 / 60;
/** The hole the কাঠি lies over, and where it hangs in front of the batter after the flick. */
export const HOLE_X = 0.08, BALL_X = 0.3;
/** The batter's waist, the middle of the yellow band, and how far above or below it the ডাং can still reach. */
export const SWEET = 0.85, CONTACT = 0.8;
/** The flick's gravity (a floaty pop, so the fall is readable) and the flight's. */
export const POP_G = 8.5, G = 20;
const DRAG = 0.0055;
/** Hands: a lofted কাঠি coming down between these heights near a fielder is caught. Only a shot that rose above CATCH_APEX can be. */
export const HANDS_LO = 0.45, HANDS_HI = 2.1, CATCH_APEX = 2.2;
/** Rolling friction (ডাং/s²) on grass, sand and wet grass. */
const ROLL = [12, 110, 5] as const;
/** A tap this soon after the flick is a double tap, not a swing; a tap this long into the rest skips it. */
export const MIN_SWING = 0.12, MIN_SKIP = 0.35;
export const REST_TIME = 1.5;
/** Steps the কাঠি stops on the ডাং at contact (hit-stop). */
export const HIT_STOP = 3;
/** Steps in a flight path (7 s). */
export const PATH = 420;
const GUST_LEN = 0.8;
/** How fast the captain sprints to your last landing (ডাং a second). */
const CAPTAIN_RUN = 9;
export const FIELD_END = MAX_HIT + 1;

// Phases.
export const AIM = 0, POP = 1, FLY = 2, REST = 3, DONE = 4;
// What a hit came to.
export const K_CLEAN = 0, K_POND = 1, K_CAUGHT = 2, K_FALL = 3, K_WHIFF = 4;
// Grades of a strike.
export const WEAK = 0, GOOD = 1, GOLD = 2;
// Ground zones.
export const Z_GRASS = 0, Z_SAND = 1, Z_WET = 2, Z_WATER = 3;
// Events (a, b): what the component turns into sound, juice and words.
export const E_FLICK = 1, E_STRIKE = 2, E_WHIFF = 3, E_FALL = 4, E_LAND = 5, E_CATCH = 6, E_PEG = 7, E_REST = 8, E_PASS = 9, E_NEXT = 10, E_DONE = 11, E_GUST = 12, E_RUN = 13;
const EVENTS = 24;
const FIELDERS = 4;

export type Round = ReturnType<typeof createRound>;

export function createRound(seed: number, level: number, mode: Mode = "n", slow = false) {
  const def: LevelDef = levelDef(level);
  const r = {
    seed, level, mode, def, slow,
    // ---- the field ----
    pops: new Float32Array(HITS), winds: new Float32Array(HITS), gustAt: new Float32Array(HITS), gustPow: new Float32Array(HITS),
    pondFrom: 0, pondTo: 0, sandFrom: 0, sandTo: 0, wetFrom: 0, wetTo: 0,
    fn: 0, fx0: new Float32Array(FIELDERS), freach: new Float32Array(FIELDERS), frun: new Float32Array(FIELDERS),
    famp: new Float32Array(FIELDERS), fomega: new Float32Array(FIELDERS), fphase: new Float32Array(FIELDERS),
    /** The captain's and the long arm's fielder index, or -1. */
    cap: -1, longArm: -1,
    capFrom: 0, capTo: 0, capAt: 0,
    // ---- play ----
    hit: 0, phase: AIM, t: 0, clock: 0,
    popG: POP_G * def.fall * MODE_INFO[mode].fall,
    /** Half-height of the yellow band. ধীরে খেলো runs the round at 0.8×, so its band is 0.8 as tall: the same milliseconds. */
    band: def.band * MODE_INFO[mode].band * (slow ? 0.8 : 1),
    /** A swing that met only air this hit: the কাঠি finishes its fall. */
    swung: false,
    hold: 0,
    // the strike, for drawing the swing
    hitY: 0, angle: 0, speed: 0, grade: WEAK, loft: 0,
    // ---- the flight path ----
    px: new Float32Array(PATH), py: new Float32Array(PATH), pn: 0, pi: 0,
    landAt: -1, landX: 0, landZone: Z_GRASS, catchAt: -1, catcher: -1, restX: 0, kind: K_CLEAN, peg: 0,
    apex: 0,
    // ---- results per hit ----
    kinds: new Int8Array(HITS).fill(-1), dists: new Int16Array(HITS), grades: new Int8Array(HITS), lofts: new Int8Array(HITS),
    lands: new Float32Array(HITS), rests: new Float32Array(HITS), zones: new Int8Array(HITS),
    total: 0, passed: false,
    // ---- the finale's move, faced and beaten ----
    faced: 0, beat: 0,
    // ---- events since the component last read them ----
    evType: new Int8Array(EVENTS), evA: new Float32Array(EVENTS), evB: new Float32Array(EVENTS), evN: 0,
  };
  fillField(r);
  return r;
}

const range = (rng: () => number, low: number, high: number) => low + rng() * (high - low);

/**
 * Lays out the field from the seed. Every draw happens in the same order on every level, so a seed keeps its pond and its
 * fielders' spots; the level only decides which of them are there.
 */
function fillField(r: Round) {
  const rng = makeRng(r.seed), def = r.def;
  // The first hit pops highest and is calm, so the first ten seconds feel good.
  const pops = [range(rng, 1.95, 2.15), range(rng, 1.8, 2.0), range(rng, 1.65, 1.9)];
  const winds = [range(rng, 0.45, 1), range(rng, 0.45, 1), range(rng, 0.45, 1)];
  const signs = [rng() < 0.5 ? -1 : 1, rng() < 0.5 ? -1 : 1, rng() < 0.5 ? -1 : 1];
  const gustRoll = [rng(), rng(), rng()], gustAt = [range(rng, 0.25, 0.5), range(rng, 0.25, 0.5), range(rng, 0.25, 0.5)];
  const gustSign = [rng() < 0.5 ? -1 : 1, rng() < 0.5 ? -1 : 1, rng() < 0.5 ? -1 : 1];
  const pondNear = range(rng, 13, 17), pondFar = range(rng, 33, 36), pondLen = range(rng, 3, 4.5);
  const sandFrom = range(rng, 14, 18), sandLen = range(rng, 9, 12);
  const wetFrom = range(rng, 6, 9), wetLen = range(rng, 11, 15);
  const near = range(rng, 8.5, 12), far = range(rng, 26, 31), mid = range(rng, 17, 21), deep = range(rng, 25, 30);
  const omega = [range(rng, 0.7, 1.2), range(rng, 0.7, 1.2), range(rng, 0.7, 1.2)], phase = [range(rng, 0, 6.28), range(rng, 0, 6.28), range(rng, 0, 6.28)];
  const flip = rng() < 0.5 ? -1 : 1;

  for (let h = 0; h < HITS; h++) {
    r.pops[h] = pops[h] * def.pop;
    // The storm turns the wind every hit; elsewhere each hit has its own.
    const sign = def.special === "storm" ? (h % 2 ? -flip : flip) : signs[h];
    r.winds[h] = def.wind ? sign * winds[h] * def.wind : 0;
    const gusty = def.gusts > 0 && gustRoll[h] < def.gusts;
    r.gustAt[h] = gusty ? gustAt[h] : -1;
    r.gustPow[h] = gusty ? gustSign[h] * def.gust : 0;
  }
  if (def.pond) {
    r.pondFrom = def.world === 2 ? pondFar : pondNear;
    r.pondTo = r.pondFrom + pondLen;
  }
  if (def.sand) { r.sandFrom = sandFrom; r.sandTo = sandFrom + sandLen; }
  if (def.wet) { r.wetFrom = wetFrom; r.wetTo = wetFrom + wetLen; }
  // Nobody stands in the pond: on the বর্ষার মাঠ it lies far out, past every fielder, and catches only the biggest hits.
  const spots = [near, far, mid];
  r.fn = 0;
  for (let i = 0; i < def.fielders; i++) addFielder(r, spots[i], def.reach, def.run, def.walk, omega[i], phase[i]);
  if (def.special === "captain") {
    r.cap = r.fn;
    addFielder(r, 23, def.reach, def.run, 0, 0, 0);
    r.capFrom = r.capTo = 23; r.capAt = 0;
  }
  if (def.special === "longarm") {
    r.longArm = r.fn;
    addFielder(r, deep, 1.2, 2.4, 0, 0, 0);
  }
}

function addFielder(r: Round, x: number, reach: number, run: number, amp: number, omega: number, phase: number) {
  const i = r.fn++, easy = MODE_INFO[r.mode].reach;
  r.fx0[i] = x; r.freach[i] = reach * easy; r.frun[i] = run * easy; r.famp[i] = amp; r.fomega[i] = omega; r.fphase[i] = phase;
}

/** Where fielder `i` stands at round time `clock`: still, pacing, or (the captain) sprinting to your last landing. */
export function fielderX(r: Round, i: number, clock: number) {
  if (i === r.cap) {
    const gap = r.capTo - r.capFrom, ran = CAPTAIN_RUN * Math.max(0, clock - r.capAt);
    return Math.abs(gap) <= ran ? r.capTo : r.capFrom + (gap > 0 ? ran : -ran);
  }
  return r.famp[i] ? r.fx0[i] + r.famp[i] * Math.sin(r.fomega[i] * clock + r.fphase[i]) : r.fx0[i];
}

/** How far a fielder reaches for a কাঠি coming down `t` seconds after the strike (the dashed ring shows it at a typical 1.1 s). */
export const reachAt = (r: Round, i: number, t: number) => r.freach[i] + r.frun[i] * Math.max(0, t - r.def.react);
export const RING_T = 1.1;

/** The ground under `x`. */
export function zoneAt(r: Round, x: number) {
  if (r.pondTo > 0 && x >= r.pondFrom && x <= r.pondTo) return Z_WATER;
  if (r.sandTo > 0 && x >= r.sandFrom && x <= r.sandTo) return Z_SAND;
  if (r.wetTo > 0 && x >= r.wetFrom && x <= r.wetTo) return Z_WET;
  return Z_GRASS;
}

/** The wind (ডাং/s², + towards the field) on this hit, `t` seconds after the strike, at full height. */
export const windAt = (r: Round, t: number) => r.winds[r.hit] + (r.gustAt[r.hit] >= 0 && t >= r.gustAt[r.hit] && t < r.gustAt[r.hit] + GUST_LEN ? r.gustPow[r.hit] : 0);

// ---- the flick ----
/** The কাঠি's upward speed off the flick for this hit. */
export const popUp = (r: Round) => Math.sqrt(2 * r.popG * r.pops[r.hit]);
/** Height of the flicked কাঠি `t` seconds after the flick. */
export function popY(r: Round, t: number) {
  const up = popUp(r);
  return 0.04 + up * t - (r.popG * t * t) / 2;
}
/** Seconds from the flick until the কাঠি, on its way down, is at height `y` (bots and tests). */
export function popTimeAt(r: Round, y: number) {
  const up = popUp(r);
  return (up + Math.sqrt(Math.max(0, up * up - 2 * r.popG * (y - 0.04)))) / r.popG;
}
export const popApexTime = (r: Round) => popUp(r) / r.popG;

// ---- the strike ----
/**
 * The launch for a strike at height `y` (the কাঠি falling): fills r.angle, r.speed, r.grade, r.loft. The shot depends on where
 * in the band it was struck, so a wider band (সহজ) forgives a wobble and a narrower one (কঠিন) doesn't; ধীরে খেলো's band is
 * 0.8 as tall and the round runs at 0.8, so the same real-time wobble makes the same shot.
 */
export function launch(r: Round, y: number) {
  const u = (y - SWEET) / r.band, off = u * 0.3, q = Math.max(0, 1 - (off / CONTACT) ** 2), a = Math.abs(u);
  r.grade = a <= 0.28 ? GOLD : a <= 1 ? GOOD : WEAK;
  const degrees = Math.min(80, Math.max(3, 22 + 18 * (off / 0.3)));
  r.angle = degrees * Math.PI / 180;
  r.speed = 16 + 11 * q + (r.grade === GOLD ? 1.5 : 0);
  r.loft = degrees >= 20 ? 1 : 0;
}

/**
 * Integrates the struck কাঠি's flight from height `y0` into r.px/r.py (one point per DT), deciding where it lands, whether a
 * fielder catches it, and where it stops. `clock0` is the round time of the strike (fielders move with it).
 */
export function integrate(r: Round, y0: number, clock0: number) {
  let x = BALL_X, y = y0, vx = r.speed * Math.cos(r.angle), vy = r.speed * Math.sin(r.angle);
  let n = 0, rolling = false, landed = false, zone = Z_GRASS, apex = y0;
  r.landAt = -1; r.catchAt = -1; r.catcher = -1; r.kind = K_CLEAN; r.landZone = Z_GRASS; r.landX = 0;
  r.px[n] = x; r.py[n] = y; n++;
  while (n < PATH) {
    const t = n * DT;
    if (!rolling) {
      const speed = Math.sqrt(vx * vx + vy * vy), shelter = y < 0.375 ? 0.15 : y > 2.5 ? 1 : y / 2.5;
      vx += (windAt(r, t) * shelter - DRAG * speed * vx) * DT;
      vy += (-G - DRAG * speed * vy) * DT;
      x += vx * DT; y += vy * DT;
      if (y > apex) apex = y;
      // A lofted কাঠি coming down through hand height near a fielder is caught.
      if (!landed && vy < 0 && y <= HANDS_HI && y >= HANDS_LO && apex >= CATCH_APEX) {
        for (let i = 0; i < r.fn; i++) {
          if (Math.abs(x - fielderX(r, i, clock0 + t)) <= reachAt(r, i, t)) { r.catcher = i; break; }
        }
        if (r.catcher >= 0) {
          r.kind = K_CAUGHT; r.catchAt = n; r.restX = x;
          r.px[n] = x; r.py[n] = y; n++;
          break;
        }
      }
      if (y <= 0) {
        y = 0;
        zone = zoneAt(r, x);
        if (!landed) { landed = true; r.landAt = n; r.landX = x; r.landZone = zone; }
        if (zone === Z_WATER) { r.kind = K_POND; r.restX = r.pondFrom; r.px[n] = x; r.py[n] = -0.25; n++; break; }
        const steep = -vy / (Math.abs(vx) + -vy + 1e-6);
        if (zone === Z_SAND) { vx *= 0.12; vy = 0; rolling = true; }
        else if (-vy > 2.2) { vy = -vy * 0.3; vx *= 0.9 - 0.6 * steep; }
        else { vy = 0; rolling = true; }
      }
    } else {
      zone = zoneAt(r, x);
      if (zone === Z_WATER) { r.kind = K_POND; r.restX = r.pondFrom; r.px[n] = x; r.py[n] = -0.25; n++; break; }
      vx -= ROLL[zone] * DT;
      if (vx <= 0) { r.px[n] = x; r.py[n] = 0; n++; break; }
      x += vx * DT;
    }
    if (x >= FIELD_END) { x = FIELD_END; r.px[n] = x; r.py[n] = y; n++; break; }
    r.px[n] = x; r.py[n] = y; n++;
  }
  if (r.kind === K_CLEAN) r.restX = r.px[n - 1];
  r.pn = n; r.pi = 0; r.peg = 0; r.apex = apex;
}

/** Whole ডাং from the hole to where it stopped (0 when caught). */
export const distanceOf = (r: Round) => r.kind === K_CAUGHT || r.kind === K_FALL || r.kind === K_WHIFF ? 0 : Math.min(MAX_HIT, Math.max(0, Math.floor(r.restX)));

export function emit(r: Round, type: number, a = 0, b = 0) {
  if (r.evN >= EVENTS) return;
  r.evType[r.evN] = type; r.evA[r.evN] = a; r.evB[r.evN] = b; r.evN++;
}

/**
 * One tap (a finger or a fresh key press). Returns 1 flick, 2 strike, 3 a swing at air, 4 rest skipped, 0 nothing.
 * The caller decides whether a tap may count at all (session.ts: not while paused, away or catching a breath).
 */
export function press(r: Round) {
  if (r.phase === AIM) {
    r.phase = POP; r.t = 0; r.swung = false;
    emit(r, E_FLICK, r.hit);
    return 1;
  }
  if (r.phase === POP) {
    if (r.swung || r.t < MIN_SWING) return 0;
    const y = popY(r, r.t), rising = r.t < popApexTime(r);
    r.swung = true; r.hitY = y;
    if (rising || Math.abs(y - SWEET) > CONTACT) { emit(r, E_WHIFF, rising ? 0 : 1); return 3; }
    launch(r, y);
    integrate(r, y, r.clock);
    r.phase = FLY; r.t = 0; r.hold = HIT_STOP;
    emit(r, E_STRIKE, r.grade, r.loft);
    return 2;
  }
  if (r.phase === REST && r.t >= MIN_SKIP) { nextHit(r); return 4; }
  return 0;
}

/** A hit is over: record it, the running total, passing the neighbour, and the captain's run. */
export function settle(r: Round, kind: number) {
  const h = r.hit;
  r.kind = kind;
  const dist = distanceOf(r);
  r.kinds[h] = kind; r.dists[h] = dist; r.zones[h] = kind === K_CLEAN || kind === K_POND ? r.landZone : Z_GRASS;
  r.grades[h] = kind === K_FALL || kind === K_WHIFF ? -1 : r.grade; r.lofts[h] = r.loft;
  const flew = kind === K_CLEAN || kind === K_POND || kind === K_CAUGHT;
  r.lands[h] = flew ? (kind === K_CAUGHT ? r.restX : r.landX) : BALL_X; r.rests[h] = flew ? r.restX : BALL_X;
  const before = r.total;
  r.total += dist;
  r.phase = REST; r.t = 0;
  emit(r, E_REST, kind, dist);
  if (!r.passed && r.total > r.def.target) { r.passed = true; emit(r, E_PASS, r.total, before); }
  // The finale's move: did it come into play on this hit, and did you beat it?
  if (r.cap >= 0 && r.capAt > 0 && kind !== K_FALL && kind !== K_WHIFF) { r.faced++; if (!(kind === K_CAUGHT && r.catcher === r.cap)) r.beat++; }
  if (r.longArm >= 0 && kind !== K_FALL && kind !== K_WHIFF && r.loft) { r.faced++; if (!(kind === K_CAUGHT && r.catcher === r.longArm)) r.beat++; }
  if (r.def.special === "storm" && kind !== K_FALL && kind !== K_WHIFF) { r.faced++; if (kind === K_CLEAN && dist >= 15) r.beat++; }
  if (r.cap >= 0 && (kind === K_CLEAN || kind === K_POND) && r.landX > 0) {
    r.capFrom = fielderX(r, r.cap, r.clock);
    r.capTo = Math.min(45, Math.max(8, r.landX));
    r.capAt = r.clock;
    emit(r, E_RUN, r.capTo);
  }
}

export function nextHit(r: Round) {
  r.t = 0;
  if (r.hit + 1 >= HITS) { r.phase = DONE; emit(r, E_DONE, r.total); return; }
  r.hit++;
  r.phase = AIM; r.swung = false;
  emit(r, E_NEXT, r.hit);
}

/** Where the কাঠি is now (for the draw and the camera). Writes into `out`. */
export function kathiAt(r: Round, out: { x: number; y: number }) {
  if (r.phase === AIM) { out.x = HOLE_X; out.y = 0.04; return out; }
  if (r.phase === POP) {
    out.x = HOLE_X + (BALL_X - HOLE_X) * Math.min(1, r.t * 5);
    out.y = Math.max(0.04, popY(r, r.t));
    return out;
  }
  if (r.kinds[r.hit] === K_FALL || r.kinds[r.hit] === K_WHIFF) { out.x = BALL_X; out.y = 0.04; return out; }
  const i = r.phase === FLY ? r.pi : r.pn - 1;
  out.x = r.px[i]; out.y = r.py[i];
  return out;
}

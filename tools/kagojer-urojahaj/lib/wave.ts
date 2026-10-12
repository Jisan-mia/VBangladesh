// A wave's whole plan, made from the seed: which cloud comes when and where, every raindrop, the storm's rain curtains.
// Every position is a pure function of time, so the game, the fairness check and a friend's phone all see the same sky.
// Pure and server-safe (share.ts checks links against it).
import { makeRng, pick } from "../../../shared/game-core";
import { LEVELS, type LevelSpec, type Pattern } from "./levels";

/** The sky is 100 units wide and 125 tall (4:5); the plane flies along a fixed line near the bottom. */
export const W = 100, H = 125;
export const PLANE_Y = 108, PLANE_HH = 4.5, PLANE_DROP_HW = 3.4;
export const X_MIN = 6, X_MAX = 94;
/** The tap buttons move the plane this fast; a drag may go faster. Fairness is proved at button speed. */
export const BUTTON_SPEED = 72, DRAG_SPEED = 170;
export const DROP_R = 1.4;
export const STORM = -1;
export const STORM_WEIGHT = 5, STORM_SUNS = 5, STORM_POINTS = 150, SUN_POINTS = 10, COMBO_CAP = 16;
export const STORM_Y = 20, STORM_RAIN_Y = 34;
const CURTAIN_ROWS = 4, ROW_GAP = 0.12, STORM_RISE = 17;

export type CloudKind = "puff" | "dark" | "spit";
export type CloudPlan = {
  kind: CloudKind; t0: number; x0: number; vy: number; sway: number; freq: number; phase: number;
  hp: number; rw: number; rh: number; points: number; weight: number; group: number; fromStorm: boolean;
};
export type DropPlan = { t: number; x: number; y: number; vy: number; source: number };
export type Curtain = { t: number; warn: number; slots: readonly number[] };
export type StormPlan = { t0: number; life: number; hp: number; amp: number; rw: number; rh: number; curtains: Curtain[] };
export type Wave = {
  seed: number; level: number; clouds: CloudPlan[]; drops: DropPlan[]; storm: StormPlan | null;
  /** Clouds that count towards the second star (the storm counts as 5), and how many you need. */
  total: number; goal: number; suns: number; maxScore: number;
  /** When the last cloud, drop and storm are gone if nobody pops anything. */
  length: number;
};

const KINDS = {
  puff: { rw: 8, rh: 5.5, hp: 1, points: 10, weight: 1 },
  dark: { rw: 9.5, rh: 6.5, hp: 2, points: 25, weight: 1 },
  spit: { rw: 6, rh: 4.5, hp: 1, points: 5, weight: 0 },
} as const;

export const cloudX = (c: CloudPlan, t: number) => c.x0 + c.sway * Math.sin(c.freq * (t - c.t0) + c.phase);
export const cloudY = (c: CloudPlan, t: number) => -c.rh + c.vy * (t - c.t0);
export const cloudGoneAt = (c: CloudPlan) => c.t0 + (H + 2 * c.rh) / c.vy;
export const stormX = (s: StormPlan, t: number) => 50 + s.amp * Math.sin(0.55 * (t - s.t0));
export function stormY(s: StormPlan, t: number) {
  const enter = -14 + STORM_RISE * (t - s.t0), leave = STORM_Y - STORM_RISE * (t - s.t0 - s.life);
  return Math.min(STORM_Y, enter, t > s.t0 + s.life ? leave : STORM_Y);
}
/** The storm rains and throws clouds only between arriving and leaving. */
export const stormActive = (s: StormPlan, t: number) => t >= s.t0 && t < s.t0 + s.life;
export const stormGoneAt = (s: StormPlan) => s.t0 + s.life + (STORM_Y + 16) / STORM_RISE;

// Hitboxes sit inside the drawn shapes, so a graze never counts against you. A cloud can only wet the plane
// if it's narrower than the paper balls' reach, so holding still under a cloud always pops it first.
export const cloudHalfX = (c: Pick<CloudPlan, "rw">) => c.rw * 0.6 + PLANE_DROP_HW;
export const cloudHalfY = (c: Pick<CloudPlan, "rh">) => c.rh * 0.7 + PLANE_HH;
export const ballReach = (c: Pick<CloudPlan, "rw">) => c.rw * 0.95;
export const cloudHitsPlane = (c: CloudPlan, cx: number, cy: number, px: number) =>
  Math.abs(cx - px) < cloudHalfX(c) && Math.abs(cy - PLANE_Y) < cloudHalfY(c);
export const dropHitsPlane = (dx: number, dy: number, px: number) =>
  Math.abs(dx - px) < DROP_R + PLANE_DROP_HW && Math.abs(dy - PLANE_Y) < DROP_R + PLANE_HH;

/** The storm's rain falls in nine 10-wide lanes. The patterns cycle in a fixed order, so you can learn them: left, right, edges, middle. */
export const LANE = (slot: number) => 10 + slot * 10;
const CURTAINS = {
  narrow: [[0, 1, 2, 3], [5, 6, 7, 8], [0, 1, 7, 8], [3, 4, 5]],
  wide: [[0, 1, 2, 3, 4], [4, 5, 6, 7, 8], [0, 1, 2, 6, 7, 8], [2, 3, 4, 5, 6]],
} as const;

type Group = { start: number; pattern: Pattern; stage: number; clouds: Omit<CloudPlan, "group">[] };
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));

function cloud(kind: CloudKind, t0: number, x: number, vy: number, sway = 0, rng?: () => number, fromStorm = false): Omit<CloudPlan, "group"> {
  const size = KINDS[kind], edge = sway + size.rw * 0.8 + 2;
  return {
    kind, t0, x0: clamp(x, edge, W - edge), vy, sway, freq: rng ? 1.2 + rng() * 0.6 : 1.4, phase: rng ? rng() * Math.PI * 2 : 0,
    hp: size.hp, rw: size.rw, rh: size.rh, points: size.points, weight: size.weight, fromStorm,
  };
}

function makeGroup(pattern: Pattern, start: number, spec: LevelSpec, rng: () => number): Group {
  const vy = spec.speed * (0.9 + rng() * 0.2);
  const kind = (): CloudKind => (rng() < spec.dark ? "dark" : "puff");
  const clouds: Group["clouds"] = [];
  const add = (t: number, x: number, sway = 0) => clouds.push(cloud(kind(), t, x, vy, sway, rng));
  if (pattern === "single") add(start, 12 + rng() * 76, spec.sway ? rng() * spec.sway * 0.5 : 0);
  else if (pattern === "pair") { const x = 14 + rng() * 30; add(start, x); add(start + rng() * 0.3, Math.min(88, x + 30 + rng() * 26)); }
  else if (pattern === "row") {
    const slots = [14, 32, 50, 68, 86], gap = pick(rng, 5), skip = rng() < 0.5 ? (gap + 2 + pick(rng, 2)) % 5 : -1;
    slots.forEach((x, index) => { if (index !== gap && index !== skip) add(start, x); });
  } else if (pattern === "column") { const x = 14 + rng() * 72; for (let index = 0; index < 3; index++) add(start + index * 0.7, x); }
  else if (pattern === "vee") {
    const centre = 34 + rng() * 32;
    add(start, centre);
    for (const [offset, delay] of [[16, 0.4], [32, 0.8]]) for (const side of [-1, 1]) { const x = centre + side * offset; if (x >= 10 && x <= 90) add(start + delay, x); }
  } else if (pattern === "diag") {
    const from = rng() < 0.5 ? 14 : 86, step = from < 50 ? 18 : -18;
    for (let index = 0; index < 4; index++) add(start + index * 0.45, from + index * step);
  } else {
    const amp = spec.sway || 10, x = 20 + amp + rng() * (60 - 2 * amp), phase = rng() * Math.PI * 2;
    for (let index = 0; index < 3; index++) { add(start + index * 0.8, x, amp); clouds[clouds.length - 1].phase = phase; }
  }
  return { start, pattern, stage: 0, clouds };
}

function assemble(seed: number, level: number, spec: LevelSpec, groups: Group[], storm: StormPlan | null, rainRng: () => number): Wave {
  const clouds: CloudPlan[] = [];
  groups.forEach((group, index) => { for (const c of group.clouds) clouds.push({ ...c, group: index }); });
  clouds.sort((a, b) => a.t0 - b.t0);
  const drops: DropPlan[] = [];
  const dropSpeed = 46 + level * 0.5;
  clouds.forEach((c, id) => {
    if (c.kind !== "dark" || !spec.rain) return;
    for (let t = c.t0 + 1.1 + rainRng() * 0.4; ; t += spec.rain * (0.9 + rainRng() * 0.2)) {
      const y = cloudY(c, t);
      if (y > PLANE_Y - 34) break;
      if (y >= 2) drops.push({ t, x: cloudX(c, t), y: y + c.rh * 0.6, vy: dropSpeed, source: id });
    }
  });
  if (storm) for (const curtain of storm.curtains) for (const slot of curtain.slots) for (let row = 0; row < CURTAIN_ROWS; row++) for (const side of [-1, 1]) {
    drops.push({ t: curtain.t + row * ROW_GAP, x: LANE(slot) + side * 2.6 + (rainRng() - 0.5) * 1.6, y: STORM_RAIN_Y, vy: 55, source: STORM });
  }
  drops.sort((a, b) => a.t - b.t);
  const counted = clouds.filter(c => c.weight > 0);
  const total = counted.length + (storm ? STORM_WEIGHT : 0);
  const suns = clouds.filter(c => c.kind === "dark").length + (storm ? STORM_SUNS : 0);
  const maxScore = clouds.reduce((sum, c) => sum + c.points + COMBO_CAP, 0) + (storm ? STORM_POINTS + COMBO_CAP : 0) + suns * SUN_POINTS;
  const length = Math.max(0, ...clouds.map(cloudGoneAt), ...drops.map(d => d.t + (H + 4 - d.y) / d.vy), storm ? stormGoneAt(storm) : 0);
  return { seed, level, clouds, drops, storm, total, goal: Math.ceil(total * 0.7), suns, maxScore, length };
}

type Hazard = { from: number; to: number; cloud: CloudPlan | null; drop: DropPlan | null };

/**
 * Sweeps the plane's line through time, assuming nothing is ever popped (popping only removes danger).
 * Returns the first moment no reachable spot is dry, or -1 when a path always exists at button speed.
 * With `keep`, also returns that path: one x per step.
 */
export function sweep(wave: Wave, dt = 1 / 30, margin = 0.6, keep = false): { failAt: number; path: Float32Array | null } {
  const hazards: Hazard[] = [];
  for (const c of wave.clouds) {
    const reach = cloudHalfY(c);
    hazards.push({ from: c.t0 + (PLANE_Y - reach + c.rh) / c.vy, to: c.t0 + (PLANE_Y + reach + c.rh) / c.vy, cloud: c, drop: null });
  }
  for (const d of wave.drops) {
    const reach = DROP_R + PLANE_HH;
    hazards.push({ from: d.t + (PLANE_Y - reach - d.y) / d.vy, to: d.t + (PLANE_Y + reach - d.y) / d.vy, cloud: null, drop: d });
  }
  hazards.sort((a, b) => a.from - b.from);
  const CELL = 0.5, cells = Math.round((X_MAX - X_MIN) / CELL) + 1, move = Math.floor((BUTTON_SPEED * dt) / CELL + 1e-9);
  const end = Math.max(0, ...hazards.map(h => h.to)) + dt, steps = Math.ceil(end / dt) + 1;
  let reach = new Uint8Array(cells), next = new Uint8Array(cells);
  const blocked = new Uint8Array(cells), sums = new Int32Array(cells + 1);
  const history = keep ? new Uint8Array(steps * cells) : null;
  reach[Math.round((50 - X_MIN) / CELL)] = 1;
  const active: Hazard[] = [];
  let pointer = 0;
  for (let index = 0; index < steps; index++) {
    const t = index * dt;
    while (pointer < hazards.length && hazards[pointer].from <= t) active.push(hazards[pointer++]);
    blocked.fill(0);
    for (let a = active.length - 1; a >= 0; a--) {
      const h = active[a];
      if (h.to < t) { active.splice(a, 1); continue; }
      let centre: number, half: number;
      if (h.cloud) {
        if (Math.abs(cloudY(h.cloud, t) - PLANE_Y) >= cloudHalfY(h.cloud)) continue;
        centre = cloudX(h.cloud, t); half = cloudHalfX(h.cloud) + margin;
      } else {
        const d = h.drop!;
        if (Math.abs(d.y + d.vy * (t - d.t) - PLANE_Y) >= DROP_R + PLANE_HH) continue;
        centre = d.x; half = DROP_R + PLANE_DROP_HW + margin;
      }
      const low = Math.max(0, Math.ceil((centre - half - X_MIN) / CELL - 1e-9)), high = Math.min(cells - 1, Math.floor((centre + half - X_MIN) / CELL + 1e-9));
      for (let cell = low; cell <= high; cell++) blocked[cell] = 1;
    }
    sums[0] = 0;
    for (let cell = 0; cell < cells; cell++) sums[cell + 1] = sums[cell] + reach[cell];
    let any = false;
    for (let cell = 0; cell < cells; cell++) {
      const ok = index === 0 ? reach[cell] : sums[Math.min(cells, cell + move + 1)] - sums[Math.max(0, cell - move)];
      next[cell] = ok && !blocked[cell] ? 1 : 0;
      if (next[cell]) any = true;
    }
    if (!any) return { failAt: t, path: null };
    history?.set(next, index * cells);
    [reach, next] = [next, reach];
  }
  if (!history) return { failAt: -1, path: null };
  // Walk back from the end, always choosing the reachable spot nearest the current one (least steering).
  const path = new Float32Array(steps);
  let at = -1;
  for (let cell = 0; cell < cells; cell++) if (history[(steps - 1) * cells + cell] && (at < 0 || Math.abs(cell - cells / 2) < Math.abs(at - cells / 2))) at = cell;
  for (let index = steps - 1; index >= 0; index--) {
    if (index < steps - 1) {
      let best = -1;
      for (let cell = Math.max(0, at - move); cell <= Math.min(cells - 1, at + move); cell++) if (history[index * cells + cell] && (best < 0 || Math.abs(cell - at) < Math.abs(best - at))) best = cell;
      at = best;
    }
    path[index] = X_MIN + at * CELL;
  }
  return { failAt: -1, path };
}

/** The wave for a seed and level: generated, then repaired until the sweep finds a dry path the whole way. */
export function makeWave(seed: number, level: number): Wave {
  const spec = LEVELS[level - 1];
  const rng = makeRng((seed ^ Math.imul(level, 0x9e3779b1)) >>> 0 || 1);
  const groups: Group[] = [];
  let t = 0.8;
  for (let index = 0; index < spec.groups; index++) {
    // The very first cloud of the game floats straight down at the plane: a pop in the first two seconds.
    if (level === 1 && index === 0) groups.push({ start: t, pattern: "single", stage: 2, clouds: [cloud("puff", t, 50, spec.speed)] });
    else groups.push(makeGroup(spec.patterns[pick(rng, spec.patterns.length)], t, spec, rng));
    t += spec.gap * (0.9 + rng() * 0.2);
  }
  let storm: StormPlan | null = null;
  if (spec.storm) {
    const s = spec.storm, t0 = t + 2.4, patterns = s.wide ? CURTAINS.wide : CURTAINS.narrow, first = pick(rng, 4);
    storm = { t0, life: s.life, hp: s.hp, amp: 10, rw: 30, rh: 13, curtains: [] };
    for (let k = 0, tc = t0 + 3.6; tc + 1.8 < t0 + s.life; k++, tc += s.every) {
      storm.curtains.push({ t: tc, warn: s.warn, slots: patterns[(first + k) % 4] });
      const spitAt = tc + s.every * 0.5;
      if (s.spit && spitAt < t0 + s.life - 1) {
        const x = stormX(storm, spitAt);
        groups.push({ start: spitAt, pattern: "pair", stage: 1, clouds: [-12, 12].map(side => cloud("spit", spitAt, x + side, 19, 0, undefined, true)) });
      }
    }
  }
  const rainSeed = Math.floor(rng() * 1e9) + 1;
  for (let attempt = 0; attempt < 80; attempt++) {
    const wave = assemble(seed, level, spec, groups, storm, makeRng(rainSeed));
    const { failAt } = sweep(wave);
    if (failAt < 0) return wave;
    // Blame the latest group still over the plane's line at that moment: reroll it, then shrink it to one cloud, then drop it.
    let culprit = -1;
    groups.forEach((group, index) => {
      const last = Math.max(...group.clouds.map(c => cloudGoneAt({ ...c, group: index })));
      if (group.start <= failAt && last + 3 >= failAt && (culprit < 0 || group.start > groups[culprit].start)) culprit = index;
    });
    if (culprit < 0 && storm) {
      const before = storm.curtains.filter(curtain => curtain.t <= failAt);
      storm.curtains.splice(storm.curtains.indexOf(before[before.length - 1] ?? storm.curtains[0]), 1);
      continue;
    }
    if (culprit < 0) break;
    const group = groups[culprit];
    if (group.stage === 0 && group.pattern !== "single") groups[culprit] = { ...makeGroup(group.pattern, group.start, spec, rng), stage: 1 };
    else if (group.stage <= 1 && !group.clouds[0].fromStorm) groups[culprit] = { start: group.start, pattern: "single", stage: 2, clouds: [cloud("puff", group.start, 12 + rng() * 76, spec.speed)] };
    else groups.splice(culprit, 1);
  }
  // Never reached in tests; a sky with no clouds is still fair.
  return assemble(seed, level, spec, [], null, makeRng(rainSeed));
}

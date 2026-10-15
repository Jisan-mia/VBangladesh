// The rover's rules, kept pure so the page, the card and the tests share them: maps, running a plan step by step, a BFS solver and stars.

export type Dir = "U" | "D" | "L" | "R";
export type Cell = { x: number; y: number };
/** One block of the plan: an arrow, or an arrow repeated `times` (2–5) as one "৩ বার ↑" block. */
export type Block = { dir: Dir; times: number };
export type Level = {
  n: number; title: string; w: number; h: number; start: Cell; samples: Cell[]; craters: Cell[];
  /** The repeat block is in the palette. */
  repeat: boolean;
  /** The fewest-blocks challenge: the target is shown before the run. */
  challenge: boolean;
};

export const DIRS: Record<Dir, { dx: number; dy: number; arrow: string; bn: string }> = {
  U: { dx: 0, dy: -1, arrow: "↑", bn: "ওপরে" },
  D: { dx: 0, dy: 1, arrow: "↓", bn: "নিচে" },
  L: { dx: -1, dy: 0, arrow: "←", bn: "বামে" },
  R: { dx: 1, dy: 0, arrow: "→", bn: "ডানে" },
};
export const DIR_ORDER: Dir[] = ["U", "L", "R", "D"];
export const MAX_TIMES = 5;
export const MAX_BLOCKS = 16;

/** A map row by row: R rover, S rock sample, C crater, . sand. */
export function parseMap(rows: string[]) {
  const start: Cell[] = [], samples: Cell[] = [], craters: Cell[] = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === "R") start.push({ x, y });
    else if (ch === "S") samples.push({ x, y });
    else if (ch === "C") craters.push({ x, y });
    else if (ch !== ".") throw new Error(`unknown map character ${ch}`);
  }));
  if (start.length !== 1 || !samples.length || rows.some(row => row.length !== rows[0].length)) throw new Error("bad map");
  return { w: rows[0].length, h: rows.length, start: start[0], samples, craters };
}

const same = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;
export const isCrater = (level: Level, cell: Cell) => level.craters.some(c => same(c, cell));
const inside = (level: Level, cell: Cell) => cell.x >= 0 && cell.y >= 0 && cell.x < level.w && cell.y < level.h;

/** Arrows as the run plays them: a "৩ বার ↑" block becomes three ↑ steps. */
export const blockSteps = (plan: Block[]) => plan.reduce((sum, block) => sum + block.times, 0);

export type Step = { block: number; turn: number; at: Cell; got: number | null };
export type RunEnd = "win" | "crater" | "edge" | "short";
export type Run = { steps: Step[]; end: RunEnd; failBlock: number | null; bump: Cell | null; got: number };

/** Plays a plan from the start: collects samples on the way, stops at the last sample, or gently before a crater or the map's edge. */
export function runPlan(level: Level, plan: Block[]): Run {
  let at = level.start;
  const taken = new Set<number>(), steps: Step[] = [];
  for (let block = 0; block < plan.length; block++) {
    const { dx, dy } = DIRS[plan[block].dir];
    for (let turn = 0; turn < plan[block].times; turn++) {
      const next = { x: at.x + dx, y: at.y + dy };
      if (!inside(level, next)) return { steps, end: "edge", failBlock: block, bump: next, got: taken.size };
      if (isCrater(level, next)) return { steps, end: "crater", failBlock: block, bump: next, got: taken.size };
      at = next;
      const sample = level.samples.findIndex((s, i) => !taken.has(i) && same(s, at));
      if (sample >= 0) taken.add(sample);
      steps.push({ block, turn, at, got: sample >= 0 ? sample : null });
      if (taken.size === level.samples.length) return { steps, end: "win", failBlock: null, bump: null, got: taken.size };
    }
  }
  return { steps, end: "short", failBlock: null, bump: null, got: taken.size };
}

/**
 * Breadth-first search over (cell, samples taken). Each move is one block: a single arrow, or with `repeat`
 * a run of 2–5 of the same arrow. Returns the plan with the fewest blocks, or null when no plan reaches every sample.
 */
export function solve(level: Level, repeat = level.repeat): Block[] | null {
  const full = (1 << level.samples.length) - 1, key = (c: Cell, mask: number) => `${c.x},${c.y},${mask}`;
  const startMask = 0;
  const seen = new Map<string, { from: string | null; block: Block | null }>([[key(level.start, startMask), { from: null, block: null }]]);
  let queue: Array<{ at: Cell; mask: number }> = [{ at: level.start, mask: startMask }];
  while (queue.length) {
    const next: typeof queue = [];
    for (const { at, mask } of queue) {
      for (const dir of DIR_ORDER) {
        const { dx, dy } = DIRS[dir];
        let cell = at, got = mask;
        for (let times = 1; times <= (repeat ? MAX_TIMES : 1); times++) {
          cell = { x: cell.x + dx, y: cell.y + dy };
          if (!inside(level, cell) || isCrater(level, cell)) break;
          const sample = level.samples.findIndex(s => same(s, cell));
          if (sample >= 0) got |= 1 << sample;
          const k = key(cell, got);
          if (seen.has(k)) continue;
          seen.set(k, { from: key(at, mask), block: { dir, times } });
          if (got === full) {
            const plan: Block[] = [];
            for (let step = seen.get(k)!; step.block; step = seen.get(step.from!)!) plan.unshift(step.block);
            return plan;
          }
          next.push({ at: cell, mask: got });
        }
      }
    }
    queue = next;
  }
  return null;
}

/** The cells the rover passes on a plan (for the hint path and the card). */
export const pathOf = (level: Level, plan: Block[]) => [level.start, ...runPlan(level, plan).steps.map(step => step.at)];

/** Stars are a record only: one for reaching every sample, two within two blocks of the shortest plan, three for the shortest. */
export function starsOf(blocks: number, fewest: number) {
  return blocks <= fewest ? 3 : blocks <= fewest + 2 ? 2 : 1;
}

/** Three runs in a row that missed: quietly show the way (dotted path). The level never gets harder after a miss. */
export const HINT_AFTER = 3;
export const showHint = (missesInRow: number) => missesInRow >= HINT_AFTER;

/** Adds an arrow to the end of the plan (at most MAX_BLOCKS blocks, so the plan stays on screen). */
export const addBlock = (plan: Block[], dir: Dir): Block[] => (plan.length >= MAX_BLOCKS ? plan : [...plan, { dir, times: 1 }]);

/** The repeat tile: "আরও একবার" for the last block, so ↑ then two taps read "৩ বার ↑" and stays one block. Stops at MAX_TIMES. */
export function repeatLast(plan: Block[]): Block[] {
  const last = plan.at(-1);
  if (!last || last.times >= MAX_TIMES) return plan;
  return [...plan.slice(0, -1), { ...last, times: last.times + 1 }];
}

export const removeBlock = (plan: Block[], index: number) => plan.filter((_, i) => i !== index);

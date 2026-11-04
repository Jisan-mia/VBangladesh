// The garden plot and its rules: sliding, merging and seeded spawns. Pure and server-safe.
import { makeRng } from "../../../shared/game-core";

/** 1 আঁটি → 9 আমের বাগান. Two of one stage grow into the next; the last stage doesn't grow. */
export const STAGES = ["আঁটি", "চারা", "গাছ", "মুকুল", "গুটি আম", "কাঁচা আম", "পাকা আম", "আমের ঝুড়ি", "আমের বাগান"] as const;
export const TOP = STAGES.length;
export const stageName = (stage: number) => STAGES[Math.max(1, Math.min(TOP, stage)) - 1];
/** Points for growing each stage (index = stage). */
export const POINTS = [0, 0, 2, 5, 12, 25, 50, 100, 200, 500] as const;

/** A cell: 0 empty, STONE a পাথর nothing passes, 1..9 a stage. */
export const STONE = -1;
/** An আগাছা: it slides like a plate, never grows, and two that meet are pulled out together. */
export const WEED = -2;
/** A কাক sitting on a plate: nothing passes it, like a stone, until it flies off. */
export const CROW = -3;
/** Cells nothing slides through. */
export const blocks = (cell: number) => cell === STONE || cell === CROW;
/** 0 up, 1 down, 2 left, 3 right. */
export type Dir = 0 | 1 | 2 | 3;
export const DIRS: readonly Dir[] = [0, 1, 2, 3];

export type Path = { from: number; to: number; merged: boolean };
export type Slide = { cells: number[]; paths: Path[]; grown: Array<{ cell: number; stage: number }>; points: number; pulled: number[] };
/** Points for pulling out a pair of weeds. */
export const WEED_POINTS = 4;

/** The cells of each line, starting from the edge the tiles slide toward. */
function lines(size: number, dir: Dir) {
  const out: number[][] = [];
  for (let a = 0; a < size; a++) {
    const line: number[] = [];
    for (let b = 0; b < size; b++) {
      const k = dir === 1 || dir === 3 ? size - 1 - b : b;
      line.push(dir <= 1 ? k * size + a : a * size + k);
    }
    out.push(line);
  }
  return out;
}

/**
 * Slides every tile toward `dir`. Stones split a line into separate runs. Each tile grows at most once per slide.
 * Null when nothing moves (that swipe costs no move and spawns nothing).
 */
export function slide(cells: readonly number[], size: number, dir: Dir): Slide | null {
  const next = cells.slice(), paths: Path[] = [], grown: Slide["grown"] = [], pulled: number[] = [];
  let points = 0, moved = false;
  for (const line of lines(size, dir)) {
    let start = 0;
    while (start < line.length) {
      if (blocks(cells[line[start]])) { start++; continue; }
      let end = start;
      while (end < line.length && !blocks(cells[line[end]])) end++;
      // one run: line[start..end)
      let write = start, open = -1; // `open`: index in line of a tile that may still grow this slide
      for (let read = start; read < end; read++) {
        const from = line[read], stage = cells[from];
        if (!stage) continue;
        if (stage === WEED && open >= 0 && next[line[open]] === WEED) {
          // two weeds meet: both come out, and the slot is free for whatever slides in next
          const to = line[open];
          next[to] = 0;
          paths.push({ from, to, merged: true });
          for (const path of paths) if (path.to === to && !path.merged) path.merged = true;
          pulled.push(to);
          points += WEED_POINTS;
          write = open;
          open = -1;
          moved = true;
          continue;
        }
        if (open >= 0 && next[line[open]] === stage && stage > 0 && stage < TOP) {
          const to = line[open];
          next[to] = stage + 1;
          paths.push({ from, to, merged: true });
          for (const path of paths) if (path.to === to && !path.merged) path.merged = true;
          grown.push({ cell: to, stage: stage + 1 });
          points += POINTS[stage + 1];
          open = -1;
          if (from !== to) moved = true;
          continue;
        }
        const to = line[write];
        next[to] = stage;
        if (from !== to) moved = true;
        paths.push({ from, to, merged: false });
        open = write;
        write++;
      }
      for (let k = write; k < end; k++) next[line[k]] = 0;
      start = end;
    }
  }
  if (!moved) return null;
  return { cells: next, paths, grown, points, pulled };
}

export const canMove = (cells: readonly number[], size: number) => DIRS.some(dir => slide(cells, size, dir) !== null);
export const topStage = (cells: readonly number[]) => Math.max(0, ...cells);

/**
 * Spawn number `index` of a seed. The stage comes from the first draw, so the stages that fall are the same for
 * everyone on that seed, whatever they swipe; only the cell depends on the board. One in eight is a চারা.
 */
export function spawn(cells: readonly number[], seed: number, index: number, firstSeeds = false) {
  const empty: number[] = [];
  for (let cell = 0; cell < cells.length; cell++) if (cells[cell] === 0) empty.push(cell);
  if (!empty.length) return null;
  const rng = makeRng((seed ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0);
  const stage = rng() < 0.125 && !firstSeeds ? 2 : 1;
  const cell = empty[Math.floor(rng() * empty.length)];
  return { cell, stage };
}

/** The seed mass (in আঁটি) on the board: a stage-k tile holds 2^(k-1). Spawns add it, merges keep it. */
export const mass = (cells: readonly number[]) => cells.reduce((sum, stage) => sum + (stage > 0 ? 2 ** (stage - 1) : 0), 0);

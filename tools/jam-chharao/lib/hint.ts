// A hint that teaches: the next move of a shortest way out, and one line on why it helps. Pure and server-safe.
import { blockers, occupancy, reach, solve, COLS, type Kind, type Move } from "./board";
import type { Game } from "./game";
import { bn } from "./link";

/** A vehicle by name, with the ‘-টা’ that goes with it. */
export const NAMES: Record<Kind, string> = { cng: "সবুজ CNG-টা", cng2: "নীল CNG-টা", rickshaw: "রিকশাটা", van: "ভ্যানটা", bus: "বাসটা", truck: "ট্রাকটা" };
/** The same, for "…-র পথ" (a hero's name by itself). */
const OF: Record<Kind, string> = { cng: "সবুজ CNG-র", cng2: "নীল CNG-র", rickshaw: "রিকশার", van: "ভ্যানের", bus: "বাসের", truck: "ট্রাকের" };

export type Direction = "up" | "down" | "left" | "right";
export type HintInfo = { move: Move; direction: Direction; steps: number; left: number; line: string };

export const DIRECTION_WORD: Record<Direction, string> = { up: "ওপরে", down: "নিচে", left: "বাঁয়ে", right: "ডানে" };
export const directionOf = (down: boolean, from: number, to: number): Direction => down ? (to < from ? "up" : "down") : (to < from ? "left" : "right");

export function explainHint(game: Game): HintInfo | null {
  const path = game.won ? null : solve(game.lay, game.pos);
  if (!path?.length) return null;
  const move = path[0], { lay } = game, car = lay.cars[move.car];
  const direction = directionOf(car.down, move.from, move.to), steps = Math.abs(move.to - move.from);
  const where = `${DIRECTION_WORD[direction]} ${bn(steps)} ঘর`;
  const left = path.length - 1;
  const grid = occupancy(lay, game.pos);
  const direct = blockers(lay, game.pos, grid);
  let why: string;
  if (move.car < lay.heroes) {
    why = move.to === 0 ? `পথ খোলা। ${NAMES[car.kind]} ওপরে তুলে বের করো।` : `${NAMES[car.kind]} ${where} সরাও, তাহলে অন্য গাড়ির জায়গা হবে।`;
  } else if (direct.includes(move.car)) {
    const owner = lay.cars.findIndex((c, h) => h < lay.heroes && game.pos[h] > 0 && Array.from({ length: game.pos[h] }, (_, row) => grid[row * COLS + c.line]).includes(move.car));
    why = `${NAMES[car.kind]} ${OF[lay.cars[Math.max(0, owner)].kind]} পথ আটকে আছে। ${where} সরাও।`;
  } else {
    const after = game.pos.slice();
    after[move.car] = move.to;
    const next = occupancy(lay, after);
    const freed = direct.find(b => {
      const [lowBefore, highBefore] = reach(lay, grid, game.pos, b), [lowAfter, highAfter] = reach(lay, next, after, b);
      return lowAfter < lowBefore || highAfter > highBefore;
    });
    why = freed === undefined
      ? `${NAMES[car.kind]} ${where} সরাও। এতে পরের চালগুলোর জায়গা হবে।`
      : `${NAMES[car.kind]} ${where} সরাও। তাহলে ${NAMES[lay.cars[freed].kind]} সরার জায়গা পাবে।`;
  }
  return { move, direction, steps, left, line: `${why}${left > 0 ? ` তারপর আর ${bn(left)} চাল।` : ""}` };
}

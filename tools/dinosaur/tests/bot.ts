// A headless digger that brushes the way a child does: fingers move at about 300 units a second (a phone is ~1.05 px per unit),
// lift between scribbles (0.35 s), aim with an error, and where the sand shows a mound and crack it goes straight to them;
// where it doesn't, it sweeps the pit in rows. It reports how many seconds the dig took.
import { makeRng, pick } from "../../../shared/game-core";
import { allBonesFound, BRUSH_R, PIT, type Pit } from "../lib/pit";
import { stamp, sweep } from "../lib/pit.hot";

const SPEED = 300, LIFT = 0.35;
export type Dug = { seconds: number; strokes: number; found: boolean };

export function digBot(pit: Pit, marks: boolean, seed: number, limit = 120): Dug {
  const rng = makeRng(seed);
  let stroke = 0, seconds = 0, strokes = 0, x = PIT.width / 2, y = PIT.height / 2;
  const noop = () => undefined;
  const move = (nx: number, ny: number) => { sweep(pit, x, y, nx, ny, BRUSH_R, stroke, noop); seconds += Math.hypot(nx - x, ny - y) / SPEED; x = nx; y = ny; };
  const lift = () => { seconds += LIFT; };
  const aim = (v: number) => v + (pick(rng, 29) - 14);
  // one scribble in seven lands a little off and has to be redone
  const slip = () => pick(rng, 7) === 0 ? 30 : 0;
  const scribble = (cx: number, cy: number) => {
    stroke++; strokes++;
    // arrive, then three passes across a 72-wide box, then lift
    const off = slip();
    x = aim(cx) - 36 + off; y = aim(cy) - 14 + off; seconds += 0.25;
    stamp(pit, x, y, BRUSH_R, stroke);
    for (const dy of [-14, 0, 14]) { move(cx + off + (x < cx + off ? 36 : -36), aim(cy) + off + dy); }
    lift();
  };
  if (marks) {
    for (let guard = 0; guard < 30 && !allBonesFound(pit) && seconds < limit; guard++) {
      const todo = pit.bones.filter((_, i) => !pit.foundBone[i]).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));
      scribble(todo[0].x, todo[0].y + 4);
    }
  } else {
    for (let pass = 0; pass < pit.depth + 1 && !allBonesFound(pit) && seconds < limit; pass++) {
      const rows = Math.ceil(PIT.height / 36);
      for (let row = 0; row < rows && !allBonesFound(pit) && seconds < limit; row++) {
        stroke++; strokes++;
        const ry = 20 + row * 36 + (pass % 2) * 18, left = row % 2 === 0;
        x = left ? 4 : PIT.width - 4; y = Math.min(PIT.height - 4, ry); seconds += 0.3;
        stamp(pit, x, y, BRUSH_R, stroke);
        move(left ? PIT.width - 4 : 4, y);
        lift();
      }
    }
  }
  return { seconds, strokes, found: allBonesFound(pit) };
}

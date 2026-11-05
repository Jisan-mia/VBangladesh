// What the live board draws from: the cached street, one cached sprite a vehicle, and the numbers draw.hot.ts needs. Made when
// the jam or the board's size changes, never per frame.
import { MAX_CARS, type Layout } from "./board";
import { boardHeight, boardWidth, drawStreet, drawVehicle } from "./art";

export type View = {
  cell: number; width: number; height: number; n: number;
  street: HTMLCanvasElement | null;
  sprites: Array<HTMLCanvasElement | null>;
  /** The fixed lane of each vehicle, whether it goes up and down, and its length in cells. */
  line: Float32Array; down: Uint8Array; len: Float32Array;
};

export const makeView = (): View => ({
  cell: 0, width: 0, height: 0, n: 0, street: null, sprites: [],
  line: new Float32Array(MAX_CARS), down: new Uint8Array(MAX_CARS), len: new Float32Array(MAX_CARS),
});

function paint(w: number, h: number, ratio: number, art: (c: CanvasRenderingContext2D) => void) {
  const sheet = document.createElement("canvas");
  sheet.width = Math.ceil(w * ratio); sheet.height = Math.ceil(h * ratio);
  const c = sheet.getContext("2d")!;
  c.scale(ratio, ratio);
  art(c);
  return sheet;
}

/** Fills `v` for a jam at a cell size: the street (with its gaps and walls) and a sprite per vehicle, crisp up to DPR 2. */
export function buildView(v: View, lay: Layout, world: number, cell: number) {
  const ratio = Math.min(2, typeof window === "undefined" ? 1 : window.devicePixelRatio || 1);
  v.cell = cell; v.width = boardWidth(cell); v.height = boardHeight(cell); v.n = lay.cars.length;
  const exits = lay.cars.slice(0, lay.heroes).map(car => car.line);
  v.street = paint(v.width, v.height, ratio, c => drawStreet(c, cell, world, exits, lay.walls));
  v.sprites = lay.cars.map((car, i) => {
    v.line[i] = car.line; v.down[i] = car.down ? 1 : 0; v.len[i] = car.len;
    return paint((car.down ? 1 : car.len) * cell, (car.down ? car.len : 1) * cell, ratio, c => drawVehicle(c, car, 0, 0, cell));
  });
}

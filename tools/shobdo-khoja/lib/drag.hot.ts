// The pen on the page: runs on every pointermove, so it only writes into arrays made once by the caller.
// No objects, arrays, closures or strings are made here (npm run lint:games checks it).

/** The eight directions as octants of atan2 on screen (y grows down): 0 →, 1 ↘, 2 ↓, 3 ↙, 4 ←, 5 ↖, 6 ↑, 7 ↗. */
const ROW = Int8Array.of(0, 1, 1, 1, 0, -1, -1, -1);
const COL = Int8Array.of(1, 1, 0, -1, -1, -1, 0, 1);
const EIGHTH = Math.PI / 4;
/** A held direction survives a wobble this far past the halfway line to its neighbour (about 12°). */
const HOLD = Math.PI / 8 + 0.21;

/** The octant a drag points to. Once a direction is held, it is kept until the finger turns well past the halfway line. */
export function octantOf(dx: number, dy: number, held: number) {
  const angle = Math.atan2(dy, dx);
  const raw = ((Math.round(angle / EIGHTH) % 8) + 8) % 8;
  if (held < 0 || held === raw) return raw;
  let off = Math.abs(angle - held * EIGHTH);
  if (off > Math.PI) off = 2 * Math.PI - off;
  return off <= HOLD ? held : raw;
}

/** The cell under a point given in cell units from the grid's top-left corner, or -1 outside. */
export function cellAt(fx: number, fy: number, size: number) {
  if (fx < 0 || fy < 0 || fx >= size || fy >= size) return -1;
  return Math.floor(fy) * size + Math.floor(fx);
}

/**
 * The straight run a finger has drawn: from the centre of `from`, dragged (dx, dy) cell-widths. Writes the cells into
 * `out`, and into `meta` the count (meta[0]) and the held octant (meta[1], -1 until the run reaches a second cell).
 * Pass the same `meta` back on the next move so the direction holds against a wobble. Cut at the grid's edge.
 */
export function dragInto(out: Int16Array, meta: Int16Array, from: number, dx: number, dy: number, size: number) {
  out[0] = from;
  meta[0] = 1;
  if (dx * dx + dy * dy < 0.25) return 1;
  const oct = octantOf(dx, dy, meta[1]), dr = ROW[oct], dc = COL[oct];
  const steps = Math.round((dx * dc + dy * dr) / (dc * dc + dr * dr));
  const row = Math.floor(from / size), col = from % size;
  let count = 1;
  for (let k = 1; k <= steps && count < out.length; k++) {
    const r = row + dr * k, c = col + dc * k;
    if (r < 0 || r >= size || c < 0 || c >= size) break;
    out[count] = r * size + c;
    count++;
  }
  meta[0] = count;
  if (count > 1) meta[1] = oct;
  return count;
}

/** True when the first `count` cells of `a` equal the first `count` of `b`: did the stroke change this move? */
export function sameRun(a: Int16Array, b: Int16Array, count: number, before: number) {
  if (count !== before) return false;
  for (let k = 0; k < count; k++) if (a[k] !== b[k]) return false;
  return true;
}

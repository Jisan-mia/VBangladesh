// The hit test that runs on every pointer move over the cloth: which open gap is under the finger. Allocation-free
// (npm run lint:games checks it): the gap midpoints are typed arrays built once per cloth size in quilt.ts.

/** The open gap nearest (x, y) in board units, within `reach` of its middle (so a tap on a finished stitch doesn't jump to a neighbour), or -1. */
export function nearestGap(x: number, y: number, midX: Float32Array, midY: Float32Array, drawn: readonly boolean[], reach: number) {
  let best = -1, bestDistance = reach * reach;
  for (let edge = 0; edge < midX.length; edge++) {
    if (drawn[edge]) continue;
    const dx = x - midX[edge], dy = y - midY[edge], distance = dx * dx + dy * dy;
    if (distance < bestDistance) { best = edge; bestDistance = distance; }
  }
  return best;
}

/** One arrow-key step of the keyboard cursor over the gaps: ±1 along the reading order, ±span a row; stays put at the edges. */
export function stepCursor(current: number, step: number, edges: number) {
  const next = current + step;
  return next >= 0 && next < edges ? next : current;
}

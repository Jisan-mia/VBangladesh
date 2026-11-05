// The orbit board: a 360×470 box with the Sun in the top-left corner; every planet sits on its own orbit.
export const BOARD = { width: 360, height: 470, sunR: 78 } as const;
const ANGLES: Record<4 | 8, readonly number[]> = { 4: [21, 75, 26, 66], 8: [66, 20, 54, 75, 31, 66, 40, 54] };

export function orbitRadius(index: number, count: 4 | 8) {
  return 118 + index * (440 - 118) / (count - 1);
}
/** Where orbit `index` (0 = nearest the Sun) puts its planet, in board units. */
export function spot(index: number, count: 4 | 8) {
  const r = orbitRadius(index, count), angle = ANGLES[count][index] * Math.PI / 180;
  return { x: Math.round(r * Math.cos(angle)), y: Math.round(r * Math.sin(angle)) };
}
/** Where the rocket parks beside a planet of drawn radius `r`: up and to the right, kept inside the board. */
export function parkBeside(index: number, count: 4 | 8, r: number) {
  const at = spot(index, count);
  return { x: Math.min(BOARD.width - 20, at.x + r * 0.7 + 14), y: Math.max(22, at.y - r * 0.7 - 14) };
}
/** The rocket before it has gone anywhere: at the Sun's rim. */
export const HOME = { x: 66, y: 64 } as const;

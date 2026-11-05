// A lifted piece follows the finger: run on every pointermove, so it does nothing but set one transform.
// The piece is `PIECE` px across and rides above the fingertip so the finger never hides it.
export const PIECE = 64;
export const LIFT = 44;

export function place(node: HTMLElement | null, x: number, y: number) {
  // lint-games-allow: one transform string per pointermove is the cheapest way to move a DOM node; nothing else allocates
  if (node) node.style.transform = `translate3d(${x - PIECE / 2}px,${y - PIECE / 2 - LIFT}px,0)`;
}

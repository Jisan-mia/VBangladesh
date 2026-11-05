// The end screen's count-up, run every animation frame for about a second. Allocation-free: the strings for every
// frame are built once (when the end screen mounts) and this only picks one and writes it when it changes.
export const COUNT_FRAMES = 24;
export const COUNT_MS = 900;

export type CountUp = { nodes: (HTMLElement | null)[]; frames: string[][]; last: Int16Array };

/** Paint every counter at progress `t` (0..1) with an ease-out, so the numbers rush and then settle. */
export function paintCount(count: CountUp, t: number) {
  const clamped = t >= 1 ? 1 : t <= 0 ? 0 : t;
  const left = 1 - clamped;
  const frame = Math.round((1 - left * left * left) * (COUNT_FRAMES - 1));
  for (let index = 0; index < count.nodes.length; index++) {
    const node = count.nodes[index];
    if (!node || count.last[index] === frame) continue;
    count.last[index] = frame;
    node.textContent = count.frames[index][frame];
  }
}

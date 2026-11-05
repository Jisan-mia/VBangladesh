// Numbers for the frame loop. No allocation: every function takes and returns plain numbers.

/** The phase clock: ms spent before, plus the time since it last started running (never negative, so a resume's breath holds it). */
export function clockMs(spent: number, since: number, running: boolean, now: number) {
  return running ? spent + Math.max(0, now - since) : spent;
}

/** How many of the first `len` notes have started by `el` ms (from `from`, the count already known). */
export function notesStarted(beats: ArrayLike<number>, len: number, beat: number, el: number, from: number) {
  let index = from;
  while (index < len && beats[index] * beat <= el) index++;
  return index;
}

/** The note lit at `el`, given how many have started: the latest one while its light lasts, else -1. */
export function litNote(beats: ArrayLike<number>, started: number, beat: number, on: number, el: number) {
  if (started <= 0) return -1;
  return el < beats[started - 1] * beat + on ? started - 1 : -1;
}

export const clamp01 = (value: number) => value < 0 ? 0 : value > 1 ? 1 : value;

/** A number counting up from 0 to `value` as `t` goes 0 → 1, easing out. */
export function countAt(value: number, t: number) {
  const k = clamp01(t);
  return Math.round(value * (1 - (1 - k) * (1 - k)));
}

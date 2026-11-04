// Small per-frame maths: the clock, the count-up of the end screen's numbers, and easing. No allocation.

/** Milliseconds on a clock that was stopped with `base` banked and, when running, started at `since`. */
export const clockMs = (base: number, since: number | null, now: number) => (since === null ? base : base + Math.max(0, now - since));

/** easeOutCubic. */
export const ease = (t: number) => 1 - (1 - Math.min(1, Math.max(0, t))) ** 3;

/** A number counting up to `value` at progress `t` (0..1), eased. */
export const countAt = (value: number, t: number) => Math.round(value * ease(t));

/** The ripple delay of a cell when the picture blooms: it spreads from the top-left corner. */
export const rippleMs = (row: number, col: number) => (row + col) * 35;

/** The whole bloom takes this long to reach the last cell of a size×size board. */
export const bloomMs = (size: number) => rippleMs(size - 1, size - 1) + 350;

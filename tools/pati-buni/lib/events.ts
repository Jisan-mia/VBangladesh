// Event codes in a game's ring (type, a, b, c), read by the component for sound and juice.
export const EVENT_RING = 16;
/** a strip locked: a kind, b 1 for a straight drop. */
export const LOCK = 1;
/** rows weave: a count, b 1 when gold, c the lowest row. */
export const CLEAR = 2;
export const SPAWN = 3;
/** the frame filled for good. */
export const OVER = 4;
/** the goal is woven. */
export const WIN = 5;
/** an old row pushed up from below. */
export const RISE = 6;
/** the frame filled and its bottom rows rolled up: a rolls left. */
export const ROLL = 7;
/** a সুই slipped into a hole: a x, b y. */
export const SUI_IN = 8;
/** a wet strip refused to turn. */
export const STUCK = 9;

// The night's small enums, kept apart so game.ts and step.hot.ts can both read them without an import cycle.

/** 0 not in yet, 1 flying, 2 zapped, 3 bit and gone, 4 flew off at dawn. */
export const WAIT = 0, FLY = 1, ZAPPED = 2, BIT = 3, GONE = 4;
/** Where a mosquito is in its current leg: flying in, hovering, the tell before the dive, diving. */
export const ENTERING = 0, HOVER = 1, TELLING = 2, DIVING = 3;
/** The night's end: still on, dawn (won), woken up (lost). */
export const ON = 0, WON = 1, LOST = 2;
/** What just happened, for the sounds and the pops. */
export const EV_ZAP = 0, EV_BITE = 1, EV_SLAP = 2, EV_BOSS_HIT = 3, EV_BOSS_DOWN = 4, EV_MISS = 5, EV_NEAR = 6, EV_DAWN_HELD = 7, EV_BOSS_IN = 8;

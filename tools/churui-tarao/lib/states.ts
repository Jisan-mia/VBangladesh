// The afternoon's small enums, kept apart so afternoon.ts and step.hot.ts can both read them without an import cycle.

/** 0 not yet set off, 1 flying in (or to a new spot), 2 sitting and pecking, 3 hopping aside, 4 shooed, 5 left at dusk, 6 on the মাথাল. */
export const WAIT = 0, FLYING = 1, SITTING = 2, HOPPING = 3, SHOOED = 4, GONE = 5, PERCHED = 6;
/** The afternoon's end: still on, dusk came, all the grain is gone. */
export const ON = 0, DUSK = 1, LOST = 2;
/** What just happened, for the sounds and the pops. */
export const EV_SHOO = 0, EV_HOP = 1, EV_BOSS_HIT = 2, EV_BOSS_GONE = 3, EV_MISS = 4, EV_NEAR = 5, EV_LAND = 6, EV_PECK = 7, EV_BOSS_IN = 8,
  EV_DUSK_HELD = 9, EV_TENTH = 10;

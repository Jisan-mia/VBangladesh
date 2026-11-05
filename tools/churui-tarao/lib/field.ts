// The paddy field in field units. The simulation lives in this W × H box; the canvas scales it to fit the stage, anchored to
// the bottom edge, and paints more sky above (and more field to the sides) on a tall or wide stage, so a phone and a laptop
// play the same afternoon.

export const W = 360, H = 540;
/** The sky reaches above the box's top edge, so a short stage still shows the HUD over sky, never over the paddy. */
export const TOP = -110;
/** Where the far paddy meets the village line. */
export const HORIZON = 262;
/** Where birds may land: on the paddy, below the HUD, clear of the front clumps. */
export const FIELD = { left: 30, right: 330, top: 300, bottom: 498 } as const;
/** The কাকতাড়ুয়া stands in the far paddy on the right; nothing lands at its feet. */
export const SCARECROW = { x: 298, base: 326, height: 156, clear: 34 } as const;
/** The tip of its মাথাল, where the ঝুঁটি শালিক perches out of reach. */
export const HAT_X = SCARECROW.x, HAT_Y = SCARECROW.base - SCARECROW.height * 0.9;

/** A clap's reach from the tap (38 units is 61 CSS px across even on a 320 px phone), the "একটুর জন্য" ring, a boss's extra body. */
export const HIT_R = 38, NEAR_R = 62, BOSS_R = 10;
/** Past this share of its flight, a bird can be shooed at its landing spot (its shadow marks the spot). */
export const TAPPABLE = 0.5;
/** Seconds: from touchdown to the first peck (a boss is quicker), a শালিক's hop aside, a boss's flight to a new spot, its time on the মাথাল. */
export const FIRST_PECK = 0.55, BOSS_PECK = 0.3, HOP = 0.38, BOSS_FLY = 1.05, PARROT_FLY = 0.75, PERCH = 1.3, TO_HAT = 0.5;
/** A boss can't be hit again this soon (one clap, one hit). */
export const IMMUNE = 0.4;
/** Birds landing within TOGETHER seconds of each other sit at least MIN_GAP apart, so every tap has one clear target. */
export const MIN_GAP = 70, TOGETHER = 1.3, LOOKBACK = 3.5, SPREAD = 110;
/** The arrival chevron shows this long before a bird flies in. */
export const WARN = 0.7;

export const clampX = (x: number) => Math.min(FIELD.right, Math.max(FIELD.left, x));
export const clampY = (y: number) => Math.min(FIELD.bottom, Math.max(FIELD.top, y));
export const nearScarecrow = (x: number, y: number) => Math.abs(x - SCARECROW.x) < SCARECROW.clear && y < SCARECROW.base + 18;
/** Farther birds (higher on the paddy) draw smaller. */
export const depth = (y: number) => 0.82 + 0.3 * (y - FIELD.top) / (FIELD.bottom - FIELD.top);

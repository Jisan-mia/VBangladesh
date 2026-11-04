// The room in field units. The simulation lives in this W × H box; the canvas scales it to fit the stage and paints
// the walls around it, so a phone and a laptop play the same night.

export const W = 360, H = 540;
/** The field reaches above the room's top edge: mosquitoes hover up there, under the ceiling, and a short stage still shows it all. */
export const TOP = -100;

/** The sleeper's head on the pillow (what a mosquito on a pillow night is after) and where it bites. */
export const HEAD_X = 180, HEAD_Y = 446;
export const BITE_X = HEAD_X, BITE_Y = 440;
/** The top edge of the মশারি on a net night; holes sit on it. */
export const NET_TOP = 366, NET_LEFT = 72, NET_RIGHT = 288, NET_BOTTOM = 484;
export const FLOOR_Y = 512;

/** Where each entry lets a mosquito in: 0 the window, 1 the half-open door, 2 the ঘুলঘুলি high on the right. */
export const WINDOW = { x: 34, y: 96, w: 78, h: 82 } as const;
export const DOOR = { x: 0, y: 262, w: 30, h: 250 } as const;
export const VENT = { x: 318, y: 146, w: 36, h: 30 } as const;
/** The edge point each entry's arrival chevron sits at. */
export const ENTRY_X = [WINDOW.x + WINDOW.w / 2, 10, VENT.x + VENT.w / 2] as const;
export const ENTRY_Y = [WINDOW.y + WINDOW.h + 12, 360, VENT.y + VENT.h + 12] as const;

/** The bat head's reach from the tap, the "একটুর জন্য" ring, the face a miss must not land on, and a boss's extra body. */
export const HIT_R = 34, NEAR_R = 58, FACE_R = 18, BOSS_R = 12;

/** Seconds: flying in, flying in fast, back off after a boss hit, the tell before a dive, the shortest dive. */
export const ENTER = 1, ENTER_FAST = 0.6, RETREAT = 0.8, TELL = 0.35, TELL_FAST = 0.5, TELL_BOSS = 0.6, MIN_DIVE = 0.8;
/** A চটপটে মশা hops this many times, each dash this long. */
export const HOPS = 3, DASH = 0.22;
/** A whole ঝাঁক landing within this many seconds is one bite. */
export const SWARM_BITE = 0.6;
/** A boss can't be hit again this soon (one tap, one hit). */
export const IMMUNE = 0.45;

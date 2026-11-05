// The road in world units: three lanes up the screen, 24 units a মিটার. Shared by the course, the ride, the bots and the scene.

export const W = 360;
export const LANES = 3, LANE_W = 76, ROAD_L = (W - LANES * LANE_W) / 2, ROAD_R = ROAD_L + LANES * LANE_W;
export const laneX = (lane: number) => ROAD_L + LANE_W * (lane + 0.5);
export const UNIT = 24;
/** The bike's length (front wheel to carrier) and its hit width, narrower than drawn, to be kind. */
export const BIKE_LEN = 46, BIKE_W = 16;
/** One lane change takes this long on the road, and this long in mud. */
export const SWITCH_T = 0.12, MUD_T = 0.3;
/** Time a person needs to see the way and start moving, touch lag on a cheap phone included. */
export const SLACK = 0.36;
/** A dodge this late (seconds before you'd have hit it) rings the bell. */
export const NEAR_T = 0.3;

/** Things on the road. */
export const PUDDLE = 0, GOAT = 1, CART = 2, COW = 3, LETTER = 4, VAN = 5, WALK_GOAT = 6, WALK_COW = 7, DOG = 8;
export const KIND_COUNT = 9;
/** Hit boxes: `w` across, `len` along the road. A crossing goat or cow walks sideways, so it is wider than long. */
export const SPEC: readonly { w: number; len: number }[] = [
  { w: 54, len: 34 },
  { w: 28, len: 42 },
  { w: 48, len: 78 },
  { w: 40, len: 90 },
  { w: 34, len: 22 },
  { w: 50, len: 84 },
  { w: 38, len: 26 },
  { w: 60, len: 38 },
  { w: 20, len: 34 },
];
export const solid = (kind: number) => kind !== LETTER;

/** A ভ্যান starts rolling towards you when you are this far off, at this speed. */
export const VAN_TRIG = 600, VAN_V = 150;
/** A crossing goat or cow sets off when you are this far off, and walks a lane in WALK_T seconds. */
export const WALK_TRIG = 420, WALK_T = 0.9;
/** A dog starts this far behind the bike's back wheel and runs this much faster than the bike. */
export const DOG_BACK = 210, DOG_V = 135;
/** A gust's arrows show this many seconds before it pushes; the push takes GUST_T a lane. */
export const GUST_WARN = 1, GUST_T = 0.22;
/** A gate takes its letter while the bike's front is within this window around it, in the lane beside it. */
export const DELIVER_BEFORE = 60, DELIVER_AFTER = 40;
/** A bump halves the speed, and it climbs back over this long. */
export const RECOVER_T = 1.2;

/** How many lanes a rider can cross in `time` seconds and still be safe (switching at `switchT` a lane). */
export const reachIn = (time: number, switchT = SWITCH_T) => Math.min(2, Math.max(0, Math.floor((time - SLACK) / switchT + 1e-9)));

/** True when from every lane in `from` (a bitmask) some lane in `to` is at most `reach` lanes away. */
export function fair(from: number, to: number, reach: number) {
  for (let lane = 0; lane < LANES; lane++) {
    if (!(from & (1 << lane))) continue;
    let ok = false;
    for (let other = 0; other < LANES; other++) if (to & (1 << other) && Math.abs(other - lane) <= reach) ok = true;
    if (!ok) return false;
  }
  return true;
}

/** The furthest any lane in `from` is from `lane`. */
export function farthest(from: number, lane: number) {
  let most = 0;
  for (let other = 0; other < LANES; other++) if (from & (1 << other)) most = Math.max(most, Math.abs(other - lane));
  return most;
}

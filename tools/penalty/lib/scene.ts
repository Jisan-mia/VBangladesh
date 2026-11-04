// Drawing for the four grounds: one palette per cup, the backdrop and the field (pre-rendered once per match and size), the goal
// and its net, the keeper, the kicker seen from behind, the ball, the flag and the aim marks. All in board units (360×340, with
// `top` extra units above and `bottom` below); callers scale. Nothing here runs per frame except the figure functions, which
// draw.hot.ts calls with numbers only (no allocation inside them).
import { GH, GTOP, GW, GX, GY, H, SPOT_X, SPOT_Y, W } from "./swipe";
import { worldOf } from "./levels";

export const SKIN = "#a8714a";
const SKIN2 = "#8d5a3b", HAIR = "#1b1410", BAMBOO = "#d8b46a", NODE = "#9c7a3c";

export type Palette = {
  name: "school" | "dusk" | "lights" | "national";
  sky: readonly [string, string]; grass: readonly [string, string]; dust: string; chalk: string;
  wall: string; wallEdge: string; shirts: readonly string[];
  /** Rows of people above the wall (0: kids sit on the wall only). */
  rows: number; bamboo: boolean; night: boolean;
  /** The danger rim's colour, and the card and title glow. */
  glow: string;
};
export const PALETTES: Record<Palette["name"], Palette> = {
  school: { name: "school", sky: ["#f6d9a8", "#fbeccb"], grass: ["#7fae4e", "#88b756"], dust: "#c7a46a", chalk: "#f4f1e6", wall: "#d7c7a4", wallEdge: "#c2b08a",
    shirts: ["#e05d4a", "#3b7dd8", "#f2c14e", "#ffffff", "#7b5ea7", "#2fa36b", "#ef8a3c"], rows: 0, bamboo: true, night: false, glow: "#ffd23f" },
  dusk: { name: "dusk", sky: ["#e8814c", "#f7c98a"], grass: ["#76a049", "#80aa51"], dust: "#c29a63", chalk: "#f6ecd8", wall: "#b58d5e", wallEdge: "#9a754b",
    shirts: ["#c94f3d", "#2e6eb5", "#e8b13c", "#f4efe6", "#6c4f96", "#2a8d5e", "#d9762e", "#444b55"], rows: 2, bamboo: true, night: false, glow: "#ffb347" },
  lights: { name: "lights", sky: ["#121a33", "#2a3762"], grass: ["#4c8d44", "#56984c"], dust: "#a58b60", chalk: "#f4f4ee", wall: "#5d6577", wallEdge: "#474e5f",
    shirts: ["#e2604c", "#4d8ae0", "#f2c14e", "#f4f4f4", "#9a7ac9", "#3fb57a", "#f29b4a", "#c9d1de"], rows: 4, bamboo: false, night: true, glow: "#ffcf5a" },
  national: { name: "national", sky: ["#0b1d17", "#1b3b2f"], grass: ["#3d8c47", "#46975a"], dust: "#9e8a5e", chalk: "#f6f6f0", wall: "#33414f", wallEdge: "#26313c",
    shirts: ["#e8463c", "#2f9e5a", "#f2c14e", "#ffffff", "#3b7dd8", "#f07f2e", "#d9d9d9", "#8e5ec9"], rows: 6, bamboo: false, night: true, glow: "#ffe08a" },
};
export const paletteFor = (level: number): Palette => PALETTES[(["school", "dusk", "lights", "national"] as const)[worldOf(level)]];

/** The wall's top edge, where the crowd sits and the stands rise from. */
export const WALL_Y = 74;

/** Sky, scenery and the stands from `-top` down to the wall. */
function drawBackdrop(c: CanvasRenderingContext2D, p: Palette, top: number) {
  const sky = c.createLinearGradient(0, -top, 0, WALL_Y);
  sky.addColorStop(0, p.sky[0]); sky.addColorStop(1, p.sky[1]);
  c.fillStyle = sky; c.fillRect(0, -top, W, top + WALL_Y + 2);
  if (p.name === "school") {
    c.fillStyle = "#4f7d3a";
    for (const [x, y, r] of [[18, 40, 26], [52, 30, 22], [318, 34, 26], [350, 46, 20], [250, 26, 18]] as const) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
    c.strokeStyle = "#7a5a34"; c.lineWidth = 3;
    for (const x of [98, 284]) {
      c.beginPath(); c.moveTo(x, 64); c.quadraticCurveTo(x + 4, 30, x + 2, 12); c.stroke();
      c.fillStyle = "#3f6e30";
      for (let k = 0; k < 5; k++) { c.beginPath(); c.ellipse(x + 2 + Math.cos(k * 1.26) * 10, 12 + Math.sin(k * 1.26) * 4, 12, 3.5, k * 1.26, 0, Math.PI * 2); c.fill(); }
    }
    // The one-storey school: lime-washed walls, green doors and windows, a tin roof edge.
    c.fillStyle = "#efe0b4"; c.fillRect(60, 40, 240, 36);
    c.fillStyle = "#b9704a"; c.fillRect(56, 35, 248, 6);
    c.fillStyle = "#3d7a5a";
    for (let x = 72; x < 296; x += 28) c.fillRect(x, 50, 12, x % 56 === 16 ? 26 : 14);
    // A kite caught high in the sky, when there's room above.
    if (top > 40) { c.fillStyle = "#e05d4a"; c.beginPath(); c.moveTo(70, -top * 0.5); c.lineTo(80, -top * 0.5 + 10); c.lineTo(70, -top * 0.5 + 22); c.lineTo(60, -top * 0.5 + 10); c.closePath(); c.fill(); }
  } else if (p.name === "dusk") {
    // A low sun, tin-roofed houses, electric poles and their wires, a bank of earth where people stand.
    const sun = c.createRadialGradient(280, 20, 4, 280, 20, 70);
    sun.addColorStop(0, "#fff1c4"); sun.addColorStop(0.3, "#ffd48acc"); sun.addColorStop(1, "#ffd48a00");
    c.fillStyle = sun; c.fillRect(180, -top, 180, top + 100);
    for (let x = -10, i = 0; x < W; x += 46, i++) {
      const h = 18 + (i * 7) % 12;
      c.fillStyle = i % 2 ? "#7d6a5a" : "#8c7663"; c.fillRect(x, WALL_Y - 26 - h, 40, h + 6);
      c.fillStyle = i % 3 ? "#9aa7b2" : "#86939e";
      c.beginPath(); c.moveTo(x - 4, WALL_Y - 26 - h); c.lineTo(x + 20, WALL_Y - 40 - h); c.lineTo(x + 44, WALL_Y - 26 - h); c.closePath(); c.fill();
    }
    c.strokeStyle = "#3b2a22"; c.lineWidth = 2;
    for (const x of [40, 210, 340]) { c.beginPath(); c.moveTo(x, WALL_Y - 4); c.lineTo(x, -6); c.stroke(); c.beginPath(); c.moveTo(x - 8, 0); c.lineTo(x + 8, 0); c.stroke(); }
    c.lineWidth = 0.8; c.beginPath(); c.moveTo(40, 2); c.quadraticCurveTo(125, 14, 210, 2); c.quadraticCurveTo(275, 14, 340, 2); c.stroke();
  } else {
    // Stadium stands: concrete tiers, and two floodlight towers whose glow spills on the night sky.
    const tiers = p.rows + 1;
    for (let k = 0; k < tiers; k++) {
      const y = WALL_Y - (k + 1) * 13;
      if (y + 13 < -top) break;
      c.fillStyle = k % 2 ? p.wall : p.wallEdge; c.fillRect(0, y, W, 13);
    }
    c.fillStyle = "#00000033"; c.fillRect(0, WALL_Y - 2, W, 2);
    for (const x of [16, 344]) {
      c.fillStyle = "#2b3140"; c.fillRect(x - 2, -top, 4, top + WALL_Y);
      const glow = c.createRadialGradient(x, -top + 14, 2, x, -top + 14, 120);
      glow.addColorStop(0, "#fffbe0"); glow.addColorStop(0.15, "#fff4c06b"); glow.addColorStop(1, "#fff4c000");
      c.fillStyle = glow; c.fillRect(x - 120, -top - 20, 240, 240);
      c.fillStyle = "#fffbe8"; c.fillRect(x - 10, -top + 8, 20, 10);
    }
    if (p.name === "national") {
      // Bunting across the top of the stands.
      const y = Math.max(-top + 30, WALL_Y - p.rows * 13 + 6);
      c.strokeStyle = "#ffffff55"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(0, y); c.quadraticCurveTo(W / 2, y + 12, W, y); c.stroke();
      for (let i = 0; i < 18; i++) {
        const x = 10 + i * 20, sag = y + 12 * (1 - ((x - W / 2) / (W / 2)) ** 2);
        c.fillStyle = p.shirts[i % p.shirts.length]; c.beginPath(); c.moveTo(x - 5, sag); c.lineTo(x + 5, sag); c.lineTo(x, sag + 9); c.closePath(); c.fill();
      }
    }
  }
  // The boundary wall (or the stand's front).
  c.fillStyle = p.wall; c.fillRect(0, WALL_Y, W, 14);
  c.fillStyle = p.wallEdge; c.fillRect(0, WALL_Y + 12, W, 3);
}

/** The grass in soft perspective stripes, worn to dust in the goal mouth and round the spot, and the chalk. */
function drawGrass(c: CanvasRenderingContext2D, p: Palette, bottom: number) {
  const y0 = WALL_Y + 15, end = H + bottom;
  c.fillStyle = p.grass[0]; c.fillRect(0, y0, W, end - y0);
  c.fillStyle = p.grass[1];
  for (let k = 0; k < 7; k++) {
    const a = y0 + Math.pow(k / 7, 1.6) * (end - y0), b = y0 + Math.pow((k + 0.5) / 7, 1.6) * (end - y0);
    c.fillRect(0, a, W, b - a);
  }
  if (p.night) {
    // Floodlit: a warm pool on the goal mouth, darker towards the edges.
    const pool = c.createRadialGradient(GX, GY + 40, 20, GX, GY + 40, 260);
    pool.addColorStop(0, "#fff6d022"); pool.addColorStop(1, "#00000044");
    c.fillStyle = pool; c.fillRect(0, y0, W, end - y0);
  }
  c.fillStyle = p.dust; c.globalAlpha = 0.55;
  c.beginPath(); c.ellipse(GX, GY + 6, 70, 12, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(SPOT_X, SPOT_Y + 4, 34, 11, 0, 0, Math.PI * 2); c.fill();
  c.globalAlpha = 1;
  c.strokeStyle = p.chalk; c.lineWidth = 2; c.globalAlpha = 0.85;
  c.beginPath(); c.moveTo(0, GY); c.lineTo(W, GY); c.stroke();
  c.beginPath(); c.moveTo(GX - GW - 30, GY); c.lineTo(GX - GW - 44, GY + 34); c.lineTo(GX + GW + 44, GY + 34); c.lineTo(GX + GW + 30, GY); c.stroke();
  c.lineWidth = 2.5;
  c.beginPath(); c.moveTo(-20, GY + 116); c.lineTo(W + 20, GY + 116); c.stroke();
  c.globalAlpha = 1;
  c.fillStyle = p.chalk; c.beginPath(); c.ellipse(SPOT_X, SPOT_Y + 8, 5, 2.4, 0, 0, Math.PI * 2); c.fill();
}

const BACK = { left: GX - GW + 14, right: GX + GW - 14, top: GTOP - 12, bottom: GY - 14 };

/** The net behind the posts: a loose fishing-net mesh (a finer white net in the stadiums). */
export function drawNet(c: CanvasRenderingContext2D, fine = false) {
  c.strokeStyle = "#ffffff"; c.lineWidth = fine ? 0.6 : 0.8; c.globalAlpha = 0.55;
  const step = fine ? 9 : 12;
  c.beginPath();
  for (let k = -16; k <= 34; k++) {
    const x0 = BACK.left + k * step;
    c.moveTo(x0, BACK.top); c.lineTo(x0 + (BACK.bottom - BACK.top), BACK.bottom);
    c.moveTo(x0, BACK.bottom); c.lineTo(x0 + (BACK.bottom - BACK.top), BACK.top);
  }
  c.save(); c.clip(new Path2D(`M${BACK.left} ${BACK.top} H${BACK.right} V${BACK.bottom} H${BACK.left} Z`));
  c.stroke(); c.restore();
  c.beginPath();
  for (let k = 0; k <= 6; k++) {
    const t = k / 6;
    c.moveTo(GX - GW, GTOP + t * GH); c.lineTo(BACK.left, BACK.top + t * (BACK.bottom - BACK.top));
    c.moveTo(GX + GW, GTOP + t * GH); c.lineTo(BACK.right, BACK.top + t * (BACK.bottom - BACK.top));
  }
  for (let k = 0; k <= 16; k++) { const x = GX - GW + (k / 16) * GW * 2; c.moveTo(x, GTOP); c.lineTo(BACK.left + (k / 16) * (BACK.right - BACK.left), BACK.top); }
  c.moveTo(BACK.left, BACK.top); c.lineTo(BACK.right, BACK.top); c.lineTo(BACK.right, BACK.bottom); c.lineTo(BACK.left, BACK.bottom); c.closePath();
  c.stroke();
  c.globalAlpha = 1;
}

/** One pole: bamboo with nodes, or a painted white post. */
export function drawPole(c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, bamboo: boolean) {
  c.lineCap = "round";
  if (!bamboo) {
    c.strokeStyle = "#9aa2ad"; c.lineWidth = 7; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    c.strokeStyle = "#fbfbf6"; c.lineWidth = 5; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    return;
  }
  c.strokeStyle = NODE; c.lineWidth = 7; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
  c.strokeStyle = BAMBOO; c.lineWidth = 5; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
  c.strokeStyle = "#f0d79a"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x0 - 1, y0 - 1); c.lineTo(x1 - 1, y1 - 1); c.stroke();
  const length = Math.hypot(x1 - x0, y1 - y0), steps = Math.floor(length / 20), nx = (y1 - y0) / length, ny = -(x1 - x0) / length;
  c.strokeStyle = NODE; c.lineWidth = 1.6;
  c.beginPath();
  for (let k = 1; k <= steps; k++) {
    const t = k / (steps + 1), x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
    c.moveTo(x - nx * 3.2, y - ny * 3.2); c.lineTo(x + nx * 3.2, y + ny * 3.2);
  }
  c.stroke();
}

/** The frame: two posts and the crossbar (lashed with rope at the corners when it's bamboo). */
export function drawGoalFrame(c: CanvasRenderingContext2D, bamboo: boolean) {
  drawPole(c, GX - GW, GY + 2, GX - GW, GTOP - 3, bamboo);
  drawPole(c, GX + GW, GY + 2, GX + GW, GTOP - 3, bamboo);
  drawPole(c, GX - GW - (bamboo ? 5 : 0), GTOP, GX + GW + (bamboo ? 5 : 0), GTOP, bamboo);
  if (!bamboo) return;
  c.strokeStyle = "#8a6a3a"; c.lineWidth = 1.5;
  for (const x of [GX - GW, GX + GW]) {
    c.beginPath();
    for (let k = -2; k <= 2; k++) { c.moveTo(x - 4, GTOP + k * 2); c.lineTo(x + 4, GTOP + k * 2 + 2); }
    c.stroke();
  }
}

/** The whole static field for a match: backdrop, wall, grass, chalk, net and frame. */
export function drawField(c: CanvasRenderingContext2D, p: Palette, top: number, bottom: number) {
  drawBackdrop(c, p, top);
  drawGrass(c, p, bottom);
  drawNet(c, !p.bamboo);
  drawGoalFrame(c, p.bamboo);
}

/** Where the crowd sits for this ground: kids on the school wall, rows of people in the stands. Fills the view's arrays. */
export function seatCrowd(p: Palette, top: number, cx: Float32Array, cy: Float32Array, cr: Float32Array, cs: Uint8Array, cp: Float32Array) {
  let n = 0;
  const max = cx.length;
  const seat = (x: number, y: number, r: number, i: number) => {
    if (n >= max) return;
    cx[n] = x; cy[n] = y; cr[n] = r; cs[n] = i % p.shirts.length; cp[n] = (i * 2.399) % (Math.PI * 2); n++;
  };
  if (p.rows === 0) {
    // Kids on the wall, thinning out behind the goal.
    for (let i = 0, x = 8; x < W; i++, x += 13 + (i * 7) % 9) {
      if (x > 50 && x < 310 && i % 3 !== 0) continue;
      seat(x, WALL_Y - 8, 3.6, i);
    }
    return n;
  }
  // The stands fill from the front; a bigger ground has more rows and fewer gaps.
  const gaps = p.name === "dusk" ? 3 : p.name === "lights" ? 5 : 9;
  for (let row = 0; row < p.rows; row++) {
    const y = WALL_Y - 7 - row * 13;
    if (y < -top + 6) break;
    for (let i = 0, x = 6 + (row % 2) * 6; x < W - 2; i++, x += 11 + ((i + row) * 5) % 4) {
      if ((i * 7 + row * 3) % gaps === 0) continue;
      seat(x, y, 3.2 - row * 0.12, i + row * 3);
    }
  }
  return n;
}

/** One person: a shirt and a head, lifted by `lift` (the cheer). */
export function drawFan(c: CanvasRenderingContext2D, x: number, y: number, r: number, shirt: string, lift: number, dark: boolean) {
  c.fillStyle = shirt; c.fillRect(x - r * 1.1, y + 1 - lift, r * 2.2, r * 2.4);
  c.fillStyle = dark ? SKIN2 : SKIN; c.beginPath(); c.arc(x, y - 3 - lift, r, 0, Math.PI * 2); c.fill();
  c.fillStyle = HAIR; c.beginPath(); c.arc(x, y - 4.4 - lift, r * 0.95, Math.PI, 0); c.fill();
}

/** Arms up: drawn over a cheering fan. */
export function drawArms(c: CanvasRenderingContext2D, x: number, y: number, r: number, lift: number) {
  c.strokeStyle = SKIN; c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(x - r, y + 1 - lift); c.lineTo(x - r * 1.8, y - r * 2.6 - lift); c.moveTo(x + r, y + 1 - lift); c.lineTo(x + r * 1.8, y - r * 2.6 - lift); c.stroke();
}

/** A ripple in the net where the ball went in; `life` runs 1 → 0. */
export function drawRipple(c: CanvasRenderingContext2D, x: number, y: number, life: number) {
  c.strokeStyle = "#ffffff"; c.globalAlpha = 0.8 * life; c.lineWidth = 1.4;
  c.beginPath(); c.ellipse(x, y, 10 + (1 - life) * 20, 6 + (1 - life) * 11, 0, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.ellipse(x, y, 4 + (1 - life) * 11, 2.5 + (1 - life) * 6, 0, 0, Math.PI * 2); c.stroke();
  c.globalAlpha = 1;
}

/**
 * The keeper facing us. `x` is the hips' centre on screen, `feet` the grass under them; `tilt` (radians) leans the whole body
 * for a dive, `lift` raises it off the grass. `crouch` 0..1 bends the knees while waiting. `size` scales him (the tall keeper).
 */
export function drawKeeper(c: CanvasRenderingContext2D, x: number, feet: number, tilt: number, lift: number, crouch: number, kit: string, size: number) {
  c.save();
  c.translate(x, feet - 22 * size - lift);
  c.rotate(tilt);
  c.scale(size, size);
  const bend = crouch * 4;
  c.strokeStyle = "#1d1d1d"; c.lineWidth = 5; c.lineCap = "round";
  c.beginPath(); c.moveTo(-4, 4); c.lineTo(-7 - bend * 0.6, 20 - bend); c.moveTo(4, 4); c.lineTo(7 + bend * 0.6, 20 - bend); c.stroke();
  c.strokeStyle = SKIN; c.lineWidth = 3.4;
  c.beginPath(); c.moveTo(-5, 8); c.lineTo(-7 - bend * 0.6, 18 - bend); c.moveTo(5, 8); c.lineTo(7 + bend * 0.6, 18 - bend); c.stroke();
  c.fillStyle = "#1d1d1d"; c.fillRect(-8, -1, 16, 9);
  c.fillStyle = kit; c.fillRect(-9, -24 + bend, 18, 24 - bend);
  c.fillStyle = "#ffffff22"; c.fillRect(-9, -24 + bend, 18, 3);
  c.strokeStyle = kit; c.lineWidth = 5;
  c.beginPath(); c.moveTo(-8, -20 + bend); c.lineTo(-18, -30 + bend); c.moveTo(8, -20 + bend); c.lineTo(18, -30 + bend); c.stroke();
  c.fillStyle = "#f4f1e6";
  c.beginPath(); c.arc(-19, -32 + bend, 4.4, 0, Math.PI * 2); c.arc(19, -32 + bend, 4.4, 0, Math.PI * 2); c.fill();
  c.fillStyle = SKIN; c.beginPath(); c.arc(0, -31 + bend, 6.4, 0, Math.PI * 2); c.fill();
  c.fillStyle = HAIR; c.beginPath(); c.arc(0, -33 + bend, 6.2, Math.PI * 1.05, Math.PI * 1.95); c.fill();
  c.restore();
}

/**
 * The kicker from behind, close to us. `step` 0..1 is the run-up (0 far back-left, 1 at the ball), `lean` -1..1 tips the
 * shoulders and head the way he means to kick (the tell), `swing` 0..1 is the kicking leg coming through. `foot` -1..1 turns the
 * planted foot (the true side; 0 straight), `look` 0..1 lifts his head to watch the keeper.
 */
export function drawKicker(c: CanvasRenderingContext2D, step: number, lean: number, swing: number, kit: string, shorts: string, foot: number, look: number) {
  const x = SPOT_X - 56 + step * 32, y = SPOT_Y + 40 - step * 10, bob = Math.sin(step * Math.PI * 5) * 1.6;
  c.save();
  c.translate(x, y + bob);
  c.strokeStyle = SKIN; c.lineWidth = 6; c.lineCap = "round";
  const stride = step >= 1 ? 0 : Math.sin(step * Math.PI * 5) * 5;
  c.beginPath(); c.moveTo(-5, 0); c.lineTo(-7 + stride, 26); c.moveTo(5, 0); c.lineTo(7 - stride + swing * 12, 26 - swing * 12); c.stroke();
  c.fillStyle = "#1d1d1d";
  // The planted (left) boot turns towards the side he'll really hit.
  c.save(); c.translate(-7 + stride, 28); c.rotate(foot * 0.7); c.beginPath(); c.ellipse(0, 0, 5, 3, 0, 0, Math.PI * 2); c.fill(); c.restore();
  c.beginPath(); c.ellipse(7 - stride + swing * 12, 28 - swing * 12, 5, 3, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = shorts; c.fillRect(-11, -8, 22, 12);
  c.rotate(lean * 0.22);
  c.fillStyle = kit; c.fillRect(-13, -40, 26, 33);
  c.fillStyle = "#00000022"; c.fillRect(-13, -40, 26, 4);
  c.strokeStyle = SKIN; c.lineWidth = 5;
  c.beginPath(); c.moveTo(-13, -36); c.lineTo(-20 - lean * 3, -16); c.moveTo(13, -36); c.lineTo(20 - lean * 3, -16); c.stroke();
  const hx = lean * 4, hy = -48 - look * 3;
  c.fillStyle = SKIN; c.beginPath(); c.arc(hx, hy, 8.5, 0, Math.PI * 2); c.fill();
  c.fillStyle = HAIR; c.beginPath(); c.arc(hx, hy - 1 + look * 3, 8.6, Math.PI * (0.85 + look * 0.15), Math.PI * (2.15 - look * 0.15)); c.fill();
  c.restore();
}

/** The planted foot's mark: a chalk arrow in the grass beside the ball, pointing to his real side (straight up: the middle). */
export function drawFootMark(c: CanvasRenderingContext2D, side: number, alpha: number) {
  const x = SPOT_X + 30, y = SPOT_Y + 14, angle = -Math.PI / 2 + side * 0.75, length = 16;
  const tx = x + Math.cos(angle) * length, ty = y + Math.sin(angle) * length;
  c.globalAlpha = alpha; c.strokeStyle = "#ffffff"; c.lineWidth = 3; c.lineCap = "round"; c.lineJoin = "round";
  c.beginPath(); c.moveTo(x, y); c.lineTo(tx, ty);
  c.moveTo(tx + Math.cos(angle + 2.5) * 7, ty + Math.sin(angle + 2.5) * 7); c.lineTo(tx, ty); c.lineTo(tx + Math.cos(angle - 2.5) * 7, ty + Math.sin(angle - 2.5) * 7);
  c.stroke();
  c.globalAlpha = 1;
}

/** A plain white ball with dark patches. `spin` turns the patches, `squash` flattens it for a beat when pressed. */
export function drawBall(c: CanvasRenderingContext2D, x: number, y: number, r: number, spin: number, squash: number) {
  const rx = r * (1 + squash * 0.12), ry = r * (1 - squash * 0.12);
  c.fillStyle = "#00000030";
  c.beginPath(); c.ellipse(x, y + r * 0.9, r * 0.9, r * 0.3, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#fdfdf8"; c.strokeStyle = "#5b5b55"; c.lineWidth = Math.max(0.8, r * 0.12);
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = "#2b2b28";
  for (let k = 0; k < 3; k++) {
    const angle = spin + k * 2.094;
    c.beginPath(); c.arc(x + Math.cos(angle) * rx * 0.5, y + Math.sin(angle) * ry * 0.5, r * 0.27, 0, Math.PI * 2); c.fill();
  }
  c.beginPath(); c.arc(x, y, r * 0.22, 0, Math.PI * 2); c.fill();
}

/** The aim mark on the goal: a ring and a cross. */
export function drawCrosshair(c: CanvasRenderingContext2D, x: number, y: number, color: string) {
  c.strokeStyle = "#ffffff"; c.lineWidth = 4;
  c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2); c.stroke();
  c.strokeStyle = color; c.lineWidth = 2.2;
  c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2); c.moveTo(x - 14, y); c.lineTo(x - 4, y); c.moveTo(x + 4, y); c.lineTo(x + 14, y); c.moveTo(x, y - 14); c.lineTo(x, y - 4); c.moveTo(x, y + 4); c.lineTo(x, y + 14); c.stroke();
}

/** The power bar on the right: green up to 85%, then a red band where the ball rises over the bar. */
export function drawMeter(c: CanvasRenderingContext2D, power: number) {
  const x = W - 26, top = 196, height = 110;
  c.fillStyle = "#1d2b1acc"; c.fillRect(x - 3, top - 3, 18, height + 6);
  c.fillStyle = "#d94a3a"; c.fillRect(x, top, 12, height * 0.15);
  c.fillStyle = "#ffffff33"; c.fillRect(x, top + height * 0.15, 12, height * 0.85);
  const level = top + height * (1 - power);
  c.fillStyle = power > 0.85 ? "#ff6b57" : "#ffd23f"; c.fillRect(x, level, 12, top + height - level);
  c.fillStyle = "#ffffff"; c.fillRect(x - 5, level - 1.5, 22, 3);
}

/** The finger's path while swiping, fading toward its start. */
export function drawTrail(c: CanvasRenderingContext2D, xs: Float32Array, ys: Float32Array, count: number) {
  if (count < 2) return;
  c.lineCap = "round"; c.lineJoin = "round"; c.strokeStyle = "#ffffff";
  for (let i = 1; i < count; i++) {
    c.globalAlpha = 0.15 + 0.6 * (i / count);
    c.lineWidth = 2 + 4 * (i / count);
    c.beginPath(); c.moveTo(xs[i - 1], ys[i - 1]); c.lineTo(xs[i], ys[i]); c.stroke();
  }
  c.globalAlpha = 1;
}

/** The corner flag, blowing with the wind (-1 left … 1 right). Its length is the strength. */
export function drawFlag(c: CanvasRenderingContext2D, wind: number, t: number) {
  const x = W - 14, base = GY + 30, topY = base - 44;
  c.strokeStyle = "#f4f1e6"; c.lineWidth = 2; c.beginPath(); c.moveTo(x, base); c.lineTo(x, topY); c.stroke();
  const length = 6 + Math.abs(wind) * 40, dir = wind < 0 ? -1 : 1, flutter = Math.sin(t * (6 + Math.abs(wind) * 12)) * (1 + Math.abs(wind) * 3);
  c.fillStyle = "#f2c14e"; c.strokeStyle = "#7a5a14"; c.lineWidth = 1;
  c.beginPath(); c.moveTo(x, topY); c.quadraticCurveTo(x + dir * length * 0.5, topY + 4 + flutter, x + dir * length, topY + 6 + flutter * 0.5);
  c.lineTo(x, topY + 14); c.closePath(); c.fill(); c.stroke();
}

/** The shot clock: a bar along the bottom of the field (share 1 → 0 of the time left). */
export function drawClockBar(c: CanvasRenderingContext2D, share: number, bottomY: number) {
  c.fillStyle = "#00000055"; c.fillRect(0, bottomY - 6, W, 6);
  c.fillStyle = share < 0.4 ? "#ff6b3d" : "#ffd23f"; c.fillRect(0, bottomY - 6, W * share, 6);
}

/** The danger rim, pre-rendered once per size: an orange glow along every edge. */
export function paintDanger(canvas: HTMLCanvasElement, width: number, height: number, ratio: number, color: string) {
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const c = canvas.getContext("2d");
  if (!c) return;
  c.setTransform(ratio, 0, 0, ratio, 0, 0);
  const edge = Math.min(width, height) * 0.16;
  for (const [x0, y0, x1, y1, x, y, w, h] of [[0, 0, edge, 0, 0, 0, edge, height], [width, 0, width - edge, 0, width - edge, 0, edge, height], [0, 0, 0, edge, 0, 0, width, edge], [0, height, 0, height - edge, 0, height - edge, width, edge]] as const) {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, color); g.addColorStop(1, `${color}00`);
    c.fillStyle = g; c.fillRect(x, y, w, h);
  }
}

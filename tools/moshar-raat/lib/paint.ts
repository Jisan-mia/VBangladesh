// The bedroom, the mosquitoes and the electric bat, drawn in code, in field units (room.ts). scene.ts paints each still thing
// once into an offscreen canvas at the stage's size; draw.hot.ts only stamps them. One palette per world.
// IP: no real mosquito-bat, coil or repellent brand; an unbranded yellow-and-blue bat and round cartoon mosquitoes that turn
// into grey specks, never anything gory.
import { BOSS, FAST, GHOST, SWARM, type Look } from "./levels";
import { DOOR, FLOOR_Y, H, HEAD_X, HEAD_Y, NET_BOTTOM, NET_LEFT, NET_RIGHT, NET_TOP, VENT, W, WINDOW } from "./room";

const TAU = Math.PI * 2;

export type Palette = {
  wall: readonly [string, string]; floor: string; skirt: string; frame: string; door: string; doorGap: string;
  sky: string; dawn: string; glow: string; kantha: string; fold: string; stitch: string; pillow: string; net: string;
  /** The HUD's ink and its pills. */
  ink: string; pill: string; gold: string;
  moon: boolean; rain: boolean; fog: boolean;
};

export const PALETTES: Record<Look, Palette> = {
  loadshed: { wall: ["#151d38", "#0d1429"], floor: "#0a0f20", skirt: "#1d2747", frame: "#34415f", door: "#1f2a4a", doorGap: "#060a16", sky: "#1d2c5a", dawn: "#f4c58f", glow: "#ffb04a", kantha: "#8c2f3d", fold: "#a33a49", stitch: "#f1d9c4", pillow: "#e8e2d4", net: "230,236,255", ink: "#fff4dc", pill: "#0a0f20b3", gold: "#ffd166", moon: false, rain: false, fog: false },
  rain: { wall: ["#11303a", "#0a1d24"], floor: "#071417", skirt: "#18404b", frame: "#2f5560", door: "#18404b", doorGap: "#041013", sky: "#1f4552", dawn: "#d9e6d2", glow: "#ffc76a", kantha: "#2f6e6a", fold: "#3b847f", stitch: "#e6f2e8", pillow: "#e4e8de", net: "220,240,238", ink: "#effaf6", pill: "#04121699", gold: "#ffd166", moon: false, rain: true, fog: false },
  humid: { wall: ["#2b1733", "#170c1e"], floor: "#100714", skirt: "#3a2144", frame: "#4b3159", door: "#3a2144", doorGap: "#0a040d", sky: "#2c1d4d", dawn: "#f7b38d", glow: "#ff9d5c", kantha: "#b0702a", fold: "#c4823a", stitch: "#fbe6c8", pillow: "#efe4d6", net: "245,230,255", ink: "#fff0f6", pill: "#100714b3", gold: "#ffcf70", moon: true, rain: false, fog: false },
  fog: { wall: ["#1e2c29", "#111b19"], floor: "#0a1210", skirt: "#2a3d39", frame: "#3d5550", door: "#2a3d39", doorGap: "#050a09", sky: "#3a4c4f", dawn: "#f3c9c0", glow: "#ffd39a", kantha: "#3e5a8c", fold: "#4c6ba0", stitch: "#e3ecff", pillow: "#e6e8e2", net: "230,240,236", ink: "#f1fbf8", pill: "#0a1210b3", gold: "#ffd98a", moon: false, rain: false, fog: true },
};

function round(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

/** The sleeping little brother: a head on the embroidered pillow, the কাঁথা pulled up to the chin. */
function paintBed(c: CanvasRenderingContext2D, p: Palette) {
  c.fillStyle = "#6e4528";
  c.fillRect(76, 476, 10, 34); c.fillRect(274, 476, 10, 34);
  c.fillStyle = p.kantha; round(c, 70, 430, 220, 42, 8); c.fill();
  c.fillStyle = p.pillow; round(c, HEAD_X - 46, HEAD_Y - 18, 92, 30, 11); c.fill();
  c.fillStyle = "#d77a8c";
  for (const dx of [-33, 33]) { c.beginPath(); c.arc(HEAD_X + dx, HEAD_Y - 4, 3.2, 0, TAU); c.fill(); }
  c.fillStyle = "#6e9a5b";
  for (const dx of [-38, -28, 28, 38]) { c.beginPath(); c.ellipse(HEAD_X + dx, HEAD_Y, 2.6, 1.3, 0, 0, TAU); c.fill(); }
  c.fillStyle = "#b07a52"; c.beginPath(); c.arc(HEAD_X, HEAD_Y - 4, 12.5, 0, TAU); c.fill();
  c.fillStyle = "#17140f"; c.beginPath(); c.arc(HEAD_X, HEAD_Y - 7, 13, Math.PI * 1.02, Math.PI * 1.98); c.closePath(); c.fill();
  c.strokeStyle = "#3a2516"; c.lineWidth = 1.4; c.lineCap = "round";
  for (const dx of [-4.5, 4.5]) { c.beginPath(); c.arc(HEAD_X + dx, HEAD_Y - 3, 2.4, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); }
  c.beginPath(); c.arc(HEAD_X, HEAD_Y + 3, 1.6, 0, Math.PI); c.stroke();
  c.fillStyle = p.fold; round(c, 72, HEAD_Y + 6, 216, 16, 6); c.fill();
  c.strokeStyle = p.stitch; c.lineWidth = 1.2; c.setLineDash([4, 4]);
  for (const y of [HEAD_Y + 16, HEAD_Y + 27, HEAD_Y + 36]) { c.beginPath(); c.moveTo(80, y); c.lineTo(280, y); c.stroke(); }
  c.setLineDash([]);
  c.fillStyle = "#6e4528"; round(c, 64, 470, 232, 14, 4); c.fill();
  c.fillStyle = "#8a5a33"; c.fillRect(68, 470, 224, 3);
  c.fillStyle = "rgba(220,228,255,0.45)"; c.font = "700 11px sans-serif"; c.fillText("z", HEAD_X + 19, HEAD_Y - 22); c.font = "700 8px sans-serif"; c.fillText("z", HEAD_X + 27, HEAD_Y - 30);
}

/** The মশারি over the bed on a net night, with its holes on the top edge. */
function paintNet(c: CanvasRenderingContext2D, p: Palette, holes: readonly number[], top: number) {
  const tint = (a: number) => `rgba(${p.net},${a})`;
  c.strokeStyle = tint(0.28); c.lineWidth = 1;
  c.beginPath(); c.moveTo(NET_LEFT, NET_TOP); c.lineTo(56, top); c.moveTo(NET_RIGHT, NET_TOP); c.lineTo(304, top); c.stroke();
  c.fillStyle = tint(0.09); c.fillRect(NET_LEFT, NET_TOP, NET_RIGHT - NET_LEFT, NET_BOTTOM - NET_TOP);
  c.strokeStyle = tint(0.14);
  c.beginPath();
  for (let x = NET_LEFT; x <= NET_RIGHT; x += 6) { c.moveTo(x, NET_TOP); c.lineTo(x, NET_BOTTOM); }
  for (let y = NET_TOP; y <= NET_BOTTOM; y += 6) { c.moveTo(NET_LEFT, y); c.lineTo(NET_RIGHT, y); }
  c.stroke();
  c.strokeStyle = tint(0.5); c.lineWidth = 1.6; c.strokeRect(NET_LEFT, NET_TOP, NET_RIGHT - NET_LEFT, NET_BOTTOM - NET_TOP);
  for (const x of holes) {
    c.fillStyle = p.wall[1]; c.beginPath();
    for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU, r = i % 2 ? 6 : 9; c.lineTo(x + Math.cos(a) * r, NET_TOP + Math.sin(a) * r * 0.8); }
    c.closePath(); c.fill();
    c.strokeStyle = tint(0.75); c.lineWidth = 1.2; c.stroke();
  }
}

/**
 * Everything that never moves, for a canvas that shows field x from `left` to `right` and y from `top` to H:
 * wall, ceiling fan (stopped: লোডশেডিং), window frame, door, ঘুলঘুলি, calendar, clock, the হারিকেন, the coil, the bed, the মশারি.
 */
export function paintRoom(c: CanvasRenderingContext2D, p: Palette, holes: readonly number[], left: number, top: number, right: number) {
  const wall = c.createLinearGradient(0, top, 0, H);
  wall.addColorStop(0, p.wall[0]); wall.addColorStop(1, p.wall[1]);
  c.fillStyle = wall; c.fillRect(left, top, right - left, H - top);
  c.fillStyle = p.floor; c.fillRect(left, FLOOR_Y, right - left, H - FLOOR_Y);
  c.fillStyle = p.skirt; c.fillRect(left, FLOOR_Y - 2, right - left, 3);
  // The lamp's warm pool on the wall behind the shelf.
  const pool = c.createRadialGradient(306, 300, 4, 306, 300, 150);
  pool.addColorStop(0, p.glow + "38"); pool.addColorStop(1, p.glow + "00");
  c.fillStyle = pool; c.fillRect(150, 150, 250, 300);
  // The ceiling fan, stopped.
  const fanY = Math.max(top + 40, -60);
  c.strokeStyle = "#00000055"; c.lineWidth = 2; c.beginPath(); c.moveTo(180, top); c.lineTo(180, fanY); c.stroke();
  c.fillStyle = "#3b4560";
  for (let i = 0; i < 3; i++) { const a = 0.4 + (i * TAU) / 3; c.beginPath(); c.ellipse(180 + Math.cos(a) * 36, fanY + Math.sin(a) * 6, 34, 5, a * 0.15, 0, TAU); c.fill(); }
  c.fillStyle = "#56607e"; c.beginPath(); c.ellipse(180, fanY, 9, 6, 0, 0, TAU); c.fill();
  // The window frame and sill (the glass is drawn every frame: it brightens towards dawn).
  c.fillStyle = p.frame; round(c, WINDOW.x - 4, WINDOW.y - 6, WINDOW.w + 8, WINDOW.h + 10, 4); c.fill();
  c.fillStyle = p.skirt; c.fillRect(WINDOW.x - 8, WINDOW.y + WINDOW.h + 2, WINDOW.w + 16, 6);
  // The half-open door on the left.
  c.fillStyle = p.doorGap; c.fillRect(left, DOOR.y, DOOR.x + 26 - left, DOOR.h);
  c.fillStyle = p.door; c.beginPath(); c.moveTo(14, DOOR.y); c.lineTo(36, DOOR.y + 8); c.lineTo(36, DOOR.y + DOOR.h - 8); c.lineTo(14, DOOR.y + DOOR.h); c.closePath(); c.fill();
  c.fillStyle = "#c9a35a"; c.beginPath(); c.arc(31, DOOR.y + 130, 2.2, 0, TAU); c.fill();
  // The ঘুলঘুলি high on the right wall.
  c.fillStyle = p.skirt; round(c, VENT.x, VENT.y, VENT.w, VENT.h, 4); c.fill();
  c.fillStyle = p.doorGap;
  for (const x of [VENT.x + 9, VENT.x + 18, VENT.x + 27]) { c.beginPath(); c.arc(x, VENT.y + 14, 3.4, Math.PI, 0); c.lineTo(x + 3.4, VENT.y + 23); c.lineTo(x - 3.4, VENT.y + 23); c.closePath(); c.fill(); }
  // A wall calendar and the clock (just past two).
  c.fillStyle = "#e9e3d2"; c.fillRect(140, 112, 34, 42);
  c.fillStyle = "#c2413a"; c.fillRect(140, 112, 34, 10);
  c.fillStyle = "#9a9384"; for (let r = 0; r < 4; r++) for (let q = 0; q < 5; q++) c.fillRect(143 + q * 6, 126 + r * 7, 3.5, 3);
  c.fillStyle = "#e6e0cf"; c.beginPath(); c.arc(262, 96, 15, 0, TAU); c.fill();
  c.strokeStyle = "#2b2b2b"; c.lineWidth = 2; c.lineCap = "round";
  c.beginPath(); c.moveTo(262, 96); c.lineTo(268, 92); c.moveTo(262, 96); c.lineTo(262, 85); c.stroke();
  // The হারিকেন on its shelf.
  c.fillStyle = "#4a3426"; c.fillRect(282, 318, 52, 5);
  c.strokeStyle = "#2a2f3c"; c.lineWidth = 2; c.beginPath(); c.arc(306, 286, 8, Math.PI, 0); c.stroke();
  c.fillStyle = "#2a2f3c"; c.fillRect(296, 290, 20, 5); c.fillRect(296, 311, 20, 7);
  c.fillStyle = p.glow + "aa"; round(c, 298, 295, 16, 16, 6); c.fill();
  c.fillStyle = "#fff2c4"; c.beginPath(); c.ellipse(306, 304, 2.4, 4, 0, 0, TAU); c.fill();
  // The coil in its tin, an ember and a thread of smoke.
  c.fillStyle = "#3d4660"; c.beginPath(); c.ellipse(326, 506, 16, 4, 0, 0, TAU); c.fill();
  c.strokeStyle = "#3e7a45"; c.lineWidth = 2.2;
  c.beginPath(); for (let a = 0; a < TAU * 2.6; a += 0.3) { const r = 2 + a * 1.5; c.lineTo(326 + Math.cos(a) * r, 502 + Math.sin(a) * r * 0.32); } c.stroke();
  c.fillStyle = "rgba(255,140,60,0.25)"; c.beginPath(); c.arc(337, 501, 6, 0, TAU); c.fill();
  c.fillStyle = "#ff8a3d"; c.beginPath(); c.arc(337, 501, 1.8, 0, TAU); c.fill();
  paintBed(c, p);
  if (holes.length) paintNet(c, p, holes, top);
  if (p.fog) {
    const fog = c.createLinearGradient(0, 300, 0, H);
    fog.addColorStop(0, "rgba(200,220,215,0)"); fog.addColorStop(1, "rgba(200,220,215,0.10)");
    c.fillStyle = fog; c.fillRect(left, 300, right - left, H - 300);
  }
}

/** The window's glass at night (`dawn` false) or at dawn: sky, the moon on গুমোট nights, then the grill on top. */
export function paintGlass(c: CanvasRenderingContext2D, p: Palette, dawn: boolean) {
  const { x, y, w, h } = WINDOW;
  c.fillStyle = dawn ? p.dawn : p.sky; c.fillRect(x, y, w, h);
  if (!dawn) {
    c.fillStyle = "#dfe6ff"; c.fillRect(x + 12, y + 14, 1.6, 1.6); c.fillRect(x + 28, y + 50, 1.4, 1.4); c.fillRect(x + 60, y + 64, 1.4, 1.4);
    c.fillStyle = "#f5efd2"; c.beginPath(); c.arc(x + 52, y + 22, p.moon ? 12 : 8, 0, TAU); c.fill();
    if (!p.moon) { c.fillStyle = p.sky; c.beginPath(); c.arc(x + 56, y + 19, 7, 0, TAU); c.fill(); }
  } else {
    const sun = c.createRadialGradient(x + w / 2, y + h, 2, x + w / 2, y + h, 50);
    sun.addColorStop(0, "#fff1c4"); sun.addColorStop(1, "#fff1c400");
    c.fillStyle = sun; c.fillRect(x, y, w, h);
  }
  c.fillStyle = p.frame;
  for (const gx of [x + 15, x + 30, x + 45, x + 60]) c.fillRect(gx, y, 2, h);
  c.fillRect(x, y + h / 2 - 1, w, 2);
}

export type BugLook = { body: string; belly: string; stripe: string; wing: string; leg: string; scale: number; crown: boolean; thin: boolean };
export const BUG_LOOKS: readonly BugLook[] = [
  { body: "#dde5f7", belly: "#eef2fb", stripe: "#8390b4", wing: "rgba(236,242,255,0.6)", leg: "#9eabcf", scale: 1.55, crown: false, thin: false },
  { body: "#ffb8a6", belly: "#ffe2d9", stripe: "#b8574a", wing: "rgba(255,235,228,0.6)", leg: "#d48c7f", scale: 1.5, crown: false, thin: true },
  { body: "#d9cffb", belly: "#f1edff", stripe: "#8f80c8", wing: "rgba(240,236,255,0.55)", leg: "#a99bd8", scale: 1.55, crown: false, thin: false },
  { body: "#c9d4ea", belly: "#e4ebf7", stripe: "#7884a6", wing: "rgba(230,238,255,0.55)", leg: "#94a1c4", scale: 1.2, crown: false, thin: false },
];
/** The four bosses: পালোয়ান, বিজলি, ভূতুড়ে, রাজা. */
export const BOSS_LOOKS: readonly BugLook[] = [
  { body: "#c99c72", belly: "#e8c9a6", stripe: "#6e4a2c", wing: "rgba(250,240,225,0.6)", leg: "#9a7656", scale: 2.7, crown: false, thin: false },
  { body: "#ffd34d", belly: "#fff0b8", stripe: "#a2641a", wing: "rgba(255,248,220,0.6)", leg: "#c99a3a", scale: 2.5, crown: false, thin: true },
  { body: "#c9b8ff", belly: "#efe9ff", stripe: "#7a66c8", wing: "rgba(240,234,255,0.5)", leg: "#a091dc", scale: 2.6, crown: false, thin: false },
  { body: "#eae4ff", belly: "#ffffff", stripe: "#8d84b8", wing: "rgba(245,242,255,0.65)", leg: "#b4acd8", scale: 2.7, crown: true, thin: false },
];
export const lookOf = (kind: number, world: number) => (kind === BOSS ? BOSS_LOOKS[world] : BUG_LOOKS[kind === SWARM ? 3 : kind === FAST ? 1 : kind === GHOST ? 2 : 0]);

/**
 * A cartoon mosquito facing right at the origin, wings at `wing` (0..1 of a beat). Diving, its legs hang down and its body
 * flushes red: the tell you read before the whine rises. A soft halo keeps it findable in the dark room.
 */
export function paintBug(c: CanvasRenderingContext2D, look: BugLook, wing: number, diving: boolean) {
  c.save();
  c.fillStyle = diving ? "rgba(255,120,110,0.16)" : "rgba(205,220,255,0.1)";
  c.beginPath(); c.arc(0, 0, 11 * look.scale, 0, TAU); c.fill();
  c.scale(look.scale, look.scale);
  c.strokeStyle = look.leg; c.lineWidth = 0.9; c.lineCap = "round";
  c.beginPath();
  const drop = diving ? 4 : 0, long = look.thin ? 3 : 0;
  c.moveTo(-3, 2); c.lineTo(-6 - long, 8 + drop + long); c.moveTo(0, 2.5); c.lineTo(-1, 9 + drop + long); c.moveTo(2.5, 2); c.lineTo(4 + long, 8 + drop + long);
  c.moveTo(6, 0); c.lineTo(11.5, diving ? 5.5 : 3.5);
  c.stroke();
  c.fillStyle = look.wing;
  c.beginPath(); c.ellipse(-1, -4.5, 2.6, 2 + wing * 4, -0.5, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(1.5, -4, 2.2, 1.5 + wing * 3.2, 0.35, 0, TAU); c.fill();
  c.fillStyle = diving ? "#ff9a90" : look.body; c.beginPath(); c.ellipse(-2, 0, look.thin ? 6.5 : 6, look.thin ? 2.4 : 3, 0.2, 0, TAU); c.fill();
  c.strokeStyle = look.stripe; c.lineWidth = 1;
  c.beginPath(); c.moveTo(-4, -2.4); c.lineTo(-4.6, 2.2); c.moveTo(-1.4, -2.8); c.lineTo(-1.8, 2.6); c.stroke();
  c.fillStyle = look.belly; c.beginPath(); c.arc(4.6, -1, 2.7, 0, TAU); c.fill();
  c.fillStyle = "#1a1f33"; c.beginPath(); c.arc(5.4, -1.6, 0.9, 0, TAU); c.fill();
  if (look.crown) {
    c.fillStyle = "#ffcf3d";
    c.beginPath(); c.moveTo(2.4, -3.4); c.lineTo(3, -6.4); c.lineTo(4.2, -4.6); c.lineTo(5, -7); c.lineTo(5.8, -4.6); c.lineTo(7, -6.4); c.lineTo(7.4, -3.4); c.closePath(); c.fill();
  }
  c.restore();
}

/** A zapped mosquito: a grey speck, drawn small. */
export function paintSpeck(c: CanvasRenderingContext2D) {
  c.fillStyle = "#7d859c"; c.beginPath(); c.ellipse(0, 0, 6, 3, 0, 0, TAU); c.fill();
  c.strokeStyle = "#7d859c"; c.lineWidth = 1; c.beginPath(); c.moveTo(-2, 2); c.lineTo(-4, 6); c.moveTo(2, 2); c.lineTo(3, 6); c.stroke();
}

/** The electric bat with its head centred on the origin, tilted. `lit` lights the mesh blue-white (a hit). */
export function paintBat(c: CanvasRenderingContext2D, lit: boolean, scale = 1) {
  c.save();
  c.scale(scale, scale);
  c.rotate(-0.22);
  c.fillStyle = "#2a62c4"; round(c, -6, 24, 12, 52, 5); c.fill();
  c.fillStyle = "#1d4a99"; for (let i = 0; i < 4; i++) c.fillRect(-6, 50 + i * 6, 12, 2);
  c.fillStyle = "#e0443e"; c.beginPath(); c.arc(0, 35, 3, 0, TAU); c.fill();
  round(c, -33, -27, 66, 54, 15);
  c.fillStyle = lit ? "rgba(150,215,255,0.45)" : "rgba(20,30,60,0.3)"; c.fill();
  c.save(); c.clip();
  c.strokeStyle = lit ? "#e6f6ff" : "#7d93c4"; c.lineWidth = lit ? 1.3 : 0.8;
  c.beginPath();
  for (let i = -30; i <= 30; i += 7) { c.moveTo(i, -27); c.lineTo(i, 27); }
  for (let j = -23; j <= 23; j += 7) { c.moveTo(-33, j); c.lineTo(33, j); }
  c.stroke();
  c.restore();
  round(c, -33, -27, 66, 54, 15);
  c.strokeStyle = "#f2c230"; c.lineWidth = 4.5; c.stroke();
  c.restore();
}

/** An edge glow over a `w`×`h` box: `color` along all four sides, or only the bottom. */
export function paintEdge(c: CanvasRenderingContext2D, w: number, h: number, color: string, bottomOnly = false) {
  const depth = Math.min(w, h) * 0.18;
  const clear = color.slice(0, 7) + "00";
  const side = (x0: number, y0: number, x1: number, y1: number, rx: number, ry: number, rw: number, rh: number) => {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, color); g.addColorStop(1, clear);
    c.fillStyle = g; c.fillRect(rx, ry, rw, rh);
  };
  if (bottomOnly) { side(0, h, 0, h - depth * 2.2, 0, h - depth * 2.2, w, depth * 2.2); return; }
  side(0, 0, 0, depth, 0, 0, w, depth);
  side(0, h, 0, h - depth, 0, h - depth, w, depth);
  side(0, 0, depth, 0, 0, 0, depth, h);
  side(w, 0, w - depth, 0, w - depth, 0, depth, h);
}

/** The title's start button art: the bat big, its mesh crackling over a mosquito, on the world's wall colour. */
export function paintStartArt(c: CanvasRenderingContext2D, width: number, height: number, look: Look) {
  const p = PALETTES[look], k = Math.min(width / 200, height / 170);
  c.clearRect(0, 0, width, height);
  c.save();
  c.translate(width / 2, height * 0.46);
  c.scale(k, k);
  const halo = c.createRadialGradient(0, 0, 8, 0, 0, 90);
  halo.addColorStop(0, "rgba(150,215,255,0.35)"); halo.addColorStop(1, "rgba(150,215,255,0)");
  c.fillStyle = halo; c.fillRect(-100, -90, 200, 180);
  paintBat(c, true, 1.55);
  c.save(); c.translate(26, -24); paintBug(c, BUG_LOOKS[0], 0.6, false); c.restore();
  c.lineCap = "round"; c.lineWidth = 2.2;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU + 0.3, inner = 60 + (i % 3) * 4, outer = inner + 10 + (i % 2) * 7;
    c.strokeStyle = i % 2 ? p.gold : "#d6f0ff";
    c.beginPath(); c.moveTo(Math.cos(a) * inner, Math.sin(a) * inner * 0.8); c.lineTo(Math.cos(a) * outer, Math.sin(a) * outer * 0.8); c.stroke();
  }
  c.restore();
}


// Drawings in game units, shared by the scene, the title, the story and the result card: the racing boats from above, কচুরিপানা,
// the water and crowded banks of each world, a fast lane's current, the reed beds that close the river, the night, the ঢোল and the
// finish rope. All our own, drawn from scratch and painted once into sprites.
import { makeRng } from "../../../shared/game-core";
import { BANK, BOAT_LEN, LANE_W, LANES, W } from "./course";

export type Scheme = { paint: string; band: string; dots: string; shirt: string; flag: string };
/** Yours first (indigo and yellow), then the red, green and yellow rivals, then the black-and-gold champion. Each also differs in its band, motifs and flag. */
export const SCHEMES: readonly Scheme[] = [
  { paint: "#2a62c4", band: "#f2c230", dots: "#e04a2f", shirt: "#f2c230", flag: "#f2c230" },
  { paint: "#b3302a", band: "#f6ead2", dots: "#1e3a2a", shirt: "#f6ead2", flag: "#f6ead2" },
  { paint: "#2c7a43", band: "#f4d35e", dots: "#b3302a", shirt: "#ef7d22", flag: "#b3302a" },
  { paint: "#d8961c", band: "#3b2416", dots: "#2c7a43", shirt: "#7a2e1d", flag: "#2c7a43" },
  { paint: "#1c1b22", band: "#e2b53b", dots: "#e2b53b", shirt: "#e2b53b", flag: "#b3302a" },
];
export const WOOD = "#2a1a10", DECK = "#6e4526";
/** Water, bank grass, mud edge, ripple colour, glint colour (rgb prefix) and how much the banks are dimmed, for each world. */
export const PALETTE = [
  { water: "#78aca8", grass: "#8bb258", mud: "#b39a70", ripple: "rgba(40,100,100,0.2)", glint: "rgba(236,248,244,", dim: 0 },
  { water: "#6e8a5c", grass: "#5f8c3e", mud: "#8d7852", ripple: "rgba(36,66,38,0.24)", glint: "rgba(222,236,214,", dim: 0.12 },
  { water: "#1f3b57", grass: "#2b4636", mud: "#46392e", ripple: "rgba(8,22,42,0.4)", glint: "rgba(170,200,238,", dim: 0.42 },
] as const;
const CROWD = ["#c8372d", "#f2b632", "#2e6fb5", "#e46aa0", "#f5efe0", "#3c8d4f", "#7b3fa0", "#ef7d22", "#1f2a44"] as const;
const FLAGS = ["#d9412f", "#f2c230", "#2c7a43", "#f4efe6", "#1f4f9a"] as const;

/** Rower rows along the hull (two rowers a row, one oar each side), the drummer's drum and the helmsman. */
export const ROWS = [14, 21, 28, 35, 42, 60, 67, 74, 81, 88] as const;
export const DRUM_Y = 49, OAR_ROOT = 8.5, OAR_LEN = 12;

function hull(c: CanvasRenderingContext2D, half: number) {
  c.beginPath();
  c.moveTo(0, 0);
  c.bezierCurveTo(half * 0.85, 14, half, 34, half, 52);
  c.bezierCurveTo(half, 72, half * 0.75, 92, 0, BOAT_LEN);
  c.bezierCurveTo(-half * 0.75, 92, -half, 72, -half, 52);
  c.bezierCurveTo(-half, 34, -half * 0.85, 14, 0, 0);
  c.closePath();
}

const dot = (c: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) => { c.fillStyle = color; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); };

/** A long racing boat seen from above, bow at (0, 0) pointing up, stern at (0, BOAT_LEN). Oars are drawn separately, in rhythm. */
export function drawBoat(c: CanvasRenderingContext2D, scheme: Scheme, glow = false, boss = false) {
  c.save(); c.translate(3, 4); c.fillStyle = "rgba(10,30,30,0.3)"; hull(c, 10); c.fill(); c.restore();
  if (glow) { c.strokeStyle = "rgba(255,250,225,0.75)"; c.lineWidth = 2.4; hull(c, 11.2); c.stroke(); }
  if (boss) { c.strokeStyle = "rgba(226,181,59,0.8)"; c.lineWidth = 1.6; hull(c, 11.8); c.stroke(); }
  // The helmsman's long steering oar trails off the stern.
  c.strokeStyle = "#c79b62"; c.lineWidth = 1.6; c.lineCap = "round";
  c.beginPath(); c.moveTo(1, 94); c.lineTo(9, 124); c.stroke();
  c.fillStyle = "#c79b62"; c.beginPath(); c.ellipse(9.6, 126, 2, 4.5, -0.25, 0, Math.PI * 2); c.fill();
  c.fillStyle = WOOD; hull(c, 10.5); c.fill();
  c.fillStyle = scheme.paint; hull(c, 9.6); c.fill();
  c.strokeStyle = scheme.band; c.lineWidth = 1.5; hull(c, 8); c.stroke();
  for (let y = 9; y < 98; y += 5.5) {
    const half = 9 * Math.sin(Math.PI * y / BOAT_LEN) ** 0.6;
    dot(c, half, y, 0.85, scheme.dots); dot(c, -half, y, 0.85, scheme.dots);
  }
  c.fillStyle = DECK; hull(c, 5.4); c.fill();
  c.strokeStyle = "rgba(0,0,0,0.25)"; c.lineWidth = 0.7;
  for (const y of ROWS) { c.beginPath(); c.moveTo(-4.6, y + 3); c.lineTo(4.6, y + 3); c.stroke(); }
  for (const y of ROWS) for (const side of [-1, 1]) {
    c.fillStyle = scheme.shirt; c.beginPath(); c.ellipse(side * 2.5, y + 0.6, 2.3, 1.8, 0, 0, Math.PI * 2); c.fill();
    dot(c, side * 2.5, y - 0.2, 1.25, "#241812");
  }
  // The drummer and the ঢোল lying across the boat in front of him.
  c.fillStyle = "#f3efe6"; c.beginPath(); c.ellipse(0, DRUM_Y + 5.5, 3.4, 2.4, 0, 0, Math.PI * 2); c.fill();
  dot(c, 0, DRUM_Y + 5, 1.7, "#241812");
  c.fillStyle = "#e9d2a4"; c.beginPath(); c.roundRect(-5.5, DRUM_Y - 2.3, 11, 4.6, 2.3); c.fill();
  c.strokeStyle = "#a33a22"; c.lineWidth = 1; c.beginPath(); c.moveTo(-2.5, DRUM_Y - 2.2); c.lineTo(-2.5, DRUM_Y + 2.2); c.moveTo(2.5, DRUM_Y - 2.2); c.lineTo(2.5, DRUM_Y + 2.2); c.stroke();
  // The helmsman at the stern.
  c.fillStyle = scheme.shirt; c.beginPath(); c.ellipse(0, 95.5, 2.4, 1.8, 0, 0, Math.PI * 2); c.fill();
  dot(c, 0, 95, 1.3, "#241812");
  // A bird-headed prow, and a small flag at the stern.
  c.strokeStyle = scheme.band; c.lineWidth = 1.8;
  c.beginPath(); c.moveTo(0, 4); c.quadraticCurveTo(-1.5, -3, 0, -8); c.stroke();
  dot(c, 0, -9.5, 2.6, scheme.band);
  c.fillStyle = scheme.dots; c.beginPath(); c.moveTo(-1, -11.5); c.lineTo(0, -15); c.lineTo(1, -11.5); c.fill();
  c.fillStyle = scheme.paint; c.beginPath(); c.moveTo(-2.2, -8); c.lineTo(-4.5, -4); c.lineTo(-1, -6.5); c.moveTo(2.2, -8); c.lineTo(4.5, -4); c.lineTo(1, -6.5); c.fill();
  c.fillStyle = scheme.flag; c.beginPath(); c.moveTo(-0.5, 99); c.lineTo(-7, 103); c.lineTo(-0.5, 106); c.fill();
  c.strokeStyle = WOOD; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-0.5, 98); c.lineTo(-0.5, 107); c.stroke();
}

/**
 * The oars at stroke phase `p` (0 to 1: the blades catch at 0, drive back till 0.45, then swing forward again), all in one path.
 * `sweep` makes the drive bigger (a stroke caught right on the beat). The caller sets the stroke colour and width.
 */
export function oarPath(c: CanvasRenderingContext2D, x: number, y: number, p: number, sweep = 1) {
  const reach = 0.6 * sweep;
  const angle = p < 0.45 ? -reach + 2 * reach * (p / 0.45) : reach - 2 * reach * ((p - 0.45) / 0.55);
  const dx = OAR_LEN * Math.cos(angle), dy = OAR_LEN * Math.sin(angle);
  for (let index = 0; index < ROWS.length; index++) {
    const row = ROWS[index];
    c.moveTo(x - OAR_ROOT, y + row); c.lineTo(x - OAR_ROOT - dx, y + row + dy);
    c.moveTo(x + OAR_ROOT, y + row); c.lineTo(x + OAR_ROOT + dx, y + row + dy);
  }
}

/** A floating raft of কচুরিপানা: glossy rounded leaves and a few pale lilac flowers, centred on (0, 0), about 46 × 52. */
export function drawPatch(c: CanvasRenderingContext2D, look: number, night = false) {
  const rng = makeRng(look * 7 + 3);
  c.fillStyle = "rgba(10,40,30,0.34)"; c.beginPath(); c.ellipse(2, 3, 24, 28, 0, 0, Math.PI * 2); c.fill();
  const greens = night ? ["#2a5a35", "#336a3a", "#3d7a42", "#478a4a"] : ["#2f7433", "#3e8a3c", "#4f9e45", "#5cad4c"];
  for (let index = 0; index < 15; index++) {
    const angle = rng() * Math.PI * 2, reach = Math.sqrt(rng());
    const x = Math.cos(angle) * 15 * reach, y = Math.sin(angle) * 19 * reach;
    c.save(); c.translate(x, y); c.rotate(rng() * Math.PI);
    c.fillStyle = greens[index % greens.length]; c.beginPath(); c.ellipse(0, 0, 6 + rng() * 2.5, 4.6 + rng() * 2, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "rgba(255,255,255,0.28)"; c.lineWidth = 1; c.beginPath(); c.ellipse(0, 0, 4, 2.8, 0, Math.PI * 1.1, Math.PI * 1.6); c.stroke();
    c.strokeStyle = "rgba(20,60,30,0.45)"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(0, 0); c.lineTo(5, 0); c.stroke();
    c.restore();
  }
  for (let flower = 0; flower < 2 + (look % 2); flower++) {
    const x = (rng() - 0.5) * 20, y = (rng() - 0.5) * 26;
    for (let petal = 0; petal < 5; petal++) dot(c, x + Math.cos(petal * 1.26) * 2.3, y + Math.sin(petal * 1.26) * 2.3, 1.9, petal % 2 ? "#c9b1ec" : "#b59ade");
    dot(c, x, y, 1.1, "#f5d547");
  }
}

/** Open water of a world, with soft ripples. Tiles seamlessly every `h` units. */
export function paintWater(c: CanvasRenderingContext2D, w: number, h: number, world = 0) {
  const look = PALETTE[world] ?? PALETTE[0];
  c.fillStyle = look.water; c.fillRect(0, 0, w, h);
  const rng = makeRng(21 + world);
  c.lineCap = "round";
  for (let index = 0; index < h / 14; index++) {
    const x = rng() * w, y = rng() * h, length = 24 + rng() * 40;
    c.strokeStyle = look.ripple; c.lineWidth = 2.2;
    for (const shift of [0, -h, h]) { c.beginPath(); c.moveTo(x, y + shift); c.quadraticCurveTo(x + length / 2, y + shift - 3, x + length, y + shift); c.stroke(); }
  }
  for (let index = 0; index < h / 3.6; index++) {
    const x = rng() * w, y = rng() * h, r = 3.5 + rng() * 6;
    c.strokeStyle = `${look.glint}${0.12 + rng() * 0.12})`; c.lineWidth = 1.1;
    for (const shift of [0, -h, h]) { c.beginPath(); c.arc(x, y + shift, r, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
  }
}

/** Both banks, packed with people and umbrellas watching (by night with torches), palms behind; buoys mark the lanes. Tiles every `h` units. Transparent in the river. */
export function paintBanks(c: CanvasRenderingContext2D, w: number, h: number, world = 0) {
  const look = PALETTE[world] ?? PALETTE[0];
  const rng = makeRng(33 + world);
  for (const side of [-1, 1]) {
    const edge = side < 0 ? BANK : w - BANK;
    const at = (inset: number) => side < 0 ? inset : w - inset;
    c.fillStyle = look.grass;
    c.fillRect(side < 0 ? 0 : edge - 2, 0, BANK + 2, h);
    c.fillStyle = look.mud;
    c.beginPath(); c.moveTo(edge, 0);
    for (let y = 0; y <= h; y += 8) c.lineTo(edge - side * (6 + 2 * Math.sin((y / h) * Math.PI * 12) + 1.4 * Math.sin((y / h) * Math.PI * 34)), y);
    c.lineTo(edge, h); c.closePath(); c.fill();
    c.strokeStyle = "rgba(255,255,255,0.3)"; c.lineWidth = 1;
    c.beginPath(); c.moveTo(edge + side * 1.5, 0); c.lineTo(edge + side * 1.5, h); c.stroke();
    for (let y = 18 + rng() * 30; y < h - 10; y += 46 + rng() * 40) {
      const x = at(3 + rng() * 6);
      if (rng() < 0.55) {
        c.strokeStyle = world === 2 ? "#264a2c" : "#3f7a2e"; c.lineWidth = 3.2; c.lineCap = "round";
        for (let frond = 0; frond < 7; frond++) {
          const angle = frond * 0.9 + y;
          c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(angle) * 8, y + Math.sin(angle) * 8 - 2, x + Math.cos(angle) * 14, y + Math.sin(angle) * 14); c.stroke();
        }
        dot(c, x, y, 2.4, "#6b4a2a");
      } else { dot(c, x, y, 8, world === 2 ? "#3a5f36" : "#5f8f3a"); dot(c, x - 2, y - 2, 5, world === 2 ? "#456e40" : "#6fa046"); }
    }
    for (let y = 2; y < h - 2; y += 4.2) {
      for (const inset of [15, 20.5, 25.5]) {
        if (rng() < 0.18) continue;
        const x = at(inset + (rng() - 0.5) * 2), shirt = CROWD[Math.floor(rng() * CROWD.length)];
        dot(c, x, y + (rng() - 0.5) * 2, 2.3, shirt);
        dot(c, x + side * 0.9, y, 1.35, rng() < 0.15 ? "#e8e2d4" : "#2a1d16");
      }
    }
    for (let y = 20 + rng() * 30; y < h - 10; y += 50 + rng() * 40) {
      const x = at(19 + rng() * 4), color = ["#2b2b2b", "#c8372d", "#2e6fb5", "#f2b632"][Math.floor(rng() * 4)];
      dot(c, x, y, 6.5, color);
      c.strokeStyle = "rgba(255,255,255,0.35)"; c.lineWidth = 0.7; c.beginPath();
      for (let spoke = 0; spoke < 6; spoke++) { c.moveTo(x, y); c.lineTo(x + Math.cos(spoke * 1.047) * 6.3, y + Math.sin(spoke * 1.047) * 6.3); }
      c.stroke();
    }
    if (world === 2) {
      // Torches along the water: a warm glow and a small flame.
      for (let y = 30 + rng() * 30; y < h - 10; y += 70 + rng() * 40) {
        const x = at(9);
        const glow = c.createRadialGradient(x, y, 0, x, y, 22);
        glow.addColorStop(0, "rgba(255,190,90,0.55)"); glow.addColorStop(1, "rgba(255,190,90,0)");
        c.fillStyle = glow; c.fillRect(x - 22, y - 22, 44, 44);
        dot(c, x, y, 2.4, "#ffd27a"); dot(c, x, y, 1.2, "#fff2c8");
      }
    }
  }
  if (look.dim) { c.fillStyle = `rgba(6,12,34,${look.dim})`; c.fillRect(0, 0, BANK + 4, h); c.fillRect(w - BANK - 4, 0, BANK + 4, h); }
  // Buoys between the lanes.
  for (let lane = 1; lane < LANES; lane++) {
    const x = BANK + LANE_W * lane;
    for (let y = 30; y < h; y += 120) {
      dot(c, x, y, 2.6, "rgba(20,40,40,0.35)");
      dot(c, x - 0.4, y - 0.6, 2.2, (y / 120) % 2 < 1 ? "#d9412f" : "#f4efe6");
    }
  }
}

/** A reed bed that closes a lane: tufts and a few stakes, `LANE_W` wide and 96 tall. Tiles vertically. */
export function paintReeds(c: CanvasRenderingContext2D, world = 0) {
  const rng = makeRng(77);
  const dark = world === 2;
  c.fillStyle = dark ? "rgba(26,50,34,0.9)" : world === 1 ? "rgba(70,92,44,0.92)" : "rgba(108,138,64,0.92)";
  c.fillRect(0, 0, LANE_W, 96);
  c.lineCap = "round";
  for (let index = 0; index < 46; index++) {
    const x = rng() * LANE_W, y = rng() * 96, lean = (rng() - 0.5) * 6;
    c.strokeStyle = ["#b8c06a", "#8ea64c", "#d2cf86"][index % 3]; c.lineWidth = 1.4;
    for (const shift of [0, -96, 96]) { c.beginPath(); c.moveTo(x, y + shift + 8); c.lineTo(x + lean, y + shift - 6); c.stroke(); }
  }
  for (const y of [12, 60]) { dot(c, 8, y, 3, "#6b4a2a"); dot(c, LANE_W - 8, y + 20, 3, "#6b4a2a"); }
}

/** A fast lane's current: pale arrow streaks pointing up the river. `LANE_W` wide and 96 tall. Tiles vertically. */
export function paintCurrent(c: CanvasRenderingContext2D) {
  c.fillStyle = "rgba(255,255,255,0.1)"; c.fillRect(2, 0, LANE_W - 4, 96);
  c.lineCap = "round"; c.lineJoin = "round"; c.lineWidth = 2.4;
  for (const [x, y] of [[16, 20], [44, 66], [30, 90]] as const) {
    for (const shift of [0, -96]) {
      c.strokeStyle = "rgba(255,255,255,0.55)";
      c.beginPath(); c.moveTo(x, y + shift + 16); c.lineTo(x, y + shift - 8); c.moveTo(x - 6, y + shift - 1); c.lineTo(x, y + shift - 8); c.lineTo(x + 6, y + shift - 1); c.stroke();
    }
  }
}

/** The dark of night around your lantern: clear near the bow, deep blue beyond. Painted into a square `size` units across, centred. */
export function paintNight(c: CanvasRenderingContext2D, size: number) {
  const mid = size / 2;
  const fade = c.createRadialGradient(mid, mid, 150, mid, mid, 330);
  fade.addColorStop(0, "rgba(4,10,30,0)"); fade.addColorStop(1, "rgba(4,10,30,0.84)");
  c.fillStyle = fade; c.fillRect(0, 0, size, size);
}

/** A rope across the river at y = 0 between two bamboo poles, hung with little triangle flags. */
export function drawRope(c: CanvasRenderingContext2D, w: number) {
  const left = BANK - 6, right = w - BANK + 6;
  c.strokeStyle = "#4a3426"; c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(left, 0); c.lineTo(right, 0); c.stroke();
  let index = 0;
  for (let x = left + 6; x < right - 4; x += 9, index++) {
    c.fillStyle = FLAGS[index % FLAGS.length];
    c.beginPath(); c.moveTo(x - 3.2, 0); c.lineTo(x + 3.2, 0); c.lineTo(x, 7); c.closePath(); c.fill();
  }
  for (const x of [left, right]) { dot(c, x, 0, 4, "#7a5a2c"); dot(c, x, 0, 2.8, "#d4ae66"); }
}

/** A star, for the card and the end screen. */
export function star(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r * 0.45 : r;
    c.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  c.closePath(); c.fillStyle = fill; c.fill();
}

/** The ঢোল seen from above, centred on (cx, cy): a wooden hoop, laced rope, the cream head. Pure art; the ring and flash are drawn over it. */
export function drawDrum(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, label = "") {
  c.save();
  c.fillStyle = "rgba(30,16,8,0.28)"; c.beginPath(); c.ellipse(cx + r * 0.05, cy + r * 0.1, r * 1.04, r * 1.0, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#6a3f1d"; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#c18a47"; c.lineWidth = r * 0.07; c.beginPath(); c.arc(cx, cy, r * 0.96, 0, Math.PI * 2); c.stroke();
  // Laced rope around the hoop: a zigzag of short strokes.
  c.strokeStyle = "#e9d4a2"; c.lineWidth = Math.max(1.4, r * 0.035); c.lineCap = "round";
  const laces = 20;
  c.beginPath();
  for (let i = 0; i < laces; i++) {
    const a = (i / laces) * Math.PI * 2, b = ((i + 0.5) / laces) * Math.PI * 2;
    c.moveTo(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9);
    c.lineTo(cx + Math.cos(b) * r * 0.78, cy + Math.sin(b) * r * 0.78);
    c.lineTo(cx + Math.cos(a + (b - a) * 2) * r * 0.9, cy + Math.sin(a + (b - a) * 2) * r * 0.9);
  }
  c.stroke();
  const head = c.createRadialGradient(cx - r * 0.2, cy - r * 0.25, r * 0.1, cx, cy, r * 0.74);
  head.addColorStop(0, "#fbf0d6"); head.addColorStop(1, "#e3cd98");
  c.fillStyle = head; c.beginPath(); c.arc(cx, cy, r * 0.74, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "rgba(120,70,30,0.35)"; c.lineWidth = r * 0.03; c.beginPath(); c.arc(cx, cy, r * 0.74, 0, Math.PI * 2); c.stroke();
  // The dark centre patch that gives a ঢোল its voice.
  c.fillStyle = "rgba(40,28,20,0.82)"; c.beginPath(); c.arc(cx + r * 0.22, cy + r * 0.12, r * 0.24, 0, Math.PI * 2); c.fill();
  c.restore();
  if (label) {
    c.save();
    c.textAlign = "center"; c.textBaseline = "middle";
    c.font = `800 ${Math.round(r * 0.46)}px "Display", "Bangla"`;
    c.lineJoin = "round"; c.lineWidth = r * 0.07; c.strokeStyle = "#fbf0d6"; c.strokeText(label, cx, cy - r * 0.2);
    c.fillStyle = "#8a1c1c"; c.fillText(label, cx, cy - r * 0.2);
    c.restore();
  }
}

/** One boat as a sprite-sized drawing at (x, bow) scaled `size` times, rotated a quarter turn when `sideways`. */
export function boatAt(c: CanvasRenderingContext2D, scheme: Scheme, x: number, y: number, size: number, turn = 0, phase = 0.12, boss = false) {
  c.save(); c.translate(x, y); c.rotate(turn); c.scale(size, size);
  c.strokeStyle = "rgba(232,246,240,0.5)"; c.lineWidth = 1.4; c.lineCap = "round";
  c.beginPath(); c.moveTo(-7, 96); c.lineTo(-24, 170); c.moveTo(7, 96); c.lineTo(24, 170); c.stroke();
  c.strokeStyle = "#ead3a2"; c.lineWidth = 1.4;
  c.beginPath(); oarPath(c, 0, 0, phase); c.stroke();
  drawBoat(c, scheme, false, boss);
  c.restore();
}

/** The title picture's height over its width. */
export const TITLE_ASPECT = 1.08;
/** The first screen: the big ঢোল with the start word on its head, between two long boats on the world's water. */
export function drawTitleArt(canvas: HTMLCanvasElement, width: number, ratio: number, label: string, world: number) {
  const height = Math.round(width * TITLE_ASPECT);
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const c = canvas.getContext("2d");
  if (!c) return;
  c.setTransform(ratio, 0, 0, ratio, 0, 0);
  c.save();
  c.beginPath(); c.roundRect(0, 0, width, height, width * 0.07); c.clip();
  const unit = width / W;
  c.save(); c.scale(unit, unit); paintWater(c, W, height / unit, world); c.restore();
  c.fillStyle = "rgba(255,255,255,0.1)";
  for (let ring = 0; ring < 3; ring++) { c.beginPath(); c.arc(width / 2, height * 0.5, width * (0.34 + ring * 0.09), 0, Math.PI * 2); c.fill(); }
  const boats = [[1, 0.2, -0.04], [2, 0.82, 0.05]] as const;
  for (const [index, at, tilt] of boats) boatAt(c, SCHEMES[index], width * (at < 0.5 ? 0.14 : 0.86), height * (at < 0.5 ? 0.9 : 0.1), unit * 1.5, tilt + (at < 0.5 ? 0 : Math.PI), 0.1 + at * 0.3);
  boatAt(c, SCHEMES[0], width * 0.5, height * 1.02, unit * 1.9, 0, 0.1);
  drawDrum(c, width / 2, height * 0.5, width * 0.34, label);
  c.restore();
}

export const STORY_ASPECT = 0.72;
/** The three story pictures, in the same drawing. 0: the river and the crowd, 1: the drum and the oars, 2: the patch and the rope. */
export function drawStoryPanel(canvas: HTMLCanvasElement, width: number, ratio: number, index: number) {
  const height = Math.round(width * STORY_ASPECT);
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const c = canvas.getContext("2d");
  if (!c) return;
  c.setTransform(ratio, 0, 0, ratio, 0, 0);
  const unit = width / W;
  c.save(); c.beginPath(); c.rect(0, 0, width, height); c.clip();
  c.save(); c.scale(unit, unit);
  paintWater(c, W, height / unit + 10, index === 2 ? 2 : 0);
  c.restore();
  if (index === 0) {
    // Four long boats side by side at the starting rope, the crowd on the banks.
    c.save(); c.scale(unit, unit); paintBanks(c, W, height / unit + 10, 0); c.restore();
    for (let lane = 0; lane < 4; lane++) boatAt(c, SCHEMES[lane], width * (0.2 + lane * 0.2), height * 0.72, unit * 1.2, 0, 0.1 + lane * 0.2);
    c.save(); c.translate(0, height * 0.66); c.scale(unit, unit); drawRope(c, W); c.restore();
  } else if (index === 1) {
    boatAt(c, SCHEMES[0], width * 0.5, height * -0.02, unit * 2.6, 0, 0.35);
    const r = width * 0.2;
    drawDrum(c, width * 0.5, height * 0.4, r);
    c.strokeStyle = "#fff6dc"; c.lineWidth = width * 0.012;
    c.beginPath(); c.arc(width * 0.5, height * 0.4, r * 1.35, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = "#ffd166"; c.lineWidth = width * 0.02;
    c.beginPath(); c.arc(width * 0.5, height * 0.4, r * 1.02, 0, Math.PI * 2); c.stroke();
  } else {
    c.save(); c.translate(width * 0.34, height * 0.34); c.scale(unit * 2.2, unit * 2.2); drawPatch(c, 1, true); c.restore();
    boatAt(c, SCHEMES[0], width * 0.6, height * 0.5, unit * 1.5, 0, 0.2);
    c.strokeStyle = "#ffd166"; c.lineWidth = width * 0.02; c.lineCap = "round"; c.lineJoin = "round";
    c.beginPath(); c.moveTo(width * 0.58, height * 0.46); c.quadraticCurveTo(width * 0.58, height * 0.36, width * 0.7, height * 0.3); c.stroke();
    c.beginPath(); c.moveTo(width * 0.66, height * 0.28); c.lineTo(width * 0.71, height * 0.29); c.lineTo(width * 0.69, height * 0.34); c.stroke();
    c.save(); c.translate(0, height * 0.12); c.scale(unit, unit); drawRope(c, W); c.restore();
  }
  c.restore();
}

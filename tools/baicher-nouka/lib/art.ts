// Drawings in game units, shared by the scene and the result card: the racing boats from above, কচুরিপানা, the water,
// the crowded banks and the rope with its little flags. All our own, drawn from scratch.
import { makeRng } from "../../../shared/game-core";
import { BANK, BOAT_LEN, LANE_W, LANES } from "./race";

export type Scheme = { paint: string; band: string; dots: string; shirt: string; flag: string };
/** Yours first (indigo and yellow), then the red, green and yellow rivals. Each also differs in its band, motifs and flag. */
export const SCHEMES: readonly Scheme[] = [
  { paint: "#2a62c4", band: "#f2c230", dots: "#e04a2f", shirt: "#f2c230", flag: "#f2c230" },
  { paint: "#b3302a", band: "#f6ead2", dots: "#1e3a2a", shirt: "#f6ead2", flag: "#f6ead2" },
  { paint: "#2c7a43", band: "#f4d35e", dots: "#b3302a", shirt: "#ef7d22", flag: "#b3302a" },
  { paint: "#d8961c", band: "#3b2416", dots: "#2c7a43", shirt: "#7a2e1d", flag: "#2c7a43" },
];
export const WATER = "#5a9188", WOOD = "#2a1a10", DECK = "#6e4526";
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
export function drawBoat(c: CanvasRenderingContext2D, scheme: Scheme, glow = false) {
  c.save(); c.translate(3, 4); c.fillStyle = "rgba(18,46,44,0.28)"; hull(c, 10); c.fill(); c.restore();
  if (glow) { c.strokeStyle = "rgba(255,250,225,0.75)"; c.lineWidth = 2.4; hull(c, 11.2); c.stroke(); }
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
 * The caller sets the stroke colour and width.
 */
export function oarPath(c: CanvasRenderingContext2D, x: number, y: number, p: number) {
  const angle = p < 0.45 ? -0.6 + 1.2 * (p / 0.45) : 0.6 - 1.2 * ((p - 0.45) / 0.55);
  const dx = OAR_LEN * Math.cos(angle), dy = OAR_LEN * Math.sin(angle);
  for (const row of ROWS) {
    c.moveTo(x - OAR_ROOT, y + row); c.lineTo(x - OAR_ROOT - dx, y + row + dy);
    c.moveTo(x + OAR_ROOT, y + row); c.lineTo(x + OAR_ROOT + dx, y + row + dy);
  }
}

/** A floating raft of কচুরিপানা: glossy rounded leaves and a few pale lilac flowers, centred on (0, 0), about 46 × 52. */
export function drawPatch(c: CanvasRenderingContext2D, look: number) {
  const rng = makeRng(look * 7 + 3);
  c.fillStyle = "rgba(24,64,40,0.32)"; c.beginPath(); c.ellipse(2, 3, 24, 28, 0, 0, Math.PI * 2); c.fill();
  const greens = ["#2f7433", "#3e8a3c", "#4f9e45", "#5cad4c"];
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

/** Open water: a monsoon-green river with soft ripples and current streaks. Tiles seamlessly every `h` units. */
export function paintWater(c: CanvasRenderingContext2D, w: number, h: number) {
  c.fillStyle = WATER; c.fillRect(0, 0, w, h);
  const rng = makeRng(21);
  c.lineCap = "round";
  for (let index = 0; index < h / 14; index++) {
    const x = rng() * w, y = rng() * h, length = 24 + rng() * 40;
    c.strokeStyle = "rgba(38,92,86,0.2)"; c.lineWidth = 2.2;
    for (const shift of [0, -h, h]) { c.beginPath(); c.moveTo(x, y + shift); c.quadraticCurveTo(x + length / 2, y + shift - 3, x + length, y + shift); c.stroke(); }
  }
  for (let index = 0; index < h / 3.6; index++) {
    const x = rng() * w, y = rng() * h, r = 3.5 + rng() * 6;
    c.strokeStyle = `rgba(220,242,232,${0.14 + rng() * 0.14})`; c.lineWidth = 1.1;
    for (const shift of [0, -h, h]) { c.beginPath(); c.arc(x, y + shift, r, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
  }
}

/** Both banks, packed with people and umbrellas watching, palms behind; buoys mark the lanes. Tiles every `h` units. Transparent in the river. */
export function paintBanks(c: CanvasRenderingContext2D, w: number, h: number) {
  const rng = makeRng(33);
  for (const side of [-1, 1]) {
    const edge = side < 0 ? BANK : w - BANK;
    const at = (inset: number) => side < 0 ? inset : w - inset;
    // Grass, then a wavy mud edge where the water laps.
    c.fillStyle = "#7da047";
    c.fillRect(side < 0 ? 0 : edge - 2, 0, BANK + 2, h);
    c.fillStyle = "#a98256";
    c.beginPath(); c.moveTo(edge, 0);
    for (let y = 0; y <= h; y += 8) c.lineTo(edge - side * (6 + 2 * Math.sin((y / h) * Math.PI * 12) + 1.4 * Math.sin((y / h) * Math.PI * 34)), y);
    c.lineTo(edge, h); c.closePath(); c.fill();
    c.strokeStyle = "rgba(255,255,255,0.35)"; c.lineWidth = 1;
    c.beginPath(); c.moveTo(edge + side * 1.5, 0); c.lineTo(edge + side * 1.5, h); c.stroke();
    // Palms and bushes along the back of the bank (they may spill off the edge).
    for (let y = 18 + rng() * 30; y < h - 10; y += 46 + rng() * 40) {
      const x = at(3 + rng() * 6);
      if (rng() < 0.55) {
        c.strokeStyle = "#3f7a2e"; c.lineWidth = 3.2; c.lineCap = "round";
        for (let frond = 0; frond < 7; frond++) {
          const angle = frond * 0.9 + y;
          c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(angle) * 8, y + Math.sin(angle) * 8 - 2, x + Math.cos(angle) * 14, y + Math.sin(angle) * 14); c.stroke();
        }
        dot(c, x, y, 2.4, "#6b4a2a");
      } else { dot(c, x, y, 8, "#5f8f3a"); dot(c, x - 2, y - 2, 5, "#6fa046"); }
    }
    // The crowd: little people packed along the edge, an umbrella here and there.
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
  }
  // Buoys between the lanes.
  for (let lane = 1; lane < LANES; lane++) {
    const x = BANK + LANE_W * lane;
    for (let y = 30; y < h; y += 120) {
      dot(c, x, y, 2.6, "rgba(20,40,40,0.35)");
      dot(c, x - 0.4, y - 0.6, 2.2, (y / 120) % 2 < 1 ? "#d9412f" : "#f4efe6");
    }
  }
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

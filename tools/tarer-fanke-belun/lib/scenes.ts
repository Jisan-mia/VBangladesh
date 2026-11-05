// The still pictures: the title's big balloon (the start button), and the three story panels. Browser only.
import { GROUND, R, type Gate } from "./belun";
import { drawCrow, drawGate, drawStick, paintBalloon, paintFar, paintMesh, paintShops, paintSky, PALETTES, SHOPS_H } from "./art";
import type { WorldId } from "./levels";

type Ctx = CanvasRenderingContext2D;
/** The title picture is this many units wide and high. */
export const TITLE_W = 300, TITLE_H = 330;
const TAU = Math.PI * 2;

const gateAt = (y: number, gap: number, k: number): Gate => ({ x: 0, w: 46, y, gap, k, sagTop: 20, sagLow: 6, swing: 0, freq: 0, phase: 0, knot: false, perch: 0.4, sitters: 0, kite: -1 });

/** A slice of the lane: sky, flats, shops, the mesh. `bottom` is the pavement's y in the picture. */
function lane(c: Ctx, width: number, top: number, world: WorldId) {
  paintSky(c, width, top, GROUND + 40, world);
  paintFar(c, width, world);
  c.save(); c.translate(0, GROUND - SHOPS_H); paintShops(c, Math.max(width, 300), world); c.restore();
  paintMesh(c, width, world);
}

/** The title: the red balloon big over the world's lane, with ওড়াও on its rubber. */
export function drawTitle(canvas: HTMLCanvasElement, width: number, dpr: number, world: WorldId, label: string) {
  const height = Math.round(width * TITLE_H / TITLE_W);
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  const c = canvas.getContext("2d")!, k = (width / TITLE_W) * dpr;
  // The picture shows the lane from y = GROUND − 300 down to the pavement and a little street.
  const top = GROUND + 30 - TITLE_H;
  c.setTransform(k, 0, 0, k, 0, -top * k);
  lane(c, TITLE_W, top, world);
  drawGate(c, gateAt(GROUND - 200, 150, 8), GROUND - 200, 258, world);
  if (world === 0) drawStick(c, 40, GROUND);
  else drawCrow(c, 236, GROUND - 268, -1, 1.2, world, 1.3);
  const bx = 132, by = GROUND - 170, size = 4.2;
  c.save();
  c.translate(bx, by);
  c.strokeStyle = PALETTES[world].night ? "#d8c9c0" : "#6b5a4e"; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(0, R * size * 1.2); c.quadraticCurveTo(-18, R * size * 1.2 + 40, -6, R * size * 1.2 + 70); c.quadraticCurveTo(8, R * size * 1.2 + 96, -10, R * size * 1.2 + 120); c.stroke();
  c.scale(size, size);
  paintBalloon(c, world);
  c.restore();
  c.save();
  c.translate(bx, by + 2);
  c.textAlign = "center"; c.textBaseline = "middle";
  c.font = '800 30px "Display", "Bangla"';
  c.lineWidth = 6; c.strokeStyle = "#8f1d33"; c.strokeText(label, 0, 0);
  c.fillStyle = "#fff6ea"; c.fillText(label, 0, 0);
  c.restore();
}

/** One of the three story panels, 3:2. */
export function drawStory(canvas: HTMLCanvasElement, width: number, dpr: number, panel: number) {
  const height = Math.round((width * 2) / 3);
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  const c = canvas.getContext("2d")!, units = 300, k = (width / units) * dpr, top = GROUND + 30 - 200;
  c.setTransform(k, 0, 0, k, 0, -top * k);
  lane(c, units, top, 0);
  if (panel === 0) {
    drawStick(c, 120, GROUND, false);
    seller(c, 150, GROUND);
  } else if (panel === 1) {
    drawStick(c, 120, GROUND, true);
    seller(c, 150, GROUND);
    c.strokeStyle = "#ffffff"; c.globalAlpha = 0.7; c.lineWidth = 2; c.lineCap = "round";
    for (let i = 0; i < 6; i++) { const y = GROUND - 190 + i * 22; c.beginPath(); c.moveTo(20 + i * 18, y); c.lineTo(70 + i * 18, y - 20); c.stroke(); }
    c.globalAlpha = 1; c.lineCap = "butt";
    c.save(); c.translate(210, GROUND - 190); c.rotate(0.2); c.scale(1.6, 1.6); paintBalloon(c, 0); c.restore();
    c.strokeStyle = "#6b5a4e"; c.lineWidth = 1;
    c.beginPath(); c.moveTo(204, GROUND - 160); c.quadraticCurveTo(190, GROUND - 130, 196, GROUND - 105); c.stroke();
  } else {
    drawGate(c, gateAt(GROUND - 150, 120, 4), GROUND - 150, 190, 0);
    c.save(); c.translate(150, GROUND - 152); c.scale(1.4, 1.4); paintBalloon(c, 0); c.restore();
    // A thumb pressing below, and the up/down arrows: hold to rise, let go to sink.
    c.fillStyle = "#241d1c";
    c.beginPath(); c.moveTo(60, GROUND - 190); c.lineTo(52, GROUND - 176); c.lineTo(68, GROUND - 176); c.fill();
    c.beginPath(); c.moveTo(60, GROUND - 120); c.lineTo(52, GROUND - 134); c.lineTo(68, GROUND - 134); c.fill();
    c.fillRect(58, GROUND - 176, 4, 42);
    c.fillStyle = "#f0c8a8"; c.strokeStyle = "#8a5a3c"; c.lineWidth = 1.5;
    c.beginPath(); c.ellipse(60, GROUND - 82, 13, 18, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = "#ffffffaa"; c.beginPath(); c.ellipse(60, GROUND - 92, 7, 5, 0, 0, TAU); c.fill();
  }
}

/** The বেলুনওয়ালা মামা: a cap, a striped shirt, a lungi. */
function seller(c: Ctx, x: number, ground: number) {
  c.fillStyle = "#2b5a8a"; c.fillRect(x - 9, ground - 40, 18, 40);
  c.fillStyle = "#e8d7b8"; c.fillRect(x - 10, ground - 74, 20, 36);
  c.fillStyle = "#c2412d"; for (let i = 0; i < 4; i++) c.fillRect(x - 10, ground - 70 + i * 9, 20, 3);
  c.fillStyle = "#8a5a3c"; c.beginPath(); c.arc(x, ground - 84, 9, 0, TAU); c.fill();
  c.fillStyle = "#ffffff"; c.beginPath(); c.ellipse(x, ground - 91, 9, 4, 0, Math.PI, TAU); c.fill();
  c.strokeStyle = "#8a5a3c"; c.lineWidth = 4; c.lineCap = "round";
  c.beginPath(); c.moveTo(x - 9, ground - 68); c.lineTo(x - 26, ground - 84); c.stroke();
  c.lineCap = "butt";
}

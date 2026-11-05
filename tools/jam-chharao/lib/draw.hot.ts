// Draws one frame of the street from the cached sprites. Runs every frame while anything moves: numbers in, pixels out, no
// objects, arrays, closures or strings made here (npm run lint:games checks it).
import { SIDE, TOP } from "./art";
import type { Motion } from "./motion";
import type { View } from "./scene";

const DASH = [7, 6];
const SOLID: number[] = [];
const HALO = "#ffffff", GOLD = "#ffd23f", GHOST = "rgba(255,210,63,0.22)";

function drawOne(c: CanvasRenderingContext2D, v: View, m: Motion, i: number) {
  const sprite = v.sprites[i];
  if (!sprite) return;
  const cell = v.cell, at = m.x[i], line = v.line[i];
  const w = (v.down[i] ? 1 : v.len[i]) * cell, h = (v.down[i] ? v.len[i] : 1) * cell;
  const px = (SIDE + (v.down[i] ? line : at)) * cell, py = (TOP + (v.down[i] ? at : line)) * cell;
  if (py > v.height || py + h < 0) return;
  const grow = m.lift[i] * 0.06;
  c.drawImage(sprite, px - w * grow / 2 - m.lift[i] * cell * 0.02, py - h * grow / 2 - m.lift[i] * cell * 0.04, w * (1 + grow), h * (1 + grow));
}

/** The whole street: the cached background, every vehicle (the held one on top), then the hint's ghost and the picked outline. */
export function drawBoard(c: CanvasRenderingContext2D, v: View, m: Motion, held: number, picked: number, hintCar: number, hintTo: number, clock: number) {
  if (!v.street) return;
  c.drawImage(v.street, 0, 0, v.width, v.height);
  for (let i = 0; i < v.n; i++) if (i !== held) drawOne(c, v, m, i);
  if (held >= 0) drawOne(c, v, m, held);
  const cell = v.cell;
  if (hintCar >= 0 && hintCar < v.n) {
    const down = v.down[hintCar], line = v.line[hintCar];
    const w = (down ? 1 : v.len[hintCar]) * cell, h = (down ? v.len[hintCar] : 1) * cell;
    const fx = (SIDE + (down ? line : m.x[hintCar])) * cell, fy = (TOP + (down ? m.x[hintCar] : line)) * cell;
    const tx = (SIDE + (down ? line : hintTo)) * cell, ty = (TOP + (down ? hintTo : line)) * cell;
    c.fillStyle = GHOST;
    c.beginPath(); c.roundRect(tx + 2, ty + 2, w - 4, h - 4, cell * 0.2); c.fill();
    c.setLineDash(DASH);
    c.lineDashOffset = -clock * 18;
    c.lineWidth = Math.max(2.5, cell * 0.06); c.strokeStyle = GOLD;
    c.stroke();
    c.setLineDash(SOLID);
    // an arrow from the car to where it should go
    const ax = fx + w / 2, ay = fy + h / 2, bx = tx + w / 2, by = ty + h / 2;
    const dx = bx - ax, dy = by - ay, length = Math.sqrt(dx * dx + dy * dy);
    if (length > cell * 0.3) {
      const ux = dx / length, uy = dy / length, head = cell * 0.22;
      c.strokeStyle = HALO; c.lineWidth = Math.max(4, cell * 0.12); c.lineCap = "round"; c.lineJoin = "round";
      c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.moveTo(bx - ux * head + uy * head * 0.7, by - uy * head - ux * head * 0.7); c.lineTo(bx, by); c.lineTo(bx - ux * head - uy * head * 0.7, by - uy * head + ux * head * 0.7); c.stroke();
      c.strokeStyle = GOLD; c.lineWidth = Math.max(2, cell * 0.06);
      c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.moveTo(bx - ux * head + uy * head * 0.7, by - uy * head - ux * head * 0.7); c.lineTo(bx, by); c.lineTo(bx - ux * head - uy * head * 0.7, by - uy * head + ux * head * 0.7); c.stroke();
    }
  }
  if (picked >= 0 && picked < v.n) {
    const down = v.down[picked], line = v.line[picked];
    const w = (down ? 1 : v.len[picked]) * cell, h = (down ? v.len[picked] : 1) * cell;
    const x = (SIDE + (down ? line : m.x[picked])) * cell, y = (TOP + (down ? m.x[picked] : line)) * cell;
    c.lineWidth = Math.max(3, cell * 0.08); c.strokeStyle = HALO;
    c.beginPath(); c.roundRect(x + 1, y + 1, w - 2, h - 2, cell * 0.2); c.stroke();
    c.lineWidth = Math.max(1.5, cell * 0.035); c.strokeStyle = GOLD;
    c.stroke();
  }
}

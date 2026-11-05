// Each world's backdrop behind the picture and the word, drawn once in code per world and size (the component redraws only on
// a resize or a new world). Calm and low in contrast, so the picture stays the one thing to look at.
import type { WorldId } from "./levels";

type C = CanvasRenderingContext2D;
const TAU = Math.PI * 2;

/** One palette per world, shared by the backdrop and the page's CSS (data-world). */
export const PALETTE: Record<WorldId, { top: string; bottom: string; ground: string; mark: string; accent: string; deep: string }> = {
  0: { top: "#fff8e6", bottom: "#ffecc2", ground: "#f0d49b", mark: "#d9b673", accent: "#a8660b", deep: "#6b4107" },
  1: { top: "#f0f8ec", bottom: "#d9eed0", ground: "#b4d79e", mark: "#8fc072", accent: "#2f7d5b", deep: "#1c5139" },
  2: { top: "#eef5fc", bottom: "#d4e6f6", ground: "#a9c9e6", mark: "#82aed6", accent: "#2563a8", deep: "#17406f" },
  3: { top: "#f6f0fc", bottom: "#e5d8f6", ground: "#cdb8ea", mark: "#b095d9", accent: "#7a45c4", deep: "#4d2a85" },
};

const BULBS = ["#f2b33d", "#e9748f", "#58b39b", "#6c9bd2"];

export function drawWorld(c: C, world: WorldId, w: number, h: number) {
  const p = PALETTE[world];
  const sky = c.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, p.top); sky.addColorStop(1, p.bottom);
  c.fillStyle = sky; c.fillRect(0, 0, w, h);
  const ground = h * 0.82;
  c.lineCap = "round"; c.lineJoin = "round";

  if (world === 0) {
    // The workshop wall: a window with a pale morning sun, a shelf, and the conveyor belt with its rollers.
    c.fillStyle = "#fff1c9"; c.beginPath(); c.roundRect(w * 0.68, h * 0.07, w * 0.26, h * 0.26, 10); c.fill();
    c.fillStyle = "#ffd77a"; c.beginPath(); c.arc(w * 0.81, h * 0.2, h * 0.07, 0, TAU); c.fill();
    c.strokeStyle = p.mark; c.lineWidth = 3; c.strokeRect(w * 0.68, h * 0.07, w * 0.26, h * 0.26);
    c.beginPath(); c.moveTo(w * 0.81, h * 0.07); c.lineTo(w * 0.81, h * 0.33); c.stroke();
    c.fillStyle = p.ground; c.fillRect(0, ground, w, h - ground);
    c.strokeStyle = p.mark; c.lineWidth = 2;
    for (let x = 10; x < w; x += 26) { c.beginPath(); c.arc(x, ground + (h - ground) / 2, 7, 0, TAU); c.stroke(); }
  } else if (world === 1) {
    // Far hills and the village road with its dashes.
    c.fillStyle = "#cde6bd";
    c.beginPath(); c.moveTo(0, ground); c.quadraticCurveTo(w * 0.25, ground - h * 0.17, w * 0.5, ground - h * 0.05); c.quadraticCurveTo(w * 0.75, ground - h * 0.2, w, ground - h * 0.03); c.lineTo(w, ground); c.closePath(); c.fill();
    c.fillStyle = p.ground; c.fillRect(0, ground, w, h - ground);
    c.strokeStyle = "#f4f9ef"; c.lineWidth = 4;
    for (let x = 6; x < w; x += 40) { c.beginPath(); c.moveTo(x, ground + (h - ground) / 2); c.lineTo(x + 20, ground + (h - ground) / 2); c.stroke(); }
  } else if (world === 2) {
    // The science room: a shelf with flasks, and the bench below.
    const shelf = h * 0.3;
    c.strokeStyle = p.mark; c.lineWidth = 4; c.beginPath(); c.moveTo(w * 0.06, shelf); c.lineTo(w * 0.94, shelf); c.stroke();
    const flasks = ["#9fd0f0", "#f6c27a", "#a9dcb5", "#e7a6c8"];
    for (let i = 0; i < 4; i++) {
      const x = w * (0.18 + i * 0.21), r = 11 + (i % 2) * 3;
      c.fillStyle = flasks[i]; c.beginPath(); c.arc(x, shelf - r - 2, r, 0, TAU); c.fill();
      c.fillRect(x - 3.5, shelf - r * 2 - 12, 7, 12);
    }
    c.fillStyle = p.ground; c.fillRect(0, ground, w, h - ground);
    c.fillStyle = p.mark; c.fillRect(0, ground, w, 3);
  } else {
    // An evening fair: a moon, a few stars, a string of coloured bulbs.
    c.fillStyle = "#fffbe8"; c.beginPath(); c.arc(w * 0.82, h * 0.17, h * 0.06, 0, TAU); c.fill();
    c.fillStyle = "#fff"; 
    for (const [x, y] of [[0.14, 0.2], [0.3, 0.12], [0.5, 0.22], [0.64, 0.1], [0.92, 0.32]]) { c.beginPath(); c.arc(w * x, h * y, 2.2, 0, TAU); c.fill(); }
    c.strokeStyle = "#b9a3d6"; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(0, h * 0.06); c.quadraticCurveTo(w / 2, h * 0.17, w, h * 0.06); c.stroke();
    for (let i = 0, n = Math.max(6, Math.round(w / 38)); i < n; i++) {
      const t = (i + 0.5) / n, x = t * w, y = h * 0.06 + h * 0.11 * 2 * t * (1 - t) + 6;
      c.fillStyle = BULBS[i % BULBS.length]; c.beginPath(); c.arc(x, y, 5, 0, TAU); c.fill();
    }
    c.fillStyle = p.ground; c.fillRect(0, ground, w, h - ground);
  }
}

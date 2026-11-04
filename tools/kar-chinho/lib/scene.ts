// Each world's backdrop behind the picture and the word, drawn once in code per world and size (the component redraws
// only on a resize or a new world). Calm and low in contrast, so the picture stays the one thing to look at.
import type { WorldId } from "./levels";

type C = CanvasRenderingContext2D;
const TAU = Math.PI * 2;

/** One palette per world, shared by the backdrop and the page's CSS (data-world). */
export const PALETTE: Record<WorldId, { top: string; bottom: string; ground: string; mark: string; accent: string; deep: string }> = {
  0: { top: "#fff7e3", bottom: "#ffe6b5", ground: "#f2d7a6", mark: "#e3bb78", accent: "#b5541b", deep: "#7d3510" },
  1: { top: "#f1f8e6", bottom: "#dcefc6", ground: "#bcdc93", mark: "#94c46a", accent: "#3f7d2a", deep: "#275418" },
  2: { top: "#ecf6fa", bottom: "#d3eaf3", ground: "#a7d4e6", mark: "#7fbdd6", accent: "#1f6f8b", deep: "#134a5e" },
  3: { top: "#fff0f6", bottom: "#fbdcea", ground: "#f5cadd", mark: "#eaa9c6", accent: "#a8326a", deep: "#7a2350" },
};

const FLAGS = ["#e9748f", "#f2b33d", "#58b39b", "#6c9bd2", "#c387d8"];

export function drawWorld(c: C, world: WorldId, w: number, h: number) {
  const p = PALETTE[world];
  const sky = c.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, p.top); sky.addColorStop(1, p.bottom);
  c.fillStyle = sky; c.fillRect(0, 0, w, h);
  const ground = h * 0.8;

  if (world === 0) {
    // A pale morning sun over the yard, the yard's packed earth, a few tufts of grass.
    c.fillStyle = "#ffe29a"; c.globalAlpha = 0.45; c.beginPath(); c.arc(w * 0.84, h * 0.17, h * 0.13, 0, TAU); c.fill();
    c.globalAlpha = 1; c.fillStyle = "#ffd77a"; c.beginPath(); c.arc(w * 0.84, h * 0.17, h * 0.075, 0, TAU); c.fill();
    c.fillStyle = p.ground; c.fillRect(0, ground, w, h - ground);
    c.strokeStyle = p.mark; c.lineWidth = 2; c.lineCap = "round";
    for (let x = w * 0.06; x < w; x += w * 0.17) {
      c.beginPath(); c.moveTo(x, ground + 6); c.lineTo(x - 4, ground - 4); c.moveTo(x, ground + 6); c.lineTo(x + 1, ground - 7); c.moveTo(x, ground + 6); c.lineTo(x + 5, ground - 3); c.stroke();
    }
  } else if (world === 1) {
    // Far hills, then the paddy field in rows.
    c.fillStyle = "#cfe6b2";
    c.beginPath(); c.moveTo(0, ground); c.quadraticCurveTo(w * 0.25, ground - h * 0.16, w * 0.5, ground - h * 0.04); c.quadraticCurveTo(w * 0.75, ground - h * 0.18, w, ground - h * 0.02); c.lineTo(w, ground); c.closePath(); c.fill();
    c.fillStyle = p.ground; c.fillRect(0, ground, w, h - ground);
    c.strokeStyle = p.mark; c.lineWidth = 2;
    for (let row = 0; row < 3; row++) {
      const y = ground + 6 + row * (h - ground) / 3;
      for (let x = 8 + row * 9; x < w; x += 22) { c.beginPath(); c.moveTo(x, y + 6); c.lineTo(x - 3, y - 3); c.moveTo(x, y + 6); c.lineTo(x + 3, y - 3); c.stroke(); }
    }
  } else if (world === 2) {
    // The far bank, then the river with slow waves.
    c.fillStyle = "#b9dcc0"; c.fillRect(0, ground - h * 0.03, w, h * 0.03);
    c.fillStyle = p.ground; c.fillRect(0, ground, w, h - ground);
    c.strokeStyle = p.mark; c.lineWidth = 2.5; c.lineCap = "round";
    for (let row = 0; row < 2; row++) {
      const y = ground + 10 + row * (h - ground) * 0.45;
      c.beginPath(); c.moveTo(row * 14, y);
      for (let x = row * 14; x < w; x += 28) c.quadraticCurveTo(x + 7, y - 5, x + 14, y);
      c.stroke();
    }
  } else {
    // মেলা: a string of paper flags across the top, the fair ground below.
    c.strokeStyle = "#c9a2b4"; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(0, h * 0.06); c.quadraticCurveTo(w / 2, h * 0.16, w, h * 0.06); c.stroke();
    for (let i = 0, n = Math.max(6, Math.round(w / 34)); i < n; i++) {
      const t = (i + 0.5) / n, x = t * w, y = h * 0.06 + (h * 0.1) * 4 * t * (1 - t) * 0.5 + 1;
      c.fillStyle = FLAGS[i % FLAGS.length];
      c.beginPath(); c.moveTo(x - 9, y); c.lineTo(x + 9, y); c.lineTo(x, y + 16); c.closePath(); c.fill();
    }
    c.fillStyle = p.ground; c.fillRect(0, ground, w, h - ground);
  }
}

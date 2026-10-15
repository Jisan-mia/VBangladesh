// One small picture per word, drawn in code on a 100-unit square centred on (0, 0). Words অ-তে অজগর already draws
// (মাছ, কলা, ঘুড়ি, নৌকা…) come from there so the two games look like one primer; the rest are drawn here, all our own.
import { drawPicture as drawPrimerPicture, hasPicture as primerHas } from "../../o-te-ojogor/lib/art";

type C = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
const INK = "#3b2a17";

function circle(c: C, x: number, y: number, r: number, fill: string) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = fill; c.fill(); }
function oval(c: C, x: number, y: number, rx: number, ry: number, fill: string, turn = 0) { c.beginPath(); c.ellipse(x, y, rx, ry, turn, 0, TAU); c.fillStyle = fill; c.fill(); }
function box(c: C, x: number, y: number, w: number, h: number, fill: string, radius = 0) { c.beginPath(); c.roundRect(x, y, w, h, radius); c.fillStyle = fill; c.fill(); }
function shape(c: C, points: number[], fill: string) {
  c.beginPath(); c.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) c.lineTo(points[i], points[i + 1]);
  c.closePath(); c.fillStyle = fill; c.fill();
}
function line(c: C, points: number[], color: string, width: number) {
  c.beginPath(); c.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) c.lineTo(points[i], points[i + 1]);
  c.strokeStyle = color; c.lineWidth = width; c.lineCap = "round"; c.lineJoin = "round"; c.stroke();
}
function ring(c: C, x: number, y: number, r: number, color: string, width: number) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.strokeStyle = color; c.lineWidth = width; c.stroke(); }
function eyes(c: C, x: number, y: number, gap: number, r = 3) { circle(c, x - gap, y, r, INK); circle(c, x + gap, y, r, INK); }
function smile(c: C, x: number, y: number, w: number, width = 2.5) {
  c.beginPath(); c.arc(x, y - w * 0.4, w, 0.25 * Math.PI, 0.75 * Math.PI); c.strokeStyle = INK; c.lineWidth = width; c.lineCap = "round"; c.stroke();
}
function leaf(c: C, x: number, y: number, size: number, turn: number, fill = "#4f9d3a") { oval(c, x, y, size, size * 0.45, fill, turn); }
function wave(c: C, y: number, from: number, to: number, color: string, width: number, height = 5) {
  c.beginPath(); c.moveTo(from, y);
  for (let x = from; x < to; x += 16) c.quadraticCurveTo(x + 8, y - height, x + 16, y);
  c.strokeStyle = color; c.lineWidth = width; c.lineCap = "round"; c.stroke();
}

const PICTURES: Record<string, (c: C) => void> = {
  cat(c) {
    c.beginPath(); c.moveTo(30, 30); c.quadraticCurveTo(52, 20, 42, -6); c.strokeStyle = "#e08a3c"; c.lineWidth = 7; c.lineCap = "round"; c.stroke();
    oval(c, 8, 22, 28, 20, "#f2a65a");
    shape(c, [-36, -14, -32, -40, -18, -24], "#f2a65a"); shape(c, [-4, -14, -6, -40, -20, -24], "#f2a65a");
    circle(c, -20, -6, 21, "#f2a65a");
    shape(c, [-31, -20, -30, -33, -22, -24], "#f7c9a0"); shape(c, [-9, -20, -10, -33, -18, -24], "#f7c9a0");
    eyes(c, -20, -9, 7, 2.8);
    shape(c, [-23, -1, -17, -1, -20, 2], "#e0566b");
    for (const s of [-1, 1]) { line(c, [-20 + s * 9, 2, -20 + s * 24, -1], INK, 1.5); line(c, [-20 + s * 9, 5, -20 + s * 24, 7], INK, 1.5); }
  },
  river(c) {
    box(c, -46, -40, 92, 80, "#cfeefc", 10);
    shape(c, [-46, -10, -10, -18, 46, -6, 46, 40, -46, 40], "#7cc36b");
    c.beginPath(); c.moveTo(-46, 40); c.bezierCurveTo(-20, 10, 10, 6, 6, -14); c.lineTo(22, -12); c.bezierCurveTo(30, 10, 10, 26, 30, 40); c.closePath();
    c.fillStyle = "#4aa3df"; c.fill();
    wave(c, 22, -14, 14, "#d8f0fb", 2.5, 4);
    circle(c, 28, -28, 9, "#f6d23b");
  },
  arrow(c) {
    line(c, [-36, 30, 30, -28], "#a8743d", 6);
    shape(c, [40, -38, 22, -32, 34, -20], "#7d8a96");
    shape(c, [-36, 30, -46, 26, -40, 16, -30, 22], "#e8623b");
    shape(c, [-36, 30, -40, 40, -30, 46, -26, 36], "#e8623b");
  },
  seeds(c) {
    line(c, [6, 10, 6, -18], "#4f9d3a", 4);
    leaf(c, -6, -22, 12, -0.5); leaf(c, 18, -26, 12, 0.5);
    for (const [x, y, turn] of [[-24, 26, 0.4], [4, 30, -0.2], [30, 24, 0.6]] as const) {
      oval(c, x, y, 12, 8, "#9a6b3c", turn); oval(c, x - 3, y - 2, 4, 2.5, "#c79b6b", turn);
    }
  },
  earth(c) {
    circle(c, 0, 0, 40, "#4aa3df");
    c.save(); c.beginPath(); c.arc(0, 0, 40, 0, TAU); c.clip();
    oval(c, -14, -14, 18, 12, "#6abf5e", 0.4); oval(c, 18, 8, 14, 20, "#6abf5e", -0.3); oval(c, -12, 24, 10, 7, "#6abf5e");
    c.restore();
    ring(c, 0, 0, 40, "#2f6f9f", 2.5);
  },
  radish(c) {
    leaf(c, -10, -32, 16, -1.1, "#4f9d3a"); leaf(c, 8, -34, 16, -1.9, "#5fb34a"); leaf(c, 0, -38, 14, -1.55, "#3f8a2f");
    c.beginPath(); c.moveTo(-14, -20); c.quadraticCurveTo(0, -26, 14, -20); c.quadraticCurveTo(10, 20, 2, 44); c.quadraticCurveTo(-8, 20, -14, -20);
    c.fillStyle = "#f8f4ec"; c.fill(); c.strokeStyle = "#d8cfbf"; c.lineWidth = 2; c.stroke();
    line(c, [-6, 0, -1, 0], "#d8cfbf", 1.5); line(c, [2, 14, 6, 14], "#d8cfbf", 1.5);
  },
  dog(c) {
    oval(c, -30, -6, 11, 24, "#8a5a32", 0.25); oval(c, 30, -6, 11, 24, "#8a5a32", -0.25);
    circle(c, 0, 0, 30, "#d9a066");
    oval(c, 0, 16, 16, 12, "#f3dcc0");
    eyes(c, 0, -6, 11, 3.4);
    oval(c, 0, 8, 6, 4.5, INK);
    smile(c, 0, 20, 6);
  },
  shoes(c) {
    for (const x of [-22, 18]) {
      c.beginPath(); c.moveTo(x - 20, 24); c.lineTo(x - 20, -4); c.quadraticCurveTo(x - 6, -8, x - 2, 6); c.quadraticCurveTo(x + 22, 8, x + 24, 24); c.closePath();
      c.fillStyle = "#c0392b"; c.fill();
      box(c, x - 22, 22, 48, 7, "#5d4a3a", 3);
      line(c, [x - 8, 2, x - 2, 10], "#fff", 2); line(c, [x - 14, 4, x - 8, 12], "#fff", 2);
    }
  },
  litchi(c) {
    line(c, [0, -40, 0, -24], "#6b4a2b", 3);
    leaf(c, 14, -36, 14, 0.3); leaf(c, -14, -36, 12, -0.4, "#5fb34a");
    for (const [x, y] of [[-14, -8], [14, -8], [0, 14], [-18, 22], [18, 22]] as const) {
      circle(c, x, y, 14, "#d64550");
      for (let a = 0; a < 6; a++) circle(c, x + Math.cos(a) * 7, y + Math.sin(a) * 7, 1.6, "#a02a35");
    }
  },
  sun(c) {
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; line(c, [Math.cos(a) * 30, Math.sin(a) * 30, Math.cos(a) * 44, Math.sin(a) * 44], "#f2a900", 5); }
    circle(c, 0, 0, 26, "#f6d23b");
    eyes(c, 0, -4, 9, 3); smile(c, 0, 8, 8);
  },
  anklet(c) {
    c.beginPath(); c.ellipse(0, 0, 38, 20, 0, 0, TAU); c.strokeStyle = "#b9c2cc"; c.lineWidth = 5; c.stroke();
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * 0.1 + (i / 8) * Math.PI * 0.8, x = Math.cos(a) * 38, y = Math.sin(a) * 20;
      line(c, [x, y, x, y + 7], "#9aa5b1", 1.5); circle(c, x, y + 11, 5, "#d7dde3"); circle(c, x - 1.5, y + 9.5, 1.5, "#fff");
    }
  },
  comet(c) {
    shape(c, [10, -20, -46, 40, 28, 4], "#bfe3f7");
    shape(c, [12, -14, -30, 32, 22, 0], "#7cc7ee");
    circle(c, 18, -12, 16, "#f6d23b"); circle(c, 13, -16, 5, "#fff6c2");
    for (const [x, y] of [[-30, -30], [30, 34], [-8, -40]] as const) circle(c, x, y, 2.5, "#f2a900");
  },
  farmer(c) {
    oval(c, 0, 40, 30, 14, "#4f9d3a");
    circle(c, 0, 6, 22, "#c98b5a");
    eyes(c, 0, 4, 8, 2.8); smile(c, 0, 14, 7);
    shape(c, [-44, -10, 0, -40, 44, -10], "#d9b45a");
    line(c, [-44, -10, 44, -10], "#a8843a", 3); line(c, [-22, -24, 0, -40, 22, -24], "#a8843a", 1.5);
    line(c, [36, 40, 38, 8], "#4f9d3a", 3); oval(c, 40, 4, 4, 8, "#e0b34a", 0.2);
  },
  heart(c) {
    c.beginPath(); c.moveTo(0, 38); c.bezierCurveTo(-60, 0, -30, -46, 0, -18); c.bezierCurveTo(30, -46, 60, 0, 0, 38);
    c.fillStyle = "#e0485a"; c.fill();
    oval(c, -20, -16, 7, 4, "#f7a1ad", -0.6);
  },
  circle(c) {
    ring(c, 0, 0, 36, "#3d7cc9", 7);
    circle(c, 0, 0, 4, INK);
    line(c, [0, 0, 36, 0], INK, 2);
  },
  woodapple(c) {
    line(c, [0, -30, 4, -42], "#6b4a2b", 3); leaf(c, 16, -38, 12, 0.4);
    circle(c, 0, 4, 34, "#b9c25a");
    oval(c, -12, -8, 10, 6, "#dfe39a", -0.5);
    for (const [x, y] of [[10, 12], [-6, 20], [18, -6]] as const) circle(c, x, y, 2, "#8c9440");
  },
  balloon(c) {
    c.beginPath(); c.moveTo(0, 26); c.quadraticCurveTo(-10, 36, 2, 44); c.quadraticCurveTo(10, 50, -2, 52); c.strokeStyle = "#5d4a3a"; c.lineWidth = 2; c.stroke();
    oval(c, 0, -8, 26, 32, "#e8623b");
    shape(c, [-5, 26, 5, 26, 0, 20], "#c44a2a");
    oval(c, -10, -20, 6, 10, "#f6a68a", 0.3);
  },
  cloud(c) {
    for (const [x, y, r] of [[-24, 8, 16], [-6, -6, 20], [18, -2, 18], [28, 12, 13], [0, 12, 16]] as const) circle(c, x, y, r + 2.5, "#7d97b3");
    for (const [x, y, r] of [[-24, 8, 16], [-6, -6, 20], [18, -2, 18], [28, 12, 13], [0, 12, 16]] as const) circle(c, x, y, r, "#e3ecf5");
    for (const x of [-18, 0, 18]) line(c, [x, 34, x - 4, 44], "#4aa3df", 3);
  },
  wave(c) {
    c.beginPath(); c.moveTo(-46, 40); c.lineTo(-46, 0);
    c.bezierCurveTo(-36, -36, 10, -40, 14, -8); c.bezierCurveTo(6, -20, -10, -12, -4, 2);
    c.bezierCurveTo(10, 12, 30, 4, 46, -6); c.lineTo(46, 40); c.closePath();
    c.fillStyle = "#3d8fd1"; c.fill();
    wave(c, 22, -42, 42, "#bfe3f7", 3);
    oval(c, 4, -14, 9, 5, "#fff", 0.6);
  },
  brinjal(c) {
    c.beginPath(); c.moveTo(-6, -22); c.bezierCurveTo(-40, -6, -36, 44, 6, 40); c.bezierCurveTo(40, 36, 30, -6, 12, -22); c.closePath();
    c.fillStyle = "#6b3a8f"; c.fill();
    shape(c, [-12, -22, 3, -34, 18, -22, 10, -14, 3, -20, -4, -14], "#4f9d3a");
    line(c, [3, -32, 8, -44], "#4f9d3a", 4);
    oval(c, -12, 6, 4, 12, "#9a6cbf", 0.2);
  },
  oar(c) {
    line(c, [-36, -36, 14, 14], "#a8743d", 6);
    c.beginPath(); c.ellipse(26, 26, 12, 24, -Math.PI / 4, 0, TAU); c.fillStyle = "#c98b4a"; c.fill();
    line(c, [-40, -40, -32, -32], "#6b4a2b", 8);
  },
  beach(c) {
    box(c, -46, -40, 92, 80, "#cfeefc", 10);
    circle(c, 26, -24, 10, "#f6d23b");
    shape(c, [-46, -4, 46, -4, 46, 14, -46, 14], "#3d8fd1");
    wave(c, 2, -42, 42, "#bfe3f7", 2.5, 4);
    c.beginPath(); c.moveTo(-46, 14); c.quadraticCurveTo(0, 6, 46, 14); c.lineTo(46, 40); c.lineTo(-46, 40); c.closePath(); c.fillStyle = "#f2d89a"; c.fill();
    circle(c, -20, 28, 5, "#e8623b"); circle(c, 16, 30, 3, "#fff");
  },
  algae(c) {
    box(c, -44, -40, 88, 80, "#bfe3f7", 10);
    for (const x of [-28, -10, 8, 26]) {
      c.beginPath(); c.moveTo(x, 40); c.bezierCurveTo(x - 10, 18, x + 10, 4, x - 2, -24); c.strokeStyle = "#3f8a2f"; c.lineWidth = 6; c.lineCap = "round"; c.stroke();
    }
    oval(c, 22, -22, 9, 5, "#f29a2e"); shape(c, [30, -22, 38, -28, 38, -16], "#f29a2e"); circle(c, 17, -23, 1.5, INK);
  },
  rooster(c) {
    for (const [turn, color] of [[-0.9, "#2f7d32"], [-0.5, "#c0392b"], [-0.1, "#2f5d8a"]] as const) oval(c, 26, -6, 24, 8, color, turn);
    oval(c, 0, 12, 26, 22, "#e8a33b");
    circle(c, -18, -16, 13, "#e8a33b");
    shape(c, [-28, -26, -24, -38, -18, -30, -12, -40, -8, -26], "#d63a3a");
    shape(c, [-31, -16, -40, -12, -31, -10], "#f2a900");
    oval(c, -26, -6, 3, 5, "#d63a3a");
    circle(c, -20, -18, 2.4, INK);
    line(c, [-6, 32, -8, 44], "#f2a900", 3); line(c, [8, 32, 10, 44], "#f2a900", 3);
  },
  bottle(c) {
    c.beginPath(); c.moveTo(-8, -40); c.lineTo(8, -40); c.lineTo(8, -24); c.quadraticCurveTo(22, -16, 22, 0); c.lineTo(22, 40); c.lineTo(-22, 40); c.lineTo(-22, 0); c.quadraticCurveTo(-22, -16, -8, -24); c.closePath();
    c.fillStyle = "#e6f3fa"; c.fill(); c.strokeStyle = "#7fb0cc"; c.lineWidth = 2.5; c.stroke();
    box(c, -20, 2, 40, 36, "#5aa9e6", 3);
    box(c, -10, -46, 20, 8, "#2f7d32", 2);
    oval(c, -12, 14, 3, 8, "#bfe0f2");
  },
  horse(c) {
    c.beginPath(); c.moveTo(-2, -34); c.quadraticCurveTo(26, -30, 30, 6); c.lineTo(36, 30); c.quadraticCurveTo(28, 42, 14, 34); c.lineTo(-10, 4); c.quadraticCurveTo(-24, 10, -26, 34); c.lineTo(-38, 34); c.quadraticCurveTo(-36, -10, -2, -34); c.closePath();
    c.fillStyle = "#a0673a"; c.fill();
    shape(c, [-4, -34, 0, -46, 6, -32], "#a0673a");
    c.beginPath(); c.moveTo(-6, -34); c.quadraticCurveTo(-34, -24, -40, 30); c.lineTo(-30, 30); c.quadraticCurveTo(-28, -12, -6, -26); c.closePath(); c.fillStyle = "#4a2f1c"; c.fill();
    circle(c, 12, -10, 3.2, INK);
    oval(c, 30, 28, 3, 2, "#4a2f1c");
  },
  eye(c) {
    c.beginPath(); c.moveTo(-44, 0); c.quadraticCurveTo(0, -40, 44, 0); c.quadraticCurveTo(0, 40, -44, 0); c.closePath();
    c.fillStyle = "#fff"; c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    circle(c, 0, 0, 16, "#7a4a24"); circle(c, 0, 0, 8, INK); circle(c, -5, -5, 3.5, "#fff");
    for (const x of [-24, -8, 8, 24]) line(c, [x, -18 + Math.abs(x) * 0.3, x * 1.15, -28 + Math.abs(x) * 0.3], INK, 2.5);
  },
  rose(c) {
    line(c, [0, 6, 2, 46], "#3f8a2f", 4);
    leaf(c, -12, 30, 12, -0.6); leaf(c, 14, 22, 12, 0.6);
    circle(c, 0, -12, 24, "#d63a4a");
    c.beginPath(); c.arc(0, -12, 15, 0.3, 5.2); c.strokeStyle = "#a8203a"; c.lineWidth = 3; c.stroke();
    c.beginPath(); c.arc(2, -12, 7, 2, 7.5); c.stroke();
  },
  candle(c) {
    box(c, -14, -10, 28, 50, "#fdf3d6", 3);
    oval(c, 0, -10, 14, 4, "#f1e2b4");
    line(c, [0, -12, 0, -20], INK, 2);
    c.beginPath(); c.moveTo(0, -42); c.quadraticCurveTo(12, -26, 0, -20); c.quadraticCurveTo(-12, -26, 0, -42); c.fillStyle = "#f2a900"; c.fill();
    oval(c, 0, -26, 3, 5, "#fff3b0");
    box(c, -22, 38, 44, 6, "#c98b4a", 3);
  },
  bee(c) {
    oval(c, -6, -20, 14, 10, "#e3f1fb", -0.5); oval(c, 10, -20, 14, 10, "#e3f1fb", 0.5);
    oval(c, 0, 4, 30, 20, "#f6c21b");
    for (const x of [-10, 4, 18]) { c.save(); c.beginPath(); c.ellipse(0, 4, 30, 20, 0, 0, TAU); c.clip(); box(c, x - 3, -20, 7, 50, INK); c.restore(); }
    circle(c, -30, 2, 12, INK); circle(c, -34, -1, 2.5, "#fff");
    shape(c, [30, 4, 40, 0, 40, 8], INK);
  },
  hive(c) {
    line(c, [-44, -38, 44, -34], "#6b4a2b", 6);
    c.beginPath(); c.moveTo(-26, -34); c.quadraticCurveTo(-36, 10, 0, 42); c.quadraticCurveTo(36, 10, 26, -34); c.closePath(); c.fillStyle = "#d99a2b"; c.fill();
    for (const y of [-20, -4, 12, 26]) wave(c, y, -24, 24, "#a8701c", 2.5, 4);
    oval(c, 34, 10, 6, 4, "#f6c21b"); oval(c, 34, 6, 4, 3, "#e3f1fb");
  },
  tin(c) {
    box(c, -26, -20, 52, 56, "#c0392b", 4);
    oval(c, 0, 36, 26, 6, "#962d22");
    box(c, -26, 4, 52, 12, "#f2d14b");
    oval(c, 0, -22, 28, 8, "#d9d9d9"); oval(c, 0, -26, 28, 8, "#ececec");
    oval(c, -14, -6, 3, 9, "#e06a5a");
  },
  cot(c) {
    box(c, -44, -6, 88, 14, "#a8743d", 3);
    for (const x of [-40, 32]) box(c, x, 8, 8, 28, "#8a5a32", 2);
    box(c, -42, -16, 84, 12, "#e6eef7", 4);
    box(c, -38, -28, 26, 14, "#f2d14b", 6);
    line(c, [-6, -14, 34, -14], "#9fb3c8", 2);
  },
  potato(c) {
    c.beginPath(); c.moveTo(-36, 0); c.bezierCurveTo(-36, -30, 10, -34, 30, -18); c.bezierCurveTo(46, -4, 36, 30, 6, 30); c.bezierCurveTo(-24, 30, -36, 20, -36, 0); c.closePath();
    c.fillStyle = "#c9a26b"; c.fill();
    for (const [x, y] of [[-16, -10], [8, -16], [18, 10], [-6, 14], [-24, 8]] as const) circle(c, x, y, 2.4, "#8c6a3c");
  },
};

/** The picture for `pic`, `size` units across, centred on (x, y). */
export function drawWordPicture(c: C, pic: string, x: number, y: number, size: number) {
  if (!(pic in PICTURES)) { drawPrimerPicture(c, pic, x, y, size); return; }
  c.save(); c.translate(x, y); c.scale(size / 100, size / 100);
  PICTURES[pic](c);
  c.restore();
}
export const hasWordPicture = (pic: string) => pic in PICTURES || primerHas(pic);

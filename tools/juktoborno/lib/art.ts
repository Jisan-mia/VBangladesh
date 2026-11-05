// One small picture per word, drawn in code on a 100-unit square centred on (0, 0). Words অ-তে অজগর already draws
// (বৃষ্টি, গল্প, পক্ষী, চন্দ্র, ব্যাঙ, চৌদ্দ ফোঁটা) come from there so the primers look like one book; the rest are ours.
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
function eyes(c: C, x: number, y: number, gap: number, r = 3) { circle(c, x - gap, y, r, INK); circle(c, x + gap, y, r, INK); }
function smile(c: C, x: number, y: number, w: number, width = 2.5) {
  c.beginPath(); c.arc(x, y - w * 0.4, w, 0.25 * Math.PI, 0.75 * Math.PI); c.strokeStyle = INK; c.lineWidth = width; c.lineCap = "round"; c.stroke();
}
function bowl(c: C, y: number, fill: string, rim = "#fffdf6") {
  c.beginPath(); c.moveTo(-38, y); c.quadraticCurveTo(-40, y + 40, 0, y + 40); c.quadraticCurveTo(40, y + 40, 38, y); c.closePath(); c.fillStyle = fill; c.fill();
  oval(c, 0, y, 38, 9, rim);
}
function child(c: C, x: number, skin: string, shirt: string, hair: string) {
  box(c, x - 13, 4, 26, 30, shirt, 8);
  line(c, [x - 7, 34, x - 7, 46], "#3b4a6b", 6); line(c, [x + 7, 34, x + 7, 46], "#3b4a6b", 6);
  circle(c, x, -14, 14, skin);
  c.beginPath(); c.arc(x, -16, 14.5, Math.PI, TAU); c.fillStyle = hair; c.fill();
  eyes(c, x, -12, 5, 2); smile(c, x, -6, 4, 2);
}

const PICTURES: Record<string, (c: C) => void> = {
  roshogolla(c) {
    bowl(c, 6, "#c9d6e3", "#f3f6f9");
    for (const [x, y] of [[-16, 0], [14, 2], [-1, -12]]) { circle(c, x, y, 13, "#fbf3dc"); oval(c, x - 4, y - 5, 4, 3, "#ffffff"); }
    oval(c, 0, 8, 30, 5, "#f2e7b8");
  },
  dice(c) {
    box(c, -34, -34, 68, 68, "#ffffff", 12);
    c.lineWidth = 3; c.strokeStyle = "#3b4a6b"; c.beginPath(); c.roundRect(-34, -34, 68, 68, 12); c.stroke();
    for (const x of [-16, 16]) for (const y of [-18, 0, 18]) circle(c, x, y, 6, "#c0392b");
  },
  chick(c) {
    oval(c, 0, 14, 30, 24, "#f6d23b");
    circle(c, 18, -14, 16, "#f6d23b");
    shape(c, [32, -16, 44, -12, 32, -8], "#f29a2e");
    circle(c, 22, -18, 3, INK);
    oval(c, -6, 12, 14, 9, "#e8bf2a", -0.4);
    line(c, [-6, 38, -10, 46], "#f29a2e", 3); line(c, [6, 38, 8, 46], "#f29a2e", 3);
  },
  pot(c) {
    for (const x of [-14, 0, 14]) { c.beginPath(); c.moveTo(x - 8, 46); c.quadraticCurveTo(x, 26, x + 8, 46); c.fillStyle = "#f29a2e"; c.fill(); }
    c.beginPath(); c.moveTo(-36, -8); c.quadraticCurveTo(-40, 32, 0, 32); c.quadraticCurveTo(40, 32, 36, -8); c.closePath(); c.fillStyle = "#8a8f99"; c.fill();
    oval(c, 0, -8, 36, 8, "#6b707a");
    line(c, [-36, -2, -46, -6], "#6b707a", 4); line(c, [36, -2, 46, -6], "#6b707a", 4);
    for (const x of [-12, 4, 18]) { c.beginPath(); c.moveTo(x, -20); c.quadraticCurveTo(x + 6, -30, x, -40); c.strokeStyle = "#c9d6e3"; c.lineWidth = 3; c.stroke(); }
  },
  laddu(c) {
    oval(c, 0, 30, 42, 10, "#c9d6e3");
    for (const [x, y] of [[-18, 14], [18, 14], [0, -6]]) {
      circle(c, x, y, 18, "#f2a93b");
      for (let i = 0; i < 7; i++) circle(c, x + Math.cos(i * 2.3) * 10, y + Math.sin(i * 2.3) * 10, 2.2, "#e08a1e");
    }
  },
  corn(c) {
    c.save(); c.rotate(0.3);
    oval(c, 0, -4, 16, 38, "#f6d23b");
    for (let y = -34; y < 30; y += 8) for (const x of [-8, 0, 8]) circle(c, x, y, 3, "#e8b92a");
    c.beginPath(); c.moveTo(-6, 40); c.quadraticCurveTo(-30, 10, -16, -30); c.quadraticCurveTo(-14, 10, 0, 40); c.fillStyle = "#6fbf4a"; c.fill();
    c.beginPath(); c.moveTo(6, 40); c.quadraticCurveTo(30, 10, 18, -24); c.quadraticCurveTo(12, 10, 0, 40); c.fillStyle = "#4f9d3a"; c.fill();
    c.restore();
  },
  sandal(c) {
    for (const x of [-18, 18]) {
      oval(c, x, 4, 14, 36, "#e8623b");
      oval(c, x, 4, 11, 33, "#f29a7a");
      c.beginPath(); c.moveTo(x - 12, 0); c.quadraticCurveTo(x, -20, x + 12, 0); c.strokeStyle = "#3b4a6b"; c.lineWidth = 5; c.stroke();
      line(c, [x, -10, x, -28], "#3b4a6b", 4);
    }
  },
  school(c) {
    box(c, -42, -6, 84, 46, "#f2c48a");
    shape(c, [-48, -6, 0, -36, 48, -6], "#c0392b");
    box(c, -10, 14, 20, 26, "#8a5a2b", 2);
    for (const x of [-34, 18]) box(c, x, 4, 16, 14, "#5aa9e6", 2);
    line(c, [0, -36, 0, -50], "#5d4a3a", 2.5); shape(c, [0, -50, 14, -46, 0, -42], "#2f8f4a"); circle(c, 6, -46, 2.2, "#c0392b");
  },
  road(c) {
    box(c, -46, -40, 92, 80, "#bfe6a8", 10);
    shape(c, [-10, -40, 10, -40, 40, 40, -40, 40], "#6b707a");
    for (const [y, h] of [[-30, 8], [-12, 12], [12, 16]]) box(c, -2 - h / 8, y, 4 + h / 4, h, "#ffffff", 1);
    circle(c, -30, -18, 10, "#4f9d3a"); line(c, [-30, -8, -30, 4], "#8a5a2b", 3);
  },
  friends(c) {
    child(c, -18, "#c98a5a", "#e8623b", "#2b1d12");
    child(c, 18, "#a8693f", "#5aa9e6", "#3b2a17");
    c.beginPath(); c.arc(30, -16, 8, -1.2, 1.4); c.strokeStyle = "#3b2a17"; c.lineWidth = 5; c.stroke();
    line(c, [-5, 18, 5, 18], "#c98a5a", 5);
  },
  bell(c) {
    line(c, [0, -44, 0, -34], "#8a5a2b", 4);
    c.beginPath(); c.moveTo(-30, 22); c.quadraticCurveTo(-28, -34, 0, -34); c.quadraticCurveTo(28, -34, 30, 22); c.closePath(); c.fillStyle = "#f2b630"; c.fill();
    box(c, -36, 20, 72, 9, "#e09a2e", 4);
    circle(c, 0, 36, 7, "#c9851e");
    oval(c, -12, -12, 4, 10, "#ffe27a", 0.3);
  },
  forest(c) {
    for (const [x, s, color] of [[-26, 1, "#4f9d3a"], [24, 1.1, "#3f8f3a"], [0, 1.3, "#5cb04a"]] as const) {
      box(c, x - 4, 20, 8, 22, "#8a5a2b");
      shape(c, [x - 22 * s, 24, x, -30 * s, x + 22 * s, 24], color);
    }
  },
  khunti(c) {
    c.save(); c.rotate(-0.6);
    box(c, -4, -6, 8, 52, "#8a5a2b", 3);
    box(c, -14, -44, 28, 34, "#9aa3b0", 4);
    box(c, -12, -42, 6, 30, "#c9d0d8", 2);
    c.restore();
  },
  ice(c) {
    shape(c, [-24, -36, 24, -36, 18, 40, -18, 40], "#e6f3fa");
    shape(c, [-21, -10, 21, -10, 18, 40, -18, 40], "#9fd3ef");
    for (const [x, y] of [[-8, 4], [8, 14], [-4, 24]]) { box(c, x - 7, y - 7, 14, 14, "#ffffff", 3); }
    line(c, [-24, -36, -18, 40, 18, 40, 24, -36], "#7fb3d1", 3);
  },
  lotus(c) {
    oval(c, 0, 34, 44, 10, "#4f9d3a");
    for (const [turn, color] of [[-0.9, "#f7a8c4"], [0.9, "#f7a8c4"], [-0.45, "#ef7fa8"], [0.45, "#ef7fa8"], [0, "#e85f93"]] as const) {
      c.save(); c.translate(0, 22); c.rotate(turn);
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-14, -26, 0, -46); c.quadraticCurveTo(14, -26, 0, 0); c.fillStyle = color; c.fill();
      c.restore();
    }
  },
  kheer(c) {
    bowl(c, -4, "#b5653a", "#fbf3dc");
    for (const [x, y] of [[-14, -5], [6, -3], [18, -6], [-2, -8]]) oval(c, x, y, 4, 2.4, "#c9a23b");
    circle(c, -6, -4, 2.4, "#4f9d3a"); circle(c, 12, -7, 2.4, "#4f9d3a");
  },
  science(c) {
    shape(c, [-8, -42, 8, -42, 8, -10, 32, 36, -32, 36, -8, -10], "#e6f3fa");
    shape(c, [-17, 6, 17, 6, 32, 36, -32, 36], "#7cc36b");
    line(c, [-8, -42, -8, -10, -32, 36, 32, 36, 8, -10, 8, -42], "#5d6b7a", 3);
    line(c, [-12, -42, 12, -42], "#5d6b7a", 4);
    circle(c, -6, 20, 4, "#e6f3fa"); circle(c, 8, 14, 3, "#e6f3fa"); circle(c, 2, -2, 3, "#9fd3ef");
  },
  engine(c) {
    box(c, -40, -10, 60, 34, "#c0392b", 4);
    box(c, 4, -34, 30, 58, "#a33024", 4);
    box(c, 10, -28, 18, 14, "#bfe0f2", 2);
    box(c, -30, -26, 10, 16, "#3b4a6b");
    for (const [x, r] of [[-26, 10], [0, 10], [22, 12]]) { circle(c, x, 30, r, "#3b4a6b"); circle(c, x, 30, r * 0.4, "#9aa3b0"); }
    shape(c, [-40, 20, -48, 34, -40, 34], "#3b4a6b");
    for (const [x, y, r] of [[-25, -34, 6], [-18, -42, 8]]) circle(c, x, y, r, "#d5dbe2");
  },
  pearl(c) {
    c.beginPath(); c.moveTo(-40, 10); c.quadraticCurveTo(0, -46, 40, 10); c.closePath(); c.fillStyle = "#c9b6d9"; c.fill();
    for (let i = -3; i <= 3; i++) line(c, [i * 10, 8, i * 6, -22], "#b09bc4", 2);
    c.beginPath(); c.moveTo(-40, 14); c.quadraticCurveTo(0, 52, 40, 14); c.closePath(); c.fillStyle = "#b09bc4"; c.fill();
    circle(c, 0, 14, 11, "#fbf7f0"); circle(c, -3, 10, 3.5, "#ffffff"); // unslop-ignore: painted object colour in the canvas art, not a page background
  },
  slate(c) {
    box(c, -44, -34, 88, 68, "#a8743d", 6);
    box(c, -38, -28, 76, 56, "#2f3e46", 3);
    c.fillStyle = "#f5f1e6"; c.font = "700 30px Bangla, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("২+৩", 0, 2);
  },
  page(c) {
    shape(c, [-34, -42, 20, -42, 34, -28, 34, 42, -34, 42], "#fffdf6");
    shape(c, [20, -42, 34, -28, 20, -28], "#e6dcc4");
    line(c, [-34, -42, 20, -42, 34, -28, 34, 42, -34, 42, -34, -42], "#c9b99a", 2.5);
    for (let y = -24; y <= 18; y += 10) line(c, [-24, y, 22, y], "#c9b99a", 2.5);
    circle(c, 22, 32, 8, "#f2d14b");
    c.fillStyle = INK; c.font = "700 11px Bangla, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("১২", 22, 33);
  },
  box(c) {
    shape(c, [-36, -10, 0, -24, 36, -10, 0, 4], "#e8b06a");
    shape(c, [-36, -10, 0, 4, 0, 42, -36, 28], "#c98a45");
    shape(c, [36, -10, 0, 4, 0, 42, 36, 28], "#b5763a");
    shape(c, [-36, -10, -48, -28, -12, -40, 0, -24], "#e8b06a");
    line(c, [-18, -3, -18, 35], "#8a5a2b", 3);
  },
  train(c) {
    for (const x of [-46, -14]) { box(c, x, -12, 30, 30, "#2f8f4a", 3); box(c, x + 5, -6, 20, 10, "#bfe0f2", 2); }
    box(c, 18, -22, 28, 40, "#c0392b", 4); box(c, 24, -16, 16, 12, "#bfe0f2", 2);
    line(c, [-48, 32, 48, 32], "#6b707a", 3);
    for (const x of [-38, -22, -6, 8, 26, 40]) { circle(c, x, 22, 6, "#3b4a6b"); }
  },
  butterfly(c) {
    for (const s of [-1, 1]) {
      oval(c, s * 20, -12, 20, 18, "#f29a2e", s * 0.4);
      oval(c, s * 16, 16, 14, 13, "#e8623b", -s * 0.4);
      circle(c, s * 22, -14, 6, "#ffe27a"); circle(c, s * 16, 16, 4, "#ffe27a");
    }
    oval(c, 0, 2, 5, 26, "#3b2a17");
    line(c, [-2, -22, -10, -38], INK, 2); line(c, [2, -22, 10, -38], INK, 2);
  },
  bag(c) {
    c.beginPath(); c.arc(0, -22, 12, Math.PI, TAU); c.strokeStyle = "#1f6f5c"; c.lineWidth = 6; c.stroke();
    box(c, -30, -24, 60, 66, "#2f8f6e", 14);
    box(c, -22, 8, 44, 26, "#1f6f5c", 8);
    box(c, -30, -24, 60, 18, "#3fa883", 12);
    box(c, -4, -10, 8, 8, "#f2d14b", 2);
  },
  sun(c) {
    for (let i = 0; i < 12; i++) { const a = i * TAU / 12; line(c, [Math.cos(a) * 30, Math.sin(a) * 30, Math.cos(a) * 44, Math.sin(a) * 44], "#f2b630", 5); }
    circle(c, 0, 0, 26, "#f6d23b");
    eyes(c, 0, -4, 8, 3); smile(c, 0, 8, 8);
  },
  shirt(c) {
    shape(c, [-16, -38, -44, -24, -36, -2, -26, -8, -26, 40, 26, 40, 26, -8, 36, -2, 44, -24, 16, -38, 0, -28], "#5aa9e6");
    shape(c, [-16, -38, 0, -28, 16, -38, 8, -40, 0, -32, -8, -40], "#3f8fd0");
    for (const y of [-18, -4, 10, 24]) circle(c, 0, y, 2.6, "#ffffff");
    box(c, 10, -16, 10, 10, "#3f8fd0", 2);
  },
  marbles(c) {
    for (const [x, y, r, color] of [[-20, 12, 14, "#5aa9e6"], [10, 18, 12, "#e8623b"], [24, -8, 11, "#7cc36b"], [-4, -14, 13, "#f2d14b"]] as const) {
      circle(c, x, y, r, color);
      c.beginPath(); c.moveTo(x - r * 0.6, y); c.quadraticCurveTo(x, y - r * 0.5, x + r * 0.6, y + r * 0.2); c.strokeStyle = "#ffffffaa"; c.lineWidth = 3; c.stroke();
      circle(c, x - r * 0.4, y - r * 0.4, r * 0.22, "#ffffff");
    }
  },
};

/** A word's picture centred at (x, y), `size` units across. */
export function drawWordPicture(c: C, pic: string, x: number, y: number, size: number) {
  if (!(pic in PICTURES)) { drawPrimerPicture(c, pic, x, y, size); return; }
  c.save();
  c.translate(x, y); c.scale(size / 100, size / 100);
  PICTURES[pic](c);
  c.restore();
}
export const hasWordPicture = (pic: string) => pic in PICTURES || primerHas(pic);

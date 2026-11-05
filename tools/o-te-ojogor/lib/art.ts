// The game's drawings: the tree, the fruit, the বেতের ঝুড়ি, and one small friendly picture for every word. All drawn fresh in code.
import { DISPLAY_FONT } from "../../../shared/card-canvas";
import type { World } from "./levels";
import { BASKET_Y, GROUND_Y, H, R, W } from "./tree";

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
function stroke(c: C, points: number[], color: string, width: number) {
  c.beginPath(); c.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) c.lineTo(points[i], points[i + 1]);
  c.strokeStyle = color; c.lineWidth = width; c.lineCap = "round"; c.lineJoin = "round"; c.stroke();
}
function eyes(c: C, x: number, y: number, gap: number, r = 3.2) { circle(c, x - gap, y, r, INK); circle(c, x + gap, y, r, INK); }
function smile(c: C, x: number, y: number, w: number, width = 2.5) {
  c.beginPath(); c.arc(x, y - w * 0.4, w, 0.25 * Math.PI, 0.75 * Math.PI); c.strokeStyle = INK; c.lineWidth = width; c.lineCap = "round"; c.stroke();
}
function ring(c: C, x: number, y: number, r: number, color: string, width: number) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.strokeStyle = color; c.lineWidth = width; c.stroke(); }
function leaf(c: C, x: number, y: number, size: number, turn: number, fill = "#4f9d3a") { oval(c, x, y, size, size * 0.45, fill, turn); }
function bird(c: C, body: string, x = 0, y = 6) {
  oval(c, x, y, 30, 20, body);
  circle(c, x + 24, y - 16, 14, body);
}

/** The drawings, each in a box from -50 to 50. Kept simple: a few shapes, round and friendly. */
const PICTURES: Record<string, (c: C) => void> = {
  snake(c) {
    c.lineCap = "round"; c.lineJoin = "round";
    c.beginPath(); c.moveTo(-40, 30); c.bezierCurveTo(-30, 8, -8, 44, 4, 26); c.bezierCurveTo(14, 12, 16, 2, 22, -6);
    c.strokeStyle = "#5aa845"; c.lineWidth = 17; c.stroke();
    for (const [x, y] of [[-30, 22], [-12, 32], [6, 22]]) circle(c, x, y, 3.2, "#f2d14b");
    oval(c, 28, -16, 17, 14, "#5aa845");
    circle(c, 22, -21, 5, "#fff"); circle(c, 34, -21, 5, "#fff"); eyes(c, 28, -20, 6, 2.6);
    smile(c, 28, -10, 6);
    stroke(c, [42, -11, 48, -9, 52, -13, 48, -9, 52, -5], "#e0566b", 2.2);
    circle(c, 18, -12, 3, "#f39aa4"); circle(c, 38, -12, 3, "#f39aa4");
  },
  mango(c) {
    oval(c, 0, 6, 30, 36, "#f6b93b", 0.5);
    oval(c, 10, 14, 13, 16, "#e8623b", 0.5);
    stroke(c, [-8, -28, -6, -38], "#6b4a2b", 4);
    leaf(c, 6, -38, 15, -0.4);
  },
  hilsa(c) {
    shape(c, [28, 0, 46, -16, 42, 0, 46, 16], "#9fb3c8");
    oval(c, -4, 0, 36, 18, "#c9d6e3");
    oval(c, -4, 4, 32, 9, "#e6edf4");
    circle(c, -28, -4, 3.5, INK);
    c.beginPath(); c.arc(-18, 0, 10, -0.9, 0.9); c.strokeStyle = "#8a9cb0"; c.lineWidth = 2; c.stroke();
  },
  eagle(c) {
    bird(c, "#8a5a33", -6, 10);
    circle(c, 18, -6, 14, "#f5f1e6");
    shape(c, [28, -10, 42, -4, 30, 2], "#f2b630");
    circle(c, 22, -10, 3, INK);
    oval(c, -12, 8, 20, 11, "#6e4425", -0.3);
  },
  camel(c) {
    oval(c, -4, 4, 30, 16, "#d6a56b");
    circle(c, -14, -8, 12, "#d6a56b"); circle(c, 8, -8, 12, "#d6a56b");
    stroke(c, [-24, 16, -26, 40], "#b98a52", 6); stroke(c, [-8, 18, -8, 40], "#b98a52", 6); stroke(c, [10, 18, 12, 40], "#b98a52", 6); stroke(c, [20, 14, 24, 40], "#b98a52", 6);
    stroke(c, [24, -2, 32, -24], "#d6a56b", 9);
    oval(c, 38, -26, 11, 7, "#d6a56b");
    circle(c, 38, -29, 2.4, INK);
  },
  dawn(c) {
    c.save(); c.beginPath(); c.rect(-50, -50, 100, 64); c.clip();
    circle(c, 0, 14, 28, "#f59e2b");
    for (let i = 0; i < 7; i++) { const a = Math.PI + (i + 0.5) * Math.PI / 7; stroke(c, [Math.cos(a) * 34, 14 + Math.sin(a) * 34, Math.cos(a) * 44, 14 + Math.sin(a) * 44], "#f7c548", 4); }
    c.restore();
    box(c, -46, 14, 92, 26, "#6fb7d9", 6);
    stroke(c, [-34, 24, -14, 24], "#d8eef7", 3); stroke(c, [4, 30, 30, 30], "#d8eef7", 3);
  },
  seasons(c) {
    const colors = ["#f59e2b", "#5aa9e6", "#7cc36b", "#f2d14b", "#c9d6e3", "#e8899a"];
    colors.forEach((color, i) => { c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 38, i * TAU / 6 - Math.PI / 2, (i + 1) * TAU / 6 - Math.PI / 2); c.closePath(); c.fillStyle = color; c.fill(); });
    circle(c, 0, 0, 12, "#fff");
  },
  ektara(c) {
    stroke(c, [0, -44, 0, 16], "#a8743d", 6);
    oval(c, 0, 26, 20, 18, "#b5793a");
    oval(c, 0, 26, 12, 10, "#7a4f25");
    stroke(c, [-4, -40, -4, 26], "#f5f1e6", 1.6);
    box(c, -8, -48, 16, 6, "#7a4f25", 3);
  },
  elephant(c) {
    oval(c, -6, 8, 32, 24, "#9aa3b0");
    circle(c, 22, -6, 18, "#9aa3b0");
    oval(c, 12, -6, 12, 16, "#b8c0cb");
    c.beginPath(); c.moveTo(36, 0); c.quadraticCurveTo(46, 18, 38, 32); c.strokeStyle = "#9aa3b0"; c.lineWidth = 9; c.lineCap = "round"; c.stroke();
    circle(c, 26, -10, 2.8, INK);
    for (const x of [-26, -12, 6, 18]) box(c, x, 22, 9, 18, "#8a93a0", 3);
  },
  yam(c) {
    oval(c, 0, 12, 34, 28, "#9b6a43");
    for (const [x, y] of [[-14, 6], [6, 18], [14, 0], [-4, 26], [-20, 20]]) circle(c, x, y, 2.6, "#6f4628");
    stroke(c, [0, -14, 0, -30], "#4f9d3a", 4);
    leaf(c, -10, -34, 12, 0.5); leaf(c, 10, -34, 12, -0.5);
  },
  medicine(c) {
    box(c, -20, -24, 40, 62, "#a0522d", 8);
    box(c, -12, -38, 24, 16, "#f5f1e6", 3);
    box(c, -16, -4, 32, 24, "#fff7e0", 3);
    oval(c, 0, 8, 9, 5, "#5aa9e6", 0.5);
  },
  banana(c) {
    c.beginPath(); c.moveTo(-36, -18); c.quadraticCurveTo(-26, 40, 38, 18); c.quadraticCurveTo(-8, 26, -26, -22); c.closePath(); c.fillStyle = "#f6d23b"; c.fill();
    stroke(c, [-36, -18, -30, -26], "#6b4a2b", 4);
  },
  rabbit(c) {
    oval(c, -10, -28, 6, 20, "#ece7df", -0.15); oval(c, 8, -28, 6, 20, "#ece7df", 0.15);
    oval(c, -10, -28, 3, 13, "#f3a6b0", -0.15); oval(c, 8, -28, 3, 13, "#f3a6b0", 0.15);
    oval(c, 0, 26, 26, 20, "#ece7df");
    circle(c, 0, 0, 18, "#ece7df");
    eyes(c, 0, -2, 7, 2.6); circle(c, 0, 5, 2.6, "#e0566b"); smile(c, 0, 10, 4, 2);
  },
  cow(c) {
    oval(c, -4, 10, 32, 20, "#f5f1e6");
    oval(c, -12, 4, 10, 8, "#8a5a33"); oval(c, 6, 18, 9, 6, "#8a5a33");
    for (const x of [-26, -14, 8, 20]) box(c, x, 24, 7, 16, "#e2dccf", 3);
    circle(c, 28, -8, 15, "#f5f1e6");
    stroke(c, [20, -20, 16, -30], "#c8b48a", 4); stroke(c, [36, -20, 40, -30], "#c8b48a", 4);
    oval(c, 30, 2, 9, 6, "#f3b5a0");
    circle(c, 24, -10, 2.6, INK); circle(c, 34, -10, 2.6, INK);
  },
  clock(c) {
    circle(c, 0, 4, 38, "#e8623b"); circle(c, 0, 4, 30, "#fff7e0");
    stroke(c, [0, 4, 0, -16], INK, 4); stroke(c, [0, 4, 14, 10], INK, 4);
    circle(c, -22, -34, 8, "#e8623b"); circle(c, 22, -34, 8, "#e8623b");
  },
  frog(c) {
    oval(c, 0, 12, 36, 26, "#6fbf4a");
    circle(c, -16, -12, 12, "#6fbf4a"); circle(c, 16, -12, 12, "#6fbf4a");
    circle(c, -16, -12, 7, "#fff"); circle(c, 16, -12, 7, "#fff"); circle(c, -16, -11, 3.4, INK); circle(c, 16, -11, 3.4, INK);
    c.beginPath(); c.arc(0, 4, 18, 0.15 * Math.PI, 0.85 * Math.PI); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    circle(c, -24, 10, 4, "#f39aa4"); circle(c, 24, 10, 4, "#f39aa4");
  },
  glasses(c) {
    ring(c, -20, 4, 16, "#3b4a6b", 5); ring(c, 20, 4, 16, "#3b4a6b", 5);
    circle(c, -20, 4, 13, "#d8eef7"); circle(c, 20, 4, 13, "#d8eef7");
    stroke(c, [-5, 0, 5, 0], "#3b4a6b", 4); stroke(c, [-36, 0, -46, -8], "#3b4a6b", 4); stroke(c, [36, 0, 46, -8], "#3b4a6b", 4);
  },
  umbrella(c) {
    const colors = ["#e8623b", "#f2d14b", "#5aa9e6", "#7cc36b"];
    colors.forEach((color, i) => { c.beginPath(); c.moveTo(0, -2); c.arc(0, -2, 40, Math.PI + i * Math.PI / 4, Math.PI + (i + 1) * Math.PI / 4); c.closePath(); c.fillStyle = color; c.fill(); });
    c.beginPath(); c.moveTo(0, -2); c.lineTo(0, 34); c.arc(-7, 34, 7, 0, Math.PI); c.strokeStyle = "#6b4a2b"; c.lineWidth = 4; c.lineCap = "round"; c.stroke();
  },
  ship(c) {
    shape(c, [-44, 6, 44, 6, 32, 28, -32, 28], "#c0392b");
    box(c, -26, -12, 40, 18, "#f5f1e6", 3);
    for (const x of [-20, -8, 4]) box(c, x, -7, 7, 7, "#5aa9e6", 1);
    box(c, 18, -30, 10, 36, "#3b4a6b", 2);
    stroke(c, [-46, 34, -20, 34], "#5aa9e6", 3); stroke(c, [4, 38, 40, 38], "#5aa9e6", 3);
  },
  shell(c) {
    c.beginPath(); c.moveTo(0, 30); c.arc(0, 30, 44, Math.PI * 1.15, Math.PI * 1.85); c.closePath(); c.fillStyle = "#f6c7a1"; c.fill();
    for (let i = 1; i < 6; i++) { const a = Math.PI * 1.15 + i * Math.PI * 0.7 / 6; stroke(c, [0, 30, Math.cos(a) * 40, 30 + Math.sin(a) * 40], "#e09a6c", 2.5); }
    oval(c, 0, 32, 10, 6, "#e09a6c");
  },
  ruler(c) {
    c.save(); c.rotate(-0.35);
    box(c, -46, -12, 92, 24, "#f2d14b", 4);
    for (let i = 0; i < 9; i++) stroke(c, [-38 + i * 9.5, -12, -38 + i * 9.5, i % 2 ? -4 : 2], INK, 2);
    c.restore();
  },
  tomato(c) {
    circle(c, 0, 8, 34, "#e2402f");
    oval(c, -12, -4, 8, 5, "#f07a6a", -0.5);
    for (let i = 0; i < 5; i++) leaf(c, Math.cos(i * TAU / 5 - Math.PI / 2) * 8, -24 + Math.sin(i * TAU / 5 - Math.PI / 2) * 5, 9, i * TAU / 5, "#3f8f3a");
  },
  cart(c) {
    box(c, -40, -6, 74, 12, "#b5793a", 3);
    stroke(c, [34, 0, 48, -10], "#8a5a2b", 5);
    for (const x of [-22, 16]) { circle(c, x, 20, 13, "#5d4a3a"); circle(c, x, 20, 4, "#c8b48a"); }
    box(c, -34, -22, 16, 16, "#7cc36b", 3); box(c, -14, -22, 16, 16, "#f2d14b", 3);
  },
  coconut(c) {
    oval(c, 0, 8, 30, 34, "#5aa845");
    oval(c, 0, -20, 16, 7, "#e8f3d0");
    stroke(c, [4, -20, 16, -46], "#e8623b", 4);
  },
  drum(c) {
    box(c, -36, -22, 72, 48, "#a0522d", 18);
    for (let i = 0; i < 5; i++) stroke(c, [-26 + i * 13, -18, -20 + i * 13, 22], "#f5f1e6", 2);
    oval(c, -36, 2, 6, 24, "#f5e2b8"); oval(c, 36, 2, 6, 24, "#f5e2b8");
    stroke(c, [-30, -22, -40, -40], "#6b4a2b", 3); stroke(c, [30, -22, 40, -40], "#6b4a2b", 3);
  },
  deer(c) {
    oval(c, -6, 8, 28, 16, "#c98a4b");
    for (const [x, y] of [[-16, 4], [-4, 10], [6, 2]]) circle(c, x, y, 2.6, "#f5f1e6");
    for (const x of [-26, -14, 6, 16]) box(c, x, 18, 6, 22, "#a86e36", 3);
    stroke(c, [18, -2, 24, -18], "#c98a4b", 9);
    oval(c, 28, -22, 11, 8, "#c98a4b");
    stroke(c, [24, -28, 18, -44, 12, -48], "#7a4f25", 3); stroke(c, [30, -28, 36, -44, 42, -48], "#7a4f25", 3); stroke(c, [20, -38, 14, -38], "#7a4f25", 3);
    circle(c, 30, -24, 2.4, INK);
  },
  watermelon(c) {
    c.beginPath(); c.moveTo(-42, -6); c.arc(0, -6, 42, 0, Math.PI); c.closePath(); c.fillStyle = "#3f8f3a"; c.fill();
    c.beginPath(); c.moveTo(-36, -6); c.arc(0, -6, 36, 0, Math.PI); c.closePath(); c.fillStyle = "#ef4f5a"; c.fill();
    for (const [x, y] of [[-18, 4], [0, 12], [18, 4], [-8, 22], [10, 22]]) oval(c, x, y, 2.4, 4, INK);
  },
  plate(c) {
    oval(c, 0, 10, 44, 24, "#c9d6e3"); oval(c, 0, 8, 34, 17, "#e6edf4");
    oval(c, -6, 2, 18, 10, "#fffdf6"); circle(c, 14, 6, 7, "#f2b630");
  },
  magpie(c) {
    shape(c, [-24, 4, -46, -22, -40, -26, -16, -2], INK);
    bird(c, INK, -2, 8);
    oval(c, -4, 10, 18, 7, "#f5f1e6", -0.2);
    shape(c, [34, -12, 46, -8, 34, -4], "#3b3b3b");
    circle(c, 26, -12, 3, "#fff");
  },
  paddy(c) {
    for (const [x, turn] of [[-16, -0.25], [0, 0], [16, 0.25]] as const) {
      stroke(c, [x * 0.4, 44, x, -20], "#7aa63a", 3);
      for (let i = 0; i < 5; i++) oval(c, x + (i % 2 ? 5 : -5) + turn * i * 4, -14 - i * 7, 4, 7, "#e2b33b", turn + (i % 2 ? 0.5 : -0.5));
    }
  },
  boat(c) {
    shape(c, [-6, -40, -6, 10, 30, 10], "#f5f1e6");
    stroke(c, [-6, -42, -6, 14], "#6b4a2b", 3);
    c.beginPath(); c.moveTo(-46, 12); c.quadraticCurveTo(0, 42, 46, 12); c.closePath(); c.fillStyle = "#8a5a2b"; c.fill();
    stroke(c, [-40, 38, -12, 38], "#5aa9e6", 3); stroke(c, [10, 40, 38, 40], "#5aa9e6", 3);
  },
  papaya(c) {
    oval(c, 0, 8, 24, 36, "#f2a541", 0.25);
    oval(c, -4, 4, 13, 24, "#e0702b", 0.25);
    for (let i = 0; i < 5; i++) circle(c, -4 + Math.sin(i) * 3, -10 + i * 7, 2.6, INK);
    stroke(c, [8, -28, 12, -40], "#4f9d3a", 4);
  },
  flower(c) {
    stroke(c, [0, 10, 0, 46], "#4f9d3a", 4); leaf(c, 10, 32, 10, -0.6);
    for (let i = 0; i < 6; i++) circle(c, Math.cos(i * TAU / 6) * 16, -8 + Math.sin(i * TAU / 6) * 16, 12, "#ef6f9a");
    circle(c, 0, -8, 10, "#f2d14b");
  },
  book(c) {
    shape(c, [0, -18, -44, -28, -44, 26, 0, 36], "#5aa9e6");
    shape(c, [0, -18, 44, -28, 44, 26, 0, 36], "#3f8fd0");
    shape(c, [0, -14, -38, -22, -38, 20, 0, 30], "#fffdf6");
    shape(c, [0, -14, 38, -22, 38, 20, 0, 30], "#f5f1e6");
    for (let i = 0; i < 3; i++) { stroke(c, [-30, -10 + i * 10, -8, -6 + i * 10], "#c9b99a", 2); stroke(c, [8, -6 + i * 10, 30, -10 + i * 10], "#c9b99a", 2); }
  },
  sheep(c) {
    for (const [x, y] of [[-20, 4], [-6, -6], [10, -4], [20, 8], [6, 16], [-12, 16]]) circle(c, x, y, 15, "#f5f1e6");
    for (const x of [-16, -4, 8, 18]) box(c, x, 22, 6, 16, "#4a3b33", 3);
    oval(c, 30, -8, 11, 13, "#4a3b33");
    circle(c, 34, -10, 2.6, "#fff");
  },
  peacock(c) {
    for (let i = 0; i < 7; i++) { const a = Math.PI + (i + 0.5) * Math.PI / 7; const x = Math.cos(a) * 34 - 6, y = 18 + Math.sin(a) * 34; oval(c, x, y, 9, 13, "#3f9a6b", a + Math.PI / 2); circle(c, x, y, 4, "#2d5fa8"); }
    oval(c, -6, 20, 12, 18, "#2d5fa8");
    stroke(c, [0, 8, 6, -20], "#2d5fa8", 8);
    circle(c, 8, -22, 8, "#2d5fa8");
    shape(c, [14, -24, 22, -22, 14, -19], "#f2b630");
    circle(c, 9, -24, 2, "#fff");
    stroke(c, [6, -30, 4, -38], "#2d5fa8", 2); stroke(c, [9, -30, 10, -38], "#2d5fa8", 2);
  },
  twins(c) {
    for (const x of [-22, 22]) {
      circle(c, x, -4, 20, "#f1c27d");
      c.beginPath(); c.arc(x, -10, 20, Math.PI, TAU); c.fillStyle = INK; c.fill();
      eyes(c, x, -2, 7, 2.6); smile(c, x, 8, 6);
      box(c, x - 16, 18, 32, 24, x < 0 ? "#e8623b" : "#5aa9e6", 10);
    }
  },
  rickshaw(c) {
    c.beginPath(); c.moveTo(-36, 0); c.quadraticCurveTo(-30, -38, 4, -34); c.lineTo(4, 0); c.closePath(); c.fillStyle = "#e8623b"; c.fill();
    for (const [x, color] of [[-26, "#f2d14b"], [-14, "#5aa9e6"], [-2, "#7cc36b"]] as const) circle(c, x, -18, 4, color);
    box(c, -36, 0, 42, 10, "#3b4a6b", 3);
    stroke(c, [6, 8, 36, 8, 36, -10], "#5d4a3a", 4); stroke(c, [30, -10, 42, -12], "#5d4a3a", 4);
    for (const x of [-18, 34]) { ring(c, x, 28, 15, "#5d4a3a", 4); circle(c, x, 28, 3, "#5d4a3a"); }
  },
  top(c) {
    c.beginPath(); c.moveTo(-30, -14); c.quadraticCurveTo(0, -36, 30, -14); c.lineTo(0, 34); c.closePath(); c.fillStyle = "#e8623b"; c.fill();
    stroke(c, [-22, -6, 22, -6], "#f2d14b", 5); stroke(c, [-13, 8, 13, 8], "#5aa9e6", 5);
    stroke(c, [0, 34, 0, 44], "#5d4a3a", 3);
    box(c, -4, -36, 8, 10, "#8a5a2b", 3);
  },
  lily(c) {
    oval(c, 0, 26, 44, 14, "#3f8f3a");
    for (let i = 0; i < 8; i++) { const a = Math.PI + i * Math.PI / 7; oval(c, Math.cos(a) * 16, 6 + Math.sin(a) * 16, 15, 6, i % 2 ? "#f5c6d6" : "#ffffff", a); }
    circle(c, 0, 6, 9, "#f2d14b");
  },
  bull(c) {
    oval(c, -4, 10, 34, 22, "#6e4a33");
    oval(c, -14, -8, 12, 8, "#6e4a33");
    for (const x of [-28, -16, 8, 20]) box(c, x, 26, 8, 16, "#5a3b28", 3);
    circle(c, 28, -6, 16, "#6e4a33");
    c.beginPath(); c.moveTo(18, -16); c.quadraticCurveTo(6, -24, 10, -36); c.moveTo(38, -16); c.quadraticCurveTo(50, -24, 46, -36); c.strokeStyle = "#e9dfc6"; c.lineWidth = 5; c.lineCap = "round"; c.stroke();
    oval(c, 30, 4, 9, 6, "#a87a5c");
    circle(c, 22, -8, 2.6, "#fff"); circle(c, 34, -8, 2.6, "#fff");
  },
  cycle(c) {
    for (const x of [-26, 26]) { ring(c, x, 16, 18, "#3b4a6b", 4); circle(c, x, 16, 3, "#3b4a6b"); }
    stroke(c, [-26, 16, -4, 16, 14, -10, -14, -10, -4, 16], "#e8623b", 4);
    stroke(c, [14, -10, 26, 16], "#e8623b", 4);
    stroke(c, [-16, -18, -8, -18], INK, 5); stroke(c, [-12, -18, -14, -10], INK, 3);
    stroke(c, [14, -10, 12, -22, 20, -24], INK, 3);
  },
  duck(c) {
    oval(c, -6, 12, 32, 20, "#fffdf6");
    oval(c, -10, 10, 16, 9, "#ece7df", -0.3);
    circle(c, 20, -12, 15, "#fffdf6");
    shape(c, [32, -14, 46, -8, 32, -4], "#f29a2e");
    circle(c, 24, -16, 3, INK);
    stroke(c, [-34, 38, 34, 38], "#5aa9e6", 3);
  },
  hill(c) {
    circle(c, 26, -26, 9, "#f59e2b");
    shape(c, [-48, 34, -16, -24, 18, 34], "#5aa845");
    shape(c, [-4, 34, 22, -6, 48, 34], "#3f8f3a");
    shape(c, [-16, -24, -24, -10, -8, -10], "#e8f3d0");
  },
  rain(c) {
    for (const [x, y, r] of [[-18, -8, 16], [0, -18, 20], [20, -8, 16]]) circle(c, x, y, r, "#9aa8b8");
    box(c, -34, -10, 68, 16, "#9aa8b8", 8);
    for (const x of [-22, -4, 14, 30]) stroke(c, [x, 18, x - 5, 32], "#5aa9e6", 4);
    for (const x of [-12, 6, 22]) stroke(c, [x, 34, x - 4, 44], "#5aa9e6", 4);
  },
  parrot(c) {
    shape(c, [-20, 14, -44, 42, -36, 44, -12, 22], "#3f9a3a");
    bird(c, "#5cc34a", -2, 8);
    oval(c, -6, 10, 16, 8, "#3f9a3a", -0.3);
    c.beginPath(); c.moveTo(32, -18); c.quadraticCurveTo(46, -16, 40, -2); c.lineTo(34, -6); c.closePath(); c.fillStyle = "#e2402f"; c.fill();
    circle(c, 24, -14, 3, INK);
  },
  bulb(c) {
    for (let i = 0; i < 7; i++) { const a = Math.PI + (i + 0.5) * Math.PI / 7; stroke(c, [Math.cos(a) * 30, -6 + Math.sin(a) * 30, Math.cos(a) * 40, -6 + Math.sin(a) * 40], "#f2b630", 3); }
    circle(c, 0, -6, 22, "#ffe27a");
    box(c, -10, 14, 20, 8, "#9aa3b0", 2); box(c, -8, 23, 16, 7, "#7a828d", 2);
    stroke(c, [-6, -2, 0, -10, 6, -2], "#e09a2e", 2.5);
  },
  paint(c) {
    for (const [x, y, color] of [[-24, 10, "#e8623b"], [0, 20, "#5aa9e6"], [24, 10, "#f2d14b"]] as const) oval(c, x, y, 14, 11, color);
    stroke(c, [14, -40, -6, -2], "#a8743d", 6);
    shape(c, [-10, 2, -2, -6, 2, 0, -6, 8], "#7cc36b");
  },
  drops(c) {
    for (const y of [-22, 22]) {
      c.beginPath(); c.moveTo(0, y - 24); c.bezierCurveTo(8, y - 10, 18, y - 2, 18, y + 6); c.arc(0, y + 6, 18, 0, Math.PI); c.bezierCurveTo(-18, y - 2, -8, y - 10, 0, y - 24);
      c.fillStyle = "#5aa9e6"; c.fill(); oval(c, -6, y + 4, 4, 6, "#d8eef7", 0.4);
    }
  },
  moon(c) {
    c.save();
    c.beginPath(); c.arc(-2, 12, 30, 0, TAU); c.clip();
    c.beginPath(); c.rect(-50, -50, 100, 100); c.arc(14, 2, 26, 0, TAU); c.fillStyle = "#f6d23b"; c.fill("evenodd");
    c.restore();
    circle(c, 10, -34, 6, "#f6d23b");
    circle(c, -16, 10, 2.4, INK); smile(c, -14, 20, 5, 2);
  },
  curd(c) {
    c.beginPath(); c.moveTo(-34, -10); c.quadraticCurveTo(-40, 36, 0, 38); c.quadraticCurveTo(40, 36, 34, -10); c.closePath(); c.fillStyle = "#b5653a"; c.fill();
    oval(c, 0, -10, 34, 10, "#fffdf6");
    stroke(c, [-30, 10, 30, 10], "#8a4a28", 3);
  },
  water(c) {
    shape(c, [-22, -34, 22, -34, 16, 38, -16, 38], "#e6f3fa");
    shape(c, [-19, -8, 19, -8, 16, 38, -16, 38], "#5aa9e6");
    stroke(c, [-22, -34, -16, 38, 16, 38, 22, -34], "#9fc3d8", 3);
    oval(c, -8, 10, 3, 8, "#bfe0f2");
  },
  kite(c) {
    shape(c, [0, -42, 30, -4, 0, 24, -30, -4], "#e8623b");
    shape(c, [0, -42, 30, -4, 0, -4], "#f2d14b");
    shape(c, [0, 24, -30, -4, 0, -4], "#5aa9e6");
    c.beginPath(); c.moveTo(0, 24); c.quadraticCurveTo(-10, 34, 4, 40); c.quadraticCurveTo(14, 46, 4, 52); c.strokeStyle = "#5d4a3a"; c.lineWidth = 2; c.stroke();
  },
  tiger(c) {
    circle(c, -22, -24, 10, "#f29a2e"); circle(c, 22, -24, 10, "#f29a2e");
    circle(c, 0, 2, 34, "#f29a2e");
    oval(c, 0, 16, 18, 14, "#fff7e6");
    for (const s of [-1, 1]) { stroke(c, [s * 30, -6, s * 18, -2], INK, 3.5); stroke(c, [s * 32, 6, s * 20, 6], INK, 3.5); }
    stroke(c, [0, -32, 0, -20], INK, 3.5); stroke(c, [-8, -30, -6, -20], INK, 3); stroke(c, [8, -30, 6, -20], INK, 3);
    eyes(c, 0, -4, 11, 3.6);
    oval(c, 0, 8, 5, 3.5, "#e0566b"); smile(c, 0, 18, 6);
  },
};

/** One picture (or, for a number, that many dots) centred at (x, y), `size` units across. */
export function drawPicture(c: C, pic: string, x: number, y: number, size: number) {
  c.save();
  c.translate(x, y); c.scale(size / 100, size / 100);
  const dots = /^dots(\d+)$/.exec(pic);
  if (dots) {
    const n = Number(dots[1]), rows = Math.ceil(n / 5), r = n > 10 ? 6.5 : 8, step = r * 2.6;
    for (let i = 0; i < n; i++) circle(c, (i % 5 - 2) * step, (Math.floor(i / 5) - (rows - 1) / 2) * step, r, i < 10 ? "#e8623b" : "#5aa9e6");
  } else PICTURES[pic]?.(c);
  c.restore();
}
export const hasPicture = (pic: string) => pic in PICTURES || /^dots([1-9]|1\d|20)$/.test(pic);

/** Fruit colours per world: light skins so the dark letter reads at a glance. */
export const SKIN: Record<World, { fill: string; shade: string }> = {
  vowel: { fill: "#ffd447", shade: "#f2b31f" },
  consonant: { fill: "#ffb38a", shade: "#f28a5b" },
  word: { fill: "#c9ec8f", shade: "#9fd25e" },
  number: { fill: "#d9c8ff", shade: "#b49bf2" },
};

/**
 * A fruit with its letter. `font` is prepared once per text (see draw.hot.ts), so drawing allocates nothing.
 * `scale` grows it on the branch; `sway` turns it on its stem.
 */
export function drawFruit(c: C, x: number, y: number, text: string, font: string, world: World, scale = 1, sway = 0) {
  const skin = SKIN[world], r = R * scale;
  c.save();
  c.translate(x, y);
  if (sway) c.rotate(sway);
  c.beginPath(); c.moveTo(0, -r + 2); c.lineTo(2 * scale, -r - 8 * scale);
  c.strokeStyle = "#6b4a2b"; c.lineWidth = 3 * scale; c.lineCap = "round"; c.stroke();
  leaf(c, 9 * scale, -r - 6 * scale, 8 * scale, -0.5);
  circle(c, 0, 0, r, skin.shade);
  circle(c, -2 * scale, -2.5 * scale, r - 3 * scale, skin.fill);
  if (scale > 0.3) {
    c.scale(scale, scale);
    c.fillStyle = INK; c.font = font; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(text, -1, 2);
  }
  c.restore();
}

/** The font for a fruit's text: big, shrunk only for two-letter units like "নৌ" or "১৫". */
export function fruitFont(c: C, text: string) {
  let size = 34;
  c.font = `700 ${size}px ${DISPLAY_FONT}`;
  while (size > 18 && c.measureText(text).width > R * 1.55) { size -= 2; c.font = `700 ${size}px ${DISPLAY_FONT}`; }
  return `700 ${size}px ${DISPLAY_FONT}`;
}

/** The woven cane basket. `tilt` rocks it after a wrong letter. */
export function drawBasket(c: C, x: number, tilt = 0, y = BASKET_Y) {
  c.save();
  c.translate(x, y);
  if (tilt) c.rotate(tilt);
  shape(c, [-48, -16, 48, -16, 36, 26, -36, 26], "#c08445");
  for (let i = 0; i < 3; i++) stroke(c, [-44 + i * 4, -4 + i * 11, 44 - i * 4, -4 + i * 11], "#9a6330", 3);
  for (let i = -3; i <= 3; i++) stroke(c, [i * 13, -14, i * 10, 24], "#d9a066", 2);
  oval(c, 0, -16, 50, 8, "#8a5527");
  oval(c, 0, -17, 44, 5, "#5e3816");
  c.restore();
}

/** The basket's bitmap box in board units: it is drawn once and then only moved and turned. */
export const BASKET_BOX = { x: -54, y: -28, w: 108, h: 58 } as const;
export function paintBasket(k: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(BASKET_BOX.w * k); canvas.height = Math.ceil(BASKET_BOX.h * k);
  const c = canvas.getContext("2d");
  if (c) { c.scale(k, k); drawBasket(c, -BASKET_BOX.x, 0, -BASKET_BOX.y); }
  return canvas;
}

/** One tree per world, at its own time of day. */
export const WORLD_SKY: Record<World, { top: string; bottom: string; leaf: string; light: string }> = {
  vowel: { top: "#ffdcb8", bottom: "#fff4e2", leaf: "#4a9d40", light: "#6dbb59" },
  consonant: { top: "#bfe6f7", bottom: "#eef8fc", leaf: "#4a9d40", light: "#68b957" },
  word: { top: "#ffcf73", bottom: "#fff0c9", leaf: "#4f9a3a", light: "#79bb4f" },
  number: { top: "#9d8fd6", bottom: "#f2d4df", leaf: "#3d8a49", light: "#5aa560" },
};

/** The still scene, drawn once to an offscreen canvas: the sky for the world, the big tree, the grass, and the অজগর resting under it. */
export function drawScene(c: C, world: World = "consonant") {
  const look = WORLD_SKY[world];
  const sky = c.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, look.top); sky.addColorStop(1, look.bottom);
  c.fillStyle = sky; c.fillRect(0, 0, W, H);
  if (world === "vowel") { circle(c, 52, 250, 34, "#ffe9a8"); circle(c, 52, 250, 26, "#ffcf5c"); }
  if (world === "word") { circle(c, 300, 230, 30, "#fff2b0"); circle(c, 300, 230, 22, "#ffd84d"); }
  if (world === "number") {
    circle(c, 296, 210, 20, "#fff6d8"); circle(c, 305, 204, 17, look.top);
    for (const [x, y] of [[40, 190], [80, 250], [250, 270], [330, 300]] as const) circle(c, x, y, 2.2, "#fff6d8");
  }
  box(c, W / 2 - 16, 90, 32, GROUND_Y - 70, "#9a6a3e", 6);
  stroke(c, [W / 2, 150, W / 2 - 50, 110], "#9a6a3e", 10); stroke(c, [W / 2, 170, W / 2 + 56, 120], "#9a6a3e", 10);
  for (const [x, y, r, dark] of [
    [20, 30, 52, 1], [90, 14, 56, 0], [180, 6, 62, 1], [270, 14, 56, 0], [340, 30, 52, 1],
    [50, 64, 40, 0], [130, 56, 44, 0], [230, 56, 44, 0], [310, 64, 40, 0], [180, 70, 36, 1],
  ] as const) circle(c, x, y, r, dark ? "#3f8f3a" : look.leaf);
  for (const [x, y, r] of [[70, 36, 18], [150, 26, 20], [236, 30, 18], [312, 52, 14], [110, 74, 12], [262, 80, 12]] as const) circle(c, x, y, r, look.light);
  box(c, 0, GROUND_Y - 6, W, H - GROUND_Y + 6, "#7cc36b");
  box(c, 0, GROUND_Y - 6, W, 5, "#5fae4c");
  for (let x = 8; x < W; x += 22) stroke(c, [x, GROUND_Y - 4, x + 3, GROUND_Y - 13, x + 6, GROUND_Y - 4], "#5fae4c", 2);
  drawPicture(c, "snake", W - 34, GROUND_Y + 2, 44);
}

/** The hint: a warm halo and a dashed ring that turns (still in ধীরে খেলো), so the right fruit stands out by shape, not only colour. */
export function drawGlow(c: C, x: number, y: number, r: number, turn: number) {
  c.save();
  c.translate(x, y);
  circle(c, 0, 0, r + 12, "rgba(255, 214, 71, 0.45)");
  c.rotate(turn);
  c.setLineDash(DASH);
  ring(c, 0, 0, r + 9, "#b07800", 3);
  c.setLineDash(NO_DASH);
  c.restore();
}
const DASH = [7, 6], NO_DASH: number[] = [];

/** The ghost finger that shows the very first tap of the game: a pale hand pointing up at the fruit, bobbing gently. */
export function drawFinger(c: C, x: number, y: number, bob: number) {
  c.save();
  c.translate(x + 6, y + bob);
  c.globalAlpha = 0.85;
  box(c, -7, 0, 14, 34, "#fff7ec", 7);
  box(c, -16, 24, 34, 30, "#fff7ec", 12);
  c.strokeStyle = "#8a6a44"; c.lineWidth = 2;
  c.beginPath(); c.roundRect(-7, 0, 14, 34, 7); c.stroke();
  c.beginPath(); c.roundRect(-16, 24, 34, 30, 12); c.stroke();
  c.restore();
}

/** The title's start button art: the basket brimming with অ আ ই, the অজগর peeking over the rim. Drawn into a w × h box. */
export function drawTitleArt(c: C, w: number, h: number, world: World) {
  const k = Math.min(w / 240, h / 200);
  c.clearRect(0, 0, w, h);
  c.save();
  c.translate(w / 2, h / 2 + 8 * k);
  c.scale(k, k);
  oval(c, 0, 72, 112, 16, "rgba(43, 36, 22, 0.12)");
  drawPicture(c, "snake", 84, -6, 92);
  c.save(); c.scale(1.9, 1.9); drawBasket(c, 0, 0, 18); c.restore();
  const items = world === "number" ? ["১", "২", "৩"] : world === "word" ? ["আ", "ম", "বই"] : world === "consonant" ? ["ক", "খ", "গ"] : ["অ", "আ", "ই"];
  const spots = [[-60, -14, -0.14], [0, -36, 0], [60, -14, 0.14]] as const;
  items.forEach((text, i) => drawFruit(c, spots[i][0], spots[i][1], text, fruitFont(c, text), world, 1.12, spots[i][2]));
  c.restore();
}

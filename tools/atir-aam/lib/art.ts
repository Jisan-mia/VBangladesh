// Drawn stages on a clay সরা (painted plate): the tiles, the stage strip and the card all use these. Canvas 2D only.

export const palette = {
  paper: "#f6efdc", ink: "#2c2418", muted: "#6c5d45", clay: "#f3e6c8", soil: "#7a5233", leaf: "#3f8a3a", leafLight: "#6fb544",
  mango: "#f2b632", blush: "#e0602a", raw: "#74b33f", bark: "#6b4426", star: "#f2a516", band: "#2f5a2a", trim: "#f6d36b",
};
/** The plate's rim colour per stage, so a glance tells them apart (the picture still carries it). */
const RIM = ["#9a6a44", "#7a9a35", "#3e7a35", "#b9902c", "#6f9e34", "#2f7f4a", "#e0a21b", "#a8742f", "#285f33"];

type C = CanvasRenderingContext2D;

function ellipse(c: C, x: number, y: number, rx: number, ry: number, fill: string, rotation = 0) {
  c.beginPath(); c.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2); c.fillStyle = fill; c.fill();
}

function leaf(c: C, x: number, y: number, length: number, width: number, angle: number, fill: string) {
  c.save(); c.translate(x, y); c.rotate(angle);
  c.beginPath(); c.moveTo(0, 0);
  c.quadraticCurveTo(length * 0.5, -width, length, 0);
  c.quadraticCurveTo(length * 0.5, width, 0, 0);
  c.fillStyle = fill; c.fill();
  c.beginPath(); c.moveTo(length * 0.08, 0); c.lineTo(length * 0.9, 0);
  c.strokeStyle = "#ffffff55"; c.lineWidth = Math.max(1, width * 0.12); c.stroke();
  c.restore();
}

/** A mango: a soft kidney shape with a little beak, optionally blushing red at the shoulder. */
function mango(c: C, x: number, y: number, w: number, h: number, angle: number, fill: string, blush?: string) {
  c.save(); c.translate(x, y); c.rotate(angle);
  c.beginPath();
  c.moveTo(0, -h / 2);
  c.bezierCurveTo(w * 0.62, -h / 2, w * 0.6, h * 0.42, w * 0.04, h / 2);
  c.bezierCurveTo(-w * 0.5, h * 0.52, -w * 0.62, -h * 0.18, 0, -h / 2);
  if (blush) {
    const g = c.createLinearGradient(w * 0.4, -h / 2, -w * 0.3, h / 2);
    g.addColorStop(0, blush); g.addColorStop(0.45, fill); g.addColorStop(1, fill);
    c.fillStyle = g;
  } else c.fillStyle = fill;
  c.fill();
  ellipse(c, -w * 0.16, -h * 0.12, w * 0.12, h * 0.2, "#ffffff40", -0.3);
  c.restore();
}

function tree(c: C, x: number, y: number, k: number, fruit?: string) {
  c.fillStyle = palette.bark;
  c.beginPath(); c.moveTo(x - 4 * k, y); c.lineTo(x - 2.5 * k, y - 26 * k); c.lineTo(x + 2.5 * k, y - 26 * k); c.lineTo(x + 4 * k, y); c.fill();
  ellipse(c, x - 11 * k, y - 30 * k, 13 * k, 11 * k, palette.leaf);
  ellipse(c, x + 11 * k, y - 30 * k, 13 * k, 11 * k, palette.leaf);
  ellipse(c, x, y - 40 * k, 15 * k, 13 * k, "#4b9a3f");
  ellipse(c, x - 4 * k, y - 44 * k, 7 * k, 5 * k, palette.leafLight);
  if (fruit) for (const [dx, dy] of [[-12, -26], [9, -33], [1, -24], [13, -24], [-6, -38]]) ellipse(c, x + dx * k, y + dy * k, 2.6 * k, 3.4 * k, fruit);
}

/** One stage on its plate, filling the square at (x, y) of side s. `stage` -1 is a পাথর. */
export function drawStage(c: C, stage: number, x: number, y: number, s: number) {
  c.save();
  c.translate(x, y);
  const u = s / 100;
  c.scale(u, u);
  if (stage < 0) {
    ellipse(c, 50, 58, 38, 28, "#6f736d");
    ellipse(c, 47, 52, 36, 26, "#9a9e96");
    ellipse(c, 38, 42, 14, 8, "#c4c7bf", -0.3);
    c.restore();
    return;
  }
  // the plate
  ellipse(c, 50, 52, 46, 46, "#00000026");
  ellipse(c, 50, 50, 46, 46, RIM[stage - 1]);
  ellipse(c, 50, 50, 40, 40, palette.clay);
  ellipse(c, 44, 42, 26, 22, "#fffaf0");
  ellipse(c, 50, 50, 34, 34, "#fbf3e0");
  c.beginPath(); c.arc(50, 50, 40, 0, Math.PI * 2); c.strokeStyle = "#00000018"; c.lineWidth = 1.5; c.stroke();

  switch (stage) {
    case 1: // আঁটি: a pale, stringy mango stone
      ellipse(c, 50, 66, 24, 7, "#a77b5566");
      ellipse(c, 50, 50, 25, 15, "#e6cf9c", -0.45);
      c.strokeStyle = "#b58f57"; c.lineWidth = 1.6;
      for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(36 + i * 3, 58 - i * 7); c.quadraticCurveTo(50, 50 - i * 6, 64 + i * 2, 41 - i * 6); c.stroke(); }
      c.beginPath(); c.ellipse(50, 50, 25, 15, -0.45, 0, Math.PI * 2); c.lineWidth = 2.2; c.strokeStyle = "#a07a45"; c.stroke();
      break;
    case 2: // চারা: two soft leaves out of a mound
      ellipse(c, 50, 70, 25, 8, palette.soil);
      c.strokeStyle = "#4c7a2c"; c.lineWidth = 3.4; c.lineCap = "round";
      c.beginPath(); c.moveTo(50, 69); c.quadraticCurveTo(48, 56, 50, 44); c.stroke();
      leaf(c, 50, 45, 22, 9, -2.55, palette.leafLight);
      leaf(c, 50, 45, 22, 9, -0.6, "#86c653");
      break;
    case 3: // গাছ
      ellipse(c, 50, 78, 22, 5, "#7a523366");
      tree(c, 50, 78, 1);
      break;
    case 4: // মুকুল: the tree in blossom
      ellipse(c, 50, 78, 22, 5, "#7a523366");
      tree(c, 50, 78, 1);
      c.fillStyle = "#f4dc84";
      for (const [mx, my] of [[37, 47], [50, 34], [62, 45], [44, 40], [57, 52], [42, 55], [60, 36]]) {
        c.beginPath(); c.moveTo(mx, my - 8); c.lineTo(mx + 3.6, my + 1); c.lineTo(mx - 3.6, my + 1); c.fill();
      }
      break;
    case 5: { // গুটি আম: a branch with a cluster of baby mangoes
      c.strokeStyle = palette.bark; c.lineWidth = 4; c.lineCap = "round";
      c.beginPath(); c.moveTo(22, 30); c.quadraticCurveTo(46, 34, 72, 26); c.stroke();
      leaf(c, 30, 31, 22, 7, 0.9, palette.leaf);
      leaf(c, 66, 28, 22, 7, -0.4, "#4b9a3f");
      c.lineWidth = 1.4; c.strokeStyle = "#5a7a2c";
      const babies = [[42, 52], [52, 56], [61, 50], [47, 64], [57, 66]];
      for (const [bx, by] of babies) { c.beginPath(); c.moveTo(51, 33); c.lineTo(bx, by - 5); c.stroke(); }
      for (const [bx, by] of babies) mango(c, bx, by, 8, 11, 0.2, palette.raw);
      break;
    }
    case 6: // কাঁচা আম
      leaf(c, 54, 26, 26, 8, -0.35, palette.leaf);
      c.strokeStyle = palette.bark; c.lineWidth = 2.6; c.beginPath(); c.moveTo(52, 22); c.lineTo(50, 30); c.stroke();
      mango(c, 50, 54, 38, 46, 0.25, "#66a838");
      break;
    case 7: // পাকা আম
      leaf(c, 54, 26, 26, 8, -0.35, palette.leaf);
      c.strokeStyle = palette.bark; c.lineWidth = 2.6; c.beginPath(); c.moveTo(52, 22); c.lineTo(50, 30); c.stroke();
      mango(c, 50, 54, 38, 46, 0.25, palette.mango, palette.blush);
      break;
    case 8: { // আমের ঝুড়ি: a bamboo basket heaped with ripe ones
      mango(c, 38, 44, 18, 22, -0.9, palette.mango, palette.blush);
      mango(c, 62, 44, 18, 22, 0.9, palette.mango, palette.blush);
      mango(c, 50, 38, 18, 22, 0.1, "#f5c242", palette.blush);
      c.fillStyle = "#b98a4e";
      c.beginPath(); c.moveTo(24, 50); c.lineTo(76, 50); c.lineTo(68, 78); c.lineTo(32, 78); c.closePath(); c.fill();
      c.strokeStyle = "#8a6232"; c.lineWidth = 1.6;
      for (const yy of [58, 66, 73]) { c.beginPath(); c.moveTo(27 + (yy - 50) * 0.28, yy); c.lineTo(73 - (yy - 50) * 0.28, yy); c.stroke(); }
      for (let xx = 32; xx <= 68; xx += 6) { c.beginPath(); c.moveTo(xx, 51); c.lineTo(50 + (xx - 50) * 0.7, 77); c.stroke(); }
      ellipse(c, 50, 50, 27, 4.5, "#d3a868");
      break;
    }
    default: // আমের বাগান: three trees heavy with fruit
      ellipse(c, 50, 72, 34, 9, "#8cc152");
      tree(c, 30, 72, 0.62, palette.mango);
      tree(c, 70, 72, 0.62, palette.mango);
      tree(c, 50, 76, 0.78, palette.mango);
  }
  c.restore();
}

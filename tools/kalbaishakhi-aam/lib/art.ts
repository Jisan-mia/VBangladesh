// The game's own drawings, shared by the scene and the share card: a mango, a dry twig, a bamboo ডালা and a small heart.
// Each one draws at the context's origin, `size` units tall (or wide for the twig and the ডালা).
type Context = CanvasRenderingContext2D;

/** A mango: stem slightly left, a broad right shoulder, the little beak low on the left. */
function mangoPath(context: Context, size: number) {
  const s = size;
  context.beginPath();
  context.moveTo(-0.05 * s, -0.48 * s);
  context.bezierCurveTo(0.25 * s, -0.56 * s, 0.42 * s, -0.28 * s, 0.4 * s, 0);
  context.bezierCurveTo(0.38 * s, 0.3 * s, 0.18 * s, 0.5 * s, -0.02 * s, 0.48 * s);
  context.bezierCurveTo(-0.08 * s, 0.47 * s, -0.14 * s, 0.46 * s, -0.17 * s, 0.41 * s);
  context.bezierCurveTo(-0.4 * s, 0.3 * s, -0.38 * s, -0.42 * s, -0.05 * s, -0.48 * s);
  context.closePath();
}

/** Ripe: bright yellow with a red blush, no leaf. Green: darker, with a leaf. Lightness and the leaf tell them apart, not hue alone. */
export function drawMango(context: Context, size: number, ripe: boolean) {
  const s = size;
  context.lineCap = "round";
  context.strokeStyle = "#5b3a1e";
  context.lineWidth = s * 0.07;
  context.beginPath(); context.moveTo(-0.05 * s, -0.46 * s); context.quadraticCurveTo(-0.06 * s, -0.56 * s, 0, -0.64 * s); context.stroke();
  if (!ripe) {
    context.fillStyle = "#3d7a2a";
    context.beginPath();
    context.moveTo(-0.02 * s, -0.58 * s);
    context.bezierCurveTo(0.06 * s, -0.82 * s, 0.3 * s, -0.86 * s, 0.42 * s, -0.8 * s);
    context.bezierCurveTo(0.32 * s, -0.64 * s, 0.12 * s, -0.56 * s, -0.02 * s, -0.58 * s);
    context.fill();
    context.strokeStyle = "#7fb04f"; context.lineWidth = s * 0.025;
    context.beginPath(); context.moveTo(0, -0.6 * s); context.quadraticCurveTo(0.2 * s, -0.74 * s, 0.38 * s, -0.79 * s); context.stroke();
  }
  const body = context.createRadialGradient(0.12 * s, -0.16 * s, 0.04 * s, 0.05 * s, 0, 0.62 * s);
  if (ripe) { body.addColorStop(0, "#fff0a0"); body.addColorStop(0.45, "#ffc93c"); body.addColorStop(1, "#ea8a24"); }
  else { body.addColorStop(0, "#c8e070"); body.addColorStop(0.5, "#86b23a"); body.addColorStop(1, "#4f7a20"); }
  mangoPath(context, s);
  context.fillStyle = body;
  context.fill();
  if (ripe) {
    const blush = context.createRadialGradient(0.22 * s, -0.22 * s, 0, 0.22 * s, -0.22 * s, 0.32 * s);
    blush.addColorStop(0, "#e2522bcc"); blush.addColorStop(1, "#e2522b00");
    context.fillStyle = blush;
    context.fill();
  }
  context.strokeStyle = ripe ? "#a9561a" : "#365a16";
  context.lineWidth = s * 0.045;
  context.stroke();
  context.fillStyle = "#ffffff70";
  context.beginPath(); context.ellipse(0.16 * s, -0.22 * s, 0.07 * s, 0.11 * s, -0.5, 0, Math.PI * 2); context.fill();
}

/** A dry twig, `size` long: bare, grey-brown, forked. Nothing like a mango. */
export function drawBranch(context: Context, size: number) {
  const s = size;
  context.lineCap = "round"; context.lineJoin = "round";
  const stroke = (width: number, color: string) => {
    context.strokeStyle = color; context.lineWidth = width * s;
    context.beginPath();
    context.moveTo(-0.5 * s, 0.06 * s); context.quadraticCurveTo(0, -0.04 * s, 0.5 * s, -0.04 * s);
    context.moveTo(-0.12 * s, 0.01 * s); context.lineTo(-0.3 * s, -0.24 * s); context.lineTo(-0.36 * s, -0.3 * s);
    context.moveTo(-0.3 * s, -0.24 * s); context.lineTo(-0.2 * s, -0.33 * s);
    context.moveTo(0.16 * s, -0.02 * s); context.lineTo(0.34 * s, 0.2 * s);
    context.moveTo(0.36 * s, -0.04 * s); context.lineTo(0.46 * s, -0.18 * s);
    context.stroke();
  };
  stroke(0.15, "#3b2a1c");
  stroke(0.1, "#7a5a3c");
  context.strokeStyle = "#a88560"; context.lineWidth = 0.03 * s;
  context.beginPath(); context.moveTo(-0.44 * s, 0.03 * s); context.quadraticCurveTo(0, -0.06 * s, 0.44 * s, -0.06 * s); context.stroke();
}

/** The back half of the ডালা: the woven inside and the far rim. `width` is the rim's full width. */
export function drawDalaBack(context: Context, width: number) {
  const rx = width / 2, ry = width * 0.12;
  const inside = context.createRadialGradient(0, ry * 0.3, 0, 0, 0, rx);
  inside.addColorStop(0, "#c08a40"); inside.addColorStop(1, "#ecc77a");
  context.fillStyle = inside;
  context.beginPath(); context.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); context.fill();
  context.save();
  context.clip();
  context.strokeStyle = "#9a6c33aa"; context.lineWidth = Math.max(0.6, width * 0.012);
  context.beginPath();
  for (let x = -rx; x <= rx; x += width * 0.07) { context.moveTo(x, -ry); context.lineTo(x + ry * 1.4, ry); context.moveTo(x, ry); context.lineTo(x + ry * 1.4, -ry); }
  context.stroke();
  context.restore();
  context.strokeStyle = "#5e3a16"; context.lineWidth = width * 0.05;
  context.beginPath(); context.ellipse(0, 0, rx, ry, 0, Math.PI, Math.PI * 2); context.stroke();
}

/** The front half: the shallow woven bowl and the near rim, drawn over whatever sits in the ডালা. */
export function drawDalaFront(context: Context, width: number) {
  const rx = width / 2, ry = width * 0.12, depth = width * 0.17;
  const body = context.createLinearGradient(0, 0, 0, depth);
  body.addColorStop(0, "#f0c878"); body.addColorStop(1, "#b57a3a");
  context.fillStyle = body;
  context.beginPath();
  context.ellipse(0, 0, rx, ry, 0, 0, Math.PI);
  context.bezierCurveTo(-rx * 0.96, depth * 0.9, -rx * 0.5, depth, 0, depth);
  context.bezierCurveTo(rx * 0.5, depth, rx * 0.96, depth * 0.9, rx, 0);
  context.fill();
  context.strokeStyle = "#5e3a16"; context.lineWidth = width * 0.03;
  context.stroke();
  context.save();
  context.clip();
  context.strokeStyle = "#8a5a28aa"; context.lineWidth = Math.max(0.6, width * 0.012);
  context.beginPath();
  for (let x = -rx; x <= rx; x += width * 0.055) { context.moveTo(x, 0); context.lineTo(x * 0.9, depth * 1.2); }
  for (let y = ry * 0.9; y < depth; y += depth * 0.3) { context.moveTo(-rx, y); context.lineTo(rx, y); }
  context.stroke();
  context.restore();
  context.strokeStyle = "#5e3a16"; context.lineWidth = width * 0.06;
  context.beginPath(); context.ellipse(0, 0, rx, ry, 0, 0, Math.PI); context.stroke();
  context.strokeStyle = "#e8c47e"; context.lineWidth = width * 0.018;
  context.beginPath(); context.ellipse(0, -width * 0.01, rx * 0.97, ry * 0.9, 0, 0.25, Math.PI - 0.25); context.stroke();
}

export function drawHeart(context: Context, size: number, full: boolean) {
  const s = size / 2;
  context.beginPath();
  context.moveTo(0, s * 0.9);
  context.bezierCurveTo(-s * 1.3, 0, -s * 0.9, -s * 1.1, 0, -s * 0.45);
  context.bezierCurveTo(s * 0.9, -s * 1.1, s * 1.3, 0, 0, s * 0.9);
  context.closePath();
  context.lineWidth = s * 0.22;
  context.strokeStyle = full ? "#7d1d16" : "#f3e6d088";
  context.fillStyle = "#e5483a";
  if (full) context.fill();
  context.stroke();
}

/** Where up to `count` mangoes sit in a ডালা `width` wide, as a mound: bottom row widest. Returns [x, y] offsets from the rim centre. */
export function pileSlots(count: number, width: number) {
  const slots: Array<[number, number]> = [];
  const size = width * 0.19;
  for (let row = 0, perRow = 5; slots.length < count && perRow > 0; row++, perRow--) {
    for (let index = 0; index < perRow && slots.length < count; index++) {
      const x = (index - (perRow - 1) / 2) * size * 0.86 + (row % 2 ? size * 0.05 : 0);
      slots.push([x, width * 0.03 - row * size * 0.55]);
    }
  }
  return slots;
}

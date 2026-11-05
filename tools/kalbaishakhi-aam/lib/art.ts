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

/** The golden mango: deep gold with a sheen and a small spark, and a leaf like the green one, so it differs in more than hue. */
export function drawGold(context: Context, size: number) {
  const s = size;
  context.lineCap = "round";
  context.strokeStyle = "#5b3a1e"; context.lineWidth = s * 0.07;
  context.beginPath(); context.moveTo(-0.05 * s, -0.46 * s); context.quadraticCurveTo(-0.06 * s, -0.56 * s, 0, -0.64 * s); context.stroke();
  const body = context.createLinearGradient(-0.4 * s, -0.5 * s, 0.4 * s, 0.5 * s);
  body.addColorStop(0, "#fff6b8"); body.addColorStop(0.35, "#ffd233"); body.addColorStop(0.7, "#f0a018"); body.addColorStop(1, "#b86a08");
  mangoPath(context, s);
  context.fillStyle = body; context.fill();
  context.strokeStyle = "#7a4204"; context.lineWidth = s * 0.06; context.stroke();
  context.fillStyle = "#ffffffb0";
  context.beginPath(); context.ellipse(0.14 * s, -0.24 * s, 0.08 * s, 0.14 * s, -0.5, 0, Math.PI * 2); context.fill();
  // A four-point spark at the shoulder.
  context.fillStyle = "#fffbe6";
  context.beginPath();
  const x = 0.36 * s, y = -0.5 * s, r = 0.2 * s;
  context.moveTo(x, y - r); context.lineTo(x + r * 0.22, y - r * 0.22); context.lineTo(x + r, y); context.lineTo(x + r * 0.22, y + r * 0.22);
  context.lineTo(x, y + r); context.lineTo(x - r * 0.22, y + r * 0.22); context.lineTo(x - r, y); context.lineTo(x - r * 0.22, y - r * 0.22);
  context.closePath(); context.fill();
}

/** A hail pellet: a small round of ice, pale blue with a bright glint and a darker rim. */
export function drawHail(context: Context, size: number) {
  const r = size / 2;
  const body = context.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  body.addColorStop(0, "#ffffff"); body.addColorStop(0.55, "#d6ecfa"); body.addColorStop(1, "#8fb8d6");
  context.fillStyle = body;
  context.beginPath(); context.arc(0, 0, r, 0, Math.PI * 2); context.fill();
  context.strokeStyle = "#5d86a6"; context.lineWidth = r * 0.22; context.stroke();
  context.fillStyle = "#ffffff";
  context.beginPath(); context.arc(-r * 0.32, -r * 0.34, r * 0.22, 0, Math.PI * 2); context.fill();
}

/** The big broken branch, `size` long: a thick limb with a split end and a few leaves still on. */
export function drawBigBranch(context: Context, size: number) {
  const s = size;
  context.lineCap = "round"; context.lineJoin = "round";
  for (const [width, color] of [[0.12, "#2e2014"], [0.08, "#6b4a2c"]] as const) {
    context.strokeStyle = color; context.lineWidth = width * s;
    context.beginPath();
    context.moveTo(-0.5 * s, 0.04 * s); context.quadraticCurveTo(0, -0.05 * s, 0.46 * s, 0.02 * s);
    context.moveTo(-0.18 * s, -0.01 * s); context.lineTo(-0.3 * s, -0.2 * s);
    context.moveTo(0.12 * s, -0.03 * s); context.lineTo(0.26 * s, -0.22 * s);
    context.moveTo(0.3 * s, 0); context.lineTo(0.4 * s, 0.16 * s);
    context.stroke();
  }
  // The split, pale end where it tore off the tree.
  context.fillStyle = "#e4c89a";
  context.beginPath(); context.moveTo(0.44 * s, -0.04 * s); context.lineTo(0.52 * s, 0); context.lineTo(0.47 * s, 0.03 * s); context.lineTo(0.53 * s, 0.07 * s); context.lineTo(0.44 * s, 0.07 * s); context.closePath(); context.fill();
  context.fillStyle = "#3f6a2c";
  for (const [x, y, a] of [[-0.31, -0.24, -0.6], [0.27, -0.26, 0.5], [-0.05, -0.08, 0.2], [0.41, 0.19, 1.1]] as const) {
    context.beginPath(); context.ellipse(x * s, y * s, 0.07 * s, 0.025 * s, a, 0, Math.PI * 2); context.fill();
  }
}

/** One palette per world; the card and the scene read the same values. */
export type Look = "afternoon" | "dusk" | "night";
export type Palette = {
  sky: readonly [string, string, string, string]; clouds: string; cloudLight: string; glow: string; village: string; hut: string; roof: string;
  field: readonly [string, string]; yard: readonly [string, string]; canopy: readonly [string, string, string, string]; leaf: string; trunk: string;
  ink: string; flash: string;
};
export const PALETTES: Record<Look, Palette> = {
  afternoon: {
    sky: ["#2e3a49", "#575c64", "#b9895a", "#eab56a"], clouds: "#3e4854", cloudLight: "#d39a5f55", glow: "#f2c27a", village: "#2f4535", hut: "#6f5640", roof: "#7d8a90",
    field: ["#86a243", "#5e7d2c"], yard: ["#c38a52", "#a36c3c"], canopy: ["#24481f", "#2f5a26", "#3b6c2d", "#4c8236"], leaf: "#4f8a36", trunk: "#5a3a24",
    ink: "#1c1611", flash: "#ffeecd",
  },
  dusk: {
    sky: ["#272241", "#4a3b5c", "#94566a", "#d6866a"], clouds: "#383050", cloudLight: "#d2808055", glow: "#e59a78", village: "#2a3036", hut: "#5e4a3e", roof: "#6c6f80",
    field: ["#6e8a45", "#4d6731"], yard: ["#ad7a50", "#8c5d39"], canopy: ["#1e3823", "#274a2a", "#32592f", "#406e39"], leaf: "#4c7e38", trunk: "#4e3322",
    ink: "#191322", flash: "#f2e4ff",
  },
  night: {
    sky: ["#0d1226", "#192142", "#2b3459", "#3c4469"], clouds: "#20273d", cloudLight: "#7b86b544", glow: "#4c557e", village: "#121826", hut: "#3a3130", roof: "#4a5066",
    field: ["#34492d", "#24361f"], yard: ["#5f4b3b", "#4a3a2e"], canopy: ["#0e2015", "#152e1b", "#1c3b21", "#244a29"], leaf: "#2f5a2f", trunk: "#3a271a",
    ink: "#0b0f1c", flash: "#e6ecff",
  },
};

/** The title's start art: a ডালা heaped with mangoes (one golden), in a warm glow, drawn into `width`×`height` CSS px. */
export function drawStartArt(canvas: HTMLCanvasElement, width: number, height: number) {
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const context = canvas.getContext("2d");
  if (!context) return;
  const unit = Math.min(width / 260, height / 170) * ratio;
  context.setTransform(unit, 0, 0, unit, canvas.width / 2, canvas.height / 2 + 30 * unit);
  // A warm glow that fades out before it reaches the canvas's edge, so no box shows.
  const reach = Math.min(canvas.width / 2, canvas.height / 2) / unit;
  const glow = context.createRadialGradient(0, -30, 10, 0, -30, reach);
  glow.addColorStop(0, "#ffd27a80"); glow.addColorStop(1, "#ffd27a00");
  context.fillStyle = glow; context.beginPath(); context.arc(0, -30, reach, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#00000040";
  context.beginPath(); context.ellipse(0, 52, 112, 12, 0, 0, Math.PI * 2); context.fill();
  drawDalaBack(context, 230);
  const heap: Array<[number, number, number, number]> = [
    [-74, -6, 0, -0.3], [-38, -2, 1, 0.2], [0, -4, 0, -0.1], [38, -2, 1, 0.3], [74, -6, 0, 0.2],
    [-56, -36, 1, 0.1], [-18, -38, 0, -0.2], [20, -40, 3, 0.15], [56, -36, 1, -0.2],
    [-36, -66, 0, 0.3], [4, -72, 1, -0.1], [40, -64, 0, 0.2], [-8, -100, 1, 0.25],
  ];
  for (const [x, y, kind, angle] of heap) {
    context.save(); context.translate(x, y); context.rotate(angle);
    if (kind === 3) drawGold(context, 46); else drawMango(context, 44, kind === 1);
    context.restore();
  }
  drawDalaFront(context, 230);
}

// Hand-drawn pieces of the river, in cell units (1 = one hop), seen gently from above and in front.
// The screen paints them once into sprites; the share card paints them big. No outside images.

type Ctx = CanvasRenderingContext2D;

export const C = {
  canal: "#4f9886", river: "#5d97a0", monsoon: "#4b7a86", ripple: "rgba(255,255,255,0.32)",
  grass: "#86b45f", grassDark: "#6d9a4b", mud: "#a87b4f", sand: "#e3cf9c", brick: "#b5533c", mortar: "#e9cba8",
  wood: "#7a4a26", deck: "#a8703e", plank: "#5f3a1c", chhoi: "#c99a52", weave: "#9d7537",
  trunk: "#cfc98e", trunk2: "#b9b475", trunkEnd: "#efe7b8", rope: "#6b4b2a",
  leaf: "#3d8b3d", leafLight: "#79c066", petal: "#b68ad9", pollen: "#f5d76e",
  hull: "#eef0ea", stripe: "#2d5d8a", cabin: "#fbfbf6", window: "#3b5368", funnel: "#c9563f",
  mango: "#f3c234", mangoBlush: "#9cc23a", shirt: "#f4f6f8", bag: "#2f6db5", bagDark: "#24578f", hair: "#24170f", skin: "#b9784a",
  gamchha: "#c8323a", shorts: "#3b4a63", brass: "#d6a632", brassDark: "#9c7420", bamboo: "#c9a25e", ink: "#2a2118",
} as const;

/** One palette per world: the banks, the water and a light laid over everything (the title, the scene and the card read the same). */
export const LOOKS = {
  khal: { grass: "#86b45f", grassDark: "#6d9a4b", water: "#4f9886", sand: "#e3cf9c", mud: "#a87b4f", tint: "rgba(255,226,150,0.07)", sky: "#ffe9a8", rain: false },
  nodi: { grass: "#a3ad64", grassDark: "#8b9650", water: "#5d97a0", sand: "#ead7a2", mud: "#a07a52", tint: "rgba(255,196,120,0.10)", sky: "#ffd9a0", rain: false },
  borsha: { grass: "#5f9158", grassDark: "#4d7c49", water: "#4b7a86", sand: "#cdbf96", mud: "#8d6c4a", tint: "rgba(28,48,66,0.20)", sky: "#a9bfd0", rain: true },
} as const;
export type LookName = keyof typeof LOOKS;

function lens(c: Ctx, x0: number, x1: number, y0: number, y1: number, tip: number) {
  const mid = (y0 + y1) / 2;
  c.beginPath();
  c.moveTo(x0, mid);
  c.quadraticCurveTo(x0 + tip * 0.3, y0, x0 + tip, y0);
  c.lineTo(x1 - tip, y0);
  c.quadraticCurveTo(x1 - tip * 0.3, y0, x1, mid);
  c.quadraticCurveTo(x1 - tip * 0.3, y1, x1 - tip, y1);
  c.lineTo(x0 + tip, y1);
  c.quadraticCurveTo(x0 + tip * 0.3, y1, x0, mid);
  c.closePath();
}

/** A নৌকা from above: a long wooden hull, planks across, a bamboo-mat ছই in the middle. Box: 0..len × 0..1. */
export function drawNouka(c: Ctx, len: number) {
  c.fillStyle = "rgba(20,40,40,0.22)"; lens(c, 0.08, len - 0.02, 0.2, 0.94, 0.7); c.fill();
  c.fillStyle = C.wood; lens(c, 0.02, len - 0.02, 0.1, 0.88, 0.75); c.fill();
  c.fillStyle = C.deck; lens(c, 0.16, len - 0.16, 0.2, 0.78, 0.6); c.fill();
  c.strokeStyle = C.plank; c.lineWidth = 0.035;
  c.beginPath();
  for (let x = 0.55; x < len - 0.45; x += 0.32) { c.moveTo(x, 0.22); c.lineTo(x, 0.76); }
  c.stroke();
  const a = len * 0.36, b = len * 0.64;
  c.fillStyle = C.chhoi; c.beginPath(); c.roundRect(a, 0.14, b - a, 0.62, 0.18); c.fill();
  c.strokeStyle = C.weave; c.lineWidth = 0.03;
  c.beginPath();
  for (let x = a + 0.1; x < b - 0.05; x += 0.1) { c.moveTo(x, 0.18); c.lineTo(x, 0.72); }
  c.stroke();
  c.fillStyle = "rgba(255,255,255,0.18)"; c.beginPath(); c.roundRect(a + 0.04, 0.17, b - a - 0.08, 0.12, 0.06); c.fill();
}

/** A ভেলা: banana trunks lashed side by side with rope. */
export function drawVela(c: Ctx, len: number) {
  c.fillStyle = "rgba(20,40,40,0.2)"; c.beginPath(); c.roundRect(0.1, 0.24, len - 0.12, 0.7, 0.12); c.fill();
  for (let i = 0; i < 4; i++) {
    const y = 0.14 + i * 0.18;
    c.fillStyle = i % 2 ? C.trunk2 : C.trunk;
    c.beginPath(); c.roundRect(0.05, y, len - 0.1, 0.17, 0.085); c.fill();
    c.fillStyle = C.trunkEnd;
    c.beginPath(); c.ellipse(0.1, y + 0.085, 0.05, 0.08, 0, 0, Math.PI * 2); c.ellipse(len - 0.1, y + 0.085, 0.05, 0.08, 0, 0, Math.PI * 2); c.fill();
  }
  c.strokeStyle = C.rope; c.lineWidth = 0.06;
  c.beginPath();
  for (const x of [0.35, len - 0.35]) { c.moveTo(x, 0.12); c.lineTo(x, 0.86); }
  c.stroke();
}

// Leaf spots for a patch of কচুরিপানা, as fractions of its box (fixed, so every patch looks hand-placed, not random each frame).
const LEAVES = [[0.12, 0.42, 0.2], [0.3, 0.25, 0.19], [0.28, 0.66, 0.21], [0.5, 0.45, 0.22], [0.68, 0.24, 0.18], [0.7, 0.68, 0.2], [0.88, 0.45, 0.19], [0.47, 0.8, 0.15], [0.5, 0.14, 0.14]] as const;

/** A patch of কচুরিপানা: glossy round leaves and one lilac flower. */
export function drawPana(c: Ctx, len: number) {
  c.fillStyle = "rgba(20,40,40,0.18)"; c.beginPath(); c.ellipse(len / 2 + 0.05, 0.56, len / 2 - 0.02, 0.36, 0, 0, Math.PI * 2); c.fill();
  for (const [fx, fy, r] of LEAVES) {
    const x = 0.12 + fx * (len - 0.24), y = 0.08 + fy * 0.8, radius = r * Math.min(1.1, 0.75 + len * 0.12);
    c.fillStyle = C.leaf; c.beginPath(); c.arc(x, y, radius, 0, Math.PI * 2); c.fill();
    c.fillStyle = C.leafLight; c.beginPath(); c.arc(x - radius * 0.25, y - radius * 0.3, radius * 0.45, Math.PI * 1.05, Math.PI * 1.9); c.fill();
  }
  const fx = len * 0.55, fy = 0.38;
  c.fillStyle = C.petal;
  for (let i = 0; i < 5; i++) { const angle = i * Math.PI * 0.4; c.beginPath(); c.ellipse(fx + Math.cos(angle) * 0.08, fy + Math.sin(angle) * 0.08, 0.07, 0.045, angle, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = C.pollen; c.beginPath(); c.arc(fx, fy, 0.04, 0, Math.PI * 2); c.fill();
}

/** A river ferry from above, bow towards `dir`: white hull, blue rail, a cabin with windows, a red funnel. */
export function drawFerry(c: Ctx, len: number, dir: 1 | -1) {
  c.save();
  if (dir < 0) { c.translate(len, 0); c.scale(-1, 1); }
  c.fillStyle = "rgba(20,40,40,0.22)"; c.beginPath(); c.moveTo(0.12, 0.2); c.lineTo(len - 0.6, 0.18); c.quadraticCurveTo(len, 0.55, len - 0.6, 0.98); c.lineTo(0.12, 0.98); c.fill();
  c.fillStyle = C.hull;
  c.beginPath(); c.moveTo(0.05, 0.08); c.lineTo(len - 0.7, 0.06); c.quadraticCurveTo(len - 0.02, 0.48, len - 0.7, 0.9); c.lineTo(0.05, 0.9); c.closePath(); c.fill();
  c.strokeStyle = C.stripe; c.lineWidth = 0.07; c.stroke();
  c.fillStyle = C.cabin; c.beginPath(); c.roundRect(len * 0.22, 0.2, len * 0.42, 0.56, 0.08); c.fill();
  c.strokeStyle = "#c9cdc4"; c.lineWidth = 0.03; c.stroke();
  c.fillStyle = C.window;
  for (let x = len * 0.26; x < len * 0.6; x += 0.32) { c.fillRect(x, 0.27, 0.18, 0.1); c.fillRect(x, 0.6, 0.18, 0.1); }
  c.fillStyle = C.funnel; c.beginPath(); c.arc(len * 0.42, 0.48, 0.12, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#2a2a2a"; c.beginPath(); c.arc(len * 0.42, 0.48, 0.05, 0, Math.PI * 2); c.fill();
  c.restore();
}

/** A ripe mango with a leaf, centred on (0, 0), about a third of a cell. */
export function drawMango(c: Ctx) {
  c.fillStyle = "rgba(0,0,0,0.18)"; c.beginPath(); c.ellipse(0.03, 0.17, 0.16, 0.05, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = C.mango; c.beginPath(); c.ellipse(0, 0, 0.15, 0.19, -0.5, 0, Math.PI * 2); c.fill();
  c.fillStyle = C.mangoBlush; c.beginPath(); c.ellipse(0.05, -0.06, 0.08, 0.11, -0.5, 0, Math.PI * 2); c.fill();
  c.fillStyle = "rgba(255,255,255,0.45)"; c.beginPath(); c.ellipse(-0.06, 0.02, 0.03, 0.06, -0.5, 0, Math.PI * 2); c.fill();
  c.strokeStyle = C.plank; c.lineWidth = 0.03; c.beginPath(); c.moveTo(0.08, -0.15); c.lineTo(0.12, -0.22); c.stroke();
  c.fillStyle = C.leaf; c.beginPath(); c.ellipse(0.2, -0.22, 0.11, 0.045, -0.4, 0, Math.PI * 2); c.fill();
}

/** The kid from behind, feet at (0, 0), about 0.8 of a cell tall: a blue school bag and a red checked গামছা round the neck. */
export function drawKid(c: Ctx) {
  c.fillStyle = "rgba(0,0,0,0.22)"; c.beginPath(); c.ellipse(0, 0, 0.24, 0.08, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = C.skin;
  c.beginPath(); c.roundRect(-0.13, -0.2, 0.09, 0.2, 0.04); c.roundRect(0.04, -0.2, 0.09, 0.2, 0.04); c.fill();
  c.fillStyle = C.shorts; c.beginPath(); c.roundRect(-0.16, -0.32, 0.32, 0.16, 0.05); c.fill();
  c.fillStyle = C.skin;
  c.beginPath(); c.roundRect(-0.27, -0.56, 0.08, 0.24, 0.04); c.roundRect(0.19, -0.56, 0.08, 0.24, 0.04); c.fill();
  c.fillStyle = C.shirt; c.beginPath(); c.roundRect(-0.21, -0.6, 0.42, 0.32, 0.1); c.fill();
  c.fillStyle = C.bag; c.beginPath(); c.roundRect(-0.15, -0.55, 0.3, 0.27, 0.06); c.fill();
  c.fillStyle = C.bagDark; c.beginPath(); c.roundRect(-0.15, -0.55, 0.3, 0.1, [0.06, 0.06, 0.02, 0.02]); c.fill();
  c.fillStyle = "#f2c94c"; c.fillRect(-0.025, -0.47, 0.05, 0.04);
  // গামছা: a checked band at the neck, one end hanging over the shoulder.
  c.fillStyle = C.gamchha; c.beginPath(); c.roundRect(-0.17, -0.66, 0.34, 0.08, 0.04); c.fill();
  c.beginPath(); c.moveTo(0.1, -0.62); c.lineTo(0.22, -0.4); c.lineTo(0.15, -0.38); c.lineTo(0.05, -0.6); c.fill();
  c.strokeStyle = "#ffffff"; c.lineWidth = 0.022;
  c.beginPath(); for (const x of [-0.1, -0.02, 0.06]) { c.moveTo(x, -0.66); c.lineTo(x, -0.58); } c.moveTo(0.12, -0.52); c.lineTo(0.19, -0.5); c.stroke();
  c.fillStyle = C.hair; c.beginPath(); c.arc(0, -0.76, 0.15, 0, Math.PI * 2); c.fill();
  c.fillStyle = C.skin; c.beginPath(); c.ellipse(-0.15, -0.74, 0.03, 0.045, 0, 0, Math.PI * 2); c.ellipse(0.15, -0.74, 0.03, 0.045, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "rgba(255,255,255,0.16)"; c.beginPath(); c.arc(-0.04, -0.82, 0.06, 0, Math.PI * 2); c.fill();
}

/** A tree on the bank: a trunk and a round crown (a mango or jackfruit tree), feet at (0, 0). */
export function drawTree(c: Ctx, size = 1) {
  c.fillStyle = "rgba(0,0,0,0.16)"; c.beginPath(); c.ellipse(0.05 * size, 0, 0.45 * size, 0.14 * size, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#6e4a2c"; c.fillRect(-0.06 * size, -0.45 * size, 0.12 * size, 0.45 * size);
  for (const [x, y, r, color] of [[-0.22, -0.62, 0.3, "#3f7f3a"], [0.22, -0.66, 0.3, "#3f7f3a"], [0, -0.86, 0.34, "#4b9142"], [-0.06, -0.95, 0.16, "#62a852"]] as const) {
    c.fillStyle = color; c.beginPath(); c.arc(x * size, y * size, r * size, 0, Math.PI * 2); c.fill();
  }
}

/** A low bush, feet at (0, 0). */
export function drawBush(c: Ctx) {
  c.fillStyle = "rgba(0,0,0,0.14)"; c.beginPath(); c.ellipse(0, 0, 0.3, 0.09, 0, 0, Math.PI * 2); c.fill();
  for (const [x, y, r, color] of [[-0.14, -0.16, 0.17, "#4b8a43"], [0.14, -0.15, 0.16, "#4b8a43"], [0, -0.24, 0.19, "#5da04f"]] as const) { c.fillStyle = color; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
}

/** A village hut with a tin roof, feet at (0, 0), about 1.4 cells wide. */
export function drawHut(c: Ctx) {
  c.fillStyle = "rgba(0,0,0,0.16)"; c.beginPath(); c.ellipse(0, 0, 0.8, 0.14, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#d9c08e"; c.fillRect(-0.55, -0.55, 1.1, 0.55);
  c.fillStyle = "#6b5a44"; c.fillRect(-0.12, -0.38, 0.24, 0.38);
  c.fillStyle = "#8b9aa3"; c.beginPath(); c.moveTo(-0.72, -0.5); c.lineTo(0, -1.05); c.lineTo(0.72, -0.5); c.closePath(); c.fill();
  c.strokeStyle = "#6d7b84"; c.lineWidth = 0.03; c.beginPath(); for (const x of [-0.4, -0.2, 0, 0.2, 0.4]) { c.moveTo(x * 0.9, -0.55); c.lineTo(x * 0.5, -0.95); } c.stroke();
}

/** A tuft of কাশফুল on a চর, feet at (0, 0). */
export function drawKash(c: Ctx) {
  c.strokeStyle = "#8a9a5a"; c.lineWidth = 0.025;
  c.beginPath();
  for (const lean of [-0.18, -0.06, 0.06, 0.16]) { c.moveTo(0, 0); c.quadraticCurveTo(lean * 0.5, -0.25, lean, -0.45); }
  c.stroke();
  c.fillStyle = "rgba(255,255,255,0.9)";
  for (const lean of [-0.18, -0.06, 0.06, 0.16]) { c.beginPath(); c.ellipse(lean, -0.5, 0.05, 0.11, lean, 0, Math.PI * 2); c.fill(); }
}

/** The ghat's brass bell under a little bamboo arch, feet at (0, 0). `swing` tilts the bell (radians). */
export function drawBell(c: Ctx, swing = 0) {
  c.fillStyle = "rgba(0,0,0,0.16)"; c.beginPath(); c.ellipse(0, 0, 0.32, 0.08, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = C.bamboo; c.lineWidth = 0.07; c.lineCap = "round";
  c.beginPath(); c.moveTo(-0.24, 0); c.lineTo(-0.24, -0.9); c.lineTo(0.24, -0.9); c.lineTo(0.24, 0); c.stroke();
  c.save(); c.translate(0, -0.86); c.rotate(swing);
  c.fillStyle = C.brass; c.beginPath(); c.moveTo(-0.04, 0); c.quadraticCurveTo(-0.14, 0.08, -0.15, 0.28); c.lineTo(0.15, 0.28); c.quadraticCurveTo(0.14, 0.08, 0.04, 0); c.closePath(); c.fill();
  c.fillStyle = C.brassDark; c.fillRect(-0.16, 0.26, 0.32, 0.04);
  c.fillStyle = "rgba(255,255,255,0.4)"; c.fillRect(-0.08, 0.08, 0.03, 0.14);
  c.restore();
  c.lineCap = "butt";
}

/** Brick steps of a ghat going down into the water, `width` cells wide, top at y = 0, three steps over `depth`. */
export function drawSteps(c: Ctx, width: number, depth: number, down = true) {
  for (let i = 0; i < 3; i++) {
    const y = down ? i * depth / 3 : depth - (i + 1) * depth / 3, inset = i * 0.12;
    c.fillStyle = i === 0 ? "#c4644a" : i === 1 ? C.brick : "#9a4532";
    c.fillRect(inset, y, width - inset * 2, depth / 3 + 0.01);
    c.strokeStyle = C.mortar; c.lineWidth = 0.025;
    c.beginPath();
    c.moveTo(inset, y + 0.01); c.lineTo(width - inset, y + 0.01);
    for (let x = inset + 0.25 + (i % 2) * 0.12; x < width - inset; x += 0.42) { c.moveTo(x, y); c.lineTo(x, y + depth / 3); }
    c.stroke();
  }
}

/** A chevron pointing right, in a rounded badge, centred on (0, 0), about one cell wide. The edge pointers use it (mirror it to point left). */
export function drawChevron(c: Ctx, fill: string) {
  c.fillStyle = fill; c.beginPath(); c.roundRect(-0.32, -0.34, 0.64, 0.68, 0.2); c.fill();
  c.strokeStyle = "#ffffff"; c.lineWidth = 0.1; c.lineCap = "round"; c.lineJoin = "round";
  c.beginPath(); c.moveTo(-0.08, -0.17); c.lineTo(0.1, 0); c.lineTo(-0.08, 0.17); c.stroke();
  c.lineCap = "butt";
}

/** The title's picture, in a box `width` × `height` (CSS px): the boy on the ghat steps, a dotted arc to a ভেলা, a নৌকা and a mango beyond, the world's light behind. */
export function drawStartArt(c: Ctx, width: number, height: number, look: LookName) {
  const p = LOOKS[look], unit = Math.min(width / 7.4, height / 3.9), cx = width / 2, base = height - unit * 0.1;
  const glowY = base - unit * 2.5, glow = c.createRadialGradient(cx, glowY, 4, cx, glowY, Math.max(8, Math.min(width / 2, glowY, unit * 3.6) - 1));
  glow.addColorStop(0, p.sky + "cc"); glow.addColorStop(1, p.sky + "00");
  c.fillStyle = glow; c.fillRect(0, 0, width, height);
  // the water, the near bank with its steps
  c.fillStyle = p.water; c.beginPath(); c.roundRect(cx - unit * 3.55, base - unit * 2.5, unit * 7.1, unit * 1.9, unit * 0.35); c.fill();
  c.fillStyle = "rgba(255,255,255,0.1)"; c.fillRect(cx - unit * 3.55, base - unit * 1.6, unit * 7.1, unit * 0.06);
  c.fillStyle = p.grass; c.beginPath(); c.roundRect(cx - unit * 3.55, base - unit * 0.7, unit * 7.1, unit * 0.7, unit * 0.3); c.fill();
  c.save(); c.translate(cx - unit * 1.4, base - unit * 0.74); c.scale(unit, unit); drawSteps(c, 2.8, 0.34, true); c.restore();
  // a ভেলা and a নৌকা on the water
  c.save(); c.translate(cx - unit * 0.2, base - unit * 1.6); c.scale(unit, unit); drawVela(c, 2); c.restore();
  c.save(); c.translate(cx + unit * 1.55, base - unit * 2.25); c.scale(unit, unit); drawNouka(c, 3); c.restore();
  c.save(); c.translate(cx + unit * 2.85, base - unit * 2.0); c.scale(unit, unit); drawMango(c); c.restore();
  // the dotted hop
  c.strokeStyle = "rgba(255,255,255,0.9)"; c.lineWidth = Math.max(2, unit * 0.06); c.setLineDash([unit * 0.05, unit * 0.2]); c.lineCap = "round";
  c.beginPath(); c.moveTo(cx - unit * 0.9, base - unit * 0.95); c.quadraticCurveTo(cx - unit * 0.5, base - unit * 2.3, cx + unit * 0.35, base - unit * 1.35); c.stroke();
  c.setLineDash([]); c.lineCap = "butt";
  c.save(); c.translate(cx - unit * 1.05, base - unit * 0.62); c.scale(unit * 1.5, unit * 1.5); drawKid(c); c.restore();
}

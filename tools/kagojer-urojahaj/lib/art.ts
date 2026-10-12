// Drawing for the scene and the card: an exercise-book paper plane, soft rain clouds, the কালবৈশাখী, রোদ, and four skies.
// Plain shapes drawn fresh. Every painter draws centred on (0, 0) in whatever units the caller has scaled to.
import type { WorldId } from "./levels";

export const PAL = {
  ink: "#1f2a44", accent: "#2f6fb3", accentDeep: "#1d4a7c", paper: "#fbfaf3", paperShade: "#e9e6da", rule: "#9cc4e8", margin: "#e07f7f",
  fold: "#cfc8b4", edge: "#a99f86", sun: "#ffd23f", sunCore: "#fff0a8", sunEdge: "#e3a414", drop: "#4f86cc", dropLight: "#bcd8f5",
};

const SKIES: Record<WorldId | "storm", { top: string; bottom: string; land: string }> = {
  math: { top: "#86a3c0", bottom: "#e2eaf0", land: "#7d93a6" },
  khet: { top: "#8eadb4", bottom: "#e4ede0", land: "#6f8c68" },
  nodi: { top: "#7f9dba", bottom: "#dbe6ef", land: "#5f7a93" },
  chhad: { top: "#959ab4", bottom: "#e6e3e8", land: "#77758c" },
  storm: { top: "#4b566f", bottom: "#a7b1c1", land: "#4f5a6b" },
};

/**
 * The plane from behind and above, nose up, `s` long: two delta wings of ruled exercise-book paper (lines along the fold,
 * a red margin across them) and the folded keel hanging below the middle, like a dart just thrown from a bench.
 */
export function paintPlane(context: CanvasRenderingContext2D, s: number, wet = 0, shadow = false) {
  const nose = -0.55 * s, tipX = 0.5 * s, tipY = 0.32 * s, rootX = 0.05 * s, rootY = 0.26 * s;
  const wing = (side: number) => {
    context.beginPath(); context.moveTo(0, nose); context.lineTo(side * tipX, tipY); context.lineTo(side * rootX, rootY); context.closePath();
  };
  const keel = () => {
    context.beginPath(); context.moveTo(0, nose + 0.05 * s); context.lineTo(-rootX, rootY); context.lineTo(0, 0.5 * s); context.lineTo(rootX, rootY); context.closePath();
  };
  if (shadow) {
    // Its shadow on the clouds below: the plane reads as flying, not lying flat.
    context.save(); context.translate(0.12 * s, 0.2 * s); context.fillStyle = "#1f2a4430";
    wing(-1); context.fill(); wing(1); context.fill(); keel(); context.fill(); context.restore();
  }
  keel();
  context.fillStyle = "#d9d3c1"; context.fill();
  context.strokeStyle = PAL.edge; context.lineWidth = Math.max(0.8, s * 0.022); context.lineJoin = "round"; context.stroke();
  for (const side of [-1, 1]) {
    wing(side);
    context.fillStyle = side < 0 ? PAL.paper : PAL.paperShade; context.fill();
    context.save(); wing(side); context.clip();
    // The page's lines run along the leading edge; the margin crosses them near the tip.
    context.translate(0, nose); context.rotate(Math.atan2(tipY - nose, side * tipX));
    context.strokeStyle = PAL.rule; context.lineWidth = Math.max(0.6, s * 0.02);
    for (let y = 0.07 * s; y < 0.5 * s; y += 0.075 * s) { context.beginPath(); context.moveTo(0, side * y); context.lineTo(1.2 * s, side * y); context.stroke(); }
    context.strokeStyle = PAL.margin;
    context.beginPath(); context.moveTo(0.78 * s, 0); context.lineTo(0.78 * s, side * 0.5 * s); context.stroke();
    context.restore();
    if (wet > 0) { wing(side); context.fillStyle = `rgba(70, 105, 150, ${0.32 * wet})`; context.fill(); }
    wing(side); context.strokeStyle = PAL.edge; context.lineWidth = Math.max(0.8, s * 0.022); context.stroke();
  }
}

const BUMPS = [[-0.3, 0.12, 0.36], [-0.1, -0.16, 0.5], [0.18, -0.08, 0.44], [0.36, 0.14, 0.32], [0, 0.18, 0.4]] as const;

function cloudPath(context: CanvasRenderingContext2D, w: number, h: number) {
  context.beginPath();
  for (const [x, y, r] of BUMPS) { context.moveTo(x * w + r * h, y * h); context.arc(x * w, y * h, r * h, 0, Math.PI * 2); }
  context.moveTo(-0.42 * w, 0.3 * h);
  context.roundRect(-0.42 * w, 0.02 * h, 0.84 * w, 0.34 * h, 0.17 * h);
}

/** A rain cloud `w` by `h`. Dark ones need two hits; after the first, a pale seam shows it's about to burst. */
export function paintCloud(context: CanvasRenderingContext2D, kind: "puff" | "dark" | "spit", w: number, h: number, cracked = false, lit = false) {
  const colors = kind === "dark" ? (cracked ? ["#8c96ac", "#5d6780"] : ["#7a849b", "#465069"]) : kind === "spit" ? ["#dde2ea", "#a9b2c2"] : ["#ffffff", "#ccd4e1"];
  const fill = context.createLinearGradient(0, -0.6 * h, 0, 0.45 * h);
  fill.addColorStop(0, lit ? "#ffffff" : colors[0]); fill.addColorStop(1, lit ? colors[0] : colors[1]);
  // Stroke first, then fill over it: only the outer outline shows, not every bump's circle.
  cloudPath(context, w, h);
  context.strokeStyle = kind === "dark" ? "#3a4359" : "#aab4c5"; context.lineWidth = Math.max(1.6, h * 0.1); context.stroke();
  context.fillStyle = fill; context.fill();
  if (kind === "dark") {
    context.fillStyle = "#ffffff22";
    context.beginPath(); context.ellipse(-0.1 * w, -0.3 * h, 0.22 * w, 0.14 * h, -0.2, 0, Math.PI * 2); context.fill();
  }
  if (cracked) {
    context.strokeStyle = "#e9eef6"; context.lineWidth = Math.max(1, h * 0.07); context.lineCap = "round";
    context.beginPath(); context.moveTo(-0.28 * w, -0.05 * h); context.lineTo(-0.08 * w, 0.12 * h); context.lineTo(0.06 * w, -0.1 * h); context.lineTo(0.26 * w, 0.1 * h); context.stroke();
  }
}

/** The কালবৈশাখী: a wide, heavy cloud with a pale lightning seam, `w` by `h`. No face; it's weather, not a villain. */
export function paintStorm(context: CanvasRenderingContext2D, w: number, h: number, lit = false) {
  const fill = context.createLinearGradient(0, -0.5 * h, 0, 0.5 * h);
  fill.addColorStop(0, lit ? "#6d7896" : "#4a5470"); fill.addColorStop(1, lit ? "#3f4862" : "#232a3f");
  context.beginPath();
  const bumps = [[-0.4, 0.1, 0.36], [-0.22, -0.12, 0.5], [0, -0.2, 0.56], [0.22, -0.1, 0.5], [0.4, 0.08, 0.38], [-0.1, 0.12, 0.4], [0.12, 0.14, 0.4]];
  for (const [x, y, r] of bumps) { context.moveTo(x * w + r * h, y * h); context.arc(x * w, y * h, r * h, 0, Math.PI * 2); }
  context.moveTo(-0.46 * w, 0.4 * h);
  context.roundRect(-0.48 * w, 0.02 * h, 0.96 * w, 0.4 * h, 0.2 * h);
  context.strokeStyle = "#1a2033"; context.lineWidth = Math.max(2, h * 0.06); context.stroke();
  context.fillStyle = fill; context.fill();
  context.fillStyle = "#ffffff1a";
  context.beginPath(); context.ellipse(-0.12 * w, -0.32 * h, 0.2 * w, 0.1 * h, -0.1, 0, Math.PI * 2); context.fill();
  context.strokeStyle = "#f2cf6b"; context.lineWidth = Math.max(1.2, h * 0.045); context.lineJoin = "round"; context.lineCap = "round";
  context.beginPath(); context.moveTo(0.16 * w, -0.05 * h); context.lineTo(0.1 * w, 0.14 * h); context.lineTo(0.17 * w, 0.14 * h); context.lineTo(0.1 * w, 0.36 * h); context.stroke();
}

/** A piece of রোদ: a warm sun disc with short rays, radius r. */
export function paintSun(context: CanvasRenderingContext2D, r: number) {
  context.strokeStyle = PAL.sunEdge; context.lineWidth = Math.max(1, r * 0.22); context.lineCap = "round";
  for (let ray = 0; ray < 8; ray++) {
    const angle = (ray / 8) * Math.PI * 2;
    context.beginPath(); context.moveTo(Math.cos(angle) * r * 0.95, Math.sin(angle) * r * 0.95); context.lineTo(Math.cos(angle) * r * 1.45, Math.sin(angle) * r * 1.45); context.stroke();
  }
  context.fillStyle = PAL.sun; context.beginPath(); context.arc(0, 0, r * 0.8, 0, Math.PI * 2); context.fill();
  context.fillStyle = PAL.sunCore; context.beginPath(); context.arc(-r * 0.2, -r * 0.2, r * 0.38, 0, Math.PI * 2); context.fill();
}

/** A crumpled ball of the same ruled paper, radius r. */
export function paintBall(context: CanvasRenderingContext2D, r: number) {
  context.fillStyle = PAL.paper; context.strokeStyle = PAL.edge; context.lineWidth = Math.max(0.6, r * 0.18);
  context.beginPath(); context.arc(0, 0, r, 0, Math.PI * 2); context.fill(); context.stroke();
  context.strokeStyle = PAL.rule; context.lineWidth = Math.max(0.5, r * 0.14);
  context.beginPath(); context.moveTo(-r * 0.7, -r * 0.2); context.lineTo(r * 0.6, -r * 0.45); context.stroke();
  context.strokeStyle = PAL.fold;
  context.beginPath(); context.moveTo(-r * 0.4, r * 0.5); context.lineTo(0, 0); context.lineTo(r * 0.5, r * 0.35); context.stroke();
}

/** A raindrop, radius r, point up. */
export function paintDrop(context: CanvasRenderingContext2D, r: number) {
  context.fillStyle = PAL.drop;
  context.beginPath(); context.moveTo(0, -r * 2.2); context.quadraticCurveTo(r * 1.1, -r * 0.2, r, r * 0.3); context.arc(0, r * 0.3, r, 0, Math.PI); context.quadraticCurveTo(-r * 1.1, -r * 0.2, 0, -r * 2.2); context.fill();
  context.fillStyle = PAL.dropLight; context.beginPath(); context.arc(-r * 0.35, r * 0.1, r * 0.3, 0, Math.PI * 2); context.fill();
}

/** The still sky for a place: a monsoon gradient and the place itself along the bottom edge. `w`×`h` in pixels. */
export function paintSky(context: CanvasRenderingContext2D, world: WorldId, storm: boolean, w: number, h: number) {
  const sky = SKIES[storm ? "storm" : world], land = storm ? SKIES.storm.land : SKIES[world].land;
  const fill = context.createLinearGradient(0, 0, 0, h);
  fill.addColorStop(0, sky.top); fill.addColorStop(1, sky.bottom);
  context.fillStyle = fill; context.fillRect(0, 0, w, h);
  const base = h * 0.965, u = w / 100;
  // The place sits low and small along the bottom edge, below the plane's line.
  context.save(); context.translate(0, base); context.scale(1, 0.6); context.translate(0, -base);
  context.fillStyle = land; context.globalAlpha = 0.55;
  context.beginPath(); context.moveTo(0, h);
  if (world === "math") {
    // A school block with a tin roof and a goalpost on the field.
    context.lineTo(0, base); context.lineTo(14 * u, base); context.lineTo(14 * u, base - 7 * u); context.lineTo(12 * u, base - 7 * u); context.lineTo(24 * u, base - 12 * u); context.lineTo(52 * u, base - 12 * u);
    context.lineTo(62 * u, base - 7 * u); context.lineTo(60 * u, base - 7 * u); context.lineTo(60 * u, base); context.lineTo(100 * u, base); context.lineTo(100 * u, h);
    context.fill();
    context.fillRect(74 * u, base - 6 * u, 0.8 * u, 6 * u); context.fillRect(88 * u, base - 6 * u, 0.8 * u, 6 * u); context.fillRect(74 * u, base - 6 * u, 14.8 * u, 0.8 * u);
  } else if (world === "khet") {
    // Paddy rows and two palm trees.
    context.lineTo(0, base); for (let x = 0; x <= 100; x += 5) context.quadraticCurveTo((x + 2.5) * u, base - 2 * u, (x + 5) * u, base); context.lineTo(100 * u, h); context.fill();
    for (const x of [22, 78]) {
      context.fillRect((x - 0.5) * u, base - 13 * u, 1 * u, 13 * u);
      for (let leaf = 0; leaf < 6; leaf++) { const a = Math.PI + (leaf / 5) * Math.PI; context.beginPath(); context.ellipse(x * u + Math.cos(a) * 3 * u, base - 13 * u + Math.sin(a) * 1.6 * u, 3.2 * u, 0.9 * u, a, 0, Math.PI * 2); context.fill(); }
    }
  } else if (world === "nodi") {
    // The far bank, the river, and a boat with a little roof.
    context.lineTo(0, base - 3 * u); context.lineTo(100 * u, base - 4 * u); context.lineTo(100 * u, h); context.fill();
    context.globalAlpha = 0.35; context.fillStyle = "#ffffff"; context.fillRect(0, base - 1.5 * u, w, 0.6 * u); context.fillRect(0, base + 1.5 * u, w, 0.5 * u);
    context.globalAlpha = 0.7; context.fillStyle = land;
    context.beginPath(); context.moveTo(30 * u, base - 2 * u); context.quadraticCurveTo(42 * u, base + 2 * u, 54 * u, base - 2 * u); context.lineTo(50 * u, base - 0.5 * u); context.lineTo(34 * u, base - 0.5 * u); context.fill();
    context.beginPath(); context.moveTo(37 * u, base - 2 * u); context.quadraticCurveTo(42 * u, base - 7 * u, 47 * u, base - 2 * u); context.fill();
  } else {
    // Rooftops with water tanks and an antenna.
    context.lineTo(0, base - 6 * u);
    const roofs = [[0, 6], [16, 9], [34, 5], [48, 11], [66, 7], [82, 10], [100, 8]];
    for (let index = 1; index < roofs.length; index++) { context.lineTo(roofs[index][0] * u, base - roofs[index - 1][1] * u); context.lineTo(roofs[index][0] * u, base - roofs[index][1] * u); }
    context.lineTo(100 * u, h); context.fill();
    context.fillRect(22 * u, base - 13 * u, 6 * u, 4 * u); context.fillRect(54 * u, base - 15 * u, 5 * u, 4 * u);
    context.fillRect(88 * u, base - 18 * u, 0.6 * u, 8 * u); context.fillRect(85 * u, base - 17 * u, 6 * u, 0.6 * u); context.fillRect(86 * u, base - 15 * u, 4 * u, 0.6 * u);
  }
  context.restore();
  context.globalAlpha = 1;
}

/** Pale far-off clouds for the slow backdrop (a tile that scrolls and wraps). Fixed shapes, no randomness. */
export function paintFarClouds(context: CanvasRenderingContext2D, w: number, h: number, storm: boolean) {
  const u = w / 100;
  context.fillStyle = storm ? "#c4cbd8" : "#ffffff"; context.globalAlpha = storm ? 0.16 : 0.3;
  const spots = [[18, 12, 16], [72, 30, 20], [34, 58, 14], [84, 76, 18], [10, 92, 12], [56, 104, 15]];
  for (const [x, y, r] of spots) {
    context.beginPath();
    context.ellipse(x * u, y * u, r * u, r * 0.38 * u, 0, 0, Math.PI * 2);
    context.ellipse((x + r * 0.5) * u, (y - r * 0.15) * u, r * 0.6 * u, r * 0.35 * u, 0, 0, Math.PI * 2);
    context.fill();
  }
  if (storm) {
    context.strokeStyle = "#dfe6f2"; context.globalAlpha = 0.14; context.lineWidth = Math.max(1, u * 0.3);
    for (let index = 0; index < 40; index++) { const x = ((index * 37) % 100) * u, y = ((index * 53) % 125) * u; context.beginPath(); context.moveTo(x, y); context.lineTo(x - 1.5 * u, y + 5 * u); context.stroke(); }
  }
  context.globalAlpha = 1;
}

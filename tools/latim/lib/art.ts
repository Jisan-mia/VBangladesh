// Drawing for the scene and the result card: the wooden top, a palm, and the three surfaces. Plain shapes, drawn fresh.
import { makeRng } from "../../../shared/game-core";
import type { SurfaceId } from "./game";

export const PAL = {
  ink: "#2b1d12", accent: "#b5441b", wood: "#d29a5c", woodDark: "#8f5a2b", woodLight: "#f0c58a", nail: "#5f646b",
  red: "#c8352b", green: "#2f8a4c", yellow: "#f2b632", blue: "#2a6fb0", skinDark: "#9c6340",
  good: "#3aa35b", warn: "#e0a21b", bad: "#c8352b",
};
const SPOTS = [PAL.red, PAL.blue, PAL.green, PAL.yellow];

/** The body's outline, tip at (0, 0), height s, upright. */
function bodyPath(context: CanvasRenderingContext2D, s: number) {
  context.beginPath();
  context.moveTo(-0.045 * s, -0.12 * s);
  context.quadraticCurveTo(-0.34 * s, -0.24 * s, -0.36 * s, -0.6 * s);
  context.bezierCurveTo(-0.37 * s, -0.88 * s, 0.37 * s, -0.88 * s, 0.36 * s, -0.6 * s);
  context.quadraticCurveTo(0.34 * s, -0.24 * s, 0.045 * s, -0.12 * s);
  context.closePath();
}

/** The still parts of the top (nail, wood, painted rings, knob). Drawn once into a sprite for the scene; straight onto the card. */
export function paintTop(context: CanvasRenderingContext2D, s: number) {
  context.fillStyle = PAL.nail;
  context.beginPath(); context.moveTo(-0.022 * s, -0.13 * s); context.lineTo(0.022 * s, -0.13 * s); context.lineTo(0.004 * s, 0); context.lineTo(-0.004 * s, 0); context.closePath(); context.fill();
  const shade = context.createLinearGradient(-0.36 * s, 0, 0.36 * s, 0);
  shade.addColorStop(0, PAL.wood); shade.addColorStop(0.3, PAL.woodLight); shade.addColorStop(1, PAL.woodDark);
  bodyPath(context, s);
  context.fillStyle = shade; context.fill();
  context.save();
  bodyPath(context, s); context.clip();
  context.lineWidth = 0.045 * s;
  ([[-0.3, PAL.green], [-0.42, PAL.red], [-0.53, PAL.yellow], [-0.64, PAL.red]] as const).forEach(([y, color]) => {
    context.strokeStyle = color;
    context.beginPath(); context.ellipse(0, y * s, 0.42 * s, 0.07 * s, 0, 0, Math.PI); context.stroke();
  });
  // the crown's top face, lit from the left
  context.fillStyle = "#f6d7a8";
  context.beginPath(); context.ellipse(-0.04 * s, -0.75 * s, 0.2 * s, 0.05 * s, 0, 0, Math.PI * 2); context.fill();
  context.restore();
  context.strokeStyle = PAL.woodDark; context.lineWidth = Math.max(1, 0.012 * s);
  bodyPath(context, s); context.stroke();
  context.fillStyle = PAL.woodDark;
  context.beginPath(); context.ellipse(0, -0.83 * s, 0.07 * s, 0.035 * s, 0, 0, Math.PI * 2); context.fill();
  context.fillRect(-0.05 * s, -0.92 * s, 0.1 * s, 0.09 * s);
  context.fillStyle = PAL.wood;
  context.beginPath(); context.ellipse(0, -0.92 * s, 0.05 * s, 0.022 * s, 0, 0, Math.PI * 2); context.fill();
}

/** The painted dots that show the turn. Fast spin smears them into a faint ring; slow spin shows each dot go round. */
export function paintSpots(context: CanvasRenderingContext2D, s: number, turn: number, speed: number) {
  const y = -0.47 * s, half = 0.31 * s, blur = Math.max(0, Math.min(1, (speed - 0.35) / 0.5));
  if (blur > 0) {
    context.globalAlpha = 0.45 * blur; context.strokeStyle = PAL.blue; context.lineWidth = 0.05 * s;
    context.beginPath(); context.ellipse(0, y, half, 0.06 * s, 0, 0, Math.PI); context.stroke();
  }
  context.globalAlpha = 1 - 0.75 * blur;
  for (let index = 0; index < 4; index++) {
    const angle = turn + index * Math.PI / 2, depth = Math.cos(angle);
    if (depth < 0.1) continue;
    context.fillStyle = SPOTS[index];
    context.beginPath(); context.ellipse(Math.sin(angle) * half * 0.92, y + depth * 0.035 * s, 0.055 * s * depth, 0.06 * s, 0, 0, Math.PI * 2); context.fill();
  }
  context.globalAlpha = 1;
}

/** A sprite of the still top: tip at (size*0.5, size*1.0) in a size×size*1.05 canvas. */
export function topSprite(size: number, ratio: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(size * 0.8 * ratio); canvas.height = Math.ceil(size * 1.0 * ratio);
  const context = canvas.getContext("2d");
  if (context) { context.scale(ratio, ratio); context.translate(size * 0.4, size * 0.98); paintTop(context, size); }
  return canvas;
}

const SKIN = "#e3a97c";
/** One outlined, round-ended stroke: an arm, a finger. */
function limb(context: CanvasRenderingContext2D, s: number, x1: number, y1: number, x2: number, y2: number, width: number, color: string) {
  context.lineCap = "round";
  context.strokeStyle = PAL.skinDark; context.lineWidth = width + Math.max(2, 0.03 * s);
  context.beginPath(); context.moveTo(x1, y1); context.lineTo(x2, y2); context.stroke();
  context.strokeStyle = color; context.lineWidth = width;
  context.beginPath(); context.moveTo(x1, y1); context.lineTo(x2, y2); context.stroke();
}

/** An open palm held flat, the arm in a blue sleeve coming up from the bottom left. (x, y) is where the top sits. */
export function paintPalm(context: CanvasRenderingContext2D, x: number, y: number, s: number) {
  limb(context, s, x - 0.2 * s, y + 0.14 * s, x - 0.75 * s, y + 1.4 * s, 0.28 * s, SKIN);
  limb(context, s, x - 0.62 * s, y + 1.05 * s, x - 1.1 * s, y + 2.2 * s, 0.4 * s, PAL.blue);
  for (let index = 0; index < 4; index++) limb(context, s, x + 0.2 * s, y + 0.02 * s + index * 0.055 * s, x + 0.62 * s - index * 0.05 * s, y - 0.06 * s + index * 0.07 * s, 0.085 * s, SKIN);
  limb(context, s, x - 0.28 * s, y + 0.06 * s, x - 0.44 * s, y - 0.1 * s, 0.1 * s, SKIN);
  context.fillStyle = SKIN; context.strokeStyle = PAL.skinDark; context.lineWidth = Math.max(2, 0.03 * s);
  context.beginPath(); context.ellipse(x, y + 0.08 * s, 0.36 * s, 0.13 * s, 0, 0, Math.PI * 2); context.fill(); context.stroke();
  context.beginPath(); context.ellipse(x, y + 0.06 * s, 0.22 * s, 0.05 * s, 0, 0.3, Math.PI - 0.3); context.stroke();
}

/** The string, wound round a top that hangs ready to throw. */
export function paintString(context: CanvasRenderingContext2D, s: number) {
  context.strokeStyle = "#f4ead2"; context.lineWidth = Math.max(1.2, 0.018 * s);
  for (let index = 0; index < 6; index++) {
    const y = -0.18 * s - index * 0.07 * s, half = 0.1 * s + index * 0.045 * s;
    context.beginPath(); context.ellipse(0, y, half, 0.03 * s, -0.12, 0, Math.PI); context.stroke();
  }
  context.beginPath(); context.moveTo(0, -0.92 * s); context.quadraticCurveTo(0.1 * s, -1.25 * s, 0.02 * s, -1.6 * s); context.stroke();
}

/**
 * The ground for a stage: the far edge (a mud wall, a lime-washed wall, or sky over the roof), the floor, and the stage's
 * obstacle drawn in (leaves, pebbles, wet patches, cracks). (cx, cy) is where the top spins.
 */
export function paintGround(context: CanvasRenderingContext2D, surface: SurfaceId, level: number, width: number, height: number, horizon: number, cx: number, cy: number) {
  const rng = makeRng(17 + level), u = Math.min(width, height) / 100;
  if (surface === "mati") {
    context.fillStyle = "#8a5a36"; context.fillRect(0, 0, width, horizon);
    context.fillStyle = "#6f4527"; context.fillRect(0, horizon - 3 * u, width, 3 * u);
    context.fillStyle = "#5b3920"; context.fillRect(width * 0.62, horizon * 0.25, width * 0.16, horizon * 0.75);
    context.fillStyle = "#c9895a"; context.fillRect(0, horizon, width, height - horizon);
    context.strokeStyle = "#b67447"; context.lineWidth = Math.max(1, 0.5 * u);
    for (let index = 0; index < 34; index++) {
      const x = rng() * width, y = horizon + rng() * (height - horizon), r = (8 + rng() * 22) * u;
      context.beginPath(); context.arc(x, y + r, r, -Math.PI * 0.8, -Math.PI * 0.35); context.stroke();
    }
  } else if (surface === "mejhe") {
    context.fillStyle = "#b9d3cb"; context.fillRect(0, 0, width, horizon);
    context.fillStyle = "#7d4a3a"; context.fillRect(0, horizon - 3 * u, width, 3 * u);
    const floor = context.createLinearGradient(0, horizon, 0, height);
    floor.addColorStop(0, "#9b3427"); floor.addColorStop(1, "#b5483a");
    context.fillStyle = floor; context.fillRect(0, horizon, width, height - horizon);
    context.strokeStyle = "#8a2c20"; context.lineWidth = Math.max(1, 0.35 * u);
    for (let row = 1; row < 7; row++) { const y = horizon + (height - horizon) * (row / 7) ** 1.4; context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); }
    for (let col = -4; col <= 4; col++) { context.beginPath(); context.moveTo(cx + col * 9 * u, horizon); context.lineTo(cx + col * 34 * u, height); context.stroke(); }
    context.fillStyle = "#ffffff1f";
    context.beginPath(); context.ellipse(width * 0.3, horizon + (height - horizon) * 0.3, 22 * u, 5 * u, -0.1, 0, Math.PI * 2); context.fill();
  } else {
    const sky = context.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, "#8cc6e8"); sky.addColorStop(1, "#d6eef7");
    context.fillStyle = sky; context.fillRect(0, 0, width, horizon);
    context.fillStyle = "#3f7a3a";
    for (let index = 0; index < 6; index++) { context.beginPath(); context.ellipse(width * 0.36 + index * 5 * u, horizon * 0.3 + (index % 2) * 4 * u, 6 * u, 3 * u, 0.5, 0, Math.PI * 2); context.fill(); }
    context.fillStyle = "#8f9aa5"; context.fillRect(0, horizon, width, height - horizon);
    for (let col = -14; col <= 14; col++) {
      context.fillStyle = col % 2 ? "#a7b2bc" : "#77828d";
      context.beginPath();
      context.moveTo(cx + col * 4 * u, horizon); context.lineTo(cx + (col + 1) * 4 * u, horizon);
      context.lineTo(cx + (col + 1) * 15 * u, height); context.lineTo(cx + col * 15 * u, height); context.closePath(); context.fill();
    }
    context.fillStyle = "#a0562c38";
    for (let index = 0; index < 5; index++) { context.beginPath(); context.ellipse(rng() * width, horizon + rng() * (height - horizon), (3 + rng() * 5) * u, (1 + rng() * 2) * u, 0, 0, Math.PI * 2); context.fill(); }
  }
  // The ring the top spins in, chalked on the ground.
  context.strokeStyle = surface === "tin" ? "#ffffff70" : "#ffffffa0"; context.lineWidth = Math.max(1.5, 0.6 * u);
  context.setLineDash([3 * u, 2.5 * u]);
  context.beginPath(); context.ellipse(cx, cy, 30 * u, 9 * u, 0, 0, Math.PI * 2); context.stroke();
  context.setLineDash([]);
  // This stage's new obstacle, so the player sees what's coming.
  const scatter = (count: number, draw: (x: number, y: number) => void) => {
    for (let index = 0; index < count; index++) {
      const angle = rng() * Math.PI * 2, reach = 0.35 + rng() * 0.75;
      draw(cx + Math.cos(angle) * 38 * u * reach, cy + Math.sin(angle) * 14 * u * reach + 2 * u);
    }
  };
  if (level === 2 || level === 9) scatter(8, (x, y) => { context.fillStyle = rng() > 0.5 ? "#b8802f" : "#8d6a2a"; context.beginPath(); context.ellipse(x, y, 3.2 * u, 1.4 * u, rng() * 3, 0, Math.PI * 2); context.fill(); });
  if (level === 3) scatter(10, (x, y) => { context.fillStyle = rng() > 0.5 ? "#9b9184" : "#7c7266"; context.beginPath(); context.ellipse(x, y, 1.6 * u, 1.1 * u, 0, 0, Math.PI * 2); context.fill(); });
  if (level === 5) { context.fillStyle = "#ffffff26"; scatter(5, (x, y) => { context.beginPath(); context.ellipse(x, y, 12 * u, 3 * u, 0, 0, Math.PI * 2); context.fill(); }); }
  if (level === 6) {
    context.strokeStyle = "#5e1c14"; context.lineWidth = Math.max(1, 0.45 * u);
    scatter(3, (x, y) => { context.beginPath(); context.moveTo(x - 10 * u, y); for (let k = 1; k <= 5; k++) context.lineTo(x - 10 * u + k * 4 * u, y + (k % 2 ? 1.6 : -1.2) * u); context.stroke(); });
  }
}

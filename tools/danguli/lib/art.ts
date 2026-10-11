// Cartoon pieces drawn with plain paths, shared by the play canvas and the share card. `k` is pixels per ডাং; nothing here allocates per call.
export const PAL = {
  skyTop: "#8fcbe6", skyLow: "#e3f3f8", far: "#3f6b3a", farDark: "#2f5530", hut: "#a5643a", roof: "#7d8a94",
  grass: "#6aa645", grassLight: "#71ad4b", grassDark: "#4f8a36", mud: "#8a6440", water: "#3d8fb8", waterLight: "#7cc0de",
  stick: "#a8692f", stickDark: "#6b4520", ball: "#d39a4c", ink: "#26301e", skin: "#b9774e", hair: "#1e1a17", band: "#ffd166",
  cow: "#f4efe6", patch: "#8b5a2b", accent: "#b4372a",
} as const;

export type Look = { shirt: string; shorts: string };
export const LOOKS: Look[] = [
  { shirt: "#2f6fb0", shorts: "#26324a" }, { shirt: "#e0a419", shorts: "#5a3d22" }, { shirt: "#d0533a", shorts: "#2b3a52" },
  { shirt: "#7a4fa3", shorts: "#3a3a3a" }, { shirt: "#f1f1ea", shorts: "#3b5d8a" },
];
export const BATTER: Look = { shirt: "#b4372a", shorts: "#26324a" };

const LEGS = [-0.55, -0.35, 0.35, 0.55];

export type Pose = "idle" | "watch" | "cheer" | "groan" | "ready" | "run" | "catch";

function limb(context: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  context.beginPath(); context.moveTo(x1, y1); context.lineTo(x2, y2); context.stroke();
}

function head(context: CanvasRenderingContext2D, x: number, y: number, k: number, facing: number, mouth: "smile" | "o" | "frown") {
  const r = 0.27 * k;
  context.fillStyle = PAL.skin;
  context.beginPath(); context.arc(x, y, r, 0, Math.PI * 2); context.fill();
  context.fillStyle = PAL.hair;
  context.beginPath(); context.arc(x, y - r * 0.15, r * 1.02, Math.PI * 1.05, Math.PI * 1.95); context.fill();
  if (k < 14) return;
  context.beginPath(); context.arc(x + facing * r * 0.38, y - r * 0.05, Math.max(1, r * 0.11), 0, Math.PI * 2); context.fill();
  context.strokeStyle = PAL.hair; context.lineWidth = Math.max(1, r * 0.12);
  context.beginPath();
  const mx = x + facing * r * 0.35, my = y + r * 0.42;
  if (mouth === "o") context.arc(mx, my, r * 0.16, 0, Math.PI * 2);
  else if (mouth === "smile") context.arc(mx, my - r * 0.14, r * 0.24, 0.2 * Math.PI, 0.8 * Math.PI);
  else context.arc(mx, my + r * 0.18, r * 0.22, 1.2 * Math.PI, 1.8 * Math.PI);
  context.stroke();
}

/** A child about 1.9 ডাং tall standing at (x, feetY). `t` drives the little bounce of a cheer or a run. */
export function drawKid(context: CanvasRenderingContext2D, x: number, feetY: number, k: number, look: Look, pose: Pose, t: number, facing = 1) {
  const lift = pose === "cheer" ? Math.abs(Math.sin(t * 9)) * 0.22 * k : pose === "run" ? Math.abs(Math.sin(t * 14)) * 0.08 * k : 0;
  const slump = pose === "groan" ? 0.08 * k : 0;
  const feet = feetY - lift, hip = feet - 0.72 * k + slump, shoulder = feet - 1.32 * k + slump;
  context.lineCap = "round";
  context.strokeStyle = PAL.skin; context.lineWidth = 0.13 * k;
  const stride = pose === "run" ? Math.sin(t * 14) * 0.22 * k : pose === "ready" ? 0.16 * k : 0.08 * k;
  limb(context, x, hip, x - stride, feet); limb(context, x, hip, x + stride, feet);
  context.fillStyle = look.shorts;
  context.fillRect(x - 0.17 * k, hip - 0.06 * k, 0.34 * k, 0.24 * k);
  context.fillStyle = look.shirt;
  context.beginPath(); context.roundRect(x - 0.2 * k, shoulder - 0.04 * k, 0.4 * k, hip - shoulder + 0.06 * k, 0.1 * k); context.fill();
  context.strokeStyle = PAL.skin; context.lineWidth = 0.11 * k;
  const sx = 0.16 * k, top = shoulder + 0.06 * k, headY = shoulder - 0.3 * k;
  if (pose === "catch") { limb(context, x - sx, top, x + facing * 0.42 * k, top + 0.25 * k); limb(context, x + sx, top, x + facing * 0.42 * k, top + 0.2 * k); }
  else if (pose === "cheer") { limb(context, x - sx, top, x - 0.42 * k, top - 0.5 * k); limb(context, x + sx, top, x + 0.42 * k, top - 0.5 * k); }
  else if (pose === "groan") { limb(context, x - sx, top, x - 0.36 * k, headY - 0.05 * k); limb(context, x - 0.36 * k, headY - 0.05 * k, x - 0.1 * k, headY - 0.26 * k); limb(context, x + sx, top, x + 0.36 * k, headY - 0.05 * k); limb(context, x + 0.36 * k, headY - 0.05 * k, x + 0.1 * k, headY - 0.26 * k); }
  else if (pose === "watch") { limb(context, x - sx, top, x - 0.22 * k, top + 0.45 * k); limb(context, x + sx, top, x + facing * 0.55 * k, top - 0.28 * k); }
  else if (pose === "ready") { limb(context, x - sx, top, x + facing * 0.2 * k, hip - 0.05 * k); limb(context, x + sx, top, x + facing * 0.32 * k, hip - 0.1 * k); }
  else if (pose === "run") { const swing = Math.sin(t * 14) * 0.3 * k; limb(context, x - sx, top, x - swing, top + 0.42 * k); limb(context, x + sx, top, x + swing, top + 0.42 * k); }
  else { limb(context, x - sx, top, x - 0.24 * k, top + 0.5 * k); limb(context, x + sx, top, x + 0.24 * k, top + 0.5 * k); }
  head(context, x, headY, k, facing, pose === "cheer" || pose === "catch" ? "smile" : pose === "groan" ? "frown" : pose === "watch" || pose === "run" ? "o" : "smile");
}

/** The batter, facing right, holding the ডাং (exactly 1 ডাং long) at `angle` radians (0 points forward, positive turns down). Returns nothing; hands sit at waist height. */
export function drawBatter(context: CanvasRenderingContext2D, x: number, feetY: number, k: number, angle: number) {
  const hip = feetY - 0.72 * k, shoulder = feetY - 1.32 * k;
  const hx = x + 0.22 * k, hy = feetY - 1.02 * k;
  context.lineCap = "round";
  context.strokeStyle = PAL.skin; context.lineWidth = 0.13 * k;
  limb(context, x, hip, x - 0.2 * k, feetY); limb(context, x, hip, x + 0.2 * k, feetY);
  context.fillStyle = BATTER.shorts; context.fillRect(x - 0.17 * k, hip - 0.06 * k, 0.34 * k, 0.24 * k);
  context.fillStyle = BATTER.shirt;
  context.beginPath(); context.roundRect(x - 0.2 * k, shoulder - 0.04 * k, 0.4 * k, hip - shoulder + 0.06 * k, 0.1 * k); context.fill();
  // The ডাং: a darker grip in the hands, a lighter shaft.
  const tx = hx + Math.cos(angle) * k, ty = hy + Math.sin(angle) * k;
  context.strokeStyle = PAL.stick; context.lineWidth = 0.09 * k;
  limb(context, hx - Math.cos(angle) * 0.12 * k, hy - Math.sin(angle) * 0.12 * k, tx, ty);
  context.strokeStyle = PAL.stickDark; context.lineWidth = 0.1 * k;
  limb(context, hx - Math.cos(angle) * 0.12 * k, hy - Math.sin(angle) * 0.12 * k, hx + Math.cos(angle) * 0.12 * k, hy + Math.sin(angle) * 0.12 * k);
  context.strokeStyle = PAL.skin; context.lineWidth = 0.11 * k;
  limb(context, x - 0.12 * k, shoulder + 0.08 * k, hx, hy); limb(context, x + 0.14 * k, shoulder + 0.08 * k, hx, hy);
  head(context, x, shoulder - 0.3 * k, k, 1, "smile");
}

/** The small stick, a spindle pointed at both ends, centred on (x, y). */
export function drawBall(context: CanvasRenderingContext2D, x: number, y: number, k: number, angle: number) {
  const half = Math.max(8, 0.24 * k), thick = Math.max(2.4, 0.055 * k), tip = half * 0.35;
  const c = Math.cos(angle), s = Math.sin(angle);
  context.fillStyle = PAL.ball; context.strokeStyle = PAL.stickDark; context.lineWidth = Math.max(1, k * 0.02);
  context.beginPath();
  context.moveTo(x - c * half, y - s * half);
  context.lineTo(x - c * (half - tip) + s * thick, y - s * (half - tip) - c * thick);
  context.lineTo(x + c * (half - tip) + s * thick, y + s * (half - tip) - c * thick);
  context.lineTo(x + c * half, y + s * half);
  context.lineTo(x + c * (half - tip) - s * thick, y + s * (half - tip) + c * thick);
  context.lineTo(x - c * (half - tip) - s * thick, y - s * (half - tip) + c * thick);
  context.closePath(); context.fill(); context.stroke();
}

/** A grazing cow facing the batter; `alert` lifts her head. */
export function drawCow(context: CanvasRenderingContext2D, x: number, groundY: number, k: number, alert: boolean, t: number) {
  const top = groundY - 1.25 * k, bodyH = 0.62 * k, bodyW = 1.5 * k;
  context.strokeStyle = PAL.ink; context.lineWidth = 0.1 * k; context.lineCap = "round";
  for (const leg of LEGS) limb(context, x + leg * k, top + bodyH * 0.8, x + leg * k, groundY);
  // Tail swishes slowly.
  const swish = Math.sin(t * 2.2) * 0.18 * k;
  context.lineWidth = 0.05 * k;
  limb(context, x + bodyW / 2, top + 0.12 * k, x + bodyW / 2 + 0.18 * k + swish, top + 0.62 * k);
  context.fillStyle = PAL.cow;
  context.beginPath(); context.roundRect(x - bodyW / 2, top, bodyW, bodyH, 0.26 * k); context.fill();
  context.fillStyle = PAL.patch;
  context.beginPath(); context.ellipse(x + 0.25 * k, top + 0.22 * k, 0.26 * k, 0.17 * k, 0.3, 0, Math.PI * 2); context.fill();
  context.beginPath(); context.ellipse(x - 0.42 * k, top + 0.4 * k, 0.16 * k, 0.12 * k, -0.2, 0, Math.PI * 2); context.fill();
  const hx = x - bodyW / 2 - 0.12 * k, hy = alert ? top - 0.12 * k : groundY - 0.3 * k;
  context.strokeStyle = PAL.cow; context.lineWidth = 0.28 * k;
  limb(context, x - bodyW / 2 + 0.2 * k, top + 0.2 * k, hx + 0.1 * k, hy);
  context.fillStyle = PAL.cow;
  context.beginPath(); context.ellipse(hx, hy, 0.24 * k, 0.17 * k, alert ? 0 : 0.5, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#e7a7a0";
  context.beginPath(); context.ellipse(hx - 0.18 * k, hy + 0.04 * k, 0.1 * k, 0.09 * k, 0, 0, Math.PI * 2); context.fill();
  context.strokeStyle = "#d9c9a8"; context.lineWidth = 0.05 * k;
  limb(context, hx + 0.02 * k, hy - 0.14 * k, hx - 0.06 * k, hy - 0.3 * k); limb(context, hx + 0.14 * k, hy - 0.13 * k, hx + 0.2 * k, hy - 0.3 * k);
  context.fillStyle = PAL.ink;
  context.beginPath(); context.arc(hx - 0.04 * k, hy - 0.04 * k, Math.max(1, 0.035 * k), 0, Math.PI * 2); context.fill();
}

/** A village pond seen from the side, between world x0 and x1 (in pixels). */
export function drawPond(context: CanvasRenderingContext2D, x0: number, x1: number, groundY: number, k: number) {
  const cx = (x0 + x1) / 2, rx = (x1 - x0) / 2;
  context.fillStyle = PAL.mud;
  context.beginPath(); context.ellipse(cx, groundY + 0.1 * k, rx + 0.12 * k, 0.34 * k, 0, 0, Math.PI * 2); context.fill();
  context.fillStyle = PAL.water;
  context.beginPath(); context.ellipse(cx, groundY + 0.1 * k, rx, 0.26 * k, 0, 0, Math.PI * 2); context.fill();
  context.fillStyle = PAL.waterLight;
  context.beginPath(); context.ellipse(cx - rx * 0.2, groundY + 0.04 * k, rx * 0.45, 0.07 * k, 0, 0, Math.PI * 2); context.fill();
  context.strokeStyle = PAL.grassDark; context.lineWidth = Math.max(1, 0.04 * k); context.lineCap = "round";
  const reed = 0.45 * k;
  limb(context, x0 - 0.05 * k, groundY, x0 - 0.13 * k, groundY - reed); limb(context, x0 + 0.12 * k, groundY, x0 + 0.17 * k, groundY - reed);
  limb(context, x1 - 0.1 * k, groundY, x1 - 0.03 * k, groundY - reed); limb(context, x1 + 0.06 * k, groundY, x1 + 0.01 * k, groundY - reed);
}

/** The checked গামছা tied to a bamboo pole: it streams with the wind, longer when it blows harder. */
export function drawGamchha(context: CanvasRenderingContext2D, x: number, y: number, wind: number, t: number) {
  context.strokeStyle = "#c9a35a"; context.lineWidth = 3; context.lineCap = "round";
  limb(context, x, y, x, y + 44);
  const strength = Math.min(1, Math.abs(wind) / 3.5), dir = wind >= 0 ? 1 : -1;
  const length = 10 + 26 * strength, droop = 16 * (1 - strength);
  const wave = Math.sin(t * (3 + 5 * strength)) * (2 + 3 * strength);
  context.fillStyle = "#e8743b";
  context.beginPath();
  context.moveTo(x, y + 2);
  context.quadraticCurveTo(x + dir * length * 0.5, y + 2 + wave, x + dir * length, y + 2 + droop);
  context.lineTo(x + dir * length, y + 12 + droop);
  context.quadraticCurveTo(x + dir * length * 0.5, y + 12 - wave, x, y + 12);
  context.closePath(); context.fill();
  context.strokeStyle = "#fff4e0"; context.lineWidth = 1.5;
  context.beginPath(); context.moveTo(x, y + 7); context.quadraticCurveTo(x + dir * length * 0.5, y + 7 + wave * 0.2, x + dir * length, y + 7 + droop); context.stroke();
}

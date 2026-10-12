// Drawing for the school field: the background (pre-rendered once), the bamboo goal and its net, the keeper,
// the kicker seen from behind, the ball and the aim marks. All in board units (360×340); callers scale.
import { GH, GTOP, GW, GX, GY, H, SPOT_X, SPOT_Y, W } from "./aim";

export const SKIN = "#a8714a";
const HAIR = "#1b1410", BAMBOO = "#d8b46a", NODE = "#9c7a3c", CHALK = "#f4f1e6";

/** Sky, school building, trees, a row of kids by the wall, the grass and the chalk. No goal: that sits over the keeper. */
export function drawField(c: CanvasRenderingContext2D) {
  const sky = c.createLinearGradient(0, 0, 0, 70);
  sky.addColorStop(0, "#f6d9a8"); sky.addColorStop(1, "#fbeccb");
  c.fillStyle = sky; c.fillRect(0, 0, W, 72);

  // Round canopies and two coconut palms behind the school.
  c.fillStyle = "#4f7d3a";
  for (const [x, y, r] of [[18, 40, 26], [52, 30, 22], [318, 34, 26], [350, 46, 20], [250, 26, 18]] as const) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
  c.strokeStyle = "#7a5a34"; c.lineWidth = 3;
  for (const x of [98, 284]) {
    c.beginPath(); c.moveTo(x, 64); c.quadraticCurveTo(x + 4, 30, x + 2, 12); c.stroke();
    c.fillStyle = "#3f6e30";
    for (let k = 0; k < 5; k++) { c.beginPath(); c.ellipse(x + 2 + Math.cos(k * 1.26) * 10, 12 + Math.sin(k * 1.26) * 4, 12, 3.5, k * 1.26, 0, Math.PI * 2); c.fill(); }
  }

  // The one-storey school: lime-washed walls, green doors and windows, a tin roof edge.
  c.fillStyle = "#efe0b4"; c.fillRect(60, 40, 240, 36);
  c.fillStyle = "#b9704a"; c.fillRect(56, 35, 248, 6);
  c.fillStyle = "#3d7a5a";
  for (let x = 72; x < 296; x += 28) c.fillRect(x, 50, 12, x % 56 === 16 ? 26 : 14);
  // Boundary wall with a row of kids sitting on it.
  c.fillStyle = "#d7c7a4"; c.fillRect(0, 74, W, 14);
  c.fillStyle = "#c2b08a"; c.fillRect(0, 86, W, 3);
  const shirts = ["#e05d4a", "#3b7dd8", "#f2c14e", "#ffffff", "#7b5ea7", "#2fa36b", "#ef8a3c"];
  for (let i = 0, x = 8; x < W; i++, x += 13 + (i * 7) % 9) {
    if (x > 50 && x < 310 && i % 3 !== 0) continue;
    c.fillStyle = shirts[i % shirts.length]; c.fillRect(x - 4, 66, 8, 9);
    c.fillStyle = i % 2 ? SKIN : "#8d5a3b"; c.beginPath(); c.arc(x, 62, 3.6, 0, Math.PI * 2); c.fill();
    c.fillStyle = HAIR; c.beginPath(); c.arc(x, 60.5, 3.4, Math.PI, 0); c.fill();
  }

  // Grass in soft perspective stripes, worn to dust in the goal mouth and round the spot.
  c.fillStyle = "#7fae4e"; c.fillRect(0, 89, W, H - 89);
  c.fillStyle = "#88b756";
  for (let k = 0; k < 6; k++) {
    const y0 = 89 + Math.pow(k / 6, 1.6) * (H - 89), y1 = 89 + Math.pow((k + 0.5) / 6, 1.6) * (H - 89);
    c.fillRect(0, y0, W, y1 - y0);
  }
  c.fillStyle = "#c7a46a";
  c.globalAlpha = 0.55;
  c.beginPath(); c.ellipse(GX, GY + 6, 70, 12, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(SPOT_X, SPOT_Y + 4, 34, 11, 0, 0, Math.PI * 2); c.fill();
  c.globalAlpha = 1;

  // Chalk: goal line, the small box in perspective, the spot.
  c.strokeStyle = CHALK; c.lineWidth = 2; c.globalAlpha = 0.85;
  c.beginPath(); c.moveTo(0, GY); c.lineTo(W, GY); c.stroke();
  c.beginPath(); c.moveTo(GX - GW - 30, GY); c.lineTo(GX - GW - 44, GY + 34); c.lineTo(GX + GW + 44, GY + 34); c.lineTo(GX + GW + 30, GY); c.stroke();
  c.lineWidth = 2.5;
  c.beginPath(); c.moveTo(-20, GY + 116); c.lineTo(W + 20, GY + 116); c.stroke();
  c.globalAlpha = 1;
  c.fillStyle = CHALK; c.beginPath(); c.ellipse(SPOT_X, SPOT_Y + 8, 5, 2.4, 0, 0, Math.PI * 2); c.fill();
}

const BACK = { left: GX - GW + 14, right: GX + GW - 14, top: GTOP - 12, bottom: GY - 14 };

/** The net behind the posts: a loose fishing-net mesh. Static, so it goes in the pre-rendered background. */
export function drawNet(c: CanvasRenderingContext2D) {
  c.strokeStyle = "#ffffff"; c.lineWidth = 0.8; c.globalAlpha = 0.55;
  c.beginPath();
  // Back panel mesh, diagonal both ways.
  for (let k = -12; k <= 26; k++) {
    const x0 = BACK.left + k * 12;
    c.moveTo(x0, BACK.top); c.lineTo(x0 + (BACK.bottom - BACK.top), BACK.bottom);
    c.moveTo(x0, BACK.bottom); c.lineTo(x0 + (BACK.bottom - BACK.top), BACK.top);
  }
  c.save(); c.clip(new Path2D(`M${BACK.left} ${BACK.top} H${BACK.right} V${BACK.bottom} H${BACK.left} Z`));
  c.stroke(); c.restore();
  // Side and roof panels joining the frame to the back.
  c.beginPath();
  for (let k = 0; k <= 6; k++) {
    const t = k / 6;
    c.moveTo(GX - GW, GTOP + t * GH); c.lineTo(BACK.left, BACK.top + t * (BACK.bottom - BACK.top));
    c.moveTo(GX + GW, GTOP + t * GH); c.lineTo(BACK.right, BACK.top + t * (BACK.bottom - BACK.top));
  }
  for (let k = 0; k <= 16; k++) { const x = GX - GW + (k / 16) * GW * 2; c.moveTo(x, GTOP); c.lineTo(BACK.left + (k / 16) * (BACK.right - BACK.left), BACK.top); }
  c.moveTo(BACK.left, BACK.top); c.lineTo(BACK.right, BACK.top); c.lineTo(BACK.right, BACK.bottom); c.lineTo(BACK.left, BACK.bottom); c.closePath();
  c.stroke();
  c.globalAlpha = 1;
}

/** A ripple in the net where the ball went in; `life` runs 1 → 0. */
export function drawRipple(c: CanvasRenderingContext2D, x: number, y: number, life: number) {
  c.strokeStyle = "#ffffff"; c.globalAlpha = 0.75 * life; c.lineWidth = 1.3;
  c.beginPath(); c.ellipse(x, y, 10 + (1 - life) * 16, 6 + (1 - life) * 9, 0, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.ellipse(x, y, 4 + (1 - life) * 9, 2.5 + (1 - life) * 5, 0, 0, Math.PI * 2); c.stroke();
  c.globalAlpha = 1;
}

function bambooPole(c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  c.lineCap = "round";
  c.strokeStyle = NODE; c.lineWidth = 7; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
  c.strokeStyle = BAMBOO; c.lineWidth = 5; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
  c.strokeStyle = "#f0d79a"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x0 - 1, y0 - 1); c.lineTo(x1 - 1, y1 - 1); c.stroke();
  // Nodes every ~20 units.
  const length = Math.hypot(x1 - x0, y1 - y0), steps = Math.floor(length / 20), nx = (y1 - y0) / length, ny = -(x1 - x0) / length;
  c.strokeStyle = NODE; c.lineWidth = 1.6;
  c.beginPath();
  for (let k = 1; k <= steps; k++) {
    const t = k / (steps + 1), x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
    c.moveTo(x - nx * 3.2, y - ny * 3.2); c.lineTo(x + nx * 3.2, y + ny * 3.2);
  }
  c.stroke();
}

/** The bamboo frame: two posts and the crossbar lashed at the corners with rope. */
export function drawGoalFrame(c: CanvasRenderingContext2D) {
  bambooPole(c, GX - GW, GY + 2, GX - GW, GTOP - 3);
  bambooPole(c, GX + GW, GY + 2, GX + GW, GTOP - 3);
  bambooPole(c, GX - GW - 5, GTOP, GX + GW + 5, GTOP);
  c.strokeStyle = "#8a6a3a"; c.lineWidth = 1.5;
  for (const x of [GX - GW, GX + GW]) {
    c.beginPath();
    for (let k = -2; k <= 2; k++) { c.moveTo(x - 4, GTOP + k * 2); c.lineTo(x + 4, GTOP + k * 2 + 2); }
    c.stroke();
  }
}

/**
 * The keeper facing us. `x` is the hips' centre on screen, `feet` the grass under them; `tilt` (radians) leans the whole body
 * for a dive, `lift` raises it off the grass. `crouch` 0..1 bends the knees while waiting.
 */
export function drawKeeper(c: CanvasRenderingContext2D, x: number, feet: number, tilt: number, lift: number, crouch: number, kit: string) {
  c.save();
  c.translate(x, feet - 22 - lift);
  c.rotate(tilt);
  const bend = crouch * 4;
  // Legs and boots.
  c.strokeStyle = "#1d1d1d"; c.lineWidth = 5; c.lineCap = "round";
  c.beginPath(); c.moveTo(-4, 4); c.lineTo(-7 - bend * 0.6, 20 - bend); c.moveTo(4, 4); c.lineTo(7 + bend * 0.6, 20 - bend); c.stroke();
  c.strokeStyle = SKIN; c.lineWidth = 3.4;
  c.beginPath(); c.moveTo(-5, 8); c.lineTo(-7 - bend * 0.6, 18 - bend); c.moveTo(5, 8); c.lineTo(7 + bend * 0.6, 18 - bend); c.stroke();
  // Shorts and shirt.
  c.fillStyle = "#1d1d1d"; c.fillRect(-8, -1, 16, 9);
  c.fillStyle = kit; c.fillRect(-9, -24 + bend, 18, 24 - bend);
  // Arms out, gloves up.
  c.strokeStyle = kit; c.lineWidth = 5;
  c.beginPath(); c.moveTo(-8, -20 + bend); c.lineTo(-18, -30 + bend); c.moveTo(8, -20 + bend); c.lineTo(18, -30 + bend); c.stroke();
  c.fillStyle = "#f4f1e6";
  c.beginPath(); c.arc(-19, -32 + bend, 4.2, 0, Math.PI * 2); c.arc(19, -32 + bend, 4.2, 0, Math.PI * 2); c.fill();
  // Head.
  c.fillStyle = SKIN; c.beginPath(); c.arc(0, -31 + bend, 6.4, 0, Math.PI * 2); c.fill();
  c.fillStyle = HAIR; c.beginPath(); c.arc(0, -33 + bend, 6.2, Math.PI * 1.05, Math.PI * 1.95); c.fill();
  c.restore();
}

/**
 * The kicker from behind, close to us. `step` 0..1 is the run-up (0 far back-left, 1 at the ball), `lean` -1..1 tips the
 * shoulders and head the way he means to kick (the tell), `swing` 0..1 is the kicking leg coming through.
 */
export function drawKicker(c: CanvasRenderingContext2D, step: number, lean: number, swing: number, kit: string, shorts: string) {
  const x = SPOT_X - 56 + step * 32, y = SPOT_Y + 40 - step * 10, bob = Math.sin(step * Math.PI * 5) * 1.6;
  c.save();
  c.translate(x, y + bob);
  // Legs: the standing one, and the kicking one swinging forward.
  c.strokeStyle = SKIN; c.lineWidth = 6; c.lineCap = "round";
  const stride = Math.sin(step * Math.PI * 5) * 5;
  c.beginPath(); c.moveTo(-5, 0); c.lineTo(-7 + stride, 26); c.moveTo(5, 0); c.lineTo(7 - stride + swing * 12, 26 - swing * 12); c.stroke();
  c.fillStyle = "#1d1d1d";
  c.beginPath(); c.ellipse(-7 + stride, 28, 5, 3, 0, 0, Math.PI * 2); c.ellipse(7 - stride + swing * 12, 28 - swing * 12, 5, 3, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = shorts; c.fillRect(-11, -8, 22, 12);
  // Torso tips with the lean, the head tips more.
  c.rotate(lean * 0.22);
  c.fillStyle = kit; c.fillRect(-13, -40, 26, 33);
  c.fillStyle = "#00000022"; c.fillRect(-13, -40, 26, 4);
  c.strokeStyle = SKIN; c.lineWidth = 5;
  c.beginPath(); c.moveTo(-13, -36); c.lineTo(-20 - lean * 3, -16); c.moveTo(13, -36); c.lineTo(20 - lean * 3, -16); c.stroke();
  c.fillStyle = SKIN; c.beginPath(); c.arc(lean * 4, -48, 8.5, 0, Math.PI * 2); c.fill();
  c.fillStyle = HAIR; c.beginPath(); c.arc(lean * 4, -49, 8.6, Math.PI * 0.85, Math.PI * 2.15); c.fill();
  c.restore();
}

/** A plain white ball with dark patches. `spin` turns the patches. */
export function drawBall(c: CanvasRenderingContext2D, x: number, y: number, r: number, spin: number) {
  c.fillStyle = "#00000030";
  c.beginPath(); c.ellipse(x, y + r * 0.9, r * 0.9, r * 0.3, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#fdfdf8"; c.strokeStyle = "#5b5b55"; c.lineWidth = Math.max(0.8, r * 0.12);
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = "#2b2b28";
  for (let k = 0; k < 3; k++) {
    const angle = spin + k * 2.094;
    c.beginPath(); c.arc(x + Math.cos(angle) * r * 0.5, y + Math.sin(angle) * r * 0.5, r * 0.27, 0, Math.PI * 2); c.fill();
  }
  c.beginPath(); c.arc(x, y, r * 0.22, 0, Math.PI * 2); c.fill();
}

/** The aim mark on the goal: a ring and a cross. */
export function drawCrosshair(c: CanvasRenderingContext2D, x: number, y: number, color: string, faint: boolean) {
  c.globalAlpha = faint ? 0.55 : 1;
  c.strokeStyle = "#ffffff"; c.lineWidth = 4;
  c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2); c.stroke();
  c.strokeStyle = color; c.lineWidth = 2.2;
  c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2); c.moveTo(x - 14, y); c.lineTo(x - 4, y); c.moveTo(x + 4, y); c.lineTo(x + 14, y); c.moveTo(x, y - 14); c.lineTo(x, y - 4); c.moveTo(x, y + 4); c.lineTo(x, y + 14); c.stroke();
  c.globalAlpha = 1;
}

/** The power bar on the right: green up to 85%, then a red band where the ball rises over the bar. */
export function drawMeter(c: CanvasRenderingContext2D, power: number) {
  const x = W - 26, top = 196, height = 110;
  c.fillStyle = "#1d2b1acc"; c.fillRect(x - 3, top - 3, 18, height + 6);
  c.fillStyle = "#d94a3a"; c.fillRect(x, top, 12, height * 0.15);
  c.fillStyle = "#ffffff33"; c.fillRect(x, top + height * 0.15, 12, height * 0.85);
  const level = top + height * (1 - power);
  c.fillStyle = power > 0.85 ? "#ff6b57" : "#ffd23f"; c.fillRect(x, level, 12, top + height - level);
  c.fillStyle = "#ffffff"; c.fillRect(x - 5, level - 1.5, 22, 3);
}

/** The finger's path while swiping, fading toward its start. */
export function drawTrail(c: CanvasRenderingContext2D, xs: Float32Array, ys: Float32Array, count: number) {
  if (count < 2) return;
  c.lineCap = "round"; c.lineJoin = "round"; c.strokeStyle = "#ffffff";
  for (let i = 1; i < count; i++) {
    c.globalAlpha = 0.15 + 0.6 * (i / count);
    c.lineWidth = 2 + 4 * (i / count);
    c.beginPath(); c.moveTo(xs[i - 1], ys[i - 1]); c.lineTo(xs[i], ys[i]); c.stroke();
  }
  c.globalAlpha = 1;
}

// The গলি at night, drawn in board units (360×400): two old buildings, a bare bulb on a wire, a net tied between two windows,
// chalk lines on the concrete, and two players in monkey caps and sweaters. Static parts go to an offscreen canvas once.
import type { Night } from "./levels";
import { GROUND, H, HIT_Y, NET_BOTTOM, NET_TOP, NET_X, W } from "./rally";

export const BULB_X = 196, BULB_Y = 64;
/** The window where a neighbour sighs "আহা" on a miss (left building, first floor). */
export const SIGH_WINDOW = { x: 24, y: 150, w: 40, h: 50 } as const;
/** Anchor windows the net's ropes are tied to. */
const LEFT_TIE = { x: 128, y: 132 }, RIGHT_TIE = { x: 236, y: 140 };

const C = {
  sky: "#0f1630", skyLow: "#1d2647", wallL: "#3b3446", wallR: "#433a3a", wallBack: "#262a40", trim: "#2a2433",
  lit: "#ffcf73", litDeep: "#e59a3c", dark: "#1a1826", grill: "#2b2230", ground: "#4b4542", groundFar: "#3d3836",
  chalk: "#e9e2cf", drain: "#2f2b2a", wire: "#151320", bulb: "#fff4cf", rope: "#d8cfb8", net: "#e9e4d6", tape: "#f7f3ea",
  skin: "#c98d63", hair: "#1b1716", trousers: "#2e3446", racket: "#d9d4c4", strings: "#bfb8a6",
};

function windowBox(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, lit: boolean) {
  c.fillStyle = C.trim; c.fillRect(x - 3, y - 3, w + 6, h + 6);
  c.fillStyle = lit ? C.lit : C.dark; c.fillRect(x, y, w, h);
  if (lit) { c.fillStyle = C.litDeep; c.fillRect(x, y + h * 0.62, w, h * 0.38); }
  c.strokeStyle = C.grill; c.lineWidth = 1.6;
  c.beginPath();
  for (let gx = x + w / 4; gx < x + w - 1; gx += w / 4) { c.moveTo(gx, y); c.lineTo(gx, y + h); }
  c.moveTo(x, y + h / 2); c.lineTo(x + w, y + h / 2);
  c.stroke();
  c.fillStyle = C.trim; c.fillRect(x - 5, y + h + 2, w + 10, 4); // sill
}

/** Everything that never moves. `night` adds haze for fog. */
export function drawAlley(c: CanvasRenderingContext2D, night: Night) {
  const sky = c.createLinearGradient(0, 0, 0, 220);
  sky.addColorStop(0, C.sky); sky.addColorStop(1, C.skyLow);
  c.fillStyle = sky; c.fillRect(0, 0, W, H);
  // A far building between the two, and a thin moon of a streetlight behind.
  c.fillStyle = C.wallBack; c.fillRect(140, 70, 100, GROUND - 70);
  c.fillStyle = "#30354f";
  for (let y = 92; y < 300; y += 34) for (let x = 152; x < 232; x += 26) c.fillRect(x, y, 12, 16);
  c.fillStyle = "#ffcf7355"; c.fillRect(178, 160, 12, 16);

  // Left building.
  c.fillStyle = C.wallL; c.fillRect(0, 30, 146, GROUND - 30);
  c.fillStyle = C.trim; c.fillRect(0, 26, 150, 8); c.fillRect(0, 226, 146, 5);
  windowBox(c, SIGH_WINDOW.x, SIGH_WINDOW.y, SIGH_WINDOW.w, SIGH_WINDOW.h, true);
  windowBox(c, 96, 112, 34, 46, false);
  windowBox(c, 24, 52, 40, 44, false);
  windowBox(c, 96, 48, 34, 40, true);
  // Ground floor: a rolled-down shutter.
  c.fillStyle = "#57505c"; c.fillRect(14, 262, 92, GROUND - 262);
  c.strokeStyle = "#433d49"; c.lineWidth = 1.2; c.beginPath();
  for (let y = 268; y < GROUND; y += 6) { c.moveTo(14, y); c.lineTo(106, y); }
  c.stroke();

  // Right building.
  c.fillStyle = C.wallR; c.fillRect(226, 40, W - 226, GROUND - 40);
  c.fillStyle = C.trim; c.fillRect(222, 36, W - 222, 8); c.fillRect(226, 232, W - 226, 5);
  windowBox(c, 244, 118, 36, 48, true);
  windowBox(c, 302, 118, 40, 48, false);
  windowBox(c, 302, 56, 40, 40, true);
  windowBox(c, 244, 60, 36, 36, false);
  c.fillStyle = "#3a3236"; c.fillRect(300, 262, 44, GROUND - 262); // a wooden door
  c.fillStyle = "#c9a35a"; c.beginPath(); c.arc(336, 312, 2, 0, Math.PI * 2); c.fill();

  // A drainpipe and the electric wire the bulb hangs from.
  c.fillStyle = "#2c2836"; c.fillRect(140, 30, 5, GROUND - 30);
  c.strokeStyle = C.wire; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(0, 20); c.quadraticCurveTo(180, 46, W, 24); c.stroke();
  c.beginPath(); c.moveTo(BULB_X, 33); c.lineTo(BULB_X, BULB_Y - 6); c.stroke();

  // The concrete গলি, with a drain along the wall and two chalk lines for the court.
  const ground = c.createLinearGradient(0, GROUND - 8, 0, H);
  ground.addColorStop(0, C.groundFar); ground.addColorStop(1, C.ground);
  c.fillStyle = ground; c.fillRect(0, GROUND - 6, W, H - GROUND + 6);
  c.fillStyle = C.drain; c.fillRect(0, GROUND - 6, W, 4);
  c.strokeStyle = C.chalk; c.lineWidth = 2; c.globalAlpha = 0.7;
  c.beginPath(); c.moveTo(22, GROUND + 22); c.lineTo(34, GROUND + 2); c.moveTo(338, GROUND + 22); c.lineTo(326, GROUND + 2); c.stroke();
  c.beginPath(); c.moveTo(NET_X - 1, GROUND + 26); c.lineTo(NET_X - 1, GROUND + 2); c.stroke();
  c.globalAlpha = 1;

  // The bulb's pool of light: on the wall behind, and on the ground.
  const glow = c.createRadialGradient(BULB_X, BULB_Y, 2, BULB_X, BULB_Y, night === "fog" ? 150 : 120);
  glow.addColorStop(0, "#fff2c2cc"); glow.addColorStop(0.25, "#ffd98a55"); glow.addColorStop(1, "#ffd98a00");
  c.fillStyle = glow; c.fillRect(0, 0, W, H);
  const pool = c.createRadialGradient(BULB_X, GROUND + 14, 4, BULB_X, GROUND + 14, 150);
  pool.addColorStop(0, "#ffd98a40"); pool.addColorStop(1, "#ffd98a00");
  c.fillStyle = pool; c.fillRect(0, GROUND - 10, W, H - GROUND + 10);

  // The net: two ropes from the windows to a tall, narrow net in the middle.
  c.strokeStyle = C.rope; c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(LEFT_TIE.x, LEFT_TIE.y); c.quadraticCurveTo(152, 200, NET_X, NET_TOP); c.stroke();
  c.beginPath(); c.moveTo(RIGHT_TIE.x, RIGHT_TIE.y); c.quadraticCurveTo(210, 204, NET_X, NET_TOP); c.stroke();
  c.fillStyle = C.rope; c.fillRect(LEFT_TIE.x - 2, LEFT_TIE.y - 2, 4, 4); c.fillRect(RIGHT_TIE.x - 2, RIGHT_TIE.y - 2, 4, 4);
  drawNet(c);

  // The bulb itself, bare.
  c.fillStyle = "#3b3330"; c.fillRect(BULB_X - 3, BULB_Y - 9, 6, 5);
  c.fillStyle = C.bulb; c.beginPath(); c.ellipse(BULB_X, BULB_Y, 5, 6.5, 0, 0, Math.PI * 2); c.fill();

  if (night === "fog") {
    c.fillStyle = "#c7cfdb22"; c.fillRect(0, 0, W, H);
  }
}

function drawNet(c: CanvasRenderingContext2D) {
  const left = NET_X - 5, width = 10, height = NET_BOTTOM - NET_TOP;
  c.fillStyle = "#e9e4d61f"; c.fillRect(left, NET_TOP, width, height);
  c.strokeStyle = C.net; c.globalAlpha = 0.55; c.lineWidth = 0.8;
  c.beginPath();
  for (let y = NET_TOP + 6; y < NET_BOTTOM; y += 6) { c.moveTo(left, y); c.lineTo(left + width, y); }
  for (let x = left; x <= left + width + 0.1; x += 5) { c.moveTo(x, NET_TOP); c.lineTo(x, NET_BOTTOM); }
  c.stroke();
  c.globalAlpha = 1;
  c.fillStyle = C.tape; c.fillRect(left - 1, NET_TOP - 2, width + 2, 4);
}

/** The fog layer, drawn over the shuttle: thick above the net, thin near the ground. */
export function drawFog(c: CanvasRenderingContext2D) {
  const fog = c.createLinearGradient(0, 20, 0, HIT_Y - 6);
  fog.addColorStop(0, "#cfd6e000"); fog.addColorStop(0.25, "#cfd6e0d9"); fog.addColorStop(0.8, "#cfd6e0c8"); fog.addColorStop(1, "#cfd6e000");
  c.fillStyle = fog; c.fillRect(0, 20, W, HIT_Y - 26);
}

/**
 * A player in a monkey cap and sweater. `x` is the feet; `facing` 1 looks right, −1 left.
 * `arm` is the racket angle in radians (0 points forward, −π/2 straight up), measured for a right-facing player.
 */
export function drawPlayer(c: CanvasRenderingContext2D, x: number, facing: 1 | -1, shirt: string, arm: number, bob = 0) {
  c.save();
  c.translate(x, 0);
  c.scale(facing, 1);
  const feet = GROUND - 2, hip = feet - 34 + bob, shoulder = hip - 30, head = shoulder - 14;
  // Legs and sandals.
  c.strokeStyle = C.trousers; c.lineWidth = 7; c.lineCap = "round";
  c.beginPath(); c.moveTo(-3, hip); c.lineTo(-9, feet - 2); c.moveTo(3, hip); c.lineTo(8, feet - 2); c.stroke();
  c.fillStyle = "#1b1716"; c.fillRect(-14, feet - 3, 9, 3); c.fillRect(4, feet - 3, 9, 3);
  // Sweater.
  c.fillStyle = shirt;
  c.beginPath(); c.moveTo(-10, shoulder - 2); c.lineTo(10, shoulder - 2); c.lineTo(9, hip + 2); c.lineTo(-9, hip + 2); c.closePath(); c.fill();
  c.fillStyle = "#00000026"; c.fillRect(-9, hip - 4, 18, 3);
  // Back arm, resting.
  c.strokeStyle = shirt; c.lineWidth = 5;
  c.beginPath(); c.moveTo(-6, shoulder + 2); c.lineTo(-12, shoulder + 20); c.stroke();
  // Head in a monkey cap: knitted all round, a face opening, a little bobble.
  c.fillStyle = "#7a2e2a"; c.beginPath(); c.arc(0, head, 10, 0, Math.PI * 2); c.fill();
  c.fillStyle = C.skin; c.beginPath(); c.ellipse(4, head + 1, 5, 4.2, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#1b1716"; c.fillRect(5, head - 0.5, 1.6, 1.6);
  c.fillStyle = "#e0c8a0"; c.beginPath(); c.arc(-2, head - 10, 2.6, 0, Math.PI * 2); c.fill();
  // Racket arm and racket.
  const sx = 4, sy = shoulder + 2, cos = Math.cos(arm), sin = Math.sin(arm);
  const ex = sx + cos * 22, ey = sy + sin * 22, hx = sx + cos * 46, hy = sy + sin * 46;
  c.strokeStyle = shirt; c.lineWidth = 5;
  c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.stroke();
  c.strokeStyle = C.racket; c.lineWidth = 1.8;
  c.beginPath(); c.moveTo(ex, ey); c.lineTo(hx, hy); c.stroke();
  c.translate(sx + cos * 56, sy + sin * 56); c.rotate(arm);
  c.beginPath(); c.ellipse(0, 0, 10, 7.5, 0, 0, Math.PI * 2);
  c.fillStyle = "#ffffff14"; c.fill();
  c.strokeStyle = C.strings; c.lineWidth = 0.6;
  c.beginPath(); for (let i = -6; i <= 6; i += 3) { c.moveTo(i, -6); c.lineTo(i, 6); c.moveTo(-8, i * 0.9); c.lineTo(8, i * 0.9); } c.stroke();
  c.strokeStyle = C.racket; c.lineWidth = 1.8;
  c.beginPath(); c.ellipse(0, 0, 10, 7.5, 0, 0, Math.PI * 2); c.stroke();
  c.restore();
}

/** Racket angle for a swing that started `since` seconds ago (null: never), or held back while `cocked`. */
export function armAngle(since: number, cocked: boolean) {
  if (since >= 0 && since < 0.24) {
    const s = since / 0.24, eased = 1 - (1 - s) * (1 - s);
    return -2.8 + eased * 3.2;
  }
  if (cocked) return -2.8;
  if (since >= 0.24 && since < 0.5) return 0.4 - ((since - 0.24) / 0.26) * 1.3;
  return -0.9;
}

/** The shuttle: a cork ball with a feather skirt trailing behind, pointed where it's going. */
export function drawShuttle(c: CanvasRenderingContext2D, x: number, y: number, angle: number, alpha = 1, size = 1) {
  c.save();
  c.globalAlpha = alpha;
  c.translate(x, y); c.rotate(angle); c.scale(size, size);
  c.fillStyle = "#f4f1e8"; c.strokeStyle = "#1a1826"; c.lineWidth = 0.9;
  c.beginPath(); c.moveTo(-1, -2.6); c.lineTo(-11, -5.6); c.lineTo(-11, 5.6); c.lineTo(-1, 2.6); c.closePath(); c.fill(); c.stroke();
  c.strokeStyle = "#b8b2a2"; c.lineWidth = 0.6;
  c.beginPath(); c.moveTo(-5, -3.6); c.lineTo(-5, 3.6); c.moveTo(-8.5, -4.8); c.lineTo(-8.5, 4.8); c.stroke();
  c.fillStyle = "#fffdf6"; c.strokeStyle = "#1a1826"; c.lineWidth = 0.9;
  c.beginPath(); c.arc(1, 0, 3.4, 0, Math.PI * 2); c.fill(); c.stroke();
  c.restore();
}

/** The shuttle's shadow on the ground: small and faint when it's high, dark and wide as it comes down. */
export function drawShadow(c: CanvasRenderingContext2D, x: number, y: number) {
  const near = Math.max(0, Math.min(1, 1 - (GROUND - y) / 300));
  c.fillStyle = `rgba(10,8,20,${(0.25 + near * 0.45).toFixed(2)})`;
  c.beginPath(); c.ellipse(x, GROUND + 6, 4 + near * 8, 1.6 + near * 2.4, 0, 0, Math.PI * 2); c.fill();
}

/** The timing ring at the hit spot: it closes in as the shuttle arrives and turns gold in the perfect moment. */
export function drawRing(c: CanvasRenderingContext2D, x: number, y: number, radius: number, perfect: boolean) {
  c.strokeStyle = perfect ? "#ffd23f" : "#ffffffcc";
  c.lineWidth = perfect ? 3.4 : 2.2;
  c.beginPath(); c.arc(x, y, radius, 0, Math.PI * 2); c.stroke();
  c.fillStyle = perfect ? "#ffd23f" : "#ffffff99";
  c.beginPath(); c.arc(x, y, 2.4, 0, Math.PI * 2); c.fill();
  // A chalk dot below the hit spot, where the shadow is heading.
  c.fillStyle = "#e9e2cf88"; c.fillRect(x - 5, GROUND + 5, 10, 2);
}

/** Washing on a line between the buildings, on windy nights: it leans with the wind that pushes the shuttle (−1..1). */
export function drawWashing(c: CanvasRenderingContext2D, push: number) {
  c.strokeStyle = "#8c8478"; c.lineWidth = 1;
  c.beginPath(); c.moveTo(146, 214); c.quadraticCurveTo(186, 224, 226, 216); c.stroke();
  const cloth = ["#3f7a8c", "#b85c38", "#d8c27a"], lean = push * 14;
  for (let i = 0; i < 3; i++) {
    const x = 154 + i * 22, y = 218 + (i === 1 ? 3 : 1);
    c.fillStyle = cloth[i];
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + 12, y); c.lineTo(x + 12 + lean, y + 20 - Math.abs(lean) * 0.3); c.lineTo(x + lean, y + 21 - Math.abs(lean) * 0.3); c.closePath(); c.fill();
  }
}

/** Moths circling the bulb. Still in slow mode. */
export function drawMoths(c: CanvasRenderingContext2D, clock: number, still: boolean) {
  c.fillStyle = "#e8dcc0";
  for (let i = 0; i < 3; i++) {
    const t = still ? i * 2.1 : clock * (1.3 + i * 0.4) + i * 2.1;
    const mx = BULB_X + Math.cos(t) * (12 + i * 6), my = BULB_Y + 2 + Math.sin(t * 1.3) * (8 + i * 3);
    const flap = still ? 2 : 1.2 + Math.abs(Math.sin(clock * 22 + i)) * 1.6;
    c.fillRect(mx - flap, my - 0.8, flap * 2, 1.6);
  }
}

/** A neighbour's head and shoulders in the lit window, for the "আহা" on a miss. */
export function drawNeighbour(c: CanvasRenderingContext2D, alpha: number) {
  const { x, y, w, h } = SIGH_WINDOW;
  c.save();
  c.globalAlpha = alpha;
  c.beginPath(); c.rect(x, y, w, h); c.clip();
  c.fillStyle = "#2a1d1c";
  c.beginPath(); c.arc(x + w / 2, y + h * 0.48, 8, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(x + w / 2, y + h, 15, 14, 0, Math.PI, 0); c.fill();
  c.restore();
}

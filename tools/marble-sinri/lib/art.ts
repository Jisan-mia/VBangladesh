// Drawing in board units: one palette per world, the walls, the five kinds of ledge, pots, marbles, the awning, the
// landings. Plain shapes only. scene.ts paints the still parts once into sprites; draw.hot.ts calls the ledge painters per
// frame (fillRect only, no allocation); the title and the card use the same painters.
import { MARBLES } from "./levels";
import { ALLEY, LANDING, LEDGE, PARAPET, CONCRETE, PLANK, POLE, POT, R, RAIL, TOP, W } from "./physics";

type Ctx = CanvasRenderingContext2D;
export type Look = "roof" | "stairs" | "scaffold" | "alley";

export type Palette = {
  sky: readonly [string, string]; far: string; window: string; detail: string;
  ink: string; panel: string; glow: string; accent: string;
};
export const PALETTES: Record<Look, Palette> = {
  roof: { sky: ["#bfe3f2", "#f6e7c8"], far: "#9fb7c4", window: "#3a4a5a", detail: "#5d6b78", ink: "#1f2b2a", panel: "#1f2b2ad9", glow: "#ffd166", accent: "#2e7d6b" },
  stairs: { sky: ["#e6d8bf", "#bfa98a"], far: "#a8957a", window: "#5c4a36", detail: "#8c7a5e", ink: "#2b2118", panel: "#2b2118d9", glow: "#ffcf7a", accent: "#8a5a2b" },
  scaffold: { sky: ["#f3c08a", "#8f6450"], far: "#7a4f3a", window: "#ffd98a", detail: "#5e3f31", ink: "#2a1a12", panel: "#2a1a12d9", glow: "#ffb46a", accent: "#b5523b" },
  alley: { sky: ["#2b3852", "#4a4f63"], far: "#1c2436", window: "#f5d47a", detail: "#111723", ink: "#0d1220", panel: "#0d1220e0", glow: "#ffe08c", accent: "#e8b923" },
};

/** The still sky, top to bottom of the viewport. */
export function paintSky(c: Ctx, p: Palette, height: number) {
  const sky = c.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, p.sky[0]); sky.addColorStop(1, p.sky[1]);
  c.fillStyle = sky; c.fillRect(-W, 0, 3 * W, height);
}

/** A tile 360 × 360 of the wall that scrolls past slowly: rooftops, the stairwell's plaster, the scaffold's poles, the alley's windows. */
export function paintWallTile(c: Ctx, look: Look, p: Palette) {
  c.save();
  if (look === "roof") {
    // The next buildings' faces, running past as the marble goes down: seamless top to bottom.
    c.globalAlpha = 0.3; c.fillStyle = p.far;
    c.fillRect(-6, 0, 92, 360); c.fillRect(150, 0, 70, 360); c.fillRect(282, 0, 90, 360);
    c.globalAlpha = 0.2; c.fillStyle = p.window;
    for (let y = 16; y < 360; y += 40) { c.fillRect(10, y, 14, 18); c.fillRect(44, y, 14, 18); c.fillRect(166, y + 20, 12, 16); c.fillRect(194, y + 20, 12, 16); c.fillRect(300, y, 14, 18); c.fillRect(334, y, 14, 18); }
    c.globalAlpha = 0.22; c.fillStyle = p.detail; c.fillRect(86, 120, 4, 240); c.fillRect(276, 0, 3, 360);
  } else if (look === "stairs") {
    c.globalAlpha = 0.16; c.fillStyle = p.detail; c.fillRect(40, 60, 70, 90);
    c.globalAlpha = 0.3; for (let x = 48; x < 110; x += 12) c.fillRect(x, 60, 3, 90);
    c.globalAlpha = 0.12; c.strokeStyle = p.detail; c.lineWidth = 6;
    c.beginPath(); c.moveTo(-10, 190); c.lineTo(W + 10, 360); c.stroke();
    c.lineWidth = 2; for (let x = 0; x < W; x += 30) { c.beginPath(); c.moveTo(x, 190 + x * 0.47); c.lineTo(x, 226 + x * 0.47); c.stroke(); }
    c.globalAlpha = 0.1; c.fillStyle = p.window; c.fillRect(250, 40, 60, 4); c.fillRect(276, 44, 8, 26);
  } else if (look === "scaffold") {
    c.globalAlpha = 0.28; c.strokeStyle = p.detail; c.lineWidth = 5;
    for (let x = 24; x < W; x += 78) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 3, 360); c.stroke(); }
    c.lineWidth = 3; for (let y = 40; y < 360; y += 120) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y + 8); c.stroke(); }
    c.globalAlpha = 0.16; c.lineWidth = 2;
    for (let x = 24; x < W - 78; x += 78) { c.beginPath(); c.moveTo(x, 40); c.lineTo(x + 78, 160); c.stroke(); }
  } else {
    c.globalAlpha = 0.5; c.fillStyle = p.far; c.fillRect(0, 0, 70, 360); c.fillRect(W - 70, 0, 70, 360);
    c.globalAlpha = 0.55; c.fillStyle = p.window;
    for (let y = 30; y < 360; y += 90) { c.fillRect(20, y, 26, 22); c.fillRect(W - 46, y + 40, 26, 22); }
    c.globalAlpha = 0.8; c.strokeStyle = p.detail; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, 120); c.quadraticCurveTo(W / 2, 154, W, 116); c.stroke();
  }
  c.restore();
}

/** The no-touch strip at the top: a striped awning edge, red and cream (amber when the stairs are about to rush). */
export function paintAwning(c: Ctx, stripe = "#d64545") {
  c.save();
  c.beginPath(); c.rect(0, 0, W, TOP); c.clip();
  c.fillStyle = "#f6efe0"; c.fillRect(0, 0, W, TOP);
  c.fillStyle = stripe;
  for (let x = -TOP; x < W + TOP; x += 24) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 12, 0); c.lineTo(x + 12 + TOP, TOP); c.lineTo(x + TOP, TOP); c.closePath(); c.fill(); }
  c.restore();
  c.fillStyle = "#3a2a20"; c.fillRect(0, TOP - 2, W, 2);
  const shade = c.createLinearGradient(0, TOP, 0, TOP + 10);
  shade.addColorStop(0, "rgba(40,20,10,0.25)"); shade.addColorStop(1, "rgba(40,20,10,0)");
  c.fillStyle = shade; c.fillRect(0, TOP, W, 10);
}
/** A red wash under the awning, shown stronger as the marble gets close. */
export function paintWarning(c: Ctx) {
  const wash = c.createLinearGradient(0, 0, 0, 90);
  wash.addColorStop(0, "rgba(214,69,69,0.6)"); wash.addColorStop(1, "rgba(214,69,69,0)");
  c.fillStyle = wash; c.fillRect(0, 0, W, 90);
}

/** One ledge at its own (x0, y) top-left, `w` long, flat: the caller rotates the context for a slope. */
export function paintLedge(c: Ctx, kind: number, x0: number, w: number, y: number, wet: boolean) {
  const x1 = x0 + w;
  if (kind === CONCRETE) {
    c.fillStyle = "#8e959b"; c.fillRect(x0, y, w, LEDGE);
    c.fillStyle = "#c5cacd"; c.fillRect(x0, y, w, 3);
    c.fillStyle = "#62696f"; c.fillRect(x0, y + LEDGE - 2, w, 2);
    c.fillStyle = "#737a80";
    for (let x = x0 + 9; x < x1 - 4; x += 17) c.fillRect(x, y + 5 + ((x * 7) % 4 | 0), 2, 2);
  } else if (kind === PARAPET) {
    c.fillStyle = "#b5523b"; c.fillRect(x0, y + 3, w, LEDGE - 3);
    c.fillStyle = "#8e3b29"; c.fillRect(x0, y + 7, w, 1);
    for (let x = x0 + 12; x < x1 - 2; x += 16) { c.fillRect(x, y + 3, 1, 4); c.fillRect(x - 8, y + 8, 1, 4); }
    c.fillStyle = "#efe6d6"; c.fillRect(x0 - 1, y, w + 2, 4);
    c.fillStyle = "#cfc4b0"; c.fillRect(x0 - 1, y + 3, w + 2, 1);
  } else if (kind === PLANK) {
    c.fillStyle = "#c9b458"; c.fillRect(x0, y, w, 6);
    c.fillStyle = "#a99540"; c.fillRect(x0, y + 6, w, 6);
    c.fillStyle = "#e6d88a"; c.fillRect(x0, y + 1, w, 1.5); c.fillRect(x0, y + 7, w, 1.2);
    c.fillStyle = "#7a6a2a";
    for (let x = x0 + 22; x < x1 - 6; x += 30) { c.fillRect(x, y, 2, 6); c.fillRect(x + 11, y + 6, 2, 6); }
    c.fillStyle = "#5a4630"; c.fillRect(x0 + 4, y - 1, 3, LEDGE + 2); c.fillRect(x1 - 7, y - 1, 3, LEDGE + 2);
  } else if (kind === RAIL) {
    // A stair rail: a round steel tube on short posts.
    c.fillStyle = "#4f5a63"; c.fillRect(x0, y, w, 7);
    c.fillStyle = "#9fb0bc"; c.fillRect(x0, y + 1, w, 2);
    c.fillStyle = "#3b444b"; for (let x = x0 + 10; x < x1 - 4; x += 28) c.fillRect(x, y + 7, 3, 10);
  } else if (kind === POLE) {
    // A round bamboo pole, with its knots.
    c.fillStyle = "#b9a24a"; c.fillRect(x0, y, w, 10);
    c.fillStyle = "#e3d384"; c.fillRect(x0, y + 1, w, 3);
    c.fillStyle = "#8a7530"; c.fillRect(x0, y + 8, w, 2);
    for (let x = x0 + 18; x < x1 - 6; x += 26) c.fillRect(x, y, 2, 10);
  } else if (kind === LANDING) {
    c.fillStyle = "#6f5a48"; c.fillRect(x0, y, w, 40);
    c.fillStyle = "#a58c72"; c.fillRect(x0, y, w, 4);
    c.fillStyle = "#c0392b"; c.fillRect(W / 2 - 44, y + 4, 88, 10);
    c.fillStyle = "#e8b923"; for (let x = W / 2 - 40; x < W / 2 + 40; x += 8) c.fillRect(x, y + 7, 4, 4);
  } else if (kind === ALLEY) {
    // The alley's packed earth, all the way down, with a brick drain along it.
    c.fillStyle = "#5a5148"; c.fillRect(x0, y, w, 600);
    c.fillStyle = "#7d7266"; c.fillRect(x0, y, w, 3);
    c.fillStyle = "#3e3730"; c.fillRect(x0, y + 46, w, 10);
    c.fillStyle = "#8e3b29"; for (let x = x0; x < x0 + w; x += 18) c.fillRect(x, y + 56, 16, 6);
    // The friends' marbles, waiting round the hole.
    paintPick(c, W * 0.72 - 40, y + 16, 2); paintPick(c, W * 0.72 + 36, y + 20, 5); paintPick(c, W * 0.72 + 8, y + 30, 1);
    // The friends' marble hole with its chalk ring.
    c.fillStyle = "#1a1c20"; c.beginPath(); c.ellipse(W * 0.72, y + 3, 14, 4, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "#f2efe6"; c.lineWidth = 1.2; c.beginPath(); c.ellipse(W * 0.72, y + 3, 30, 8, 0, 0, Math.PI * 2); c.stroke();
  }
  if (wet) {
    c.fillStyle = "rgba(120,190,255,0.55)"; c.fillRect(x0 + 4, y + 0.5, w - 8, 2);
    c.fillStyle = "rgba(120,190,255,0.35)"; for (let x = x0 + 14; x < x1 - 10; x += 34) c.fillRect(x, y - 1, 10, 1.5);
  }
}

/** A clay pot with a little cactus, standing on the ledge top at `y`. */
export function paintPot(c: Ctx, x: number, y: number) {
  const half = POT / 2;
  c.fillStyle = "#3f8f4e";
  c.beginPath(); c.roundRect(x - 4.5, y - 27, 9, 17, 4.5); c.fill();
  c.beginPath(); c.roundRect(x + 3, y - 22, 7, 4, 2); c.fill();
  c.beginPath(); c.roundRect(x + 7, y - 27, 4, 8, 2); c.fill();
  c.beginPath(); c.roundRect(x - 10, y - 20, 7, 4, 2); c.fill();
  c.beginPath(); c.roundRect(x - 10, y - 24, 4, 7, 2); c.fill();
  c.fillStyle = "#e9f2cf";
  c.fillRect(x - 1, y - 25, 1.5, 1.5); c.fillRect(x - 3, y - 19, 1.5, 1.5); c.fillRect(x + 1.5, y - 15, 1.5, 1.5); c.fillRect(x + 8, y - 26, 1.5, 1.5); c.fillRect(x - 9, y - 23, 1.5, 1.5);
  c.fillStyle = "#b85c38";
  c.beginPath(); c.moveTo(x - half + 2, y - 10); c.lineTo(x + half - 2, y - 10); c.lineTo(x + half - 5, y); c.lineTo(x - half + 5, y); c.closePath(); c.fill();
  c.fillStyle = "#9a4a2c"; c.fillRect(x - half, y - 13, POT, 4);
}

/** A small marble to pick up, centred at (x, y). */
export function paintPick(c: Ctx, x: number, y: number, colour: number) {
  const m = MARBLES[colour % MARBLES.length];
  c.fillStyle = m.glass; c.beginPath(); c.arc(x, y, 7, 0, Math.PI * 2); c.fill();
  c.fillStyle = m.eye; c.beginPath(); c.ellipse(x, y, 4.6, 1.8, 0.6, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "rgba(0,0,0,0.3)"; c.lineWidth = 1; c.beginPath(); c.arc(x, y, 6.5, 0, Math.PI * 2); c.stroke();
  c.fillStyle = "rgba(255,255,255,0.85)"; c.beginPath(); c.arc(x - 2.4, y - 2.6, 2, 0, Math.PI * 2); c.fill();
}

/** The marble's glass body (no swirl) centred at the origin, radius r. */
export function paintMarbleBody(c: Ctx, colour: number, r = R) {
  const m = MARBLES[Math.max(0, Math.min(MARBLES.length - 1, colour))];
  const body = c.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
  body.addColorStop(0, "#ffffff"); body.addColorStop(0.18, m.glass); body.addColorStop(1, m.glass);
  c.fillStyle = body; c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
}
/** The coloured swirl inside the glass, centred at the origin; drawn rotated by the roll. */
export function paintSwirl(c: Ctx, colour: number, r = R) {
  const m = MARBLES[Math.max(0, Math.min(MARBLES.length - 1, colour))];
  c.fillStyle = m.eye;
  c.beginPath(); c.ellipse(0, 0, r * 0.72, r * 0.26, 0, 0, Math.PI * 2); c.fill();
  c.globalAlpha = 0.5; c.beginPath(); c.ellipse(0, 0, r * 0.26, r * 0.62, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
}
/** The glass's shine and rim, over the swirl. */
export function paintShine(c: Ctx, r = R) {
  c.fillStyle = "rgba(255,255,255,0.2)"; c.beginPath(); c.arc(-r * 0.15, -r * 0.15, r * 0.8, 0, Math.PI * 2); c.fill();
  c.fillStyle = "rgba(255,255,255,0.88)"; c.beginPath(); c.ellipse(-r * 0.38, -r * 0.42, r * 0.28, r * 0.18, -0.6, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "rgba(0,0,0,0.3)"; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, r - 0.5, 0, Math.PI * 2); c.stroke();
}
/** A whole marble, for the title and the card (the game stamps the three sprites instead). */
export function paintMarble(c: Ctx, x: number, y: number, roll: number, colour: number, r = R) {
  c.save(); c.translate(x, y);
  c.fillStyle = "rgba(0,0,0,0.18)"; c.beginPath(); c.ellipse(1.5, r - 1, r * 0.8, r * 0.25, 0, 0, Math.PI * 2); c.fill();
  paintMarbleBody(c, colour, r);
  c.save(); c.rotate(roll); paintSwirl(c, colour, r); c.restore();
  paintShine(c, r);
  c.restore();
}

const CLOTHES = ["#e8b923", "#3a9bd8", "#d64545"] as const;
/** Laundry on a line over a gusty ledge, blown towards `side`; `flap` 0..1 moves the cloth. */
export function paintLaundry(c: Ctx, x0: number, x1: number, y: number, side: number, flap: number) {
  c.strokeStyle = "#5a4630"; c.lineWidth = 1;
  c.beginPath(); c.moveTo(x0 + 6, y - 44); c.lineTo(x1 - 6, y - 46); c.stroke();
  for (let i = 0; i < 3; i++) {
    const x = x0 + 14 + i * ((x1 - x0 - 28) / 2), lean = side * (6 + 4 * flap);
    c.fillStyle = CLOTHES[i];
    c.beginPath(); c.moveTo(x - 6, y - 45); c.lineTo(x + 6, y - 45); c.lineTo(x + 6 + lean, y - 34); c.lineTo(x - 6 + lean, y - 34); c.closePath(); c.fill();
  }
}

/** The title's art: a big glass marble resting on the edge of a parapet, the next ledges stepping down behind. */
export function paintTitle(c: Ctx, width: number, height: number, colour: number, look: Look) {
  const p = PALETTES[look], k = Math.min(width / 200, height / 150);
  c.save();
  c.translate(width / 2 - 100 * k, height / 2 - 75 * k); c.scale(k, k);
  const kind = look === "roof" ? PARAPET : look === "stairs" ? CONCRETE : PLANK;
  c.globalAlpha = 0.5; paintLedge(c, kind, 120, 70, 118, false); c.globalAlpha = 0.75; paintLedge(c, kind, 84, 70, 92, false);
  c.globalAlpha = 1; paintLedge(c, kind, 10, 120, 70, false);
  c.fillStyle = p.glow; c.globalAlpha = 0.25; c.beginPath(); c.arc(100, 38, 44, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
  paintMarble(c, 100, 38, -0.5, colour, 32);
  c.restore();
}

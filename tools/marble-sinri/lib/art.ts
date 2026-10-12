// Drawing in board units (360 × 480): backgrounds, the three kinds of ledge, cactus pots and the glass marbles.
// Shared by the game canvas and the result card. Plain shapes only; nothing per frame allocates beyond what the canvas API does.
import { H, LEDGE, MARBLES, POT, R, TOP, W, type Kind, type Ledge } from "./game";

type Ctx = CanvasRenderingContext2D;

/** Wall and sky for each stage: afternoon roof, the plaster stairwell, dusk on the scaffolding, a night alley. */
const SKIES: ReadonlyArray<readonly [string, string, string]> = [
  ["#bfe3f2", "#f6e7c8", "#ffffff"],
  ["#a9d4ea", "#f3d9b0", "#ffffff"],
  ["#e3d6bf", "#c4b295", "#8c7a5e"],
  ["#dacbb0", "#b7a586", "#857356"],
  ["#d2bf9f", "#a99677", "#7b6a4f"],
  ["#f3c08a", "#c98a62", "#7a4f3a"],
  ["#e8a274", "#8f6450", "#5e3f31"],
  ["#2b3852", "#4a4f63", "#f5d47a"],
];

export function drawBackground(c: Ctx, stage: number) {
  const [top, bottom, detail] = SKIES[Math.max(0, Math.min(SKIES.length - 1, stage))];
  const sky = c.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, top); sky.addColorStop(1, bottom);
  c.fillStyle = sky; c.fillRect(0, 0, W, H);
  c.save();
  if (stage <= 1) {
    // Rooftops of the next buildings and a water tank, far below the parapet.
    c.globalAlpha = 0.35; c.fillStyle = detail;
    for (let i = 0; i < 6; i++) { const x = i * 64 - 10, h = 120 + ((i * 53) % 90); c.fillRect(x, H - h, 56, h); }
    c.globalAlpha = 0.18; c.fillStyle = "#3a4a5a";
    for (let i = 0; i < 6; i++) { const x = i * 64 - 10, h = 120 + ((i * 53) % 90); for (let y = H - h + 14; y < H - 10; y += 26) { c.fillRect(x + 10, y, 12, 14); c.fillRect(x + 32, y, 12, 14); } }
    c.globalAlpha = 0.3; c.fillStyle = "#5d6b78"; c.fillRect(276, 300, 46, 36); c.fillRect(282, 336, 6, 30); c.fillRect(310, 336, 6, 30);
  } else if (stage <= 4) {
    // The stairwell: a plaster wall, a barred window, the old rail's shadow running down.
    c.globalAlpha = 0.16; c.fillStyle = detail;
    c.fillRect(40, 120, 70, 90);
    c.globalAlpha = 0.28;
    for (let x = 48; x < 110; x += 12) c.fillRect(x, 120, 3, 90);
    c.globalAlpha = 0.12; c.strokeStyle = detail; c.lineWidth = 6;
    c.beginPath(); c.moveTo(-10, 260); c.lineTo(W + 10, 470); c.stroke();
    c.lineWidth = 2;
    for (let x = 0; x < W; x += 30) { c.beginPath(); c.moveTo(x, 260 + x * 0.58); c.lineTo(x, 300 + x * 0.58); c.stroke(); }
  } else if (stage <= 6) {
    // Bamboo scaffolding of the building next door against a dusk sky.
    c.globalAlpha = 0.28; c.strokeStyle = detail; c.lineWidth = 5;
    for (let x = 24; x < W; x += 78) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 6, H); c.stroke(); }
    c.lineWidth = 3;
    for (let y = 40; y < H; y += 96) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y + 8); c.stroke(); }
    c.globalAlpha = 0.18; c.lineWidth = 2;
    for (let x = 24; x < W - 78; x += 78) for (let y = 40; y < H - 96; y += 96) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + 78, y + 96); c.stroke(); }
  } else {
    // The alley at night: one bulb, lit windows, a cable.
    c.globalAlpha = 0.5; c.fillStyle = "#1c2436"; c.fillRect(0, 0, 70, H); c.fillRect(W - 70, 0, 70, H);
    c.globalAlpha = 0.55; c.fillStyle = detail;
    for (let y = 60; y < H; y += 70) { c.fillRect(20, y, 26, 22); c.fillRect(W - 46, y + 30, 26, 22); }
    const glow = c.createRadialGradient(W / 2, 70, 4, W / 2, 70, 160);
    glow.addColorStop(0, "rgba(255,226,140,0.45)"); glow.addColorStop(1, "rgba(255,226,140,0)");
    c.globalAlpha = 1; c.fillStyle = glow; c.fillRect(0, 0, W, 260);
    c.strokeStyle = "#111723"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, 40); c.quadraticCurveTo(W / 2, 74, W, 36); c.stroke();
  }
  c.restore();
}

/** The no-touch strip at the top: a striped awning edge, red and cream, not spikes. */
export function drawCeiling(c: Ctx) {
  c.save();
  c.beginPath(); c.rect(0, 0, W, TOP); c.clip();
  c.fillStyle = "#f6efe0"; c.fillRect(0, 0, W, TOP);
  c.fillStyle = "#d64545";
  for (let x = -TOP; x < W + TOP; x += 24) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 12, 0); c.lineTo(x + 12 + TOP, TOP); c.lineTo(x + TOP, TOP); c.closePath(); c.fill(); }
  c.restore();
  c.fillStyle = "#3a2a20"; c.fillRect(0, TOP - 2, W, 2);
  const shade = c.createLinearGradient(0, TOP, 0, TOP + 10);
  shade.addColorStop(0, "rgba(40,20,10,0.25)"); shade.addColorStop(1, "rgba(40,20,10,0)");
  c.fillStyle = shade; c.fillRect(0, TOP, W, 10);
}

/** A red wash under the strip, shown stronger as the marble gets close to it. */
export function drawWarning(c: Ctx) {
  const wash = c.createLinearGradient(0, TOP, 0, TOP + 70);
  wash.addColorStop(0, "rgba(214,69,69,0.55)"); wash.addColorStop(1, "rgba(214,69,69,0)");
  c.fillStyle = wash; c.fillRect(0, TOP, W, 70);
}

export function drawLedge(c: Ctx, kind: Kind, x0: number, x1: number, y: number) {
  const w = x1 - x0;
  if (kind === "concrete") {
    c.fillStyle = "#8e959b"; c.fillRect(x0, y, w, LEDGE);
    c.fillStyle = "#c5cacd"; c.fillRect(x0, y, w, 3);
    c.fillStyle = "#62696f"; c.fillRect(x0, y + LEDGE - 2, w, 2);
    c.fillStyle = "#737a80";
    for (let x = x0 + 9; x < x1 - 4; x += 17) c.fillRect(x, y + 5 + ((x * 7) % 4), 2, 2);
  } else if (kind === "parapet") {
    c.fillStyle = "#b5523b"; c.fillRect(x0, y + 3, w, LEDGE - 3);
    c.fillStyle = "#8e3b29";
    c.fillRect(x0, y + 7, w, 1);
    for (let x = x0 + 12; x < x1 - 2; x += 16) { c.fillRect(x, y + 3, 1, 4); c.fillRect(x - 8, y + 8, 1, 4); }
    c.fillStyle = "#efe6d6"; c.fillRect(x0 - 1, y, w + 2, 4);
    c.fillStyle = "#cfc4b0"; c.fillRect(x0 - 1, y + 3, w + 2, 1);
  } else {
    c.fillStyle = "#c9b458"; c.fillRect(x0, y, w, 6);
    c.fillStyle = "#a99540"; c.fillRect(x0, y + 6, w, 6);
    c.fillStyle = "#e6d88a"; c.fillRect(x0, y + 1, w, 1.5); c.fillRect(x0, y + 7, w, 1.2);
    c.fillStyle = "#7a6a2a";
    for (let x = x0 + 22; x < x1 - 6; x += 30) { c.fillRect(x, y, 2, 6); c.fillRect(x + 11, y + 6, 2, 6); }
    c.fillStyle = "#5a4630";
    c.fillRect(x0 + 4, y - 1, 3, LEDGE + 2); c.fillRect(x1 - 7, y - 1, 3, LEDGE + 2);
  }
}

/** A clay pot with a little cactus, standing on the ledge top at `y`. */
export function drawPot(c: Ctx, x: number, y: number) {
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

/** A small marble to pick up, sitting on the ledge. */
export function drawPick(c: Ctx, x: number, y: number, colour: number) {
  const m = MARBLES[colour % MARBLES.length];
  c.fillStyle = m.glass;
  c.beginPath(); c.arc(x, y - 7, 7, 0, Math.PI * 2); c.fill();
  c.fillStyle = m.eye;
  c.beginPath(); c.ellipse(x, y - 7, 4.6, 1.8, 0.6, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "rgba(0,0,0,0.3)"; c.lineWidth = 1;
  c.beginPath(); c.arc(x, y - 7, 6.5, 0, Math.PI * 2); c.stroke();
  c.fillStyle = "rgba(255,255,255,0.85)";
  c.beginPath(); c.arc(x - 2.4, y - 9.6, 2, 0, Math.PI * 2); c.fill();
}

/** The player's glass marble, rolled by `roll` radians, at size `r`. */
export function drawMarble(c: Ctx, x: number, y: number, roll: number, colour: number, r = R) {
  const m = MARBLES[Math.max(0, Math.min(MARBLES.length - 1, colour))];
  c.save();
  c.translate(x, y);
  c.fillStyle = "rgba(0,0,0,0.18)";
  c.beginPath(); c.ellipse(1.5, r - 1, r * 0.8, r * 0.25, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = m.glass;
  c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
  c.save();
  c.rotate(roll);
  c.fillStyle = m.eye;
  c.beginPath(); c.ellipse(0, 0, r * 0.72, r * 0.26, 0, 0, Math.PI * 2); c.fill();
  c.globalAlpha = 0.5;
  c.beginPath(); c.ellipse(0, 0, r * 0.26, r * 0.62, 0, 0, Math.PI * 2); c.fill();
  c.restore();
  c.fillStyle = "rgba(255,255,255,0.22)";
  c.beginPath(); c.arc(-r * 0.15, -r * 0.15, r * 0.8, 0, Math.PI * 2); c.fill();
  c.fillStyle = "rgba(255,255,255,0.85)";
  c.beginPath(); c.ellipse(-r * 0.38, -r * 0.42, r * 0.28, r * 0.18, -0.6, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "rgba(0,0,0,0.28)"; c.lineWidth = 1;
  c.beginPath(); c.arc(0, 0, r - 0.5, 0, Math.PI * 2); c.stroke();
  c.restore();
}

/** Marbles to pick up come in the strong colours, so they show on every wall. */
const PICKS = [3, 2, 1, 5, 8] as const;

/** Every ledge on screen, with its pot and marble. Rows outside the board are skipped. */
export function drawRows(c: Ctx, rows: readonly Ledge[]) {
  for (let i = 0; i < rows.length; i++) {
    const ledge = rows[i];
    if (ledge.y > H + 4 || ledge.y < -LEDGE - 30) continue;
    drawLedge(c, ledge.kind, ledge.x0, ledge.x1, ledge.y);
    if (ledge.pot >= 0) drawPot(c, ledge.pot, ledge.y);
    if (ledge.pick >= 0 && !ledge.picked) drawPick(c, ledge.pick, ledge.y, PICKS[ledge.row % PICKS.length]);
  }
}

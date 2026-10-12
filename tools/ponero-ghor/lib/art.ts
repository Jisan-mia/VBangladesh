// Canvas art: the tin plate for the card, and the three pictures for ছবির ধাঁধা. Drawn once, never per frame.
import type { Board } from "./board";

export const palette = {
  paper: "#f4ecdc", ink: "#2a2420", muted: "#6f6253",
  tray: "#c23b22", trayDeep: "#8a2614", trim: "#f2c230", well: "#5e1a0e",
  tinLight: "#f5f7f6", tinMid: "#c9cfd1", tinDark: "#8f999d", digit: "#1d3f8f", star: "#f2a900",
};

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });

/** The mela tin plate with its ঘুঁটি, `width` across, top-left at (x, y). */
export function drawPlate(c: CanvasRenderingContext2D, board: Board, x: number, y: number, width: number) {
  const { size, cells } = board, rim = width * 0.075, inner = width - 2 * rim, cell = inner / size, pad = cell * 0.05;
  c.save();
  c.translate(x, y);
  // a soft shadow under the plate
  c.fillStyle = "rgba(42,36,32,0.25)";
  c.beginPath(); c.roundRect(width * 0.02, width * 0.03, width, width, width * 0.06); c.fill();
  c.fillStyle = palette.tray;
  c.beginPath(); c.roundRect(0, 0, width, width, width * 0.06); c.fill();
  // the printed rim: a yellow line with dots, and a rivet in each corner
  c.strokeStyle = palette.trim; c.lineWidth = width * 0.006;
  c.beginPath(); c.roundRect(rim * 0.3, rim * 0.3, width - rim * 0.6, width - rim * 0.6, width * 0.045); c.stroke();
  c.fillStyle = palette.trim;
  const dots = 18, span = width - rim * 1.6;
  for (let i = 0; i <= dots; i++) {
    const along = rim * 0.8 + (span * i) / dots;
    for (const [dx, dy] of [[along, rim * 0.62], [along, width - rim * 0.62], [rim * 0.62, along], [width - rim * 0.62, along]]) {
      c.beginPath(); c.arc(dx, dy, width * 0.005, 0, Math.PI * 2); c.fill();
    }
  }
  for (const [rx, ry] of [[rim * 0.5, rim * 0.5], [width - rim * 0.5, rim * 0.5], [rim * 0.5, width - rim * 0.5], [width - rim * 0.5, width - rim * 0.5]]) {
    const g = c.createRadialGradient(rx - 2, ry - 2, 1, rx, ry, width * 0.016);
    g.addColorStop(0, palette.tinLight); g.addColorStop(1, palette.tinDark);
    c.fillStyle = g; c.beginPath(); c.arc(rx, ry, width * 0.016, 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = palette.well;
  c.beginPath(); c.roundRect(rim - pad, rim - pad, inner + 2 * pad, inner + 2 * pad, cell * 0.12); c.fill();
  // the ঘুঁটি: pressed tin with raised digits
  const font = Math.round(cell * (size > 4 ? 0.5 : 0.56));
  c.textAlign = "center"; c.textBaseline = "middle";
  c.font = `800 ${font}px "Display", "Bangla", sans-serif`;
  cells.forEach((tile, i) => {
    if (!tile) return;
    const tx = rim + (i % size) * cell + pad, ty = rim + Math.floor(i / size) * cell + pad, side = cell - 2 * pad;
    const g = c.createLinearGradient(tx, ty, tx + side, ty + side);
    g.addColorStop(0, palette.tinLight); g.addColorStop(0.55, palette.tinMid); g.addColorStop(1, palette.tinDark);
    c.fillStyle = g; c.beginPath(); c.roundRect(tx, ty, side, side, side * 0.14); c.fill();
    c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = Math.max(1, side * 0.025);
    c.beginPath(); c.roundRect(tx + side * 0.08, ty + side * 0.08, side * 0.84, side * 0.84, side * 0.1); c.stroke();
    const label = digits.format(tile), mx = tx + side / 2, my = ty + side / 2 + font * 0.06;
    c.fillStyle = "rgba(20,30,60,0.45)"; c.fillText(label, mx + font * 0.04, my + font * 0.04);
    c.fillStyle = "rgba(255,255,255,0.9)"; c.fillText(label, mx - font * 0.03, my - font * 0.03);
    c.fillStyle = palette.digit; c.fillText(label, mx, my);
  });
  c.restore();
}

export type Picture = "boat" | "rickshaw" | "wheel";
/** One picture per plate size: a নৌকা on 3×3, a রিকশা on 4×4, the mela's নাগরদোলা on 5×5. */
export const pictureFor = (size: number): Picture => size === 3 ? "boat" : size === 4 ? "rickshaw" : "wheel";
export const PICTURE_NAMES: Record<Picture, string> = { boat: "নৌকা", rickshaw: "রিকশা", wheel: "নাগরদোলা" };

/** A simple drawn picture filling a w×w square. */
export function drawPicture(c: CanvasRenderingContext2D, picture: Picture, w: number) {
  c.save();
  c.lineCap = "round"; c.lineJoin = "round";
  if (picture === "boat") boat(c, w);
  else if (picture === "rickshaw") rickshaw(c, w);
  else wheel(c, w);
  c.restore();
}

function boat(c: CanvasRenderingContext2D, w: number) {
  const sky = c.createLinearGradient(0, 0, 0, w * 0.6);
  sky.addColorStop(0, "#f7b267"); sky.addColorStop(1, "#fde4b8");
  c.fillStyle = sky; c.fillRect(0, 0, w, w * 0.6);
  c.fillStyle = "#f4845f"; c.beginPath(); c.arc(w * 0.76, w * 0.3, w * 0.1, 0, Math.PI * 2); c.fill();
  // the far bank with palms
  c.fillStyle = "#3d7a4a"; c.fillRect(0, w * 0.52, w, w * 0.08);
  for (const px of [0.1, 0.22, 0.86]) {
    c.strokeStyle = "#3d5a32"; c.lineWidth = w * 0.012;
    c.beginPath(); c.moveTo(w * px, w * 0.54); c.lineTo(w * (px + 0.01), w * 0.4); c.stroke();
    c.fillStyle = "#2f6b3a";
    for (let k = 0; k < 5; k++) { c.beginPath(); c.ellipse(w * (px + 0.01), w * 0.4, w * 0.06, w * 0.015, (k * Math.PI) / 5, 0, Math.PI * 2); c.fill(); }
  }
  c.fillStyle = "#3a86b4"; c.fillRect(0, w * 0.6, w, w * 0.4);
  c.strokeStyle = "#8cc4e3"; c.lineWidth = w * 0.01;
  for (let row = 0; row < 4; row++) for (let k = 0; k < 4; k++) {
    const wx = w * (0.08 + k * 0.25 + (row % 2) * 0.12), wy = w * (0.68 + row * 0.08);
    c.beginPath(); c.moveTo(wx, wy); c.quadraticCurveTo(wx + w * 0.04, wy - w * 0.02, wx + w * 0.08, wy); c.stroke();
  }
  // mast and patched sail
  c.strokeStyle = "#5b3a1e"; c.lineWidth = w * 0.016;
  c.beginPath(); c.moveTo(w * 0.47, w * 0.7); c.lineTo(w * 0.47, w * 0.12); c.stroke();
  c.fillStyle = "#f3efe4";
  c.beginPath(); c.moveTo(w * 0.49, w * 0.14); c.quadraticCurveTo(w * 0.72, w * 0.36, w * 0.66, w * 0.62); c.lineTo(w * 0.49, w * 0.62); c.closePath(); c.fill();
  c.fillStyle = "#d1495b"; c.fillRect(w * 0.52, w * 0.3, w * 0.07, w * 0.08);
  c.fillStyle = "#edae49"; c.fillRect(w * 0.55, w * 0.46, w * 0.08, w * 0.07);
  // hull and the bamboo ছই
  c.fillStyle = "#c08b4f";
  c.beginPath(); c.moveTo(w * 0.36, w * 0.66); c.quadraticCurveTo(w * 0.42, w * 0.5, w * 0.62, w * 0.55); c.lineTo(w * 0.66, w * 0.66); c.closePath(); c.fill();
  c.fillStyle = "#6b3e1f";
  c.beginPath(); c.moveTo(w * 0.1, w * 0.62); c.quadraticCurveTo(w * 0.5, w * 0.84, w * 0.92, w * 0.6); c.quadraticCurveTo(w * 0.5, w * 0.72, w * 0.1, w * 0.62); c.fill();
  c.beginPath(); c.moveTo(w * 0.1, w * 0.62); c.quadraticCurveTo(w * 0.5, w * 0.8, w * 0.92, w * 0.6); c.lineTo(w * 0.86, w * 0.66); c.quadraticCurveTo(w * 0.5, w * 0.86, w * 0.16, w * 0.67); c.closePath(); c.fill();
}

function rickshaw(c: CanvasRenderingContext2D, w: number) {
  c.fillStyle = "#e9f1f4"; c.fillRect(0, 0, w, w);
  // a wall with a painted stripe, then the road
  c.fillStyle = "#f6d8a8"; c.fillRect(0, w * 0.12, w, w * 0.5);
  c.fillStyle = "#2a9d8f"; c.fillRect(0, w * 0.5, w, w * 0.04);
  c.fillStyle = "#6c7177"; c.fillRect(0, w * 0.82, w, w * 0.18);
  c.strokeStyle = "#f1f1f1"; c.lineWidth = w * 0.012;
  for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(w * (0.05 + k * 0.27), w * 0.92); c.lineTo(w * (0.17 + k * 0.27), w * 0.92); c.stroke(); }
  const spokes = (cx: number, cy: number, r: number) => {
    c.strokeStyle = "#2a2420"; c.lineWidth = w * 0.02; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = "#9aa3a6"; c.lineWidth = w * 0.005;
    for (let k = 0; k < 12; k++) { const a = (k * Math.PI) / 6; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); c.stroke(); }
    c.fillStyle = "#2a2420"; c.beginPath(); c.arc(cx, cy, w * 0.015, 0, Math.PI * 2); c.fill();
  };
  // frame and pedal
  c.strokeStyle = "#1d3f8f"; c.lineWidth = w * 0.022;
  c.beginPath(); c.moveTo(w * 0.2, w * 0.74); c.lineTo(w * 0.34, w * 0.5); c.lineTo(w * 0.45, w * 0.66); c.lineTo(w * 0.66, w * 0.68); c.stroke();
  c.beginPath(); c.moveTo(w * 0.34, w * 0.5); c.lineTo(w * 0.3, w * 0.4); c.lineTo(w * 0.22, w * 0.39); c.stroke();
  c.beginPath(); c.moveTo(w * 0.38, w * 0.56); c.lineTo(w * 0.36, w * 0.46); c.stroke();
  c.fillStyle = "#2a2420"; c.fillRect(w * 0.32, w * 0.44, w * 0.08, w * 0.025);
  // the seat box with its painted back-board
  c.fillStyle = "#d1495b"; c.beginPath(); c.roundRect(w * 0.5, w * 0.48, w * 0.32, w * 0.2, w * 0.02); c.fill();
  c.fillStyle = "#edae49"; c.fillRect(w * 0.53, w * 0.52, w * 0.26, w * 0.1);
  for (const [fx, color] of [[0.58, "#2a9d8f"], [0.66, "#d1495b"], [0.74, "#1d3f8f"]] as const) {
    c.fillStyle = color; c.beginPath(); c.arc(w * fx, w * 0.57, w * 0.025, 0, Math.PI * 2); c.fill();
  }
  // the folded hood with tassels
  c.fillStyle = "#2f6b3a";
  c.beginPath(); c.moveTo(w * 0.5, w * 0.48); c.quadraticCurveTo(w * 0.52, w * 0.18, w * 0.84, w * 0.2); c.lineTo(w * 0.86, w * 0.48); c.closePath(); c.fill();
  c.strokeStyle = "#f2c230"; c.lineWidth = w * 0.012;
  c.beginPath(); c.moveTo(w * 0.53, w * 0.44); c.quadraticCurveTo(w * 0.55, w * 0.23, w * 0.82, w * 0.24); c.stroke();
  c.fillStyle = "#f2c230";
  for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(w * (0.56 + k * 0.065), w * (0.25 + (k === 0 ? 0.05 : 0)), w * 0.014, 0, Math.PI * 2); c.fill(); }
  spokes(w * 0.2, w * 0.76, w * 0.1);
  spokes(w * 0.68, w * 0.72, w * 0.14);
}

function wheel(c: CanvasRenderingContext2D, w: number) {
  const sky = c.createLinearGradient(0, 0, 0, w);
  sky.addColorStop(0, "#8ecae6"); sky.addColorStop(1, "#e0f2f7");
  c.fillStyle = sky; c.fillRect(0, 0, w, w);
  c.fillStyle = "#7cb342"; c.fillRect(0, w * 0.84, w, w * 0.16);
  // bunting across the top
  c.strokeStyle = "#6f6253"; c.lineWidth = w * 0.004;
  c.beginPath(); c.moveTo(0, w * 0.05); c.quadraticCurveTo(w * 0.5, w * 0.14, w, w * 0.05); c.stroke();
  const flags = ["#d1495b", "#edae49", "#2a9d8f", "#1d3f8f"];
  for (let k = 0; k < 12; k++) {
    const fx = (k + 0.5) * w / 12, fy = w * 0.05 + Math.sin((k + 0.5) / 12 * Math.PI) * w * 0.045;
    c.fillStyle = flags[k % 4]; c.beginPath(); c.moveTo(fx - w * 0.025, fy); c.lineTo(fx + w * 0.025, fy); c.lineTo(fx, fy + w * 0.05); c.closePath(); c.fill();
  }
  const cx = w * 0.5, cy = w * 0.46, r = w * 0.3;
  // the stand
  c.strokeStyle = "#8a2614"; c.lineWidth = w * 0.025;
  c.beginPath(); c.moveTo(w * 0.3, w * 0.86); c.lineTo(cx, cy); c.lineTo(w * 0.7, w * 0.86); c.stroke();
  // rim and spokes
  c.strokeStyle = "#c23b22"; c.lineWidth = w * 0.018; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
  c.lineWidth = w * 0.008; c.beginPath(); c.arc(cx, cy, r * 0.62, 0, Math.PI * 2); c.stroke();
  c.strokeStyle = "#5e1a0e"; c.lineWidth = w * 0.006;
  for (let k = 0; k < 16; k++) { const a = (k * Math.PI) / 8; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); c.stroke(); }
  // eight swinging seats
  const seats = ["#edae49", "#2a9d8f", "#d1495b", "#1d3f8f"];
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4, sx = cx + Math.cos(a) * r, sy = cy + Math.sin(a) * r;
    c.strokeStyle = "#2a2420"; c.lineWidth = w * 0.005; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx, sy + w * 0.04); c.stroke();
    c.fillStyle = seats[k % 4]; c.beginPath(); c.roundRect(sx - w * 0.045, sy + w * 0.035, w * 0.09, w * 0.06, w * 0.015); c.fill();
  }
  c.fillStyle = "#f2c230"; c.beginPath(); c.arc(cx, cy, w * 0.03, 0, Math.PI * 2); c.fill();
}

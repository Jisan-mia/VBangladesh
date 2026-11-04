// Canvas art, all drawn in code: one enamel palette per world, the tin plate (title art, card, story), and the four
// pictures for the picture levels. Everything is drawn once into an offscreen canvas and reused, never per frame.
// IP: no brand's toy look (no black-and-white plastic squares, no logo or box art). Ours is an enamelled tin plate with a
// printed dotted rim, corner rivets, pressed-tin ঘুঁটি with raised Bangla digits, and our own drawn pictures.
import type { Board } from "./board";
import type { Look, Picture } from "./levels";

export type Palette = {
  paper: string; ink: string; muted: string;
  tray: string; trayDeep: string; trim: string; well: string; digit: string; star: string;
};

export const tin = { light: "#f5f7f6", mid: "#c9cfd1", dark: "#8f999d" };

/** One enamel per world: red at the ghat, blue on the street, green on the roofs, a night tin at the fair. */
export const PALETTES: readonly Palette[] = [
  { paper: "#f4ecdc", ink: "#2a2420", muted: "#6f6253", tray: "#c23b22", trayDeep: "#8a2614", trim: "#f2c230", well: "#5e1a0e", digit: "#1d3f8f", star: "#f2a900" },
  { paper: "#e7eef7", ink: "#14213d", muted: "#4f5d78", tray: "#2856a6", trayDeep: "#173a78", trim: "#f2c230", well: "#0f2350", digit: "#b3261e", star: "#f2a900" },
  { paper: "#eaf2e3", ink: "#1c2a20", muted: "#52654f", tray: "#2f8a5b", trayDeep: "#1d5e3c", trim: "#f6df6e", well: "#123d27", digit: "#8a2614", star: "#e09a00" },
  { paper: "#1c1a3a", ink: "#f6efe0", muted: "#b6b0d6", tray: "#3a3375", trayDeep: "#221d52", trim: "#f2b630", well: "#0d0b26", digit: "#3a2a86", star: "#f7c948" },
];
export const paletteOf = (world: number) => PALETTES[Math.max(0, Math.min(PALETTES.length - 1, world))];

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });

/** A canvas with its context scaled so drawing happens in a `space` × `space` square, centred and fitted into width × height. */
export function begin(canvas: HTMLCanvasElement, width: number, height: number, space = 1000) {
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const c = canvas.getContext("2d");
  if (!c) return null;
  const scale = Math.min(width, height) / space * ratio;
  c.setTransform(scale, 0, 0, scale, (width * ratio - space * scale) / 2, (height * ratio - space * scale) / 2);
  return c;
}

type PlateOptions = { picture?: CanvasImageSource | null; look?: Look; whole?: boolean };

/**
 * The tin plate with its ঘুঁটি, `width` across, top-left at (x, y). With a picture, each ঘুঁটি shows its slice (and the
 * corner digit the look allows); `whole` fills the gap with the last slice, for a finished picture.
 */
export function drawPlate(c: CanvasRenderingContext2D, board: Board, x: number, y: number, width: number, colors: Palette, options: PlateOptions = {}) {
  const { size, cells } = board, rim = width * 0.075, inner = width - 2 * rim, cell = inner / size, pad = cell * 0.045;
  const { picture, look = "digits", whole = false } = options;
  c.save();
  c.translate(x, y);
  c.fillStyle = "rgba(20,16,12,0.28)";
  c.beginPath(); c.roundRect(width * 0.02, width * 0.03, width, width, width * 0.06); c.fill();
  c.fillStyle = colors.tray;
  c.beginPath(); c.roundRect(0, 0, width, width, width * 0.06); c.fill();
  // enamel shine along the top
  const shine = c.createLinearGradient(0, 0, 0, width);
  shine.addColorStop(0, "rgba(255,255,255,0.22)"); shine.addColorStop(0.18, "rgba(255,255,255,0)"); shine.addColorStop(1, "rgba(0,0,0,0.16)");
  c.fillStyle = shine; c.beginPath(); c.roundRect(0, 0, width, width, width * 0.06); c.fill();
  // the printed rim: a trim line with dots, and a rivet in each corner
  c.strokeStyle = colors.trim; c.lineWidth = width * 0.006;
  c.beginPath(); c.roundRect(rim * 0.3, rim * 0.3, width - rim * 0.6, width - rim * 0.6, width * 0.045); c.stroke();
  c.fillStyle = colors.trim;
  const dots = 18, span = width - rim * 1.6;
  for (let i = 0; i <= dots; i++) {
    const along = rim * 0.8 + (span * i) / dots;
    for (const [dx, dy] of [[along, rim * 0.62], [along, width - rim * 0.62], [rim * 0.62, along], [width - rim * 0.62, along]]) {
      c.beginPath(); c.arc(dx, dy, width * 0.005, 0, Math.PI * 2); c.fill();
    }
  }
  for (const [rx, ry] of [[rim * 0.5, rim * 0.5], [width - rim * 0.5, rim * 0.5], [rim * 0.5, width - rim * 0.5], [width - rim * 0.5, width - rim * 0.5]]) {
    const g = c.createRadialGradient(rx - 2, ry - 2, 1, rx, ry, width * 0.016);
    g.addColorStop(0, tin.light); g.addColorStop(1, tin.dark);
    c.fillStyle = g; c.beginPath(); c.arc(rx, ry, width * 0.016, 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = colors.well;
  c.beginPath(); c.roundRect(rim - pad, rim - pad, inner + 2 * pad, inner + 2 * pad, cell * 0.12); c.fill();
  const font = Math.round(cell * (size > 4 ? 0.5 : 0.56));
  c.textAlign = "center"; c.textBaseline = "middle";
  const count = size * size;
  for (let i = 0; i < count; i++) {
    const tile = cells[i] || (whole && i === count - 1 ? count : 0);
    if (!tile) continue;
    const tx = rim + (i % size) * cell + pad, ty = rim + Math.floor(i / size) * cell + pad, side = cell - 2 * pad;
    const home = tile - 1;
    if (picture) {
      const sw = (picture as HTMLCanvasElement).width / size, sh = (picture as HTMLCanvasElement).height / size;
      c.save();
      c.beginPath(); c.roundRect(tx, ty, side, side, side * 0.08); c.clip();
      c.drawImage(picture, (home % size) * sw, Math.floor(home / size) * sh, sw, sh, tx, ty, side, side);
      c.restore();
      c.strokeStyle = "rgba(255,255,255,0.55)"; c.lineWidth = Math.max(1, side * 0.02);
      c.beginPath(); c.roundRect(tx + 1, ty + 1, side - 2, side - 2, side * 0.08); c.stroke();
      if ((look === "picture" || look === "faint") && tile < count) {
        const small = Math.round(side * 0.24);
        c.globalAlpha = look === "faint" ? 0.4 : 1;
        c.fillStyle = "rgba(255,255,255,0.88)";
        c.beginPath(); c.roundRect(tx + side * 0.05, ty + side * 0.05, small * 1.5, small * 1.15, small * 0.3); c.fill();
        c.fillStyle = colors.digit; c.font = `800 ${small}px "Display", "Bangla", sans-serif`;
        c.fillText(digits.format(tile), tx + side * 0.05 + small * 0.75, ty + side * 0.05 + small * 0.62);
        c.globalAlpha = 1;
      }
      continue;
    }
    const g = c.createLinearGradient(tx, ty, tx + side, ty + side);
    g.addColorStop(0, tin.light); g.addColorStop(0.55, tin.mid); g.addColorStop(1, tin.dark);
    c.fillStyle = g; c.beginPath(); c.roundRect(tx, ty, side, side, side * 0.14); c.fill();
    c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = Math.max(1, side * 0.025);
    c.beginPath(); c.roundRect(tx + side * 0.08, ty + side * 0.08, side * 0.84, side * 0.84, side * 0.1); c.stroke();
    if (tile === count) continue;
    c.font = `800 ${font}px "Display", "Bangla", sans-serif`;
    const label = digits.format(tile), mx = tx + side / 2, my = ty + side / 2 + font * 0.06;
    c.fillStyle = "rgba(20,30,60,0.45)"; c.fillText(label, mx + font * 0.04, my + font * 0.04);
    c.fillStyle = "rgba(255,255,255,0.9)"; c.fillText(label, mx - font * 0.03, my - font * 0.03);
    c.fillStyle = colors.digit; c.fillText(label, mx, my);
  }
  c.restore();
}

// ---- the pictures: every slice carries something of its own, so a picture-only plate is fair ----

export const PICTURE_NAMES: Record<Picture, string> = { boat: "নৌকা", rickshaw: "রিকশা", kites: "ঘুড়ির আকাশ", wheel: "নাগরদোলা" };

/** A picture filling a w×w square. */
export function drawPicture(c: CanvasRenderingContext2D, picture: Picture, w: number) {
  c.save();
  c.lineCap = "round"; c.lineJoin = "round";
  if (picture === "boat") boat(c, w);
  else if (picture === "rickshaw") rickshaw(c, w);
  else if (picture === "kites") kites(c, w);
  else wheel(c, w);
  c.restore();
}

/** The picture drawn once into its own canvas, `px` square (for slicing onto ঘুঁটি). */
export function pictureSheet(picture: Picture, px: number) {
  const sheet = document.createElement("canvas");
  sheet.width = sheet.height = px;
  const c = sheet.getContext("2d");
  if (c) drawPicture(c, picture, px);
  return sheet;
}

function birds(c: CanvasRenderingContext2D, w: number, points: ReadonlyArray<readonly [number, number, number]>, color: string) {
  c.strokeStyle = color; c.lineWidth = w * 0.008;
  for (const [bx, by, s] of points) {
    c.beginPath(); c.moveTo(w * (bx - s), w * by); c.quadraticCurveTo(w * (bx - s / 2), w * (by - s * 0.7), w * bx, w * by);
    c.quadraticCurveTo(w * (bx + s / 2), w * (by - s * 0.7), w * (bx + s), w * by); c.stroke();
  }
}

function boat(c: CanvasRenderingContext2D, w: number) {
  const sky = c.createLinearGradient(0, 0, 0, w * 0.6);
  sky.addColorStop(0, "#f08a4b"); sky.addColorStop(0.55, "#f7b267"); sky.addColorStop(1, "#fde4b8");
  c.fillStyle = sky; c.fillRect(0, 0, w, w * 0.6);
  // a cloud, birds and the sun, so the sky slices differ
  c.fillStyle = "#fff3dd";
  for (const [cx, cy, r] of [[0.12, 0.2, 0.06], [0.19, 0.17, 0.075], [0.27, 0.21, 0.055]]) { c.beginPath(); c.arc(w * cx, w * cy, w * r, 0, Math.PI * 2); c.fill(); }
  birds(c, w, [[0.2, 0.08, 0.03], [0.29, 0.11, 0.022], [0.62, 0.07, 0.025]], "#5b3a1e");
  c.fillStyle = "#e4572e"; c.beginPath(); c.arc(w * 0.82, w * 0.24, w * 0.09, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#f6c453"; c.beginPath(); c.arc(w * 0.82, w * 0.24, w * 0.06, 0, Math.PI * 2); c.fill();
  // the far bank with palms
  c.fillStyle = "#3d7a4a"; c.fillRect(0, w * 0.52, w, w * 0.08);
  for (const px of [0.08, 0.2, 0.86, 0.95]) {
    c.strokeStyle = "#3d5a32"; c.lineWidth = w * 0.012;
    c.beginPath(); c.moveTo(w * px, w * 0.54); c.lineTo(w * (px + 0.01), w * 0.4); c.stroke();
    c.fillStyle = "#2f6b3a";
    for (let k = 0; k < 5; k++) { c.beginPath(); c.ellipse(w * (px + 0.01), w * 0.4, w * 0.06, w * 0.015, (k * Math.PI) / 5, 0, Math.PI * 2); c.fill(); }
  }
  const river = c.createLinearGradient(0, w * 0.6, 0, w);
  river.addColorStop(0, "#4f9ac4"); river.addColorStop(1, "#1f5f8b");
  c.fillStyle = river; c.fillRect(0, w * 0.6, w, w * 0.4);
  c.strokeStyle = "#a9d6ee"; c.lineWidth = w * 0.01;
  for (let row = 0; row < 5; row++) for (let k = 0; k < 4; k++) {
    const wx = w * (0.04 + k * 0.25 + (row % 2) * 0.12), wy = w * (0.66 + row * 0.07);
    c.beginPath(); c.moveTo(wx, wy); c.quadraticCurveTo(wx + w * 0.04, wy - w * 0.02, wx + w * 0.08, wy); c.stroke();
  }
  // a water lily bottom-left and a small fish bottom-right
  c.fillStyle = "#3f8f4f"; c.beginPath(); c.ellipse(w * 0.12, w * 0.9, w * 0.07, w * 0.025, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#f2a7c3"; c.beginPath(); c.arc(w * 0.13, w * 0.88, w * 0.022, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#f6c453"; c.beginPath(); c.ellipse(w * 0.84, w * 0.9, w * 0.04, w * 0.018, 0.2, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.moveTo(w * 0.8, w * 0.89); c.lineTo(w * 0.77, w * 0.87); c.lineTo(w * 0.77, w * 0.92); c.closePath(); c.fill();
  // mast and patched sail
  c.strokeStyle = "#5b3a1e"; c.lineWidth = w * 0.016;
  c.beginPath(); c.moveTo(w * 0.47, w * 0.7); c.lineTo(w * 0.47, w * 0.1); c.stroke();
  c.fillStyle = "#f3efe4";
  c.beginPath(); c.moveTo(w * 0.49, w * 0.12); c.quadraticCurveTo(w * 0.74, w * 0.36, w * 0.68, w * 0.62); c.lineTo(w * 0.49, w * 0.62); c.closePath(); c.fill();
  c.fillStyle = "#d1495b"; c.fillRect(w * 0.52, w * 0.28, w * 0.07, w * 0.08);
  c.fillStyle = "#edae49"; c.fillRect(w * 0.55, w * 0.46, w * 0.08, w * 0.07);
  c.fillStyle = "#2a9d8f"; c.beginPath(); c.moveTo(w * 0.47, w * 0.1); c.lineTo(w * 0.38, w * 0.13); c.lineTo(w * 0.47, w * 0.16); c.closePath(); c.fill();
  // hull and the bamboo ছই
  c.fillStyle = "#c08b4f";
  c.beginPath(); c.moveTo(w * 0.3, w * 0.66); c.quadraticCurveTo(w * 0.38, w * 0.48, w * 0.6, w * 0.54); c.lineTo(w * 0.64, w * 0.66); c.closePath(); c.fill();
  c.strokeStyle = "#8a5a2b"; c.lineWidth = w * 0.006;
  for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(w * (0.34 + k * 0.06), w * 0.66); c.lineTo(w * (0.36 + k * 0.05), w * 0.54); c.stroke(); }
  c.fillStyle = "#6b3e1f";
  c.beginPath(); c.moveTo(w * 0.08, w * 0.62); c.quadraticCurveTo(w * 0.5, w * 0.84, w * 0.94, w * 0.6); c.lineTo(w * 0.88, w * 0.67); c.quadraticCurveTo(w * 0.5, w * 0.88, w * 0.14, w * 0.68); c.closePath(); c.fill();
  c.strokeStyle = "#e9c46a"; c.lineWidth = w * 0.008;
  c.beginPath(); c.moveTo(w * 0.14, w * 0.66); c.quadraticCurveTo(w * 0.5, w * 0.83, w * 0.88, w * 0.64); c.stroke();
}

function rickshaw(c: CanvasRenderingContext2D, w: number) {
  // a painted wall: a sky strip, a cinema poster, a row of flowers, then the street
  const sky = c.createLinearGradient(0, 0, 0, w * 0.2);
  sky.addColorStop(0, "#7cc6e8"); sky.addColorStop(1, "#c8ecf7");
  c.fillStyle = sky; c.fillRect(0, 0, w, w * 0.2);
  birds(c, w, [[0.1, 0.08, 0.025], [0.18, 0.12, 0.018]], "#2a4f6e");
  c.fillStyle = "#ffd166"; c.beginPath(); c.arc(w * 0.62, w * 0.07, w * 0.045, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#ffffffd9";
  for (const [cx, cy, r] of [[0.36, 0.07, 0.03], [0.41, 0.06, 0.04], [0.46, 0.075, 0.028]]) { c.beginPath(); c.arc(w * cx, w * cy, w * r, 0, Math.PI * 2); c.fill(); }
  // Dhaka's tangle of wires, with crows sitting on them
  c.strokeStyle = "#2b2b2b"; c.lineWidth = w * 0.004;
  for (const [y0, sag] of [[0.11, 0.04], [0.15, 0.03]] as const) { c.beginPath(); c.moveTo(0, w * y0); c.quadraticCurveTo(w * 0.5, w * (y0 + sag), w, w * (y0 - 0.02)); c.stroke(); }
  c.fillStyle = "#1b1b1b";
  for (const [bx, by] of [[0.3, 0.125], [0.8, 0.12], [0.88, 0.135]] as const) {
    c.beginPath(); c.ellipse(w * bx, w * (by - 0.012), w * 0.014, w * 0.01, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(w * (bx + 0.012), w * (by - 0.022), w * 0.007, 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = "#f6d8a8"; c.fillRect(0, w * 0.2, w, w * 0.44);
  c.fillStyle = "#e07a5f"; c.fillRect(0, w * 0.2, w, w * 0.025);
  // the poster, top-left: a hero's round face and a title band
  c.fillStyle = "#ffd166"; c.fillRect(w * 0.04, w * 0.26, w * 0.22, w * 0.28);
  c.fillStyle = "#d1495b"; c.fillRect(w * 0.04, w * 0.47, w * 0.22, w * 0.07);
  c.fillStyle = "#8d5524"; c.beginPath(); c.arc(w * 0.15, w * 0.35, w * 0.055, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#2a2420"; c.beginPath(); c.arc(w * 0.15, w * 0.32, w * 0.055, Math.PI, 0); c.fill();
  // a shop sign, top-right
  c.fillStyle = "#2a9d8f"; c.fillRect(w * 0.72, w * 0.25, w * 0.25, w * 0.1);
  c.fillStyle = "#fefae0";
  for (let k = 0; k < 4; k++) c.fillRect(w * (0.745 + k * 0.055), w * 0.28, w * 0.035, w * 0.04);
  // flowers along the wall
  const petals = ["#d1495b", "#edae49", "#1d3f8f", "#2a9d8f", "#e07a5f"];
  for (let k = 0; k < 9; k++) {
    const fx = w * (0.06 + k * 0.11), fy = w * 0.6;
    c.fillStyle = petals[k % 5];
    for (let p = 0; p < 5; p++) { const a = (p * Math.PI * 2) / 5; c.beginPath(); c.arc(fx + Math.cos(a) * w * 0.016, fy + Math.sin(a) * w * 0.016, w * 0.013, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = "#fefae0"; c.beginPath(); c.arc(fx, fy, w * 0.009, 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = "#5b6066"; c.fillRect(0, w * 0.64, w, w * 0.36);
  c.fillStyle = "#4a4f55"; c.fillRect(0, w * 0.64, w, w * 0.03);
  c.strokeStyle = "#f1f1f1"; c.lineWidth = w * 0.012;
  for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(w * (0.02 + k * 0.22), w * 0.95); c.lineTo(w * (0.13 + k * 0.22), w * 0.95); c.stroke(); }
  const spokes = (cx: number, cy: number, r: number) => {
    c.strokeStyle = "#1b1b1b"; c.lineWidth = w * 0.022; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = "#c9cfd1"; c.lineWidth = w * 0.005;
    for (let k = 0; k < 12; k++) { const a = (k * Math.PI) / 6; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); c.stroke(); }
    c.fillStyle = "#d1495b"; c.beginPath(); c.arc(cx, cy, w * 0.018, 0, Math.PI * 2); c.fill();
  };
  // frame, handlebar and the puller's seat
  c.strokeStyle = "#1d3f8f"; c.lineWidth = w * 0.024;
  c.beginPath(); c.moveTo(w * 0.16, w * 0.8); c.lineTo(w * 0.3, w * 0.56); c.lineTo(w * 0.42, w * 0.74); c.lineTo(w * 0.62, w * 0.76); c.stroke();
  c.beginPath(); c.moveTo(w * 0.3, w * 0.56); c.lineTo(w * 0.27, w * 0.46); c.lineTo(w * 0.17, w * 0.45); c.stroke();
  c.fillStyle = "#edae49"; c.beginPath(); c.arc(w * 0.17, w * 0.45, w * 0.018, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.moveTo(w * 0.35, w * 0.62); c.lineTo(w * 0.34, w * 0.52); c.stroke();
  c.fillStyle = "#2a2420"; c.fillRect(w * 0.3, w * 0.5, w * 0.09, w * 0.03);
  // the seat box with its painted back-board
  c.fillStyle = "#d1495b"; c.beginPath(); c.roundRect(w * 0.48, w * 0.52, w * 0.36, w * 0.22, w * 0.02); c.fill();
  c.fillStyle = "#edae49"; c.fillRect(w * 0.51, w * 0.56, w * 0.3, w * 0.12);
  for (const [fx, color] of [[0.57, "#2a9d8f"], [0.66, "#d1495b"], [0.75, "#1d3f8f"]] as const) {
    c.fillStyle = color; c.beginPath(); c.arc(w * fx, w * 0.62, w * 0.028, 0, Math.PI * 2); c.fill();
  }
  // the folded hood with tassels
  c.fillStyle = "#2f6b3a";
  c.beginPath(); c.moveTo(w * 0.48, w * 0.52); c.quadraticCurveTo(w * 0.5, w * 0.22, w * 0.86, w * 0.24); c.lineTo(w * 0.88, w * 0.52); c.closePath(); c.fill();
  c.strokeStyle = "#f2c230"; c.lineWidth = w * 0.012;
  c.beginPath(); c.moveTo(w * 0.51, w * 0.48); c.quadraticCurveTo(w * 0.53, w * 0.27, w * 0.84, w * 0.28); c.stroke();
  c.fillStyle = "#f2c230";
  for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(w * (0.54 + k * 0.06), w * (0.29 + (k === 0 ? 0.06 : 0)), w * 0.014, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = "#d1495b";
  for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(w * (0.56 + k * 0.08), w * 0.52); c.lineTo(w * (0.58 + k * 0.08), w * 0.57); c.lineTo(w * (0.54 + k * 0.08), w * 0.57); c.closePath(); c.fill(); }
  spokes(w * 0.16, w * 0.82, w * 0.1);
  spokes(w * 0.66, w * 0.8, w * 0.14);
}

function kite(c: CanvasRenderingContext2D, x: number, y: number, s: number, tilt: number, body: string, stripe: string, w: number) {
  c.save();
  c.translate(x, y); c.rotate(tilt);
  c.fillStyle = body;
  c.beginPath(); c.moveTo(0, -s); c.lineTo(s * 0.8, 0); c.lineTo(0, s); c.lineTo(-s * 0.8, 0); c.closePath(); c.fill();
  c.fillStyle = stripe;
  c.beginPath(); c.moveTo(0, -s); c.lineTo(s * 0.8, 0); c.lineTo(0, 0); c.closePath(); c.fill();
  c.strokeStyle = "rgba(0,0,0,0.35)"; c.lineWidth = w * 0.003;
  c.beginPath(); c.moveTo(0, -s); c.lineTo(0, s); c.moveTo(-s * 0.8, 0); c.lineTo(s * 0.8, 0); c.stroke();
  c.fillStyle = stripe; c.beginPath(); c.moveTo(0, s); c.lineTo(s * 0.25, s * 1.35); c.lineTo(-s * 0.25, s * 1.35); c.closePath(); c.fill();
  c.restore();
}

function kites(c: CanvasRenderingContext2D, w: number) {
  // সাকরাইন: a winter afternoon over পুরান ঢাকা, kites everywhere, roofs below
  const sky = c.createLinearGradient(0, 0, 0, w * 0.72);
  sky.addColorStop(0, "#3d7fd1"); sky.addColorStop(0.6, "#8cc8f0"); sky.addColorStop(1, "#f7d9a8");
  c.fillStyle = sky; c.fillRect(0, 0, w, w);
  c.fillStyle = "#fff6e0"; c.beginPath(); c.arc(w * 0.12, w * 0.12, w * 0.06, 0, Math.PI * 2); c.fill();
  c.fillStyle = "rgba(255,255,255,0.8)";
  for (const [cx, cy, r] of [[0.62, 0.12, 0.05], [0.69, 0.1, 0.06], [0.76, 0.13, 0.045]]) { c.beginPath(); c.arc(w * cx, w * cy, w * r, 0, Math.PI * 2); c.fill(); }
  const flying: ReadonlyArray<readonly [number, number, number, number, string, string]> = [
    [0.33, 0.1, 0.06, 0.3, "#e63946", "#ffd166"], [0.88, 0.3, 0.055, -0.2, "#2a9d8f", "#fefae0"], [0.18, 0.36, 0.05, -0.35, "#ffd166", "#e63946"],
    [0.56, 0.3, 0.07, 0.15, "#7b2cbf", "#f4a261"], [0.42, 0.5, 0.045, -0.1, "#06d6a0", "#073b4c"], [0.8, 0.52, 0.05, 0.4, "#ef476f", "#fff"],
    [0.08, 0.6, 0.04, 0.25, "#118ab2", "#ffd166"], [0.66, 0.06, 0.035, -0.3, "#f77f00", "#003049"],
  ];
  // strings down to the roofs
  c.strokeStyle = "rgba(60,40,30,0.5)"; c.lineWidth = w * 0.003;
  for (const [kx, ky, s] of flying) { c.beginPath(); c.moveTo(w * kx, w * (ky + s)); c.quadraticCurveTo(w * (kx + 0.08), w * 0.6, w * (0.2 + kx * 0.6), w * 0.8); c.stroke(); }
  for (const [kx, ky, s, tilt, body, stripe] of flying) kite(c, w * kx, w * ky, w * s, tilt, body, stripe, w);
  // the old roofs: three heights, a water tank, a railing, a boy with a লাটাই
  const roofs: ReadonlyArray<readonly [number, number, number, string]> = [[0, 0.72, 0.36, "#c97b63"], [0.34, 0.66, 0.34, "#e9c46a"], [0.66, 0.74, 0.34, "#a8dadc"]];
  for (const [rx, ry, rw, color] of roofs) {
    c.fillStyle = color; c.fillRect(w * rx, w * ry, w * rw, w * (1 - ry));
    c.fillStyle = "rgba(0,0,0,0.12)"; c.fillRect(w * rx, w * ry, w * rw, w * 0.02);
    c.fillStyle = "rgba(40,30,20,0.55)";
    for (let k = 0; k < 3; k++) c.fillRect(w * (rx + 0.04 + k * 0.1), w * (ry + 0.1), w * 0.05, w * 0.08);
  }
  c.fillStyle = "#264653"; c.fillRect(w * 0.44, w * 0.57, w * 0.1, w * 0.09);
  c.fillStyle = "#2a9d8f"; c.beginPath(); c.ellipse(w * 0.49, w * 0.57, w * 0.05, w * 0.015, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#3a2a20"; c.lineWidth = w * 0.006;
  c.beginPath(); c.moveTo(w * 0.66, w * 0.7); c.lineTo(w * 1, w * 0.7); c.stroke();
  for (let k = 0; k < 7; k++) { c.beginPath(); c.moveTo(w * (0.68 + k * 0.05), w * 0.7); c.lineTo(w * (0.68 + k * 0.05), w * 0.74); c.stroke(); }
  c.fillStyle = "#3a2a20"; c.beginPath(); c.arc(w * 0.22, w * 0.63, w * 0.025, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#d1495b"; c.fillRect(w * 0.2, w * 0.655, w * 0.04, w * 0.065);
  c.fillStyle = "#f4a261"; c.beginPath(); c.arc(w * 0.27, w * 0.67, w * 0.018, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#6d4c41"; c.fillRect(w * 0.035, w * 0.86, w * 0.08, w * 0.06);
  c.fillStyle = "#8d6e63"; c.fillRect(w * 0.86, w * 0.88, w * 0.09, w * 0.05);
}

function wheel(c: CanvasRenderingContext2D, w: number) {
  // the fair at night: a deep sky with a moon and stars, string lights, the নাগরদোলা lit up, stalls below
  const sky = c.createLinearGradient(0, 0, 0, w);
  sky.addColorStop(0, "#0f1a4a"); sky.addColorStop(0.65, "#3a2f7a"); sky.addColorStop(1, "#7a3d6e");
  c.fillStyle = sky; c.fillRect(0, 0, w, w);
  c.fillStyle = "#fdf3c4"; c.beginPath(); c.arc(w * 0.86, w * 0.14, w * 0.06, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#1a2457"; c.beginPath(); c.arc(w * 0.88, w * 0.12, w * 0.05, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#fff8d6";
  const stars: ReadonlyArray<readonly [number, number]> = [[0.08, 0.2], [0.18, 0.08], [0.3, 0.15], [0.62, 0.06], [0.72, 0.2], [0.05, 0.42], [0.94, 0.4], [0.4, 0.05], [0.55, 0.16], [0.92, 0.6], [0.12, 0.55]];
  for (const [sx, sy] of stars) { c.beginPath(); c.arc(w * sx, w * sy, w * 0.006, 0, Math.PI * 2); c.fill(); }
  // সপ্তর্ষি in the top-left corner, and a pennant flying from the top of the wheel
  const dipper: ReadonlyArray<readonly [number, number]> = [[0.03, 0.07], [0.07, 0.06], [0.1, 0.08], [0.13, 0.1], [0.17, 0.09], [0.18, 0.14], [0.14, 0.15]];
  c.strokeStyle = "#fff8d680"; c.lineWidth = w * 0.003;
  c.beginPath(); dipper.forEach(([sx, sy], k) => k ? c.lineTo(w * sx, w * sy) : c.moveTo(w * sx, w * sy)); c.lineTo(w * dipper[3][0], w * dipper[3][1]); c.stroke();
  c.fillStyle = "#fff8d6";
  for (const [sx, sy] of dipper) { c.beginPath(); c.arc(w * sx, w * sy, w * 0.008, 0, Math.PI * 2); c.fill(); }
  c.strokeStyle = "#c9cfd1"; c.lineWidth = w * 0.006;
  c.beginPath(); c.moveTo(w * 0.5, w * 0.23); c.lineTo(w * 0.5, w * 0.1); c.stroke();
  c.fillStyle = "#e63946"; c.beginPath(); c.moveTo(w * 0.5, w * 0.1); c.lineTo(w * 0.58, w * 0.125); c.lineTo(w * 0.5, w * 0.15); c.closePath(); c.fill();
  // a firework bursting on the left, a paper ফানুস rising on the right
  c.strokeStyle = "#ff8fab"; c.lineWidth = w * 0.006;
  for (let k = 0; k < 12; k++) { const a = (k * Math.PI) / 6; c.beginPath(); c.moveTo(w * 0.1 + Math.cos(a) * w * 0.02, w * 0.33 + Math.sin(a) * w * 0.02); c.lineTo(w * 0.1 + Math.cos(a) * w * 0.07, w * 0.33 + Math.sin(a) * w * 0.07); c.stroke(); }
  c.fillStyle = "#fff3b0"; c.beginPath(); c.arc(w * 0.1, w * 0.33, w * 0.012, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#f4a261"; c.beginPath(); c.moveTo(w * 0.87, w * 0.27); c.lineTo(w * 0.93, w * 0.27); c.lineTo(w * 0.95, w * 0.37); c.lineTo(w * 0.85, w * 0.37); c.closePath(); c.fill();
  c.fillStyle = "#ffe8a3"; c.fillRect(w * 0.88, w * 0.355, w * 0.04, w * 0.015);
  // two strings of lights across the top
  const bulbs = ["#ffd166", "#ef476f", "#06d6a0", "#118ab2", "#f78c6b"];
  for (const [y0, sag] of [[0.03, 0.08], [0.24, 0.06]] as const) {
    c.strokeStyle = "#2b2140"; c.lineWidth = w * 0.004;
    c.beginPath(); c.moveTo(0, w * y0); c.quadraticCurveTo(w * 0.5, w * (y0 + sag * 2), w, w * y0); c.stroke();
    for (let k = 0; k < 14; k++) {
      const t = (k + 0.5) / 14, bx = w * t, by = w * (y0 + sag * 2 * 2 * t * (1 - t));
      c.fillStyle = bulbs[k % 5]; c.beginPath(); c.arc(bx, by + w * 0.012, w * 0.011, 0, Math.PI * 2); c.fill();
    }
  }
  const cx = w * 0.5, cy = w * 0.5, r = w * 0.27;
  c.strokeStyle = "#c9cfd1"; c.lineWidth = w * 0.024;
  c.beginPath(); c.moveTo(w * 0.3, w * 0.86); c.lineTo(cx, cy); c.lineTo(w * 0.7, w * 0.86); c.stroke();
  c.strokeStyle = "#f2b630"; c.lineWidth = w * 0.016; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
  c.lineWidth = w * 0.008; c.beginPath(); c.arc(cx, cy, r * 0.6, 0, Math.PI * 2); c.stroke();
  c.strokeStyle = "#e9e3ff"; c.lineWidth = w * 0.005;
  for (let k = 0; k < 16; k++) { const a = (k * Math.PI) / 8; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); c.stroke(); }
  for (let k = 0; k < 16; k++) { const a = (k * Math.PI) / 8 + Math.PI / 16; c.fillStyle = bulbs[k % 5]; c.beginPath(); c.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, w * 0.008, 0, Math.PI * 2); c.fill(); }
  const seats = ["#ffd166", "#06d6a0", "#ef476f", "#118ab2"];
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4, sx = cx + Math.cos(a) * r, sy = cy + Math.sin(a) * r;
    c.strokeStyle = "#e9e3ff"; c.lineWidth = w * 0.004; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx, sy + w * 0.035); c.stroke();
    c.fillStyle = seats[k % 4]; c.beginPath(); c.roundRect(sx - w * 0.04, sy + w * 0.03, w * 0.08, w * 0.05, w * 0.012); c.fill();
  }
  c.fillStyle = "#ffd166"; c.beginPath(); c.arc(cx, cy, w * 0.028, 0, Math.PI * 2); c.fill();
  // a bamboo post with a lantern on the left, a balloon seller's bunch on the right
  c.strokeStyle = "#8a6a3a"; c.lineWidth = w * 0.012;
  c.beginPath(); c.moveTo(w * 0.08, w * 0.86); c.lineTo(w * 0.08, w * 0.58); c.lineTo(w * 0.15, w * 0.58); c.stroke();
  c.fillStyle = "#ffb703"; c.beginPath(); c.ellipse(w * 0.15, w * 0.65, w * 0.025, w * 0.035, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#ffe8a3"; c.beginPath(); c.arc(w * 0.15, w * 0.65, w * 0.012, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#e9e3ff"; c.lineWidth = w * 0.002;
  const balloons: ReadonlyArray<readonly [number, number, string]> = [[0.86, 0.62, "#ef476f"], [0.92, 0.6, "#ffd166"], [0.89, 0.67, "#06d6a0"], [0.95, 0.66, "#118ab2"], [0.83, 0.68, "#f78c6b"]];
  for (const [bx, by] of balloons) { c.beginPath(); c.moveTo(w * bx, w * (by + 0.03)); c.lineTo(w * 0.9, w * 0.8); c.stroke(); }
  for (const [bx, by, color] of balloons) { c.fillStyle = color; c.beginPath(); c.ellipse(w * bx, w * by, w * 0.024, w * 0.03, 0, 0, Math.PI * 2); c.fill(); }
  // the ground and three stalls with lamps
  c.fillStyle = "#2b2140"; c.fillRect(0, w * 0.84, w, w * 0.16);
  const stalls: ReadonlyArray<readonly [number, string, string]> = [[0.02, "#d1495b", "#fefae0"], [0.74, "#2a9d8f", "#ffd166"], [0.38, "#f4a261", "#7b2cbf"]];
  for (const [sx, roof, stripe] of stalls) {
    c.fillStyle = "#5a3d2b"; c.fillRect(w * sx, w * 0.86, w * 0.24, w * 0.12);
    for (let k = 0; k < 4; k++) { c.fillStyle = k % 2 ? stripe : roof; c.fillRect(w * (sx + k * 0.06), w * 0.8, w * 0.06, w * 0.06); }
    c.fillStyle = "#ffe8a3"; c.beginPath(); c.arc(w * (sx + 0.12), w * 0.9, w * 0.018, 0, Math.PI * 2); c.fill();
  }
}

// ---- the title's start art and the story panels (in a 1000 × 1000 space) ----

/** The world's plate, solved: the biggest thing on the title, and the start button. */
export function drawTitlePlate(canvas: HTMLCanvasElement, width: number, height: number, board: Board, colors: Palette, picture: CanvasImageSource | null, look: Look) {
  const c = begin(canvas, width, height);
  if (!c) return;
  const glow = c.createRadialGradient(500, 500, 120, 500, 500, 520);
  glow.addColorStop(0, colors.trim + "55"); glow.addColorStop(1, colors.trim + "00");
  c.fillStyle = glow; c.fillRect(0, 0, 1000, 1000);
  drawPlate(c, board, 90, 70, 820, colors, { picture, look, whole: Boolean(picture) });
}

export const STORY = [
  "বৈশাখী মেলা। টিনের খেলনার দোকানে ঝুলছে লাল একটা প্লেট।",
  "নানা কিনে দিলেন। বললেন, ‘আমি এক মিনিটে মেলাতাম।’",
  "ঘুঁটিগুলো এলোমেলো। ১ থেকে সাজাও, ফাঁকা ঘর থাকবে শেষ কোণে।",
] as const;

export function drawStoryPanel(canvas: HTMLCanvasElement, width: number, height: number, index: number, solved: Board, mixed: Board) {
  const c = begin(canvas, width, height);
  if (!c) return;
  c.save();
  c.beginPath(); c.roundRect(10, 10, 980, 980, 40); c.clip();
  if (index === 0) {
    // the toy stall: a striped awning and three tin plates on a string
    c.fillStyle = "#fbe7c6"; c.fillRect(0, 0, 1000, 1000);
    for (let k = 0; k < 10; k++) { c.fillStyle = k % 2 ? "#fefae0" : "#d1495b"; c.fillRect(k * 100, 0, 100, 150); }
    c.fillStyle = "#d1495b";
    for (let k = 0; k < 10; k++) { c.beginPath(); c.arc(k * 100 + 50, 150, 50, 0, Math.PI); c.fill(); }
    c.strokeStyle = "#6b4a2f"; c.lineWidth = 6;
    c.beginPath(); c.moveTo(40, 270); c.quadraticCurveTo(500, 330, 960, 270); c.stroke();
    PALETTES.slice(0, 3).forEach((colors, k) => {
      c.save(); c.translate(130 + k * 290, 300); c.rotate((k - 1) * 0.08);
      drawPlate(c, solved, 0, 0, 250, colors);
      c.restore();
    });
    c.fillStyle = "#8a5a2b"; c.fillRect(0, 700, 1000, 300);
    c.fillStyle = "#6b4a2f"; c.fillRect(0, 700, 1000, 24);
    for (let k = 0; k < 6; k++) { c.fillStyle = ["#f2c230", "#2a9d8f", "#e07a5f"][k % 3]; c.beginPath(); c.arc(120 + k * 150, 820, 44, 0, Math.PI * 2); c.fill(); }
  } else if (index === 1) {
    // নানা's watch beside the red plate: one minute, he says
    c.fillStyle = "#f4ecdc"; c.fillRect(0, 0, 1000, 1000);
    c.save(); c.translate(70, 230); c.rotate(-0.06); drawPlate(c, solved, 0, 0, 560, PALETTES[0]); c.restore();
    c.fillStyle = "#c9a23f"; c.beginPath(); c.arc(790, 380, 150, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#fffdf5"; c.beginPath(); c.arc(790, 380, 124, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "#2a2420"; c.lineWidth = 6;
    for (let k = 0; k < 12; k++) { const a = (k * Math.PI) / 6; c.beginPath(); c.moveTo(790 + Math.cos(a) * 104, 380 + Math.sin(a) * 104); c.lineTo(790 + Math.cos(a) * 118, 380 + Math.sin(a) * 118); c.stroke(); }
    c.lineWidth = 10; c.beginPath(); c.moveTo(790, 380); c.lineTo(790, 290); c.stroke();
    c.strokeStyle = "#c23b22"; c.lineWidth = 6; c.beginPath(); c.moveTo(790, 380); c.lineTo(860, 330); c.stroke();
    c.fillStyle = "#c9a23f"; c.fillRect(770, 210, 40, 30);
    c.fillStyle = "#e9dcc2"; c.fillRect(0, 860, 1000, 140);
  } else {
    // the plate mixed up, with arrows: your turn
    c.fillStyle = "#f4ecdc"; c.fillRect(0, 0, 1000, 1000);
    drawPlate(c, mixed, 150, 120, 700, PALETTES[0]);
    c.strokeStyle = "#c23b22"; c.lineWidth = 16; c.lineCap = "round";
    for (const [x1, y1, x2, y2] of [[80, 900, 260, 900], [920, 900, 740, 900]]) {
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
      const dir = x2 > x1 ? 1 : -1;
      c.beginPath(); c.moveTo(x2, y2); c.lineTo(x2 - dir * 36, y2 - 30); c.moveTo(x2, y2); c.lineTo(x2 - dir * 36, y2 + 30); c.stroke();
    }
  }
  c.restore();
}

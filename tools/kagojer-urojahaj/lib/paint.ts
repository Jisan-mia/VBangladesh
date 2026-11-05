// Code-drawn art for the flight and the card: the ruled exercise-book plane, লজেন্স, benches and the steel আলমারি,
// ceiling fans, city roofs with black water tanks, cut kites, boats with bamboo ছই, herons, and three skies.
// Every painter draws in its own local units with y going down (canvas style); layers.ts paints them once into sprites.
import { DISPLAY_FONT } from "../../../shared/card-canvas";
import type { Look } from "./levels";

export type Palette = {
  sky: [string, string, string]; far: string; farLight: string; ground: string; groundLine: string;
  solid: string; solidDark: string; solidLight: string; trim: string; ink: string; glow: string; streak: string; warm: string;
};

export const PALETTES: Record<Look, Palette> = {
  class: {
    sky: ["#efe4c8", "#f4ead2", "#dfe6cf"], far: "#c9d3b4", farLight: "#e6ecd6", ground: "#b8b1a2", groundLine: "#a49c8b",
    solid: "#9b6a3f", solidDark: "#6e4626", solidLight: "#c08a55", trim: "#2f4f3a", ink: "#2b2418", glow: "#fff7e0", streak: "#5f7f8f", warm: "#ffb35c",
  },
  roof: {
    sky: ["#79acd9", "#f6d6a3", "#f2b06e"], far: "#c99f86", farLight: "#e7c3a5", ground: "#4a4038", groundLine: "#3a322c",
    solid: "#cbb79f", solidDark: "#9c876f", solidLight: "#e5d6c1", trim: "#8a4b2e", ink: "#2c2218", glow: "#fff0cf", streak: "#ffffff", warm: "#ff9a3c",
  },
  river: {
    sky: ["#55688b", "#c99a8c", "#eab27f"], far: "#3e5a4c", farLight: "#5b7a62", ground: "#3d6b74", groundLine: "#2c535b",
    solid: "#7a5534", solidDark: "#4f351f", solidLight: "#a57a4b", trim: "#c9a25e", ink: "#1d2430", glow: "#ffe6c4", streak: "#e8f1f8", warm: "#ffb070",
  },
};

export const PAPER = { sheet: "#fbfaf3", shade: "#e6e2d3", rule: "#8fb9e0", margin: "#e07f7f", edge: "#9d947c", wet: "#6f8fb8" };

const TAU = Math.PI * 2;

/**
 * The plane from the side, nose to the right, `s` long, centred on (0, 0): a dart folded from ruled exercise-book paper,
 * the near wing on top with its blue lines and red margin, the keel hanging under it. `wet` darkens it.
 */
export function paintPlane(context: CanvasRenderingContext2D, s: number, wet = 0) {
  const nose = 0.5 * s, tail = -0.5 * s;
  // The keel (folded underside), darker.
  context.beginPath(); context.moveTo(nose, 0.02 * s); context.lineTo(tail + 0.06 * s, 0.03 * s); context.lineTo(tail + 0.16 * s, 0.2 * s); context.closePath();
  context.fillStyle = PAPER.shade; context.fill();
  context.strokeStyle = PAPER.edge; context.lineWidth = Math.max(0.6, s * 0.03); context.lineJoin = "round"; context.stroke();
  // The far wing peeks above.
  context.beginPath(); context.moveTo(nose, 0); context.lineTo(tail + 0.04 * s, -0.3 * s); context.lineTo(tail + 0.1 * s, -0.04 * s); context.closePath();
  context.fillStyle = "#ece8da"; context.fill(); context.stroke();
  // The near wing, with ruled lines along it and the margin across.
  context.save();
  context.beginPath(); context.moveTo(nose, 0.01 * s); context.lineTo(tail, -0.2 * s); context.lineTo(tail + 0.08 * s, 0.04 * s); context.closePath();
  context.fillStyle = PAPER.sheet; context.fill();
  context.clip();
  context.strokeStyle = PAPER.rule; context.lineWidth = Math.max(0.5, s * 0.022);
  for (let k = 1; k <= 3; k++) { const y = -0.05 * k * s; context.beginPath(); context.moveTo(tail, y - 0.03 * s); context.lineTo(nose, y + 0.06 * s * k * 0.3); context.stroke(); }
  context.strokeStyle = PAPER.margin;
  context.beginPath(); context.moveTo(tail + 0.2 * s, -0.3 * s); context.lineTo(tail + 0.24 * s, 0.1 * s); context.stroke();
  context.restore();
  context.beginPath(); context.moveTo(nose, 0.01 * s); context.lineTo(tail, -0.2 * s); context.lineTo(tail + 0.08 * s, 0.04 * s); context.closePath();
  context.strokeStyle = PAPER.edge; context.lineWidth = Math.max(0.6, s * 0.03); context.stroke();
  // The centre fold.
  context.strokeStyle = "#b7ae95"; context.lineWidth = Math.max(0.5, s * 0.018);
  context.beginPath(); context.moveTo(nose - 0.02 * s, 0.015 * s); context.lineTo(tail + 0.08 * s, 0.035 * s); context.stroke();
  if (wet > 0) {
    context.globalAlpha = 0.45 * wet; context.fillStyle = PAPER.wet;
    context.beginPath(); context.moveTo(nose, 0.01 * s); context.lineTo(tail, -0.2 * s); context.lineTo(tail + 0.16 * s, 0.2 * s); context.closePath(); context.fill();
    context.globalAlpha = 1;
  }
}

/** A crumpled ball of the same paper (a crashed plane), radius r. */
export function paintCrumple(context: CanvasRenderingContext2D, r: number) {
  context.fillStyle = PAPER.sheet; context.strokeStyle = PAPER.edge; context.lineWidth = Math.max(0.6, r * 0.14);
  context.beginPath();
  for (let k = 0; k < 9; k++) { const a = (k / 9) * TAU, rr = r * (k % 2 ? 0.82 : 1); context.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  context.closePath(); context.fill(); context.stroke();
  context.strokeStyle = PAPER.rule; context.lineWidth = Math.max(0.5, r * 0.1);
  context.beginPath(); context.moveTo(-r * 0.6, -r * 0.2); context.lineTo(r * 0.5, -r * 0.42); context.stroke();
  context.strokeStyle = "#c6bea7";
  context.beginPath(); context.moveTo(-r * 0.4, r * 0.45); context.lineTo(0, 0); context.lineTo(r * 0.5, r * 0.3); context.stroke();
}

/** A লজেন্স: an orange sweet in a twisted clear wrapper, radius r. */
export function paintCandy(context: CanvasRenderingContext2D, r: number) {
  for (const side of [-1, 1]) {
    context.beginPath(); context.moveTo(side * r * 0.7, 0); context.lineTo(side * r * 1.75, -r * 0.7); context.lineTo(side * r * 1.6, 0); context.lineTo(side * r * 1.75, r * 0.7); context.closePath();
    context.fillStyle = "#ffd9ec"; context.fill(); context.strokeStyle = "#e48bb5"; context.lineWidth = Math.max(0.6, r * 0.12); context.stroke();
  }
  const body = context.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
  body.addColorStop(0, "#ffe2a8"); body.addColorStop(0.45, "#ff9d2e"); body.addColorStop(1, "#e2660c");
  context.fillStyle = body; context.beginPath(); context.arc(0, 0, r, 0, TAU); context.fill();
  context.strokeStyle = "#b8500a"; context.lineWidth = Math.max(0.6, r * 0.12); context.stroke();
  context.fillStyle = "#ffffffcc"; context.beginPath(); context.ellipse(-r * 0.35, -r * 0.4, r * 0.28, r * 0.16, -0.6, 0, TAU); context.fill();
}

/** A school desk-bench, w by h (top-left origin): a long plank desk on legs, the seat lower behind it. */
export function paintBench(context: CanvasRenderingContext2D, w: number, h: number, p: Palette) {
  context.fillStyle = p.solidDark;
  context.fillRect(w * 0.08, h * 0.12, w * 0.07, h * 0.88); context.fillRect(w * 0.85, h * 0.12, w * 0.07, h * 0.88);
  context.fillRect(w * 0.1, h * 0.62, w * 0.8, h * 0.06);
  context.fillStyle = p.solid; context.beginPath(); context.roundRect(0, 0, w, h * 0.16, 3); context.fill();
  context.fillStyle = p.solidLight; context.fillRect(2, 1, w - 4, h * 0.05);
  // Initials scratched into the desk, and an ink blot.
  context.strokeStyle = "#5a3a1f"; context.lineWidth = 0.8;
  context.beginPath(); context.moveTo(w * 0.3, h * 0.06); context.lineTo(w * 0.36, h * 0.11); context.moveTo(w * 0.4, h * 0.05); context.lineTo(w * 0.4, h * 0.12); context.stroke();
  context.fillStyle = "#24324f"; context.beginPath(); context.arc(w * 0.7, h * 0.08, 1.6, 0, TAU); context.fill();
  context.fillStyle = p.solid; context.beginPath(); context.roundRect(w * 0.04, h * 0.42, w * 0.92, h * 0.1, 2); context.fill();
}

/** The steel আলমারি in the corner of every classroom, w by h. */
export function paintShelf(context: CanvasRenderingContext2D, w: number, h: number) {
  const body = context.createLinearGradient(0, 0, w, 0);
  body.addColorStop(0, "#7d8c86"); body.addColorStop(0.5, "#98a8a1"); body.addColorStop(1, "#6d7b75");
  context.fillStyle = body; context.beginPath(); context.roundRect(0, 0, w, h, 3); context.fill();
  context.strokeStyle = "#55625d"; context.lineWidth = 1.2; context.stroke();
  context.beginPath(); context.moveTo(w / 2, 4); context.lineTo(w / 2, h - 6); context.stroke();
  context.fillStyle = "#e9d28a"; context.fillRect(w / 2 - 6, h * 0.45, 3, 9); context.fillRect(w / 2 + 3, h * 0.45, 3, 9);
  context.fillStyle = "#4b5652"; context.fillRect(4, h - 5, w - 8, 5);
  // A stack of exercise books and a globe on top are part of the scene; the label says whose cupboard it is.
  context.fillStyle = "#fbfaf3"; context.fillRect(w * 0.18, h * 0.12, w * 0.24, h * 0.07);
}

/** A ceiling fan's blades, seen edge-on as they turn, `r` from hub to tip; `turn` is the blades' angle. */
export function paintFan(context: CanvasRenderingContext2D, r: number, turn: number) {
  for (let blade = 0; blade < 3; blade++) {
    const a = turn + (blade * TAU) / 3, reach = Math.cos(a) * r, depth = Math.sin(a);
    context.fillStyle = depth > 0 ? "#cfd6d8" : "#eef2f2";
    context.beginPath(); context.ellipse(reach / 2, 0, Math.abs(reach) / 2 + 2, 2.6 + depth * 1.2, 0, 0, TAU); context.fill();
  }
  context.fillStyle = "#8d969a"; context.beginPath(); context.roundRect(-7, -5, 14, 9, 3); context.fill();
}

/** A city building, w by h, with windows and a parapet; `seed` varies the paint and the details. */
export function paintRoof(context: CanvasRenderingContext2D, w: number, h: number, p: Palette, seed: number) {
  const tones = ["#cbb79f", "#d9c3a5", "#bfae9a", "#d2b08c", "#c4c0b0"], tone = tones[seed % tones.length];
  context.fillStyle = tone; context.fillRect(0, 6, w, h - 6);
  context.fillStyle = "#00000018"; context.fillRect(w - 10, 6, 10, h - 6);
  // The parapet and its shadow.
  context.fillStyle = p.solidLight; context.fillRect(-2, 0, w + 4, 8);
  context.fillStyle = "#0000001f"; context.fillRect(0, 8, w, 3);
  // Windows with green grilles, floor by floor.
  for (let y = 26; y < h - 20; y += 44) for (let x = 14; x < w - 24; x += 46) {
    context.fillStyle = "#3b4a52"; context.fillRect(x, y, 22, 24);
    context.strokeStyle = "#5f8f6a"; context.lineWidth = 1.2;
    for (let g = 1; g < 4; g++) { context.beginPath(); context.moveTo(x + g * 5.5, y); context.lineTo(x + g * 5.5, y + 24); context.stroke(); }
    context.fillStyle = "#e7d8b8"; context.fillRect(x - 2, y + 24, 26, 3);
  }
  if (seed % 2) { context.strokeStyle = "#7a6a5a"; context.lineWidth = 1; context.beginPath(); context.moveTo(6, 16); context.lineTo(w - 6, 20); context.stroke(); }
}

/** The black plastic water tank on a Dhaka roof, w by h. */
export function paintTank(context: CanvasRenderingContext2D, w: number, h: number) {
  context.fillStyle = "#2b3138"; context.beginPath(); context.roundRect(0, 6, w, h - 6, 6); context.fill();
  context.fillStyle = "#3d454e"; context.beginPath(); context.ellipse(w / 2, 6, w / 2, 6, 0, 0, TAU); context.fill();
  context.fillStyle = "#1f242a"; context.fillRect(w / 2 - 7, 0, 14, 5);
  context.strokeStyle = "#ffffff1c"; context.lineWidth = 2;
  for (let y = 16; y < h; y += 10) { context.beginPath(); context.moveTo(3, y); context.lineTo(w - 3, y); context.stroke(); }
}

/** A wooden country boat's hull, w by h. */
export function paintHull(context: CanvasRenderingContext2D, w: number, h: number, p: Palette) {
  context.fillStyle = p.solid;
  context.beginPath(); context.moveTo(-6, 0); context.quadraticCurveTo(w * 0.1, h, w * 0.25, h); context.lineTo(w * 0.75, h); context.quadraticCurveTo(w * 0.9, h, w + 6, 0); context.closePath(); context.fill();
  context.fillStyle = p.solidDark; context.fillRect(0, 0, w, 4);
  context.strokeStyle = p.solidLight; context.lineWidth = 1;
  context.beginPath(); context.moveTo(w * 0.12, h * 0.45); context.lineTo(w * 0.88, h * 0.45); context.stroke();
}

/** The bamboo ছই (arched cover) of a boat, w by h. */
export function paintChhoi(context: CanvasRenderingContext2D, w: number, h: number, p: Palette) {
  context.fillStyle = p.trim;
  context.beginPath(); context.moveTo(0, h); context.quadraticCurveTo(w / 2, -h * 0.55, w, h); context.closePath(); context.fill();
  context.strokeStyle = "#8f6f3a"; context.lineWidth = 1;
  for (let k = 1; k < 6; k++) { const x = (w * k) / 6; context.beginPath(); context.moveTo(x, h); context.quadraticCurveTo(x, h * 0.1, x, h * 0.2); context.stroke(); }
}

/** A brick ghat with steps down to the water, w by h. */
export function paintGhat(context: CanvasRenderingContext2D, w: number, h: number) {
  context.fillStyle = "#a5583c"; context.fillRect(0, 0, w, h);
  context.fillStyle = "#8a4630";
  for (let y = 0; y < h; y += 10) for (let x = ((y / 10) % 2) * 8; x < w; x += 16) context.fillRect(x, y, 15, 1);
  for (let step = 0; step < 4; step++) { context.fillStyle = step % 2 ? "#b8694a" : "#c07a58"; context.fillRect(w - 20 - step * 14, h - 18 - step * 14, 20 + step * 14, 6); }
  context.fillStyle = "#3e5f39"; context.fillRect(0, -6, w, 7);
}

/** A cut kite (diamond with a tail), size s, in one of five colours. */
export function paintKite(context: CanvasRenderingContext2D, s: number, colour: number) {
  const colours = [["#e63946", "#ffd166"], ["#118ab2", "#ffffff"], ["#06a77d", "#f4d35e"], ["#8338ec", "#ffbe0b"], ["#ff6b35", "#1d3557"]][colour % 5];
  context.fillStyle = colours[0];
  context.beginPath(); context.moveTo(0, -s); context.lineTo(s * 0.8, 0); context.lineTo(0, s); context.lineTo(-s * 0.8, 0); context.closePath(); context.fill();
  context.fillStyle = colours[1];
  context.beginPath(); context.moveTo(0, -s); context.lineTo(s * 0.8, 0); context.lineTo(0, 0); context.closePath(); context.fill();
  context.strokeStyle = "#00000055"; context.lineWidth = 1;
  context.beginPath(); context.moveTo(0, -s); context.lineTo(0, s); context.moveTo(-s * 0.8, 0); context.quadraticCurveTo(0, -s * 0.5, s * 0.8, 0); context.stroke();
}

/** A বক (white heron) flying, wingspan s; `up` lifts the wings. */
export function paintBird(context: CanvasRenderingContext2D, s: number, up: boolean) {
  context.fillStyle = "#f8f6ef"; context.strokeStyle = "#9aa3a8"; context.lineWidth = 0.8;
  context.beginPath(); context.ellipse(0, 0, s * 0.3, s * 0.1, 0, 0, TAU); context.fill(); context.stroke();
  context.beginPath(); context.moveTo(-s * 0.26, -s * 0.02); context.quadraticCurveTo(-s * 0.42, -s * 0.12, -s * 0.48, -s * 0.06); context.lineWidth = s * 0.05; context.strokeStyle = "#f8f6ef"; context.stroke();
  context.fillStyle = "#e3a23a"; context.beginPath(); context.moveTo(-s * 0.48, -s * 0.08); context.lineTo(-s * 0.62, -s * 0.05); context.lineTo(-s * 0.48, -s * 0.03); context.fill();
  context.fillStyle = "#f8f6ef"; context.strokeStyle = "#9aa3a8"; context.lineWidth = 0.8;
  context.beginPath(); context.moveTo(-s * 0.08, 0); context.quadraticCurveTo(s * 0.05, up ? -s * 0.55 : s * 0.4, s * 0.22, up ? -s * 0.45 : s * 0.3); context.quadraticCurveTo(s * 0.08, 0, -s * 0.08, 0); context.fill(); context.stroke();
  context.strokeStyle = "#e3a23a"; context.lineWidth = s * 0.03;
  context.beginPath(); context.moveTo(s * 0.28, 0); context.lineTo(s * 0.5, s * 0.04); context.stroke();
}

/** The landing place's top, w wide, by world: an open exercise book on the teacher's table, a শীতলপাটি on a roof, a ছই. The bullseye is a red ring. */
export function paintPadTop(context: CanvasRenderingContext2D, w: number, look: Look) {
  if (look === "class") {
    context.fillStyle = "#7a4a26"; context.fillRect(0, 0, w, 7);
    context.fillStyle = "#5a3418"; context.fillRect(0, 7, w, 3);
    // An attendance register and the chalk box on the table.
    context.fillStyle = "#2f5c8a"; context.fillRect(w * 0.1, -6, 34, 6);
    context.fillStyle = "#f5f2e8"; context.fillRect(w * 0.82, -7, 16, 7);
  } else if (look === "roof") {
    context.fillStyle = "#d9b26a"; context.fillRect(0, -3, w, 5);
    context.strokeStyle = "#a9823e"; context.lineWidth = 1;
    for (let x = 4; x < w; x += 8) { context.beginPath(); context.moveTo(x, -3); context.lineTo(x + 4, 2); context.stroke(); }
    context.fillStyle = "#c0392b"; context.fillRect(w * 0.12, -12, 12, 10); context.fillRect(w * 0.8, -12, 12, 10);
  } else {
    context.fillStyle = "#6b4a2f"; context.fillRect(0, 0, w, 6);
  }
}

/** A pre-painted edge glow for the danger signal (orange), `w` by `h`, fading inwards from the given side. */
export function paintEdge(context: CanvasRenderingContext2D, w: number, h: number, side: "bottom" | "right" | "top", colour: string) {
  const g = side === "bottom" ? context.createLinearGradient(0, h, 0, 0) : side === "top" ? context.createLinearGradient(0, 0, 0, h) : context.createLinearGradient(w, 0, 0, 0);
  g.addColorStop(0, colour); g.addColorStop(1, colour.slice(0, 7) + "00");
  context.fillStyle = g; context.fillRect(0, 0, w, h);
}

/** The far back wall, w by h in world units (y down from the top): the board in a classroom, a tall wall outdoors. */
export function paintFarWall(context: CanvasRenderingContext2D, w: number, h: number, look: Look) {
  if (look === "class") {
    context.fillStyle = "#e9dfc6"; context.fillRect(0, 0, w, h);
    context.fillStyle = "#5d7f5a"; context.fillRect(0, h - 110, w, 110);
    context.fillStyle = "#6b4a2f"; context.fillRect(8, h - 430, w, 230);
    context.fillStyle = "#284636"; context.fillRect(14, h - 424, w, 218);
    context.strokeStyle = "#ffffffb0"; context.lineWidth = 2; context.lineCap = "round";
    // ২ + ৩ = ৫ in chalk, half wiped.
    context.font = `700 34px ${DISPLAY_FONT}`; context.fillStyle = "#ffffffc8"; context.fillText("২+৩=৫", 30, h - 340);
    context.beginPath(); context.moveTo(30, h - 300); context.quadraticCurveTo(80, h - 320, 130, h - 296); context.stroke();
  } else if (look === "roof") {
    context.fillStyle = "#b9a38c"; context.fillRect(0, 0, w, h);
    for (let y = 40; y < h - 40; y += 60) { context.fillStyle = "#3b4a52"; context.fillRect(30, y, 24, 28); }
    context.fillStyle = "#a08a74"; context.fillRect(0, 0, 10, h);
  } else {
    context.fillStyle = "#3e5a3c"; context.fillRect(0, 0, w, h);
    context.fillStyle = "#2f4a30"; for (let k = 0; k < 8; k++) { context.beginPath(); context.arc(20 + k * 30, h * 0.3 + (k % 3) * 20, 34, 0, TAU); context.fill(); }
    context.fillStyle = "#a5583c"; context.fillRect(0, h - 90, w, 90);
  }
}

/** The back of the world, painted once as a tile that scrolls slowly: windows and posters, a skyline, the far bank. */
export function paintBackdrop(context: CanvasRenderingContext2D, w: number, h: number, look: Look, p: Palette) {
  // Units: y down from the top of the world (600 tall), w wide.
  if (look === "class") {
    context.fillStyle = "#cfd8b9"; context.fillRect(0, h - 200, w, 200);
    context.fillStyle = "#b9c39f"; context.fillRect(0, h - 202, w, 4);
    for (let x = 30; x < w; x += 300) {
      // A window with green grilles and a bit of the school field outside.
      context.fillStyle = "#9fc6e0"; context.fillRect(x, h - 420, 110, 150);
      context.fillStyle = "#7fae6a"; context.fillRect(x, h - 300, 110, 30);
      context.strokeStyle = "#3f6f4a"; context.lineWidth = 3; context.strokeRect(x, h - 420, 110, 150);
      context.lineWidth = 1.5;
      for (let g = 1; g < 6; g++) { context.beginPath(); context.moveTo(x + g * 18, h - 420); context.lineTo(x + g * 18, h - 270); context.stroke(); }
      // A poster: the alphabet chart.
      context.fillStyle = "#fff6dc"; context.fillRect(x + 160, h - 400, 70, 90);
      context.fillStyle = "#c0392b"; context.font = `700 18px ${DISPLAY_FONT}`; context.fillText("অ আ", x + 170, h - 370);
      context.fillStyle = "#2f5c8a"; context.fillText("ক খ", x + 172, h - 340);
    }
    context.fillStyle = "#3a3a3a"; context.beginPath(); context.arc(w * 0.62, h - 470, 16, 0, TAU); context.fill();
    context.fillStyle = "#fffef6"; context.beginPath(); context.arc(w * 0.62, h - 470, 13, 0, TAU); context.fill();
    context.strokeStyle = "#222"; context.lineWidth = 1.5; context.beginPath(); context.moveTo(w * 0.62, h - 470); context.lineTo(w * 0.62, h - 480); context.moveTo(w * 0.62, h - 470); context.lineTo(w * 0.62 + 7, h - 468); context.stroke();
  } else if (look === "roof") {
    context.fillStyle = p.far;
    let x = 0;
    for (let k = 0; x < w; k++) {
      const bw = 40 + ((k * 37) % 50), bh = 120 + ((k * 53) % 140);
      context.fillRect(x, h - bh, bw, bh);
      if (k % 3 === 0) context.fillRect(x + bw / 2 - 1, h - bh - 30, 2, 30);
      x += bw + 4;
    }
    context.fillStyle = p.farLight;
    for (let k = 0; k < 40; k++) context.fillRect((k * 61) % w, h - 60 - ((k * 29) % 120), 5, 6);
    // A minaret and a far kite or two.
    context.fillStyle = p.far; context.fillRect(w * 0.7, h - 300, 12, 300); context.beginPath(); context.arc(w * 0.7 + 6, h - 300, 10, Math.PI, 0); context.fill();
  } else {
    context.fillStyle = p.far;
    context.beginPath(); context.moveTo(0, h - 70);
    for (let x = 0; x <= w; x += 20) context.lineTo(x, h - 70 - 18 * Math.abs(Math.sin(x * 0.03)) - ((x * 7) % 13));
    context.lineTo(w, h); context.lineTo(0, h); context.fill();
    for (let x = 40; x < w; x += 140) {
      context.fillRect(x, h - 130, 3, 60);
      for (let leaf = 0; leaf < 6; leaf++) { const a = Math.PI + (leaf / 5) * Math.PI; context.beginPath(); context.ellipse(x + Math.cos(a) * 12, h - 130 + Math.sin(a) * 6, 14, 3, a, 0, TAU); context.fill(); }
    }
    context.fillStyle = p.farLight; context.fillRect(w * 0.3, h - 92, 30, 20);
    context.beginPath(); context.moveTo(w * 0.3 - 4, h - 92); context.lineTo(w * 0.3 + 15, h - 106); context.lineTo(w * 0.3 + 34, h - 92); context.fill();
  }
}

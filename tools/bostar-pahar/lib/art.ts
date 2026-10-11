// Cartoon pieces drawn with plain paths, shared by the play canvas and the share card. `u` is pixels per sack width.
// Nothing here allocates per call, so the people (redrawn every frame) stay cheap.
export const SACK_H = 0.56;

export const PAL = {
  ink: "#1f2a26", accent: "#17795e", accentDeep: "#0f5643",
  skyTop: "#86c3e2", skyLow: "#d6ecf3", glow: "#ffd9b0", sun: "#fff3d6",
  bank: "#3f6b3a", bankDark: "#2f5530", water: "#4f97bd", waterLight: "#8cc4df", waterDark: "#3b7ea3",
  ghat: "#bda688", ghatDark: "#9d8667", ghatLight: "#d3bfa2",
  wall: "#e4c792", wallDark: "#c7a46c", tin: "#8f9ba4", tinDark: "#6b7780", door: "#3a2a1e", sign: "#1f6b4f",
  wood: "#7a5232", woodDark: "#4f341f",
  crane: "#e2a417", craneDark: "#8a6206", rope: "#5a4630", steel: "#4e5962",
  tire: "#232323", hub: "#a3a9ae", chassis: "#2c2c2c",
  cab: "#f2b134", red: "#c8323a", green: "#1f8a4c", blue: "#2f6fb0", pink: "#e0457b", glass: "#c4e6f3", board: "#f6c945",
  skin: "#a8693f", hair: "#1c1714", vest: "#f4f1e8", plumb: "#3b2f22", brass: "#c9962e",
} as const;

export type SackLook = { body: string; weave: string; edge: string; print: string; label: string; ink: string };
export const SACKS: SackLook[] = [
  { body: "#efe9da", weave: "#d8cfb9", edge: "#857b64", print: "#2f8a4e", label: "চাল", ink: "#ffffff" },
  { body: "#eceff0", weave: "#d0d6d9", edge: "#7d868c", print: "#2f6fb0", label: "চাল", ink: "#ffffff" },
  { body: "#b88a4b", weave: "#946a35", edge: "#6a4a20", print: "", label: "পাট", ink: "#4a3012" },
];

function sackPath(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const l = x - w / 2, r = x + w / 2, t = y - h / 2, b = y + h / 2, e = h * 0.2;
  c.beginPath();
  c.moveTo(l + e * 0.4, t + e * 0.2);
  c.quadraticCurveTo(x, t - e * 0.7, r - e * 0.4, t + e * 0.2);
  c.quadraticCurveTo(r + e * 0.9, y, r - e * 0.4, b - e * 0.15);
  c.quadraticCurveTo(x, b + e * 0.55, l + e * 0.4, b - e * 0.15);
  c.quadraticCurveTo(l - e * 0.9, y, l + e * 0.4, t + e * 0.2);
  c.closePath();
}

/** A gathered corner of the sack: a small soft lobe. */
function ear(c: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, size: number) {
  c.beginPath(); c.ellipse(x + dx * size * 0.35, y + dy * size * 0.2, size * 0.5, size * 0.3, dx * dy * 0.6, 0, Math.PI * 2); c.fill(); c.stroke();
}

/** A sack lying flat, centred on (x, y): a woven rice sack with a printed panel, or a jute one with a stitched mouth. */
export function drawSack(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, kind: number) {
  const look = SACKS[kind] ?? SACKS[0];
  const l = x - w / 2, r = x + w / 2, t = y - h / 2, b = y + h / 2, e = h * 0.2;
  c.lineJoin = "round"; c.lineCap = "round";
  c.fillStyle = look.body; c.strokeStyle = look.edge; c.lineWidth = Math.max(1, w * 0.024);
  ear(c, l + e * 0.4, t + e * 0.2, -1, -1, h * 0.24); ear(c, r - e * 0.4, t + e * 0.2, 1, -1, h * 0.24);
  ear(c, l + e * 0.4, b - e * 0.15, -1, 1, h * 0.2); ear(c, r - e * 0.4, b - e * 0.15, 1, 1, h * 0.2);
  sackPath(c, x, y, w, h); c.fill();
  c.save(); sackPath(c, x, y, w, h); c.clip();
  c.strokeStyle = look.weave; c.lineWidth = Math.max(0.6, w * 0.012);
  c.beginPath();
  if (look.print) {
    for (let yy = t + h * 0.12; yy < b; yy += h * 0.14) { c.moveTo(l, yy); c.lineTo(r, yy); }
    for (let xx = l + w * 0.05; xx < r; xx += w * 0.08) { c.moveTo(xx, t); c.lineTo(xx, b); }
  } else {
    for (let xx = l - h; xx < r; xx += w * 0.07) { c.moveTo(xx, b); c.lineTo(xx + h, t); c.moveTo(xx, t); c.lineTo(xx + h, b); }
  }
  c.stroke();
  c.fillStyle = "rgba(0,0,0,0.12)"; c.beginPath(); c.ellipse(x, b + h * 0.05, w * 0.6, h * 0.3, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "rgba(255,255,255,0.3)"; c.beginPath(); c.ellipse(x - w * 0.1, t + h * 0.12, w * 0.32, h * 0.12, 0, 0, Math.PI * 2); c.fill();
  if (look.print) {
    c.fillStyle = look.print;
    c.fillRect(l + w * 0.1, t, w * 0.035, h); c.fillRect(r - w * 0.135, t, w * 0.035, h);
    c.beginPath(); c.roundRect(x - w * 0.22, y - h * 0.24, w * 0.44, h * 0.48, h * 0.08); c.fill();
  }
  c.restore();
  if (!look.print) {
    // The jute sack's stitched mouth.
    c.strokeStyle = look.edge; c.lineWidth = Math.max(0.8, w * 0.014);
    c.beginPath();
    for (let index = 0; index < 6; index++) { const yy = t + h * (0.16 + index * 0.13); c.moveTo(r - w * 0.1, yy); c.lineTo(r - w * 0.05, yy + h * 0.06); }
    c.stroke();
  }
  c.font = `800 ${Math.round(h * 0.34)}px "Display", "Bangla", sans-serif`;
  c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = look.ink;
  c.fillText(look.label, x, y + h * 0.04);
  c.textBaseline = "alphabetic";
  c.strokeStyle = look.edge; c.lineWidth = Math.max(1, w * 0.024);
  sackPath(c, x, y, w, h); c.stroke();
}

function flower(c: CanvasRenderingContext2D, x: number, y: number, r: number, petal: string) {
  c.fillStyle = PAL.green;
  c.beginPath(); c.ellipse(x - r * 1.5, y + r * 0.4, r * 0.9, r * 0.4, -0.4, 0, Math.PI * 2); c.ellipse(x + r * 1.5, y + r * 0.4, r * 0.9, r * 0.4, 0.4, 0, Math.PI * 2); c.fill();
  c.fillStyle = petal;
  c.beginPath();
  for (let index = 0; index < 5; index++) { const a = (index / 5) * Math.PI * 2 - Math.PI / 2; c.moveTo(x + Math.cos(a) * r + r * 0.55, y + Math.sin(a) * r); c.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.55, 0, Math.PI * 2); }
  c.fill();
  c.fillStyle = PAL.board; c.beginPath(); c.arc(x, y, r * 0.45, 0, Math.PI * 2); c.fill();
}

/** The truck's back layer: chassis, wheels, the painted cab and crown. The bed is centred on cx; its top is bedTop. */
export function drawTruckBack(c: CanvasRenderingContext2D, cx: number, bedTop: number, u: number) {
  const X = (value: number) => cx + value * u, Y = (value: number) => bedTop + value * u;
  c.lineJoin = "round";
  c.fillStyle = PAL.chassis; c.fillRect(X(-1.6), Y(0.12), 4.2 * u, 0.18 * u);
  for (const wheel of [-1.05, 1.95]) {
    c.fillStyle = PAL.red; c.beginPath(); c.arc(X(wheel), Y(0.62), 0.42 * u, Math.PI, 0); c.fill();
    c.fillStyle = PAL.tire; c.beginPath(); c.arc(X(wheel), Y(0.62), 0.33 * u, 0, Math.PI * 2); c.fill();
    c.fillStyle = PAL.hub; c.beginPath(); c.arc(X(wheel), Y(0.62), 0.16 * u, 0, Math.PI * 2); c.fill();
    c.fillStyle = PAL.steel; c.beginPath(); c.arc(X(wheel), Y(0.62), 0.05 * u, 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = PAL.wood; c.fillRect(X(-1.75), Y(0), 3.2 * u, 0.15 * u);
  c.fillStyle = PAL.red; c.fillRect(X(-1.82), Y(0.02), 0.08 * u, 0.12 * u);
  // Headboard behind the cab, then the arched crown painted over it.
  c.fillStyle = PAL.board; c.fillRect(X(1.32), Y(-1.15), 0.2 * u, 1.15 * u);
  c.fillStyle = PAL.red;
  c.beginPath(); c.moveTo(X(1.3), Y(-1.02)); c.lineTo(X(1.3), Y(-1.28)); c.quadraticCurveTo(X(1.9), Y(-1.66), X(2.52), Y(-1.28)); c.lineTo(X(2.52), Y(-1.02)); c.closePath(); c.fill();
  c.strokeStyle = PAL.board; c.lineWidth = Math.max(1, 0.035 * u);
  c.beginPath(); c.moveTo(X(1.38), Y(-1.08)); c.lineTo(X(1.38), Y(-1.25)); c.quadraticCurveTo(X(1.9), Y(-1.56), X(2.44), Y(-1.25)); c.lineTo(X(2.44), Y(-1.08)); c.stroke();
  flower(c, X(1.91), Y(-1.24), 0.06 * u, PAL.pink);
  // Cab, sloped windscreen to the right.
  c.fillStyle = PAL.cab;
  c.beginPath(); c.moveTo(X(1.52), Y(0.3)); c.lineTo(X(1.52), Y(-1.02)); c.lineTo(X(2.36), Y(-1.02)); c.lineTo(X(2.8), Y(-0.42)); c.lineTo(X(2.8), Y(0.3)); c.closePath(); c.fill();
  c.fillStyle = PAL.red; c.fillRect(X(1.52), Y(-0.24), 1.28 * u, 0.09 * u);
  c.fillStyle = PAL.green; c.fillRect(X(1.52), Y(-0.13), 1.28 * u, 0.04 * u);
  c.fillStyle = PAL.glass;
  c.beginPath(); c.moveTo(X(1.98), Y(-0.92)); c.lineTo(X(2.33), Y(-0.92)); c.lineTo(X(2.64), Y(-0.48)); c.lineTo(X(1.98), Y(-0.48)); c.closePath(); c.fill();
  // The driver, smiling out of the window.
  c.fillStyle = PAL.skin; c.beginPath(); c.arc(X(2.14), Y(-0.64), 0.11 * u, 0, Math.PI * 2); c.fill();
  c.fillStyle = PAL.hair; c.beginPath(); c.arc(X(2.14), Y(-0.66), 0.115 * u, Math.PI * 1.05, Math.PI * 1.95); c.fill();
  if (u >= 40) {
    c.strokeStyle = PAL.hair; c.lineWidth = Math.max(1, 0.015 * u);
    c.beginPath(); c.arc(X(2.18), Y(-0.63), 0.045 * u, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
  }
  c.strokeStyle = "rgba(0,0,0,0.35)"; c.lineWidth = Math.max(1, 0.018 * u);
  c.strokeRect(X(1.62), Y(-0.95), 0.78 * u, 1.1 * u);
  c.fillStyle = "#fff3c4"; c.beginPath(); c.arc(X(2.74), Y(0.04), 0.07 * u, 0, Math.PI * 2); c.fill();
  c.fillStyle = PAL.chassis; c.fillRect(X(2.62), Y(0.18), 0.24 * u, 0.12 * u);
  // The fringe under the crown.
  const fringe = [PAL.pink, PAL.board, PAL.green, PAL.blue];
  for (let index = 0; index < 10; index++) {
    c.fillStyle = fringe[index % 4];
    const fx = X(1.55 + index * 0.095);
    c.beginPath(); c.moveTo(fx, Y(-1.02)); c.lineTo(fx + 0.095 * u, Y(-1.02)); c.lineTo(fx + 0.047 * u, Y(-0.9)); c.closePath(); c.fill();
  }
}

/** How far above the bed the pile starts: the bed already carries a row of sacks, and the pile sits on them. */
export const LOAD_TOP = 0.5;

/** The row of sacks already loaded in the bed (drawn behind the side board); the pile starts on top of them. */
export function drawLoad(c: CanvasRenderingContext2D, cx: number, bedTop: number, u: number) {
  const h = u * SACK_H;
  for (const [x, kind] of [[-1.15, 2], [1.0, 1], [-0.08, 0]]) drawSack(c, cx + x * u, bedTop - h * 0.5, u * 1.02, h, kind);
}

/** The painted side board, drawn in front of the loaded row so it sits inside the truck. */
export function drawTruckFront(c: CanvasRenderingContext2D, cx: number, bedTop: number, u: number, motto = "") {
  const X = (value: number) => cx + value * u, Y = (value: number) => bedTop + value * u;
  c.fillStyle = PAL.board; c.fillRect(X(-1.75), Y(-0.3), 3.07 * u, 0.36 * u);
  c.fillStyle = PAL.red; c.fillRect(X(-1.78), Y(-0.34), 3.12 * u, 0.07 * u);
  c.fillStyle = PAL.green; c.fillRect(X(-1.78), Y(0.03), 3.12 * u, 0.06 * u);
  c.fillStyle = PAL.red;
  for (const post of [-1.78, -0.76, 0.27, 1.27]) c.fillRect(X(post), Y(-0.34), 0.06 * u, 0.42 * u);
  const petals = [PAL.pink, PAL.blue, PAL.pink];
  [-1.25, -0.22, 0.79].forEach((panel, index) => {
    if (motto && index === 1) return;
    flower(c, X(panel), Y(-0.12), 0.055 * u, petals[index]);
  });
  if (motto) {
    c.font = `800 ${Math.round(0.15 * u)}px "Display", "Bangla", sans-serif`;
    c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = PAL.red;
    c.fillText(motto, X(-0.22), Y(-0.11));
    c.textBaseline = "alphabetic";
  }
}

export type Pose = "idle" | "point" | "cheer" | "clap" | "laugh" | "count";
export type Worker = { lungi: string; check: string; top: string; vest: boolean; gamchha: "head" | "shoulder"; moustache: boolean };
export const WORKERS: Worker[] = [
  { lungi: "#2f5d8a", check: "#86b2d9", top: PAL.vest, vest: true, gamchha: "head", moustache: false },
  { lungi: "#5b4a2e", check: "#a78f60", top: "#2f8a6e", vest: false, gamchha: "shoulder", moustache: true },
];

function limb(c: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y3); c.stroke();
}

/** A ghat worker standing tall, `s` pixels high, feet at (x, feet), facing +1 (right) or -1. Always smiling: proud of a good day's loading. */
export function drawWorker(c: CanvasRenderingContext2D, x: number, feet: number, s: number, look: Worker, pose: Pose, t: number, facing = 1) {
  const bounce = pose === "cheer" ? Math.abs(Math.sin(t * 7)) * 0.035 * s : 0;
  const f = feet - bounce, shoulder = f - 0.78 * s, waist = f - 0.5 * s, headY = f - 0.89 * s, r = 0.075 * s;
  c.lineCap = "round"; c.lineJoin = "round";
  // Legs and sandals below the lungi.
  c.strokeStyle = PAL.skin; c.lineWidth = 0.05 * s;
  c.beginPath(); c.moveTo(x - 0.05 * s, f - 0.08 * s); c.lineTo(x - 0.055 * s, f - 0.01 * s); c.moveTo(x + 0.05 * s, f - 0.08 * s); c.lineTo(x + 0.055 * s, f - 0.01 * s); c.stroke();
  c.fillStyle = PAL.hair;
  c.beginPath(); c.ellipse(x - 0.06 * s + facing * 0.015 * s, f, 0.045 * s, 0.014 * s, 0, 0, Math.PI * 2); c.ellipse(x + 0.06 * s + facing * 0.015 * s, f, 0.045 * s, 0.014 * s, 0, 0, Math.PI * 2); c.fill();
  // Lungi with its checks and the knot at the waist.
  c.fillStyle = look.lungi;
  c.beginPath(); c.moveTo(x - 0.1 * s, waist); c.lineTo(x + 0.1 * s, waist); c.lineTo(x + 0.12 * s, f - 0.06 * s); c.lineTo(x - 0.12 * s, f - 0.06 * s); c.closePath(); c.fill();
  c.strokeStyle = look.check; c.lineWidth = Math.max(1, 0.012 * s);
  c.beginPath();
  for (const row of [0.3, 0.6, 0.85]) { const yy = waist + (f - 0.06 * s - waist) * row; c.moveTo(x - 0.11 * s, yy); c.lineTo(x + 0.11 * s, yy); }
  c.moveTo(x - 0.035 * s, waist); c.lineTo(x - 0.04 * s, f - 0.06 * s); c.moveTo(x + 0.045 * s, waist); c.lineTo(x + 0.05 * s, f - 0.06 * s);
  c.stroke();
  // Torso: a white vest, or a shirt with a collar.
  c.fillStyle = look.top;
  c.beginPath(); c.roundRect(x - 0.1 * s, shoulder - 0.01 * s, 0.2 * s, waist - shoulder + 0.03 * s, 0.04 * s); c.fill();
  if (look.vest) { c.fillStyle = PAL.skin; c.beginPath(); c.arc(x, shoulder - 0.005 * s, 0.045 * s, 0, Math.PI); c.fill(); }
  else { c.fillStyle = "rgba(255,255,255,0.85)"; c.beginPath(); c.moveTo(x - 0.05 * s, shoulder - 0.01 * s); c.lineTo(x, shoulder + 0.04 * s); c.lineTo(x + 0.05 * s, shoulder - 0.01 * s); c.closePath(); c.fill(); }
  if (look.gamchha === "shoulder") {
    c.fillStyle = PAL.red;
    c.beginPath(); c.moveTo(x - facing * 0.1 * s, shoulder); c.lineTo(x - facing * 0.04 * s, shoulder); c.lineTo(x + facing * 0.05 * s, waist - 0.02 * s); c.lineTo(x - facing * 0.01 * s, waist - 0.02 * s); c.closePath(); c.fill();
    c.strokeStyle = "#ffffff"; c.lineWidth = Math.max(1, 0.01 * s);
    c.beginPath(); c.moveTo(x - facing * 0.07 * s, shoulder + 0.01 * s); c.lineTo(x + facing * 0.02 * s, waist - 0.03 * s); c.stroke();
  }
  // Arms (shirt sleeves first for the shirted look).
  const sx = 0.095 * s, sy = shoulder + 0.025 * s;
  c.strokeStyle = PAL.skin; c.lineWidth = 0.048 * s;
  const near = x + facing * sx, far = x - facing * sx;
  if (pose === "cheer") {
    const wave = Math.sin(t * 7) * 0.02 * s;
    limb(c, x - sx, sy, x - 0.16 * s, sy - 0.13 * s, x - 0.17 * s + wave, sy - 0.29 * s);
    limb(c, x + sx, sy, x + 0.16 * s, sy - 0.13 * s, x + 0.17 * s - wave, sy - 0.29 * s);
  } else if (pose === "point") {
    limb(c, near, sy, x + facing * 0.15 * s, sy - 0.12 * s, x + facing * 0.21 * s, sy - 0.27 * s);
    limb(c, far, sy, x - facing * 0.17 * s, sy + 0.14 * s, x - facing * 0.1 * s, waist - 0.01 * s);
  } else if (pose === "clap") {
    const open = Math.abs(Math.sin(t * 9)) * 0.035 * s;
    limb(c, far, sy, x - facing * 0.05 * s, sy + 0.16 * s, x + facing * (0.08 * s - open), sy + 0.06 * s);
    limb(c, near, sy, x + facing * 0.15 * s, sy + 0.15 * s, x + facing * (0.1 * s + open), sy + 0.05 * s);
  } else if (pose === "laugh") {
    limb(c, near, sy, x + facing * 0.17 * s, sy - 0.05 * s, x + facing * 0.06 * s, headY - 0.06 * s);
    limb(c, far, sy, x - facing * 0.12 * s, sy + 0.16 * s, x + facing * 0.02 * s, waist - 0.04 * s);
  } else if (pose === "count") {
    limb(c, near, sy, x + facing * 0.12 * s, sy + 0.17 * s, x + facing * 0.15 * s, sy + 0.09 * s);
    limb(c, far, sy, x - facing * 0.04 * s, sy + 0.17 * s, x + facing * 0.11 * s, sy + 0.13 * s);
    // The tally khata.
    c.fillStyle = "#fbf6e6"; c.strokeStyle = PAL.wood; c.lineWidth = Math.max(1, 0.008 * s);
    c.beginPath(); c.rect(x + facing * 0.12 * s - 0.04 * s, sy + 0.03 * s, 0.08 * s, 0.1 * s); c.fill(); c.stroke();
    c.strokeStyle = PAL.skin; c.lineWidth = 0.048 * s;
  } else {
    limb(c, x - sx, sy, x - 0.17 * s, sy + 0.14 * s, x - 0.1 * s, waist - 0.01 * s);
    limb(c, x + sx, sy, x + 0.17 * s, sy + 0.14 * s, x + 0.1 * s, waist - 0.01 * s);
  }
  if (!look.vest) {
    c.strokeStyle = look.top; c.lineWidth = 0.06 * s;
    c.beginPath(); c.moveTo(x - sx, sy); c.lineTo(x - sx - 0.012 * s, sy + 0.05 * s); c.moveTo(x + sx, sy); c.lineTo(x + sx + 0.012 * s, sy + 0.05 * s); c.stroke();
  }
  // Head.
  c.fillStyle = PAL.skin; c.beginPath(); c.arc(x, headY, r, 0, Math.PI * 2); c.fill();
  c.fillStyle = PAL.hair; c.beginPath(); c.arc(x, headY - r * 0.12, r * 1.03, Math.PI * 1.05, Math.PI * 1.95); c.fill();
  if (look.gamchha === "head") {
    c.fillStyle = PAL.red; c.fillRect(x - r * 1.08, headY - r * 0.78, r * 2.16, r * 0.5);
    c.beginPath(); c.moveTo(x - facing * r * 1.0, headY - r * 0.6); c.lineTo(x - facing * r * 1.6, headY - r * 0.1); c.lineTo(x - facing * r * 1.25, headY + r * 0.05); c.closePath(); c.fill();
    c.strokeStyle = "#ffffff"; c.lineWidth = Math.max(1, r * 0.1);
    c.beginPath(); c.moveTo(x - r * 1.05, headY - r * 0.53); c.lineTo(x + r * 1.05, headY - r * 0.53); c.stroke();
  }
  if (s < 30) return;
  c.strokeStyle = PAL.hair; c.fillStyle = PAL.hair; c.lineWidth = Math.max(1, r * 0.13);
  const ex = x + facing * r * 0.42, ey = headY - r * 0.05;
  if (pose === "laugh" || pose === "cheer") { c.beginPath(); c.arc(ex, ey + r * 0.08, r * 0.14, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
  else { c.beginPath(); c.arc(ex, ey, Math.max(1, r * 0.11), 0, Math.PI * 2); c.fill(); }
  if (look.moustache) { c.beginPath(); c.moveTo(x + facing * r * 0.25, headY + r * 0.36); c.quadraticCurveTo(x + facing * r * 0.55, headY + r * 0.28, x + facing * r * 0.8, headY + r * 0.38); c.stroke(); }
  c.beginPath();
  if (pose === "laugh" || pose === "cheer") { c.fillStyle = "#6d2a1d"; c.arc(x + facing * r * 0.48, headY + r * 0.45, r * 0.24, 0, Math.PI); c.fill(); }
  else { c.arc(x + facing * r * 0.48, headY + r * 0.32, r * 0.26, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke(); }
}

/** A river launch seen from the side, `s` pixels long, its waterline at y. */
export function drawLaunch(c: CanvasRenderingContext2D, x: number, waterY: number, s: number, name = "") {
  const h = s * 0.1;
  c.fillStyle = "#7a2f25"; c.beginPath(); c.moveTo(x, waterY - h * 0.3); c.lineTo(x + s, waterY - h * 0.3); c.lineTo(x + s * 0.95, waterY + h * 0.2); c.lineTo(x + s * 0.04, waterY + h * 0.2); c.closePath(); c.fill();
  c.fillStyle = "#f7f6f1"; c.beginPath(); c.moveTo(x - s * 0.02, waterY - h * 1.2); c.lineTo(x + s * 1.03, waterY - h * 1.2); c.lineTo(x + s, waterY - h * 0.3); c.lineTo(x, waterY - h * 0.3); c.closePath(); c.fill();
  c.fillStyle = PAL.blue; c.fillRect(x, waterY - h * 0.62, s, h * 0.14);
  const decks = [[0.06, 0.88, 2.15], [0.14, 0.72, 3.0], [0.24, 0.5, 3.75]];
  for (const [from, width, top] of decks) {
    c.fillStyle = "#f7f6f1"; c.fillRect(x + s * from, waterY - h * top, s * width, h * (top === 2.15 ? 0.95 : 0.85));
    c.fillStyle = top === 3.0 ? PAL.red : PAL.green; c.fillRect(x + s * from, waterY - h * top, s * width, h * 0.12);
    c.fillStyle = "#38505e";
    for (let wx = x + s * (from + 0.025); wx < x + s * (from + width) - s * 0.03; wx += s * 0.045) c.fillRect(wx, waterY - h * (top - 0.3), s * 0.025, h * 0.35);
  }
  c.fillStyle = PAL.red; c.fillRect(x + s * 0.44, waterY - h * 5, s * 0.07, h * 1.3);
  c.fillStyle = PAL.ink; c.fillRect(x + s * 0.44, waterY - h * 5.15, s * 0.07, h * 0.25);
  if (name) {
    c.font = `700 ${Math.round(h * 0.55)}px "Bangla", sans-serif`; c.textAlign = "left"; c.textBaseline = "middle"; c.fillStyle = PAL.blue;
    c.fillText(name, x + s * 0.04, waterY - h * 0.9);
    c.textBaseline = "alphabetic";
  }
}

/** A wooden cargo boat with three sacks aboard. */
export function drawBoat(c: CanvasRenderingContext2D, x: number, waterY: number, s: number) {
  drawSack(c, x + s * 0.36, waterY - s * 0.13, s * 0.26, s * 0.26 * SACK_H, 2);
  drawSack(c, x + s * 0.6, waterY - s * 0.13, s * 0.26, s * 0.26 * SACK_H, 0);
  drawSack(c, x + s * 0.48, waterY - s * 0.26, s * 0.26, s * 0.26 * SACK_H, 1);
  c.fillStyle = PAL.woodDark;
  c.beginPath(); c.moveTo(x, waterY - s * 0.12); c.quadraticCurveTo(x + s * 0.5, waterY + s * 0.12, x + s, waterY - s * 0.12); c.lineTo(x + s * 0.9, waterY - s * 0.04); c.quadraticCurveTo(x + s * 0.5, waterY - s * 0.02, x + s * 0.1, waterY - s * 0.04); c.closePath(); c.fill();
  c.fillStyle = PAL.wood;
  c.beginPath(); c.moveTo(x + s * 0.08, waterY - s * 0.05); c.quadraticCurveTo(x + s * 0.5, waterY + s * 0.1, x + s * 0.92, waterY - s * 0.05); c.quadraticCurveTo(x + s * 0.5, waterY + s * 0.02, x + s * 0.08, waterY - s * 0.05); c.fill();
}

/** The far bank: a line of trees with two coconut palms. */
export function drawBank(c: CanvasRenderingContext2D, width: number, y: number, k: number) {
  c.fillStyle = PAL.bankDark;
  c.beginPath(); c.moveTo(0, y + k * 0.3);
  for (let x = 0; x <= width + k; x += k * 0.9) c.arc(x, y + k * 0.1 - ((x * 7) % 5) * k * 0.06, k * 0.55, Math.PI, 0);
  c.lineTo(width, y + k * 0.4); c.lineTo(0, y + k * 0.4); c.closePath(); c.fill();
  c.fillStyle = PAL.bank; c.fillRect(0, y + k * 0.15, width, k * 0.25);
  for (const px of [0.18, 0.74]) {
    const bx = width * px, top = y - k * 1.6;
    c.strokeStyle = "#6b5232"; c.lineWidth = Math.max(1.5, k * 0.09); c.lineCap = "round";
    c.beginPath(); c.moveTo(bx, y + k * 0.2); c.quadraticCurveTo(bx + k * 0.2, y - k * 0.6, bx + k * 0.1, top); c.stroke();
    c.strokeStyle = PAL.bankDark; c.lineWidth = Math.max(1.5, k * 0.12);
    c.beginPath();
    for (const angle of [-2.6, -2.0, -1.2, -0.5, 0.1]) { c.moveTo(bx + k * 0.1, top); c.quadraticCurveTo(bx + k * 0.1 + Math.cos(angle) * k * 0.5, top + Math.sin(angle) * k * 0.4 - k * 0.1, bx + k * 0.1 + Math.cos(angle) * k * 0.85, top + k * 0.35); }
    c.stroke();
  }
}

/** A godown with a tin roof, its door open on stacked sacks. */
export function drawGodown(c: CanvasRenderingContext2D, x0: number, x1: number, baseY: number, top: number, u: number) {
  const width = x1 - x0, roofH = u * 0.45;
  c.fillStyle = PAL.wall; c.fillRect(x0, top + roofH * 0.6, width, baseY - top - roofH * 0.6);
  c.fillStyle = PAL.wallDark; c.fillRect(x0, baseY - u * 0.12, width, u * 0.12);
  c.fillStyle = PAL.tin;
  c.beginPath(); c.moveTo(x0 - u * 0.1, top + roofH); c.lineTo(x0 + u * 0.12, top); c.lineTo(x1 + u * 0.12, top); c.lineTo(x1 + u * 0.12, top + roofH); c.closePath(); c.fill();
  c.strokeStyle = PAL.tinDark; c.lineWidth = Math.max(1, u * 0.02);
  c.beginPath();
  for (let x = x0; x < x1 + u * 0.1; x += u * 0.1) { c.moveTo(x - u * 0.06, top + roofH); c.lineTo(x + u * 0.06, top + roofH * 0.1); }
  c.stroke();
  const doorL = x0 + width * 0.18, doorR = x1 - width * 0.12, doorT = top + roofH + u * 0.45;
  c.fillStyle = PAL.door; c.fillRect(doorL, doorT, doorR - doorL, baseY - doorT);
  const sw = (doorR - doorL) / 2.2;
  for (let row = 0; row < 4; row++) for (let col = 0; col < 2; col++) {
    const sx = doorL + sw * 0.6 + col * sw * 1.05 + (row % 2) * sw * 0.2, sy = baseY - sw * SACK_H * (row + 0.55);
    if (sy - sw * SACK_H * 0.5 > doorT) drawSack(c, sx, sy, sw, sw * SACK_H, (row + col) % 3);
  }
  c.fillStyle = PAL.sign; c.fillRect(doorL - u * 0.02, top + roofH + u * 0.08, doorR - doorL + u * 0.04, u * 0.28);
  c.font = `800 ${Math.round(u * 0.2)}px "Display", "Bangla", sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = "#ffffff";
  c.fillText("গুদাম", (doorL + doorR) / 2, top + roofH + u * 0.23);
  c.textBaseline = "alphabetic";
}

/** A soft cloud, `s` pixels wide, its base at y. */
export function drawCloud(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  c.fillStyle = "rgba(255,255,255,0.92)";
  c.beginPath();
  c.arc(x + s * 0.3, y - s * 0.12, s * 0.17, 0, Math.PI * 2);
  c.arc(x + s * 0.52, y - s * 0.2, s * 0.22, 0, Math.PI * 2);
  c.arc(x + s * 0.74, y - s * 0.1, s * 0.15, 0, Math.PI * 2);
  c.fill();
  c.beginPath(); c.roundRect(x + s * 0.1, y - s * 0.14, s * 0.8, s * 0.14, s * 0.07); c.fill();
}

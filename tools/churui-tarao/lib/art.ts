// The game's own drawings, shared by the scene, the title and the share card: the birds, a কাকতাড়ুয়া, paddy and a sheaf icon.
// Each draws at the context's origin in units of `size`, so the same art scales from a 30-unit sprite to a 1080 px card.
type Context = CanvasRenderingContext2D;

export const SIT = 0, PECK = 1, WINGS_UP = 2, WINGS_DOWN = 3;

function ellipse(context: Context, x: number, y: number, rx: number, ry: number, rotation: number, color: string) {
  context.fillStyle = color;
  context.beginPath(); context.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2); context.fill();
}

/** A bird's colours and shape: the house sparrow, the শালিক, the মুনিয়া, the টিয়া, and the bosses (bigger, with a crest). */
export type BirdLook = {
  back: string; belly: string; wing: string; streak: string; bar: string; head: string; crown: string; cheek: string;
  bib: string | null; beak: string; tail: string; farWing: string; legs: string;
  /** The bare yellow skin behind a শালিক's eye, a মুনিয়া's scaly breast, a টিয়া's neck ring, a crest, a long tail, a thick beak. */
  patch?: string; scales?: string; ring?: string; crest?: string; longTail?: boolean; thickBeak?: boolean;
};

export const LOOKS: Record<"sparrow" | "shalik" | "munia" | "parrot" | "godha" | "jhunti", BirdLook> = {
  sparrow: { back: "#a06d40", belly: "#ece2d0", wing: "#8f5328", streak: "#3e2615", bar: "#f6efe2", head: "#9c6a3e", crown: "#8e8c86", cheek: "#f3ede0", bib: "#2c2522", beak: "#3a302a", tail: "#5c3a22", farWing: "#6e4526", legs: "#8a5a3c" },
  shalik: { back: "#6b4128", belly: "#8a5634", wing: "#4e2e1c", streak: "#2a1a10", bar: "#f4efe6", head: "#1e1714", crown: "#141010", cheek: "#1e1714", bib: null, beak: "#f2c230", tail: "#24180f", farWing: "#3a2416", legs: "#e0b030", patch: "#f5c42c" },
  munia: { back: "#7a4b2c", belly: "#f3ece0", wing: "#6a3e22", streak: "#3e2615", bar: "#7a4b2c", head: "#6a3e22", crown: "#5c341c", cheek: "#7a4b2c", bib: null, beak: "#6c7784", tail: "#5a3a22", farWing: "#583620", legs: "#8a7a70", scales: "#6b4128", thickBeak: true },
  parrot: { back: "#45a83a", belly: "#8fd46a", wing: "#2f8f2f", streak: "#1f6a24", bar: "#c9ef7a", head: "#4cb840", crown: "#5cc84a", cheek: "#4cb840", bib: null, beak: "#d8322a", tail: "#2f8a4a", farWing: "#277a2a", legs: "#8c8c8c", ring: "#1c1c1c", longTail: true },
  godha: { back: "#8e5a30", belly: "#e4d6bf", wing: "#7a4320", streak: "#2e1a0c", bar: "#f6efe2", head: "#8a5a30", crown: "#6e6c66", cheek: "#efe6d6", bib: "#181210", beak: "#2a221d", tail: "#4a2c18", farWing: "#5a3820", legs: "#7a4a2c" },
  jhunti: { back: "#5a3822", belly: "#7a4a2c", wing: "#3e2416", streak: "#1a100a", bar: "#f4efe6", head: "#161010", crown: "#0e0a0a", cheek: "#161010", bib: null, beak: "#f2c230", tail: "#1a120c", farWing: "#2e1c10", legs: "#e0b030", patch: "#f5c42c", crest: "#0e0a0a" },
};

/** A plump cartoon bird facing right, centred on its body, in `look`'s colours. `size` is about its height. */
export function drawBird(context: Context, size: number, pose: number, look: BirdLook) {
  const s = size;
  const flying = pose === WINGS_UP || pose === WINGS_DOWN;
  context.save();
  context.lineCap = "round"; context.lineJoin = "round";
  // Pecking tips the whole bird forward over its feet.
  if (pose === PECK) { context.translate(0, 0.32 * s); context.rotate(0.55); context.translate(0, -0.32 * s); }

  if (flying) {
    // The far wing, darker, behind the body.
    context.fillStyle = look.farWing;
    context.beginPath();
    if (pose === WINGS_UP) { context.moveTo(0.08 * s, -0.14 * s); context.quadraticCurveTo(0.2 * s, -0.62 * s, 0.02 * s, -0.78 * s); context.lineTo(-0.12 * s, -0.12 * s); }
    else { context.moveTo(0.08 * s, -0.02 * s); context.quadraticCurveTo(0.18 * s, 0.42 * s, 0.02 * s, 0.56 * s); context.lineTo(-0.12 * s, 0.02 * s); }
    context.fill();
  } else {
    context.strokeStyle = look.legs; context.lineWidth = 0.05 * s;
    context.beginPath();
    context.moveTo(-0.02 * s, 0.3 * s); context.lineTo(-0.05 * s, 0.48 * s); context.moveTo(-0.11 * s, 0.48 * s); context.lineTo(0.03 * s, 0.48 * s);
    context.moveTo(0.1 * s, 0.3 * s); context.lineTo(0.11 * s, 0.48 * s); context.moveTo(0.05 * s, 0.48 * s); context.lineTo(0.18 * s, 0.48 * s);
    context.stroke();
  }

  // Tail: a dark wedge cocked up behind (a টিয়া's is long and thin).
  context.fillStyle = look.tail;
  context.beginPath();
  if (look.longTail) {
    context.moveTo(-0.26 * s, 0.0); context.lineTo(-1.15 * s, flying ? 0.02 * s : 0.3 * s); context.lineTo(-1.1 * s, flying ? 0.1 * s : 0.38 * s); context.lineTo(-0.24 * s, 0.16 * s);
  } else {
    context.moveTo(-0.28 * s, -0.02 * s); context.lineTo(-0.74 * s, flying ? -0.06 * s : -0.26 * s); context.lineTo(-0.72 * s, flying ? 0.08 * s : -0.08 * s); context.lineTo(-0.26 * s, 0.16 * s);
  }
  context.closePath(); context.fill();

  // Body: the back, and the belly below it.
  ellipse(context, -0.02 * s, 0.04 * s, 0.42 * s, 0.31 * s, -0.12, look.back);
  context.save();
  context.beginPath(); context.ellipse(-0.02 * s, 0.04 * s, 0.42 * s, 0.31 * s, -0.12, 0, Math.PI * 2); context.clip();
  ellipse(context, 0.06 * s, 0.26 * s, 0.4 * s, 0.22 * s, -0.1, look.belly);
  if (look.scales) {
    // A মুনিয়া's scaly breast: little dark chevrons.
    context.strokeStyle = look.scales; context.lineWidth = 0.025 * s;
    context.beginPath();
    for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) {
      const x = (-0.12 + col * 0.11 + (row % 2) * 0.05) * s, y = (0.14 + row * 0.08) * s;
      context.moveTo(x - 0.03 * s, y); context.lineTo(x, y + 0.03 * s); context.lineTo(x + 0.03 * s, y);
    }
    context.stroke();
  }
  context.restore();

  // Near wing, with dark streaks and a pale bar.
  context.save();
  if (pose === WINGS_UP) { context.translate(0.02 * s, -0.08 * s); context.rotate(-1.75); context.translate(-0.02 * s, 0.08 * s); }
  else if (pose === WINGS_DOWN) { context.translate(0.02 * s, -0.04 * s); context.rotate(1.05); context.translate(-0.02 * s, 0.04 * s); }
  context.fillStyle = look.wing;
  context.beginPath();
  context.moveTo(0.16 * s, -0.1 * s);
  context.quadraticCurveTo(-0.12 * s, -0.2 * s, -0.48 * s, 0.02 * s);
  context.quadraticCurveTo(-0.12 * s, 0.2 * s, 0.14 * s, 0.06 * s);
  context.closePath(); context.fill();
  context.strokeStyle = look.streak; context.lineWidth = 0.035 * s;
  context.beginPath();
  context.moveTo(-0.02 * s, -0.08 * s); context.lineTo(-0.3 * s, 0.0 * s);
  context.moveTo(0.04 * s, 0.02 * s); context.lineTo(-0.26 * s, 0.08 * s);
  context.stroke();
  context.strokeStyle = look.bar; context.lineWidth = (look.patch ? 0.07 : 0.04) * s;
  context.beginPath(); context.moveTo(0.1 * s, -0.04 * s); context.quadraticCurveTo(-0.02 * s, -0.06 * s, -0.12 * s, -0.04 * s); context.stroke();
  context.restore();

  // Head: crown, cheek, the bib if any, beak and eye.
  const hx = 0.3 * s, hy = -0.2 * s;
  if (look.crest) {
    context.fillStyle = look.crest;
    context.beginPath(); context.moveTo(hx - 0.02 * s, hy - 0.18 * s); context.quadraticCurveTo(hx + 0.04 * s, hy - 0.46 * s, hx + 0.2 * s, hy - 0.36 * s); context.quadraticCurveTo(hx + 0.12 * s, hy - 0.26 * s, hx + 0.14 * s, hy - 0.16 * s); context.closePath(); context.fill();
  }
  ellipse(context, hx, hy, 0.24 * s, 0.23 * s, 0, look.head);
  context.save();
  context.beginPath(); context.ellipse(hx, hy, 0.24 * s, 0.23 * s, 0, 0, Math.PI * 2); context.clip();
  ellipse(context, hx + 0.02 * s, hy - 0.16 * s, 0.24 * s, 0.14 * s, 0, look.crown);
  ellipse(context, hx + 0.04 * s, hy + 0.1 * s, 0.17 * s, 0.11 * s, 0, look.cheek);
  if (look.bib) ellipse(context, hx + 0.16 * s, hy + 0.2 * s, 0.1 * s, 0.13 * s, 0, look.bib);
  context.restore();
  if (look.bib) ellipse(context, 0.36 * s, 0.0, 0.08 * s, 0.1 * s, 0.2, look.bib);
  if (look.ring) {
    context.strokeStyle = look.ring; context.lineWidth = 0.035 * s;
    context.beginPath(); context.arc(hx - 0.02 * s, hy + 0.02 * s, 0.2 * s, 0.25 * Math.PI, 0.85 * Math.PI); context.stroke();
  }
  if (look.patch) ellipse(context, 0.36 * s, -0.22 * s, 0.085 * s, 0.07 * s, 0, look.patch);
  context.fillStyle = look.beak;
  context.beginPath();
  if (look.ring) { context.moveTo(0.48 * s, -0.3 * s); context.quadraticCurveTo(0.7 * s, -0.28 * s, 0.6 * s, -0.08 * s); context.lineTo(0.48 * s, -0.14 * s); }
  else if (look.thickBeak) { context.moveTo(0.48 * s, -0.29 * s); context.lineTo(0.68 * s, -0.19 * s); context.lineTo(0.48 * s, -0.09 * s); }
  else { context.moveTo(0.5 * s, -0.25 * s); context.lineTo(0.66 * s, -0.19 * s); context.lineTo(0.5 * s, -0.13 * s); }
  context.closePath(); context.fill();
  ellipse(context, 0.38 * s, -0.23 * s, 0.05 * s, 0.055 * s, 0, "#1c1714");
  ellipse(context, 0.395 * s, -0.245 * s, 0.017 * s, 0.017 * s, 0, "#ffffff");
  context.restore();
}

/** The house sparrow, as the first game drew it. */
export const drawSparrow = (context: Context, size: number, pose: number) => drawBird(context, size, pose, LOOKS.sparrow);

/**
 * The কাকতাড়ুয়া: a bamboo cross in an old checked shirt and lungi, a গামছা at the neck, a clay-pot head with a lime-painted face
 * under a মাথাল. Origin at its foot, `size` tall. mood 0 smiles, 1 frets, 2 worries (the field is going).
 */
export function drawScarecrow(context: Context, size: number, mood: number) {
  const h = size;
  context.save();
  context.lineCap = "round"; context.lineJoin = "round";
  // Bamboo pole and crossbar, with nodes.
  context.fillStyle = "#b3893f";
  context.fillRect(-0.022 * h, -0.84 * h, 0.044 * h, 0.84 * h);
  context.fillRect(-0.44 * h, -0.62 * h, 0.88 * h, 0.032 * h);
  context.fillStyle = "#8a6528";
  for (const y of [-0.08, -0.22]) context.fillRect(-0.026 * h, y * h, 0.052 * h, 0.012 * h);
  for (const x of [-0.3, 0.3]) context.fillRect(x * h, -0.625 * h, 0.012 * h, 0.042 * h);

  // Straw hands.
  context.strokeStyle = "#e9c46a"; context.lineWidth = 0.01 * h;
  context.beginPath();
  for (const side of [-1, 1]) for (let index = 0; index < 4; index++) {
    const a = (index - 1.5) * 0.42;
    context.moveTo(side * 0.37 * h, -0.605 * h); context.lineTo(side * (0.37 + 0.085 * Math.cos(a)) * h, (-0.605 + 0.085 * Math.sin(a)) * h);
  }
  context.stroke();

  // Lungi: a checked wrap from the waist down to the shins.
  context.fillStyle = "#2f5d4a";
  context.beginPath(); context.moveTo(-0.15 * h, -0.34 * h); context.lineTo(0.15 * h, -0.34 * h); context.lineTo(0.17 * h, -0.13 * h); context.lineTo(-0.17 * h, -0.13 * h); context.closePath(); context.fill();
  context.strokeStyle = "#1c3a2e"; context.lineWidth = 0.008 * h;
  context.beginPath();
  for (let x = -0.13; x <= 0.14; x += 0.055) { context.moveTo(x * h, -0.34 * h); context.lineTo(x * 1.1 * h, -0.13 * h); }
  for (let y = -0.3; y < -0.14; y += 0.045) { context.moveTo(-0.16 * h, y * h); context.lineTo(0.16 * h, y * h); }
  context.stroke();
  context.strokeStyle = "#7fb59a"; context.lineWidth = 0.004 * h;
  context.beginPath(); for (let y = -0.28; y < -0.14; y += 0.045) { context.moveTo(-0.16 * h, y * h); context.lineTo(0.16 * h, y * h); } context.stroke();

  // An old checked shirt with its sleeves pulled along the crossbar.
  context.fillStyle = "#5b7fa8";
  context.beginPath();
  context.moveTo(-0.07 * h, -0.67 * h); context.lineTo(-0.38 * h, -0.65 * h); context.lineTo(-0.38 * h, -0.56 * h); context.lineTo(-0.17 * h, -0.555 * h);
  context.lineTo(-0.19 * h, -0.31 * h); context.lineTo(0.19 * h, -0.31 * h); context.lineTo(0.17 * h, -0.555 * h);
  context.lineTo(0.38 * h, -0.56 * h); context.lineTo(0.38 * h, -0.65 * h); context.lineTo(0.07 * h, -0.67 * h);
  context.closePath(); context.fill();
  context.save(); context.clip();
  context.strokeStyle = "#86a5c6"; context.lineWidth = 0.014 * h;
  context.beginPath();
  for (let x = -0.36; x < 0.4; x += 0.07) { context.moveTo(x * h, -0.7 * h); context.lineTo(x * h, -0.3 * h); }
  for (let y = -0.64; y < -0.3; y += 0.07) { context.moveTo(-0.4 * h, y * h); context.lineTo(0.4 * h, y * h); }
  context.stroke();
  context.fillStyle = "#3e5f86"; context.fillRect(-0.4 * h, -0.335 * h, 0.8 * h, 0.03 * h);
  context.restore();
  context.fillStyle = "#e9e2d0";
  for (const y of [-0.52, -0.45, -0.38]) { context.beginPath(); context.arc(0, y * h, 0.011 * h, 0, Math.PI * 2); context.fill(); }
  // A patch on the elbow: it's been in the field a few seasons.
  context.fillStyle = "#b0803e"; context.fillRect(0.22 * h, -0.64 * h, 0.06 * h, 0.06 * h);

  // গামছা: red with white checks, one end hanging.
  context.fillStyle = "#c63c2c";
  context.beginPath(); context.ellipse(0, -0.665 * h, 0.1 * h, 0.03 * h, 0, 0, Math.PI * 2); context.fill();
  context.beginPath(); context.moveTo(0.04 * h, -0.66 * h); context.lineTo(0.1 * h, -0.66 * h); context.lineTo(0.12 * h, -0.5 * h); context.lineTo(0.065 * h, -0.5 * h); context.closePath(); context.fill();
  context.strokeStyle = "#fbe9dc"; context.lineWidth = 0.006 * h;
  context.beginPath();
  context.moveTo(-0.09 * h, -0.67 * h); context.lineTo(0.09 * h, -0.67 * h);
  for (const y of [-0.6, -0.54]) { context.moveTo(0.05 * h, y * h); context.lineTo(0.11 * h, y * h); }
  context.moveTo(0.085 * h, -0.65 * h); context.lineTo(0.095 * h, -0.5 * h);
  context.stroke();

  // The clay-pot head, upside down on the pole, its mouth rim at the bottom.
  const py = -0.765 * h;
  const pot = context.createRadialGradient(-0.04 * h, py - 0.04 * h, 0.01 * h, 0, py, 0.13 * h);
  pot.addColorStop(0, "#d9804a"); pot.addColorStop(1, "#a94c24");
  context.fillStyle = pot;
  context.beginPath(); context.ellipse(0, py, 0.115 * h, 0.1 * h, 0, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#8e3d1c"; context.fillRect(-0.06 * h, py + 0.085 * h, 0.12 * h, 0.022 * h);
  // The face, painted with lime.
  context.strokeStyle = "#fbf6ea"; context.fillStyle = "#fbf6ea"; context.lineWidth = 0.011 * h;
  for (const side of [-1, 1]) {
    context.beginPath(); context.arc(side * 0.042 * h, py - 0.018 * h, 0.019 * h, 0, Math.PI * 2); context.fill();
    context.beginPath();
    const lift = mood === 2 ? -0.012 : 0;
    context.moveTo(side * 0.065 * h, (py - 0.05 + (mood === 0 ? 0 : -lift)) * h);
    context.lineTo(side * 0.022 * h, (py - 0.052 + lift) * h);
    context.stroke();
  }
  context.fillStyle = "#1e1612";
  for (const side of [-1, 1]) { context.beginPath(); context.arc(side * 0.042 * h, py - 0.016 * h, 0.008 * h, 0, Math.PI * 2); context.fill(); }
  // A grand curled moustache.
  context.beginPath();
  context.moveTo(0, py + 0.022 * h);
  context.quadraticCurveTo(-0.04 * h, py + 0.006 * h, -0.07 * h, py + 0.022 * h); context.quadraticCurveTo(-0.08 * h, py + 0.006 * h, -0.064 * h, py + 0.004 * h);
  context.moveTo(0, py + 0.022 * h);
  context.quadraticCurveTo(0.04 * h, py + 0.006 * h, 0.07 * h, py + 0.022 * h); context.quadraticCurveTo(0.08 * h, py + 0.006 * h, 0.064 * h, py + 0.004 * h);
  context.stroke();
  context.beginPath();
  if (mood === 0) { context.arc(0, py + 0.03 * h, 0.03 * h, 0.2 * Math.PI, 0.8 * Math.PI); context.stroke(); }
  else if (mood === 1) { context.moveTo(-0.022 * h, py + 0.054 * h); context.lineTo(0.022 * h, py + 0.054 * h); context.stroke(); }
  else { context.ellipse(0, py + 0.058 * h, 0.012 * h, 0.016 * h, 0, 0, Math.PI * 2); context.stroke(); }

  // মাথাল: the wide bamboo farmer's hat.
  const hy = -0.855 * h;
  context.fillStyle = "#cfa652";
  context.beginPath(); context.ellipse(0, hy, 0.2 * h, 0.04 * h, 0, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#e0bb66";
  context.beginPath(); context.moveTo(-0.2 * h, hy); context.quadraticCurveTo(0, hy - 0.11 * h, 0.2 * h, hy); context.quadraticCurveTo(0, hy + 0.03 * h, -0.2 * h, hy); context.fill();
  context.strokeStyle = "#a98035"; context.lineWidth = 0.006 * h;
  context.beginPath();
  for (let index = -3; index <= 3; index++) { context.moveTo(index * 0.05 * h, hy + 0.012 * h); context.lineTo(index * 0.012 * h, hy - 0.06 * h); }
  context.moveTo(-0.17 * h, hy + 0.01 * h); context.quadraticCurveTo(0, hy + 0.05 * h, 0.17 * h, hy + 0.01 * h);
  context.stroke();
  context.restore();
}

/** A world's paddy colours: blades, the two stem shades, the two grain shades. */
export type PaddyColors = readonly [string, string, string, string, string];
export const GOLDEN_PADDY: PaddyColors = ["#9c9a36", "#a8963a", "#b9a446", "#f3c650", "#e2a93a"];

/** One clump of ripe paddy: long blades, and thin stems bowing under heavy golden শীষ. Origin at the base, `size` tall. */
export function drawPaddy(context: Context, size: number, lean: number, seed: number, colors: PaddyColors = GOLDEN_PADDY) {
  const h = size;
  context.lineCap = "round";
  const rand = (index: number) => ((seed * 31 + index * 17 + 7) % 23) / 23;
  // Blades first, fanning out low.
  context.strokeStyle = colors[0]; context.lineWidth = 0.04 * h;
  context.beginPath();
  for (let index = 0; index < 4; index++) {
    const spread = (index - 1.5) * 0.28 + lean * 0.3;
    context.moveTo((index - 1.5) * 0.03 * h, 0);
    context.quadraticCurveTo(spread * 0.3 * h, -0.45 * h, spread * h * 0.75, -0.62 * h + Math.abs(spread) * 0.3 * h);
  }
  context.stroke();
  for (let index = 0; index < 6; index++) {
    const r = rand(index);
    const x = (index - 2.5) * 0.035 * h, bow = lean + (index - 2.5) * 0.16 + (r - 0.5) * 0.25;
    const tipX = x + bow * 0.5 * h, tipY = -h * (0.8 + r * 0.2);
    context.strokeStyle = index % 2 ? colors[1] : colors[2]; context.lineWidth = 0.028 * h;
    context.beginPath(); context.moveTo(x, 0); context.quadraticCurveTo(x + bow * 0.08 * h, tipY * 0.7, tipX, tipY); context.stroke();
    // The শীষ hangs over from the tip: grains along a drooping curve, smaller toward the end.
    const dir = bow >= 0 ? 1 : -1;
    for (let grain = 0; grain < 7; grain++) {
      const u = grain / 6;
      context.fillStyle = (grain + index) % 2 ? colors[3] : colors[4];
      context.beginPath();
      context.ellipse(tipX + dir * (0.07 + u * 0.12) * h, tipY + (0.02 + u * u * 0.34) * h, (0.034 - u * 0.012) * h, (0.05 - u * 0.016) * h, dir * (0.3 + u * 0.9), 0, Math.PI * 2);
      context.fill();
    }
  }
}

/** A small sheaf of paddy for the grain meter: three heads tied with a straw band. Centred, `size` tall. */
export function drawSheaf(context: Context, size: number) {
  const s = size;
  context.save();
  context.lineCap = "round";
  context.strokeStyle = "#c48d2a"; context.lineWidth = 0.08 * s;
  context.beginPath();
  for (const dx of [-0.12, 0, 0.12]) { context.moveTo(dx * 0.4 * s, 0.48 * s); context.quadraticCurveTo(dx * 0.6 * s, 0, dx * 2.2 * s, -0.3 * s); }
  context.stroke();
  context.fillStyle = "#ffd257";
  for (const [dx, dir] of [[-0.26, -1], [0, 1], [0.26, 1]] as const) {
    for (let grain = 0; grain < 4; grain++) {
      const u = grain / 3;
      context.beginPath(); context.ellipse(dx * s + dir * u * 0.1 * s, -0.32 * s + u * 0.2 * s - (dx === 0 ? 0.1 * s : 0), 0.07 * s, 0.1 * s, dir * 0.5, 0, Math.PI * 2); context.fill();
    }
  }
  context.fillStyle = "#8a5a1a"; context.fillRect(-0.16 * s, 0.12 * s, 0.32 * s, 0.08 * s);
  context.restore();
}

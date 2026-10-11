// The drawings, seen from above at a slight tilt, lit by a low dawn sun from the top left (shadows fall right and down).
// Every function draws in logical units around its own origin; the scene paints them once into sprites, the card scales them up.
// Things on the road: centred on x = 0, the near edge (the end that reaches the bike first) on y = 0, the rest going up.

type Ctx = CanvasRenderingContext2D;

export const C = {
  road: "#ebc9a0", roadDeep: "#dcb084", rut: "#d3a574", cell: "#b98657", cellLight: "#f4dcbc",
  grass: "#93b866", grassDeep: "#7aa14f", grassLight: "#aecb7f", leaf: "#4f7d3a", leafLight: "#6c9a48",
  ink: "#2b2118", shadow: "rgba(58,38,20,0.24)", cream: "#fff6e6", paper: "#fffaf0", terracotta: "#b8643c",
  shirt: "#f4ead6", shirtShade: "#dcccb0", skin: "#a8724a", hair: "#241a12", pants: "#4c5d70", bag: "#a87a45", bagDeep: "#7c5631",
  steel: "#c9cfd4", tyre: "#2a2522", frame: "#1f3d4a", gamchha: "#c8463d", stamp: "#d0573d", glow: "rgba(255,226,150,0.55)",
};

const TAU = Math.PI * 2;

function ellipse(c: Ctx, x: number, y: number, rx: number, ry: number, color: string, rotation = 0) {
  c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, rotation, 0, TAU); c.fill();
}
function rounded(c: Ctx, x: number, y: number, w: number, h: number, r: number, color: string) {
  c.fillStyle = color; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill();
}
function line(c: Ctx, points: number[], color: string, width: number) {
  c.strokeStyle = color; c.lineWidth = width; c.lineCap = "round"; c.lineJoin = "round";
  c.beginPath(); c.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) c.lineTo(points[i], points[i + 1]);
  c.stroke();
}

/**
 * The letter carrier on an old black roadster, from above and behind: cream shirt, a red-check gamchha on the shoulder,
 * a cloth bag of letters at the hip, a bundle tied on the carrier, a bell on the right grip. `pedal` 0 or 1 swaps the knees.
 * No uniform, no cap, no badge. The front wheel's tip is at y = 0; the bike runs down to about y = 60.
 */
export function drawBike(c: Ctx, pedal: number) {
  ellipse(c, 5, 34, 13, 30, C.shadow, 0.05);
  // wheels: thin tyres seen from above, with a mudguard strip
  rounded(c, -2.6, 0, 5.2, 23, 2.6, C.tyre);
  rounded(c, -2.6, 38, 5.2, 23, 2.6, C.tyre);
  rounded(c, -1.4, 2, 2.8, 17, 1.4, "#55504c");
  rounded(c, -1.4, 44, 2.8, 15, 1.4, "#55504c");
  line(c, [0, 12, 0, 46], C.frame, 3.4);
  // carrier rack and the letter bundle tied with string
  rounded(c, -7.5, 45, 15, 12, 2, "#6e4a2c");
  rounded(c, -6.5, 46, 13, 9.5, 1.5, C.paper);
  line(c, [-6.5, 50.5, 6.5, 50.5], "#c94a3a", 1);
  line(c, [0, 46, 0, 55.5], "#c94a3a", 1);
  line(c, [-5, 47.5, 4, 47.5], "#d8c9ac", 0.6);
  // knees and shins either side of the frame
  const left = pedal ? 30 : 23, right = pedal ? 23 : 30;
  ellipse(c, -6.5, left, 3.6, 6, C.pants);
  ellipse(c, 6.5, right, 3.6, 6, C.pants);
  ellipse(c, -6.5, left - 6, 2.4, 2, "#3a2a1e");
  ellipse(c, 6.5, right - 6, 2.4, 2, "#3a2a1e");
  // handlebar, grips and the bell on the right
  c.strokeStyle = "#3b4246"; c.lineWidth = 2; c.lineCap = "round";
  c.beginPath(); c.moveTo(-13, 17); c.quadraticCurveTo(0, 10, 13, 17); c.stroke();
  line(c, [-13, 17, -14.5, 19], "#5a3b28", 3.2);
  line(c, [13, 17, 14.5, 19], "#5a3b28", 3.2);
  ellipse(c, 9, 13.6, 2.8, 2.8, C.steel);
  ellipse(c, 8.3, 12.9, 1, 1, "#ffffff");
  // the bag strap across the back, then the bag at the left hip with letters peeking out
  line(c, [8, 28, -12, 40], C.bagDeep, 2.2);
  rounded(c, -19, 34, 10, 13, 2.5, C.bag);
  rounded(c, -18, 33, 3.4, 4, 0.6, C.paper);
  rounded(c, -14.6, 32.4, 3.4, 4.4, 0.6, "#fde7c4");
  rounded(c, -19, 36, 10, 4, 1.5, C.bagDeep);
  // arms to the grips
  line(c, [-9, 29, -12.5, 19], C.skin, 3.4);
  line(c, [9, 29, 12.5, 19], C.skin, 3.4);
  line(c, [-9.3, 29.5, -10.6, 25], C.shirt, 4.2);
  line(c, [9.3, 29.5, 10.6, 25], C.shirt, 4.2);
  // back and shoulders, the gamchha over the right shoulder, the head
  ellipse(c, 0, 32, 11, 7.6, C.shirt);
  ellipse(c, 1.5, 34.5, 8, 4.5, C.shirtShade);
  c.save(); c.translate(5, 29.5); c.rotate(-0.5);
  rounded(c, -2.5, -6, 5, 12, 2, C.gamchha);
  c.fillStyle = "#ffffffaa"; c.fillRect(-2.5, -3, 5, 1); c.fillRect(-2.5, 1, 5, 1); c.fillRect(-0.5, -6, 1, 12);
  c.restore();
  ellipse(c, -6, 26.5, 1.6, 2.1, C.skin);
  ellipse(c, 6, 26.5, 1.6, 2.1, C.skin);
  ellipse(c, 0, 25.5, 5.8, 6.2, C.hair);
  ellipse(c, -1.6, 23.6, 2, 1.4, "#4a3626");
}

const COWS = [
  { body: "#f3ece0", patch: "#8a5a3c", face: "#efe4d2" },
  { body: "#b9773f", patch: "#94582b", face: "#c88a52" },
  { body: "#efe8dc", patch: "#2f2a26", face: "#e9e0d0" },
];

/** A humped village cow standing along the lane, facing you, chewing. About 44 wide, 96 long. */
export function drawCow(c: Ctx, look: number) {
  const coat = COWS[look % 3];
  ellipse(c, 6, -46, 22, 44, C.shadow);
  for (const [x, y] of [[-17, -24], [17, -24], [-16, -74], [16, -74]] as const) ellipse(c, x, y, 3.6, 5, "#5b4636");
  c.strokeStyle = coat.patch; c.lineWidth = 2.4; c.lineCap = "round";
  c.beginPath(); c.moveTo(0, -86); c.quadraticCurveTo(7, -92, 4, -100); c.stroke();
  ellipse(c, 4, -101, 2.6, 3.4, "#3a2d24");
  ellipse(c, 0, -54, 19, 36, coat.body);
  ellipse(c, -6, -66, 7, 9, coat.patch, 0.4);
  ellipse(c, 8, -46, 6, 8, coat.patch, -0.3);
  ellipse(c, -3, -38, 4, 3, coat.patch);
  ellipse(c, 0, -30, 13, 9, coat.face);
  ellipse(c, -4, -60, 8, 22, "#ffffff22");
  // head with horns, ears, eyes and a pink muzzle; a red rope round the neck
  line(c, [-10, -21, 10, -21], "#c0392b", 1.8);
  c.strokeStyle = "#e9dcc0"; c.lineWidth = 2.6;
  c.beginPath(); c.moveTo(-5, -17); c.quadraticCurveTo(-11, -22, -9, -28); c.stroke();
  c.beginPath(); c.moveTo(5, -17); c.quadraticCurveTo(11, -22, 9, -28); c.stroke();
  ellipse(c, -12, -14, 5, 2.6, coat.face, 0.3);
  ellipse(c, 12, -14, 5, 2.6, coat.face, -0.3);
  ellipse(c, 0, -10, 8.5, 10.5, coat.face);
  ellipse(c, 0, -2.5, 6.5, 4.6, "#e8b4a6");
  ellipse(c, -2.4, -2.5, 1.1, 1.3, "#7a4a3e");
  ellipse(c, 2.4, -2.5, 1.1, 1.3, "#7a4a3e");
  ellipse(c, -4.4, -10, 1.6, 1.9, C.ink);
  ellipse(c, 4.4, -10, 1.6, 1.9, C.ink);
  ellipse(c, -4, -10.6, 0.5, 0.5, "#ffffff");
  ellipse(c, 4.8, -10.6, 0.5, 0.5, "#ffffff");
}

const GOATS = [
  { body: "#2c2622", ear: "#3d3530", face: "#36302b" },
  { body: "#f1ebe1", ear: "#e3d6c6", face: "#f6f1e8" },
  { body: "#9a6a42", ear: "#7d5232", face: "#a87a50" },
];

/** A small goat with floppy ears and a beard, facing you. About 30 wide, 46 long. */
export function drawGoat(c: Ctx, look: number) {
  const coat = GOATS[look % 3];
  ellipse(c, 5, -22, 14, 22, C.shadow);
  for (const [x, y] of [[-9, -16], [9, -16], [-8, -34], [8, -34]] as const) ellipse(c, x, y, 2.2, 3.4, "#3a2d24");
  line(c, [0, -40, 1, -46], coat.body, 3);
  ellipse(c, 0, -27, 10.5, 15, coat.body);
  ellipse(c, -3, -31, 4, 8, "#ffffff1c");
  ellipse(c, -8.5, -8, 5.5, 2.4, coat.ear, 0.7);
  ellipse(c, 8.5, -8, 5.5, 2.4, coat.ear, -0.7);
  line(c, [-2.5, -14, -4, -19], "#cbbfa8", 1.8);
  line(c, [2.5, -14, 4, -19], "#cbbfa8", 1.8);
  ellipse(c, 0, -8, 5.6, 8, coat.face);
  ellipse(c, 0, -1.4, 3.6, 2.6, look % 3 === 0 ? "#4a403a" : "#e6c1b3");
  ellipse(c, 0, 2.2, 1.6, 2.4, look % 3 === 1 ? "#d9cdbd" : "#6b5d52");
  ellipse(c, -2.8, -8.5, 1.4, 1.3, "#e8c45a");
  ellipse(c, 2.8, -8.5, 1.4, 1.3, "#e8c45a");
  c.fillStyle = C.ink; c.fillRect(-3.4, -8.8, 1.2, 0.6); c.fillRect(2.2, -8.8, 1.2, 0.6);
}

/** A wooden push cart parked in the lane, handles towards you: sacks, vegetables or hay. About 54 wide, 82 long. */
export function drawCart(c: Ctx, look: number) {
  ellipse(c, 6, -40, 26, 40, C.shadow);
  line(c, [-15, 0, -17, -26], "#7a4f2b", 2.6);
  line(c, [15, 0, 17, -26], "#7a4f2b", 2.6);
  line(c, [-15.5, -4, 15.5, -4], "#7a4f2b", 2.2);
  rounded(c, -27, -62, 6, 24, 3, C.tyre);
  rounded(c, 21, -62, 6, 24, 3, C.tyre);
  rounded(c, -22, -80, 44, 56, 3, "#b98250");
  c.fillStyle = "#94622f";
  for (let y = -72; y < -24; y += 8) c.fillRect(-22, y, 44, 1.2);
  rounded(c, -22, -80, 44, 3, 1.5, "#8a5a2c");
  rounded(c, -22, -27, 44, 3, 1.5, "#8a5a2c");
  if (look % 3 === 0) {
    for (const [x, y, r] of [[-10, -64, 0.2], [10, -66, -0.15], [-9, -42, -0.1], [10, -42, 0.18]] as const) {
      c.save(); c.translate(x, y); c.rotate(r);
      rounded(c, -9, -10, 18, 20, 6, "#dcc196");
      c.strokeStyle = "#b99c6e"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-6, -2); c.lineTo(6, -2); c.moveTo(-6, 3); c.lineTo(6, 3); c.stroke();
      ellipse(c, 0, -10, 3, 1.6, "#a88458");
      c.restore();
    }
  } else if (look % 3 === 1) {
    for (const [x, y, r, color] of [[-11, -66, 7, "#7fb04e"], [4, -70, 7.5, "#8cbc55"], [13, -56, 6, "#e08a2c"], [-6, -52, 7, "#6fa043"], [8, -40, 7, "#7fb04e"], [-12, -37, 6, "#e08a2c"]] as const) {
      ellipse(c, x, y, r, r, color);
      ellipse(c, x - r * 0.3, y - r * 0.3, r * 0.4, r * 0.35, "#ffffff33");
    }
  } else {
    ellipse(c, 0, -52, 21, 26, "#e2b856");
    c.strokeStyle = "#c79a3a"; c.lineWidth = 0.9;
    c.beginPath();
    for (let i = 0; i < 9; i++) { const x = -15 + i * 3.8; c.moveTo(x, -70 + (i % 3) * 3); c.quadraticCurveTo(x + 3, -52, x - 1, -32 - (i % 2) * 3); }
    c.stroke();
    line(c, [-20, -52, 20, -52], "#8a5a2c", 1.4);
  }
}

/** A muddy puddle reflecting the dawn sky. About 60 wide, 38 long. */
export function drawPuddle(c: Ctx, look: number) {
  const tilt = (look - 1) * 0.12;
  ellipse(c, 1, -17, 30, 19, "#a77a53", tilt);
  ellipse(c, -13, -24, 12, 9, "#a77a53");
  ellipse(c, 0, -17, 26, 15.5, "#7f6a5a", tilt);
  ellipse(c, 0, -18, 23, 13, "#93aebb", tilt);
  ellipse(c, -6, -21, 12, 5, "#f2c9b6aa", tilt - 0.2);
  ellipse(c, 9, -13, 7, 3, "#d9e6ea99", tilt);
  c.strokeStyle = "#ffffff88"; c.lineWidth = 0.9;
  c.beginPath(); c.ellipse(4, -16, 9, 4.5, tilt, 0, TAU); c.stroke();
  for (const [x, y] of [[-27, -6], [24, -30], [28, -8], [-22, -33]] as const) ellipse(c, x, y, 2.2, 1.6, "#9d7149");
}

/** An envelope with a stamp of our own (a little sun), on a soft glow. About 26 wide, 18 long. */
export function drawLetter(c: Ctx, look: number) {
  ellipse(c, 0, -10, 19, 15, C.glow);
  c.save(); c.translate(0, -10); c.rotate((look - 1) * 0.16);
  rounded(c, -11, -7.5, 22, 15, 1.5, "#00000022");
  rounded(c, -12, -8.5, 22, 15, 1.5, C.paper);
  c.strokeStyle = "#c9a77a"; c.lineWidth = 0.9; c.beginPath(); c.roundRect(-12, -8.5, 22, 15, 1.5); c.moveTo(-12, -8.5); c.lineTo(-1, -0.5); c.lineTo(10, -8.5); c.stroke();
  rounded(c, 3.6, -7, 5, 5.4, 0.6, C.stamp);
  ellipse(c, 6.1, -4.3, 1.4, 1.4, "#ffd98a");
  c.restore();
}

export const DRAW_THING = [drawPuddle, drawGoat, drawCart, drawCow, drawLetter] as const;

// ---------- the roadside ----------

/** A date palm from above, its clay pot tied under the crown for the morning sap. Spans about 50. */
export function drawPalm(c: Ctx) {
  c.save(); c.translate(6, 4);
  c.fillStyle = C.shadow;
  for (let i = 0; i < 10; i++) { c.save(); c.rotate(i * TAU / 10); c.beginPath(); c.ellipse(13, 0, 13, 3.2, 0, 0, TAU); c.fill(); c.restore(); }
  c.restore();
  for (let i = 0; i < 10; i++) {
    c.save(); c.rotate(i * TAU / 10 + 0.15);
    ellipse(c, 13, 0, 13.5, 3.4, i % 2 ? C.leaf : "#5a8a40");
    line(c, [2, 0, 25, 0], "#86ad5c", 0.6);
    c.restore();
  }
  ellipse(c, 0, 0, 4, 4, "#7b5a36");
  ellipse(c, 5, 5, 3.4, 3, C.terracotta);
  ellipse(c, 4.4, 4.2, 1.6, 1, "#d9895c");
}

/** A banana plant: a few broad leaves with pale midribs. Spans about 46. */
export function drawBanana(c: Ctx) {
  const leaves = [[0.3, 20], [1.5, 18], [2.6, 21], [3.7, 17], [4.9, 19], [5.8, 16]] as const;
  for (const [a, l] of leaves) { c.save(); c.translate(5, 4); c.rotate(a); ellipse(c, l / 2, 0, l / 2 + 1, 6, C.shadow); c.restore(); }
  for (const [a, l] of leaves) {
    c.save(); c.rotate(a);
    ellipse(c, l / 2, 0, l / 2 + 1, 6, "#78ad4c");
    ellipse(c, l / 2, -2, l / 2, 2.6, "#8cc05c");
    line(c, [1, 0, l, 0], "#d6e8a6", 0.9);
    c.restore();
  }
  ellipse(c, 0, 0, 3.6, 3.6, "#5d8a3a");
}

/** A round bush. Spans about 26. */
export function drawBush(c: Ctx) {
  ellipse(c, 5, 4, 13, 10, C.shadow);
  for (const [x, y, r] of [[-6, 2, 7], [5, 3, 7.5], [0, -5, 8]] as const) ellipse(c, x, y, r, r, C.leafLight);
  for (const [x, y, r] of [[-7, 0, 3], [3, -7, 3.4], [6, 1, 2.6]] as const) ellipse(c, x, y, r, r, "#88b45e");
  for (const [x, y] of [[-3, 4], [6, -3], [-1, -3]] as const) ellipse(c, x, y, 1.1, 1.1, "#f2d36b");
}

/** A haystack round a bamboo pole. Spans about 34. */
export function drawHay(c: Ctx) {
  ellipse(c, 6, 5, 17, 14, C.shadow);
  ellipse(c, 0, 0, 16, 16, "#e3ba57");
  c.strokeStyle = "#c99a3a"; c.lineWidth = 1;
  for (let r = 4; r < 16; r += 4) { c.beginPath(); c.arc(0, 0, r, 0.3, TAU - 0.6); c.stroke(); }
  ellipse(c, -4, -5, 6, 4, "#f2d27e88");
  ellipse(c, 0, 0, 2, 2, "#6e5233");
}

/** A small pond with water hyacinth and a ripple. About 54 by 74. */
export function drawPond(c: Ctx) {
  ellipse(c, 0, 0, 27, 37, "#6f9a55");
  ellipse(c, 0, 0, 23.5, 33.5, "#7da9b8");
  ellipse(c, -6, -10, 12, 16, "#9ac0cc");
  ellipse(c, -7, -16, 6, 7, "#f6cdb999");
  c.strokeStyle = "#ffffff77"; c.lineWidth = 0.8; c.beginPath(); c.ellipse(5, 10, 7, 4, 0, 0, TAU); c.stroke();
  for (const [x, y] of [[12, -18], [15, -10], [9, -24], [-14, 18], [-9, 24], [-16, 11]] as const) {
    ellipse(c, x, y, 4, 3.4, "#5d9a48");
    ellipse(c, x + 0.6, y - 0.4, 1.1, 1.1, "#c9a3d8");
  }
}

/** A tin roof from above with its ridge, a few rust spots and a pumpkin vine on one side. About 58 by 46. */
export function drawRoof(c: Ctx) {
  rounded(c, -24, -18, 58, 46, 2, C.shadow);
  rounded(c, -29, -23, 58, 46, 2, "#9eabb0");
  c.fillStyle = "#8a979c";
  for (let x = -27; x < 29; x += 5) c.fillRect(x, -23, 1.4, 46);
  rounded(c, -29, -2, 58, 3.6, 1, "#7d898e");
  for (const [x, y, r] of [[-15, -14, 3], [10, 9, 4], [18, -16, 2.4]] as const) ellipse(c, x, y, r, r * 0.8, "#b0714a99");
  for (const [x, y] of [[-26, 14], [-20, 19], [-12, 21]] as const) ellipse(c, x, y, 4.4, 3.4, "#6f9f48");
}

/** A patch of mustard in flower. About 46 by 58. */
export function drawMustard(c: Ctx) {
  rounded(c, -23, -29, 46, 58, 6, "#9cbf5e");
  c.fillStyle = "#f2cf3d";
  for (let y = -25; y < 26; y += 5) for (let x = -20 + (y % 10 ? 2.5 : 0); x < 21; x += 5) { c.beginPath(); c.arc(x, y, 1.7, 0, TAU); c.fill(); }
  c.fillStyle = "#ffe789";
  for (let y = -22; y < 26; y += 10) for (let x = -18; x < 21; x += 10) { c.beginPath(); c.arc(x, y, 1, 0, TAU); c.fill(); }
}

export const DRAW_PROP = [drawPalm, drawBanana, drawBush, drawHay, drawPond, drawRoof, drawMustard] as const;
/** Half the size of each prop, for its sprite box. */
export const PROP_HALF = [[30, 30], [26, 26], [16, 14], [22, 21], [29, 39], [36, 30], [25, 31]] as const;

/** A roadside milestone: a whitewashed stone with a terracotta cap, drawn at the base (0, 0). */
export function drawMilestone(c: Ctx) {
  ellipse(c, 5, 2, 12, 5, C.shadow);
  rounded(c, -10, -22, 20, 24, 4, "#f4efe4");
  rounded(c, -10, -22, 20, 8, 4, C.terracotta);
  rounded(c, -10, -16, 20, 2, 0, "#f4efe4");
}

/** A small flag on a bamboo pole where a friend stopped. Base at (0, 0). */
export function drawFlag(c: Ctx) {
  ellipse(c, 4, 1, 6, 2.4, C.shadow);
  line(c, [0, 0, 0, -38], "#a8865a", 2);
  c.fillStyle = "#e5483b"; c.beginPath(); c.moveTo(1, -38); c.lineTo(22, -32); c.lineTo(1, -25); c.closePath(); c.fill();
  c.fillStyle = "#ffd166"; c.beginPath(); c.moveTo(1, -38); c.lineTo(11, -35); c.lineTo(1, -31.5); c.closePath(); c.fill();
}

/** The road's look, one tile of `height` units tall, `width` wide, starting at x = 0: verges, dusty road, cell dividers. */
export function paintRoad(c: Ctx, width: number, height: number, roadLeft: number, laneWidth: number, lanes: number) {
  const roadRight = roadLeft + laneWidth * lanes;
  c.fillStyle = C.grass; c.fillRect(0, 0, width, height);
  // grass texture: a deterministic scatter so the tile repeats cleanly
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 140; i++) {
    const side = i % 2, x = side ? roadRight + 4 + rand() * (width - roadRight - 4) : rand() * (roadLeft - 4), y = rand() * height;
    const tone = rand();
    c.strokeStyle = tone < 0.5 ? C.grassDeep : C.grassLight; c.lineWidth = 1;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x - 1.5, y - 4); c.moveTo(x, y); c.lineTo(x + 1.5, y - 4); c.stroke();
    if (tone > 0.93) ellipse(c, x + 3, y - 2, 1.2, 1.2, tone > 0.965 ? "#fff3c4" : "#f0b8c8");
  }
  // the dusty road with two faint wheel ruts a lane and a light LCD-like cell grid: a nod to the old handheld screens
  c.fillStyle = C.road; c.fillRect(roadLeft, 0, roadRight - roadLeft, height);
  c.fillStyle = "rgba(160,110,60,0.07)";
  for (let x = roadLeft + 2; x < roadRight; x += 12) c.fillRect(x, 0, 1, height);
  for (let y = 0; y < height; y += 12) c.fillRect(roadLeft, y, roadRight - roadLeft, 1);
  for (let lane = 0; lane < lanes; lane++) {
    const mid = roadLeft + laneWidth * (lane + 0.5);
    c.fillStyle = "rgba(190,140,90,0.22)"; c.fillRect(mid - 15, 0, 5, height); c.fillRect(mid + 10, 0, 5, height);
  }
  for (let i = 0; i < 60; i++) ellipse(c, roadLeft + 4 + rand() * (roadRight - roadLeft - 8), rand() * height, 0.6 + rand() * 1.2, 0.5 + rand() * 0.8, rand() < 0.5 ? "#c9a07a" : "#f6dfc0");
  // lane dividers as columns of little square cells: three on, a gap
  for (let lane = 1; lane < lanes; lane++) {
    const x = roadLeft + laneWidth * lane;
    for (let y = 2; y < height; y += 48) for (let k = 0; k < 3; k++) {
      rounded(c, x - 4, y + k * 10, 8, 8, 1.5, C.cell);
      c.fillStyle = "#ffffff33"; c.fillRect(x - 3, y + k * 10 + 1, 3, 1.5);
    }
  }
  // soft grassy edges where the road meets the verge
  for (const edge of [roadLeft, roadRight]) {
    c.fillStyle = C.grassDeep; c.fillRect(edge - 2, 0, 4, height);
    for (let y = 0; y < height; y += 6) ellipse(c, edge + (edge === roadLeft ? 2 : -2), y + rand() * 4, 2.6 + rand() * 1.4, 2.2, rand() < 0.5 ? C.grass : C.grassDeep);
  }
}

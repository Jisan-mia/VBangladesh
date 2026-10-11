// Original art, drawn with plain canvas paths: painted clay pots in the spirit of Rajshahi's শখের হাঁড়ি, a cloth ball, a bamboo লাঠি and a fair stall. Shared by the board and the card.
import { BALL_R, CELL, COLS, H, POT_DROP, ROPE_Y, ROW_GAP, ROWS, STICK_H, STICK_Y, TOP, W, WALL } from "./game";

export const palette = {
  cloth: "#fbf0d6", clothStripe: "#f4e4c1",
  awning: "#b4372a", awningDeep: "#7d2117", awningLight: "#f7e6c4",
  bamboo: "#d8b169", bambooDark: "#a47a34", bambooNode: "#7f5a22",
  rope: "#8b6b45", ground: "#d6a66c", groundDark: "#b4844e",
  ink: "#2b1a10", red: "#c1352b", green: "#2f6b3a", ochre: "#e5ae3d", cream: "#f2dca8", white: "#fff6e2",
  ball: "#2f4a8a", ballDeep: "#1d2f5e", toughBody: "#7e3a20",
};

/** Body and paint colours for the six paintings; tough pots use a dark body with white paint. */
export const DESIGN_BODY = ["#f2dca8", "#e6ad3e", "#f2dca8", "#e6ad3e", "#b8452c", "#f2dca8"] as const;
export const DESIGN_PAINT = ["#c1352b", "#c1352b", "#2b1a10", "#2f6b3a", "#fff4dc", "#2f6b3a"] as const;

const TAU = Math.PI * 2;

/** The pot's outline in local units: 40 wide, rim at y 0, belly bottom at y 39. */
function silhouette(c: CanvasRenderingContext2D) {
  c.beginPath();
  c.moveTo(-10, 4);
  c.lineTo(-9, 8.5);
  c.bezierCurveTo(-22, 11, -22, 36.5, -6, 38.6);
  c.quadraticCurveTo(0, 39.6, 6, 38.6);
  c.bezierCurveTo(22, 36.5, 22, 11, 9, 8.5);
  c.lineTo(10, 4);
  c.closePath();
}

function dot(c: CanvasRenderingContext2D, x: number, y: number, r: number) { c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); }

function motif(c: CanvasRenderingContext2D, design: number, paint: string, line: string, accent: string) {
  c.lineCap = "round"; c.lineJoin = "round";
  // A painted band under the shoulder, as on the real pots.
  c.strokeStyle = line; c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(-17, 13.5); c.quadraticCurveTo(0, 16.5, 17, 13.5); c.stroke();
  c.fillStyle = paint; c.strokeStyle = line; c.lineWidth = 1.2;
  switch (design) {
    case 0: { // মাছ: a fish with an eye
      c.beginPath(); c.moveTo(-10, 25); c.quadraticCurveTo(-2, 18, 7, 25); c.quadraticCurveTo(-2, 32, -10, 25); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(7, 25); c.lineTo(12.5, 20.5); c.lineTo(12.5, 29.5); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = line; c.beginPath(); dot(c, -5.5, 24, 1.1); c.fill();
      c.strokeStyle = accent; c.beginPath(); c.moveTo(-1, 21.5); c.quadraticCurveTo(1, 25, -1, 28.5); c.stroke();
      break;
    }
    case 1: { // পদ্ম: a six-petal flower with two leaves
      c.fillStyle = accent;
      for (const side of [-1, 1]) { c.beginPath(); c.ellipse(side * 10, 29, 5, 2.2, side * 0.5, 0, TAU); c.fill(); }
      c.fillStyle = paint;
      for (let k = 0; k < 6; k++) { const a = k * TAU / 6; c.beginPath(); c.ellipse(Math.cos(a) * 4.6, 24 + Math.sin(a) * 4.6, 3.6, 2, a, 0, TAU); c.fill(); c.stroke(); }
      c.fillStyle = "#f6d36a"; c.beginPath(); dot(c, 0, 24, 2.4); c.fill(); c.stroke();
      break;
    }
    case 2: { // zigzag with dots above and below
      c.strokeStyle = line; c.lineWidth = 1.8;
      c.beginPath(); c.moveTo(-18, 25);
      for (let x = -15, up = true; x <= 18; x += 3.6, up = !up) c.lineTo(x, up ? 21.5 : 28);
      c.stroke();
      c.fillStyle = paint === line ? accent : paint;
      c.beginPath(); for (let x = -13; x <= 13; x += 6.5) { dot(c, x, 18.5, 1.2); dot(c, x + 3.2, 32, 1.2); } c.fill();
      break;
    }
    case 3: { // bands: a red stripe with white dots and a green one under it
      c.fillStyle = accent; c.fillRect(-20, 20, 40, 5);
      c.fillStyle = paint; c.fillRect(-20, 28, 40, 2.6);
      c.fillStyle = "#fff6e2"; c.beginPath(); for (let x = -16; x <= 16; x += 4) dot(c, x, 22.5, 0.9); c.fill();
      c.strokeStyle = line; c.lineWidth = 0.9;
      c.beginPath(); c.moveTo(-20, 20); c.lineTo(20, 20); c.moveTo(-20, 25); c.lineTo(20, 25); c.stroke();
      break;
    }
    case 4: { // rows of dots on a brick-red body, a cream collar
      c.fillStyle = "#f2dca8"; c.fillRect(-20, 9, 40, 4);
      c.fillStyle = paint;
      c.beginPath();
      for (let row = 0; row < 3; row++) for (let x = -15 + (row % 2) * 3.5; x <= 15; x += 7) dot(c, x, 20 + row * 5.5, 1.4);
      c.fill();
      break;
    }
    default: { // a leafy vine with red berries
      c.strokeStyle = paint; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(-19, 25); c.bezierCurveTo(-12, 18, -6, 32, 0, 25); c.bezierCurveTo(6, 18, 12, 32, 19, 25); c.stroke();
      c.fillStyle = paint;
      for (const [x, y, a] of [[-12, 21, -0.6], [-3, 29, 0.6], [6, 21, -0.6], [14, 29, 0.6]]) { c.beginPath(); c.ellipse(x, y, 3.2, 1.6, a, 0, TAU); c.fill(); }
      c.fillStyle = accent; c.beginPath(); for (const x of [-8, 3, 11]) dot(c, x, x === 3 ? 21 : 30, 1.3); c.fill();
    }
  }
}

/**
 * One hanging pot, its rim at `top`, `size` wide (the belly fills about 40 local units).
 * Tough pots are darker with a heavy double rim; once cracked they show a zigzag split.
 */
export function drawPot(c: CanvasRenderingContext2D, cx: number, top: number, size: number, design: number, tough: boolean, cracked: boolean) {
  const s = size / 40;
  c.save();
  c.translate(cx, top);
  c.scale(s, s);
  const body = tough ? palette.toughBody : DESIGN_BODY[design];
  silhouette(c);
  c.fillStyle = body; c.fill();
  c.save();
  c.clip();
  motif(c, design, tough ? palette.white : DESIGN_PAINT[design], tough ? palette.white : palette.ink, tough ? "#f2c26b" : design === 1 || design === 5 ? palette.green : palette.red);
  // Light from the upper left, a shade on the lower right.
  c.fillStyle = "rgba(255,255,255,0.26)"; c.beginPath(); c.ellipse(-9, 18, 4, 7, 0.35, 0, TAU); c.fill();
  c.fillStyle = "rgba(60,20,0,0.16)"; c.beginPath(); c.ellipse(13, 30, 12, 14, 0, 0, TAU); c.fill();
  if (tough) { c.fillStyle = "#f2dca8"; c.fillRect(-20, 8.4, 40, 2.4); }
  c.restore();
  silhouette(c);
  c.strokeStyle = palette.ink; c.lineWidth = 1.6; c.lineJoin = "round"; c.stroke();
  // The lip; tough pots have a taller, doubled one.
  c.fillStyle = tough ? "#5e2a16" : "#9c4a2a";
  c.beginPath(); c.roundRect(-13, tough ? -1.5 : 0, 26, tough ? 7 : 5.4, 2.4); c.fill(); c.stroke();
  if (tough) { c.strokeStyle = "#f2c26b"; c.lineWidth = 1; c.beginPath(); c.moveTo(-11, 2); c.lineTo(11, 2); c.stroke(); }
  if (cracked) {
    c.lineCap = "round"; c.lineJoin = "miter";
    const crack = () => { c.beginPath(); c.moveTo(-3, 5); c.lineTo(0, 13); c.lineTo(-6, 20); c.lineTo(-1, 27); c.lineTo(-7, 35); c.moveTo(0, 13); c.lineTo(6, 18); c.lineTo(4, 24); c.moveTo(-1, 27); c.lineTo(5, 31); };
    crack(); c.strokeStyle = palette.ink; c.lineWidth = 2.6; c.stroke();
    crack(); c.strokeStyle = "#f6dcb0"; c.lineWidth = 0.9; c.stroke();
  }
  c.restore();
}

/** What's left on the string after a pot breaks: the lip, the neck and a jagged bit of shoulder in the pot's own colour. */
export function drawBrokenRim(c: CanvasRenderingContext2D, cx: number, top: number, size: number, tilt: number, fill: string) {
  const s = size / 40;
  c.save();
  c.translate(cx, top); c.rotate(tilt); c.scale(s, s);
  c.fillStyle = fill; c.strokeStyle = palette.ink; c.lineWidth = 1.6; c.lineJoin = "round";
  c.beginPath();
  c.moveTo(-10, 4); c.lineTo(-9, 8.5); c.quadraticCurveTo(-16, 9.5, -17.5, 13.5);
  for (const [x, y] of [[-13, 17.5], [-9, 13.5], [-5, 18.5], [-1, 14], [3, 18], [7, 13.5], [11, 17], [17.5, 13.5]]) c.lineTo(x, y);
  c.quadraticCurveTo(16, 9.5, 9, 8.5); c.lineTo(10, 4); c.closePath();
  c.fill(); c.stroke();
  c.strokeStyle = palette.ink; c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(-16, 12.5); c.quadraticCurveTo(0, 15, 16, 12.5); c.stroke();
  c.fillStyle = "#9c4a2a"; c.lineWidth = 1.6; c.beginPath(); c.roundRect(-13, 0, 26, 5.4, 2.4); c.fill(); c.stroke();
  c.restore();
}

/** A clay shard for the card's floor. */
export function drawShard(c: CanvasRenderingContext2D, x: number, y: number, size: number, angle: number, fill: string) {
  c.save();
  c.translate(x, y); c.rotate(angle);
  c.fillStyle = fill; c.strokeStyle = palette.ink; c.lineWidth = Math.max(1.5, size * 0.08); c.lineJoin = "round";
  c.beginPath(); c.moveTo(-size, -size * 0.3); c.lineTo(size * 0.2, -size * 0.7); c.lineTo(size, size * 0.4); c.lineTo(-size * 0.3, size * 0.6); c.closePath(); c.fill(); c.stroke();
  c.restore();
}

/** The cloth ball: indigo with a mustard patch and running stitches. */
export function drawBall(c: CanvasRenderingContext2D, x: number, y: number, r: number) {
  c.save();
  c.translate(x, y);
  c.beginPath(); c.arc(0, 0, r, 0, TAU);
  c.fillStyle = palette.ball; c.fill();
  c.save(); c.clip();
  c.fillStyle = palette.ochre;
  c.beginPath(); c.ellipse(r * 0.15, 0, r * 0.42, r * 1.2, 0.5, 0, TAU); c.fill();
  c.strokeStyle = "#fff6e2"; c.lineWidth = Math.max(1, r * 0.12); c.setLineDash([r * 0.22, r * 0.2]);
  c.beginPath(); c.ellipse(r * 0.15, 0, r * 0.62, r * 1.3, 0.5, 0, TAU); c.stroke();
  c.setLineDash([]);
  c.fillStyle = "rgba(255,255,255,0.22)"; c.beginPath(); c.arc(-r * 0.38, -r * 0.4, r * 0.38, 0, TAU); c.fill();
  c.restore();
  c.strokeStyle = palette.ballDeep; c.lineWidth = Math.max(1, r * 0.16);
  c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();
  c.restore();
}

/** The লাঠি: a length of bamboo with two nodes and a red cloth grip, centred on (x, y) with its top at y. */
export function drawStick(c: CanvasRenderingContext2D, x: number, top: number, width: number, height: number) {
  const left = x - width / 2, r = height / 2;
  const grain = c.createLinearGradient(0, top, 0, top + height);
  grain.addColorStop(0, "#efd394"); grain.addColorStop(0.45, palette.bamboo); grain.addColorStop(1, palette.bambooDark);
  c.fillStyle = grain; c.strokeStyle = palette.ink; c.lineWidth = Math.max(1.2, height * 0.12);
  c.beginPath(); c.roundRect(left, top, width, height, r); c.fill(); c.stroke();
  c.strokeStyle = palette.bambooNode; c.lineWidth = Math.max(1, height * 0.14);
  c.beginPath();
  for (const at of [0.2, 0.8]) { c.moveTo(left + width * at, top + 1.5); c.lineTo(left + width * at, top + height - 1.5); }
  c.stroke();
  c.fillStyle = palette.red;
  c.fillRect(x - width * 0.13, top + 0.8, width * 0.26, height - 1.6);
  c.fillStyle = palette.cream;
  c.fillRect(x - width * 0.02, top + 0.8, width * 0.04, height - 1.6);
}

/** Static stall: striped tent cloth, a scalloped awning, bamboo poles, ropes with a string per pot, and the earth floor. In world units. */
export function drawStall(c: CanvasRenderingContext2D) {
  c.fillStyle = palette.cloth; c.fillRect(0, 0, W, H);
  c.fillStyle = palette.clothStripe;
  for (let x = WALL; x < W - WALL; x += 48) c.fillRect(x + 24, TOP, 24, H - TOP);

  // Earth floor under the stick.
  const floor = STICK_Y + STICK_H + 6;
  c.fillStyle = palette.ground; c.fillRect(0, floor, W, H - floor);
  c.fillStyle = palette.groundDark;
  for (const [x, y, r] of [[40, 8, 2], [96, 18, 1.5], [150, 10, 2.2], [214, 22, 1.6], [262, 9, 1.8], [318, 17, 2.2], [70, 26, 1.4], [190, 28, 1.3]]) { c.beginPath(); c.arc(x, floor + y, r, 0, TAU); c.fill(); }
  c.fillStyle = "rgba(60,30,0,0.18)"; c.fillRect(0, floor, W, 2);

  // Ropes, each with a short string and knot per pot.
  c.strokeStyle = palette.rope; c.lineCap = "round";
  for (let row = 0; row < ROWS; row++) {
    const y = ROPE_Y + row * ROW_GAP;
    c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(WALL, y - 1); c.quadraticCurveTo(W / 2, y + 3, W - WALL, y - 1); c.stroke();
    c.lineWidth = 1.1;
    c.beginPath();
    for (let col = 0; col < COLS; col++) { const x = WALL + CELL * (col + 0.5); c.moveTo(x, y + 0.5); c.lineTo(x, y + POT_DROP + 1); }
    c.stroke();
    c.fillStyle = palette.rope;
    for (let col = 0; col < COLS; col++) { c.beginPath(); c.arc(WALL + CELL * (col + 0.5), y + 1, 1.6, 0, TAU); c.fill(); }
  }

  // Bamboo poles: the side walls.
  for (const x of [0, W - WALL]) {
    const g = c.createLinearGradient(x, 0, x + WALL, 0);
    g.addColorStop(0, palette.bambooDark); g.addColorStop(0.4, "#efd394"); g.addColorStop(1, palette.bambooDark);
    c.fillStyle = g; c.fillRect(x, 0, WALL, H);
    c.fillStyle = palette.bambooNode;
    for (let y = 70; y < H; y += 92) c.fillRect(x, y, WALL, 2.5);
  }

  // The awning: red and cream stripes ending in scallops that stop right at the ceiling.
  const band = TOP - 12;
  for (let x = 0, i = 0; x < W; x += 24, i++) {
    c.fillStyle = i % 2 ? palette.awningLight : palette.awning;
    c.fillRect(x, 0, 24, band);
    c.beginPath(); c.arc(x + 12, band, 12, 0, Math.PI); c.fill();
  }
  c.strokeStyle = palette.awningDeep; c.lineWidth = 1.5;
  c.beginPath(); for (let x = 0; x < W; x += 24) { c.moveTo(x + 24, band); c.arc(x + 12, band, 12, 0, Math.PI); } c.stroke();
  c.fillStyle = palette.awningDeep; c.fillRect(0, 0, W, 4);
}

/** The resting-ball aim: a few dots along the launch direction. */
export function drawAim(c: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number) {
  c.fillStyle = "rgba(43,26,16,0.35)";
  c.beginPath();
  for (let k = 1; k <= 4; k++) dot(c, x + dx * (BALL_R * 2.6 * k + 4), y + dy * (BALL_R * 2.6 * k + 4), 2.2 - k * 0.3);
  c.fill();
}


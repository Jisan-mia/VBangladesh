import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, wrapText, DISPLAY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { blendLine, bn, countLine, groupLine, layoutBoard, reasonLine, roleById, shownName, type Answer, type Member, type RoleId } from "./adda";

// The board in plan, sized like a club board (ICF): a 74 cm playing surface, base lines 10.15 cm in and 3.18 cm wide,
// red base circles that touch both lines, a 17 cm centre circle and corner arrows. Pockets and pieces are drawn larger than
// life so they read at phone size. The same function paints the page's board and the share card.
export const FRAME = 0.075;
export const INK = "#2b1a10";
export const RED = "#b51f2e";
export const MUTED = "#6f5643";
const BG = "#f6ead0";
const GOLD = "#f2b632";

export const BASE_OUT = 0.137, BASE_IN = 0.18, BASE_END = 0.1825, BASE_R = 0.0215;
/** Where a resting striker sits: on the near base line, between its two lines. */
export const STRIKER_REST = { x: 0.5, y: 1 - (BASE_OUT + BASE_IN) / 2 };
// Loose pieces near the rails, so even a one-piece board looks mid-game.
export const LOOSE: readonly { role: RoleId; x: number; y: number }[] = [
  { role: "white", x: 0.085, y: 0.31 }, { role: "black", x: 0.915, y: 0.25 }, { role: "white", x: 0.92, y: 0.69 }, { role: "black", x: 0.3, y: 0.925 },
];
export const LOOSE_R = 0.03;

// Seeded so every board gets the same grain and powder.
function seeded(seed: number) {
  let value = seed;
  return () => ((value = (value * 16807) % 2147483647) - 1) / 2147483646;
}

function drawFrame(context: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const frame = size * FRAME;
  const random = seeded(11);
  context.save();
  context.shadowColor = "rgba(40,18,4,.38)";
  context.shadowBlur = size * 0.03;
  context.shadowOffsetY = size * 0.014;
  roundedRect(context, x, y, size, size, size * 0.035);
  context.fillStyle = "#5a2a10";
  context.fill();
  context.restore();
  context.save();
  roundedRect(context, x, y, size, size, size * 0.035);
  context.clip();
  // Four mitred rails, each with its own grain running along it.
  for (let side = 0; side < 4; side++) {
    context.save();
    context.translate(x + size / 2, y + size / 2);
    context.rotate((side * Math.PI) / 2);
    context.translate(-size / 2, -size / 2);
    context.beginPath();
    context.moveTo(0, 0); context.lineTo(size, 0); context.lineTo(size - frame, frame); context.lineTo(frame, frame); context.closePath();
    context.clip();
    const wood = context.createLinearGradient(0, 0, 0, frame);
    wood.addColorStop(0, side % 2 ? "#7d3c19" : "#86441d");
    wood.addColorStop(0.55, side % 2 ? "#5e2b11" : "#653013");
    wood.addColorStop(1, "#46200b");
    context.fillStyle = wood;
    context.fillRect(0, 0, size, frame);
    for (let line = 0; line < 16; line++) {
      const at = frame * (line + random()) / 16, phase = random() * 6, wave = frame * (0.03 + random() * 0.05);
      context.strokeStyle = random() > 0.55 ? "rgba(255,205,150,.13)" : "rgba(25,8,0,.28)";
      context.lineWidth = Math.max(1, size * (0.0008 + random() * 0.002));
      context.beginPath();
      for (let step = 0; step <= 24; step++) {
        const u = step / 24;
        context.lineTo(u * size, at + Math.sin(u * 9 + phase) * wave);
      }
      context.stroke();
    }
    // The mitre joint and a polished outer edge.
    context.strokeStyle = "rgba(20,6,0,.45)";
    context.lineWidth = Math.max(1, size * 0.002);
    context.beginPath(); context.moveTo(0, 0); context.lineTo(frame, frame); context.stroke();
    context.fillStyle = "rgba(255,220,180,.16)";
    context.fillRect(0, 0, size, size * 0.006);
    context.restore();
  }
  context.restore();
}

function drawSurface(context: CanvasRenderingContext2D, x: number, y: number, side: number) {
  const random = seeded(29);
  const maple = context.createRadialGradient(x + side * 0.45, y + side * 0.4, side * 0.1, x + side / 2, y + side / 2, side * 0.75);
  maple.addColorStop(0, "#f8e8c4");
  maple.addColorStop(1, "#e3c48a");
  context.fillStyle = maple;
  context.fillRect(x, y, side, side);
  context.save();
  context.beginPath(); context.rect(x, y, side, side); context.clip();
  // Ply grain.
  for (let line = 0; line < 46; line++) {
    const at = y + side * random(), phase = random() * 6;
    context.strokeStyle = random() > 0.5 ? "rgba(160,110,50,.07)" : "rgba(255,250,235,.12)";
    context.lineWidth = Math.max(1, side * 0.003 * random());
    context.beginPath();
    for (let step = 0; step <= 20; step++) {
      const u = step / 20;
      context.lineTo(x + u * side, at + Math.sin(u * 5 + phase) * side * 0.008);
    }
    context.stroke();
  }
  // Boric powder: a dusting everywhere, thicker where a palm spread it in circles.
  context.fillStyle = "rgba(255,255,255,.08)";
  context.fillRect(x, y, side, side);
  for (const [cx, cy, radius] of [[0.32, 0.36, 0.2], [0.66, 0.62, 0.24], [0.5, 0.2, 0.14]]) {
    context.strokeStyle = "rgba(255,255,255,.16)";
    context.lineCap = "round";
    for (let turn = 0; turn < 5; turn++) {
      context.lineWidth = side * (0.01 + random() * 0.02);
      const start = random() * Math.PI * 2;
      context.beginPath();
      context.arc(x + side * cx, y + side * cy, side * radius * (0.4 + turn * 0.15), start, start + 1.6 + random() * 2);
      context.stroke();
    }
  }
  for (let grain = 0; grain < 1600; grain++) {
    context.fillStyle = `rgba(255,255,255,${0.3 + random() * 0.5})`;
    const dot = Math.max(0.6, side * (0.0006 + random() * 0.0016));
    context.fillRect(x + random() * side, y + random() * side, dot, dot);
  }
  // The rails cast a soft shadow on the surface.
  const shade = side * 0.035;
  for (let edge = 0; edge < 4; edge++) {
    context.save();
    context.translate(x + side / 2, y + side / 2);
    context.rotate((edge * Math.PI) / 2);
    const fall = context.createLinearGradient(0, -side / 2, 0, -side / 2 + shade);
    fall.addColorStop(0, "rgba(60,25,5,.32)");
    fall.addColorStop(1, "rgba(60,25,5,0)");
    context.fillStyle = fall;
    context.fillRect(-side / 2, -side / 2, side, shade);
    context.restore();
  }
  context.restore();
}

function drawPocket(context: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  context.fillStyle = "rgba(70,35,10,.45)";
  context.beginPath(); context.arc(cx, cy, radius * 1.12, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#140c07";
  context.beginPath(); context.arc(cx, cy, radius, 0, Math.PI * 2); context.fill();
  // The net hanging inside the hole.
  context.save();
  context.beginPath(); context.arc(cx, cy, radius * 0.94, 0, Math.PI * 2); context.clip();
  context.strokeStyle = "rgba(205,185,150,.5)";
  context.lineWidth = Math.max(1, radius * 0.045);
  const step = radius * 0.3;
  for (let offset = -radius * 2; offset <= radius * 2; offset += step) {
    context.beginPath(); context.moveTo(cx + offset - radius, cy - radius); context.lineTo(cx + offset + radius, cy + radius); context.stroke();
    context.beginPath(); context.moveTo(cx + offset + radius, cy - radius); context.lineTo(cx + offset - radius, cy + radius); context.stroke();
  }
  const depth = context.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
  depth.addColorStop(0, "rgba(10,5,2,.15)");
  depth.addColorStop(1, "rgba(10,5,2,.9)");
  context.fillStyle = depth;
  context.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  context.restore();
}

function drawMarkings(context: CanvasRenderingContext2D, x: number, y: number, side: number) {
  const line = Math.max(1, side * 0.0035);
  context.lineCap = "round";
  for (let turn = 0; turn < 4; turn++) {
    context.save();
    context.translate(x + side / 2, y + side / 2);
    context.rotate((turn * Math.PI) / 2);
    context.translate(-side / 2, -side / 2);
    // Base lines with their red circles.
    context.strokeStyle = INK;
    context.lineWidth = line;
    for (const at of [BASE_OUT, BASE_IN]) {
      context.beginPath(); context.moveTo(side * BASE_END, side * at); context.lineTo(side * (1 - BASE_END), side * at); context.stroke();
    }
    for (const end of [BASE_END, 1 - BASE_END]) {
      context.beginPath(); context.arc(side * end, side * (BASE_OUT + BASE_IN) / 2, side * BASE_R, 0, Math.PI * 2);
      context.fillStyle = RED; context.fill(); context.stroke();
    }
    // The corner arrow, pointing at the pocket, capped by an arc on the centre side.
    const from = side * 0.12, to = side * 0.345, head = side * 0.03;
    context.beginPath(); context.moveTo(from, from); context.lineTo(to, to); context.stroke();
    context.beginPath();
    context.moveTo(from + head * Math.cos(Math.PI / 4 - 0.45), from + head * Math.sin(Math.PI / 4 - 0.45));
    context.lineTo(from, from);
    context.lineTo(from + head * Math.cos(Math.PI / 4 + 0.45), from + head * Math.sin(Math.PI / 4 + 0.45));
    context.stroke();
    context.beginPath(); context.arc(to - side * 0.02, to - side * 0.02, side * 0.04, -Math.PI / 4, (3 * Math.PI) / 4); context.stroke();
    context.restore();
  }
  // The centre: a ring, eight red petals and the queen's red spot.
  const cx = x + side / 2, cy = y + side / 2;
  context.strokeStyle = INK;
  context.lineWidth = line;
  context.beginPath(); context.arc(cx, cy, side * 0.115, 0, Math.PI * 2); context.stroke();
  context.strokeStyle = RED;
  context.beginPath(); context.arc(cx, cy, side * 0.104, 0, Math.PI * 2); context.stroke();
  for (let petal = 0; petal < 8; petal++) {
    const angle = (petal * Math.PI) / 4;
    context.save();
    context.translate(cx + Math.cos(angle) * side * 0.063, cy + Math.sin(angle) * side * 0.063);
    context.rotate(angle);
    context.beginPath(); context.ellipse(0, 0, side * 0.034, side * 0.011, 0, 0, Math.PI * 2);
    context.fillStyle = petal % 2 ? "rgba(181,31,46,.55)" : "rgba(181,31,46,.85)";
    context.fill();
    context.restore();
  }
  context.beginPath(); context.arc(cx, cy, side * BASE_R, 0, Math.PI * 2);
  context.fillStyle = RED; context.fill();
  context.strokeStyle = INK; context.stroke();
}

/** The whole board, frame included, in a size×size square at (x, y). */
export function drawBoard(context: CanvasRenderingContext2D, x: number, y: number, size: number) {
  drawFrame(context, x, y, size);
  const frame = size * FRAME, side = size - frame * 2, sx = x + frame, sy = y + frame;
  drawSurface(context, sx, sy, side);
  drawMarkings(context, sx, sy, side);
  const pocket = side * 0.048;
  for (const [px, py] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
    drawPocket(context, sx + (px ? side - pocket * 1.06 : pocket * 1.06), sy + (py ? side - pocket * 1.06 : pocket * 1.06), pocket);
  }
}

const tones: Record<RoleId, { light: string; base: string; dark: string; groove: string }> = {
  queen: { light: "#f26d6f", base: "#c4212f", dark: "#760c18", groove: "rgba(70,0,10,.45)" },
  white: { light: "#fffdf7", base: "#f0e4c4", dark: "#c3aa78", groove: "rgba(120,85,35,.38)" },
  black: { light: "#6a584c", base: "#2d241e", dark: "#0e0a08", groove: "rgba(0,0,0,.6)" },
  striker: { light: "#ffffff", base: "#f3efe6", dark: "#c9c0ad", groove: "rgba(90,80,60,.3)" },
};

function star(context: CanvasRenderingContext2D, cx: number, cy: number, outer: number) {
  context.beginPath();
  for (let point = 0; point < 10; point++) {
    const angle = -Math.PI / 2 + (point * Math.PI) / 5, radius = point % 2 ? outer * 0.45 : outer;
    context.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  context.closePath();
}

/** One carrom piece seen from above: turned grooves on the coins, a printed ring-and-star on the striker. */
export function drawPiece(context: CanvasRenderingContext2D, role: RoleId, cx: number, cy: number, radius: number, glow = false) {
  const tone = tones[role];
  if (glow) {
    context.save();
    context.shadowColor = "rgba(242,182,50,.9)";
    context.shadowBlur = radius * 0.5;
    context.strokeStyle = GOLD;
    context.lineWidth = radius * 0.13;
    context.beginPath(); context.arc(cx, cy, radius * 1.28, 0, Math.PI * 2); context.stroke();
    context.restore();
  }
  context.save();
  context.shadowColor = "rgba(35,15,4,.45)";
  context.shadowBlur = radius * 0.35;
  context.shadowOffsetY = radius * 0.14;
  context.fillStyle = tone.base;
  context.beginPath(); context.arc(cx, cy, radius, 0, Math.PI * 2); context.fill();
  context.restore();
  const body = context.createRadialGradient(cx - radius * 0.35, cy - radius * 0.4, radius * 0.08, cx, cy, radius);
  body.addColorStop(0, tone.light);
  body.addColorStop(0.55, tone.base);
  body.addColorStop(1, tone.dark);
  context.fillStyle = body;
  context.beginPath(); context.arc(cx, cy, radius, 0, Math.PI * 2); context.fill();
  context.lineWidth = Math.max(1, radius * 0.05);
  if (role === "striker") {
    context.strokeStyle = RED; context.lineWidth = radius * 0.09;
    context.beginPath(); context.arc(cx, cy, radius * 0.78, 0, Math.PI * 2); context.stroke();
    context.strokeStyle = "#1f4f9a"; context.lineWidth = radius * 0.06;
    context.beginPath(); context.arc(cx, cy, radius * 0.58, 0, Math.PI * 2); context.stroke();
    star(context, cx, cy, radius * 0.34);
    context.fillStyle = RED; context.fill();
  } else {
    for (const ring of [0.74, 0.46]) {
      context.strokeStyle = tone.groove;
      context.beginPath(); context.arc(cx, cy, radius * ring, 0, Math.PI * 2); context.stroke();
      context.strokeStyle = "rgba(255,255,255,.28)";
      context.beginPath(); context.arc(cx - radius * 0.02, cy - radius * 0.02, radius * ring, Math.PI * 0.95, Math.PI * 1.6); context.stroke();
    }
  }
  context.strokeStyle = "rgba(0,0,0,.25)";
  context.lineWidth = Math.max(1, radius * 0.04);
  context.beginPath(); context.arc(cx, cy, radius * 0.98, 0, Math.PI * 2); context.stroke();
}

/** Pieces, labels, the empty centre and the loose decor on a board drawn at (x, y, size). `mine` gets a gold ring. */
export function drawPieces(context: CanvasRenderingContext2D, members: readonly Member[], mine: number, x: number, y: number, size: number) {
  const frame = size * FRAME, side = size - frame * 2;
  const at = (fx: number, fy: number) => [x + frame + fx * side, y + frame + fy * side] as const;
  for (const piece of LOOSE) { const [px, py] = at(piece.x, piece.y); drawPiece(context, piece.role, px, py, side * LOOSE_R); }
  if (members.length === 1 && members[0].role !== "striker") { const [px, py] = at(STRIKER_REST.x, STRIKER_REST.y); drawPiece(context, "striker", px, py, side * 0.04); }
  const { slots, emptyCentre } = layoutBoard(members);
  if (emptyCentre) {
    const [cx, cy] = at(0.5, 0.5);
    context.save();
    context.setLineDash([side * 0.014, side * 0.012]);
    context.strokeStyle = RED; context.lineWidth = side * 0.006;
    context.fillStyle = "rgba(255,248,230,.75)";
    context.beginPath(); context.arc(cx, cy, side * 0.085, 0, Math.PI * 2); context.fill(); context.stroke();
    context.restore();
    fitText(context, [{ text: "কুইন?", color: RED, weight: 800, display: true }], cx, cy + side * 0.018, side * 0.05, side * 0.14, "center");
  }
  for (const slot of slots) { const [px, py] = at(slot.x, slot.y); drawPiece(context, slot.member.role, px, py, side * slot.r, slot.index === mine); }
  if (members.length < 2) return;
  for (const slot of slots) {
    const [px, py] = at(slot.x, slot.y + slot.r);
    const name = shownName(slot.member, slot.index === mine), piece = roleById(slot.member.role).piece;
    const width = side * 0.25, height = side * 0.085, top = py + side * 0.012;
    context.fillStyle = "rgba(255,249,234,.94)";
    roundedRect(context, px - width / 2, top, width, height, height * 0.3);
    context.fill();
    context.strokeStyle = slot.index === mine ? GOLD : "rgba(90,42,16,.3)";
    context.lineWidth = side * (slot.index === mine ? 0.005 : 0.0025);
    context.stroke();
    fitText(context, [{ text: name, color: INK, weight: 700 }], px, top + height * 0.47, side * 0.032, width - side * 0.02, "center");
    fitText(context, [{ text: piece, color: slot.member.role === "queen" ? RED : MUTED, weight: 600 }], px, top + height * 0.86, side * 0.023, width - side * 0.02, "center");
  }
}

export type CardData = { members: Member[]; mine: number; answers: Answer[] };

const layouts = {
  feed: { kicker: 86, head: 166, sub: 224, board: 258, size: 790, line: 1110 },
  story: { kicker: 330, head: 420, sub: 482, board: 530, size: 900, line: 1508 },
} as const;

export function drawCard(canvas: HTMLCanvasElement, { members, mine, answers }: CardData, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  context.fillStyle = BG;
  context.fillRect(0, 0, width, height);
  const glow = context.createRadialGradient(width / 2, layout.board + layout.size / 2, 100, width / 2, layout.board + layout.size / 2, width);
  glow.addColorStop(0, "rgba(255,255,255,.55)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  const group = members.length > 1;
  const me = members[mine];
  const role = roleById(me.role);
  const centre = width / 2;
  fitText(context, [{ text: group ? `${bn(members.length)} জনের আড্ডা · ক্যারম বোর্ড` : "আড্ডায় কে কোন গুটি? · ক্যারম বোর্ড", color: MUTED, weight: 600 }], centre, layout.kicker, 30, 900, "center");
  if (group) fitText(context, [{ text: "আমাদের আড্ডায় কে কোন গুটি?", color: INK, weight: 800, display: true }], centre, layout.head, 66, 940, "center");
  else fitText(context, [{ text: `${shownName(me, true)} = `, color: INK, weight: 800, display: true }, { text: role.piece, color: RED, weight: 800, display: true }], centre, layout.head, 76, 940, "center");
  fitText(context, [{ text: group ? countLine(members) : role.tag, color: group ? MUTED : INK, weight: 600 }], centre, layout.sub, group ? 32 : 40, 900, "center");

  const boardX = (width - layout.size) / 2;
  drawBoard(context, boardX, layout.board, layout.size);
  drawPieces(context, members, mine, boardX, layout.board, layout.size);

  const size = format === "story" ? 40 : 36;
  context.font = `700 ${size}px ${DISPLAY_FONT}`;
  const lines = wrapText(context, group ? groupLine(members) : blendLine(answers), 920, 2);
  let y = layout.line;
  for (const text of lines) { fitText(context, [{ text, color: INK, weight: 700, display: true }], centre, y, size, 940, "center"); y += size * 1.35; }
  const last = group
    ? [{ text: `${shownName(me, true)}: `, color: RED, weight: 700 }, { text: `${role.piece} · ${role.tag}`, color: MUTED, weight: 600 }]
    : [{ text: "কারণ: ", color: RED, weight: 700 }, { text: reasonLine(answers), color: MUTED, weight: 500 }];
  fitText(context, last, centre, y + 4, size - 6, 940, "center");
  drawFooterBand(context, format, "তোমার আড্ডার কুইন কে?", site, { band: "#3d1c0b", ask: GOLD, site: "#fff4dc" });
}

export const cardBlob = (data: CardData, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, data, format, site));

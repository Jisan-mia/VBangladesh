import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat } from "../../../shared/card-canvas";
import { banglaDate, bn, dateLine, humanLine, shortDate, type Countdown, type Theme } from "./countdown";

type Ctx = CanvasRenderingContext2D;
/** wall behind the calendar · picture board on top · its ink · the day's colour (holidays are printed red) */
type Colors = { wall: string; board: string; boardInk: string; title: string; numeral: string; ask: string };

const TAU = Math.PI * 2;
const ASK = "তুমি কোন দিনটার অপেক্ষায়?";
const PAPER = "#fffdf6", INK = "#2a2420", MUTED = "#857a6c", RED = "#c62a1f";

export const colors: Record<Theme, Colors> = {
  eid: { wall: "#dde8e1", board: "#0e5a43", boardInk: "#f2c66d", title: "#0e5a43", numeral: RED, ask: "#f2c66d" },
  ramadan: { wall: "#dfe4ee", board: "#1c3557", boardInk: "#f2c66d", title: "#1c3557", numeral: RED, ask: "#f2c66d" },
  durga: { wall: "#f5e2cd", board: "#a8121b", boardInk: "#ffd27a", title: "#a8121b", numeral: RED, ask: "#ffd27a" },
  kali: { wall: "#e3dde9", board: "#2b1d3a", boardInk: "#ffbf5a", title: "#2b1d3a", numeral: RED, ask: "#ffbf5a" },
  saraswati: { wall: "#f7ecc6", board: "#f1c232", boardInk: "#6b4a00", title: "#8a5f00", numeral: RED, ask: "#ffe08a" },
  buddha: { wall: "#f2e5cf", board: "#9c560b", boardInk: "#fff1cf", title: "#9c560b", numeral: RED, ask: "#ffe3a3" },
  christmas: { wall: "#dfeae2", board: "#1d5b3a", boardInk: "#ffd166", title: "#1d5b3a", numeral: RED, ask: "#ffd166" },
  national: { wall: "#dbeae1", board: "#006a4e", boardInk: "#f42a41", title: "#006a4e", numeral: RED, ask: "#ffd166" },
  ekushe: { wall: "#e8e5df", board: "#efece6", boardInk: "#151515", title: "#151515", numeral: "#151515", ask: "#ffffff" },
  boishakh: { wall: "#f6e0d8", board: "#c4231b", boardInk: "#ffffff", title: "#c4231b", numeral: RED, ask: "#ffd166" },
  custom: { wall: "#e4e7f0", board: "#1d2b53", boardInk: "#f39c12", title: "#1d2b53", numeral: RED, ask: "#ffd166" },
};

/** Fractional part of a sine hash: steady "random" scatter, the same on every redraw. */
const noise = (seed: number) => { const value = Math.sin(seed * 12.9898) * 43758.5453; return value - Math.floor(value); };
function circle(ctx: Ctx, x: number, y: number, r: number) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }
function paint(ctx: Ctx, fill?: string, stroke?: string, width = 4) {
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}
/** A pointed leaf, petal or flame from (x, y), pointing up when angle is 0. */
function leaf(ctx: Ctx, x: number, y: number, length: number, width: number, angle: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(width, -length * 0.45, 0, -length);
  ctx.quadraticCurveTo(-width, -length * 0.45, 0, 0);
  ctx.closePath(); ctx.restore();
}
function star(ctx: Ctx, x: number, y: number, r: number, points = 5) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / points, d = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
  }
  ctx.closePath();
}
function crescent(ctx: Ctx, x: number, y: number, r: number, color: string) {
  ctx.save(); circle(ctx, x, y, r); ctx.clip();
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.moveTo(x + r * 0.42 + r * 0.82, y - r * 0.28); ctx.arc(x + r * 0.42, y - r * 0.28, r * 0.82, 0, TAU);
  ctx.fillStyle = color; ctx.fill("evenodd"); ctx.restore();
}
function sky(ctx: Ctx, w: number, h: number, color: string, count: number) {
  for (let i = 0; i < count; i++) { ctx.fillStyle = color; circle(ctx, (noise(i) - 0.5) * w, (noise(i + 40) - 0.5) * h, 2 + noise(i + 9) * 3); ctx.fill(); }
}
function lantern(ctx: Ctx, x: number, y: number, s: number, gold: string) {
  ctx.beginPath(); ctx.moveTo(x, y - 140 * s); ctx.lineTo(x, y - 40 * s); ctx.strokeStyle = gold; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 30 * s, y - 20 * s); ctx.quadraticCurveTo(x, y - 60 * s, x + 30 * s, y - 20 * s); ctx.closePath(); paint(ctx, gold);
  ctx.beginPath(); ctx.moveTo(x - 30 * s, y - 20 * s); ctx.lineTo(x - 44 * s, y + 20 * s); ctx.lineTo(x - 30 * s, y + 70 * s); ctx.lineTo(x + 30 * s, y + 70 * s); ctx.lineTo(x + 44 * s, y + 20 * s); ctx.lineTo(x + 30 * s, y - 20 * s); ctx.closePath();
  paint(ctx, "#ffd98a", gold, 3);
  leaf(ctx, x, y + 34 * s, 34 * s, 9 * s, 0); paint(ctx, "#f08a24");
  ctx.beginPath(); ctx.moveTo(x - 30 * s, y + 70 * s); ctx.lineTo(x - 14 * s, y + 88 * s); ctx.lineTo(x + 14 * s, y + 88 * s); ctx.lineTo(x + 30 * s, y + 70 * s); ctx.closePath(); paint(ctx, gold);
}
/** Clay প্রদীপ with its flame. */
function prodip(ctx: Ctx, x: number, y: number, s: number) {
  const halo = ctx.createRadialGradient(x + 30 * s, y - 50 * s, 0, x + 30 * s, y - 50 * s, 70 * s);
  halo.addColorStop(0, "rgba(255,200,90,.6)"); halo.addColorStop(1, "rgba(255,200,90,0)");
  ctx.fillStyle = halo; circle(ctx, x + 30 * s, y - 50 * s, 70 * s); ctx.fill();
  leaf(ctx, x + 30 * s, y - 22 * s, 56 * s, 14 * s, 0.1); paint(ctx, "#f59a1b");
  leaf(ctx, x + 30 * s, y - 24 * s, 30 * s, 7 * s, 0.1); paint(ctx, "#ffe58a");
  ctx.beginPath(); ctx.moveTo(x - 50 * s, y - 18 * s); ctx.quadraticCurveTo(x - 38 * s, y + 24 * s, x, y + 24 * s); ctx.quadraticCurveTo(x + 32 * s, y + 24 * s, x + 42 * s, y - 12 * s);
  ctx.lineTo(x + 40 * s, y - 24 * s); ctx.closePath(); paint(ctx, "#c4622d", "#5a2410", 3 * s);
}

// One picture per occasion, drawn around (0, 0) inside the calendar's top board.
const art: Record<Theme, (ctx: Ctx, w: number, h: number, c: Colors) => void> = {
  eid(ctx, w, h, c) {
    sky(ctx, w, h, "rgba(242,198,109,.55)", 26);
    crescent(ctx, -40, -10, h * 0.34, c.boardInk);
    star(ctx, h * 0.2, -h * 0.16, h * 0.08); paint(ctx, c.boardInk);
    // a row of domes on the horizon
    ctx.fillStyle = "rgba(0,0,0,.28)";
    for (const [dx, r] of [[-w * 0.36, 34], [w * 0.3, 44], [w * 0.4, 26]]) { ctx.beginPath(); ctx.arc(dx, h / 2, r, Math.PI, 0); ctx.fill(); }
  },
  ramadan(ctx, w, h, c) {
    sky(ctx, w, h, "rgba(255,240,200,.55)", 30);
    crescent(ctx, w * 0.18, -h * 0.08, h * 0.3, c.boardInk);
    lantern(ctx, -w * 0.2, 0, h / 300, c.boardInk);
    lantern(ctx, -w * 0.36, -h * 0.1, h / 440, c.boardInk);
  },
  durga(ctx, w, h, c) {
    // কাশফুল on both sides, a ঢাক with its white plume in the middle
    for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
      const x = side * (w * 0.3 + i * 24), base = h / 2, top = base - h * (0.55 + noise(i + side) * 0.25);
      ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x, (base + top) / 2, x + side * 20, top); ctx.strokeStyle = "#f1dcae"; ctx.lineWidth = 3; ctx.stroke();
      for (let k = 0; k < 7; k++) { leaf(ctx, x + side * (12 + k * 1.5), top + 16 + k * 12, 34, 7, side * (0.5 + k * 0.08)); paint(ctx, "rgba(255,255,255,.85)"); }
    }
    const s = h / 330;
    ctx.save(); ctx.translate(0, h * 0.08); ctx.scale(s, s); ctx.rotate(-0.08);
    for (let i = 0; i < 9; i++) { leaf(ctx, 92, -86, 150 - Math.abs(i - 4) * 12, 20, -0.9 + i * 0.16); paint(ctx, "#ffffff", "#e0d2b8", 2); }
    ctx.beginPath(); ctx.moveTo(-140, -80); ctx.quadraticCurveTo(0, -116, 140, -80); ctx.lineTo(140, 80); ctx.quadraticCurveTo(0, 116, -140, 80); ctx.closePath(); paint(ctx, "#e5a845", "#3a1d10", 5);
    for (const bx of [-104, 104]) { ctx.fillStyle = c.board; ctx.fillRect(bx - 9, -92, 18, 184); }
    for (const ex of [-140, 140]) { ctx.beginPath(); ctx.ellipse(ex, 0, 26, 82, 0, 0, TAU); paint(ctx, "#f7e9cc", "#3a1d10", 5); }
    ctx.restore();
  },
  kali(ctx, w, h) {
    sky(ctx, w, h, "rgba(255,215,140,.6)", 34);
    const s = h / 200;
    for (const [x, y, k] of [[-w * 0.28, h * 0.24, 0.9], [0, h * 0.18, 1.2], [w * 0.28, h * 0.24, 0.9]]) prodip(ctx, x, y, s * k);
  },
  saraswati(ctx, w, h, c) {
    // দোয়াত-কলম: an ink pot with a reed pen, between yellow marigolds
    const s = h / 300;
    for (const [x, y, r] of [[-w * 0.3, h * 0.12, 46], [w * 0.3, h * 0.1, 52], [-w * 0.4, -h * 0.2, 30], [w * 0.4, -h * 0.22, 34]]) {
      for (let i = 0; i < 14; i++) { leaf(ctx, x, y, r * s, r * 0.32 * s, (i / 14) * TAU); paint(ctx, i % 2 ? "#f39c12" : "#e67e22"); }
      circle(ctx, x, y, r * 0.3 * s); paint(ctx, "#b35a00");
    }
    ctx.save(); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(30, 40); ctx.lineTo(110, -130); ctx.lineTo(120, -126); ctx.lineTo(44, 44); ctx.closePath(); paint(ctx, "#8b5a2b", c.boardInk, 3);
    ctx.beginPath(); ctx.ellipse(0, 70, 70, 54, 0, 0, TAU); paint(ctx, "#2c2c34", c.boardInk, 4);
    ctx.beginPath(); ctx.ellipse(0, 22, 34, 10, 0, 0, TAU); paint(ctx, "#111", c.boardInk, 3);
    ctx.restore();
  },
  buddha(ctx, w, h, c) {
    const r = h * 0.36;
    const glow = ctx.createRadialGradient(0, -10, r * 0.6, 0, -10, r * 1.6);
    glow.addColorStop(0, "rgba(255,241,207,.45)"); glow.addColorStop(1, "rgba(255,241,207,0)");
    ctx.fillStyle = glow; circle(ctx, 0, -10, r * 1.6); ctx.fill();
    circle(ctx, 0, -10, r); paint(ctx, c.boardInk);
    // a বোধি leaf in front of the full moon
    ctx.save(); ctx.translate(0, h * 0.04); const s = h / 320; ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(0, 110); ctx.bezierCurveTo(-120, 40, -110, -90, 0, -70); ctx.bezierCurveTo(110, -90, 120, 40, 0, 110); ctx.closePath(); paint(ctx, "#3f7d3a", "#24521f", 4);
    ctx.beginPath(); ctx.moveTo(0, 110); ctx.quadraticCurveTo(6, 140, 0, 170); ctx.strokeStyle = "#3f7d3a"; ctx.lineWidth = 6; ctx.stroke();
    ctx.strokeStyle = "#9cc58f"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 104); ctx.lineTo(0, -60); ctx.stroke();
    for (const y of [-30, 10, 50]) for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, y + 20); ctx.quadraticCurveTo(side * 40, y + 6, side * 70, y - 10); ctx.stroke(); }
    ctx.restore();
    prodip(ctx, -w * 0.34, h * 0.3, h / 380); prodip(ctx, w * 0.3, h * 0.3, h / 380);
  },
  christmas(ctx, w, h, c) {
    sky(ctx, w, h, "rgba(255,255,255,.6)", 30);
    const s = h / 320;
    for (const [y, half] of [[-40, 70], [10, 100], [60, 130]]) { ctx.beginPath(); ctx.moveTo(0, (y - 80) * s); ctx.lineTo(-half * s, (y + 40) * s); ctx.lineTo(half * s, (y + 40) * s); ctx.closePath(); paint(ctx, "#2f8a55", "#0f3d24", 3); }
    ctx.fillStyle = "#6b3a1a"; ctx.fillRect(-16 * s, 100 * s, 32 * s, 46 * s);
    for (const [x, y, col] of [[-40, 30, "#e53935"], [36, -6, "#ffd166"], [-70, 80, "#ffd166"], [70, 76, "#e53935"], [0, 50, "#ffffff"]] as const) { circle(ctx, x * s, y * s, 9 * s); paint(ctx, col); }
    star(ctx, 0, -124 * s, 34 * s); paint(ctx, c.boardInk, "#b8860b", 2);
  },
  national(ctx, w, h, c) {
    // the red sun rising over green fields
    const r = h * 0.36;
    ctx.fillStyle = "rgba(255,255,255,.08)";
    for (let i = 0; i < 16; i++) { const a = Math.PI + (i / 16) * Math.PI; ctx.beginPath(); ctx.moveTo(0, h * 0.2); ctx.lineTo(Math.cos(a) * w, h * 0.2 + Math.sin(a) * w); ctx.lineTo(Math.cos(a + 0.1) * w, h * 0.2 + Math.sin(a + 0.1) * w); ctx.closePath(); ctx.fill(); }
    ctx.save(); ctx.beginPath(); ctx.rect(-w, -h, w * 2, h * 1.2); ctx.clip(); circle(ctx, 0, h * 0.2, r); paint(ctx, c.boardInk); ctx.restore();
    ctx.fillStyle = "#004d36"; ctx.fillRect(-w / 2, h * 0.2, w, h * 0.3);
    ctx.strokeStyle = "rgba(255,255,255,.2)"; ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-w * 0.4 + i * 40, h * 0.3 + i * 10); ctx.lineTo(w * 0.4 - i * 40, h * 0.3 + i * 10); ctx.stroke(); }
  },
  ekushe(ctx, w, h, c) {
    // শহীদ মিনার before a red sun; sober on purpose
    const s = h / 290;
    circle(ctx, 0, -10 * s, 120 * s); paint(ctx, "#c8102e");
    ctx.fillStyle = c.boardInk;
    const frame = (x: number, fw: number, fh: number) => {
      const post = fw * 0.16, base = 140 * s;
      ctx.fillRect(x - fw / 2, base - fh, post, fh); ctx.fillRect(x + fw / 2 - post, base - fh, post, fh); ctx.fillRect(x - fw / 2, base - fh, fw, post);
      for (let i = 1; i <= 2; i++) ctx.fillRect(x - fw / 2 + (i * fw) / 3 - 2, base - fh + post, 4, fh - post);
    };
    frame(-150 * s, 54 * s, 120 * s); frame(150 * s, 54 * s, 120 * s); frame(-80 * s, 64 * s, 170 * s); frame(80 * s, 64 * s, 170 * s); frame(0, 90 * s, 200 * s);
    ctx.fillRect(-210 * s, 140 * s, 420 * s, 12 * s);
  },
  boishakh(ctx, w, h, c) {
    // a white আলপনা ring on red
    const s = h / 320;
    ctx.strokeStyle = c.boardInk; ctx.fillStyle = c.boardInk; ctx.lineCap = "round";
    circle(ctx, 0, 0, 128 * s); ctx.lineWidth = 5; ctx.stroke();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; leaf(ctx, Math.cos(a) * 60 * s, Math.sin(a) * 60 * s, 56 * s, 16 * s, a + Math.PI / 2); ctx.lineWidth = 4; ctx.stroke(); circle(ctx, Math.cos(a) * 140 * s, Math.sin(a) * 140 * s, 6 * s); ctx.fill(); }
    circle(ctx, 0, 0, 30 * s); ctx.fill();
    for (const side of [-1, 1]) for (let i = 0; i < 5; i++) { circle(ctx, side * (w * 0.3 + i * 22), (noise(i + side) - 0.5) * h * 0.6, 5); ctx.fill(); }
  },
  custom(ctx, w, h) {
    // a গাঁদা garland swagged across, the way a wedding gate is dressed
    for (const [y, sag] of [[-h * 0.35, h * 0.35], [-h * 0.15, h * 0.4]]) {
      for (let i = 0; i <= 18; i++) {
        const t = i / 18, x = -w / 2 + t * w, yy = y + sag * 4 * t * (1 - t);
        circle(ctx, x, yy, 17); paint(ctx, i % 3 ? "#f39c12" : "#e74c3c");
        circle(ctx, x, yy, 6); paint(ctx, "#b35a00");
      }
    }
    for (const x of [-w * 0.2, 0, w * 0.2]) { star(ctx, x, h * 0.32, 14); paint(ctx, "#ffd166"); }
  },
};

const layouts = {
  feed: { nail: 46, board: [110, 430], pad: [430, 1214], row: 512, number: 820, numberSize: 330, sub: 900, title: 1000, date: 1056, note: 1102, line: 1172 },
  story: { nail: 196, board: [262, 650], pad: [650, 1630], row: 736, number: 1166, numberSize: 470, sub: 1262, title: 1376, date: 1440, note: 1494, line: 1572 },
} as const;

function stamp(ctx: Ctx, x: number, y: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.12); ctx.globalAlpha = 0.85;
  ctx.beginPath(); ctx.roundRect(-96, -34, 192, 68, 12); paint(ctx, undefined, RED, 4);
  ctx.beginPath(); ctx.roundRect(-88, -26, 176, 52, 8); paint(ctx, undefined, RED, 1.5);
  fitText(ctx, [{ text: "সম্ভাব্য", color: RED, weight: 800, display: true }], 0, 13, 36, 160, "center");
  ctx.restore();
}

export function drawCard(canvas: HTMLCanvasElement, count: Countdown, today: string, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const c = colors[count.theme];
  const L = layouts[format];
  const [boardTop, boardBottom] = L.board, [padTop, padBottom] = L.pad;
  const left = 120, right = width - 120;

  // lime-washed wall with a little grain
  ctx.fillStyle = c.wall; ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 260; i++) { ctx.fillStyle = noise(i) > 0.5 ? "rgba(255,255,255,.35)" : "rgba(0,0,0,.035)"; circle(ctx, noise(i + 1) * width, noise(i + 2) * height, 1 + noise(i + 3) * 3); ctx.fill(); }

  // nail and string
  ctx.strokeStyle = "#6b5a48"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(400, boardTop + 24); ctx.lineTo(540, L.nail); ctx.lineTo(680, boardTop + 24); ctx.stroke();
  circle(ctx, 540, L.nail, 10); paint(ctx, "#8d8d8d", "#4a4a4a", 3);

  // the pad: a few page edges below, then the page itself
  ctx.fillStyle = "rgba(60,40,20,.16)"; ctx.fillRect(left + 34, padTop + 18, right - left - 52, padBottom - padTop);
  for (const k of [3, 2, 1]) { ctx.fillStyle = k % 2 ? "#f1ece1" : "#e8e1d3"; ctx.fillRect(left + 30 + k * 2, padTop, right - left - 60, padBottom - padTop + k * 6); }
  ctx.fillStyle = PAPER; ctx.fillRect(left + 30, padTop, right - left - 60, padBottom - padTop);
  // torn stubs of the pages already ripped off
  ctx.beginPath(); ctx.moveTo(left + 30, padTop);
  for (let x = left + 30; x <= right - 30; x += 18) ctx.lineTo(x, padTop + 10 + noise(x) * 16);
  ctx.lineTo(right - 30, padTop); ctx.closePath(); paint(ctx, "#f4efe4");
  ctx.beginPath();
  for (let x = left + 30; x <= right - 30; x += 18) ctx.lineTo(x, padTop + 10 + noise(x) * 16);
  paint(ctx, undefined, "rgba(120,100,80,.35)", 1.5);

  // the picture board on top
  ctx.save(); ctx.shadowColor = "rgba(40,25,10,.25)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
  ctx.beginPath(); ctx.roundRect(left, boardTop, right - left, boardBottom - boardTop, 16); paint(ctx, c.board);
  ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.roundRect(left, boardTop, right - left, boardBottom - boardTop, 16); ctx.clip();
  ctx.translate(540, (boardTop + boardBottom) / 2 + 10);
  art[count.theme](ctx, right - left, boardBottom - boardTop, c);
  ctx.restore();
  ctx.beginPath(); ctx.roundRect(left + 14, boardTop + 14, right - left - 28, boardBottom - boardTop - 28, 10); paint(ctx, undefined, count.theme === "ekushe" ? "#151515" : "rgba(255,255,255,.35)", 2);
  for (const x of [400, 680]) { circle(ctx, x, boardTop + 24, 7); paint(ctx, "#3a2a1c"); }
  for (const x of [left + 90, right - 90]) { circle(ctx, x, boardBottom - 2, 11); paint(ctx, "#b9b2a6", "#6d665c", 3); }

  // the page's words
  const inner = right - left - 140;
  fitText(ctx, [{ text: `আজ ${shortDate(today)} · ${banglaDate(today).split(" ").slice(0, 2).join(" ")}`, color: MUTED, weight: 600 }], left + 70, L.row, format === "story" ? 32 : 28, 420);
  if (count.likely) stamp(ctx, right - 150, L.row - 8);
  const big = !count.date ? "?" : count.days === 0 ? "আজ" : bn(Math.abs(count.days));
  fitText(ctx, [{ text: big, color: c.numeral, weight: 800, display: true }], 540, L.number, L.numberSize, inner, "center");
  const sub = !count.date ? "তারিখ আসছে" : count.days === 0 ? "আজই সেই দিন" : count.days > 0 ? "দিন বাকি" : "দিন আগে ছিল";
  fitText(ctx, [{ text: sub, color: INK, weight: 700, display: true }], 540, L.sub, format === "story" ? 72 : 60, inner, "center");
  ctx.fillStyle = "#e6dccb"; ctx.fillRect(left + 200, L.sub + 30, right - left - 400, 3);
  fitText(ctx, [{ text: count.title, color: c.title, weight: 800, display: true }], 540, L.title, format === "story" ? 96 : 80, inner, "center");
  if (count.date) {
    fitText(ctx, [{ text: dateLine(count.date), color: INK, weight: 600 }], 540, L.date, format === "story" ? 40 : 34, inner, "center");
    fitText(ctx, [{ text: `${count.note} · ${banglaDate(count.date)}`, color: MUTED, weight: 500 }], 540, L.note, format === "story" ? 32 : 28, inner, "center");
  }
  fitText(ctx, [{ text: humanLine(count), color: c.title, weight: 700, display: true }], 540, L.line, format === "story" ? 42 : 36, inner, "center");

  drawFooterBand(ctx, format, ASK, site, { band: count.theme === "ekushe" ? "#151515" : count.theme === "saraswati" ? "#6b4a00" : c.board, ask: c.ask, site: "#ffffff" });
}

export const cardBlob = (count: Countdown, today: string, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, count, today, format, site));

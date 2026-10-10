import { cardSizes, DISPLAY_FONT, drawFooterBand, fitText, renderCard, roundedRect, siteLabel, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, humanLine, kitById, numberText, possessive, printedName, sportLabel, PLACEHOLDER_NAME, type Jersey, type Kit } from "./jersey";

// The market jersey stall: a painted tin wall, a hanger rod, the shirt hung by its hook with your name and number freshly printed on the back.
export type Format = CardFormat | "square";
// "stage" is the wider, shorter view at the top of the page, so the controls still fit on the first phone screen.
export const sizes = { ...cardSizes, square: { width: 1080, height: 1080 }, stage: { width: 1080, height: 840 } } as const;

const SIGN = "#fff7e2";
const SIGN_RED = "#c8202f";
const SIGN_INK = "#1d2b53";

// Where things sit per format: the sign board (feed/story only), the rod, and the shirt's box (x, y, size in px for a 1000-unit shirt).
const layouts = {
  feed: { sign: 44, rod: 300, shirt: { x: 130, y: 360, s: 820 } },
  story: { sign: 290, rod: 590, shirt: { x: 90, y: 660, s: 900 } },
  square: { sign: 0, rod: 54, shirt: { x: 100, y: 116, s: 880 } },
  stage: { sign: 0, rod: 40, shirt: { x: 195, y: 100, s: 690 } },
} as const;

/** The shirt's back, in a 1000×1000 box: shoulders, short sleeves, a slightly curved hem. */
function silhouette(context: CanvasRenderingContext2D) {
  context.beginPath();
  context.moveTo(380, 40);
  context.quadraticCurveTo(500, 78, 620, 40);
  context.lineTo(800, 92);
  context.lineTo(975, 300);
  context.lineTo(880, 395);
  context.lineTo(806, 336);
  context.lineTo(816, 950);
  context.quadraticCurveTo(500, 990, 184, 950);
  context.lineTo(194, 336);
  context.lineTo(120, 395);
  context.lineTo(25, 300);
  context.lineTo(200, 92);
  context.closePath();
}

function sleeves(context: CanvasRenderingContext2D) {
  context.beginPath();
  context.moveTo(800, 92); context.lineTo(975, 300); context.lineTo(880, 395); context.lineTo(806, 336); context.closePath();
  context.moveTo(200, 92); context.lineTo(25, 300); context.lineTo(120, 395); context.lineTo(194, 336); context.closePath();
}

function cuffs(context: CanvasRenderingContext2D) {
  context.beginPath();
  context.moveTo(975, 300); context.lineTo(880, 395); context.lineTo(857, 371); context.lineTo(952, 276); context.closePath();
  context.moveTo(25, 300); context.lineTo(120, 395); context.lineTo(143, 371); context.lineTo(48, 276); context.closePath();
}

/** Text fitted to a width, optionally with a thick outline under the fill (printed vinyl lettering). Returns the size used. */
function letter(context: CanvasRenderingContext2D, text: string, cx: number, baseline: number, size: number, maxWidth: number, fill: string, outline = "", alpha = 1) {
  context.font = `800 ${size}px ${DISPLAY_FONT}`;
  while (context.measureText(text).width > maxWidth && size > 20) { size -= 2; context.font = `800 ${size}px ${DISPLAY_FONT}`; }
  context.save();
  context.globalAlpha = alpha;
  context.textAlign = "center";
  context.lineJoin = "round";
  if (outline) { context.strokeStyle = outline; context.lineWidth = size * 0.07; context.strokeText(text, cx, baseline); }
  context.fillStyle = fill;
  context.fillText(text, cx, baseline);
  context.restore();
  return size;
}

/** The hanger hook and the shirt with its print, drawn in the shirt's own 1000-unit box. */
function drawShirt(context: CanvasRenderingContext2D, jersey: Jersey, kit: Kit) {
  // Hook: up from the collar to the rod, curling over it.
  context.strokeStyle = "#9aa3ad";
  context.lineWidth = 12;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(500, 40); context.lineTo(500, -10);
  context.arc(470, -10, 30, 0, Math.PI, true);
  context.lineTo(445, 4);
  context.stroke();

  context.save();
  context.shadowColor = "rgba(0,0,0,0.35)";
  context.shadowBlur = 40;
  context.shadowOffsetX = 12;
  context.shadowOffsetY = 22;
  silhouette(context);
  context.fillStyle = kit.body;
  context.fill();
  context.restore();

  context.save();
  silhouette(context);
  context.clip();
  if ("stripe" in kit) {
    context.fillStyle = kit.stripe;
    for (let x = 220; x < 1000; x += 140) context.fillRect(x, 0, 70, 1000);
    for (let x = 80; x > -100; x -= 140) context.fillRect(x, 0, 70, 1000);
  }
  if (kit.sleeve) { sleeves(context); context.fillStyle = kit.sleeve; context.fill(); }
  cuffs(context);
  context.fillStyle = kit.trim;
  context.fill();
  // Fabric: light from the top left, a soft fold down the back, the hem a touch darker.
  const light = context.createLinearGradient(0, 0, 1000, 1000);
  light.addColorStop(0, "rgba(255,255,255,0.16)");
  light.addColorStop(0.5, "rgba(255,255,255,0)");
  light.addColorStop(1, "rgba(0,0,0,0.16)");
  context.fillStyle = light;
  context.fillRect(0, 0, 1000, 1000);
  context.strokeStyle = "rgba(0,0,0,0.045)";
  context.lineWidth = 18;
  context.beginPath(); context.moveTo(300, 420); context.quadraticCurveTo(330, 700, 280, 950); context.stroke();
  context.beginPath(); context.moveTo(720, 460); context.quadraticCurveTo(690, 720, 740, 950); context.stroke();
  context.restore();

  // Collar: a round ribbed neck for football, a folded polo collar for cricket.
  context.fillStyle = kit.trim;
  context.strokeStyle = kit.trim;
  if (jersey.sport === "f") {
    context.lineWidth = 26;
    context.beginPath(); context.moveTo(384, 48); context.quadraticCurveTo(500, 86, 616, 48); context.stroke();
  } else {
    context.beginPath();
    context.moveTo(366, 46); context.lineTo(392, 0); context.quadraticCurveTo(500, 20, 608, 0); context.lineTo(634, 46); context.quadraticCurveTo(500, 92, 366, 46);
    context.fill();
    context.strokeStyle = "rgba(0,0,0,0.18)";
    context.lineWidth = 4;
    context.beginPath(); context.moveTo(384, 30); context.quadraticCurveTo(500, 62, 616, 30); context.stroke();
  }

  const name = cleanName(jersey.name);
  const ink = kit.ink;
  letter(context, name ? printedName(name) : PLACEHOLDER_NAME, 500, 268, 128, 560, ink, kit.outline, name ? 1 : 0.5);
  letter(context, numberText(jersey), 500, 760, 440, 560, ink, kit.outline);
}

function drawWall(context: CanvasRenderingContext2D, width: number, height: number, color: string) {
  context.fillStyle = color;
  context.fillRect(0, 0, width, height);
  // Corrugated tin: a light ridge and a dark groove every 60px.
  for (let x = 0; x < width; x += 60) {
    context.fillStyle = "rgba(255,255,255,0.09)";
    context.fillRect(x, 0, 22, height);
    context.fillStyle = "rgba(0,0,0,0.10)";
    context.fillRect(x + 40, 0, 6, height);
  }
}

function drawRod(context: CanvasRenderingContext2D, width: number, y: number) {
  context.fillStyle = "rgba(0,0,0,0.22)";
  context.fillRect(0, y + 10, width, 10);
  const pipe = context.createLinearGradient(0, y - 10, 0, y + 10);
  pipe.addColorStop(0, "#e4e8ec");
  pipe.addColorStop(0.5, "#a7b0ba");
  pipe.addColorStop(1, "#6f7984");
  context.fillStyle = pipe;
  context.fillRect(0, y - 10, width, 20);
}

/** The stall's hand-painted sign board, carrying the human line. */
function drawSign(context: CanvasRenderingContext2D, top: number, line: string, story: boolean) {
  const x = 70, width = 940, height = story ? 200 : 186;
  context.save();
  context.rotate(-0.012);
  context.fillStyle = "rgba(0,0,0,0.25)";
  roundedRect(context, x + 8, top + 12, width, height, 14); context.fill();
  context.fillStyle = SIGN;
  roundedRect(context, x, top, width, height, 14); context.fill();
  context.strokeStyle = SIGN_RED; context.lineWidth = 8;
  roundedRect(context, x + 14, top + 14, width - 28, height - 28, 8); context.stroke();
  fitText(context, [{ text: "নাম আর নম্বর ছাপানো হয়", color: SIGN_INK, weight: 700 }], 540, top + 66, 32, 760, "center");
  fitText(context, [{ text: line, color: SIGN_RED, weight: 800, display: true }], 540, top + (story ? 150 : 140), story ? 66 : 62, 820, "center");
  context.restore();
}

/** A paper tag tied to the hook: the sport, or who the jersey is from. */
function drawTag(context: CanvasRenderingContext2D, jersey: Jersey, hookX: number, hookY: number, tagX: number, tagY: number) {
  const from = cleanName(jersey.from);
  const lines = from ? ["উপহার", `${possessive(from)} পক্ষ থেকে`] : [`${sportLabel(jersey.sport)} জার্সি`, "নাম-নম্বর ছাপা"];
  context.strokeStyle = "#f4efe2";
  context.lineWidth = 3;
  context.beginPath(); context.moveTo(hookX, hookY); context.quadraticCurveTo((hookX + tagX) / 2, tagY - 10, tagX + 20, tagY + 16); context.stroke();
  context.save();
  context.translate(tagX, tagY);
  context.rotate(0.09);
  context.shadowColor = "rgba(0,0,0,0.3)"; context.shadowBlur = 14; context.shadowOffsetY = 6;
  context.fillStyle = "#fbf3dc";
  roundedRect(context, 0, 0, 250, 120, 12); context.fill();
  context.shadowColor = "transparent";
  context.fillStyle = "#c9bfa5";
  context.beginPath(); context.arc(24, 24, 9, 0, Math.PI * 2); context.fill();
  fitText(context, [{ text: lines[0], color: SIGN_RED, weight: 800, display: true }], 125, 58, 34, 190, "center");
  fitText(context, [{ text: lines[1], color: SIGN_INK, weight: 600 }], 125, 98, 26, 220, "center");
  context.restore();
}

export function drawJersey(canvas: HTMLCanvasElement, jersey: Jersey, format: Format | "stage", site: string) {
  const { width, height } = sizes[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const kit = kitById(jersey.kit) ?? kitById("redgreen")!;
  const layout = layouts[format];
  const { x, y, s } = layout.shirt;

  drawWall(context, width, height, kit.wall);
  if (format === "feed" || format === "story") drawSign(context, layout.sign, humanLine(jersey.number), format === "story");
  drawRod(context, width, layout.rod);

  context.save();
  context.translate(x, y);
  context.scale(s / 1000, s / 1000);
  drawShirt(context, jersey, kit);
  context.restore();

  if (format === "stage") return;
  if (format === "square") {
    // A profile picture gets cropped to a circle, so the address sits in a corner the crop hides instead of a footer band.
    fitText(context, [{ text: siteLabel(site), color: "rgba(255,255,255,0.8)", weight: 600 }], width - 28, height - 26, 24, 300, "right");
    return;
  }
  drawTag(context, jersey, x + s * 0.45, y - s * 0.02, x + s * 0.74, y - s * 0.02 + 30);
  drawFooterBand(context, format, "তোমার পিঠে কোন নম্বর?", site);
}

export function jerseyBlob(jersey: Jersey, format: Format, site: string) {
  return renderCard(canvas => drawJersey(canvas, jersey, format, site));
}

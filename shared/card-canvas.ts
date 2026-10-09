// Canvas helpers for share cards. Cards are drawn client-side so Bangla shaping comes from the browser, never a server renderer.
export type CardFormat = "feed" | "story";
export type Photo = ImageBitmap | HTMLImageElement;
export const cardSizes = { feed: { width: 1080, height: 1350 }, story: { width: 1080, height: 1920 } } as const;
/** Facebook/Instagram stories cover roughly the top 250px and bottom 180px with their own UI; keep text out of there. */
export const storySafe = { top: 250, bottom: 180 } as const;

export const BODY_FONT = '"Bangla"';
export const DISPLAY_FONT = '"Display", "Bangla"';

export type Segment = { text: string; color: string; weight?: number; display?: boolean };

/** Draws one line of mixed-colour segments, shrinking the size until it fits maxWidth. Returns the size used. */
export function fitText(context: CanvasRenderingContext2D, segments: Segment[], x: number, y: number, size: number, maxWidth: number, align: "left" | "center" | "right" = "left") {
  const font = (part: Segment, px: number) => `${part.weight ?? 500} ${px}px ${part.display ? DISPLAY_FONT : BODY_FONT}`;
  const measure = () => segments.reduce((total, part) => { context.font = font(part, size); return total + context.measureText(part.text).width; }, 0);
  let width = measure();
  while (width > maxWidth && size > 14) { size -= 1; width = measure(); }
  let cursor = align === "center" ? x - width / 2 : align === "right" ? x - width : x;
  context.textAlign = "left";
  for (const part of segments) {
    context.font = font(part, size);
    context.fillStyle = part.color;
    context.fillText(part.text, cursor, y);
    cursor += context.measureText(part.text).width;
  }
  return size;
}

/** Word-wraps text into at most maxLines lines of maxWidth; if words are left over, the last line ends with "…". */
export function wrapText(context: Pick<CanvasRenderingContext2D, "measureText">, text: string, maxWidth: number, maxLines: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (!line || context.measureText(next).width <= maxWidth) { line = next; continue; }
    lines.push(line);
    line = word;
    if (lines.length === maxLines) { lines[maxLines - 1] += "…"; return lines; }
  }
  if (line) lines.push(line);
  return lines;
}

export function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

/** Centre-crops a photo into a circle with an outline. */
export function drawPhoto(context: CanvasRenderingContext2D, photo: Photo, cx: number, cy: number, radius: number, stroke = "#1d2b53") {
  const side = Math.min(photo.width, photo.height);
  context.save();
  context.beginPath(); context.arc(cx, cy, radius, 0, Math.PI * 2); context.clip();
  context.drawImage(photo, (photo.width - side) / 2, (photo.height - side) / 2, side, side, cx - radius, cy - radius, radius * 2, radius * 2);
  context.restore();
  context.strokeStyle = stroke; context.lineWidth = 3;
  context.beginPath(); context.arc(cx, cy, radius, 0, Math.PI * 2); context.stroke();
}

/** The dark band every card ends with: an invitation on the left, the site address on the right, so a screenshot still leads back here. */
export function drawFooterBand(context: CanvasRenderingContext2D, format: CardFormat, ask: string, site: string, colors = { band: "#1d2b53", ask: "#ffd166", site: "#ffffff" }) {
  const { width, height } = cardSizes[format];
  const story = format === "story";
  const top = story ? height - 240 : height - 96;
  const baseline = story ? top + 64 : height - 34;
  context.fillStyle = colors.band;
  context.fillRect(0, top, width, height - top);
  fitText(context, [{ text: ask, color: colors.ask, weight: 700, display: true }], 84, baseline, story ? 40 : 32, 560);
  fitText(context, [{ text: site, color: colors.site, weight: 600 }], width - 44, baseline, story ? 32 : 26, 400, "right");
  return top;
}

export async function loadCardFonts(sample = "আমার বাংলা") {
  await Promise.all([document.fonts.load(`700 48px ${BODY_FONT}`, sample), document.fonts.load(`800 48px ${DISPLAY_FONT}`, sample)]);
  await document.fonts.ready;
}

export function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("ছবিটা বানানো গেল না।")), "image/png"));
}

/** Renders a card off-screen with fonts loaded and returns the PNG. */
export async function renderCard(draw: (canvas: HTMLCanvasElement) => void): Promise<Blob> {
  await loadCardFonts();
  const canvas = document.createElement("canvas");
  draw(canvas);
  return canvasBlob(canvas);
}

/** Loads a picked photo shrunk to ~360px wide: cards only need a small circle, and cheap phones run out of memory on 12MP images. */
export async function loadPhoto(file: File): Promise<Photo> {
  return createImageBitmap(file, { resizeWidth: 360, resizeQuality: "high" }).catch(() => createImageBitmap(file));
}

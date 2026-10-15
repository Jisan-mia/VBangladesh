// The "আব্বু-আম্মুকে দেখাও" card: a passport page with today's three stamps, and no name of the child. 1080×1350.
import { cardSizes, drawFooterBand, fitText, roundedRect } from "../../../shared/card-canvas";
import { flagDocument, picDocument } from "./art";
import { countryOf } from "./countries";
import { helloLine } from "./game";

export type CardData = { label: string; title: string; trip: string; stars: number; ids: string[] };

export const FOOTER = "রাতে ম্যাপে দেশগুলো আবার খুঁজে দেখো";
const colors = { bg: "#eef3ea", line: "#dbe5d6", ink: "#23303a", muted: "#5a6670", accent: "#1f6f8b", star: "#f2a900", starOff: "#d9dccf", band: "#163f4f" };

/** Decodes each country's animal and flag from data: URLs (nothing is fetched). */
export async function loadPictures(ids: string[]) {
  const pictures = new Map<string, HTMLImageElement>();
  const load = async (key: string, svg: string) => {
    if (!svg) return;
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    await image.decode();
    pictures.set(key, image);
  };
  await Promise.all(ids.flatMap(id => [load(`${id}:animal`, picDocument(`${id}:animal`)), load(`${id}:flag`, flagDocument(id))]));
  return pictures;
}

function star(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r * 0.45 : r;
    c.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  c.closePath(); c.fillStyle = fill; c.fill();
}

export function drawCard(canvas: HTMLCanvasElement, data: CardData, pictures: Map<string, HTMLImageElement>, site: string) {
  const { width, height } = cardSizes.feed;
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  // A passport page: pale paper with fine wavy security lines.
  c.fillStyle = colors.bg; c.fillRect(0, 0, width, height);
  c.strokeStyle = colors.line; c.lineWidth = 2;
  for (let y = 40; y < height - 100; y += 26) {
    c.beginPath();
    for (let x = 0; x <= width; x += 20) c.lineTo(x, y + Math.sin(x / 60 + y / 90) * 6);
    c.stroke();
  }

  fitText(c, [{ text: data.label, color: colors.accent, weight: 700, display: true }], width / 2, 96, 40, 900, "center");
  fitText(c, [{ text: data.title, color: colors.ink, weight: 800, display: true }], width / 2, 182, 64, 960, "center");
  fitText(c, [{ text: data.trip, color: colors.muted, weight: 600 }], width / 2, 240, 34, 900, "center");
  for (let i = 0; i < 3; i++) star(c, width / 2 + (i - 1) * 76, 300, 28, i < data.stars ? colors.star : colors.starOff);

  const top = 350, rowHeight = 285;
  data.ids.forEach((id, index) => {
    const country = countryOf(id);
    if (!country) return;
    const y = top + index * rowHeight, tilt = [-0.035, 0.025, -0.015][index % 3];
    // The stamp: a ring in the country's ink with its animal inside, slightly crooked like a real one.
    c.save();
    c.translate(190, y + 125); c.rotate(tilt);
    c.globalAlpha = 0.92;
    c.strokeStyle = country.ink; c.lineWidth = 10;
    c.beginPath(); c.arc(0, 0, 112, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 96, 0, Math.PI * 2); c.stroke();
    c.globalAlpha = 1;
    c.fillStyle = "#fffdf6"; c.beginPath(); c.arc(0, 0, 92, 0, Math.PI * 2); c.fill();
    const animal = pictures.get(`${id}:animal`);
    if (animal) c.drawImage(animal, -78, -82, 156, 156);
    c.restore();

    const x = 340;
    const flag = pictures.get(`${id}:flag`);
    let nameX = x;
    if (flag) {
      const fh = 58, fw = Math.min(110, (fh * flag.naturalWidth) / flag.naturalHeight || fh * 1.5);
      roundedRect(c, x, y + 30, fw, fh, 6); c.save(); c.clip(); c.drawImage(flag, x, y + 30, fw, fh); c.restore();
      c.lineWidth = 2; c.strokeStyle = "#0002"; roundedRect(c, x, y + 30, fw, fh, 6); c.stroke();
      nameX = x + fw + 22;
    }
    fitText(c, [{ text: country.name, color: colors.ink, weight: 800, display: true }], nameX, y + 80, 60, width - nameX - 60);
    fitText(c, [{ text: `“${country.hello.word}”`, color: country.ink, weight: 800, display: true }, { text: `  ${helloLine(country)}`, color: colors.muted, weight: 600 }], x, y + 158, 42, width - x - 60);
    fitText(c, [{ text: `${country.food.name} · ${country.place.name}`, color: colors.ink, weight: 600 }], x, y + 220, 34, width - x - 60);
  });

  drawFooterBand(c, "feed", FOOTER, site, { band: colors.band, ask: "#ffd166", site: "#ffffff" });
}

import { cardSizes, drawFooterBand, fitText, renderCard, wrapText, BODY_FONT, type CardFormat, type Segment } from "../../../shared/card-canvas";
import { drawMat, palette } from "./art";
import { isFinale, levelOf, rowsToward, starsFor } from "./levels";
import { bn, humanLine, matName, MAT_ROWS, type Shared } from "./link";

export type CardData = Pick<Shared, "score" | "rows" | "pattern" | "name" | "level"> & { stars?: number };

/** The line under the points: a পাটি's own words, or খোলা পাটি's named mat. */
export function cardLine(data: CardData) {
  if (!data.level) return humanLine(data.rows);
  const row = levelOf(data.level);
  // A friend's link carries no stars: they follow from the rows and points.
  const stars = data.stars ?? starsFor(data.level, data.rows, data.score);
  if (!stars) return `${row.name}: ${bn(rowsToward(data.rows, row.goal))}/${bn(row.goal)} সারি বোনা হয়েছিল।`;
  return isFinale(data.level) ? `${row.name} পুরো হলো, ${bn(data.rows)} সারিতে।` : `${row.name} বোনা হলো, ${bn(data.rows)} সারিতে।`;
}

const GREEN = "#4f7a28";
const RED_BROWN = "#7c2f14";

/** The woven mat itself, laid on a swept clay floor, with the points beside it (feed) or under it (story). */
export function drawCard(canvas: HTMLCanvasElement, data: CardData, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story";

  c.fillStyle = palette.floor;
  c.fillRect(0, 0, width, height);
  // Broom sweeps on a লেপা floor.
  c.strokeStyle = palette.floorLine;
  c.lineWidth = 10;
  c.lineCap = "round";
  for (const [x, y, r, start] of [[180, 300, 420, 0.2], [900, 1100, 520, 3.4], [1000, 260, 300, 1.7], [120, 1200, 360, 4.6]]) {
    for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(x, y, r + k * 26, start, start + 1.1); c.stroke(); }
  }

  const title: Segment[] = [{ text: "পাটি বুনি", color: palette.ink, weight: 800, display: true }];
  if (data.name) title.push({ text: " · ", color: palette.ink, weight: 600 }, { text: data.name, color: GREEN, weight: 800, display: true });
  title.push({ text: " · ", color: palette.ink, weight: 600 }, { text: `${bn(data.rows)} সারি`, color: RED_BROWN, weight: 800, display: true });
  fitText(c, title, width / 2, story ? 370 : 128, 62, 940, "center");

  const cell = story ? 58 : 54, matWidth = cell * 8;
  const matX = story ? (width - matWidth) / 2 : 110, matY = story ? 470 : 236;
  c.save();
  c.translate(matX + matWidth / 2, matY + (cell * MAT_ROWS) / 2);
  c.rotate(-0.035);
  // A soft shadow so the mat lies on the floor.
  c.fillStyle = "#00000014";
  c.fillRect(-matWidth / 2 + 10, (-cell * MAT_ROWS) / 2 + 14, matWidth, cell * MAT_ROWS);
  drawMat(c, data.pattern, data.rows, -matWidth / 2, (-cell * MAT_ROWS) / 2, cell, MAT_ROWS);
  c.restore();

  const points = bn(data.score), line = cardLine(data);
  const mat = data.level ? `পাটি ${bn(data.level)}${data.stars ? " " + "★".repeat(data.stars) : ""}` : matName(data.rows);
  // The milestone mat, as a little tag above the points.
  if (mat) {
    const tagX = story ? width / 2 : 805, tagY = story ? 1350 : 300;
    c.font = `700 40px ${BODY_FONT}`;
    const tagW = c.measureText(mat).width + 48;
    c.fillStyle = palette.gold;
    c.beginPath(); c.roundRect(tagX - tagW / 2, tagY - 40, tagW, 60, 30); c.fill();
    c.fillStyle = palette.ink;
    c.textAlign = "center";
    c.fillText(mat, tagX, tagY + 4);
  }
  if (story) {
    fitText(c, [{ text: points, color: RED_BROWN, weight: 800, display: true }, { text: " পয়েন্ট", color: palette.ink, weight: 700 }], width / 2, 1490, 130, 900, "center");
    fitText(c, [{ text: line, color: GREEN, weight: 700 }], width / 2, 1590, 50, 900, "center");
  } else {
    const cx = 805;
    fitText(c, [{ text: points, color: RED_BROWN, weight: 800, display: true }], cx, 520, 190, 400, "center");
    fitText(c, [{ text: "পয়েন্ট", color: palette.ink, weight: 700 }], cx, 600, 54, 400, "center");
    c.fillStyle = palette.bambooDark;
    c.fillRect(cx - 120, 650, 240, 6);
    c.font = `700 46px ${BODY_FONT}`;
    c.fillStyle = GREEN;
    c.textAlign = "center";
    wrapText(c, line, 400, 3).forEach((text, index) => c.fillText(text, cx, 740 + index * 64));
  }
  drawFooterBand(c, format, "তোমার পাটি কত বড় হবে?", site, { band: palette.ink, ask: palette.gold, site: "#ffffff" });
}

export const cardBlob = (data: CardData, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, data, format, site));

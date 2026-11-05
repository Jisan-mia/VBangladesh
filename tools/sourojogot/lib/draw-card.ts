// The parent card (1080×1350): the Sun's edge, the round's planets in order, what was done, one true number. No name and
// no stars: it says what was done, never a grade.
import { cardSizes, drawFooterBand, fitText, renderCard } from "../../../shared/card-canvas";
import { levelOf, placeOf } from "./course";
import { bn, PLANETS, type Planet } from "./planets";
import type { Result } from "./round";
import { cardFact, doneLine } from "./words";

const colors = { sky: "#141d3f", skyLow: "#26346a", ink: "#fff6df", muted: "#c9cff0", band: "#0c1330", ask: "#ffd166" };

/** A planet as a shaded ball; Jupiter gets bands and Saturn its ring. Shared with nothing else, so it lives here. */
export function drawPlanet(c: CanvasRenderingContext2D, planet: Planet, x: number, y: number, r: number) {
  if (planet.id === "saturn") ring(c, planet, x, y, r, "back");
  const fill = c.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
  fill.addColorStop(0, planet.color); fill.addColorStop(1, planet.shade);
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = fill; c.fill();
  if (planet.id === "jupiter") {
    c.save(); c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.clip();
    c.fillStyle = "#b8743f88";
    for (const at of [-0.45, -0.1, 0.3]) c.fillRect(x - r, y + at * r, r * 2, r * 0.14);
    c.fillStyle = "#c4553a"; c.beginPath(); c.ellipse(x + r * 0.3, y + r * 0.42, r * 0.17, r * 0.09, 0, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  if (planet.id === "earth") {
    c.save(); c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.clip();
    c.fillStyle = "#4caf6a";
    c.beginPath(); c.ellipse(x - r * 0.3, y - r * 0.2, r * 0.38, r * 0.26, 0.6, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(x + r * 0.35, y + r * 0.35, r * 0.28, r * 0.2, -0.4, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  if (planet.id === "mars") { c.fillStyle = "#ffffffd9"; c.beginPath(); c.ellipse(x, y - r * 0.9, r * 0.4, r * 0.18, 0, 0, Math.PI * 2); c.fill(); }
  if (planet.id === "saturn") ring(c, planet, x, y, r, "front");
}

function ring(c: CanvasRenderingContext2D, planet: Planet, x: number, y: number, r: number, half: "back" | "front") {
  c.save();
  c.strokeStyle = planet.shade; c.lineWidth = Math.max(2, r * 0.22);
  c.beginPath();
  c.ellipse(x, y, r * 1.9, r * 0.5, -0.25, half === "back" ? Math.PI : 0, half === "back" ? Math.PI * 2 : Math.PI);
  c.stroke(); c.restore();
}

export function drawCard(canvas: HTMLCanvasElement, result: Pick<Result, "level" | "planets">, site: string) {
  const { width, height } = cardSizes.feed;
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const sky = c.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, colors.sky); sky.addColorStop(1, colors.skyLow);
  c.fillStyle = sky; c.fillRect(0, 0, width, height);
  // Fixed little stars, so the card looks the same every time.
  c.fillStyle = "#ffffff88";
  for (let i = 0; i < 60; i++) { c.beginPath(); c.arc((i * 337) % width, (i * 211) % 1180, i % 3 ? 2 : 3.5, 0, Math.PI * 2); c.fill(); }

  // The Sun's edge on the left; planets run out from it.
  const sun = c.createRadialGradient(-260, 640, 60, -260, 640, 420);
  sun.addColorStop(0, "#fff3b0"); sun.addColorStop(0.6, "#ffc93c"); sun.addColorStop(1, "#f28c28");
  c.beginPath(); c.arc(-260, 640, 400, 0, Math.PI * 2); c.fillStyle = sun; c.fill();

  const planets = [...new Set(result.planets)].map(index => PLANETS[index]), span = width - 230, gap = span / planets.length;
  // Four planets in one row; eight zigzag on two rows so the big ones get room.
  const wide = planets.length > 4;
  planets.forEach((planet, i) => {
    const r = Math.min(wide ? 92 : gap * 0.42, planet.drawR * (wide ? 2.2 : 3.2)), x = 190 + gap * (i + 0.5), y = wide ? (i % 2 ? 790 : 560) : 640;
    drawPlanet(c, planet, x, y, r);
    fitText(c, [{ text: planet.name, color: colors.muted, weight: 700 }], x, y + Math.max(r, 30) + 46, 34, wide ? 200 : gap - 6, "center");
  });

  fitText(c, [{ text: `সৌরজগতের সফর · লেভেল ${bn(placeOf(result.level))}`, color: colors.muted, weight: 700, display: true }], width / 2, 120, 38, 960, "center");
  fitText(c, [{ text: doneLine(result.level), color: colors.ink, weight: 800, display: true }], width / 2, 260, 72, 980, "center");
  fitText(c, [{ text: levelOf(result.level).finale ?? levelOf(result.level).title, color: colors.ask, weight: 700 }], width / 2, 345, 40, 960, "center");
  fitText(c, [{ text: cardFact(result.level), color: colors.ink, weight: 700 }], width / 2, wide ? 1040 : 1010, 44, 960, "center");
  drawFooterBand(c, "feed", "আজ রাতে একসাথে আকাশটা দেখো", site, { band: colors.band, ask: colors.ask, site: "#ffffff" });
}

export const cardBlob = (result: Pick<Result, "level" | "planets">, site: string) => renderCard(canvas => drawCard(canvas, result, site));

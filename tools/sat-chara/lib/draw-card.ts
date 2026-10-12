import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat } from "../../../shared/card-canvas";
import { cleanName } from "../../../shared/game-core";
import { drawBackground, drawBall, drawStone, ink, SCENES, STONE_SHADES } from "./art";
import { layoutOf, seedOf, worldIndex } from "./levels";
import { ballsText, humanLine, levelLabel, starsOf, type Shared } from "./link";
import { GROUND, W } from "./physics";

const colors = { muted: "#6b4f3a", accent: "#b4472a", star: "#f2a900", starOff: "#e3d6bd", band: "#3b2418", ask: "#ffd27a" };

function star(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r * 0.45 : r;
    c.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  c.closePath(); c.fillStyle = fill; c.fill();
}

/** The level's place after the throw: the seven stones scattered on the ground past the pile, the ball rolling up behind. */
function drawAftermath(c: CanvasRenderingContext2D, shared: Shared) {
  const layout = layoutOf(shared.level), scene = worldIndex(shared.level);
  drawBackground(c, scene, layout.blocks);
  const centre = layout.stones.reduce((sum, stone) => sum + stone.x, 0) / layout.stones.length;
  const spread = [-52, -30, -8, 14, 36, 58, 22], turn = [0, Math.PI, 0, 0.28, 0, Math.PI, -0.22];
  const lift = [0, 0, 0, -5, 0, 0, -7];
  spread.forEach((dx, i) => {
    const x = Math.min(452, Math.max(150, centre + dx)), stone = layout.stones[i];
    let floor = GROUND;
    for (const [x0, y0, x1] of layout.blocks) if (x > x0 - stone.w / 2 && x < x1 + stone.w / 2) floor = Math.min(floor, y0);
    c.save(); c.translate(x, floor - stone.h / 2 + lift[i]); c.rotate(turn[i]);
    drawStone(c, stone.w, stone.h, STONE_SHADES[i], seedOf(shared.level) + i);
    c.restore();
  });
  drawBall(c, Math.max(175, centre - 100), GROUND - 8, 0.6);
}

export function drawCard(canvas: HTMLCanvasElement, shared: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2, top = story ? 250 : 0, stars = starsOf(shared.balls);
  const scene = SCENES[worldIndex(shared.level)];
  c.fillStyle = scene.sky; c.fillRect(0, 0, width, height);

  const name = cleanName(shared.name);
  fitText(c, [{ text: `সাত চাড়া · ${levelLabel(shared.level)}`, color: colors.muted, weight: 700, display: true }], cx, top + 100, 40, 940, "center");
  fitText(c, [
    { text: name ? `${name} ` : "", color: ink, weight: 800, display: true },
    { text: `৭টা চাড়া ${ballsText(shared.balls)}`, color: colors.accent, weight: 800, display: true },
    { text: name ? " ফেলেছে" : " ফেললাম", color: ink, weight: 800, display: true },
  ], cx, top + 196, 72, 980, "center");
  for (let i = 0; i < 3; i++) star(c, cx + (i - 1) * 84, top + 266, 32, i < stars ? colors.star : colors.starOff);

  // The right part of the place, zoomed so the scattered stones read: x 140–480, from the window down to the ground.
  const fromX = 140, fromY = 110, shown = 210, k = width / (W - fromX), sceneTop = top + 320;
  c.save();
  c.beginPath(); c.rect(0, sceneTop, width, shown * k); c.clip();
  c.translate(-fromX * k, sceneTop - fromY * k); c.scale(k, k);
  drawAftermath(c, shared);
  c.restore();

  const after = sceneTop + shown * k;
  c.fillStyle = scene.sky; c.fillRect(0, after, width, height - after);
  fitText(c, [{ text: humanLine(shared.balls), color: ink, weight: 800, display: true }], cx, after + (story ? 110 : 82), story ? 58 : 50, 940, "center");
  drawFooterBand(c, format, "তুমি কয় বলে পারবে?", site, { band: colors.band, ask: colors.ask, site: "#ffffff" });
}

export const cardBlob = (shared: Shared, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, shared, format, site));

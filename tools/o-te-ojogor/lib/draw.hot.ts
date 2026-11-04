// One frame of the tree. Runs every animation frame: no allocation, no closures, no string building. The scene and the
// basket are pre-rendered bitmaps, and every fruit's font is prepared when its level starts (prepareFonts in the component).
import { drawFinger, drawFruit, drawGlow, BASKET_BOX } from "./art";
import type { View } from "./view";
import {
  hinting, type Game,
  BOUNCE, CATCH_Y, CAUGHT, FALL, FREE, GROW, H, HANG, LEAVE, R, W, BASKET_Y,
} from "./tree";

const POP_FONT = '800 20px "Display", "Bangla"';

export function drawFrame(c: CanvasRenderingContext2D, game: Game, v: View) {
  const background = v.background;
  if (!background) return;
  const t = game.t, world = game.spec.world, calm = v.calm, hint = hinting(game) && !game.over;
  c.save();
  c.scale(v.scale, v.scale);
  c.drawImage(background, 0, 0, W, H);
  for (let slot = 0; slot < game.fruits.length; slot++) {
    const fruit = game.fruits[slot];
    const s = fruit.state;
    if (s === FREE || s === CAUGHT) continue;
    const font = v.fonts.get(fruit.text) ?? v.fallback, right = fruit.item === game.index;
    if (s === HANG) {
      if (t < fruit.born) continue;
      const grow = calm ? 1 : Math.min(1, (t - fruit.born) / GROW) ** 0.6, soon = fruit.drop - t < 0.35;
      let sway = calm ? 0 : Math.sin(v.clock * (soon ? 22 : 2.5) + fruit.lane) * (soon ? 0.12 : 0.05);
      // A wrong pick: the fruit shakes its head; in ধীরে খেলো it only leans.
      if (fruit.shake > 0) sway += calm ? 0.12 : Math.sin(fruit.shake * 38) * fruit.shake * 0.6;
      if (hint && right) drawGlow(c, fruit.x, fruit.y, R * fruit.scale, calm ? 0 : v.clock * 0.8);
      drawFruit(c, fruit.x, fruit.y, fruit.text, font, world, fruit.scale * grow, sway);
      if (v.finger && right && t > fruit.born + GROW) drawFinger(c, fruit.x, fruit.y + R * fruit.scale + 8, calm ? 0 : Math.sin(v.clock * 4) * 6);
    } else if (s === FALL) {
      if (hint && right) drawGlow(c, fruit.x, fruit.y, R * fruit.scale, calm ? 0 : v.clock * 0.8);
      drawFruit(c, fruit.x, fruit.y, fruit.text, font, world, fruit.scale);
    } else {
      const span = s === BOUNCE ? 0.7 : s === LEAVE ? 0.4 : 0.9, fade = (t - fruit.ended) / span;
      c.globalAlpha = Math.max(0, 1 - fade);
      const grow = s === LEAVE ? fruit.scale * (1 - fade * 0.4) : fruit.scale;
      drawFruit(c, fruit.x, s === LEAVE ? fruit.y - fade * 10 : fruit.y, fruit.text, font, world, grow, s === BOUNCE && !calm ? fade * 3 : 0);
      c.globalAlpha = 1;
    }
  }
  for (let slot = 0; slot < game.fruits.length; slot++) {
    const fruit = game.fruits[slot];
    if (fruit.state !== CAUGHT) continue;
    const k = Math.min(1, (t - fruit.ended) / 0.3);
    drawFruit(c, game.basketX, CATCH_Y + k * 16, fruit.text, v.fonts.get(fruit.text) ?? v.fallback, world, fruit.scale * (1 - k * 0.7));
  }
  // After a wrong letter the basket rocks; in ধীরে খেলো it only leans.
  const basket = v.basket;
  if (basket) {
    const tilt = game.wobble <= 0 ? 0 : calm ? 0.1 : Math.sin((0.5 - game.wobble) * 34) * game.wobble * 0.5;
    c.save();
    c.translate(game.basketX, BASKET_Y);
    if (tilt) c.rotate(tilt);
    c.drawImage(basket, BASKET_BOX.x, BASKET_BOX.y, BASKET_BOX.w, BASKET_BOX.h);
    c.restore();
  }
  if (v.popT < 0.8) {
    c.globalAlpha = 1 - v.popT / 0.8;
    c.font = POP_FONT; c.textAlign = "center"; c.textBaseline = "alphabetic"; c.fillStyle = "#2f5d2a";
    c.fillText(v.popText, v.popX, CATCH_Y - 34 - (calm ? 0 : v.popT * 30));
    c.globalAlpha = 1;
  }
  c.restore();
}

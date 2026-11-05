// One frame of the river: the painted background slice, ripples, floaters with their foam and wake, mangoes, the bell, the boy, the edge
// pointers and glows, rain, pops and the HUD. No allocation in here: everything it draws was pre-painted by paint.ts, and strings are
// remade there only when a number changes.
import { drawBell } from "./art";
import { dipOf, floaterAt, leftOf, mangoX, mod, COLS, FERRY, HOP_T, NOUKA, PANA, START_X, VELA, WATER } from "./river";
import type { Run } from "./run";
import { refreshHud, landPad, type Scene } from "./paint";

const LOW = -0.6, ANCHOR = 0.3;
const RIPPLE = "rgba(255,255,255,0.32)", FOAM = "rgba(255,255,255,0.3)", WAKE = "rgba(255,255,255,0.5)", FERRY_WAKE = "rgba(255,255,255,0.55)";
const SHADOW = "rgba(0,0,0,0.18)", PILL = "rgba(32,40,38,0.62)", CREAM = "#fff8e6", GOLD = "#ffd84a", GOOD = "#8fd67a", LATE = "#9aa4a0", POP_EDGE = "rgba(30,40,40,0.75)";
const RAIN = "rgba(225,238,246,0.45)", RINGS = "rgba(255,255,255,0.85)", HINT = "rgba(255,255,255,0.9)", FINALE_PILL = "rgba(120,30,30,0.7)", NOTCH = "#ffffff";
const TWO_PI = Math.PI * 2;

const rowTop = (height: number, cam: number, cell: number, row: number) => height - (row + 1 - cam) * cell;
const ease = (p: number) => 1 - (1 - p) * (1 - p);
const camHigh = (scene: Scene) => scene.river.lanes.length + 1 - scene.view;
function camGoal(scene: Scene, row: number) {
  const high = camHigh(scene);
  if (high < LOW) return LOW - (LOW - high) * 0.38; // the whole river fits: it sits low, near the thumbs, with the village above
  const goal = row - scene.view * ANCHOR;
  return goal < LOW ? LOW : goal > high ? high : goal;
}

/** Moves the camera towards the boy and ages the floating words. `run` is null on the title. */
export function tickScene(scene: Scene, dt: number, run: Run | null) {
  scene.clock += dt;
  const row = run ? (run.down > 0 ? run.splashRow : run.row) : 0, goal = camGoal(scene, row);
  scene.cam = scene.cam < -8 ? goal : scene.cam + (goal - scene.cam) * Math.min(1, dt * 6);
  for (const each of scene.popups) each.age += dt;
}

/** Puts the camera where it belongs at once (a new river, a restart). */
export function settleCamera(scene: Scene, row = 0) { scene.cam = camGoal(scene, row); }

/** Seconds until a ferry floater is next on screen: 0 while it is, else the wait. Its edge chevron shows for the last few. */
export function ferryWait(left: number, len: number, dir: number, speed: number, ring: number) {
  const off = (ring - COLS) / 2;
  if (left < COLS && left + len > 0) return 0;
  if (dir > 0) return left >= COLS ? (ring - off - left + Math.max(0, off - len)) / speed : (-len - left) / speed;
  return left >= COLS ? (left - COLS) / speed : (left + off + (ring - off - COLS)) / speed;
}

function place(c: CanvasRenderingContext2D, canvas: HTMLCanvasElement, w: number, h: number, pad: number, x: number, y: number, cell: number) {
  c.drawImage(canvas, x - pad * cell, y - pad * cell, (w + pad * 2) * cell, (h + pad * 2) * cell);
}

/** One frame. `showHud` is false under the title, the story and the card. `run` is null on the title (the river at its starting moment, the boy on the near ghat). */
export function drawScene(scene: Scene, run: Run | null, slow: boolean, showHud: boolean) {
  const c = scene.context, width = scene.width, height = scene.height, cell = scene.cell, river = scene.river, sprites = scene.sprites;
  const n = river.lanes.length - 1, t = run ? run.t : 0, clock = scene.clock, cam = scene.cam < -8 ? LOW : scene.cam, view = scene.view;
  const sy = (n + landPad(n, view) + 1 - cam - view) * cell;
  c.drawImage(scene.bg, 0, sy * scene.ratio, scene.bg.width, height * scene.ratio, 0, 0, width, height);

  const first = Math.max(1, Math.floor(cam)), last = Math.min(n - 1, Math.ceil(cam + view));
  // Ripples that travel with each lane's current (and crests in a ferry's wake).
  c.strokeStyle = RIPPLE; c.lineWidth = Math.max(1, cell * 0.04); c.lineCap = "round";
  c.beginPath();
  for (let row = first; row <= last; row++) {
    const lane = river.lanes[row];
    if (lane.type !== WATER) continue;
    const y = rowTop(height, cam, cell, row), drift = lane.dir * lane.speed * (run ? t : clock * 0.6);
    for (let k = 0; k < 4; k++) {
      const x = (mod(k * 2.4 + (row % 3) * 0.7 + drift, COLS + 1) - 0.5) * cell, yy = y + cell * (0.22 + ((k + row) % 3) * 0.26);
      c.moveTo(x, yy); c.lineTo(x + cell * 0.32, yy);
    }
    if (lane.wake) for (let k = 0; k < 6; k++) {
      const x = (mod(k * 1.6 - drift * 1.4, COLS + 1) - 0.5) * cell, yy = y + cell * (0.3 + (k % 2) * 0.4);
      c.moveTo(x - cell * 0.12, yy + cell * 0.08); c.lineTo(x, yy - cell * 0.04); c.lineTo(x + cell * 0.12, yy + cell * 0.08);
    }
  }
  c.stroke();

  // What floats: a pale foam rim and a short wake behind each, so every platform reads at a glance and shows which way it goes.
  for (let row = first; row <= last; row++) {
    const lane = river.lanes[row];
    if (lane.type !== WATER) continue;
    const y = rowTop(height, cam, cell, row);
    for (let index = 0; index < lane.floaters.length; index++) {
      const floater = lane.floaters[index], left = leftOf(lane, floater, t);
      if (left > COLS || left + floater.len < 0) continue;
      const x = left * cell, dip = floater.kind === PANA ? dipOf(floater, t) : 0;
      if (dip < 1) {
        c.globalAlpha = 1 - 0.5 * dip;
        c.fillStyle = FOAM; c.beginPath(); c.roundRect(x - cell * 0.04, y + cell * 0.06, floater.len * cell + cell * 0.08, cell * 0.88, cell * 0.42); c.fill();
        c.globalAlpha = 1;
      }
      const stern = lane.dir > 0 ? x : x + floater.len * cell, back = -lane.dir;
      if (floater.kind === FERRY) {
        c.strokeStyle = FERRY_WAKE; c.lineWidth = Math.max(1.5, cell * 0.06);
        c.beginPath(); c.moveTo(stern, y + cell * 0.25); c.lineTo(stern + back * cell * 2.2, y - cell * 0.25); c.moveTo(stern, y + cell * 0.75); c.lineTo(stern + back * cell * 2.2, y + cell * 1.25); c.stroke();
        place(c, lane.dir > 0 ? sprites.ferryR.canvas : sprites.ferryL.canvas, sprites.ferryR.w, sprites.ferryR.h, sprites.ferryR.pad, x, y, cell);
        continue;
      }
      if (dip < 1 && !slow) {
        c.strokeStyle = WAKE; c.lineWidth = Math.max(1.5, cell * 0.05);
        c.beginPath(); c.moveTo(stern, y + cell * 0.35); c.lineTo(stern + back * cell * 0.55, y + cell * 0.35); c.moveTo(stern, y + cell * 0.65); c.lineTo(stern + back * cell * 0.55, y + cell * 0.65); c.stroke();
      }
      const s = floater.kind === NOUKA ? sprites.nouka : floater.kind === VELA ? sprites.vela : floater.len < 2 ? sprites.smallPana : sprites.pana;
      if (dip === 0) { place(c, s.canvas, s.w, s.h, s.pad, x, y, cell); continue; }
      if (dip < 1) {
        // Sinking: smaller and paler, so you see it going before it's gone.
        const k = 1 - 0.3 * dip, cx = x + floater.len * cell / 2, cy = y + cell / 2;
        c.globalAlpha = 1 - 0.55 * dip;
        c.save(); c.translate(cx, cy); c.scale(k, k); c.translate(-cx, -cy); place(c, s.canvas, s.w, s.h, s.pad, x, y, cell); c.restore();
        c.globalAlpha = 1;
      }
      c.strokeStyle = WAKE; c.lineWidth = Math.max(1, cell * 0.035);
      c.beginPath(); c.ellipse(x + floater.len * cell / 2, y + cell / 2, floater.len * cell * 0.38, cell * 0.28, 0, 0, TWO_PI); c.stroke();
    }
  }

  // The first hops on rivers 1 and 2: the ভেলা just ahead of the boy pulses.
  if (run && !run.done && run.river.level <= 2 && run.hops < 3 && run.down <= 0 && run.row < n) {
    const ahead = river.lanes[run.row + 1];
    if (ahead.type === WATER) {
      const index = floaterAt(ahead, run.x, t, 0);
      if (index >= 0) {
        const floater = ahead.floaters[index], pulse = slow ? 0.5 : 0.5 + 0.5 * Math.sin(clock * 7);
        c.strokeStyle = HINT; c.lineWidth = Math.max(2, cell * 0.07); c.globalAlpha = 0.45 + 0.4 * pulse;
        c.beginPath(); c.roundRect(leftOf(ahead, floater, t) * cell - cell * 0.08, rowTop(height, cam, cell, run.row + 1) + cell * 0.04, floater.len * cell + cell * 0.16, cell * 0.92, cell * 0.44); c.stroke();
        c.globalAlpha = 1;
      }
    }
  }

  // Mangoes still to pick; one beyond the top of the screen gets a small pointer under the HUD.
  for (let index = 0; index < river.mangoes.length; index++) {
    const mango = river.mangoes[index];
    if (run && run.taken & (1 << index)) continue;
    const x = mangoX(river, mango, t);
    if (mango.row > cam + view) {
      if (run) place(c, sprites.chevGold.canvas, sprites.chevGold.w, sprites.chevGold.h, sprites.chevGold.pad, Math.min(COLS - 1, Math.max(1, x)) * cell - cell * 0.5, cell * 1.35, cell);
      continue;
    }
    if (mango.row < first - 1 || mango.row > last + 1 || x < -0.5 || x > COLS + 0.5) continue;
    const bob = slow ? 0 : Math.sin(clock * 4 + index) * cell * 0.04;
    place(c, sprites.mango.canvas, sprites.mango.w, sprites.mango.h, sprites.mango.pad, (x - 0.3) * cell, rowTop(height, cam, cell, mango.row) + cell * 0.12 + bob, cell);
  }

  // The far ghat's bell (it swings when you arrive).
  const since = clock - scene.bellAt, swing = since < 2.5 && !slow ? Math.sin(since * 14) * 0.45 * Math.exp(-since * 2) : 0;
  c.save(); c.translate(6.75 * cell, rowTop(height, cam, cell, n) + cell * 0.55); c.scale(cell, cell); drawBell(c, swing); c.restore();

  // A ferry about to come in: a chevron at the edge it enters from, in its row, for its last four seconds out of sight.
  if (river.ferry && run) {
    for (let row = first; row <= last; row++) {
      const lane = river.lanes[row];
      for (let index = 0; index < lane.floaters.length; index++) {
        const floater = lane.floaters[index];
        if (floater.kind !== FERRY) continue;
        const wait = ferryWait(leftOf(lane, floater, t), floater.len, lane.dir, lane.speed, lane.ring);
        if (wait <= 0 || wait > 4) continue;
        c.globalAlpha = slow ? 1 : 0.8 + 0.2 * Math.sin(clock * 12);
        const arrow = lane.dir < 0 ? sprites.chevL : sprites.chevR, big = cell * 1.3;
        c.drawImage(arrow.canvas, lane.dir < 0 ? width - big * 0.95 : -big * 0.05, rowTop(height, cam, cell, row) - (big - cell) / 2, big, big);
        c.globalAlpha = 1;
      }
    }
  }

  // The boy.
  const kidRow = run ? run.row : 0, kidX = run ? run.x : START_X;
  if (!run || run.down <= 0) {
    let row = kidRow, x = kidX, lift = 0, scale = 1;
    if (run && run.hop > 0) {
      // A hop shows at once: the first part is already under way in the frame the tap is drawn.
      const p = ease(0.22 + 0.78 * (1 - run.hop / HOP_T));
      row = run.fromRow + (run.row - run.fromRow) * p; x = run.fromX + (run.x - run.fromX) * p; lift = Math.sin(Math.PI * p) * 0.32;
    }
    const sinceBack = clock - scene.respawnAt;
    if (sinceBack < 0.25 && !slow) scale = 0.6 + 0.4 * ease(sinceBack / 0.25);
    const kid = sprites.kid, feetX = x * cell, feetY = rowTop(height, cam, cell, row) + cell * 0.8;
    if (lift > 0) { c.fillStyle = SHADOW; c.beginPath(); c.ellipse(feetX, feetY, cell * 0.2, cell * 0.07, 0, 0, TWO_PI); c.fill(); }
    const w = (kid.w + kid.pad * 2) * cell * scale, h = (kid.h + kid.pad * 2) * cell * scale * (1 + lift * 0.25);
    c.drawImage(kid.canvas, feetX - w / 2, feetY - (0.95 + kid.pad) * cell * scale * (1 + lift * 0.25) - lift * cell, w, h);
  } else {
    // In the water: rings spread from the splash (no drama, just water).
    const p = 1 - run.down / run.respawn, x = run.splashX * cell, y = rowTop(height, cam, cell, run.splashRow) + cell * 0.55;
    c.strokeStyle = RINGS; c.lineWidth = Math.max(1.5, cell * 0.06);
    c.beginPath(); c.ellipse(x, y, cell * (0.15 + p * 0.55), cell * (0.08 + p * 0.25), 0, 0, TWO_PI); c.stroke();
    if (p > 0.25) { c.globalAlpha = 1 - p; c.beginPath(); c.ellipse(x, y, cell * (p * 0.9), cell * (p * 0.4), 0, 0, TWO_PI); c.stroke(); c.globalAlpha = 1; }
    if (!slow && p < 0.6) {
      c.fillStyle = RINGS;
      for (let k = 0; k < 6; k++) { const a = -Math.PI * (0.15 + k * 0.14), r = cell * (0.2 + p * 0.6); c.fillRect(x + Math.cos(a) * r, y + Math.sin(a) * r * 1.3 + p * p * cell * 0.8, cell * 0.06, cell * 0.06); }
    }
  }

  // Rain on the monsoon rivers: slanted streaks (no flashes; still in ধীরে খেলো).
  if (river.rain) {
    c.strokeStyle = RAIN; c.lineWidth = 1;
    c.beginPath();
    const fall = slow ? 0 : clock * 0.9;
    for (let i = 0; i < scene.rain.length; i += 3) {
      const x = mod(scene.rain[i] + fall * 0.25, 1) * width, y = mod(scene.rain[i + 1] + fall, 1) * height, len = cell * (0.3 + scene.rain[i + 2] * 0.3);
      c.moveTo(x, y); c.lineTo(x - len * 0.3, y + len);
    }
    c.stroke();
  }

  // Danger at the edge: the side the current is carrying you to glows red and grows; a sinking কচুরিপানা under you warms the bottom edge.
  // In ধীরে খেলো the glow is steady, never pulsing.
  if (run && !run.done) {
    const reach = cell * 1.5;
    if (run.edge > 0) {
      const k = run.edge * (slow ? 0.8 : 0.6 + 0.4 * Math.sin(clock * 14));
      c.globalAlpha = k < 0 ? 0 : k > 1 ? 1 : k;
      if (run.edgeSide < 0) { c.fillStyle = scene.glows.left; c.fillRect(0, 0, reach, height); } else { c.fillStyle = scene.glows.right; c.fillRect(width - reach, 0, reach, height); }
      c.globalAlpha = 1;
    }
    if (run.sink > 0) {
      c.globalAlpha = run.sink * (slow ? 0.8 : 0.6 + 0.4 * Math.sin(clock * 16));
      c.fillStyle = scene.glows.bottom; c.fillRect(0, height - reach, width, reach);
      c.globalAlpha = 1;
    }
  }

  // Floating words (small and quick).
  c.textAlign = "center"; c.lineJoin = "round";
  for (const each of scene.popups) {
    if (each.age > 0.8) continue;
    const p = each.age / 0.8;
    c.globalAlpha = 1 - p * p;
    c.font = scene.fonts.popup;
    const x = Math.max(cell * 1.2, Math.min(width - cell * 1.2, each.x * cell)), y = rowTop(height, cam, cell, each.row) - p * cell * 0.7;
    c.lineWidth = Math.max(3, cell * 0.1); c.strokeStyle = POP_EDGE; c.strokeText(each.text, x, y);
    c.fillStyle = each.color; c.fillText(each.text, x, y);
  }
  c.globalAlpha = 1;

  if (!showHud) return;
  // The HUD, in the corners. The river badge top-left is a real button (HTML); here the clock (with its star meter), the mangoes, and a finale's name.
  const tenths = run ? Math.round((run.done ? run.time : t) * 10) : 0, got = run ? run.got : 0;
  refreshHud(scene, tenths, got, run ? run.chain : 0, run ? run.row : 0);
  const hud = scene.hud, pill = cell * 0.62, top = cell * 0.15, par = river.par;
  c.font = scene.fonts.hud; c.textAlign = "left";
  const timeX = (width - hud.timeW) / 2, mangoX0 = width - cell * 0.15 - hud.mangoW;
  c.fillStyle = PILL;
  c.beginPath(); c.roundRect(timeX, top, hud.timeW, pill, pill / 2); c.roundRect(mangoX0, top, hud.mangoW, pill, pill / 2); c.fill();
  const inTime = t <= par;
  c.fillStyle = inTime ? GOLD : CREAM;
  c.textAlign = "center"; c.fillText(hud.text, width / 2, top + pill * 0.68);
  c.textAlign = "left"; c.fillStyle = CREAM;
  c.fillText(hud.mangoText, mangoX0 + cell * 0.72, top + pill * 0.68);
  place(c, sprites.mango.canvas, sprites.mango.w, sprites.mango.h, sprites.mango.pad, mangoX0 + cell * 0.06, top + cell * 0.01, cell);
  // The time star's meter: it empties as the clock runs towards the river's time, then greys out.
  const meter = hud.timeW - cell * 0.5, fill = inTime ? 1 - t / par : 0;
  c.fillStyle = PILL; c.fillRect(timeX + cell * 0.25, top + pill + cell * 0.07, meter, cell * 0.09);
  c.fillStyle = inTime ? (fill > 0.25 ? GOOD : GOLD) : LATE; c.fillRect(timeX + cell * 0.25, top + pill + cell * 0.07, inTime ? meter * fill : meter, cell * 0.09);
  if (hud.chainText) { c.font = scene.fonts.small; c.textAlign = "right"; c.fillStyle = GOLD; c.fillText(hud.chainText, width - cell * 0.25, top + pill + cell * 0.4); }
  if (scene.finale) {
    const w = cell * 5.2, x = (width - w) / 2, y = top + pill + cell * 0.3;
    c.fillStyle = FINALE_PILL; c.beginPath(); c.roundRect(x, y, w, cell * 0.78, cell * 0.2); c.fill();
    c.font = scene.fonts.small; c.textAlign = "center"; c.fillStyle = CREAM; c.fillText(scene.finale, width / 2, y + cell * 0.3);
    c.fillStyle = PILL; c.fillRect(x + cell * 0.2, y + cell * 0.5, w - cell * 0.4, cell * 0.12);
    c.fillStyle = NOTCH; c.fillRect(x + cell * 0.2, y + cell * 0.5, (w - cell * 0.4) * (run ? run.row / n : 0), cell * 0.12);
  }
  c.textAlign = "left";
}

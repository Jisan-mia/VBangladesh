// One frame of the ride, from sprites painted once (layers.ts). Runs every frame on cheap phones: no allocation here, no
// template strings, no array or object literals; every string the HUD shows is cached. In ধীরে খেলো (`calm`) nothing shakes,
// flashes or flies: the same facts are shown as steady borders, still letters and a plain number.
import { BIKE_LEN, BIKE_W, DOG, DOG_V, KIND_COUNT, LANE_W, LANES, LETTER, ROAD_L, SPEC, VAN, W, WALK_COW, WALK_GOAT, laneX } from "./geometry";
import { AHEAD, DELIVERED, EV, MISSED, RUNNING, WAITING, type Game } from "./game";
import { BIKE_SCALE, FLIES, FLUTTER, FONT_BIG, FONT_PILL, FONT_PLACE, FONT_POP, FONT_SMALL, FRACTIONS, NUMBERS, POPS, POPTEXT, RING_LIFE, SEG, TILE_H, type Scene } from "./layers";

const POP_LIFE = 0.8, FLY_LIFE = 0.34, PICK_LIFE = 0.2, FLUTTER_LIFE = 1.3, WOBBLE_LIFE = 0.7;
const POP_COLOR = ["#1d5f50", "#b4532a", "#b4532a"] as const;
const PAPER = "#fffaf0", INK = "#2b2118", GOOD = "#3fae7a", BAD = "#e63946", AMBER = "#ffb02e";

function pop(scene: Scene, kind: number, x: number, worldY: number) {
  const slot = scene.popNext++ % POPS;
  scene.popT[slot] = scene.clock; scene.popX[slot] = x; scene.popY[slot] = worldY; scene.popKind[slot] = kind;
}

function fly(scene: Scene, kind: number, x: number, worldY: number, toX: number, toY: number) {
  const slot = scene.flyNext++ % FLIES;
  scene.flyT[slot] = scene.clock; scene.flyX[slot] = x; scene.flyY[slot] = worldY; scene.flyTX[slot] = toX; scene.flyTY[slot] = toY; scene.flyKind[slot] = kind;
}

/** A fresh ride: forget the last one's pops, rings and flying letters. */
export function resetScene(scene: Scene) {
  scene.popT.fill(-9); scene.flyT.fill(-9); scene.fluT = -9; scene.bellAt = -9; scene.bumpAt = -9; scene.finishAt = -9; scene.gustAt = -9; scene.gustWarnAt = -9;
  scene.dangerTop = 0; scene.dangerBottom = 0; scene.flashRed = 0; scene.shake = 0; scene.coast = 0; scene.deliverAt.fill(-9); scene.notchAt.fill(-9);
}

/** Turns one game event into pops, flying letters, flashes. The sounds are the component's job. */
export function sceneEvent(scene: Scene, kind: number, x: number, y: number, n: number, calm: boolean) {
  const course = scene.course;
  if (kind === EV.deliver && course) {
    const house = course.houses[x];
    const dir = house.side ? -1 : 1, handX = scene.gateX[house.side] + dir * 27.6, handY = house.y + 10;
    scene.deliverAt[x] = calm ? scene.clock - 1 : scene.clock;
    if (!calm) fly(scene, 0, scene.bikeX, scene.bikeD - 10, handX, handY);
    pop(scene, 0, handX, handY + 20);
  } else if (kind === EV.pick) {
    if (!calm) fly(scene, 1, x, y, scene.bikeX - 14, scene.bikeD - 24);
  } else if (kind === EV.bell) {
    scene.bellAt = scene.clock;
    pop(scene, 2, Math.min(W - 40, scene.bikeX + 30), scene.bikeD + 30);
  } else if (kind === EV.bump || kind === EV.wreck) {
    if (kind === EV.bump || scene.bumpAt < scene.clock - 0.05) {
      scene.bumpAt = scene.clock; scene.flashRed = 1;
      if (!calm) {
        scene.shake = 5;
        if (n & 1) {
          scene.fluT = scene.clock;
          for (let i = 0; i < FLUTTER; i++) {
            scene.fluX[i] = scene.bikeX - 14 + i * 3; scene.fluY[i] = scene.bikeD - 36;
            scene.fluVX[i] = (i - 2.5) * 34; scene.fluVY[i] = -90 - ((i * 53) % 50); scene.fluR[i] = i * 0.7;
          }
        }
      }
    }
  } else if (kind === EV.finish) {
    scene.finishAt = scene.clock;
  } else if (kind === EV.gustWarn) {
    scene.gustWarnAt = scene.clock; scene.gustDir = x;
  } else if (kind === EV.gust) {
    scene.gustAt = scene.clock; scene.gustDir = x;
    if (!calm) scene.shake = Math.max(scene.shake, 2.5);
  } else if (kind === EV.notch) {
    scene.notchAt[x & 15] = scene.clock;
  }
}

/** Scene time: the title's slow roll, the bike's coast after the place, danger glows, flying letters. */
export function tickScene(scene: Scene, game: Game | null, dt: number, calm: boolean, rolling: boolean) {
  scene.clock += dt;
  if (rolling && !game) scene.roll += 70 * dt;
  scene.flashRed = Math.max(0, scene.flashRed - dt * 2.2);
  scene.shake = Math.max(0, scene.shake - dt * 22);
  if (!game) { scene.dangerTop = 0; scene.dangerBottom = 0; scene.bikeX = laneX(1); scene.bikeD = scene.roll; return; }
  scene.bikeX = game.x; scene.bikeD = game.d + scene.coast; scene.bikeV = game.v;
  if (game.finished) {
    // The bike rolls on under the place's banner and eases to a stop.
    const left = 1 - Math.min(1, (scene.clock - scene.finishAt) / 0.9);
    scene.coast += (calm ? 0 : game.v * 0.55 * left * left) * dt;
  }
  if (!calm && scene.fluT > 0 && scene.clock - scene.fluT < FLUTTER_LIFE) {
    for (let i = 0; i < FLUTTER; i++) {
      scene.fluX[i] += (scene.fluVX[i] + Math.sin(scene.clock * 5 + i * 1.7) * 30) * dt;
      scene.fluY[i] += scene.fluVY[i] * dt;
      scene.fluVY[i] += 160 * dt;
      scene.fluR[i] += ((i % 3) - 1) * 2.6 * dt;
    }
  }
  if (game.over) { scene.dangerTop += (0 - scene.dangerTop) * Math.min(1, dt * 10); scene.dangerBottom += (0 - scene.dangerBottom) * Math.min(1, dt * 10); return; }

  // Something in your lane within 0.6 s lights the top edge; a dog close behind lights the bottom.
  const front = game.d, back = game.d - BIKE_LEN, pieces = game.pieces;
  let soonest = 9;
  for (let index = game.first; index < pieces.length; index++) {
    const piece = pieces[index];
    if (piece.y0 > front + 800) break;
    if (piece.state !== AHEAD || piece.kind === LETTER) continue;
    if (Math.abs(piece.x - game.x) >= (BIKE_W + piece.w) / 2 + 4) continue;
    const closing = piece.kind === VAN && piece.moving ? game.v + piece.vy : game.v, gap = piece.y - front;
    if (gap > 0) { const t = gap / closing; if (t < soonest) soonest = t; }
    else if (piece.y + piece.len > back) soonest = 0;
  }
  const target = soonest < 0.6 ? 1 - soonest / 0.6 : 0;
  let behind = 0;
  for (let index = 0; index < game.dogState.length; index++) {
    if (game.dogState[index] !== RUNNING) continue;
    if (Math.abs(game.dogX[index] - game.x) >= 18) continue;
    const gap = back - (game.dogY[index] + SPEC[DOG].len), t = gap / DOG_V;
    const level = t < 1 ? 1 - Math.max(0, t) : 0;
    if (level > behind) behind = level;
  }
  scene.dangerTop += (target - scene.dangerTop) * Math.min(1, dt * 14);
  scene.dangerBottom += (behind - scene.dangerBottom) * Math.min(1, dt * 14);
}

function stamp(c: CanvasRenderingContext2D, canvas: HTMLCanvasElement, w: number, h: number, ox: number, oy: number, x: number, y: number) {
  c.drawImage(canvas, x - ox, y - oy, w, h);
}

function outlined(c: CanvasRenderingContext2D, text: string, x: number, y: number, fill: string, width: number) {
  c.lineWidth = width; c.strokeStyle = PAPER; c.lineJoin = "round";
  c.strokeText(text, x, y); c.fillStyle = fill; c.fillText(text, x, y);
}

function pill(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, alpha: number) {
  c.globalAlpha = alpha; c.fillStyle = PAPER; c.beginPath(); c.roundRect(x, y, w, h, h / 2); c.fill(); c.globalAlpha = 1;
}

function arrow(c: CanvasRenderingContext2D, x: number, y: number, dir: number, size: number) {
  c.fillStyle = BAD; c.strokeStyle = PAPER; c.lineWidth = 2.4; c.lineJoin = "round";
  c.beginPath(); c.moveTo(x + dir * size, y); c.lineTo(x - dir * size * 0.5, y - size * 0.8); c.lineTo(x - dir * size * 0.5, y + size * 0.8); c.closePath(); c.stroke(); c.fill();
}

function pointer(c: CanvasRenderingContext2D, x: number, y: number, down: number, size: number, color: string) {
  c.fillStyle = color; c.strokeStyle = PAPER; c.lineWidth = 2.4; c.lineJoin = "round";
  c.beginPath(); c.moveTo(x, y + down * size); c.lineTo(x - size * 0.9, y - down * size * 0.7); c.lineTo(x + size * 0.9, y - down * size * 0.7); c.closePath(); c.stroke(); c.fill();
}

function chevrons(c: CanvasRenderingContext2D, x: number, top: number, bottom: number, dir: number) {
  c.strokeStyle = AMBER; c.lineWidth = 4; c.lineCap = "round"; c.lineJoin = "round";
  for (let y = top; y < bottom; y += 56) { c.beginPath(); c.moveTo(x - dir * 7, y - 12); c.lineTo(x + dir * 7, y); c.lineTo(x - dir * 7, y + 12); c.stroke(); }
}

/**
 * One frame. `game` is null on the title (an empty road rolling by). `calm` is ধীরে খেলো. `live` is false while paused,
 * so a still frame stays still.
 */
export function drawScene(scene: Scene, game: Game | null, calm: boolean, live: boolean) {
  const c = scene.context, k = scene.k * scene.ratio, xOff = scene.xOff, bikeY = scene.bikeY, viewW = scene.viewW, viewH = scene.viewH, clock = scene.clock;
  const jitter = !calm && scene.shake > 0.05 ? scene.shake : 0;
  c.setTransform(k, 0, 0, k, jitter * Math.sin(clock * 83) * k, jitter * Math.cos(clock * 71) * k);
  c.globalAlpha = 1;
  const course = scene.course, d = scene.bikeD;
  const roadX = ROAD_L + xOff;

  // ---- the road: a repeating tile, mud stretches, the place's line ----
  for (let top = (((d % TILE_H) + TILE_H) % TILE_H) - TILE_H; top < viewH; top += TILE_H) c.drawImage(scene.road.canvas, 0, top, viewW, TILE_H);
  if (course) {
    const zones = course.mud;
    for (let index = 0; index < zones.length; index++) {
      const zone = zones[index], bottom = bikeY - (zone.y0 - d), top = bikeY - (zone.y1 - d);
      if (bottom < -10 || top > viewH + 10) continue;
      c.drawImage(scene.mud.canvas, roadX, top, LANES * LANE_W, bottom - top);
    }
    const endY = bikeY - (course.end - d);
    if (endY > -80 && endY < viewH + 30) { c.fillStyle = PAPER; c.fillRect(roadX - 4, endY - 3, LANES * LANE_W + 8, 6); }
  }

  // ---- the roadside, far to near, leaving room for a gate ----
  if (course) {
    const low = Math.floor((d - (viewH - bikeY) - 80) / SEG), high = Math.floor((d + bikeY + 80) / SEG), houses = course.houses;
    for (let index = Math.min(high, scene.propCount - 1); index >= Math.max(0, low); index--) {
      for (let side = 0; side < 2; side++) {
        const slot = index * 2 + side, kind = scene.propKind[slot];
        if (kind < 0) continue;
        const wy = index * SEG + scene.propDy[slot];
        let blocked = false;
        for (let h = 0; h < houses.length; h++) if ((houses[h].side === side) && Math.abs(houses[h].y - wy) < 85) { blocked = true; break; }
        if (blocked) continue;
        const sprite = scene.props[kind], bigShift = sprite.w > 60 ? 8 : 0, verge = side ? viewW - (viewW - roadX - LANES * LANE_W) / 2 : roadX / 2;
        stamp(c, sprite.canvas, sprite.w, sprite.h, sprite.ox, sprite.oy, verge + (side ? bigShift : -bigShift) + scene.propDx[slot], bikeY - (wy - d));
      }
    }

    // ---- gates: the hand waits, the letter lands in it, or the hand drops ----
    for (let index = 0; index < houses.length; index++) {
      const house = houses[index], y = bikeY - (house.y - d);
      if (y < -60 || y > viewH + 60) continue;
      let state = 0;
      if (game) {
        const s = game.houseState[index];
        if (s === DELIVERED) state = clock - scene.deliverAt[index] >= FLY_LIFE ? 2 : (live && !calm ? ((clock * 3) & 1) : 0);
        else if (s === MISSED) state = 3;
        else state = live && !calm ? ((clock * 3) & 1) : 0;
      } else state = live && !calm ? ((clock * 3) & 1) : 0;
      const sprite = scene.gates[house.look % 3 * 8 + house.side * 4 + state];
      stamp(c, sprite.canvas, sprite.w, sprite.h, sprite.ox, sprite.oy, scene.gateX[house.side] + xOff, y);
    }
  }

  // ---- the things on the road, far ones first ----
  if (game) {
    const pieces = game.pieces;
    let hi = game.first;
    while (hi < pieces.length && pieces[hi].y0 <= d + bikeY + 120) hi++;
    for (let index = hi - 1; index >= game.first; index--) {
      const piece = pieces[index];
      if (piece.state === 3) continue;
      const y = bikeY - (piece.y - d), kind = piece.kind;
      if (y < -4 || y - piece.len - 20 > viewH + 10) continue;
      const x = piece.x + xOff;
      if (kind === VAN) { const sprite = scene.vans[piece.look % 2]; stamp(c, sprite.canvas, sprite.w, sprite.h, sprite.ox, sprite.oy, x, y); }
      else if (kind === WALK_GOAT || kind === WALK_COW) {
        const sprite = scene.walkers[kind === WALK_GOAT ? 0 : 1][piece.to > piece.lane ? 1 : 0];
        stamp(c, sprite.canvas, sprite.w, sprite.h, sprite.ox, sprite.oy, x, y);
        // The arrow over it shows where it is going.
        if (piece.state === AHEAD && y > scene.hudTop + 70) arrow(c, x + (piece.to > piece.lane ? 8 : -8), y - piece.len - 18, piece.to > piece.lane ? 1 : -1, 9);
      } else if (kind < KIND_COUNT) {
        const bob = kind === LETTER && live && !calm ? Math.sin(clock * 4 + index) * 1.5 : 0;
        const sprite = scene.things[kind <= 4 ? kind : 0][piece.look % 3];
        stamp(c, sprite.canvas, sprite.w, sprite.h, sprite.ox, sprite.oy, x, y + bob);
      }
    }
    for (let index = 0; index < game.dogState.length; index++) {
      if (game.dogState[index] !== RUNNING) continue;
      const y = bikeY - (game.dogY[index] - d), sprite = scene.dogs[((clock * 8) & 1)];
      if (y > -60 && y < viewH + 60) stamp(c, sprite.canvas, sprite.w, sprite.h, sprite.ox, sprite.oy, game.dogX[index] + xOff, y);
    }
  }

  // ---- the place's banner ----
  if (course) {
    const y = bikeY - (course.end - d);
    if (y > -20 && y < viewH + 80) {
      c.drawImage(scene.banner.canvas, W / 2 + xOff - scene.banner.ox, y - scene.banner.oy, scene.banner.w, scene.banner.h);
      c.font = FONT_PLACE; c.textAlign = "center"; c.fillStyle = PAPER;
      c.fillText(scene.placeText, W / 2 + xOff, y - 36);
    }
  }

  // ---- the bike: leans into a lane change; after a bump it wobbles (just a tilt when calm) ----
  const bx = (game ? game.x : laneX(1)) + xOff, since = clock - scene.bumpAt;
  let angle = 0, drop = 0;
  if (game && !game.over) angle = (laneX(game.lane) - game.x) / LANE_W * 0.35;
  if (game && game.bumps > 0 && since < WOBBLE_LIFE) angle += calm ? 0.1 : Math.sin(since * 30) * 0.28 * (1 - since / WOBBLE_LIFE);
  if (game && game.wrecked) { angle = calm ? 0.24 : Math.sin(since * 14) * 0.4 * Math.exp(-since * 2.2) + 0.12 * Math.min(1, since * 3); drop = calm ? 4 : Math.min(1, since * 4) * 6; }
  const bike = scene.bike[game && !game.over ? ((d / 22) & 1) : 0];
  c.save(); c.translate(bx, bikeY + 36 + drop); c.rotate(angle);
  c.drawImage(bike.canvas, -bike.ox, -36 - bike.oy, bike.w, bike.h);
  c.restore();

  // ---- the bell: two rings by the handlebar, still when calm; the rings just fade ----
  const rang = clock - scene.bellAt;
  if (rang < RING_LIFE && rang >= 0) {
    const p = rang / RING_LIFE, rx = bx + 9 * BIKE_SCALE, ry = bikeY + 13.6 * BIKE_SCALE;
    c.globalAlpha = 1 - p; c.strokeStyle = "#b4532a"; c.lineWidth = 2; c.lineCap = "round";
    for (let ring = 0; ring < 2; ring++) { c.beginPath(); c.arc(rx, ry, calm ? 9 + ring * 7 : 7 + ring * 7 + p * 10, -1.1, 0.5); c.stroke(); }
    c.globalAlpha = 1;
  }

  // ---- letters in the air: out of the bag to a raised hand, off the road into the bag, fluttering off after a bump ----
  for (let slot = 0; slot < FLIES; slot++) {
    const age = clock - scene.flyT[slot], life = scene.flyKind[slot] === 0 ? FLY_LIFE : PICK_LIFE;
    if (age < 0 || age > life) continue;
    const p = age / life, e = p * p * (3 - 2 * p);
    const wx = scene.flyX[slot] + (scene.flyTX[slot] - scene.flyX[slot]) * e, wy = scene.flyY[slot] + (scene.flyTY[slot] - scene.flyY[slot]) * e;
    const lift = scene.flyKind[slot] === 0 ? Math.sin(p * Math.PI) * 26 : 0;
    c.save(); c.translate(wx + xOff, bikeY - (wy - d) - lift); c.rotate(p * 5); c.scale(0.85, 0.85);
    stamp(c, scene.letter.canvas, scene.letter.w, scene.letter.h, scene.letter.ox, scene.letter.oy - 10, 0, 0);
    c.restore();
  }
  if (!calm && clock - scene.fluT < FLUTTER_LIFE && scene.fluT > 0) {
    const fade = Math.max(0, Math.min(1, (FLUTTER_LIFE - (clock - scene.fluT)) / 0.5));
    c.globalAlpha = fade;
    for (let i = 0; i < FLUTTER; i++) {
      c.save(); c.translate(scene.fluX[i] + xOff, bikeY - (scene.fluY[i] - d)); c.rotate(scene.fluR[i]);
      stamp(c, scene.letter.canvas, scene.letter.w, scene.letter.h, scene.letter.ox, scene.letter.oy - 10, 0, 0);
      c.restore();
    }
    c.globalAlpha = 1;
  }

  // ---- small pops: +১০, +৫, ক্রিং +৫ (rising; only fading when calm) ----
  c.textAlign = "center"; c.font = FONT_POP;
  for (let slot = 0; slot < POPS; slot++) {
    const age = clock - scene.popT[slot];
    if (age < 0 || age > POP_LIFE) continue;
    c.globalAlpha = Math.min(1, (POP_LIFE - age) / 0.3);
    outlined(c, POPTEXT[scene.popKind[slot]], scene.popX[slot] + xOff, bikeY - (scene.popY[slot] - d) - (calm ? 0 : age * 28), POP_COLOR[scene.popKind[slot]], 4);
  }
  c.globalAlpha = 1;

  // ---- weather and light: dusk's rain, the dark beyond what you can see, the sky's tint ----
  if (scene.rain) {
    const drift = calm ? 0 : (clock * 520) % 260;
    c.globalAlpha = 0.55;
    for (let top = drift - 260; top < viewH; top += 260) c.drawImage(scene.rain.canvas, 0, top, viewW, 260);
    c.globalAlpha = 1;
  }
  c.drawImage(scene.sky.canvas, 0, 0, viewW, viewH * 0.4);
  if (scene.dark && game) {
    c.drawImage(scene.dark.canvas, 0, 0, viewW, viewH);
    // A lantern at each gate stays lit in the dark.
    const houses = course!.houses;
    for (let index = 0; index < houses.length; index++) {
      const y = bikeY - (houses[index].y - d) - 14;
      if (y < -30 || y > bikeY || game.houseState[index] !== WAITING) continue;
      const lamp = scene.lantern, side = houses[index].side;
      stamp(c, lamp.canvas, lamp.w, lamp.h, lamp.ox, lamp.oy, scene.gateX[side] + xOff + (side ? -24 : 24), y);
    }
  }

  // ---- signals at the edges ----
  if (game && !game.over) {
    const houses = course!.houses;
    // A gate coming up beyond the top: an envelope in the corner on its side.
    for (let index = game.houseNext; index < houses.length; index++) {
      if (game.houseState[index] !== WAITING) continue;
      const y = bikeY - (houses[index].y - d);
      if (y < scene.hudTop + 60 && y > -2400) {
        c.globalAlpha = 0.95;
        const side = houses[index].side, ex = side ? viewW - 22 : 22, ey = scene.hudTop + 92;
        c.fillStyle = PAPER; c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.roundRect(ex - 13, ey - 9, 26, 18, 3); c.fill(); c.stroke();
        c.beginPath(); c.moveTo(ex - 13, ey - 9); c.lineTo(ex, ey + 1); c.lineTo(ex + 13, ey - 9); c.stroke();
        c.globalAlpha = 1;
      }
      break;
    }
    const pieces = game.pieces;
    for (let index = game.first; index < pieces.length; index++) {
      const piece = pieces[index];
      if (piece.y0 > d + 2000) break;
      if (piece.kind === VAN && piece.moving && piece.state === AHEAD) {
        const y = bikeY - (piece.y - d);
        if (y < scene.hudTop + 90) pointer(c, piece.x + xOff, scene.hudTop + 96 + 8 * Math.sin(live && !calm ? clock * 10 : 0), -1, 11, BAD);
      }
    }
    for (let index = 0; index < game.dogState.length; index++) {
      if (game.dogState[index] !== RUNNING) continue;
      const y = bikeY - (game.dogY[index] - d);
      if (y > viewH - 24) pointer(c, game.dogX[index] + xOff, viewH - 26, 1, 11, AMBER);
    }
    const warn = clock - scene.gustWarnAt;
    if (warn >= 0 && warn < 1.1 && (calm || ((clock * 6) & 1) === 0 || warn > 0.8)) chevrons(c, scene.gustDir > 0 ? viewW - 16 : 16, scene.hudTop + 130, viewH - 190, scene.gustDir);
  }
  if (scene.dangerTop > 0.02) { c.globalAlpha = Math.min(1, scene.dangerTop); c.drawImage(scene.edgeTop.canvas, 0, 0, viewW, 86); c.globalAlpha = 1; }
  if (scene.dangerBottom > 0.02) { c.globalAlpha = Math.min(1, scene.dangerBottom); c.drawImage(scene.edgeBottom.canvas, 0, viewH - 86, viewW, 86); c.globalAlpha = 1; }
  if (game && game.limit > 1 && game.bumps === game.limit - 1 && !game.over) { c.globalAlpha = 0.9; c.drawImage(scene.rim.canvas, 0, 0, viewW, viewH); c.globalAlpha = 1; }
  if (scene.flashRed > 0.02 || (calm && since < 1.4 && scene.bumpAt > 0)) {
    if (calm) { c.strokeStyle = "rgba(230,57,70,0.85)"; c.lineWidth = 8; c.strokeRect(4, 4, viewW - 8, viewH - 8); }
    else { c.globalAlpha = scene.flashRed; c.drawImage(scene.edgeRed.canvas, 0, viewH - 70, viewW, 70); c.globalAlpha = 1; }
  }

  // ---- the HUD, in the corners ----
  if (game) drawHud(scene, game, calm);
  c.globalAlpha = 1;
}

function drawHud(scene: Scene, game: Game, calm: boolean) {
  const c = scene.context, viewW = scene.viewW, top = scene.hudTop, course = scene.course!;
  // The very top edge: progress to the place.
  const frac = Math.min(1, game.d / course.end);
  c.fillStyle = "rgba(255,250,240,0.45)"; c.fillRect(0, 0, viewW, 4);
  c.fillStyle = GOOD; c.fillRect(0, 0, viewW * frac, 4);

  // Top-centre: the score.
  if (game.score !== scene.shownScore) { scene.shownScore = game.score; scene.scoreText = game.score < NUMBERS.length ? NUMBERS[game.score] : "৯৯৯+"; }
  const sw = 34 + scene.scoreText.length * 17;
  pill(c, viewW / 2 - sw / 2, top + 4, sw, 38, 0.9);
  c.fillStyle = INK; c.font = FONT_BIG; c.textAlign = "center"; c.fillText(scene.scoreText, viewW / 2, top + 33);

  // Top-right: letters delivered, and the bumps left as small wheels.
  const done = Math.min(20, game.delivered), of = Math.min(20, course.houses.length);
  pill(c, viewW - 92, top + 6, 84, 28, 0.88);
  c.drawImage(scene.letter.canvas, viewW - 87, top + 6, scene.letter.w * 0.62, scene.letter.h * 0.62);
  c.fillStyle = INK; c.font = FONT_PILL; c.textAlign = "right"; c.fillText(FRACTIONS[done * 21 + of], viewW - 16, top + 27);
  const lives = Math.min(6, game.limit);
  for (let i = 0; i < lives; i++) {
    const wheel = i < game.limit - game.bumps ? scene.wheel : scene.wheelOff;
    c.drawImage(wheel.canvas, viewW - 18 - (lives - 1 - i) * 17 - 7, top + 40, 14, 14);
  }

  // Bottom-left: the letters left in the ঝোলা.
  const bag = Math.min(8, game.bag);
  for (let i = 0; i < bag; i++) c.drawImage(scene.letter.canvas, 8 + i * 9, scene.viewH - 40, scene.letter.w * 0.5, scene.letter.h * 0.5);
  if (game.bag > 8 || game.bag === 0) { c.fillStyle = PAPER; c.font = FONT_SMALL; c.textAlign = "left"; c.fillText(game.bag < NUMBERS.length ? NUMBERS[game.bag] : "", 14 + bag * 9, scene.viewH - 16); }

  // A finale's named bar, in the second row: a notch for each gate, cow or gust.
  const count = course.bossCount;
  if (count > 0) {
    const bw = 28 + count * 20 + scene.finaleText.length * 8.4;
    pill(c, viewW / 2 - bw / 2, top + 50, bw, 26, 0.88);
    c.fillStyle = "#b4251d"; c.font = FONT_SMALL; c.textAlign = "left"; c.fillText(scene.finaleText, viewW / 2 - bw / 2 + 12, top + 68);
    const startX = viewW / 2 + bw / 2 - 10 - count * 20 + 4;
    for (let i = 0; i < count; i++) {
      const state = game.boss[i], pulse = !calm && scene.clock - scene.notchAt[i & 15] < 0.3 ? 1.35 : 1;
      c.fillStyle = state === 1 ? GOOD : state === 2 ? BAD : "rgba(43,33,24,0.25)";
      c.beginPath(); c.arc(startX + i * 20 + 6, top + 63, 6 * pulse, 0, Math.PI * 2); c.fill();
    }
  }
}


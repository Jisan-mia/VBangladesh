"use client";
// The street: one canvas that draws the cached street and vehicle sprites while anything moves (springs in lib/motion.hot.ts),
// and takes the finger. A vehicle follows the finger along its lane, stopped by whatever is in the way with a little give; let go
// and it lands in the nearest cell with a wobble that suits its weight. The rules of a move belong to the caller (onSlide).
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { fitCanvas } from "../../../shared/game-kit";
import { SIDE, TOP } from "../lib/art";
import { COLS, ROWS, WALL, cellOf, isOut, occupancy, type Kind } from "../lib/board";
import { drawBoard } from "../lib/draw.hot";
import { reachOf, type Game } from "../lib/game";
import { arrive, makeDrag, makeMotion, settle } from "../lib/motion";
import { driveOff, jolt, landing, moveDrag, pressDrag, releaseDrag, stepMotion, TAP_PX } from "../lib/motion.hot";
import { buildView, makeView } from "../lib/scene";

type Props = {
  game: Game; world: number; calm: boolean;
  /** Bumped for every jam that starts being played: the vehicles drive in. */
  arriveKey: number;
  picked: number;
  hint: { car: number; to: number } | null;
  away: boolean;
  /** True only while the jam is in play: a title, story, pause, sheet or result lets go of a held vehicle. */
  playing: boolean;
  /** True while a move may happen (playing). */
  live: () => boolean;
  /** The first press after coming back only wakes the game: true when it did. */
  wake: () => boolean;
  /** A vehicle was let go on `to` (or tapped, for a hero with a clear road). False when the move was refused. */
  onSlide: (car: number, to: number) => boolean;
  /** A tap on a vehicle that doesn't drive off by itself: pick it (for the arrow buttons and keys). */
  onPick: (car: number) => void;
  onLift: (kind: Kind) => void;
  /** A push against something: bricks, a barricade or the kerb (`hard`), or another vehicle. */
  onBump: (hard: boolean) => void;
  /** A press on bricks or a barricade. */
  onWall: () => void;
};

/** Cells the street needs: 6 lanes and the footpaths across, 7 rows and the shop strip down. */
const FIT_W = COLS + 2 * SIDE, FIT_H = ROWS + TOP + 0.3;

export function Street({ game, world, calm, arriveKey, picked, hint, away, playing, live, wake, onSlide, onPick, onLift, onBump, onWall }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const m = useRef(makeMotion()).current, drag = useRef(makeDrag()).current, view = useRef(makeView()).current;
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const frame = useRef(0), last = useRef(0), clock = useRef(0);
  const grid = useRef(occupancy(game.lay, game.pos));
  const [cell, setCell] = useState(0);
  const now = useRef({ game, calm, picked, hint, away });
  now.current = { game, calm, picked, hint, away };
  const props = useRef({ live, wake, onSlide, onPick, onLift, onBump, onWall });
  props.current = { live, wake, onSlide, onPick, onLift, onBump, onWall };

  function paint() {
    const c = context.current;
    if (!c) return;
    const n = now.current;
    drawBoard(c, view, m, drag.id >= 0 ? drag.car : -1, n.picked, n.hint ? n.hint.car : -1, n.hint ? n.hint.to : 0, clock.current);
  }
  function tick(at: number) {
    const dt = Math.max(0, Math.min(0.05, (at - last.current) / 1000));
    last.current = at;
    clock.current += dt;
    const moving = stepMotion(m, dt, now.current.calm, drag.id >= 0 ? drag.car : -1);
    paint();
    frame.current = (moving || (now.current.hint && !now.current.calm)) && !now.current.away ? requestAnimationFrame(tick) : 0;
  }
  function kick() {
    if (frame.current || now.current.away) return;
    last.current = performance.now();
    frame.current = requestAnimationFrame(tick);
  }

  // The size: as big as the stage allows, in quarter-pixel cells so the sprites stay crisp.
  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const measure = () => {
      const next = Math.floor(Math.min(element.clientWidth / FIT_W, element.clientHeight / FIT_H) * 4) / 4;
      if (next >= 12) setCell(current => current === next ? current : next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => { observer.disconnect(); cancelAnimationFrame(frame.current); frame.current = 0; };
  }, []);

  // A new jam, a new street or a new size: rebuild the cached sprites and put the vehicles at rest.
  useLayoutEffect(() => {
    const element = canvas.current;
    if (!element || !cell) return;
    buildView(view, game.lay, world, cell);
    element.style.width = `${view.width}px`;
    element.style.height = `${view.height}px`;
    context.current = fitCanvas(element, view.width, view.height);
    releaseDrag(drag);
    settle(m, game.lay, game.pos);
    for (let i = 0; i < m.n; i++) if (isOut(game.lay, game.pos, i)) m.t[i] = m.x[i] = -12;
    grid.current = occupancy(game.lay, game.pos);
    paint();
  }, [game.lay, world, cell]);

  // খেলো or a fresh jam in play: the vehicles drive in from the edges (at once in slow mode).
  useLayoutEffect(() => {
    if (!arriveKey || !cell) return;
    if (now.current.calm) settle(m, game.lay, game.pos); else arrive(m, game.lay, game.pos);
    kick();
  }, [arriveKey]);

  // The rules moved something (a slide, take-back, hint): every vehicle heads for where it should be.
  useLayoutEffect(() => {
    for (let i = 0; i < m.n; i++) {
      if (drag.id >= 0 && drag.car === i) continue;
      if (isOut(game.lay, game.pos, i)) driveOff(m, i); else m.t[i] = game.pos[i];
    }
    grid.current = occupancy(game.lay, game.pos);
    kick();
  }, [game.pos]);
  useEffect(() => { kick(); }, [picked, hint, calm]);

  /** Lets go of whatever is held (blur, a hidden tab, the player's pause, pointercancel): the vehicle glides back to its cell. */
  function drop() {
    if (drag.id < 0) return;
    const car = drag.car;
    releaseDrag(drag);
    if (car >= 0 && car < m.n) m.t[car] = now.current.game.pos[car];
    kick();
  }
  useEffect(() => {
    const leave = () => drop();
    const hide = () => { if (document.hidden) drop(); };
    window.addEventListener("blur", leave);
    document.addEventListener("visibilitychange", hide);
    return () => { window.removeEventListener("blur", leave); document.removeEventListener("visibilitychange", hide); };
  }, []);
  useEffect(() => { if (!playing) drop(); }, [playing]);
  useEffect(() => {
    if (away) { drop(); cancelAnimationFrame(frame.current); frame.current = 0; paint(); } else kick();
  }, [away]);

  function carAt(event: ReactPointerEvent<HTMLCanvasElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const scale = view.width / (box.width || 1);
    const col = Math.floor(((event.clientX - box.left) * scale) / view.cell - SIDE), row = Math.floor(((event.clientY - box.top) * scale) / view.cell - TOP);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return -1;
    return grid.current[row * COLS + col];
  }

  function onPointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!event.isPrimary || drag.id >= 0) return;
    if (props.current.wake()) { event.preventDefault(); return; }
    const g = now.current.game;
    if (g.won || !props.current.live()) return;
    const car = carAt(event);
    if (car === WALL) { props.current.onWall(); return; }
    if (car < 0) { if (now.current.picked >= 0) props.current.onPick(now.current.picked); return; }
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a pointer that already ended */ }
    const [low, high] = reachOf(g, car);
    pressDrag(drag, event.pointerId, car, g.lay.cars[car].down ? 1 : 0, m.x[car], low, high, event.clientX, event.clientY, event.timeStamp);
    props.current.onLift(g.lay.cars[car].kind);
    kick();
  }

  function onPointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (event.pointerId !== drag.id) return;
    const over = moveDrag(drag, m, event.clientX, event.clientY, event.timeStamp, view.cell * (canvas.current ? canvas.current.getBoundingClientRect().width / view.width : 1));
    if (over < 0.02) drag.bumped = 0;
    else if (over > 0.06 && !drag.bumped) {
      drag.bumped = 1;
      const g = now.current.game, car = g.lay.cars[drag.car], forward = drag.want > drag.high;
      const next = forward ? drag.high + car.len : drag.low - 1;
      const edge = next < 0 || next >= (car.down ? ROWS : COLS);
      const hit = edge ? WALL : grid.current[cellOf(car, next)];
      if (hit >= 0) jolt(m, hit, forward ? 5 : -5);
      props.current.onBump(hit < 0);
    }
    kick();
  }

  function onPointerUp(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (event.pointerId !== drag.id) return;
    const g = now.current.game, car = drag.car, tap = drag.moved < TAP_PX, target = landing(drag), low = drag.low;
    releaseDrag(drag);
    if (!props.current.live()) { m.t[car] = g.pos[car]; kick(); return; }
    if (tap) {
      m.t[car] = g.pos[car];
      // A tap on your CNG with a clear road drives it out; any other vehicle is picked for the arrow buttons.
      if (car < g.lay.heroes && low === 0) props.current.onSlide(car, 0); else props.current.onPick(car);
    } else if (target !== g.pos[car]) {
      if (!props.current.onSlide(car, target)) m.t[car] = g.pos[car];
    } else m.t[car] = g.pos[car];
    kick();
  }

  return (
    <div className="jc-fit" ref={box}>
      <canvas ref={canvas} className="jc-canvas" role="application"
        aria-label="জ্যামে আটকা রাস্তা। গাড়ি আঙুলে টেনে সরাও। কিবোর্ডে এন্টার দিয়ে গাড়ি বাছো, তীর দিয়ে সরাও, H চাপলে একটা চালের হিন্ট।"
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={drop}
        onLostPointerCapture={event => { if (event.pointerId === drag.id) drop(); }} />
    </div>
  );
}

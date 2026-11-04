"use client";
// The table: one canvas with the board on top and the tray under it. It turns fingers into drops and plays the animation;
// what a drop means comes back from the caller (lib/play.ts). Frames run only while something moves, and stop on blur.
// Keyboard: transparent buttons over the tray slots (Tab, Enter), and the board as an application (arrows, Enter).
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { homeX, homeY, layoutFor, makeAnim, slotAt, slotX, slotY, Flash, Mode, type Anim, type Layout } from "../lib/anim";
import { bakeScene, paintBoard } from "../lib/art";
import { cellAt, isUpright, type Table as TableState } from "../lib/game";
import { bn } from "../lib/link";
import type { Dropped } from "../lib/play";
import { drawTable, flash, hold, puff, rest, snapHome, stepAnim, SWEEP_MS, type Scene } from "../lib/table.hot";

/** What the caller can ask of the table from outside (blur, keys, buttons). */
export type TableApi = {
  /** Drop whatever is in the hand back to the tray: blur, a hidden tab, the player's pause. */
  cancel: () => void;
  /** The piece picked by a tap goes to `cell` (the keyboard, a board tap). */
  placeAt: (cell: number) => void;
  held: () => number;
  /** The table's geometry now (play-tests read it to aim). */
  layout: () => Layout | null;
  /** The animation state (play-tests read it). */
  anim: () => Anim;
  frame: () => number;
};

const ARROWS: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
const QUARTER = Math.PI / 2;

type Press = { id: number; pointer: number; x: number; y: number; mouse: boolean; moved: boolean; cell: number };

export function Table({ level, table, rotate, ghost, world, selected, calm, round, fly, sweep, api, live, wake, onDrop, onTap, onTurn, onLift, onSlots }: {
  level: number; table: TableState; rotate: boolean; ghost: number; world: number; selected: number; calm: boolean;
  /** Bumped for every fresh table; with `fly`, the picture breaks and its pieces fly into the tray (খেলো, পরের লেভেল, আবার খেলো). */
  round: number; fly: boolean;
  /** Bumped to sweep light over the finished picture. */
  sweep: number;
  api: { current: TableApi | null };
  /** Whether a pick or drop counts now; wake() turns the first press after coming back into a resume (true when it did). */
  live: () => boolean; wake: () => boolean;
  onDrop: (id: number, x: number, y: number, size: number) => Dropped | null;
  /** A tap on a tray piece (pick, turn, or put down). */
  onTap: (id: number) => void;
  /** A second finger while carrying a piece: turn it. */
  onTurn: (id: number) => void;
  onLift: () => void;
  onSlots: (slots: number) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const n = Math.round(Math.sqrt(table.placed.length));
  const layout: Layout | null = size.w ? layoutFor(size.w, size.h, n) : null;
  const geo = useRef<Layout | null>(null);
  geo.current = layout;
  const anim = useRef(makeAnim(n * n));
  const scene = useRef<{ key: string; scene: Scene; painting: HTMLCanvasElement; ratio: number; puzzle: ReturnType<typeof bakeScene>["puzzle"] } | null>(null);
  const inBoard = useRef<boolean[]>([]);
  const press = useRef<Press | null>(null);
  const frame = useRef(0);
  const last = useRef(0);
  const latest = useRef({ table, selected, onDrop, onTap, onTurn, onLift, live, wake, ghost, world, level, calm });
  latest.current = { table, selected, onDrop, onTap, onTurn, onLift, live, wake, ghost, world, level, calm };
  const [cursor, setCursor] = useState(-1);

  // ---- the frame loop: only while something moves ----
  function tick(now: number) {
    frame.current = 0;
    const a = anim.current, l = geo.current, s = scene.current, c = canvas.current?.getContext("2d");
    if (!l || !s || !c) return;
    const dt = Math.min(50, now - (last.current || now));
    // rAF's stamp can be earlier than the kick that asked for it: that frame moves nothing, the next ones do.
    last.current = now;
    const moving = stepAnim(a, dt);
    if (a.landedCount) {
      for (let k = 0; k < a.landedCount; k++) {
        const id = a.landed[k];
        inBoard.current[id] = true;
        puff(a, homeX(l, id), homeY(l, id), l.cell * 0.5);
        flash(a, id, Flash.Good);
      }
      rebake();
    }
    drawTable(c, a, s.scene, l, s.ratio);
    if (moving || a.landedCount) frame.current = requestAnimationFrame(tick);
  }
  /** One more frame, and more while anything moves. Frames are cosmetic and stop by themselves within a second of stillness. */
  function kick() {
    if (frame.current) return;
    last.current = performance.now();
    frame.current = requestAnimationFrame(tick);
  }
  function rebake() {
    const l = geo.current, s = scene.current;
    if (!l || !s) return;
    paintBoard(s.scene.board, s.puzzle, s.painting, l, s.ratio, inBoard.current, latest.current.ghost, latest.current.world);
  }

  // ---- size: the box fills what the HUD and the bar leave ----
  useLayoutEffect(() => {
    const element = box.current;
    if (!element) return;
    const measure = () => { const r = element.getBoundingClientRect(); setSize(old => (Math.abs(old.w - r.width) < 1 && Math.abs(old.h - r.height) < 1 ? old : { w: r.width, h: r.height })); };
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(element);
    return () => watch.disconnect();
  }, []);
  useEffect(() => { if (layout) onSlots(layout.slots); }, [layout?.slots]);

  // ---- bake the scene per level and size; then put every piece where the table says ----
  const ratio = typeof window === "undefined" ? 1 : Math.min(2, window.devicePixelRatio || 1);
  const key = layout ? `${round}:${level}:${layout.board}:${layout.width}:${layout.height}:${ratio}:${ghost}` : "";
  const flown = useRef(-1);
  useLayoutEffect(() => {
    const l = layout, element = canvas.current;
    if (!l || !element) return;
    element.width = Math.round(l.width * ratio); element.height = Math.round(l.height * ratio);
    element.style.width = `${l.width}px`; element.style.height = `${l.height}px`;
    if (anim.current.count !== n * n) anim.current = makeAnim(n * n);
    const a = anim.current;
    a.calm = calm;
    inBoard.current = table.placed.map((placed, id) => placed && a.mode[id] !== Mode.Snap);
    const baked = bakeScene(level, l, ratio, inBoard.current, ghost, world);
    scene.current = { key, ...baked, ratio };
    // A new level: everything jumps to its place at once (the scatter, if any, starts from here).
    for (let id = 0; id < n * n; id++) {
      a.x[id] = slotX(l, Math.max(0, table.slots.indexOf(id))); a.y[id] = slotY(l, Math.max(0, table.slots.indexOf(id)));
      a.s[id] = l.trayScale; a.sv[id] = 0; a.r[id] = a.tr[id] = table.turns[id] * QUARTER; a.wait[id] = 0; a.shake[id] = 0;
      a.mode[id] = table.placed[id] ? Mode.In : table.slots.includes(id) ? Mode.Tray : Mode.Waiting;
    }
    a.held = -1;
    sync(true);
    // খেলো: the picture breaks, its pieces fly from their places into the tray (once per round, never on a resize).
    if (fly && flown.current !== round && !calm) {
      let order = 0;
      for (let id = 0; id < a.count; id++) {
        if (a.mode[id] !== Mode.Tray) continue;
        a.x[id] = homeX(l, id); a.y[id] = homeY(l, id); a.s[id] = 1; a.r[id] = 0;
        a.wait[id] = 60 + order++ * Math.min(40, 360 / Math.max(1, a.count));
      }
    }
    if (fly) flown.current = round;
    kick();
  }, [key]);

  /** Every piece goes where the table says now: in the board, in its slot (lifted when picked), or waiting behind the tray. */
  function sync(jump = false) {
    const l = geo.current, a = anim.current, { table: t, selected: picked } = latest.current;
    if (!l || a.count !== t.placed.length) return;
    let changed = false;
    for (let id = 0; id < a.count; id++) {
      a.tr[id] = t.turns[id] * QUARTER;
      if (a.mode[id] === Mode.Held || a.mode[id] === Mode.Snap) continue;
      if (t.placed[id]) {
        if (a.mode[id] !== Mode.In) { a.mode[id] = Mode.In; inBoard.current[id] = true; changed = true; }
        continue;
      }
      const slot = t.slots.indexOf(id);
      if (slot < 0) { a.mode[id] = Mode.Waiting; continue; }
      const up = id === picked;
      if (a.mode[id] === Mode.Waiting) {
        // A waiting piece pops into a freed slot.
        a.x[id] = slotX(l, slot); a.y[id] = slotY(l, slot); a.s[id] = jump ? l.trayScale : 0; a.r[id] = a.tr[id];
      }
      rest(a, id, slotX(l, slot), slotY(l, slot) - (up ? 5 : 0), l.trayScale * (up ? 1.12 : 1), 0);
    }
    a.selected = picked >= 0 ? t.slots.indexOf(picked) : -1;
    if (changed) rebake();
    kick();
  }
  useEffect(() => { sync(); }, [table, selected]);
  useEffect(() => { anim.current.calm = calm; }, [calm]);

  useEffect(() => { if (sweep && !calm) { anim.current.sweep = SWEEP_MS; kick(); } }, [sweep]);

  // Away: a piece in the hand glides back (the caller's pause also calls cancel). Frames stop on unmount.
  useEffect(() => {
    const blur = () => cancel();
    window.addEventListener("blur", blur);
    return () => { window.removeEventListener("blur", blur); cancelAnimationFrame(frame.current); frame.current = 0; };
  }, []);

  // ---- input ----
  const point = (event: { clientX: number; clientY: number }) => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: event.clientX - r.left, y: event.clientY - r.top };
  };

  function cancel() {
    const held = press.current;
    press.current = null;
    const a = anim.current;
    if (held && a.mode[held.id] === Mode.Held) { a.held = -1; a.mode[held.id] = Mode.Tray; sync(); }
  }

  /** A piece lets go at table point (x, y): the caller judges it, and the table plays what it said. */
  function release(id: number, x: number, y: number) {
    const l = geo.current, a = anim.current;
    if (!l) return;
    const result = latest.current.onDrop(id, x - l.ox, y - l.oy, l.board);
    if (result && result.landed === "snap") {
      snapHome(a, id, homeX(l, id), homeY(l, id), a.tr[id]);
      if (result.frame) for (let cell = 0; cell < a.count; cell++) if (cell < l.n || cell >= a.count - l.n || cell % l.n === 0 || cell % l.n === l.n - 1) flash(a, cell, Flash.Good);
    } else {
      a.held = -1; a.mode[id] = Mode.Tray;
      if (result && result.cell >= 0 && result.landed !== "away") {
        flash(a, result.cell, result.landed === "turn" ? Flash.Turn : result.landed === "fits" ? Flash.Fits : Flash.Wrong);
        a.shake[id] = latest.current.calm ? 0 : 220;
      }
      sync();
    }
    kick();
  }

  function onDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    const l = geo.current;
    if (!l) return;
    // The click that brings focus back only resumes.
    if (latest.current.wake()) return;
    if (!latest.current.live()) return;
    // A second finger while carrying a piece turns it.
    if (press.current && press.current.pointer !== event.pointerId) {
      if (press.current.moved && rotate) latest.current.onTurn(press.current.id);
      return;
    }
    const { x, y } = point(event), slot = slotAt(l, x, y), t = latest.current.table;
    const id = slot >= 0 ? t.slots[slot] ?? -1 : -1;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a pointer the browser no longer tracks */ }
    if (id >= 0) press.current = { id, pointer: event.pointerId, x, y, mouse: event.pointerType === "mouse", moved: false, cell: -1 };
    else {
      const cell = cellAt(l.n, x - l.ox, y - l.oy, l.board);
      press.current = cell >= 0 ? { id: -1, pointer: event.pointerId, x, y, mouse: event.pointerType === "mouse", moved: false, cell } : null;
    }
  }

  function onMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    const p = press.current, l = geo.current, a = anim.current;
    if (!p || p.pointer !== event.pointerId || !l) return;
    // A mouse moving with no button held has lost its pointerup (another window took it): let go, nothing dropped.
    if (p.mouse && event.buttons === 0) { cancel(); return; }
    const { x, y } = point(event);
    if (p.id < 0) return;
    const lift = p.mouse ? 0 : l.lift;
    if (!p.moved) {
      if (Math.hypot(x - p.x, y - p.y) < (p.mouse ? 4 : 8)) return;
      if (!latest.current.live()) { press.current = null; return; }
      p.moved = true;
      hold(a, p.id, x, y - lift);
      latest.current.onLift();
    }
    a.tx[p.id] = x; a.ty[p.id] = y - lift;
    kick();
  }

  function onUp(event: ReactPointerEvent<HTMLCanvasElement>) {
    const p = press.current, l = geo.current, a = anim.current;
    if (!p || p.pointer !== event.pointerId || !l) return;
    press.current = null;
    if (p.id >= 0 && p.moved) { release(p.id, a.tx[p.id], a.ty[p.id]); return; }
    if (!latest.current.live()) return;
    if (p.id >= 0) { latest.current.onTap(p.id); return; }
    const { x, y } = point(event);
    if (Math.hypot(x - p.x, y - p.y) < 14) placeAt(p.cell);
  }

  /** The tapped piece flies to a cell's centre and is judged there. */
  function placeAt(cell: number) {
    const l = geo.current, picked = latest.current.selected;
    if (!l || cell < 0 || !latest.current.live()) return;
    // Nothing picked: the caller says so (onDrop with no piece answers with a hint, not a drop).
    if (picked < 0) { latest.current.onDrop(-1, -1, -1, l.board); return; }
    release(picked, homeX(l, cell), homeY(l, cell));
  }

  api.current = { cancel, placeAt, held: () => (press.current?.moved ? press.current.id : -1), layout: () => geo.current, anim: () => anim.current, frame: () => frame.current };

  function onBoardKey(event: ReactKeyboardEvent<HTMLDivElement>) {
    const step = ARROWS[event.key], at = cursor >= 0 ? cursor : Math.floor((n * n) / 2);
    if (step) {
      event.preventDefault();
      const col = Math.min(n - 1, Math.max(0, (at % n) + step[0])), row = Math.min(n - 1, Math.max(0, Math.floor(at / n) + step[1]));
      setCursor(row * n + col);
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault(); event.stopPropagation();
      setCursor(at);
      placeAt(at);
    }
  }
  useEffect(() => { anim.current.cursor = cursor; kick(); }, [cursor]);

  const l = layout;
  return (
    <div className="ct-table" ref={box}>
      <canvas ref={canvas} className="ct-canvas" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={cancel} onLostPointerCapture={event => { if (press.current?.pointer === event.pointerId && press.current.moved) cancel(); }} aria-hidden="true" />
      {l && (
        <>
          <div className="ct-board-keys" role="application" tabIndex={0} style={{ left: l.ox, top: l.oy, width: l.board, height: l.board }}
            aria-label={`ছবির বোর্ড, ${bn(n)}×${bn(n)} ঘর। তীরচিহ্নে ঘর বাছো, এন্টার চাপলে বাছাই করা টুকরো সেখানে বসবে।`}
            onKeyDown={onBoardKey} onBlur={() => setCursor(-1)} />
          {table.slots.map((id, slot) => id < 0 ? null : (
            <button key={`${level}-${id}`} type="button" className="ct-slot-key" aria-pressed={selected === id}
              style={{ left: l.ox + (slot % l.cols) * l.slot, top: l.trayTop + Math.floor(slot / l.cols) * l.slot, width: l.slot, height: l.slot }}
              aria-label={`টুকরো ${bn(slot + 1)}${rotate && !isUpright(table.turns[id]) ? ", ঘোরানো" : ""}`}
              onClick={event => { if (event.detail === 0 && latest.current.live()) latest.current.onTap(id); }} />
          ))}
        </>
      )}
    </div>
  );
}

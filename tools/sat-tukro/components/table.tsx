'use client';
// The table: one canvas with the shadow on top and the tray under it. It turns fingers into picks, drops and turns and plays
// the animation; what a drop means comes back from the caller (lib/game.ts). Frames run only while something moves, and
// stop on blur. Keys are the game's (window), so this file has none.
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Ghost, Mode, PIECES, SPOT_STRIDE, layoutFor, makeAnim, modelY, pxX, pxY, unX, unY, type Anim, type Px } from '../lib/anim';
import { bakeScene, type Scene } from '../lib/art';
import { hintFor, spotPieces, toModel, toView, type Outcome, type Round } from '../lib/game';
import { GHOST_WAIT, SNAP_MS, celebrate, drawTable, flash, hold, loose, puff, rest, snapTo, stepAnim } from '../lib/table.hot';
import { localCorners, corners, SET, type Kind, type Point } from '../lib/tangram';

/** What the caller can ask of the table from outside (blur, pause, play-tests). */
export type TableApi = {
  /** Put a piece in the hand back where it came from: blur, a hidden tab, the player's pause, a lost pointer. */
  cancel: () => void;
  /** A keyboard move: for the next quarter second pieces follow with no easing delay (keys never wait on motion). */
  quick: () => void;
  /** Stop the frames (pause) and start them again (resume). */
  stop: () => void;
  kick: () => void;
  anim: () => Anim;
  px: () => Px | null;
  /** Client coordinates of a point in the view frame (play-tests aim with it). */
  client: (x: number, y: number) => { x: number; y: number } | null;
};

type Press = { id: number; pointer: number; x: number; y: number; mouse: boolean; moved: boolean; fromTray: boolean };
export type Dropped = { round: Round; outcome: Outcome };

/** Each kind's corners around its centroid, as flat numbers, for hit tests. */
const SHAPE: Record<Kind, Float32Array> = { L: new Float32Array(0), M: new Float32Array(0), S: new Float32Array(0), Q: new Float32Array(0), P: new Float32Array(0) };
for (const kind of SET) SHAPE[kind] = Float32Array.from(localCorners(kind, 0, false).flat());

function inside(shape: Float32Array, x: number, y: number) {
  let sign = 0;
  const n = shape.length / 2;
  for (let k = 0; k < n; k++) {
    const ax = shape[k * 2], ay = shape[k * 2 + 1], bx = shape[((k + 1) % n) * 2], by = shape[((k + 1) % n) * 2 + 1];
    const cross = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
    if (sign === 0) sign = Math.sign(cross); else if (Math.sign(cross) !== sign && cross !== 0) return false;
  }
  return true;
}

export function Table({ round, roundKey, calm, ghost, idle, cheer, api, live, wake, onDrop, onTap, onTurn, onLift }: {
  round: Round;
  /** Changes for every fresh round: the scene is baked again. */
  roundKey: string;
  calm: boolean;
  /** 0 none, 1 drag demo, 2 tap-and-tap demo. */
  ghost: number;
  /** A quiet spell: the right spot glows. */
  idle: boolean;
  /** Bumped when the picture is whole. */
  cheer: number;
  api: { current: TableApi | null };
  /** Whether a pick or drop counts now; wake() turns the first press after coming back into a resume (true when it did). */
  live: () => boolean; wake: () => boolean;
  /** A piece lets go at model point (x, y): the caller judges it and says what happened. */
  onDrop: (id: number, x: number, y: number) => Dropped | null;
  /** A tap on a piece (pick, then turn), a second finger on a carried piece (turn), a piece leaving the tray. */
  onTap: (id: number) => void;
  onTurn: (id: number) => void;
  onLift: () => void;
}) {
  const box = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const px: Px | null = size.w > 40 && size.h > 40 ? layoutFor(size.w, size.h, round.layout.box, round.layout.trayTop) : null;
  const geo = useRef<Px | null>(null);
  geo.current = px;
  const anim = useRef(makeAnim());
  const scene = useRef<{ key: string; scene: Scene; ratio: number } | null>(null);
  const press = useRef<Press | null>(null);
  const frame = useRef(0), last = useRef(0);
  const seen = useRef({ rot: new Int16Array(PIECES), flip: new Int8Array(PIECES) });
  const latest = useRef({ round, onDrop, onTap, onTurn, onLift, live, wake, idle, ghost });
  latest.current = { round, onDrop, onTap, onTurn, onLift, live, wake, idle, ghost };

  // ---- the frame loop: only while something moves ----
  function tick(now: number) {
    frame.current = 0;
    const a = anim.current, l = geo.current, s = scene.current, c = canvas.current?.getContext('2d');
    if (!l || !s || !c) return;
    const dt = Math.min(50, now - (last.current || now));
    last.current = now;
    const moving = stepAnim(a, dt);
    for (let k = 0; k < a.landedCount; k++) {
      const id = a.landed[k];
      puff(a, a.x[id], a.y[id], 0.7);
      flash(a, id);
    }
    drawTable(c, a, s.scene, l, s.ratio);
    if (moving || a.landedCount) frame.current = requestAnimationFrame(tick);
  }
  /** One more frame, and more while anything moves. Frames are cosmetic and stop by themselves within a second of stillness. */
  function kick() {
    if (frame.current || document.hidden) return;
    last.current = performance.now();
    frame.current = requestAnimationFrame(tick);
  }
  function stop() { cancelAnimationFrame(frame.current); frame.current = 0; }

  // ---- size: the box fills what the HUD and the controls leave ----
  useLayoutEffect(() => {
    const element = box.current;
    if (!element) return;
    const measure = () => { const r = element.getBoundingClientRect(); setSize(old => (Math.abs(old.w - r.width) < 1 && Math.abs(old.h - r.height) < 1 ? old : { w: r.width, h: r.height })); };
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(element);
    return () => watch.disconnect();
  }, []);

  // ---- bake per round and size, then put every piece where the round says ----
  const ratio = typeof window === 'undefined' ? 1 : Math.min(2, window.devicePixelRatio || 1);
  const key = px ? `${roundKey}:${Math.round(px.w)}:${Math.round(px.h)}:${ratio}` : '';
  const baked = useRef('');
  useLayoutEffect(() => {
    const l = px, element = canvas.current;
    if (!l || !element) return;
    element.width = Math.round(l.w * ratio); element.height = Math.round(l.h * ratio);
    element.style.width = `${l.w}px`; element.style.height = `${l.h}px`;
    scene.current = { key, scene: bakeScene(latest.current.round, l, ratio), ratio };
    const a = anim.current, r = latest.current.round;
    a.calm = calm;
    if (baked.current.split(':')[0] !== roundKey) {
      // A fresh round: everything jumps to its place at once.
      for (let id = 0; id < PIECES; id++) { a.sv[id] = 0; a.shake[id] = 0; a.pop[id] = 0; a.wait[id] = 0; a.s[id] = 1; a.mode[id] = r.pieces[id].done ? Mode.In : Mode.Tray; }
      a.sweep = 0; a.held = -1; a.flashT.fill(0); a.dlife.fill(0);
      jump(r, l);
    }
    baked.current = key;
    sync(true);
    kick();
  }, [key]);

  /** Put every piece at its place without animating (a new round, or a resize). */
  function jump(r: Round, l: Px) {
    const a = anim.current;
    for (let id = 0; id < PIECES; id++) {
      const piece = r.pieces[id], v = toView(r.upright, [piece.x, piece.y]);
      a.x[id] = v[0]; a.y[id] = piece.inTray ? v[1] + l.shift : v[1];
      a.s[id] = piece.inTray ? r.layout.trayScale : 1;
      a.r[id] = piece.rot * Math.PI / 4 + (r.upright ? -Math.PI / 4 : 0);
      a.fl[id] = piece.flip ? -1 : 1;
      seen.current.rot[id] = piece.rot; seen.current.flip[id] = piece.flip ? 1 : 0;
    }
  }

  /** The pure round says where everything is; the animation heads there. Held and sliding pieces are left alone. */
  function sync(still = false) {
    const l = geo.current, a = anim.current, r = latest.current.round;
    if (!l) return;
    const base = r.upright ? -Math.PI / 4 : 0;
    a.lines = ['colour', 'plain', 'faint', 'none'].indexOf(r.spec.lines);
    for (let id = 0; id < PIECES; id++) {
      const piece = r.pieces[id], v = toView(r.upright, [piece.x, piece.y]);
      a.tr[id] = piece.rot * Math.PI / 4 + base;
      a.tfl[id] = piece.flip ? -1 : 1;
      // A turn or a mirror gives the piece a little pop.
      if (!still && !a.calm && (seen.current.rot[id] !== piece.rot || seen.current.flip[id] !== (piece.flip ? 1 : 0))) a.sv[id] += 0.9;
      seen.current.rot[id] = piece.rot; seen.current.flip[id] = piece.flip ? 1 : 0;
      if (a.mode[id] === Mode.Held || a.mode[id] === Mode.Snap) continue;
      if (piece.done) {
        // A piece that turned into place slides in; a resize or a fresh round has it there already.
        if (a.mode[id] !== Mode.In) snapTo(a, id, v[0], v[1], a.tr[id], a.tfl[id]);
        continue;
      }
      if (piece.inTray) rest(a, id, v[0], v[1] + l.shift, r.layout.trayScale * (id === r.selected ? 1.12 : 1), 0);
      else loose(a, id, v[0], v[1]);
    }
    a.selected = r.selected ?? -1;
    // The empty spots, as lines.
    const colors = spotPieces(r);
    a.spots = Math.min(r.shown.length, 7);
    for (let s = 0; s < a.spots; s++) {
      const pts = corners(r.shown[s]);
      a.spotN[s] = pts.length; a.spotColor[s] = colors[s];
      for (let k = 0; k < pts.length; k++) { const v = toView(r.upright, pts[k]); a.spotPts[s * SPOT_STRIDE + k * 2] = v[0]; a.spotPts[s * SPOT_STRIDE + k * 2 + 1] = v[1]; }
    }
    const hint = hintFor(r, latest.current.idle);
    a.hintN = 0;
    if (hint) { const pts = corners(hint); a.hintN = pts.length; for (let k = 0; k < pts.length; k++) { const v = toView(r.upright, pts[k]); a.hintPts[k * 2] = v[0]; a.hintPts[k * 2 + 1] = v[1]; } }
    // The ghost finger: from the first waiting piece to its spot.
    const first = r.pieces.find(piece => !piece.done), spot = first && r.shown.find(pose => pose.kind === first.kind);
    if (latest.current.ghost && first && spot) {
      const from = toView(r.upright, first.home), to = toView(r.upright, [spot.x, spot.y]);
      const kind = latest.current.ghost === 1 ? Ghost.Drag : Ghost.Tap;
      if (a.ghost !== kind) a.gt = -GHOST_WAIT;
      a.ghost = kind;
      a.gx0 = from[0]; a.gy0 = from[1] + l.shift; a.gx1 = to[0]; a.gy1 = to[1];
    } else a.ghost = Ghost.Off;
    kick();
  }
  useEffect(() => { sync(); }, [round, idle, ghost]);
  useEffect(() => { anim.current.calm = calm; kick(); }, [calm]);
  useEffect(() => { if (cheer && !anim.current.calm) { celebrate(anim.current, SNAP_MS); kick(); } }, [cheer]);

  // Away: a piece in the hand glides back (the caller's pause also calls cancel). Frames stop on unmount.
  useEffect(() => {
    const away = () => cancel();
    const hide = () => { if (document.hidden) cancel(); };
    window.addEventListener('blur', away);
    document.addEventListener('visibilitychange', hide);
    return () => { window.removeEventListener('blur', away); document.removeEventListener('visibilitychange', hide); stop(); };
  }, []);

  // ---- input ----
  const point = (event: { clientX: number; clientY: number }) => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: event.clientX - r.left, y: event.clientY - r.top };
  };

  /** The piece under a press: inside its shape first (the one drawn last wins), else the nearest centre within 44 px. */
  function pieceAt(x: number, y: number): number {
    const l = geo.current, a = anim.current, r = latest.current.round;
    if (!l) return -1;
    let best = -1, bestDist = 1e9;
    for (let id = 0; id < PIECES; id++) {
      if (r.pieces[id].done || a.mode[id] === Mode.Snap) continue;
      const dx = x - pxX(l, a.x[id]), dy = y - pxY(l, a.y[id]), k = l.u * a.s[id];
      const cos = Math.cos(a.r[id]), sin = Math.sin(a.r[id]), flip = a.tfl[id] < 0 ? -1 : 1;
      const lx = (cos * dx + sin * dy) / k * flip, ly = (-sin * dx + cos * dy) / k;
      const dist = Math.hypot(dx, dy), within = inside(SHAPE[r.pieces[id].kind], lx, ly);
      const score = within ? dist - 1000 : dist;
      if ((within || dist < 44) && score < bestDist) { best = id; bestDist = score; }
    }
    return best;
  }

  function cancel() {
    const held = press.current;
    press.current = null;
    const a = anim.current;
    if (held && a.mode[held.id] === Mode.Held) { a.held = -1; a.mode[held.id] = Mode.Tray; sync(); }
  }

  /** A piece lets go at view point (vx, vy): the caller judges it, and the table plays what it said. */
  function release(id: number, vx: number, vy: number) {
    const l = geo.current, a = anim.current, r = latest.current.round;
    if (!l) return;
    const model = toModel(r.upright, [vx, modelY(l, vy)]);
    const result = latest.current.onDrop(id, model[0], model[1]);
    a.held = -1;
    if (!result) { a.mode[id] = Mode.Tray; sync(); return; }
    const next = result.round, piece = next.pieces[id], v = toView(next.upright, [piece.x, piece.y]);
    if (result.outcome === 'fit' || result.outcome === 'done') snapTo(a, id, v[0], v[1], piece.rot * Math.PI / 4 + (next.upright ? -Math.PI / 4 : 0), piece.flip ? -1 : 1);
    else if (result.outcome === 'miss') rest(a, id, v[0], v[1] + l.shift, next.layout.trayScale, 1);
    else if (result.outcome === 'home') rest(a, id, v[0], v[1] + l.shift, next.layout.trayScale, 0);
    else loose(a, id, vx, vy);
    kick();
  }

  function onDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    const l = geo.current;
    if (!l) return;
    // The click that brings focus back only resumes.
    if (latest.current.wake()) return;
    if (!latest.current.live()) return;
    // A second finger while carrying a piece turns it.
    const now = press.current;
    if (now && now.pointer !== event.pointerId) { if (now.moved) latest.current.onTurn(now.id); return; }
    // A stale press (its pointerup was lost to another window) is replaced, never trusted.
    press.current = null;
    const { x, y } = point(event), id = pieceAt(x, y);
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a pointer the browser no longer tracks */ }
    if (id >= 0) press.current = { id, pointer: event.pointerId, x, y, mouse: event.pointerType === 'mouse', moved: false, fromTray: latest.current.round.pieces[id].inTray };
    else press.current = { id: -1, pointer: event.pointerId, x, y, mouse: event.pointerType === 'mouse', moved: false, fromTray: false };
  }

  function onMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    const p = press.current, l = geo.current, a = anim.current;
    if (!p || p.pointer !== event.pointerId || !l) return;
    // A mouse moving with no button held has lost its pointerup (another window took it): let go, nothing dropped.
    if (p.mouse && event.buttons === 0) { cancel(); return; }
    if (p.id < 0) return;
    const { x, y } = point(event), lift = p.mouse ? 0 : 0.9;
    if (!p.moved) {
      if (Math.hypot(x - p.x, y - p.y) < (p.mouse ? 4 : 8)) return;
      if (!latest.current.live()) { press.current = null; return; }
      p.moved = true;
      hold(a, p.id, a.x[p.id], a.y[p.id]);
      latest.current.onLift();
    }
    a.tx[p.id] = unX(l, x); a.ty[p.id] = unY(l, y) - lift;
    kick();
  }

  function onUp(event: ReactPointerEvent<HTMLCanvasElement>) {
    const p = press.current, l = geo.current, a = anim.current;
    if (!p || p.pointer !== event.pointerId || !l) return;
    press.current = null;
    if (p.id >= 0 && p.moved) { release(p.id, a.tx[p.id], a.ty[p.id]); return; }
    if (!latest.current.live()) return;
    if (p.id >= 0) { latest.current.onTap(p.id); return; }
    // Tap-place: with a piece picked, tap the spot in the picture where it should go.
    const picked = latest.current.round.selected, { x, y } = point(event);
    if (picked !== null && Math.hypot(x - p.x, y - p.y) < 14 && !latest.current.round.pieces[picked].done) release(picked, unX(l, x), unY(l, y));
  }

  api.current = {
    cancel, stop, kick, quick: () => { anim.current.quick = 250; kick(); }, anim: () => anim.current, px: () => geo.current,
    client: (x, y) => { const l = geo.current, r = canvas.current?.getBoundingClientRect(); return l && r ? { x: r.left + pxX(l, x), y: r.top + pxY(l, y) } : null; },
  };

  return (
    <div className="st-table" ref={box}>
      <canvas ref={canvas} className="st-canvas" role="img" aria-label={`${round.figure.name}-এর ছায়া আর সাতটা টুকরো। টুকরো টেনে ছায়ায় বসাও।`}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={cancel}
        onLostPointerCapture={event => { if (press.current?.pointer === event.pointerId && press.current.moved) cancel(); }} />
    </div>
  );
}

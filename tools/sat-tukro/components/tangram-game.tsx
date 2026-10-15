'use client';
// IP: what we avoided — no copied tangram books, apps or puzzle cards; every silhouette is our own arrangement of the classic seven-piece set (public domain), and no TV characters.
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { ParentGate, RestScreen, ShareToolLink, ShowParent, ShowParentButton, bn, useKidsSession } from '../../../shared/kids-kit';
import { loadCardFonts } from '../../../shared/card-canvas';
import { confetti, newSeed, sfx, useLevels, useSlowMode } from '../../../shared/game-kit';
import { LevelGrid, SoundToggle, StarReveal } from '../../../shared/game-ui';
import { cardBlob, cardLine, drawCard } from '../lib/draw-card';
import { FIGURES, LEVEL_COUNT, bandOf, type Figure } from '../lib/figures';
import {
  PIECE_COLOR, PIECE_NAME, TRAY_SCALE, drop, figureView, flipPiece, hintFor, newRound, nudge, starsOf, tapPiece, toModel, toView,
  type Outcome, type Round,
} from '../lib/game';
import { corners, localCorners, type Point } from '../lib/tangram';
import { PrintSheet } from './print-sheet';

const SLUG = 'sat-tukro';
const NEWS = ['এখন তুমি দাগ দেখে টুকরো বসাতে পারো।', 'এখন তুমি টুকরো ঘুরিয়ে জায়গা মেলাতে পারো।', 'এখন তুমি দাগ ছাড়া শুধু ছায়া দেখে বসাতে পারো।', 'এখন তুমি ঘুরিয়ে, উল্টে, শুধু ছায়া দেখে ছবি বানাতে পারো।'];
const BAND_ENDS = [6, 12, 17, LEVEL_COUNT];
const points = (list: readonly Point[]) => list.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join(' ');

export function TangramGame() {
  const [print, setPrint] = useState(false);
  useEffect(() => { setPrint(new URLSearchParams(location.search).has('print')); }, []);
  return print ? <PrintSheet /> : <Play />;
}

function startLine(level: number) {
  const band = bandOf(level);
  return `টুকরো টেনে ${band.outlines ? 'দাগের' : 'ছায়ার'} ভেতর বসাও।${band.turned ? ' আবার চাপলে টুকরো ঘোরে।' : ''}`;
}

function Play() {
  const { stars, record, loaded } = useLevels(SLUG, LEVEL_COUNT);
  const { resting, atBreak, extend } = useKidsSession();
  const [slow, setSlow] = useSlowMode();
  // A fixed first round so the server page already shows the game; replaced once this phone's progress is read.
  const [round, setRound] = useState<Round>(() => newRound(1, 1));
  const [phase, setPhase] = useState<'play' | 'end' | 'pick'>('play');
  const [say, setSay] = useState(() => startLine(1));
  const [earned, setEarned] = useState(0);
  const [ghost, setGhost] = useState(false);
  const [made, setMade] = useState<string[]>([]);
  const [showing, setShowing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const start = useCallback((level: number) => {
    if (timer.current) clearTimeout(timer.current);
    setRound(newRound(level, newSeed()));
    setSay(startLine(level)); setPhase('play');
  }, []);

  const started = useRef(false);
  useEffect(() => {
    if (!loaded || started.current) return;
    started.current = true;
    const fresh = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1).find(level => !stars[level]) ?? 1;
    setGhost(Object.keys(stars).length === 0);
    start(fresh);
  }, [loaded, stars, start]);

  const finish = (done: Round) => {
    sfx.win();
    setSay(`${done.figure.name} হলো।`);
    timer.current = setTimeout(() => {
      const got = starsOf(done.misses);
      record(done.level, got);
      setEarned(got); setMade(list => [...list, done.figure.id]); setPhase('end');
      if (BAND_ENDS.includes(done.level)) confetti();
      atBreak();
    }, slow ? 400 : 1200);
  };

  const react = (next: Round, outcome: Outcome | 'select' | 'rotate' | 'flip') => {
    setRound(next);
    const held = next.selected === null ? null : next.pieces[next.selected];
    if (outcome === 'done') return finish(next);
    if (outcome === 'fit') { sfx.good(); setSay(startLine(next.level)); return; }
    if (outcome === 'select') { sfx.pick(); setSay(held?.kind === 'P' ? 'আবার চাপলে ঘোরে। ‘উল্টাও’ চাপলে উল্টো পিঠ।' : 'আবার চাপলে ঘোরে। এবার টেনে বসাও।'); return; }
    if (outcome === 'rotate' || outcome === 'flip') { sfx.tap(); return; }
    if (outcome === 'turn') { sfx.tap(); setSay('জায়গা ঠিক আছে। এবার চেপে ঘোরাও।'); return; }
    if (outcome === 'miss') { sfx.drop(); setSay(hintFor(next) ? 'আলো জ্বলা জায়গাটা দেখো।' : 'এখানে আঁটছে না। অন্য জায়গা খোঁজো।'); return; }
    if (outcome === 'park' || outcome === 'home') sfx.drop();
  };

  const band = bandOf(round.level), held = round.selected === null ? null : round.pieces[round.selected];

  return <div className={`st${slow ? ' st-still' : ''}`}>
    <div className="st-top">
      <button type="button" className="st-level" onClick={() => { sfx.tap(); setPhase('pick'); }} aria-label={`ছবি ${bn(round.level)}: ${round.figure.name}। ছবি বদলাও`}>
        <b>{round.figure.name}</b><span>ছবি {bn(round.level)}/{bn(LEVEL_COUNT)}</span>
      </button>
      <button type="button" className="st-pill" aria-pressed={slow} onClick={() => { sfx.tap(); setSlow(!slow); }}>ধীরে</button>
      <SoundToggle compact />
    </div>

    {phase === 'play' && <div className="st-stage">
      <Board round={round} outlines={band.outlines} ghost={ghost && round.level === 1} still={slow}
        onTap={id => { setGhost(false); const r = tapPiece(round, id); react(r.round, r.outcome); }}
        onDrop={(id, [x, y]) => { setGhost(false); const r = drop(round, id, x, y); react(r.round, r.outcome); }}
        onNudge={(id, dx, dy) => { const r = nudge(round, id, dx, dy); react(r.round, r.outcome); }} />
      <div className="st-under">
        <p className="st-say" aria-live="polite">{say}</p>
        {held && !held.done && held.kind === 'P' && <button type="button" className="st-flip" onClick={() => { const r = flipPiece(round, held.id); react(r.round, r.outcome); }}>
          <span aria-hidden="true">⇋</span> উল্টাও
        </button>}
      </div>
    </div>}

    {phase === 'end' && <div className="st-stage st-end">
      <FigureArt figure={round.figure} />
      <StarReveal count={earned} />
      <p className="st-end-line">{round.figure.name} হলো, সাতটা টুকরো দিয়েই।</p>
      <p className="st-end-news">{NEWS[band.step]}</p>
      <p className="st-end-off">ছবিতে ত্রিভুজ কয়টা? গুনে আব্বু-আম্মুকে বলো।</p>
      <div className="st-actions">
        <button type="button" className="kit-primary" onClick={() => { sfx.tap(); start(round.level % LEVEL_COUNT + 1); }}>আবার খেলো</button>
        <button type="button" className="kit-primary st-done" onClick={() => { sfx.tap(); setPhase('pick'); }}>শেষ</button>
      </div>
      <ShowParentButton onClick={() => setShowing(true)} />
    </div>}

    {phase === 'pick' && <div className="st-stage st-pick">
      <p className="st-end-line">কোন ছবিটা বানাবে?</p>
      <LevelGrid count={LEVEL_COUNT} stars={stars} unlocked={LEVEL_COUNT} current={round.level} onPick={start} noun="ছবি" />
      <p className="st-pick-names">{FIGURES.map((figure, index) => `${bn(index + 1)} ${figure.name}`).join(' · ')}</p>
    </div>}

    <div className="st-grown">
      <a className="st-print" href="/sat-tukro?print">কাটার পাতা প্রিন্ট করো</a>
      <ParentGate label="বড়দের জন্য"><ShareToolLink title="সাত টুকরো" text="সাত টুকরো ঘুরিয়ে ছায়ার ভেতর বসানোর খেলা, ৫–১২ বছরের জন্য।" /></ParentGate>
    </div>

    <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: 'sat-tukro.png', make: () => cardBlob(made, location.host) }}>
      <div className="kit-card"><Card ids={made} /></div>
      <p>{cardLine(made)}: {made.map(id => FIGURES.find(f => f.id === id)?.name).join(', ')}।</p>
    </ShowParent>
    {resting && <RestScreen onExtend={extend} />}
  </div>;
}

type Drag = { id: number; pointer: number; start: Point; from: Point; client: [number, number]; moved: boolean; fromTray: boolean };

/** The play area: the shadow on top, the tray below, all in one SVG so a piece keeps its true size wherever it goes. */
function Board({ round, outlines, ghost, still, onTap, onDrop, onNudge }: {
  round: Round; outlines: boolean; ghost: boolean; still: boolean;
  onTap: (id: number) => void; onDrop: (id: number, at: Point) => void; onNudge: (id: number, dx: number, dy: number) => void;
}) {
  const svg = useRef<SVGSVGElement>(null), model = useRef<SVGGElement>(null), drag = useRef<Drag | null>(null);
  const [dragAt, setDragAt] = useState<{ id: number; at: Point } | null>(null);
  const [left, top, width, height] = round.layout.box;

  const toBoard = (event: { clientX: number; clientY: number }): Point => {
    const matrix = model.current?.getScreenCTM()?.inverse();
    if (!matrix) return [0, 0];
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix);
    return [point.x, point.y];
  };

  const down = (event: ReactPointerEvent, id: number) => {
    // Only the first finger counts: a palm or a second finger is ignored.
    if (!event.isPrimary || drag.current || round.pieces[id].done) return;
    event.stopPropagation();
    try { svg.current?.setPointerCapture(event.pointerId); } catch { /* the pointer already ended */ }
    const piece = round.pieces[id];
    drag.current = { id, pointer: event.pointerId, start: toBoard(event), from: [piece.x, piece.y], client: [event.clientX, event.clientY], moved: false, fromTray: piece.inTray };
  };
  const move = (event: ReactPointerEvent) => {
    const now = drag.current;
    if (!now || now.pointer !== event.pointerId) return;
    if (!now.moved && Math.hypot(event.clientX - now.client[0], event.clientY - now.client[1]) < 8) return;
    now.moved = true;
    const at = toBoard(event);
    if (now.fromTray) {
      // A piece from the tray rides a little above the finger, so the finger never hides it.
      const [vx, vy] = toView(round.upright, at);
      setDragAt({ id: now.id, at: toModel(round.upright, [vx, vy - 0.9]) });
    } else setDragAt({ id: now.id, at: [now.from[0] + at[0] - now.start[0], now.from[1] + at[1] - now.start[1]] });
  };
  const up = (event: ReactPointerEvent) => {
    const now = drag.current;
    if (now && now.pointer === event.pointerId) {
      drag.current = null;
      const at = dragAt?.id === now.id ? dragAt.at : null;
      setDragAt(null);
      if (now.moved && at) onDrop(now.id, at); else onTap(now.id);
      return;
    }
    // Tap-place: with a piece held, tap the spot in the picture where it should go.
    if (event.isPrimary && !now && round.selected !== null) onDrop(round.selected, toBoard(event));
  };
  const cancel = () => { drag.current = null; setDragAt(null); };

  const key = (event: KeyboardEvent, id: number) => {
    const step: Record<string, [number, number]> = { ArrowLeft: [-0.5, 0], ArrowRight: [0.5, 0], ArrowUp: [0, -0.5], ArrowDown: [0, 0.5] };
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onTap(id); }
    else if (step[event.key]) { event.preventDefault(); onNudge(id, ...step[event.key]); }
  };

  const hint = hintFor(round);
  const order = [...round.pieces].sort((a, b) => rank(a) - rank(b));
  function rank(piece: Round['pieces'][number]) { return piece.done ? 0 : piece.id === dragAt?.id ? 4 : piece.id === round.selected ? 3 : piece.inTray ? 1 : 2; }
  const first = round.pieces[0], slot = round.shown.find(pose => pose.kind === first.kind);

  return <svg ref={svg} className="st-board" viewBox={`${left} ${top} ${width} ${height}`} role="group" aria-label={`${round.figure.name}-এর ছায়া আর সাতটা টুকরো`}
    onPointerMove={move} onPointerUp={up} onPointerCancel={cancel}>
    <rect className="st-tray" x={left + 0.15} y={round.layout.trayTop - 0.3} width={width - 0.3} height={top + height - round.layout.trayTop + 0.15} rx={0.4} />
    <g ref={model} transform={round.upright ? 'rotate(-45)' : undefined}>
      <g className="st-shadow" aria-hidden="true">{round.solution.map((pose, index) => <polygon key={index} points={points(corners(pose))} />)}</g>
      {outlines && <g className="st-outlines" aria-hidden="true">{round.shown.map((pose, index) => <polygon key={index} points={points(corners(pose))} />)}</g>}
      {hint && <polygon className={`st-hint${outlines ? '' : ' st-hint-solo'}`} points={points(corners(hint))} aria-hidden="true" />}
      {order.map(piece => {
        const at = dragAt?.id === piece.id ? dragAt.at : [piece.x, piece.y];
        const scale = piece.inTray && dragAt?.id !== piece.id ? TRAY_SCALE : 1;
        const classes = ['st-piece', piece.done && 'done', piece.id === round.selected && 'held', dragAt?.id === piece.id && 'drag', still && 'still'].filter(Boolean).join(' ');
        return <g key={piece.id} className={classes} tabIndex={piece.done ? -1 : 0} role="button"
          aria-label={`${PIECE_NAME[piece.kind]}${piece.done ? ', বসে গেছে' : piece.id === round.selected ? ', ধরা আছে: আবার চাপলে ঘোরে' : ''}`}
          style={{ transform: `translate(${at[0]}px, ${at[1]}px) rotate(${piece.rot * 45}deg) scale(${piece.flip ? -scale : scale}, ${scale})` }}
          onPointerDown={event => down(event, piece.id)} onKeyDown={event => key(event, piece.id)}>
          <circle className="st-hit" r={1.15 / scale} />
          <polygon points={points(localCorners(piece.kind, 0, false))} fill={PIECE_COLOR[piece.id]} />
        </g>;
      })}
    </g>
    {ghost && slot && <Finger from={toView(round.upright, first.home)} to={toView(round.upright, [slot.x, slot.y])} still={still} />}
  </svg>;
}

/** A ghost finger dragging the first big triangle to its outline, until the first touch. */
function Finger({ from, to, still }: { from: Point; to: Point; still: boolean }) {
  return <g transform={`translate(${from[0]} ${from[1]})`} aria-hidden="true" pointerEvents="none">
    <g className={`st-finger${still ? ' still' : ''}`} style={{ ['--dx' as string]: to[0] - from[0], ['--dy' as string]: to[1] - from[1] }}>
      <circle className="st-ripple" r={0.5} />
      <path transform="translate(-0.42 -0.2) scale(0.034)" d="M14 10a6 6 0 0 1 12 0v20l4-2a6 6 0 0 1 6 2l6 6a8 8 0 0 1 2 6v8c0 6-5 12-12 12H22c-5 0-9-3-11-7L4 40a5 5 0 0 1 8-6l2 3z" fill="#fff" stroke="#2e2a3a" strokeWidth="2.5" strokeLinejoin="round" />
    </g>
  </g>;
}

/** The finished picture, drawn in its seven colours. */
export function FigureArt({ figure, size = 150 }: { figure: Figure; size?: number }) {
  const view = figureView(figure), pad = 0.2;
  return <svg className="st-art" viewBox={`${-pad} ${-pad} ${view.width + 2 * pad} ${view.height + 2 * pad}`} width={size} height={size} role="img" aria-label={figure.name}>
    {view.shapes.map((shape, index) => <polygon key={index} points={points(shape.points)} fill={shape.color} stroke="#fff" strokeWidth={0.05} strokeLinejoin="round" />)}
  </svg>;
}

/** The card for the parent, drawn once the fonts are in. */
function Card({ ids }: { ids: string[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    loadCardFonts(`${cardLine(ids)} ${ids.map(id => FIGURES.find(f => f.id === id)?.name).join(' ')}`).then(() => { if (live && ref.current) drawCard(ref.current, ids, location.host); });
    return () => { live = false; };
  }, [ids]);
  return <canvas ref={ref} width={1080} height={1350} aria-label={cardLine(ids)} role="img" />;
}


'use client';
// The orbit board for tour, sort and build: the Sun in the corner, a planet on every orbit, and the rocket on a canvas
// that flies a curve to wherever the child just landed. The flight and trail run in sky.hot.ts, only while something moves.
import { useEffect, useRef, type CSSProperties, type HTMLAttributes } from 'react';
import { fitCanvas } from '../../../shared/game-kit';
import { bn } from '../../../shared/kids-kit';
import { BOARD, HOME, orbitRadius, parkBeside, spot } from '../lib/board';
import { levelOf } from '../lib/course';
import { createSky, flightMs, launch, moving, snap, type Sky } from '../lib/flight';
import { PLANETS } from '../lib/planets';
import { itemOf, type Round } from '../lib/round';
import { GhostFinger, PlanetArt } from './art';
import { drawSky, stepSky } from './sky.hot';

export type Tap = (key: string) => Pick<HTMLAttributes<HTMLButtonElement>, 'onPointerDown' | 'onClick'> & { 'data-key': string };
const pct = (value: number, of: number) => `${(value / of) * 100}%`;

type BoardProps = {
  round: Round; slow: boolean; paused: boolean; glow: boolean; ghost: boolean;
  /** Where the rocket parks: a planet's place (0-based), or -1 at the Sun. `flight` changes with every right answer. */
  rocketAt: number; flight: number;
  wobble: { key: string; n: number } | null; tap: Tap;
};

export function Board({ round, slow, paused, glow, ghost, rocketAt, flight, wobble, tap }: BoardProps) {
  const spec = levelOf(round.level), count = spec.count, mode = spec.mode;
  const box = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const sky = useRef<Sky | null>(null);
  const run = useRef({ raf: 0, last: 0, k: 1, paused, ctx: null as CanvasRenderingContext2D | null });
  run.current.paused = paused;
  if (!sky.current) sky.current = createSky(HOME.x, HOME.y);
  if (process.env.NODE_ENV !== 'production') Object.assign(window, { __sky: sky.current }); // dev only: an autopilot can read the rocket

  const paint = () => { const r = run.current; if (r.ctx && sky.current) drawSky(r.ctx, sky.current, r.k, BOARD.width, BOARD.height); };
  const frame = (now: number) => {
    const r = run.current, s = sky.current!;
    const live = stepSky(s, Math.min(50, now - r.last));
    r.last = now;
    paint();
    r.raf = live && !r.paused ? requestAnimationFrame(frame) : 0;
  };
  const kick = () => {
    const r = run.current;
    if (r.raf || r.paused || !sky.current || !moving(sky.current)) return;
    r.last = performance.now();
    r.raf = requestAnimationFrame(frame);
  };

  // Size the canvas to the board and draw once; again whenever the board resizes.
  useEffect(() => {
    const node = box.current, cv = canvas.current;
    if (!node || !cv) return;
    const size = () => {
      const w = node.clientWidth, h = node.clientHeight;
      if (w < 20 || h < 20) return;
      run.current.ctx = fitCanvas(cv, w, h);
      run.current.k = cv.width / BOARD.width;
      paint();
    };
    size();
    const watch = new ResizeObserver(size);
    watch.observe(node);
    return () => { watch.disconnect(); cancelAnimationFrame(run.current.raf); run.current.raf = 0; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // The rocket goes where the last right answer was (or home), flying unless slow.
  useEffect(() => {
    const s = sky.current!;
    const at = rocketAt < 0 ? HOME : parkBeside(rocketAt, count, PLANETS[rocketAt].drawR);
    if (slow || flight === 0) { snap(s, at.x, at.y); paint(); return; }
    launch(s, at.x, at.y);
    kick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flight]);

  // Under the pause menu the loop stops; on resume it goes on from where it was.
  useEffect(() => {
    if (paused) { cancelAnimationFrame(run.current.raf); run.current.raf = 0; } else kick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  // The planet's pulse and name tag wait for the rocket to arrive: the flight is the lead, the landing is its beat.
  const track = useRef({ flight: 0, from: -1, at: -1 });
  if (track.current.flight !== flight) track.current = { flight, from: track.current.at, at: rocketAt };
  const leg = (index: number) => index < 0 ? HOME : parkBeside(index, count, PLANETS[index].drawR);
  const landMs = flight > 0 && !slow && rocketAt >= 0 ? flightMs(Math.hypot(leg(rocketAt).x - leg(track.current.from).x, leg(rocketAt).y - leg(track.current.from).y)) : 0;
  const landStyle = (index: number, at: { x: number; y: number }) => ({ left: pct(at.x, BOARD.width), top: pct(at.y, BOARD.height), ...(index === rocketAt && landMs ? { '--land': `${landMs}ms` } : {}) }) as CSSProperties;
  const item = itemOf(round), doneUpTo = round.index + (round.solved ? 1 : 0);
  const wobbleClass = (key: string) => wobble?.key === key && !slow ? ` sj-wobble sj-w${wobble.n % 2}` : '';
  const target = ghost ? spot(mode === 'sort' ? round.slots.indexOf(0) : 0, count) : null;

  return <div className="sj-board" ref={box} style={{ aspectRatio: `${BOARD.width} / ${BOARD.height}` }}>
    <svg className="sj-sky" viewBox={`0 0 ${BOARD.width} ${BOARD.height}`} aria-hidden="true" focusable="false">
      <defs><radialGradient id="sj-sun" cx="0" cy="0" r="1"><stop offset=".2" stopColor="#fff3b0" /><stop offset=".7" stopColor="#ffc93c" /><stop offset="1" stopColor="#f28c28" /></radialGradient></defs>
      {Array.from({ length: 30 }, (_, i) => <circle key={i} cx={(i * 137) % BOARD.width} cy={(i * 89) % BOARD.height} r={i % 4 ? 1 : 1.7} fill="#fff" opacity=".55" />)}
      {Array.from({ length: count }, (_, i) => <circle key={`orbit${i}`} r={orbitRadius(i, count)} cx="0" cy="0" fill="none" stroke="#9fb0ff" strokeOpacity={mode === 'tour' && i < doneUpTo ? 0.5 : 0.28} strokeDasharray={mode === 'tour' ? undefined : '5 6'} />)}
      <circle cx="0" cy="0" r={BOARD.sunR} fill="url(#sj-sun)" />
    </svg>
    <canvas className="sj-fly" ref={canvas} aria-hidden="true" />
    {mode !== 'build' && PLANETS.slice(0, count).map((planet, index) => {
      const at = spot(mode === 'sort' ? round.slots.indexOf(index) : index, count), done = mode === 'sort' ? round.slots[index] === index : index < doneUpTo;
      const live = !done && index === round.index;
      return <button key={planet.id} type="button" data-planet={planet.id} className={`sj-planet${done ? ' done' : ''}${glow && live ? ' sj-glow' : ''}${wobbleClass(planet.id)}`}
        style={landStyle(index, at)} aria-label={done ? `${planet.name}, হয়ে গেছে` : planet.name} {...tap(planet.id)}>
        <PlanetArt planet={planet} />
        {done && <span className="sj-name">{planet.name}</span>}
      </button>;
    })}
    {mode === 'build' && Array.from({ length: count }, (_, orbit) => {
      const at = spot(orbit, count), placed = round.slots[orbit] >= 0, planet = placed ? PLANETS[round.slots[orbit]] : null;
      return <button key={orbit} type="button" data-orbit={orbit} className={`sj-planet sj-slot${placed ? ' done' : ''}${glow && !placed && orbit === item.planet ? ' sj-glow' : ''}${wobbleClass(String(orbit))}`}
        style={landStyle(orbit, at)} aria-label={planet ? `${bn(orbit + 1)} নম্বর: ${planet.name}` : `${bn(orbit + 1)} নম্বর পথ`} {...tap(String(orbit))}>
        {planet ? <><PlanetArt planet={planet} /><span className="sj-name">{planet.name}</span></> : <span className="sj-hole" aria-hidden="true">{bn(orbit + 1)}</span>}
      </button>;
    })}
    {target && <span className="sj-ghost" style={{ left: pct(target.x + 10, BOARD.width), top: pct(target.y + 12, BOARD.height) }}><GhostFinger /></span>}
  </div>;
}

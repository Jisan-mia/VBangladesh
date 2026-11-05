'use client';
// The map in a plane window: the land, Dhaka, the stops as pins, the trails already flown, and the plane on its dotted route.
// A flight is two Web Animations made once (the plane's frames along the curve, and a mask that reveals the dots), so no
// frame of it runs our code or re-renders React; pausing the game pauses them. In ধীরে খেলো the plane doesn't move: the
// route shows and the landing follows after a short beat. `idle` is the title's attention loop: one flight, a long wait, again.
import { useEffect, useId, useRef, useState } from 'react';
import { LAKE_PATH, LAND_PATH, INK, PLANE, WORLD, project } from '../lib/art';
import { DHAKA, countryOf } from '../lib/countries';
import { FRAME_COUNT, flightMs, flightOf, planeFrames, routePath, viewOf } from '../lib/geo';

export const PINS = ['#d9480f', '#1971c2', '#7048e8'];
const STILL_MS = 450;

export type FlightProps = { ids: readonly string[]; visited: readonly number[]; flying: number | null; slow: boolean; frozen: boolean; onLanded: () => void; onPin?: (index: number) => void; idle?: boolean; pinsLive?: boolean };

export function WorldMap({ ids, visited, flying, slow, frozen, onLanded, onPin, idle = false, pinsLive = true }: FlightProps) {
  const view = viewOf(ids), unit = view.w / 60, mask = useId().replace(/:/g, '');
  const plane = useRef<SVGGElement>(null), reveal = useRef<SVGPathElement>(null);
  const flights = useRef<Animation[]>([]);
  const landed = useRef(onLanded);
  landed.current = onLanded;
  const [arrived, setArrived] = useState(false);
  const target = idle ? 0 : flying;

  // Start a flight when `flying` turns on (or the title's loop on mount); cancel on every change and on unmount.
  useEffect(() => {
    setArrived(false);
    if (target === null || !plane.current || !reveal.current) return;
    const route = flightOf(ids[target]), ms = flightMs(route);
    const gone = () => { for (const animation of flights.current) animation.cancel(); flights.current = []; };
    if (slow) {
      if (idle) return;
      const wait = plane.current.animate([{ opacity: 1 }, { opacity: 1 }], { duration: STILL_MS });
      wait.onfinish = () => { setArrived(true); landed.current(); };
      flights.current = [wait];
      return gone;
    }
    const frames = planeFrames(route, unit * 2.2);
    const timing: KeyframeAnimationOptions = idle ? { duration: ms, delay: 2500, endDelay: 5000, iterations: Infinity, fill: 'both', easing: 'linear' } : { duration: ms, fill: 'forwards', easing: 'linear' };
    const flightPlane = plane.current.animate(frames.map(frame => ({ offset: frame.offset, transform: frame.transform, opacity: 1 })), timing);
    const flightDots = reveal.current.animate(frames.map(frame => ({ offset: frame.offset, strokeDashoffset: frame.reveal })), timing);
    flights.current = [flightPlane, flightDots];
    if (!idle) flightPlane.onfinish = () => { setArrived(true); landed.current(); };
    return gone;
  }, [target, idle, slow, ids, unit]);

  // The pause menu, a blurred window or a list over the trip holds the plane in the air.
  useEffect(() => { for (const animation of flights.current) { if (frozen) animation.pause(); else if (animation.playState === 'paused') animation.play(); } }, [frozen, target, slow]);

  const [hx, hy] = project(DHAKA.lon, DHAKA.lat);
  const first = flightOf(ids[target ?? 0]);
  const dot = unit * 0.34, gap = unit * 1.15;
  const dotted = { fill: 'none', strokeLinecap: 'round' as const, strokeDasharray: `0 ${gap}`, strokeWidth: dot * 2 };
  const parked = `translate(${hx.toFixed(2)}px, ${(hy - unit * 1.6).toFixed(2)}px) rotate(-20deg) scale(${unit * 2.2})`;
  const spots = [[0.18, 0.28], [0.62, 0.18], [0.82, 0.62]] as const;
  const box = `${view.x} ${view.y} ${view.w} ${view.h}`;
  // Two stacked drawings: the land never repaints, only the small live layer (routes, pins, plane) does while the plane flies.
  return <div className="pg-map" role="img" aria-label={`মানচিত্র: ঢাকা আর ${ids.map(id => countryOf(id)!.name).join(', ')}${target !== null && !idle ? `। প্লেন যাচ্ছে ${countryOf(ids[target])!.name}` : ''}`}>
    <svg className="pg-map-base" viewBox={box} aria-hidden="true">
      <rect x={0} y={0} width={WORLD.width} height={WORLD.height} fill="#bfe3ee" />
      <path d={LAND_PATH} fill="#e8dcb4" stroke="#b8a77a" strokeWidth={unit * 0.12} strokeLinejoin="round" />
      <path d={LAKE_PATH} fill="#bfe3ee" stroke="#b8a77a" strokeWidth={unit * 0.12} />
      <g fill="#fff" opacity={0.85}>
        {spots.map(([sx, sy], index) => <ellipse key={index} cx={view.x + view.w * sx} cy={view.y + view.h * sy} rx={unit * 3.4} ry={unit * 1.1} />)}
      </g>
      <circle cx={hx} cy={hy} r={unit * 1.1} fill="#006a4e" stroke="#fff" strokeWidth={unit * 0.3} />
      <circle cx={hx - unit * 0.1} cy={hy} r={unit * 0.5} fill="#f42a41" />
      <text x={hx} y={hy + unit * 3.2} className="pg-map-label" fontSize={unit * 2.3} textAnchor="middle">ঢাকা</text>
    </svg>
    <svg className="pg-map-live" viewBox={box} aria-hidden="true">
      <defs>
        <mask id={`pg-m${mask}`} maskUnits="userSpaceOnUse" x={0} y={0} width={WORLD.width} height={WORLD.height}>
          <path ref={reveal} d={routePath(first)} fill="none" stroke="#fff" strokeWidth={unit * 2} pathLength={1} strokeDasharray={1} strokeDashoffset={slow && !idle ? 0 : 1} />
        </mask>
      </defs>
      {visited.map(at => <path key={at} d={routePath(flightOf(ids[at]))} stroke={INK} opacity={0.35} {...dotted} />)}
      {target !== null && <path d={routePath(first)} stroke={INK} {...dotted} opacity={slow ? 0.35 : 0.18} mask={slow ? undefined : `url(#pg-m${mask})`} />}
      {ids.map((id, index) => {
        const country = countryOf(id)!, [x, y] = project(country.lon, country.lat), here = flying === index, was = visited.includes(index) && !here;
        return <g key={id} className={`pg-pin${here ? ' now' : ''}${here && arrived ? ' here' : ''}`}>
          <circle className="pg-pin-ring" cx={x} cy={y} r={unit * 1.3} fill="none" stroke={PINS[index]} strokeWidth={unit * 0.35} />
          <circle cx={x} cy={y} r={unit * 1.3} fill={PINS[index]} stroke="#fff" strokeWidth={unit * 0.35} />
          {was && <path d={`M${x - unit * 0.6} ${y}l${unit * 0.45} ${unit * 0.5} ${unit * 0.8}-${unit * 0.95}`} fill="none" stroke="#fff" strokeWidth={unit * 0.35} strokeLinecap="round" />}
          {here && arrived && <text x={x} y={y - unit * 2} className="pg-map-label" fontSize={unit * 2.3} textAnchor="middle">{country.name}</text>}
          {onPin && pinsLive && !was && flying === null && <circle className="pg-pin-hit" cx={x} cy={y} r={unit * 3.2} fill="transparent" onPointerDown={event => { if (event.isPrimary && event.button === 0) { event.preventDefault(); onPin(index); } }} />}
        </g>;
      })}
      <g ref={plane} className="pg-plane" style={{ transform: parked }} fill="#fff" stroke={INK} strokeWidth={0.08} strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: PLANE }} />
    </svg>
  </div>;
}

export const FRAMES = FRAME_COUNT;

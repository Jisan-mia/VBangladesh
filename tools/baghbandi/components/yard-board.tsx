// The live yard, drawn as SVG: under 60 shapes, so React redraws it only when a move or a selection changes, never per frame.
import type { CSSProperties } from "react";
import { BOARD, LINES, POINTS, spot, type Game, type Move } from "../lib/game";
import { bn } from "../lib/link";
import { palette, PILE_OFFSETS, SEED, SEED_FACE, SEED_SHINE, TIGER_EYES, TIGER_STONE, TIGER_STRIPES } from "../lib/art";

// Everything that never changes: plastered clay with broom swirls, the lines scratched into it, and a small pit at every point.
const YARD = <>
  <rect width={BOARD} height={BOARD} rx="18" fill={palette.clay} />
  <g fill="none" stroke={palette.claySwirl} strokeWidth="5" strokeLinecap="round">
    <path d="M24 120Q70 40 170 26M330 474Q430 460 478 380M20 330Q30 420 120 470M380 24Q460 40 478 140" />
    <path d="M60 250Q60 140 150 80M440 250Q440 360 350 420" opacity=".6" />
  </g>
  {LINES.map(([from, to]) => {
    const [x1, y1] = spot(from), [x2, y2] = spot(to);
    return <g key={`${from}-${to}`} strokeLinecap="round">
      <line x1={x1 + 1.6} y1={y1 + 1.8} x2={x2 + 1.6} y2={y2 + 1.8} stroke={palette.grooveLight} strokeWidth="4" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={palette.groove} strokeWidth="4.5" />
    </g>;
  })}
  {Array.from({ length: POINTS }, (_, at) => { const [x, y] = spot(at); return <circle key={at} cx={x} cy={y} r="7" fill={palette.pit} />; })}
</>;

export function Seed() {
  return <>
    <path d={SEED} fill={palette.seed} stroke={palette.ink} strokeWidth="2" strokeLinejoin="round" />
    <path d={SEED_FACE} fill={palette.seedFace} />
    <path d={SEED_SHINE} fill="none" stroke={palette.seedShine} strokeWidth="3" strokeLinecap="round" />
  </>;
}

export function Tiger() {
  return <>
    <path d={TIGER_STONE} fill={palette.tiger} stroke={palette.tigerEdge} strokeWidth="4" strokeLinejoin="round" />
    <path d={TIGER_STRIPES} fill="none" stroke={palette.stripe} strokeWidth="5" strokeLinecap="round" />
    {TIGER_EYES.map(([x, y]) => <g key={x}><circle cx={x} cy={y} r="5.5" fill={palette.eye} /><circle cx={x} cy={y + 1} r="2.6" fill={palette.stripe} /></g>)}
  </>;
}

function Goats({ count }: { count: number }) {
  if (count === 1) return <Seed />;
  return <>
    {PILE_OFFSETS.slice(0, Math.min(3, count)).map(([x, y]) => <g key={`${x}${y}`} transform={`translate(${x} ${y}) scale(.8)`}><Seed /></g>)}
    <circle cx="25" cy="-25" r="15" fill={palette.badge} stroke={palette.ink} strokeWidth="2.5" />
    <text x="25" y="-23" textAnchor="middle" dominantBaseline="central" fontSize="21" fontWeight="800" fill={palette.ink}>{bn(count)}</text>
  </>;
}

type Props = {
  game: Game;
  selected: number;
  targets: readonly Move[];
  threats: readonly number[];
  hints: readonly number[];
  cursor: number;
};

export function YardBoard({ game, selected, targets, threats, hints, cursor }: Props) {
  const last = game.log[game.log.length - 1];
  const lastGoat = last && game.log.length % 2 === 1 ? last.to : -1;
  const place = (at: number) => { const [x, y] = spot(at); return `translate(${x} ${y})`; };
  const ring = (at: number, r: number, color: string, extra: Record<string, string | number> = {}, id = `${color}${at}`) => { const [x, y] = spot(at); return <circle key={id} cx={x} cy={y} r={r} fill="none" stroke={color} {...extra} />; };
  return (
    <svg className="bb-svg" viewBox={`0 0 ${BOARD} ${BOARD}`} aria-hidden="true">
      {YARD}
      {last && (() => { const [x1, y1] = spot(last.from), [x2, y2] = spot(last.to); return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={palette.ink} strokeOpacity=".35" strokeWidth="10" strokeDasharray="2 16" strokeLinecap="round" />; })()}
      {threats.map(at => ring(at, 34, palette.danger, { strokeWidth: 4, strokeDasharray: "8 7" }))}
      {targets.map(move => move.over >= 0 && ring(move.over, 34, palette.danger, { strokeWidth: 5 }))}
      {game.goats.map((count, at) => count > 0 && (
        <g key={at === lastGoat ? `a${game.log.length}` : at} transform={place(at)}>
          <g className={at === lastGoat ? "bb-arrive" : undefined} style={at === lastGoat ? { "--dx": `${spot(last.from)[0] - spot(at)[0]}px`, "--dy": `${spot(last.from)[1] - spot(at)[1]}px` } as CSSProperties : undefined}>
            <Goats count={count} />
          </g>
        </g>
      ))}
      {last && last.over >= 0 && ring(last.over, 26, palette.danger, { className: "bb-pop", strokeWidth: 6 }, `p${game.log.length}`)}
      {game.tigers.map((at, slot) => { const [x, y] = spot(at); return <g key={slot} className="bb-tiger" style={{ transform: `translate(${x}px, ${y}px)` }}><Tiger /></g>; })}
      {hints.map(at => ring(at, 43, palette.lit, { className: "bb-hint", strokeWidth: 5 }))}
      {selected >= 0 && ring(selected, 43, palette.lit, { strokeWidth: 6 })}
      {targets.map(move => { const [x, y] = spot(move.to); return <g key={`t${move.to}`}><circle cx={x} cy={y} r="24" fill={palette.lit} fillOpacity=".18" stroke={palette.lit} strokeWidth="3" strokeDasharray="6 5" /><circle cx={x} cy={y} r="11" fill={palette.lit} /></g>; })}
      {cursor >= 0 && (() => { const [x, y] = spot(cursor); return <rect x={x - 46} y={y - 46} width="92" height="92" rx="18" fill="none" stroke={palette.ink} strokeWidth="4" />; })()}
    </svg>
  );
}

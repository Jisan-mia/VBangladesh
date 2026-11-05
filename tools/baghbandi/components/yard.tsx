// The live yard, drawn as SVG. The clay, the scratched lines and the pits never change, so each world's static layer is built
// once and reused; React redraws only the pieces and marks when a move or a selection changes, never per frame.
// Moves are animated in CSS: a goat slides in from where it came, a tiger leaps in an arc over the goat it takes, and the
// taken seed flies off towards the score in the corner.
import type { CSSProperties, ReactElement, Ref } from "react";
import { BOARD, LINES, POINTS, spot, type Game, type Move } from "../lib/game";
import { bn } from "../lib/link";
import { palette, PILE_OFFSETS, ROPE, SEED, SEED_FACE, SEED_SHINE, TIGER_EYES, TIGER_STONE, TIGER_STRIPES, YARDS, type Yard } from "../lib/art";

const cache = new Map<number, ReactElement>();
/** Plastered clay with broom swirls, the lines scratched into it, and a small pit at every point. */
function staticYard(world: number) {
  const hit = cache.get(world);
  if (hit) return hit;
  const y: Yard = YARDS[world] ?? YARDS[1];
  const layer = <g>
    <rect width={BOARD} height={BOARD} rx="18" fill={y.clay} />
    <g fill="none" stroke={y.claySwirl} strokeWidth="5" strokeLinecap="round">
      <path d="M24 120Q70 40 170 26M330 474Q430 460 478 380M20 330Q30 420 120 470M380 24Q460 40 478 140" />
      <path d="M60 250Q60 140 150 80M440 250Q440 360 350 420" opacity=".6" />
    </g>
    {LINES.map(([from, to]) => {
      const [x1, y1] = spot(from), [x2, y2] = spot(to);
      return <g key={`${from}-${to}`} strokeLinecap="round">
        <line x1={x1 + 1.6} y1={y1 + 1.8} x2={x2 + 1.6} y2={y2 + 1.8} stroke={y.grooveLight} strokeWidth="4" />
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={y.groove} strokeWidth="4.5" />
      </g>;
    })}
    {Array.from({ length: POINTS }, (_, at) => { const [x, py] = spot(at); return <circle key={at} cx={x} cy={py} r="7" fill={y.pit} />; })}
  </g>;
  cache.set(world, layer);
  return layer;
}

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

export function Goats({ count }: { count: number }) {
  if (count === 1) return <Seed />;
  return <>
    {PILE_OFFSETS.slice(0, Math.min(3, count)).map(([x, y]) => <g key={`${x}${y}`} transform={`translate(${x} ${y}) scale(.8)`}><Seed /></g>)}
    <circle cx="25" cy="-25" r="15" fill={palette.badge} stroke={palette.ink} strokeWidth="2.5" />
    <text x="25" y="-23" textAnchor="middle" dominantBaseline="central" fontSize="21" fontWeight="800" fill={palette.ink}>{bn(count)}</text>
  </>;
}

/** A leap's arc: from the piece, high over the goat it takes, down on the landing point. */
function arc(move: Move) {
  const [x1, y1] = spot(move.from), [x2, y2] = spot(move.to), [mx, my] = spot(move.over);
  const dx = x2 - x1, dy = y2 - y1, length = Math.hypot(dx, dy) || 1;
  // Lift the middle sideways from the line, towards the top of the screen where it can.
  const nx = -dy / length, ny = dx / length, side = ny > 0 || (ny === 0 && nx < 0) ? -1 : 1;
  return `M${x1} ${y1}Q${mx + nx * side * 46} ${my + ny * side * 46} ${x2} ${y2}`;
}

export type YardProps = {
  game: Game;
  world: number;
  selected: number;
  targets: readonly Move[];
  threats: readonly number[];
  hints: readonly number[];
  pinned: readonly number[];
  cursor: number;
  /** The piece being dragged (hidden in place; the ghost follows the finger). */
  dragging: number;
  ghost?: Ref<SVGGElement>;
};

export function YardBoard({ game, world, selected, targets, threats, hints, pinned, cursor, dragging, ghost }: YardProps) {
  const last = game.log[game.log.length - 1];
  const index = game.log.length;
  const lastWasGoat = last !== undefined && game.goats[last.to] > 0;
  const place = (at: number) => { const [x, y] = spot(at); return `translate(${x} ${y})`; };
  const dragGoat = dragging >= 0 && game.goats[dragging] > 0;
  return (
    <svg className="bb-svg" viewBox={`0 0 ${BOARD} ${BOARD}`} aria-hidden="true">
      {staticYard(world)}
      {last && (() => { const [x1, y1] = spot(last.from), [x2, y2] = spot(last.to); return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={palette.ink} strokeOpacity=".3" strokeWidth="10" strokeDasharray="2 16" strokeLinecap="round" />; })()}
      {threats.map(at => { const [x, y] = spot(at); return <circle key={`th${at}`} className="bb-threat" cx={x} cy={y} r="34" fill="none" stroke={palette.danger} strokeWidth="4" strokeDasharray="8 7" />; })}
      {game.goats.map((count, at) => count > 0 && (
        <g key={lastWasGoat && at === last.to ? `a${index}` : at} transform={place(at)} opacity={dragGoat && at === dragging && count === 1 ? 0.35 : undefined}>
          <g className={lastWasGoat && at === last.to ? "bb-arrive" : undefined} style={lastWasGoat && at === last.to ? { "--dx": `${spot(last.from)[0] - spot(at)[0]}px`, "--dy": `${spot(last.from)[1] - spot(at)[1]}px` } as CSSProperties : undefined}>
            <Goats count={count} />
          </g>
        </g>
      ))}
      {/* the take: a dust ring where the goat stood, and the seed flying off to the score in the corner */}
      {last && last.over >= 0 && (() => {
        const [x, y] = spot(last.over);
        return <g key={`take${index}`}>
          <circle className="bb-pop" cx={x} cy={y} r="26" fill="none" stroke={palette.danger} strokeWidth="6" />
          <g transform={`translate(${x} ${y})`}><g className="bb-taken" style={{ "--fx": `${BOARD - 40 - x}px`, "--fy": `${-30 - y}px` } as CSSProperties}><Seed /></g></g>
        </g>;
      })()}
      {pinned.map(at => { const [x, y] = spot(at); return <g key={`rope${at}`} className="bb-rope" transform={`translate(${x} ${y})`}>
        <circle r="40" fill="none" stroke={ROPE.line} strokeWidth="7" strokeDasharray="13 5" />
        <circle r="40" fill="none" stroke={ROPE.shine} strokeWidth="2" strokeDasharray="6 12" />
        <path d="M28 28l12 12M34 26l8 16" stroke={ROPE.line} strokeWidth="5" strokeLinecap="round" />
      </g>; })}
      {game.tigers.map((at, slot) => {
        const [x, y] = spot(at);
        const leapt = last && last.over >= 0 && last.to === at;
        const [fx, fy] = leapt ? spot(last.from) : [x, y], [ox, oy] = leapt ? spot(last.over) : [x, y];
        const style = { transform: `translate(${x}px, ${y}px)`, "--fx": `${fx}px`, "--fy": `${fy}px`, "--mx": `${ox}px`, "--my": `${oy - 44}px`, "--tx": `${x}px`, "--ty": `${y}px` } as CSSProperties;
        return <g key={leapt ? `${slot}-${index}` : slot} className={leapt ? "bb-tiger bb-leap" : "bb-tiger"} style={style} opacity={dragging === at ? 0.35 : undefined}><Tiger /></g>;
      })}
      {hints.map(at => { const [x, y] = spot(at); return <circle key={`h${at}`} className="bb-glowring" cx={x} cy={y} r="43" fill="none" stroke={palette.lit} strokeWidth="5" />; })}
      {selected >= 0 && (() => { const [x, y] = spot(selected); return <circle cx={x} cy={y} r="43" fill="none" stroke={palette.lit} strokeWidth="6" />; })()}
      {/* where the picked piece can go: a green dot for a step; for a leap, the arc over the goat it takes, a red ring on that goat, and a bigger landing */}
      {targets.map(move => {
        const [x, y] = spot(move.to);
        if (move.over < 0) return <g key={`t${move.to}`} className="bb-target"><circle cx={x} cy={y} r="24" fill={palette.lit} fillOpacity=".18" stroke={palette.lit} strokeWidth="3" strokeDasharray="6 5" /><circle cx={x} cy={y} r="11" fill={palette.lit} /></g>;
        const [vx, vy] = spot(move.over);
        return <g key={`t${move.to}`} className="bb-target">
          <circle cx={vx} cy={vy} r="34" fill="none" stroke={palette.danger} strokeWidth="5" />
          <path d={arc(move)} fill="none" stroke={palette.danger} strokeWidth="5" strokeDasharray="10 8" strokeLinecap="round" />
          <circle cx={x} cy={y} r="30" fill={palette.danger} fillOpacity=".16" stroke={palette.danger} strokeWidth="4" />
          <circle cx={x} cy={y} r="13" fill={palette.danger} />
        </g>;
      })}
      {cursor >= 0 && (() => { const [x, y] = spot(cursor); return <rect x={x - 46} y={y - 46} width="92" height="92" rx="18" fill="none" stroke={palette.ink} strokeWidth="4" />; })()}
      {dragging >= 0 && <g ref={ghost} className="bb-ghost" transform={place(dragging)}>{dragGoat ? <Seed /> : <Tiger />}</g>}
    </svg>
  );
}

/** The start card's art: the level's own first position, small, on its world's clay. */
export function YardPreview({ game, world }: { game: Game; world: number }) {
  return (
    <svg className="bb-preview-svg" viewBox={`0 0 ${BOARD} ${BOARD}`} aria-hidden="true">
      {staticYard(world)}
      {game.goats.map((count, at) => count > 0 && <g key={at} transform={`translate(${spot(at)[0]} ${spot(at)[1]})`}><Goats count={count} /></g>)}
      {game.tigers.map(at => <g key={at} transform={`translate(${spot(at)[0]} ${spot(at)[1]})`}><Tiger /></g>)}
    </svg>
  );
}

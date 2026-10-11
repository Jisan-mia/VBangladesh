// The live quilt, drawn as SVG: about 120 small shapes, so React redraws it only when a stitch or a ghost changes, never per frame.
import { BOARD, BOX_COUNT, EDGES, MARGIN, SIZE, UNIT, type Game } from "../lib/game";
import { borderPath, FLOWERS, GUIDE, HEART, palette, STITCH } from "../lib/art";

const place = (edge: number) => {
  const { horizontal, row, col } = EDGES[edge];
  return `translate(${MARGIN + UNIT * col} ${MARGIN + UNIT * row})${horizontal ? "" : " rotate(90)"}`;
};

// Everything that never changes: the cloth, its rows of kantha ripple stitches, the scalloped edge and the needle holes.
const CLOTH = <>
  <defs>
    <pattern id="cj-ripple" width="24" height="16" patternUnits="userSpaceOnUse">
      <path d="M2 4h8M14 4h8M8 12h8M20 12h4M0 12h4" stroke={palette.ripple} strokeWidth="1.6" strokeLinecap="round" />
    </pattern>
  </defs>
  <rect width={BOARD} height={BOARD} rx="16" fill={palette.cloth} />
  <rect width={BOARD} height={BOARD} rx="16" fill="url(#cj-ripple)" />
  <path d={borderPath(BOARD)} fill="none" stroke={palette.border} strokeWidth="3.5" strokeDasharray="9 7" strokeLinecap="round" />
</>;
const HOLES = <g>{Array.from({ length: (SIZE + 1) ** 2 }, (_, i) => {
  const x = MARGIN + UNIT * (i % (SIZE + 1)), y = MARGIN + UNIT * Math.floor(i / (SIZE + 1));
  return <g key={i}><circle cx={x} cy={y} r="8.5" fill={palette.hole} /><circle cx={x} cy={y} r="4.6" fill={palette.thread} /></g>;
})}</g>;

export function Flower({ player, mark }: { player: 0 | 1; mark: string }) {
  return <>
    <path d={FLOWERS[player]} fill={palette.players[player]} />
    <path d={FLOWERS[player]} transform="scale(.78)" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="2" strokeDasharray="3.5 3.5" />
    <circle r={HEART} fill={palette.heart} stroke={palette.players[player]} strokeWidth="2.2" strokeDasharray="3 3" />
    {mark && <text y="1.5" textAnchor="middle" dominantBaseline="central" fontSize={mark.length > 2 ? 15 : 21} fontWeight="700" fill={palette.ink}>{mark}</text>}
  </>;
}

type Props = { game: Game; marks: readonly [string, string]; ghost: number; cursor: number; hint: number; recent: readonly number[]; mover: 0 | 1 };

export function QuiltBoard({ game, marks, ghost, cursor, hint, recent, mover }: Props) {
  const stitches: number[] = [], gaps: number[] = [];
  game.drawn.forEach((done, edge) => (done ? stitches : gaps).push(edge));
  return (
    <svg className="cj-svg" viewBox={`0 0 ${BOARD} ${BOARD}`} aria-hidden="true">
      {CLOTH}
      {gaps.map(edge => <line key={edge} transform={place(edge)} x1={STITCH.from} x2={STITCH.to} y1="0" y2="0" stroke={palette.guide} strokeWidth={GUIDE.width} strokeDasharray={GUIDE.dash.join(" ")} strokeLinecap="round" />)}
      {Array.from({ length: BOX_COUNT }, (_, box) => {
        const who = game.owner[box];
        if (who < 0) return null;
        const x = MARGIN + UNIT * (box % SIZE + 0.5), y = MARGIN + UNIT * (Math.floor(box / SIZE) + 0.5);
        return <g key={box} transform={`translate(${x} ${y})`}>
          <rect x="-43" y="-43" width="86" height="86" rx="6" fill={palette.tints[who]} />
          <g className="cj-bloom"><Flower player={who as 0 | 1} mark={marks[who]} /></g>
        </g>;
      })}
      {recent.map(edge => <line key={`r${edge}`} className="cj-recent" transform={place(edge)} x1="6" x2="94" y1="0" y2="0" stroke={palette.highlight} strokeWidth="20" strokeLinecap="round" />)}
      {stitches.map(edge => <g key={edge} transform={place(edge)}><g className="cj-sew">
        <line x1={STITCH.from} x2={STITCH.to} y1="0" y2="0" stroke={palette.thread} strokeWidth={STITCH.width} strokeDasharray={STITCH.dash.join(" ")} strokeLinecap="round" />
        <line x1={STITCH.from} x2={STITCH.to} y1="-1.6" y2="-1.6" stroke={palette.shine} strokeWidth="1.8" strokeDasharray={STITCH.dash.join(" ")} strokeLinecap="round" />
      </g></g>)}
      {hint >= 0 && ghost < 0 && <line className="cj-hint" transform={place(hint)} x1={STITCH.from} x2={STITCH.to} y1="0" y2="0" stroke={palette.players[0]} strokeWidth={STITCH.width} strokeDasharray={STITCH.dash.join(" ")} strokeLinecap="round" />}
      {ghost >= 0 && <line transform={place(ghost)} x1={STITCH.from} x2={STITCH.to} y1="0" y2="0" stroke={palette.players[mover]} strokeOpacity=".6" strokeWidth={STITCH.width + 1} strokeDasharray={STITCH.dash.join(" ")} strokeLinecap="round" />}
      {cursor >= 0 && <rect className="cj-cursor" transform={place(cursor)} x="5" y="-15" width="90" height="30" rx="15" fill={game.drawn[cursor] ? "none" : `${palette.players[mover]}22`} stroke={palette.ink} strokeWidth="3" />}
      {HOLES}
    </svg>
  );
}

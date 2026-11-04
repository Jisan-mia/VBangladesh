// The live quilt, drawn as SVG on the world's look: under 300 small shapes, split into memoised layers, so a held stitch or the
// cursor redraws only the top layer, and the cloth, its stitches and its motifs redraw only when a stitch lands.
import { memo, useId } from "react";
import { LOOKS, MARKS, MOTIFS, STITCH, GUIDE, borderRect, type Look } from "../lib/art";
import { MARGIN, UNIT, worth, type Game, type Geometry, type Setup } from "../lib/quilt";
import { bn } from "../lib/challenge";

const place = (g: Geometry, edge: number) => `translate(${MARGIN + UNIT * g.col[edge]} ${MARGIN + UNIT * g.row[edge]})${g.horizontal[edge] ? "" : " rotate(90)"}`;
const boxAt = (g: Geometry, box: number) => [MARGIN + UNIT * (box % g.cols + 0.5), MARGIN + UNIT * (Math.floor(box / g.cols) + 0.5)] as const;

/** One motif: the shape in its thread colour, a white running stitch inside it, and the initial on a gold disc. */
export function Motif({ world, player, mark, look }: { world: number; player: 0 | 1; mark: string; look: Look }) {
  const d = MOTIFS[world][player], [mx, my, mr] = MARKS[world][player];
  return <>
    <path d={d} fill={look.players[player]} />
    <path d={d} transform="scale(.78)" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="2" strokeDasharray="3.5 3.5" />
    <circle cx={mx} cy={my} r={mr} fill={look.heart} stroke={look.players[player]} strokeWidth="2.2" strokeDasharray="3 3" />
    {mark && <text x={mx} y={my + 1.5} textAnchor="middle" dominantBaseline="central" fontSize={(mark.length > 2 ? 15 : 21) * mr / 17} fontWeight="700" fill={look.ink}>{mark}</text>}
  </>;
}

/** The cloth: ripple rows of kantha stitches, the scalloped border, and the zari frame of every জরির ঘর. */
const ClothBase = memo(function ClothBase({ setup, world, id }: { setup: Setup; world: number; id: string }) {
  const look = LOOKS[world], width = 2 * MARGIN + setup.cols * UNIT, height = 2 * MARGIN + setup.rows * UNIT;
  return <>
    <defs>
      <pattern id={id} width="24" height="16" patternUnits="userSpaceOnUse">
        <path d="M2 4h8M14 4h8M8 12h8M20 12h4M0 12h4" stroke={look.ripple} strokeWidth="1.6" strokeLinecap="round" />
      </pattern>
    </defs>
    <rect width={width} height={height} rx="16" fill={look.cloth} />
    <rect width={width} height={height} rx="16" fill={`url(#${id})`} />
    <path d={borderRect(width, height)} fill="none" stroke={look.border} strokeWidth="3.5" strokeDasharray="9 7" strokeLinecap="round" />
    {(setup.gold ?? []).map(box => {
      const x = MARGIN + UNIT * (box % setup.cols), y = MARGIN + UNIT * Math.floor(box / setup.cols);
      return <g key={box} className="cj-zari">
        <rect x={x + 10} y={y + 10} width={UNIT - 20} height={UNIT - 20} rx="8" fill={`${look.gold}1a`} stroke={look.gold} strokeWidth="3" strokeDasharray="6 5" />
        <text x={x + UNIT / 2} y={y + UNIT / 2 + 2} textAnchor="middle" dominantBaseline="central" fontSize="24" fontWeight="800" fill={look.gold}>×২</text>
      </g>;
    })}
  </>;
});

/** Holes on top of everything, so every stitch looks pulled through the cloth. */
const Holes = memo(function Holes({ cols, rows, world }: { cols: number; rows: number; world: number }) {
  const look = LOOKS[world], out = [];
  for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) {
    const x = MARGIN + UNIT * c, y = MARGIN + UNIT * r;
    out.push(<g key={`${r}-${c}`}><circle cx={x} cy={y} r="8.5" fill={look.hole} /><circle cx={x} cy={y} r="4.6" fill={look.thread} /></g>);
  }
  return <g>{out}</g>;
});

/** Everything that changes only when a stitch lands: the guides on open gaps, the stitches, the closed boxes and the bot's last stitches. */
const Sewn = memo(function Sewn({ game, world, marks, recent }: { game: Game; world: number; marks: readonly [string, string]; recent: readonly number[] }) {
  const g = game.geo, look = LOOKS[world], gaps = [], stitches = [], boxes = [];
  for (let edge = 0; edge < g.edges; edge++) {
    if (!game.drawn[edge]) {
      gaps.push(<line key={edge} transform={place(g, edge)} x1={STITCH.from} x2={STITCH.to} y1="0" y2="0" stroke={look.guide} strokeWidth={GUIDE.width} strokeDasharray={GUIDE.dash.join(" ")} strokeLinecap="round" />);
      continue;
    }
    stitches.push(<g key={edge} transform={place(g, edge)}><g className="cj-sew">
      <line x1={STITCH.from} x2={STITCH.to} y1="0" y2="0" stroke={look.thread} strokeWidth={STITCH.width} strokeDasharray={STITCH.dash.join(" ")} strokeLinecap="round" />
      <line x1={STITCH.from} x2={STITCH.to} y1="-1.6" y2="-1.6" stroke={look.shine} strokeWidth="1.8" strokeDasharray={STITCH.dash.join(" ")} strokeLinecap="round" />
    </g></g>);
  }
  for (let box = 0; box < g.boxes; box++) {
    const who = game.owner[box];
    if (who !== 0 && who !== 1) continue;
    const [x, y] = boxAt(g, box), gold = worth(game.setup, box) === 2;
    boxes.push(<g key={box} transform={`translate(${x} ${y})`}>
      <rect className="cj-tint" x="-43" y="-43" width="86" height="86" rx="6" fill={look.tints[who]} />
      {gold && <circle className="cj-ring" r="44" fill="none" stroke={look.gold} strokeWidth="4" strokeDasharray="7 5" />}
      <g className="cj-bloom"><Motif world={world} player={who} mark={marks[who]} look={look} /></g>
      <circle className="cj-burst" r="30" fill="none" stroke={gold ? look.gold : look.players[who]} strokeWidth="5" />
    </g>);
  }
  return <>
    {gaps}
    {boxes}
    {recent.map(edge => <line key={`r${edge}`} className="cj-recent" transform={place(g, edge)} x1="6" x2="94" y1="0" y2="0" stroke={look.highlight} strokeWidth="20" strokeLinecap="round" />)}
    {stitches}
  </>;
});

export type ClothProps = {
  game: Game;
  world: number;
  marks: readonly [string, string];
  /** The other side's last stitches, highlighted. */
  recent?: readonly number[];
  /** The stitch under a finger, the armed one, the keyboard cursor and the pulsing hint (-1 for none). */
  ghost?: number;
  armed?: number;
  cursor?: number;
  hint?: number;
  /** Boxes the other side would take after the held or armed stitch, and how many flowers that is. */
  warn?: readonly number[];
  gift?: number;
  mover?: 0 | 1;
  className?: string;
};

export function ClothBoard({ game, world, marks, recent = [], ghost = -1, armed = -1, cursor = -1, hint = -1, warn = [], gift = 0, mover = 0, className = "cj-svg" }: ClothProps) {
  const id = useId().replace(/:/g, "");
  const g = game.geo, look = LOOKS[world];
  const shown = ghost >= 0 ? ghost : armed;
  const risky = shown >= 0 && warn.length > 0;
  return (
    <svg className={className} viewBox={`0 0 ${g.width} ${g.height}`} aria-hidden="true">
      <ClothBase setup={game.setup} world={world} id={`cj-r${id}`} />
      <Sewn game={game} world={world} marks={marks} recent={recent} />
      {risky && <g className="cj-warn">
        {warn.map(box => { const [x, y] = boxAt(g, box); return <rect key={box} x={x - 44} y={y - 44} width="88" height="88" rx="8" fill="#d6332a2e" stroke="#c0392b" strokeWidth="3" strokeDasharray="8 6" />; })}
        {(() => { const [x, y] = boxAt(g, warn[0]); return <g transform={`translate(${x + 30} ${y - 30})`}><circle r="19" fill="#c0392b" /><text y="1.5" textAnchor="middle" dominantBaseline="central" fontSize="22" fontWeight="800" fill="#fff">{bn(gift)}</text></g>; })()}
      </g>}
      {hint >= 0 && shown < 0 && <line className="cj-hint" transform={place(g, hint)} x1={STITCH.from} x2={STITCH.to} y1="0" y2="0" stroke={look.players[mover]} strokeWidth={STITCH.width} strokeDasharray={STITCH.dash.join(" ")} strokeLinecap="round" />}
      {shown >= 0 && <line className={shown === armed ? "cj-armed" : undefined} transform={place(g, shown)} x1={STITCH.from} x2={STITCH.to} y1="0" y2="0"
        stroke={risky ? "#c0392b" : look.players[mover]} strokeOpacity={risky ? 0.9 : 0.6} strokeWidth={STITCH.width + 1} strokeDasharray={risky ? "5 7" : STITCH.dash.join(" ")} strokeLinecap="round" />}
      {cursor >= 0 && <rect className="cj-cursor" transform={place(g, cursor)} x="5" y="-15" width="90" height="30" rx="15" fill={game.drawn[cursor] ? "none" : `${look.players[mover]}22`} stroke={look.ink} strokeWidth="3" />}
      <Holes cols={g.cols} rows={g.rows} world={world} />
    </svg>
  );
}

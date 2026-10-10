import { ARCH, archBody, halo, lampPieces, lampSpots, LAMPS, type Piece } from "../lib/arch";

function Layer({ piece }: { piece: Piece }) {
  const path = <path d={piece.d} fill={piece.fill ?? "none"} stroke={piece.stroke} strokeWidth={piece.width} strokeLinecap="round" strokeLinejoin="round" />;
  return piece.at ? <g transform={`translate(${piece.at[0]} ${piece.at[1]}) rotate(${piece.at[2]})`}>{path}</g> : path;
}

/** The চালচিত্র arch on the page; the card draws the same pieces on canvas. Each lamp carries both states so CSS can animate the switch. */
export function ArchArt({ count }: { count: number }) {
  return (
    <svg className="mp-arch-art" viewBox={`0 0 ${ARCH.width} ${ARCH.height}`} aria-hidden="true" focusable="false">
      <g className="mp-halo" data-on={count > LAMPS}>{halo.map((piece, index) => <Layer key={index} piece={piece} />)}</g>
      {archBody.map((piece, index) => <Layer key={index} piece={piece} />)}
      {lampSpots.map(([x, y], index) => (
        <g key={index} transform={`translate(${x} ${y + 10})`}>
          <g className="mp-lamp" data-lit={index < count}>
            <g className="mp-lamp-off">{lampPieces.unlit.map((piece, layer) => <Layer key={layer} piece={piece} />)}</g>
            <g className="mp-lamp-on">{lampPieces.lit.map((piece, layer) => <Layer key={layer} piece={piece} />)}</g>
          </g>
        </g>
      ))}
    </svg>
  );
}

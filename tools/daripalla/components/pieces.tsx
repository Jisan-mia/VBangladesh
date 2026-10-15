import { bn, FRUITS, type Piece } from "../lib/game";
import { FRUIT_ART, StarBagArt, WeightArt } from "./art";

/** A word for a piece, for screen readers and the parent. */
export function pieceName(piece: Piece, reveal: boolean | number = false) {
  if (piece.kind === "weight") return `${bn(piece.value)}-এর বাটখারা`;
  if (piece.kind === "star") return typeof reveal === "number" ? `★, ধরে দেখা ${bn(reveal)}` : "★ ঠোঙা";
  return piece.hidden && reveal === false ? `${FRUITS[piece.fruit].name}, ওজন জানা নেই` : `${FRUITS[piece.fruit].name}, ওজন ${bn(piece.value)}`;
}

/**
 * One thing on a pan or in the tray. `reveal`: false keeps an unknown's "?", true shows its weight,
 * a number shows a ★'s try. Bigger weights are drawn a little bigger.
 */
export function PieceView({ piece, reveal = false }: { piece: Piece; reveal?: boolean | number }) {
  if (piece.kind === "weight") {
    const scale = Math.min(1, 0.62 + Math.log10(piece.value + 1) * 0.36);
    return <span className="dp-piece dp-weight" style={{ ["--s" as string]: scale }}><WeightArt /><b>{bn(piece.value)}</b></span>;
  }
  if (piece.kind === "star") {
    return <span className="dp-piece dp-fruit"><StarBagArt /><i className={typeof reveal === "number" ? "tried" : ""}>{typeof reveal === "number" ? bn(reveal) : "?"}</i></span>;
  }
  const shown = !piece.hidden || reveal === true;
  return <span className="dp-piece dp-fruit">{FRUIT_ART[piece.fruit]()}<i className={shown ? "" : "unknown"}>{shown ? bn(piece.value) : "?"}</i></span>;
}

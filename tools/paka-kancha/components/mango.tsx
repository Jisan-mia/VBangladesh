import { BLUSH, BODY, HALF, HALF_SKIN, LEAF, RAW_SCALE, SEED, STEM, colors } from "../lib/mango";
import type { Mark } from "../lib/rules";

/** The paths of one mango in a 40×40 box, for an <svg> or a <g transform>. */
export function MangoPaths({ mark }: { mark: Mark }) {
  if (mark === "p") return <>
    <path d={BODY} fill={colors.ripe} stroke={colors.ripeEdge} strokeWidth="1.6" />
    <ellipse cx={BLUSH.cx} cy={BLUSH.cy} rx={BLUSH.rx} ry={BLUSH.ry} transform={`rotate(${BLUSH.angle * 57.3} ${BLUSH.cx} ${BLUSH.cy})`} fill={colors.blush} opacity=".5" />
    <path d={STEM} stroke={colors.stem} strokeWidth="2" fill="none" />
    <path d={LEAF} fill={colors.leaf} />
  </>;
  if (mark === "a") return <>
    <path d={HALF} fill={colors.flesh} />
    <path d={SEED} fill={colors.seed} />
    <path d={HALF_SKIN} fill="none" stroke={colors.skin} strokeWidth="3.2" />
    <path d="M13 5V37" stroke={colors.fleshEdge} strokeWidth="1.6" />
  </>;
  return <path d={BODY} transform={`translate(${20 * (1 - RAW_SCALE)} ${21 * (1 - RAW_SCALE)}) scale(${RAW_SCALE})`} fill={colors.rawFill} stroke={colors.raw} strokeWidth="2.4" strokeDasharray="3.5 2.6" />;
}

/** The three mangoes differ by shape, not only colour: a whole ripe mango with a leaf, a mango cut in half, a small hollow raw one. */
export function Mango({ mark }: { mark: Mark }) {
  return <svg className="pk-mango" viewBox="0 0 40 40" aria-hidden="true" focusable="false" strokeLinejoin="round" strokeLinecap="round"><MangoPaths mark={mark} /></svg>;
}

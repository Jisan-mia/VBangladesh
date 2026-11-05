// Small pictures the screens share: layered code art, the fraction written the school way, the ghost finger, and the
// picture hint for a wrong cut (guests above, pieces below, the ones with no partner drawn dashed).
import { FRACTIONS, bn } from "../lib/people";
import type { Layer } from "../lib/shapes";

/** Draws a picture from the shared path layers (the card paints the same layers on canvas). */
export function Pic({ layers, className }: { layers: Layer[]; className?: string }) {
  return <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
    {layers.map((layer, index) => <path key={index} d={layer.d} fill={layer.fill ?? "none"} stroke={layer.stroke} strokeWidth={layer.w} strokeLinecap="round" strokeLinejoin="round" />)}
  </svg>;
}

/** ১/২ written the school way, one over the other. */
export function Frac({ parts }: { parts: number }) {
  return <span className="sb-frac" role="img" aria-label={FRACTIONS[parts].word}><b>{bn(1)}</b><b>{bn(parts)}</b></span>;
}

/** The ghost finger that shows the first tap, with a ripple where it lands. */
export function Finger() {
  return <svg className="sb-finger" viewBox="0 0 48 60" aria-hidden="true">
    <circle className="sb-ripple" cx="19" cy="9" r="4" />
    <path d="M14 30V8a5 5 0 0 1 10 0v16l12 2a6 6 0 0 1 5 7l-2 13a10 10 0 0 1-10 9H19a9 9 0 0 1-7-4L3 39a4.5 4.5 0 0 1 7-5z" fill="#fff" stroke="#2b2433" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>;
}

/** The rug under everything: woven stripes in the world's colour. */
export function Weave() { return <span className="sb-weave" aria-hidden="true" />; }

const WEDGE_FILL = "#ebc584";
/** A slice of a roti cut into `parts`, drawn point-down and centred in a 100-unit box, so a row of slices reads as pieces. */
const slice = (parts: number) => {
  const half = Math.PI / parts, r = Math.min(70, 44 / Math.sin(half)), x = Math.sin(half) * r, y = Math.cos(half) * r, top = 50 - r / 2;
  return `M50 ${top.toFixed(1)}L${(50 - x).toFixed(1)} ${(top + y).toFixed(1)}A${r.toFixed(1)} ${r.toFixed(1)} 0 0 0 ${(50 + x).toFixed(1)} ${(top + y).toFixed(1)}Z`;
};
/**
 * "One piece for each guest": a row of heads (the guests) over the pieces the wrong cut made. A head with no piece, or a piece with
 * no head, is drawn dashed, so a child sees what is missing or extra without reading a number.
 */
export function CutWhy({ guests, parts }: { guests: number; parts: number }) {
  const slots = Math.max(guests, parts), cell = 52;
  return <svg className="sb-why" viewBox={`0 0 ${slots * cell} 118`} role="img" aria-label={`${bn(guests)} জন মেহমান, ${bn(parts)} টুকরো`}>
    {Array.from({ length: slots }, (_, at) => {
      const x = at * cell + cell / 2, head = at < guests, piece = at < parts, line = head ? undefined : "4 4";
      return <g key={at}>
        <circle cx={x} cy="18" r="13" fill={head ? "#d39a6a" : "none"} stroke="#6e5444" strokeWidth="2.5" strokeDasharray={line} />
        <path d={`M${x - 18} 46C${x - 17} 34 ${x + 17} 34 ${x + 18} 46`} fill="none" stroke="#6e5444" strokeWidth="2.5" strokeDasharray={line} strokeLinecap="round" />
        <path d={`M${x} 52V62`} stroke="#a1927a" strokeWidth="2.5" strokeDasharray={head && piece ? undefined : "3 3"} />
        <svg x={x - 24} y="64" width="48" height="48" viewBox="0 0 100 100">
          {piece ? <path d={slice(Math.max(parts, 2))} fill={WEDGE_FILL} stroke="#b98a3e" strokeWidth="4" strokeLinejoin="round" /> : <circle cx="50" cy="50" r="28" fill="none" stroke="#a1927a" strokeWidth="4" strokeDasharray="6 6" />}
        </svg>
      </g>;
    })}
  </svg>;
}

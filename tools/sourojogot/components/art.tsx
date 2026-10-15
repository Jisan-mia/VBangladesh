// Original SVG art: planets, the rocket, the football Sun, the things to compare against, and the ghost finger.
import { THINGS, type Planet, type Thing } from "../lib/planets";

/** A planet in a box of `box` units, centred; Saturn's ring may spill past the box. */
export function PlanetArt({ planet, box = 80, r = planet.drawR, ring = 1.9 }: { planet: Planet; box?: number; r?: number; ring?: number }) {
  const c = box / 2, id = `sj-g-${planet.id}-${box}-${Math.round(r)}`;
  return <svg viewBox={`0 0 ${box} ${box}`} width="100%" height="100%" overflow="visible" aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id={id} cx="35%" cy="32%" r="70%"><stop offset="0" stopColor={planet.color} /><stop offset="1" stopColor={planet.shade} /></radialGradient>
      <clipPath id={`${id}-clip`}><circle cx={c} cy={c} r={r} /></clipPath>
    </defs>
    {planet.id === "saturn" && <path d={`M ${c - r * ring} ${c} A ${r * ring} ${r * 0.5} 0 0 1 ${c + r * ring} ${c}`} transform={`rotate(-14 ${c} ${c})`} fill="none" stroke={planet.shade} strokeWidth={r * 0.22} />}
    <circle cx={c} cy={c} r={r} fill={`url(#${id})`} />
    {planet.id === "jupiter" && <g fill="#b8743f" opacity=".55" clipPath={`url(#${id}-clip)`}>
      <rect x={c - r} y={c - r * 0.45} width={r * 2} height={r * 0.14} />
      <rect x={c - r} y={c - r * 0.1} width={r * 2} height={r * 0.14} />
      <rect x={c - r} y={c + r * 0.3} width={r * 2} height={r * 0.14} />
    </g>}
    {planet.id === "jupiter" && <ellipse cx={c + r * 0.3} cy={c + r * 0.42} rx={r * 0.17} ry={r * 0.09} fill="#c4553a" />}
    {planet.id === "earth" && <g fill="#4caf6a" clipPath={`url(#${id}-clip)`}>
      <ellipse cx={c - r * 0.3} cy={c - r * 0.2} rx={r * 0.38} ry={r * 0.26} transform={`rotate(34 ${c - r * 0.3} ${c - r * 0.2})`} />
      <ellipse cx={c + r * 0.35} cy={c + r * 0.35} rx={r * 0.28} ry={r * 0.2} transform={`rotate(-23 ${c + r * 0.35} ${c + r * 0.35})`} />
    </g>}
    {planet.id === "saturn" && <path d={`M ${c - r * ring} ${c} A ${r * ring} ${r * 0.5} 0 0 0 ${c + r * ring} ${c}`} transform={`rotate(-14 ${c} ${c})`} fill="none" stroke={planet.shade} strokeWidth={r * 0.22} />}
  </svg>;
}

/** A small round rocket with a window, nose up and right. */
export function Rocket() {
  return <svg viewBox="0 0 40 40" width="100%" height="100%" aria-hidden="true" focusable="false">
    <g transform="rotate(45 20 20)">
      <path d="M20 3 C27 10 27 24 25 30 H15 C13 24 13 10 20 3 Z" fill="#f4f1ea" stroke="#2c3768" strokeWidth="1.5" />
      <circle cx="20" cy="15" r="3.6" fill="#7cc6ff" stroke="#2c3768" strokeWidth="1.2" />
      <path d="M15 22 L10 30 H15 Z M25 22 L30 30 H25 Z" fill="#e5533d" />
      <path d="M17 31 Q20 39 23 31 Z" fill="#ffb238" />
    </g>
  </svg>;
}

/** The ghost finger that shows the first tap: a soft round hand pointing down-left. */
export function GhostFinger() {
  return <svg viewBox="0 0 48 56" width="100%" height="100%" aria-hidden="true" focusable="false">
    <path d="M14 6 C14 2 20 2 20 6 V24 L22 23 C22 19 28 19 28 23 V25 C28 21 34 21 34 25 V27 C34 23 40 23 40 27 V40 C40 48 34 53 26 53 H22 C15 53 10 48 8 42 L4 32 C3 28 8 26 10 30 L14 36 Z"
      fill="#fff" stroke="#2c3768" strokeWidth="2.4" strokeLinejoin="round" />
  </svg>;
}

/** A football: the Sun in the scale rounds. */
export function Football({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const s = r / 70;
  return <g>
    <circle cx={cx} cy={cy} r={r} fill="#fff" stroke="#2c3768" strokeWidth={2.5 * s} />
    <path d={`M ${cx} ${cy - 22 * s} L ${cx + 21 * s} ${cy - 7 * s} L ${cx + 13 * s} ${cy + 18 * s} H ${cx - 13 * s} L ${cx - 21 * s} ${cy - 7 * s} Z`} fill="#2c3768" />
    {[0, 72, 144, 216, 288].map(angle => <g key={angle} transform={`rotate(${angle} ${cx} ${cy})`}>
      <line x1={cx} y1={cy - 22 * s} x2={cx} y2={cy - 46 * s} stroke="#2c3768" strokeWidth={2 * s} />
      <path d={`M ${cx - 16 * s} ${cy - 60 * s} L ${cx} ${cy - 46 * s} L ${cx + 16 * s} ${cy - 60 * s} Q ${cx} ${cy - 72 * s} ${cx - 16 * s} ${cy - 60 * s} Z`} fill="#2c3768" />
    </g>)}
  </g>;
}

/** Icon size grows with the log of the real size, so the order shows without giving the answer away. */
export const thingRadius = (thing: Thing) => 6 + 9 * Math.log10(thing.sizeMm / THINGS[0].sizeMm);

export function ThingArt({ thing }: { thing: Thing }) {
  const r = thingRadius(thing);
  const fill = { sand: "#d9b77c", mustard: "#c99a2e", pea: "#6fb54a", marble: "#7cc6ff", orange: "#f39a2b" }[thing.id];
  return <svg viewBox="0 0 56 56" width="100%" height="100%" aria-hidden="true" focusable="false">
    <circle cx="28" cy="28" r={r} fill={fill} stroke="#2c3768" strokeWidth="1.5" />
    {thing.id === "marble" && <path d={`M ${28 - r * 0.6} ${28 + r * 0.1} Q 28 ${28 - r * 0.7} ${28 + r * 0.6} ${28 + r * 0.2}`} fill="none" stroke="#fff" strokeWidth="2.5" />}
    {thing.id === "orange" && <path d="M28 5 q4 -3 8 0 q-4 3 -8 0" fill="#4a9d40" />}
  </svg>;
}

export function ZoneArt({ zone }: { zone: "field" | "street" | "far" }) {
  if (zone === "field") return <svg viewBox="0 0 56 56" width="100%" height="100%" aria-hidden="true" focusable="false">
    <rect x="4" y="14" width="48" height="30" rx="3" fill="#69b65a" stroke="#2c3768" strokeWidth="1.5" />
    <line x1="28" y1="14" x2="28" y2="44" stroke="#fff" strokeWidth="1.5" /><circle cx="28" cy="29" r="6" fill="none" stroke="#fff" strokeWidth="1.5" />
  </svg>;
  if (zone === "street") return <svg viewBox="0 0 56 56" width="100%" height="100%" aria-hidden="true" focusable="false">
    <path d="M6 44 V28 L16 20 L26 28 V44 Z M30 44 V24 L40 16 L50 24 V44 Z" fill="#f2d7a6" stroke="#2c3768" strokeWidth="1.5" />
    <rect x="13" y="34" width="6" height="10" fill="#b5652d" /><rect x="37" y="32" width="6" height="12" fill="#b5652d" />
  </svg>;
  return <svg viewBox="0 0 56 56" width="100%" height="100%" aria-hidden="true" focusable="false">
    <path d="M2 44 H54" stroke="#2c3768" strokeWidth="1.5" />
    <path d="M6 44 V36 L10 32 L14 36 V44 Z M20 44 V34 L24 30 L28 34 V44 Z" fill="#f2d7a6" stroke="#2c3768" strokeWidth="1.2" />
    <circle cx="40" cy="30" r="8" fill="#4a9d40" /><rect x="39" y="36" width="2.5" height="8" fill="#7a4a24" />
    <circle cx="50" cy="34" r="5" fill="#4a9d40" />
  </svg>;
}

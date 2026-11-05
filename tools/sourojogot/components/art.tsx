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
    {planet.id === "mercury" && <g fill={planet.shade} opacity=".55" clipPath={`url(#${id}-clip)`}>
      <circle cx={c - r * 0.3} cy={c - r * 0.1} r={r * 0.2} /><circle cx={c + r * 0.35} cy={c + r * 0.3} r={r * 0.15} /><circle cx={c + r * 0.1} cy={c - r * 0.5} r={r * 0.1} />
    </g>}
    {planet.id === "venus" && <g fill="none" stroke="#fff3cf" strokeWidth={r * 0.1} opacity=".55" clipPath={`url(#${id}-clip)`}>
      <path d={`M ${c - r} ${c - r * 0.3} Q ${c} ${c - r * 0.7} ${c + r} ${c - r * 0.2}`} /><path d={`M ${c - r} ${c + r * 0.25} Q ${c} ${c - r * 0.1} ${c + r} ${c + r * 0.4}`} />
    </g>}
    {planet.id === "mars" && <g clipPath={`url(#${id}-clip)`}>
      <ellipse cx={c} cy={c - r * 0.92} rx={r * 0.5} ry={r * 0.24} fill="#fff" opacity=".85" />
      <ellipse cx={c - r * 0.25} cy={c + r * 0.15} rx={r * 0.4} ry={r * 0.18} fill={planet.shade} opacity=".5" />
    </g>}
    {planet.id === "uranus" && <ellipse cx={c} cy={c} rx={r * 0.28} ry={r * 1.35} fill="none" stroke="#e8fbff" strokeWidth={r * 0.07} opacity=".8" transform={`rotate(14 ${c} ${c})`} />}
    {planet.id === "neptune" && <g clipPath={`url(#${id}-clip)`}>
      <rect x={c - r} y={c - r * 0.35} width={r * 2} height={r * 0.1} fill="#a9c4ff" opacity=".5" />
      <ellipse cx={c - r * 0.25} cy={c + r * 0.2} rx={r * 0.24} ry={r * 0.13} fill="#1a2f78" opacity=".75" />
    </g>}
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

/** The porthole clue for each planet: a small picture scene in a 120-unit box, drawn to be told apart at a glance. */
export function ClueArt({ planet }: { planet: Planet["id"] }) {
  const stroke = { stroke: "#2c3768", strokeWidth: 2, strokeLinejoin: "round" as const };
  return <svg viewBox="0 0 120 120" width="100%" height="100%" aria-hidden="true" focusable="false">
    {planet === "mercury" && <g>
      <circle cx="10" cy="60" r="52" fill="#ffc93c" opacity=".95" /><circle cx="10" cy="60" r="40" fill="#fff3b0" />
      <circle cx="82" cy="60" r="13" fill="#a8a49c" {...stroke} /><circle cx="78" cy="56" r="3" fill="#6f6b64" /><circle cx="86" cy="65" r="2.4" fill="#6f6b64" />
    </g>}
    {planet === "venus" && <g>
      <rect x="52" y="14" width="16" height="64" rx="8" fill="#fff" {...stroke} /><circle cx="60" cy="86" r="16" fill="#e5533d" {...stroke} />
      <rect x="56.5" y="36" width="7" height="48" rx="3.5" fill="#e5533d" />
      {[0, 1, 2].map(i => <path key={`a${i}`} d={`M ${22 + i * 8} 96 q -6 -8 0 -16 q 6 -8 0 -16`} fill="none" stroke="#ff9d3a" strokeWidth="3.2" strokeLinecap="round" />)}
      {[0, 1, 2].map(i => <path key={`b${i}`} d={`M ${84 + i * 8} 96 q -6 -8 0 -16 q 6 -8 0 -16`} fill="none" stroke="#ff9d3a" strokeWidth="3.2" strokeLinecap="round" />)}
    </g>}
    {planet === "earth" && <g>
      <path d="M0 84 Q30 76 60 84 T120 84 V120 H0 Z" fill="#4caf6a" />
      <path d="M0 100 q15 -7 30 0 t30 0 t30 0 t30 0 V120 H0 Z" fill="#3b82d6" />
      <path d="M28 86 V62 L48 46 L68 62 V86 Z" fill="#f2d7a6" {...stroke} /><rect x="42" y="68" width="12" height="18" fill="#b5652d" /><path d="M22 64 L48 40 L74 64" fill="none" stroke="#c4553a" strokeWidth="6" strokeLinejoin="round" />
      <rect x="90" y="62" width="6" height="26" fill="#7a4a24" /><circle cx="93" cy="54" r="15" fill="#2f8a4a" {...stroke} />
    </g>}
    {planet === "mars" && <g>
      <rect x="0" y="0" width="120" height="120" fill="#f3b48a" opacity=".55" />
      <path d="M0 96 L28 66 L52 90 L80 56 L120 98 V120 H0 Z" fill="#cf5b3f" {...stroke} /><path d="M0 108 Q60 92 120 108 V120 H0 Z" fill="#93371f" />
      <rect x="44" y="86" width="26" height="10" rx="3" fill="#e9e4da" {...stroke} /><circle cx="50" cy="100" r="5" fill="#2c3768" /><circle cx="66" cy="100" r="5" fill="#2c3768" /><path d="M58 86 V74 h8" fill="none" stroke="#2c3768" strokeWidth="2.4" />
    </g>}
    {planet === "jupiter" && <g>
      <circle cx="50" cy="62" r="46" fill="#d9a066" {...stroke} />
      <g fill="#b8743f" opacity=".6"><rect x="4" y="38" width="92" height="9" /><rect x="4" y="58" width="92" height="9" /><rect x="4" y="80" width="92" height="8" /></g>
      <ellipse cx="66" cy="84" rx="10" ry="6" fill="#c4553a" />
      <circle cx="108" cy="96" r="5" fill="#3b82d6" {...stroke} />
    </g>}
    {planet === "saturn" && <g>
      <ellipse cx="60" cy="64" rx="54" ry="18" fill="none" stroke="#b39550" strokeWidth="9" transform="rotate(-14 60 64)" />
      <circle cx="60" cy="64" r="21" fill="#e6cc8a" {...stroke} />
      <path d="M8 66 A54 18 0 0 0 112 66" fill="none" stroke="#b39550" strokeWidth="9" transform="rotate(-14 60 64)" />
      {[[16, 54], [100, 74], [30, 80], [92, 50]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="3" fill="#fff" opacity=".9" />)}
    </g>}
    {planet === "uranus" && <g>
      <circle cx="60" cy="60" r="30" fill="#92d6e3" {...stroke} />
      <ellipse cx="60" cy="60" rx="9" ry="44" fill="none" stroke="#e8fbff" strokeWidth="3" transform="rotate(14 60 60)" opacity=".85" />
      <path d="M30 28 A40 40 0 0 1 92 30" fill="none" stroke="#e5533d" strokeWidth="5" strokeLinecap="round" /><path d="M92 18 V34 H78" fill="none" stroke="#e5533d" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </g>}
    {planet === "neptune" && <g>
      <circle cx="60" cy="60" r="40" fill="#4170d8" {...stroke} />
      <g fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round">
        <path d="M6 38 q22 -14 44 0 t44 0" /><path d="M14 62 q22 -14 44 0 t48 0" /><path d="M10 86 q22 -14 44 0 t44 0" />
      </g>
    </g>}
  </svg>;
}

/** A small picture of what a level is, for the level list. */
export function ModeIcon({ mode }: { mode: string }) {
  const line = { fill: "none", stroke: "currentColor", strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return <svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true" focusable="false">
    {(mode === "tour" || mode === "scale") && <g {...line}><path d="M6 38 Q20 6 42 12" strokeDasharray="1 7" /><path d="M36 6 L44 12 L36 18" /><circle cx="8" cy="38" r="4" fill="currentColor" /></g>}
    {mode === "sort" && <g {...line}><path d="M8 16 H34 M28 9 L35 16 L28 23" /><path d="M40 32 H14 M20 25 L13 32 L20 39" /></g>}
    {mode === "know" && <g {...line}><circle cx="24" cy="24" r="16" /><circle cx="24" cy="24" r="9" fill="currentColor" opacity=".3" /><path d="M18 28 q6 -10 12 0" /></g>}
    {mode === "build" && <g {...line}><circle cx="6" cy="6" r="2" fill="currentColor" /><path d="M6 20 A14 14 0 0 0 20 6 M6 34 A28 28 0 0 0 34 6" /><circle cx="26" cy="30" r="5" fill="currentColor" /></g>}
    {mode === "size" && <g {...line}><circle cx="18" cy="26" r="14" /><circle cx="38" cy="26" r="2.5" fill="currentColor" /></g>}
    {mode === "far" && <g {...line}><path d="M4 30 H44" /><circle cx="9" cy="24" r="5" /><path d="M24 30 v-6 M39 30 v-6" /></g>}
  </svg>;
}

/** The launch picture on the title: the Sun's glow, orbits, four planets and the rocket tilted for take-off. */
export function LaunchArt({ planets }: { planets: readonly Planet[] }) {
  const spots = [[168, 196, 0.9], [200, 66, 1.05], [296, 176, 1.2], [322, 64, 0.95]] as const;
  return <svg className="sj-launch-art" viewBox="0 0 360 300" aria-hidden="true" focusable="false" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <defs>
      <radialGradient id="sj-l-sun" cx="0" cy="0" r="1"><stop offset=".2" stopColor="#fff3b0" /><stop offset=".7" stopColor="#ffc93c" /><stop offset="1" stopColor="#f28c28" /></radialGradient>
    </defs>
    {Array.from({ length: 22 }, (_, i) => <circle key={i} cx={(i * 137) % 360} cy={(i * 89) % 300} r={i % 4 ? 1 : 1.7} fill="#fff" opacity=".6" />)}
    {[110, 170, 240, 320].map(r => <circle key={r} cx="0" cy="0" r={r} fill="none" stroke="#9fb0ff" strokeOpacity=".3" strokeDasharray="4 6" />)}
    <circle cx="0" cy="0" r="92" fill="url(#sj-l-sun)" />
    {planets.slice(0, 4).map((planet, i) => <svg key={planet.id} x={spots[i][0] - 40 * spots[i][2]} y={spots[i][1] - 40 * spots[i][2]} width={80 * spots[i][2]} height={80 * spots[i][2]} viewBox="0 0 80 80" overflow="visible"><PlanetArt planet={planet} box={80} r={planet.drawR + 4} /></svg>)}
    <g className="sj-bob"><g transform="translate(112 126) rotate(34) scale(1.9)">
      <path d="M-5 12 Q0 32 5 12 Z" fill="#ffb238" className="sj-flame" /><path d="M-2.6 12 Q0 24 2.6 12 Z" fill="#fff3b0" className="sj-flame" />
      <path d="M0 -17 C9 -9 8 6 6 13 H-6 C-8 6 -9 -9 0 -17 Z" fill="#f4f1ea" stroke="#2c3768" strokeWidth="1.4" />
      <path d="M0 -17 C4 -13 5.4 -10.5 5.8 -9 H-5.8 C-5.4 -10.5 -4 -13 0 -17 Z" fill="#e5533d" /><circle cx="0" cy="-2" r="4" fill="#7cc6ff" stroke="#2c3768" strokeWidth="1.4" />
      <path d="M-6 2 L-13 14 L-5 12 Z M6 2 L13 14 L5 12 Z" fill="#e5533d" stroke="#2c3768" strokeWidth="1.4" strokeLinejoin="round" />
    </g></g>
  </svg>;
}

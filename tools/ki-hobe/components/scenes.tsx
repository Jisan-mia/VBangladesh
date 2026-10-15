// The little experiments, drawn in SVG. Each shows its setup while the child predicts; `playing` starts the CSS animation
// (product.css), which ends on a still frame that shows the result. Slow mode and reduced motion jump to that frame.
import type { ReactNode } from "react";
import { PICS, moonPath, type Part, type Pic } from "../lib/art";
import type { Item } from "../lib/questions";

export function PicG({ pic, x = 0, y = 0, size = 64 }: { pic: Pic; x?: number; y?: number; size?: number }) {
  return <g transform={`translate(${x - size / 2} ${y - size / 2}) scale(${size / 64})`}>
    {(PICS[pic] as Part[]).map((part, index) => <path key={index} d={part.d} fill={part.fill ?? "none"} stroke={part.stroke} strokeWidth={part.w}
      opacity={part.alpha} strokeLinecap="round" strokeLinejoin="round" />)}
  </g>;
}

/** A positioned group whose child moves by CSS (a CSS transform would replace the position if both sat on one element). */
const At = ({ x, y, className, style, children }: { x: number; y: number; className?: string; style?: React.CSSProperties; children: ReactNode }) =>
  <g transform={`translate(${x} ${y})`}><g className={className} style={style}>{children}</g></g>;

const SKY = "#dff0fb", GROUND = "#d9c48f", GRASS = "#9ccf5a", WATER = "#3a8fd0";

function Pond({ item }: { item: Item }) {
  const [a, b] = item.drop!, [fa, fb] = item.floats!;
  return <>
    <rect width="320" height="180" fill={SKY} />
    <path d="M0 96H34L46 88H0ZM320 96H286L274 88H320Z" fill={GRASS} />
    <At x={105} y={36} className={fa ? "ki-float" : "ki-sink"}><PicG pic={a} size={50} /></At>
    <At x={215} y={36} className={fb ? "ki-float" : "ki-sink"} style={{ animationDelay: ".35s" }}><PicG pic={b} size={50} /></At>
    <rect y="96" width="320" height="84" fill={WATER} opacity=".62" />
    <path d="M0 96H320" stroke="#e6f2fb" strokeWidth="2" />
    <rect y="172" width="320" height="8" fill="#6d5a3a" opacity=".5" />
    {[105, 215].map((x, i) => <At key={x} x={x} y={96} className="ki-ripple" style={{ animationDelay: `${0.75 + i * 0.35}s` }}>
      <ellipse rx="30" ry="6" fill="none" stroke="#ffffff" strokeWidth="2" />
    </At>)}
  </>;
}

function Ice() {
  const cube = (x: number, cls: string) => <>
    <ellipse cx={x} cy="146" rx="44" ry="9" fill="#ffffff" stroke="#b7c3cf" strokeWidth="2" />
    <At x={x} y={145} className={`ki-puddle ${cls}`}><ellipse rx="34" ry="6" fill="#8fc9e6" opacity=".8" /></At>
    <At x={x} y={144} className={cls}><rect x="-20" y="-38" width="40" height="38" rx="5" fill="#d6f0fb" stroke="#8fc9e6" strokeWidth="2.5" /><path d="M-12 -30h8" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" /></At>
  </>;
  return <>
    <rect width="320" height="180" fill={SKY} />
    <rect x="160" width="160" height="180" fill="#c9d9e3" />
    <rect y="132" width="320" height="48" fill={GROUND} />
    <PicG pic="sun" x={42} y={34} size={58} />
    <PicG pic="shade" x={262} y={52} size={110} />
    <text x="80" y="30" className="ki-tag">রোদ</text><text x="186" y="30" className="ki-tag">ছায়া</text>
    {cube(90, "ki-melt-fast")}{cube(232, "ki-melt-slow")}
  </>;
}

function Fall({ moon }: { moon: boolean }) {
  const [left, right]: Pic[] = moon ? ["hammer", "feather"] : ["stone", "feather"];
  return <>
    <rect width="320" height="180" fill={moon ? "#1d2340" : SKY} />
    {moon && <>
      <path d="M30 20h1M80 44h1M150 14h1M240 50h1M200 24h1M60 70h1M300 80h1" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="280" cy="34" r="14" fill={WATER} /><path d="M272 28c4 0 6 4 4 8s3 6 8 4" stroke="#3f8f4a" strokeWidth="3" fill="none" />
    </>}
    <rect y="156" width="320" height="24" fill={moon ? "#9a9aa6" : GRASS} />
    {moon && <path d="M40 166a14 4 0 0 0 28 0M230 170a18 5 0 0 0 36 0" stroke="#7a7a86" strokeWidth="3" fill="none" />}
    <rect x="70" y="10" width="180" height="6" rx="3" fill={moon ? "#59596a" : "#7a4a22"} />
    <At x={110} y={38} className={moon ? "ki-fall-moon" : "ki-fall"}><PicG pic={left} size={40} /></At>
    <At x={210} y={38} className={moon ? "ki-fall-moon" : "ki-drift"}><PicG pic={right} size={40} /></At>
    {moon && <text x="16" y="150" className="ki-tag ki-tag-light">চাঁদ</text>}
  </>;
}

function Shadow() {
  return <>
    <rect width="320" height="180" fill={SKY} />
    <At x={0} y={0} className="ki-dusk"><rect width="320" height="180" fill="#f6c99b" /></At>
    <rect y="132" width="320" height="48" fill={GROUND} />
    <At x={160} y={24} className="ki-sunset"><circle r="14" fill="#f6b93b" /></At>
    <At x={160} y={134} className="ki-shadow"><rect y="-3" width="20" height="7" rx="3" fill="#4a4a4a" opacity=".75" /></At>
    <rect x="156" y="66" width="8" height="70" rx="2" fill="#7a4a22" />
    <At x={20} y={30} className="ki-noon-tag"><text className="ki-tag">দুপুর</text></At>
    <At x={238} y={30} className="ki-eve-tag"><text className="ki-tag">বিকেল</text></At>
  </>;
}

function Seed() {
  return <>
    <rect width="320" height="180" fill={SKY} />
    <rect x="208" y="20" width="108" height="160" rx="8" fill="#2d3047" />
    <path d="M208 20h10v160h-10z" fill="#444b6e" />
    <rect y="170" width="320" height="10" fill="#b07a3e" />
    <PicG pic="potLight" x={60} y={134} size={72} /><PicG pic="potDry" x={160} y={134} size={72} /><PicG pic="potDark" x={262} y={134} size={72} />
    <At x={60} y={139} className="ki-grow"><path d="M0 0V-46" stroke="#3f8f4a" strokeWidth="4" strokeLinecap="round" /><ellipse cx="-11" cy="-40" rx="11" ry="6" fill="#3f8f4a" /><ellipse cx="11" cy="-48" rx="11" ry="6" fill="#4caf50" /></At>
    <At x={262} y={139} className="ki-grow"><path d="M0 0C3 -30 -4 -50 2 -76" stroke="#ddd67a" strokeWidth="2.5" fill="none" strokeLinecap="round" /><ellipse cx="7" cy="-76" rx="6" ry="3" fill="#e8df7c" /></At>
  </>;
}

function Sky() {
  const spots = [[110, 70], [170, 98], [232, 126]];
  return <>
    <rect width="320" height="180" fill="#f1f3f5" />
    <At x={0} y={0} className="ki-blue"><rect width="320" height="180" fill="#6fb2ec" /></At>
    <path d="M50 40L300 154" stroke="#fff3c4" strokeWidth="7" className="ki-beam" pathLength="1" />
    {spots.map(([x, y], i) => <g key={x}>
      <circle cx={x} cy={y} r="3.5" fill="#33415c" />
      <At x={x} y={y} className="ki-ring" style={{ animationDelay: `${0.9 + i * 0.3}s` }}><circle r="5" fill="none" stroke="#1e64c8" strokeWidth="2.5" /></At>
    </g>)}
    {[[70, 120], [140, 40], [260, 60], [290, 110], [210, 30]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="3" fill="#33415c" opacity=".5" />)}
    <PicG pic="sun" x={38} y={32} size={58} />
    <rect y="164" width="320" height="16" fill={GRASS} />
  </>;
}

function Rain() {
  return <>
    <rect width="320" height="180" fill={SKY} />
    <path d="M0 150C40 144 110 146 160 152V180H0Z" fill={WATER} />
    <path d="M160 152C200 148 260 148 320 150V180H160Z" fill={GRASS} />
    <path d="M180 160v-10M200 162v-12M220 160v-10M240 162v-12M260 160v-10M280 162v-12M300 160v-10" stroke="#3f8f4a" strokeWidth="2.5" strokeLinecap="round" />
    <PicG pic="sun" x={34} y={30} size={50} />
    {[40, 80, 120].map((x, i) => <At key={x} x={x} y={142} className="ki-rise" style={{ animationDelay: `${i * 0.25}s` }}>
      <path d="M0 0c-6-8 6-12 0-22" stroke="#ffffff" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </At>)}
    <At x={236} y={44} className="ki-cloud"><path d="M-46 14a14 14 0 0 1 10-24a18 18 0 0 1 34-8a16 16 0 0 1 30 6a14 14 0 0 1 16 26Z" fill="#8f9bb0" /></At>
    {[200, 222, 244, 266, 288].map((x, i) => <At key={x} x={x} y={66} className="ki-rain" style={{ animationDelay: `${2.6 + (i % 3) * 0.2}s` }}>
      <path d="M0 0l-3 10" stroke={WATER} strokeWidth="3" strokeLinecap="round" />
    </At>)}
    <At x={0} y={0} className="ki-back"><path d="M196 172C170 178 150 176 128 168" stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round" /><path d="M134 162l-7 6 9 3" stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round" /></At>
  </>;
}

function Moon() {
  const phases = [0, 0.125, 0.25, 0.375, 0.5];
  return <>
    <rect width="320" height="180" fill="#141a33" />
    <path d="M0 30H22M0 60H22M0 90H22M0 120H22" stroke="#f6b93b" strokeWidth="3" strokeLinecap="round" />
    <circle cx="160" cy="74" r="52" fill="none" stroke="#4b5378" strokeWidth="1.5" strokeDasharray="4 5" />
    <circle cx="160" cy="74" r="14" fill={WATER} />
    <path d="M152 68c4 0 6 4 4 8s3 6 8 4" stroke="#3f8f4a" strokeWidth="3" fill="none" />
    <At x={160} y={74} className="ki-orbit"><g transform="translate(-52 0)"><g className="ki-counter">
      <circle r="10" fill="#59596a" /><path d="M0 -10A10 10 0 0 0 0 10Z" fill="#f4e9b8" />
    </g></g></At>
    {phases.map((t, i) => <At key={t} x={40 + i * 60} y={158} className="ki-phase" style={{ animationDelay: `${0.3 + i * 0.5}s` }}>
      <circle r="14" fill="#2a3050" /><path d={moonPath(t, 14)} fill="#f4e9b8" />
    </At>)}
  </>;
}

function Magnet() {
  return <>
    <rect width="320" height="180" fill={SKY} />
    <rect x="20" y="140" width="280" height="10" rx="3" fill="#b07a3e" /><path d="M40 150v28M280 150v28" stroke="#8a5a2a" strokeWidth="6" />
    <PicG pic="pencil" x={160} y={118} size={44} />
    <PicG pic="plasticSpoon" x={240} y={118} size={44} />
    <At x={80} y={118} className="ki-clip"><PicG pic="clip" size={44} /></At>
    <At x={50} y={58} className="ki-magnet">
      <path d="M-20 16V-2a20 20 0 0 1 40 0V16H9V-2a9 9 0 0 0-18 0V16Z" fill="#d64545" />
      <path d="M-20 9h11v7h-11zM9 9h11v7H9z" fill="#c5ced6" />
    </At>
  </>;
}

function Phone() {
  const kid = (x: number, glasses: boolean, shirt: string, hair: string) => <g>
    <rect x={x - 18} y="92" width="36" height="66" rx="14" fill={shirt} />
    <circle cx={x} cy="70" r="18" fill="#a0673f" />
    <path d={`M${x - 18} 66a18 18 0 0 1 36 0c-6-8-30-8-36 0Z`} fill={hair} />
    {!glasses && <path d={`M${x - 16} 64c-8 6-8 20-2 28`} stroke={hair} strokeWidth="5" fill="none" strokeLinecap="round" />}
    {glasses && <path d={`M${x - 12} 70h8M${x + 4} 70h8M${x - 4} 70h8`} stroke="#33415c" strokeWidth="2.5" strokeLinecap="round" />}
    <circle cx={x - 7} cy="71" r="1.6" fill="#33415c" /><circle cx={x + 7} cy="71" r="1.6" fill="#33415c" />
  </g>;
  return <>
    <rect width="320" height="180" fill={SKY} />
    <rect y="158" width="320" height="22" fill={GRASS} />
    {kid(40, false, "#f2c14e", "#2b1d14")}{kid(280, true, "#5bb381", "#1f1a17")}
    <path d="M86 80H234" stroke="#8a5a14" strokeWidth="2" />
    <path d="M62 72h22l-4 16h-14z" fill="#ffffff" stroke="#33415c" strokeWidth="2" />
    <path d="M258 72h-22l4 16h14z" fill="#ffffff" stroke="#33415c" strokeWidth="2" />
    <At x={0} y={0} className="ki-say"><path d="M60 64a10 10 0 0 0 0 20M54 58a18 18 0 0 0 0 32" stroke="#2b6cb0" strokeWidth="2.5" fill="none" strokeLinecap="round" /></At>
    {[0, 1, 2].map(i => <At key={i} x={86} y={80} className="ki-buzz" style={{ animationDelay: `${0.3 + i * 0.3}s` }}><circle r="4" fill="#2b6cb0" /></At>)}
    <At x={0} y={0} className="ki-hear"><path d="M262 60a14 14 0 0 1 0 22M268 54a22 22 0 0 1 0 34" stroke="#2b6cb0" strokeWidth="2.5" fill="none" strokeLinecap="round" /></At>
  </>;
}

const DRAW: Record<Item["scene"], (item: Item) => ReactNode> = {
  pond: item => <Pond item={item} />, ice: () => <Ice />, fall: () => <Fall moon={false} />, moonfall: () => <Fall moon />,
  shadow: () => <Shadow />, seed: () => <Seed />, sky: () => <Sky />, rain: () => <Rain />, moon: () => <Moon />, magnet: () => <Magnet />, phone: () => <Phone />,
};

export function SceneView({ item, playing }: { item: Item; playing: boolean }) {
  return <svg className={`ki-scene ki-s-${item.scene}${playing ? " is-play" : ""}`} viewBox="0 0 320 180" role="img"
    aria-label={playing ? item.result : item.ask}>
    {DRAW[item.scene](item)}
  </svg>;
}

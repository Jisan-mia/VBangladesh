// Every picture of the game, drawn in code (our own art): the opposite pairs, the card-sort cards, the rule signs, the bell,
// the ghost finger and the title's launch picture. Plain SVG, so it stays crisp at any density.
import type { ReactNode } from "react";
import { PAIRS, type Card, type Pic, type Rule } from "../lib/pairs";

const svg = (children: ReactNode) => <svg viewBox="0 0 100 100" aria-hidden="true">{children}</svg>;

const mango = (r: number) => <g transform={`translate(50 54) scale(${r})`}>
  <path d="M-4-30q-2-8 6-12" fill="none" stroke="#6b4a1e" strokeWidth="3" strokeLinecap="round" />
  <path d="M2-36q14-10 24-2-12 8-24 2z" fill="#4f9a3a" />
  <path d="M-6-30C-30-30-34 6-18 24S26 38 30 10 18-30-6-30z" fill="#f5b52e" stroke="#c98a12" strokeWidth="3" />
  <path d="M-16-14q-6 10-2 20" fill="none" stroke="#fff8" strokeWidth="5" strokeLinecap="round" />
</g>;

const house = (wall: string, roof: string, window: string) => <g>
  <path d="M28 88V60l22-18 22 18v28z" fill={wall} />
  <path d="M22 62l28-24 28 24" fill="none" stroke={roof} strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" />
  <rect x="44" y="70" width="12" height="18" rx="2" fill={roof} />
  <rect x="33" y="64" width="9" height="9" rx="1.5" fill={window} />
  <rect x="58" y="64" width="9" height="9" rx="1.5" fill={window} />
</g>;


const eyes = (y = 52, gap = 11) => <g fill="#2d2416"><circle cx={50 - gap} cy={y} r="3.2" /><circle cx={50 + gap} cy={y} r="3.2" /></g>;
const glass = (water: boolean) => <g>
  <path d="M24 14H76L69 86Q68.5 92 63 92H37Q31.5 92 31 86Z" fill="#eaf7ff" stroke="#6fb6dc" strokeWidth="3.5" strokeLinejoin="round" />
  {water && <path d="M27.5 24H72.5L67 85Q66.5 88.5 63 88.5H37Q33.5 88.5 33 85Z" fill="#5db8ee" />}
  {water && <path d="M27.5 24Q38 19 50 24T72.5 24" fill="#8fd3f7" />}
  {water && <g fill="#fff" opacity=".8"><circle cx="42" cy="70" r="3" /><circle cx="58" cy="44" r="2.4" /><circle cx="45" cy="38" r="1.8" /></g>}
  <path d="M33 26l3 52" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".85" />
  {eyes(58, 9)}
  {water ? <path d="M43 68q7 7 14 0" fill="none" stroke="#2d2416" strokeWidth="3" strokeLinecap="round" /> : <ellipse cx="50" cy="70" rx="3.2" ry="3.8" fill="#2d2416" />}
</g>;

/** Every picture of the opposite game, each in its own 100×100 frame. */
export const PICTURE_ART: Record<Pic, () => ReactNode> = {
  sun: () => svg(<g>
    {Array.from({ length: 12 }, (_, index) => <rect key={index} x="47" y="6" width="6" height="16" rx="3" fill="#f4a21b" transform={`rotate(${index * 30} 50 50)`} />)}
    <circle cx="50" cy="50" r="24" fill="#ffc93c" stroke="#f4a21b" strokeWidth="3" />
    <circle cx="42" cy="47" r="3" fill="#5a3b12" /><circle cx="58" cy="47" r="3" fill="#5a3b12" />
    <path d="M41 57q9 8 18 0" fill="none" stroke="#5a3b12" strokeWidth="3" strokeLinecap="round" />
  </g>),
  moon: () => svg(<g>
    <path d="M60 12A38 38 0 1 0 88 66 30 30 0 1 1 60 12z" fill="#ffe28a" stroke="#d9b13b" strokeWidth="3" />
    <circle cx="34" cy="54" r="3" fill="#5a4a12" />
    <path d="M28 66q6 5 12 0" fill="none" stroke="#5a4a12" strokeWidth="3" strokeLinecap="round" />
    <path d="M80 18l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#9db4ff" />
  </g>),
  cat: () => svg(<g>
    <path d="M22 44L18 12l24 18M78 44l4-32-24 18" fill="#f2a046" stroke="#b86a1c" strokeWidth="3" strokeLinejoin="round" />
    <ellipse cx="50" cy="56" rx="32" ry="28" fill="#f2a046" stroke="#b86a1c" strokeWidth="3" />
    <ellipse cx="38" cy="52" rx="4" ry="6" fill="#2d2416" /><ellipse cx="62" cy="52" rx="4" ry="6" fill="#2d2416" />
    <path d="M46 62h8l-4 4z" fill="#d9577a" />
    <path d="M50 66q-6 6-12 2M50 66q6 6 12 2" fill="none" stroke="#2d2416" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M12 58l18 2M12 68l18-3M88 58l-18 2M88 68l-18-3" stroke="#2d2416" strokeWidth="2" strokeLinecap="round" />
  </g>),
  mouse: () => svg(<g>
    <circle cx="24" cy="32" r="17" fill="#b9b5c4" stroke="#7d7890" strokeWidth="3" /><circle cx="24" cy="32" r="9" fill="#f2b8c6" />
    <circle cx="76" cy="32" r="17" fill="#b9b5c4" stroke="#7d7890" strokeWidth="3" /><circle cx="76" cy="32" r="9" fill="#f2b8c6" />
    <path d="M50 88C26 88 22 62 30 50s32-12 40 0 4 38-20 38z" fill="#b9b5c4" stroke="#7d7890" strokeWidth="3" />
    <circle cx="40" cy="60" r="3.5" fill="#2d2416" /><circle cx="60" cy="60" r="3.5" fill="#2d2416" />
    <circle cx="50" cy="76" r="5" fill="#d9577a" />
    <path d="M44 76l-18-3M44 80l-17 4M56 76l18-3M56 80l17 4" stroke="#5c586b" strokeWidth="2" strokeLinecap="round" />
  </g>),
  big: () => svg(mango(1.25)),
  small: () => svg(mango(0.5)),
  day: () => svg(<g>
    <rect x="4" y="4" width="92" height="92" rx="14" fill="#bfe3ff" />
    <path d="M58 30a8 8 0 0 1 14-6 9 9 0 0 1 14 7 6 6 0 0 1-2 12H62a7 7 0 0 1-4-13z" fill="#fff" />
    <path d="M18 26q4-4 8 0 4-4 8 0" fill="none" stroke="#3b5068" strokeWidth="2.5" strokeLinecap="round" />
    <rect x="4" y="84" width="92" height="12" rx="4" fill="#7cc35a" />
    {house("#fff3d6", "#c0563b", "#7fb8e6")}
  </g>),
  night: () => svg(<g>
    <rect x="4" y="4" width="92" height="92" rx="14" fill="#1f2c5c" />
    {[[18, 20], [40, 14], [70, 22], [84, 40], [26, 40]].map(([x, y]) => <path key={`${x}-${y}`} d={`M${x} ${y - 5}l1.6 3.4 3.4 1.6-3.4 1.6-1.6 3.4-1.6-3.4-3.4-1.6 3.4-1.6z`} fill="#ffe28a" />)}
    <rect x="4" y="84" width="92" height="12" rx="4" fill="#2f4a3a" />
    {house("#5b6a92", "#2d3557", "#ffd34d")}
  </g>),
  cold: () => svg(<g>
    <path d="M50 14l32 14v38L50 84 18 66V28z" fill="#d7f1ff" stroke="#6fb6dc" strokeWidth="3" strokeLinejoin="round" />
    <path d="M18 28l32 14 32-14M50 42v42" fill="none" stroke="#6fb6dc" strokeWidth="3" strokeLinejoin="round" />
    <path d="M26 38v14M32 41v6" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
    <circle cx="36" cy="60" r="2.5" fill="#2d4a5c" /><circle cx="44" cy="63" r="2.5" fill="#2d4a5c" />
    <path d="M86 76q4 6 0 8-4-2 0-8z" fill="#8fd0f0" />
  </g>),
  hot: () => svg(<g>
    <path d="M34 34q-6-8 0-14t0-14M50 34q-6-8 0-14t0-14M66 34q-6-8 0-14t0-14" fill="none" stroke="#c9b7a8" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M70 52h6a10 10 0 0 1 0 20h-8" fill="none" stroke="#c0563b" strokeWidth="5" />
    <path d="M22 44h52l-6 36a8 8 0 0 1-8 7H36a8 8 0 0 1-8-7z" fill="#e8734f" stroke="#c0563b" strokeWidth="3" strokeLinejoin="round" />
    <ellipse cx="48" cy="44" rx="26" ry="5" fill="#a8622b" stroke="#c0563b" strokeWidth="3" />
    <path d="M14 90h68" stroke="#c0563b" strokeWidth="4" strokeLinecap="round" />
  </g>),
  full: () => svg(glass(true)),
  empty: () => svg(<g>{glass(false)}<path d="M50 78q-3 5 0 7t0-7z" fill="#8fd3f7" /></g>),
  open: () => svg(<g>
    <rect x="22" y="12" width="56" height="80" rx="3" fill="#ffe9a8" stroke="#8a4a22" strokeWidth="4" />
    <path d="M30 92V60q8-6 14 0v32z" fill="#ffd166" opacity=".6" />
    <path d="M22 12L50 22V86L22 92z" fill="#c0563b" stroke="#8a4a22" strokeWidth="3.5" strokeLinejoin="round" />
    <path d="M28 34l16 5v26l-16 4z" fill="#d97a5a" /><circle cx="44" cy="56" r="3" fill="#ffd166" />
    <path d="M62 30l5-8M70 38l9-4M70 52h10" stroke="#f4a21b" strokeWidth="3.5" strokeLinecap="round" />
  </g>),
  shut: () => svg(<g>
    <rect x="22" y="12" width="56" height="80" rx="3" fill="#c0563b" stroke="#8a4a22" strokeWidth="4" />
    <rect x="30" y="20" width="18" height="28" rx="2" fill="#d97a5a" /><rect x="52" y="20" width="18" height="28" rx="2" fill="#d97a5a" />
    <rect x="30" y="54" width="18" height="28" rx="2" fill="#d97a5a" /><rect x="52" y="54" width="18" height="28" rx="2" fill="#d97a5a" />
    <rect x="38" y="44" width="24" height="20" rx="4" fill="#ffd166" stroke="#b07d10" strokeWidth="3" />
    <path d="M43 44v-6a7 7 0 0 1 14 0v6" fill="none" stroke="#b07d10" strokeWidth="4" strokeLinecap="round" />
    <circle cx="50" cy="53" r="2.6" fill="#5a3b12" />
  </g>),
};

const FILL = { red: ["#e04b45", "#a82a25"], blue: ["#3f78d8", "#24499a"] } as const;

/** A card-sort picture: a red or blue flower or boat. */
export function SortArt({ card }: { card: Card }) {
  const [fill, line] = FILL[card.color];
  if (card.shape === "flower") return svg(<g>
    <path d="M50 58v34" stroke="#3f8a3a" strokeWidth="5" strokeLinecap="round" />
    <path d="M50 80q-14-10-22-4 10 12 22 4z" fill="#4f9a3a" />
    {Array.from({ length: 5 }, (_, index) => <ellipse key={index} cx="50" cy="22" rx="12" ry="18" fill={fill} stroke={line} strokeWidth="3" transform={`rotate(${index * 72} 50 42)`} />)}
    <circle cx="50" cy="42" r="10" fill="#ffd34d" stroke="#c9961a" strokeWidth="3" />
  </g>);
  return svg(<g>
    <path d="M50 10v54" stroke="#6b4a1e" strokeWidth="4" strokeLinecap="round" />
    <path d="M53 14q24 20 22 44H53z" fill="#fff8e6" stroke="#b9a37a" strokeWidth="3" strokeLinejoin="round" />
    <path d="M47 22q-16 16-16 36h16z" fill="#fff8e6" stroke="#b9a37a" strokeWidth="3" strokeLinejoin="round" />
    <path d="M8 64h84q-8 22-30 22H38Q16 86 8 64z" fill={fill} stroke={line} strokeWidth="3" strokeLinejoin="round" />
    <path d="M10 92q10-5 20 0t20 0 20 0 20 0" fill="none" stroke="#6fb6dc" strokeWidth="3" strokeLinecap="round" />
  </g>);
}

/** The rule as one big sign: ⇄ উল্টো, = একই, two colour drops for রং, two outlines for আকার. */
export function RuleIcon({ rule }: { rule: Rule }) {
  if (rule === "ulto") return svg(<g fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 36h64M64 20l16 16-16 16" /><path d="M84 66H20M36 50L20 66l16 16" />
  </g>);
  if (rule === "same") return svg(<g stroke="currentColor" strokeWidth="11" strokeLinecap="round"><path d="M18 36h64M18 66h64" /></g>);
  if (rule === "color") return svg(<g>
    <path d="M32 14q22 28 22 44a22 22 0 0 1-44 0q0-16 22-44z" fill="#e04b45" stroke="#fff" strokeWidth="3" />
    <path d="M68 30q22 28 22 44a22 22 0 0 1-44 0q0-16 22-44z" fill="#3f78d8" stroke="#fff" strokeWidth="3" />
  </g>);
  return svg(<g fill="none" stroke="currentColor" strokeWidth="5" strokeLinejoin="round">
    {Array.from({ length: 5 }, (_, index) => <ellipse key={index} cx="28" cy="20" rx="6" ry="10" transform={`rotate(${index * 72} 28 32)`} />)}
    <path d="M52 66h44q-4 14-16 14H68q-12 0-16-14zM74 30v36M76 34q12 12 12 26H76z" />
  </g>);
}

export function Bell() {
  return <svg viewBox="0 0 48 48" aria-hidden="true">
    <path d="M24 6a3 3 0 0 1 3 3v1.5A13 13 0 0 1 37 23v8l4 5H7l4-5v-8a13 13 0 0 1 10-12.5V9a3 3 0 0 1 3-3z" fill="#ffc93c" stroke="#b07d10" strokeWidth="2.5" strokeLinejoin="round" />
    <circle cx="24" cy="40" r="4" fill="#b07d10" />
  </svg>;
}

export function Ghost() {
  return <svg className="uk-ghost" viewBox="0 0 48 60" aria-hidden="true">
    <path d="M14 30V8a5 5 0 0 1 10 0v16l12 2a6 6 0 0 1 5 7l-2 13a10 10 0 0 1-10 9H19a9 9 0 0 1-7-4L3 39a4.5 4.5 0 0 1 7-5z" fill="#fff" stroke="#1d2b53" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>;
}

/** One pair side by side with the sign between, for the end screen and the level cards. */
export function PairArt({ pair }: { pair: number }) {
  const [a, b] = PAIRS[pair];
  return <span className="uk-pair" aria-hidden="true"><span>{PICTURE_ART[a]()}</span><i><RuleIcon rule="ulto" /></i><span>{PICTURE_ART[b]()}</span></span>;
}

/** What a level is, as one small sign: arrows for opposites, a bell where the rule changes, colour drops for the sort. */
export function LevelIcon({ kind, bell }: { kind: "pair" | "sort"; bell: boolean }) {
  if (kind === "sort") return <RuleIcon rule="color" />;
  return bell ? <Bell /> : <RuleIcon rule="ulto" />;
}

/** The title's launch picture: day and night side by side under a bell on a rope. It is the start button's face. */
export function LaunchArt() {
  return <svg className="uk-launch-art" viewBox="0 0 360 300" aria-hidden="true" focusable="false" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <rect width="180" height="300" fill="#bfe3ff" /><rect x="180" width="180" height="300" fill="#1f2c5c" />
    <path d="M30 70a14 14 0 0 1 24-8 16 16 0 0 1 26 10 10 10 0 0 1-4 18H40a12 12 0 0 1-10-20z" fill="#fff" />
    {[[216, 40], [330, 60], [300, 150], [236, 170], [340, 120]].map(([x, y]) => <path key={`${x}-${y}`} d={`M${x} ${y - 7}l2.2 4.8 4.8 2.2-4.8 2.2-2.2 4.8-2.2-4.8-4.8-2.2 4.8-2.2z`} fill="#ffe28a" />)}
    <g transform="translate(92 128)">
      {Array.from({ length: 12 }, (_, index) => <rect key={index} x="-5" y="-78" width="10" height="26" rx="5" fill="#f4a21b" transform={`rotate(${index * 30})`} />)}
      <circle r="46" fill="#ffc93c" stroke="#f4a21b" strokeWidth="5" />
      <circle cx="-15" cy="-6" r="5" fill="#5a3b12" /><circle cx="15" cy="-6" r="5" fill="#5a3b12" />
      <path d="M-15 12q15 14 30 0" fill="none" stroke="#5a3b12" strokeWidth="5" strokeLinecap="round" />
    </g>
    <g transform="translate(268 128)">
      <path d="M16-60A58 58 0 1 0 50 36 46 46 0 1 1 16-60z" fill="#ffe28a" stroke="#d9b13b" strokeWidth="4" />
      <circle cx="-22" cy="-4" r="4.5" fill="#5a4a12" /><path d="M-30 14q9 8 18 0" fill="none" stroke="#5a4a12" strokeWidth="4.5" strokeLinecap="round" />
    </g>
    <path d="M0 232Q60 200 130 226T180 232V300H0z" fill="#7cc35a" /><path d="M180 232Q240 204 300 226T360 220V300H180z" fill="#2f4a3a" />
    <path d="M180 0V30" stroke="#6b4a1e" strokeWidth="4" />
    <g transform="translate(180 30)"><g className="uk-swing" style={{ transformBox: "fill-box", transformOrigin: "50% 0" }}>
      <path d="M0 4a4 4 0 0 1 4 4v2a20 20 0 0 1 14 19v16l7 8H-25l7-8V29a20 20 0 0 1 14-19V8a4 4 0 0 1 4-4z" fill="#ffc93c" stroke="#b07d10" strokeWidth="3.5" strokeLinejoin="round" />
      <circle cy="62" r="6" fill="#b07d10" />
    </g></g>
    <g fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" opacity=".92">
      <path d="M150 150h60M196 136l14 14-14 14" /><path d="M210 180h-60M164 166l-14 14 14 14" />
    </g>
  </svg>;
}

// Our own code art: the six faces, the child in each scene, one small picture per scene, and an icon per kind choice.
import type { ReactNode } from "react";
import { FACES, HEAD, INK, NEUTRAL, type Feeling } from "../lib/faces";
import type { Hair, Icon, Prop } from "../lib/scenes";

/** With `draw`, the strokes draw themselves in (each on its own beat) and the dots pop in: the face is painted as you watch. */
const parts = (feeling: Feeling | "calm", draw = false) => FACES[feeling].map((part, index) =>
  <path key={index} d={part.d} fill={part.fill ?? "none"} stroke={part.line ? INK : undefined} strokeWidth={part.line} strokeLinecap="round" strokeLinejoin="round"
    pathLength={draw && part.line ? 1 : undefined} className={draw ? (part.line ? "mr-stroke" : "mr-dot") : undefined} style={draw ? { animationDelay: `${100 + index * 70}ms` } : undefined} />);

export function Face({ feeling, fill }: { feeling: Feeling | "calm"; fill: string }) {
  return <svg viewBox="-2 -2 104 104" aria-hidden="true"><path d={HEAD} fill={fill} stroke={INK} strokeWidth="4" />{parts(feeling)}</svg>;
}

const HAIR = "#2d2018";
/** The child in the scene: a "?" until the feeling is named, then that face. */
export function Child({ face, fill, hair, glasses, draw = false }: { face: Feeling | "calm" | null; fill: string; hair: Hair; glasses?: boolean; draw?: boolean }) {
  return <svg viewBox="-4 -4 108 108" aria-hidden="true">
    {hair === "long" && <path d="M8 46Q4 6 50 4Q96 6 92 46L94 92Q84 98 80 86L82 52H18L20 86Q16 98 6 92Z" fill={HAIR} />}
    <path d={HEAD} fill={face ? fill : NEUTRAL} stroke={INK} strokeWidth="4" />
    {face ? parts(face, draw) : <text x="50" y="72" textAnchor="middle" fontSize="54" fontWeight="800" fill="#9b8a72">?</text>}
    <path d={hair === "long" ? "M10 40Q14 8 50 7Q86 8 90 40Q74 22 50 24Q30 22 10 40Z" : "M7 44Q6 8 50 5Q94 8 93 44Q86 26 66 22Q60 30 44 26Q26 24 7 44Z"} fill={HAIR} />
    {glasses && face && <path d="M25 46a11 11 0 1 0 22 0a11 11 0 1 0 -22 0zM53 46a11 11 0 1 0 22 0a11 11 0 1 0 -22 0zM47 45h6" fill="none" stroke={INK} strokeWidth="3" />}
  </svg>;
}

const line = { fill: "none", stroke: INK, strokeWidth: 4, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const PROPS: Record<Prop, ReactNode> = {
  jama: <><path d="M60 14V7q0-4 4-4" {...line} strokeWidth={3} /><path d="M40 22l12-6q8 8 16 0l12 6 16 20-12 8-4-6 6 56H34l6-56-4 6-12-8z" fill="#e2557a" stroke={INK} strokeWidth="3" strokeLinejoin="round" /><circle cx="50" cy="66" r="4" fill="#ffd166" /><circle cx="70" cy="78" r="4" fill="#ffd166" /><circle cx="56" cy="92" r="4" fill="#ffd166" /></>,
  brishti: <><path d="M28 52a15 15 0 0 1 14-22 20 20 0 0 1 37 3 14 14 0 0 1 9 25H32a10 10 0 0 1-4-6z" fill="#9aaabd" stroke={INK} strokeWidth="3" /><path d="M38 66l-4 10M54 66l-4 10M70 66l-4 10M46 82l-4 10M62 82l-4 10" stroke="#3f8fd0" strokeWidth="4" strokeLinecap="round" /><circle cx="84" cy="102" r="11" fill="#fff" stroke={INK} strokeWidth="3" /><path d="M78 96l12 12M90 96l-12 12" stroke="#d9483b" strokeWidth="3" /></>,
  tiffin: <><path d="M38 40V24h44v16" {...line} /><rect x="30" y="40" width="60" height="18" rx="6" fill="#c3ccd6" stroke={INK} strokeWidth="3" /><rect x="30" y="60" width="60" height="18" rx="6" fill="#c3ccd6" stroke={INK} strokeWidth="3" /><rect x="30" y="80" width="60" height="18" rx="6" fill="#c3ccd6" stroke={INK} strokeWidth="3" /><path d="M86 108a16 16 0 0 1 32 0z" fill="#e9b872" stroke={INK} strokeWidth="3" /></>,
  ghuri: <><path d="M56 8l30 34-30 44-30-44z" fill="#e8443a" stroke={INK} strokeWidth="3" strokeLinejoin="round" /><path d="M56 8v78M26 42h60" stroke="#8b2a22" strokeWidth="2.5" /><path d="M56 86q-8 6 0 12t0 12" {...line} strokeWidth={3} /><path d="M86 42l10 10M102 66l12 14" stroke={INK} strokeWidth="2" strokeDasharray="4 5" /></>,
  khata: <><rect x="24" y="16" width="72" height="88" rx="6" fill="#fff" stroke={INK} strokeWidth="3" /><path d="M24 30h-6M24 50h-6M24 70h-6M24 90h-6" {...line} strokeWidth={3} /><circle cx="48" cy="38" r="10" fill="#ffd166" /><path d="M64 46l10-16 12 16z" fill="#4caf7a" /><path d="M24 62l10 7 9-8 10 8 9-8 10 8 9-8 15 6" fill="none" stroke="#c8402e" strokeWidth="4" strokeLinejoin="round" /></>,
  naru: <><path d="M42 44q0-18 18-18t18 18" {...line} strokeWidth={3} /><path d="M24 44h72l-8 58H32z" fill="#c9a56b" stroke={INK} strokeWidth="3" strokeLinejoin="round" /><path d="M30 58h60M33 74h54M35 90h50" stroke="#9c7b45" strokeWidth="2" /><circle cx="46" cy="38" r="9" fill="#f4e7c8" stroke="#a88c5a" strokeWidth="2.5" /><circle cx="64" cy="34" r="9" fill="#f4e7c8" stroke="#a88c5a" strokeWidth="2.5" /><circle cx="78" cy="40" r="8" fill="#f4e7c8" stroke="#a88c5a" strokeWidth="2.5" /></>,
  andhar: <><rect x="6" y="6" width="108" height="108" rx="16" fill="#2b3350" /><path d="M60 6v28" stroke="#9aa5bd" strokeWidth="3" /><path d="M52 34h16v8q12 6 12 20a20 20 0 0 1-40 0q0-14 12-20z" fill="#4a5470" stroke="#cfd6e4" strokeWidth="3" /><circle cx="24" cy="26" r="2.5" fill="#fff" /><circle cx="92" cy="20" r="2" fill="#fff" /><circle cx="96" cy="88" r="2.5" fill="#fff" /><circle cx="20" cy="96" r="2" fill="#fff" /></>,
  kukur: <><path d="M30 62q4-14 30-14h22q14 0 14 16v26h-8V74H46v16h-8V74q-8-2-8-12z" fill="#c08a55" stroke={INK} strokeWidth="3" strokeLinejoin="round" /><path d="M30 62q-12-4-12-16" {...line} strokeWidth={4} /><circle cx="90" cy="44" r="16" fill="#c08a55" stroke={INK} strokeWidth="3" /><path d="M80 32q-8 6-4 18" fill="#8a5a30" stroke={INK} strokeWidth="2.5" /><circle cx="94" cy="40" r="3" fill={INK} /><circle cx="105" cy="48" r="3.5" fill={INK} /><path d="M108 22q6 4 4 12M114 14q10 8 6 22" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" /></>,
  baksho: <><rect x="16" y="58" width="50" height="46" rx="3" fill="#c8955a" stroke={INK} strokeWidth="3" /><rect x="54" y="30" width="50" height="74" rx="3" fill="#d6a46a" stroke={INK} strokeWidth="3" /><path d="M41 58v18M79 30v20" stroke="#f3e0b5" strokeWidth="6" /><rect x="26" y="20" width="30" height="38" rx="3" fill="#b9854b" stroke={INK} strokeWidth="3" /></>,
  cycle: <><circle cx="30" cy="84" r="20" {...line} /><circle cx="90" cy="84" r="20" {...line} /><path d="M30 84l22-28h28l10 28M52 56l8 28 20-28M80 56l-4-16h12M46 48h14" fill="none" stroke="#d9483b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /><path d="M60 84l-4-4" {...line} /><path d="M70 22q-10-10-14 0 4 10 14 0 10-10 14 0-4 10-14 0z" fill="#ffd166" stroke={INK} strokeWidth="2.5" /></>,
  board: <><rect x="10" y="16" width="100" height="70" rx="4" fill="#2f5d50" stroke="#8b5e3c" strokeWidth="6" /><text x="60" y="64" textAnchor="middle" fontSize="22" fontWeight="700" fill="#f4f1e8">অ আ ক</text><path d="M30 98h60M40 98l-6 14M80 98l6 14" stroke="#8b5e3c" strokeWidth="5" strokeLinecap="round" /></>,
  chhora: <><path d="M60 40Q40 30 16 36v60q24-6 44 4 20-10 44-4V36q-24-6-44 4z" fill="#fff" stroke={INK} strokeWidth="3" strokeLinejoin="round" /><path d="M60 40v60M26 52h24M26 64h24M26 76h18M70 52h24M70 64h16" stroke="#9b8a72" strokeWidth="3" strokeLinecap="round" /><path d="M86 16v20a6 5 0 1 1-4-4.5V20l14-4v14a6 5 0 1 1-4-4.5V18z" fill="#7151a3" /></>,
  baj: <><path d="M20 46a15 15 0 0 1 14-22 20 20 0 0 1 37 3 14 14 0 0 1 9 25H24a10 10 0 0 1-4-6z" fill="#5d6b80" stroke={INK} strokeWidth="3" /><path d="M62 54L46 82h14l-8 28 28-38H64l8-18z" fill="#ffd23f" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" /><path d="M86 70l-4 10M98 62l-4 10M28 70l-4 10" stroke="#3f8fd0" strokeWidth="4" strokeLinecap="round" /></>,
  bench: <><rect x="10" y="60" width="100" height="12" rx="4" fill="#a8693c" stroke={INK} strokeWidth="3" /><path d="M22 72v32M98 72v32M14 46h92" stroke="#a8693c" strokeWidth="7" strokeLinecap="round" /><path d="M22 46v14M98 46v14" stroke="#a8693c" strokeWidth="6" /><rect x="70" y="44" width="26" height="16" rx="5" fill="#4aa3b5" stroke={INK} strokeWidth="2.5" /></>,
  carrom: <><rect x="34" y="14" width="80" height="80" rx="6" fill="#ecc98f" stroke="#7a4a22" strokeWidth="7" /><circle cx="42" cy="22" r="5" fill={INK} /><circle cx="106" cy="22" r="5" fill={INK} /><circle cx="42" cy="86" r="5" fill={INK} /><circle cx="106" cy="86" r="5" fill={INK} /><circle cx="74" cy="54" r="12" fill="none" stroke="#c8402e" strokeWidth="2" /><circle cx="74" cy="54" r="5" fill="#c8402e" /><circle cx="98" cy="78" r="5" fill="#fff" stroke={INK} strokeWidth="1.5" /><circle cx="24" cy="94" r="20" fill="none" stroke="#4d5866" strokeWidth="5" /><path d="M24 74v40M4 94h40M10 80l28 28M38 80l-28 28" stroke="#4d5866" strokeWidth="2" /><circle cx="24" cy="94" r="4" fill="#4d5866" /></>,
  pani: <><path d="M20 70h80q-6 30-40 30T20 70z" fill="#c3ccd6" stroke={INK} strokeWidth="3" /><path d="M24 70q36 8 72 0" fill="#7cc3e8" stroke={INK} strokeWidth="2" /><path d="M44 50q-5 8 0 12 5-4 0-12zM62 36q-5 8 0 12 5-4 0-12zM80 50q-5 8 0 12 5-4 0-12zM30 34q-5 8 0 12 5-4 0-12zM94 28q-5 8 0 12 5-4 0-12z" fill="#3f8fd0" /><circle cx="60" cy="16" r="6" fill="#f2a900" /><circle cx="52" cy="20" r="5" fill="#ffd166" /><circle cx="68" cy="20" r="5" fill="#ffd166" /></>,
  dolna: <><path d="M60 10L26 62M60 10l34 52" stroke="#8b5e3c" strokeWidth="3" /><path d="M20 62h80q-6 40-40 40T20 62z" fill="#e9c46a" stroke={INK} strokeWidth="3" /><circle cx="44" cy="62" r="11" fill="#f6d2b0" stroke={INK} strokeWidth="2.5" /><path d="M40 62q4 3 8 0" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" /><path d="M52 60q16-8 40 0v8H52z" fill="#f9cadb" stroke={INK} strokeWidth="2.5" /></>,
  nagordola: <><circle cx="60" cy="52" r="40" fill="none" stroke="#7151a3" strokeWidth="4" /><path d="M60 12v80M20 52h80M32 24l56 56M88 24l-56 56" stroke="#7151a3" strokeWidth="2" /><path d="M60 52l-26 58M60 52l26 58M30 110h60" stroke={INK} strokeWidth="4" strokeLinecap="round" /><circle cx="60" cy="12" r="7" fill="#e8443a" /><circle cx="100" cy="52" r="7" fill="#ffd166" /><circle cx="60" cy="92" r="7" fill="#4caf7a" /><circle cx="20" cy="52" r="7" fill="#3f8fd0" /><circle cx="88" cy="24" r="6" fill="#e2557a" /><circle cx="32" cy="24" r="6" fill="#f2a900" /><circle cx="88" cy="80" r="6" fill="#16877a" /><circle cx="32" cy="80" r="6" fill="#c8402e" /></>,
  suitcase: <><path d="M46 32V20h28v12" {...line} /><rect x="18" y="32" width="84" height="68" rx="10" fill="#3d7a8c" stroke={INK} strokeWidth="3" /><path d="M40 32v68M80 32v68" stroke="#2a5866" strokeWidth="4" /><circle cx="60" cy="56" r="10" fill="#ffd166" /><rect x="52" y="76" width="22" height="12" rx="3" fill="#f4f1e8" /><circle cx="30" cy="104" r="5" fill={INK} /><circle cx="90" cy="104" r="5" fill={INK} /></>,
  cake: <><ellipse cx="38" cy="98" rx="30" ry="7" fill="#fff" stroke={INK} strokeWidth="2.5" /><path d="M14 92l28-30 22 30z" fill="#f4d7a5" stroke={INK} strokeWidth="3" strokeLinejoin="round" /><path d="M26 80h26M20 86h40" stroke="#e2557a" strokeWidth="3" /><path d="M80 104q-6-30 8-46l-4-14 10 8h8l10-8-4 14q8 10 4 46z" fill="#8a8f98" stroke={INK} strokeWidth="3" strokeLinejoin="round" /><circle cx="92" cy="62" r="2.5" fill={INK} /><circle cx="104" cy="62" r="2.5" fill={INK} /><path d="M96 70q2 3 4 0" stroke={INK} strokeWidth="2" fill="none" /><path d="M98 74q2 6 0 8" stroke="#f4d7a5" strokeWidth="3" strokeLinecap="round" /></>,
};

export function SceneArt({ prop }: { prop: Prop }) {
  return <svg viewBox="0 0 120 120" aria-hidden="true">{PROPS[prop]}</svg>;
}

const ICONS: Record<Icon, ReactNode> = {
  hug: <path d="M24 41C8 31 4 21 10 12c5-6 12-4 14 2 2-6 9-8 14-2 6 9 2 19-14 29z" fill="#e0607e" />,
  tell: <><path d="M6 8h36a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H22l-10 8v-8H6a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z" fill="#4a90d9" /><circle cx="14" cy="21" r="3" fill="#fff" /><circle cx="24" cy="21" r="3" fill="#fff" /><circle cx="34" cy="21" r="3" fill="#fff" /></>,
  breathe: <><ellipse cx="24" cy="18" rx="13" ry="15" fill="#f08a5d" /><path d="M24 33l-3 4h6zM24 37q-4 5 0 9" fill="#f08a5d" stroke="#8a5a40" strokeWidth="1.5" /></>,
  count: <><rect x="4" y="6" width="40" height="36" rx="8" fill="#16877a" /><text x="24" y="33" textAnchor="middle" fontSize="22" fontWeight="800" fill="#fff">১০</text></>,
  share: <><path d="M22 6a18 18 0 0 0 0 36z" fill="#e9b872" stroke="#a8743a" strokeWidth="2" /><path d="M26 6a18 18 0 0 1 0 36z" fill="#e9b872" stroke="#a8743a" strokeWidth="2" /></>,
  make: <><path d="M8 40l4-12L34 6l8 8-22 22z" fill="#f2b705" stroke={INK} strokeWidth="2" strokeLinejoin="round" /><path d="M8 40l4-12 8 8z" fill="#f4d7a5" /></>,
  hand: <g fill="#e8a878"><rect x="10" y="12" width="7" height="20" rx="3.5" /><rect x="18" y="5" width="7" height="24" rx="3.5" /><rect x="26" y="6" width="7" height="22" rx="3.5" /><rect x="34" y="12" width="6" height="18" rx="3" /><path d="M10 24h30v6q0 14-15 14-12 0-15-14z" /></g>,
  thanks: <><circle cx="24" cy="12" r="7" fill="#e2557a" /><circle cx="35" cy="20" r="7" fill="#e2557a" /><circle cx="31" cy="33" r="7" fill="#e2557a" /><circle cx="17" cy="33" r="7" fill="#e2557a" /><circle cx="13" cy="20" r="7" fill="#e2557a" /><circle cx="24" cy="23" r="6" fill="#ffd166" /></>,
  sit: <><circle cx="15" cy="15" r="7" fill="#c98a00" /><circle cx="33" cy="15" r="7" fill="#3f73b8" /><path d="M5 40q0-16 10-16t10 16zM23 40q0-16 10-16t10 16z" fill="#9b8a72" /></>,
  play: <><circle cx="24" cy="24" r="18" fill="#fff" stroke={INK} strokeWidth="2.5" /><path d="M8 18q16 8 32 0M8 30q16-8 32 0" stroke="#c8402e" strokeWidth="2.5" fill="none" /></>,
  light: <><path d="M26 18l18-10v32L26 30z" fill="#ffe07a" /><rect x="4" y="16" width="24" height="16" rx="3" fill="#4d5866" /></>,
  walk: <><ellipse cx="16" cy="30" rx="6" ry="10" fill="#9b8a72" /><ellipse cx="32" cy="16" rx="6" ry="10" fill="#9b8a72" /></>,
  song: <path d="M18 8v24a6 5 0 1 1-4-4.5V12l20-6v20a6 5 0 1 1-4-4.5V10z" fill="#7151a3" />,
};

export function KindIcon({ icon }: { icon: Icon }) {
  return <svg viewBox="0 0 48 48" aria-hidden="true">{ICONS[icon]}</svg>;
}

export function Ghost() {
  return <svg className="mr-ghost" viewBox="0 0 48 60" aria-hidden="true">
    <path d="M14 30V8a5 5 0 0 1 10 0v16l12 2a6 6 0 0 1 5 7l-2 13a10 10 0 0 1-10 9H19a9 9 0 0 1-7-4L3 39a4.5 4.5 0 0 1 7-5z" fill="#fff" stroke="#1d2b53" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>;
}

/** A round face placed inside a larger SVG (the title's ring of six). */
export function FaceAt({ feeling, fill, x, y, size, className, delay = 0 }: { feeling: Feeling | "calm"; fill: string; x: number; y: number; size: number; className?: string; delay?: number }) {
  return <g transform={`translate(${x - size / 2} ${y - size / 2}) scale(${size / 100})`}>
    <g className={className} style={{ animationDelay: `${delay}ms` }}><path d={HEAD} fill={fill} stroke={INK} strokeWidth="4" />{parts(feeling)}</g>
  </g>;
}

/** The end buttons are pictures: a circling arrow (আবার খেলো), a closed book (শেষ) and an arrow (পরের ধাপ). */
export const AgainIcon = () => <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M38 24a14 14 0 1 1-4.1-9.9" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" /><path d="M36 6v10H26" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
export const DoneIcon = () => <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 8h24a4 4 0 0 1 4 4v28H14a4 4 0 0 1-4-4z" fill="currentColor" opacity=".9" /><path d="M10 36a4 4 0 0 1 4-4h24" fill="none" stroke="#fff" strokeWidth="3" /><path d="M18 16h12M18 22h8" stroke="#fff" strokeWidth="3" strokeLinecap="round" /></svg>;
export const NextIcon = () => <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 24h26M26 13l11 11-11 11" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" /></svg>;

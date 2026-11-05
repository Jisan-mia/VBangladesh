// The experiments, drawn in SVG, and the picture buttons. Each scene shows its setup while the child guesses; once `is-play` is on,
// CSS animations run the experiment and hold its last frame (the result). A tiny invisible `ki-clock` runs as long as the
// experiment: when it ends the answer shows, and because it is a CSS animation, pausing the scene pauses the clock too.
// Sounds ride on animation start events (`data-snd`), so a sound can never come before its picture or after a pause.
import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { PICS, moonPath, type Part, type Pic } from "../lib/art";
import type { Item } from "../lib/items";

export function PicG({ pic, x = 0, y = 0, size = 64 }: { pic: Pic; x?: number; y?: number; size?: number }) {
  return <g transform={`translate(${x - size / 2} ${y - size / 2}) scale(${size / 64})`}>
    {(PICS[pic] as Part[]).map((part, index) => <path key={index} d={part.d} fill={part.fill ?? "none"} stroke={part.stroke} strokeWidth={part.w}
      opacity={part.alpha} strokeLinecap="round" strokeLinejoin="round" />)}
  </g>;
}

/** A picture as its own small SVG, 1 or 2 pictures wide. */
export function Pics({ pics, height = 58 }: { pics: readonly Pic[]; height?: number }) {
  return <svg viewBox={`0 0 ${64 * pics.length} 64`} style={{ height, width: "auto", maxWidth: "100%" }} aria-hidden="true">
    {pics.map((pic, k) => <PicG key={pic} pic={pic} x={32 + 64 * k} y={32} />)}
  </svg>;
}

/** A positioned group whose child moves by CSS (a CSS transform would replace the position if both sat on one element). */
const At = ({ x, y, className, style, snd, children }: { x: number; y: number; className?: string; style?: CSSProperties; snd?: string; children?: ReactNode }) =>
  <g transform={`translate(${x} ${y})`}><g className={className} style={style} data-snd={snd}>{children}</g></g>;

/** A one-millisecond animation whose start (after its delay) fires a sound. */
const Ping = ({ snd, at }: { snd: string; at: number }) => <rect className="ki-ping" data-snd={snd} width="1" height="1" style={{ animationDelay: `${at}s` }} />;

const SKY = "#dff0fb", GROUND = "#d9c48f", GRASS = "#9ccf5a", WATER = "#3a8fd0", INK = "#33415c";
const s = (n: number) => ({ animationDelay: `${n}s` });

function Pond({ item }: { item: Item }) {
  const [a, b] = item.drop!, [fa, fb] = item.floats!;
  const lands = [fa ? "ki-float" : "ki-sink", fb ? "ki-float" : "ki-sink"];
  return <>
    <rect x="-10" y="-40" width="340" height="260" fill={SKY} />
    <path d="M0 96H34L46 88H0ZM320 96H286L274 88H320Z" fill={GRASS} />
    <At x={105} y={36} className={lands[0]}><PicG pic={a} size={50} /></At>
    <At x={215} y={36} className={lands[1]} style={s(0.35)}><PicG pic={b} size={50} /></At>
    <rect y="96" width="320" height="124" fill={WATER} opacity=".62" />
    <path d="M0 96H320" stroke="#e6f2fb" strokeWidth="2" />
    <rect y="172" width="320" height="48" fill="#6d5a3a" opacity=".5" />
    {[105, 215].map((x, i) => <g key={x}>
      <At x={x} y={96} className="ki-ripple" style={s(0.75 + i * 0.35)}><ellipse rx="30" ry="6" fill="none" stroke="#ffffff" strokeWidth="2" /></At>
      {[[-14, -22], [0, -30], [14, -22]].map(([dx, dy], k) => <At key={k} x={x} y={94} className="ki-spray" style={{ ...s(0.75 + i * 0.35), "--sx": `${dx}px`, "--sy": `${dy}px` } as CSSProperties}>
        <circle r="2.6" fill="#ffffff" />
      </At>)}
      <Ping snd="splash" at={0.75 + i * 0.35} />
    </g>)}
  </>;
}

function Ice() {
  const cube = (x: number, cls: string) => <>
    <ellipse cx={x} cy="146" rx="44" ry="9" fill="#ffffff" stroke="#b7c3cf" strokeWidth="2" />
    <At x={x} y={145} className={`ki-puddle ${cls}`}><ellipse rx="34" ry="6" fill="#8fc9e6" opacity=".8" /></At>
    <At x={x} y={144} className={cls}><rect x="-20" y="-38" width="40" height="38" rx="3" fill="#d6f0fb" stroke="#8fc9e6" strokeWidth="2.5" /><path d="M-12 -30h8" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" /></At>
  </>;
  return <>
    <rect x="-10" y="-40" width="340" height="260" fill={SKY} />
    <rect x="160" y="-40" width="160" height="260" fill="#c9d9e3" />
    <rect y="132" width="320" height="88" fill={GROUND} />
    <PicG pic="sun" x={42} y={34} size={58} />
    <PicG pic="shade" x={262} y={52} size={110} />
    <text x="80" y="30" className="ki-tag">রোদ</text><text x="186" y="30" className="ki-tag">ছায়া</text>
    {cube(90, "ki-melt-fast")}{cube(232, "ki-melt-slow")}
    <Ping snd="drip" at={0.9} /><Ping snd="drip" at={1.7} /><Ping snd="drip" at={2.4} />
  </>;
}

function Fall({ item }: { item: Item }) {
  const moon = item.scene === "moonfall", [left, right] = item.duo!, [driftL, driftR] = item.drifts!;
  const way = (drift: boolean) => moon ? "ki-fall-moon" : drift ? "ki-drift" : "ki-fall";
  return <>
    <rect x="-10" y="-40" width="340" height="260" fill={moon ? "#1d2340" : SKY} />
    {moon && <>
      <path d="M30 20h1M80 44h1M150 14h1M240 50h1M200 24h1M60 70h1M300 80h1" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="280" cy="34" r="14" fill={WATER} /><path d="M272 28c4 0 6 4 4 8s3 6 8 4" stroke="#3f8f4a" strokeWidth="3" fill="none" />
    </>}
    <rect y="156" width="320" height="64" fill={moon ? "#9a9aa6" : GRASS} />
    {moon && <path d="M40 166a14 4 0 0 0 28 0M230 170a18 5 0 0 0 36 0" stroke="#7a7a86" strokeWidth="3" fill="none" />}
    <rect x="70" y="10" width="180" height="6" rx="2" fill={moon ? "#59596a" : "#7a4a22"} />
    <At x={110} y={38} className={way(driftL)}><PicG pic={left} size={40} /></At>
    <At x={210} y={38} className={way(driftR)}><PicG pic={right} size={40} /></At>
    {moon && <text x="16" y="150" className="ki-tag ki-tag-light">চাঁদ</text>}
    <Ping snd="whoosh" at={0.2} />
    {moon ? <Ping snd="thud" at={2.0} /> : <>
      {!driftL && <Ping snd="thud" at={1.1} />}{!driftR && <Ping snd="thud" at={1.1} />}
      {(driftL || driftR) && <Ping snd="thud" at={3.2} />}
    </>}
  </>;
}

function Shadow() {
  return <>
    <rect x="-10" y="-40" width="340" height="260" fill={SKY} />
    <At x={0} y={0} className="ki-dusk"><rect x="-10" y="-40" width="340" height="260" fill="#f6c99b" /></At>
    <rect y="132" width="320" height="88" fill={GROUND} />
    <At x={160} y={24} className="ki-sunset"><circle r="14" fill="#f6b93b" /></At>
    <At x={160} y={134} className="ki-shadow"><rect y="-3" width="20" height="7" rx="2" fill="#4a4a4a" opacity=".75" /></At>
    <rect x="156" y="66" width="8" height="70" rx="2" fill="#7a4a22" />
    <At x={20} y={30} className="ki-noon-tag"><text className="ki-tag">দুপুর</text></At>
    <At x={238} y={30} className="ki-eve-tag" snd="shimmer"><text className="ki-tag">বিকেল</text></At>
  </>;
}

function Seed() {
  return <>
    <rect x="-10" y="-40" width="340" height="260" fill={SKY} />
    <rect x="208" y="20" width="108" height="200" rx="4" fill="#2d3047" />
    <path d="M208 20h10v160h-10z" fill="#444b6e" />
    <rect y="170" width="320" height="50" fill="#b07a3e" />
    <PicG pic="potLight" x={60} y={134} size={72} /><PicG pic="potDry" x={160} y={134} size={72} /><PicG pic="potDark" x={262} y={134} size={72} />
    <At x={60} y={139} className="ki-grow" snd="grow"><path d="M0 0V-46" stroke="#3f8f4a" strokeWidth="4" strokeLinecap="round" /><ellipse cx="-11" cy="-40" rx="11" ry="6" fill="#3f8f4a" /><ellipse cx="11" cy="-48" rx="11" ry="6" fill="#4caf50" /></At>
    <At x={262} y={139} className="ki-grow" snd="hop" style={s(0.5)}><path d="M0 0C3 -30 -4 -50 2 -76" stroke="#ddd67a" strokeWidth="2.5" fill="none" strokeLinecap="round" /><ellipse cx="7" cy="-76" rx="6" ry="3" fill="#e8df7c" /></At>
  </>;
}

function Sky() {
  const spots = [[110, 70], [170, 98], [232, 126]];
  return <>
    <rect x="-10" y="-40" width="340" height="260" fill="#f1f3f5" />
    <At x={0} y={0} className="ki-blue" snd="shimmer"><rect x="-10" y="-40" width="340" height="260" fill="#6fb2ec" /></At>
    <path d="M50 40L300 154" stroke="#fff3c4" strokeWidth="7" className="ki-beam" pathLength="1" />
    {spots.map(([x, y], i) => <g key={x}>
      <circle cx={x} cy={y} r="3.5" fill={INK} />
      <At x={x} y={y} className="ki-ring" snd="hop" style={s(0.9 + i * 0.3)}><circle r="5" fill="none" stroke="#1e64c8" strokeWidth="2.5" /></At>
    </g>)}
    {[[70, 120], [140, 40], [260, 60], [290, 110], [210, 30]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="3" fill={INK} opacity=".5" />)}
    <PicG pic="sun" x={38} y={32} size={58} />
    <rect y="164" width="320" height="56" fill={GRASS} />
  </>;
}

function Sunset() {
  return <>
    <rect x="-10" y="-40" width="340" height="260" fill="#6fb2ec" />
    <At x={0} y={0} className="ki-red"><rect x="-10" y="-40" width="340" height="260" fill="#f08a4b" /></At>
    <At x={0} y={0} className="ki-red ki-red-late"><rect y="90" width="320" height="130" fill="#d9534f" opacity=".55" /></At>
    <At x={90} y={46} className="ki-setting" snd="shimmer"><circle r="16" fill="#fff3c4" /></At>
    <path d="M0 150C60 142 120 146 180 150C230 154 280 146 320 150V220H0Z" fill="#3d5a3a" />
    <rect x="236" y="96" width="5" height="60" fill="#2c3e2a" /><path d="M238 96c-22-4-30-22-20-32 10 6 18 14 20 32c2-18 12-28 26-30-2 14-10 26-26 30Z" fill="#2c3e2a" />
    <path d="M10 176h300" stroke="#2c3e2a" strokeWidth="2" opacity=".0" />
  </>;
}

function Rain() {
  return <>
    <rect x="-10" y="-40" width="340" height="260" fill={SKY} />
    <path d="M0 150C40 144 110 146 160 152V220H0Z" fill={WATER} />
    <path d="M160 152C200 148 260 148 320 150V220H160Z" fill={GRASS} />
    <path d="M180 160v-10M200 162v-12M220 160v-10M240 162v-12M260 160v-10M280 162v-12M300 160v-10" stroke="#3f8f4a" strokeWidth="2.5" strokeLinecap="round" />
    <PicG pic="sun" x={34} y={30} size={50} />
    {[40, 80, 120].map((x, i) => <At key={x} x={x} y={142} className="ki-rise" style={s(i * 0.25)}>
      <path d="M0 0c-6-8 6-12 0-22" stroke="#ffffff" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </At>)}
    <At x={236} y={44} className="ki-cloud" snd="rumble" style={s(0.9)}><path d="M-46 14a14 14 0 0 1 10-24a18 18 0 0 1 34-8a16 16 0 0 1 30 6a14 14 0 0 1 16 26Z" fill="#8f9bb0" /></At>
    {[200, 222, 244, 266, 288].map((x, i) => <At key={x} x={x} y={66} className="ki-rain" snd={i === 0 || i === 3 ? "patter" : undefined} style={s(2 + (i % 3) * 0.2)}>
      <path d="M0 0l-3 10" stroke={WATER} strokeWidth="3" strokeLinecap="round" />
    </At>)}
    <At x={0} y={0} className="ki-back"><path d="M196 172C170 178 150 176 128 168" stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round" /><path d="M134 162l-7 6 9 3" stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round" /></At>
  </>;
}

function Moon() {
  const phases = [0, 0.125, 0.25, 0.375, 0.5];
  return <>
    <rect x="-10" y="-40" width="340" height="260" fill="#141a33" />
    <path d="M0 30H22M0 60H22M0 90H22M0 120H22" stroke="#f6b93b" strokeWidth="3" strokeLinecap="round" />
    <circle cx="160" cy="74" r="52" fill="none" stroke="#4b5378" strokeWidth="1.5" strokeDasharray="4 5" />
    <circle cx="160" cy="74" r="14" fill={WATER} />
    <path d="M152 68c4 0 6 4 4 8s3 6 8 4" stroke="#3f8f4a" strokeWidth="3" fill="none" />
    <At x={160} y={74} className="ki-orbit"><g transform="translate(-52 0)"><g className="ki-counter">
      <circle r="10" fill="#59596a" /><path d="M0 -10A10 10 0 0 0 0 10Z" fill="#f4e9b8" />
    </g></g></At>
    {phases.map((t, i) => <At key={t} x={40 + i * 60} y={158} className="ki-phase" snd={`chime${i}`} style={s(0.2 + i * 0.55)}>
      <circle r="14" fill="#2a3050" /><path d={moonPath(t, 14)} fill="#f4e9b8" />
    </At>)}
  </>;
}

/** The sweep: the magnet crosses over three things at 70, 160 and 250; only the one it pulls hops up and rides along. */
const SLOTS = [70, 160, 250], CLICK_AT = [0.65, 1.85, 2.96];
function Magnet({ item }: { item: Item }) {
  const pulled = item.answer;
  return <>
    <rect x="-10" y="-40" width="340" height="260" fill={SKY} />
    <rect x="20" y="140" width="280" height="10" rx="2" fill="#b07a3e" /><path d="M40 150v28M280 150v28" stroke="#8a5a2a" strokeWidth="6" />
    {item.choices.map((choice, k) => k === pulled ? null : <PicG key={k} pic={choice.pics[0]} x={SLOTS[k]} y={118} size={44} />)}
    <At x={SLOTS[pulled]} y={118} className={`ki-pick ki-pick-${pulled}`}><PicG pic={item.choices[pulled].pics[0]} size={44} /></At>
    <At x={SLOTS[0]} y={58} className="ki-magnet">
      <path d="M-20 16V-2a20 20 0 0 1 40 0V16H9V-2a9 9 0 0 0-18 0V16Z" fill="#d64545" />
      <path d="M-20 9h11v7h-11zM9 9h11v7H9z" fill="#c5ced6" />
    </At>
    <Ping snd="click" at={CLICK_AT[pulled]} />
  </>;
}

function Phone({ item }: { item: Item }) {
  const loose = Boolean(item.loose);
  const kid = (x: number, glasses: boolean, shirt: string, hair: string) => <g>
    <rect x={x - 18} y="92" width="36" height="66" rx="8" fill={shirt} />
    <circle cx={x} cy="70" r="18" fill="#a0673f" />
    <path d={`M${x - 18} 66a18 18 0 0 1 36 0c-6-8-30-8-36 0Z`} fill={hair} />
    {!glasses && <path d={`M${x - 16} 64c-8 6-8 20-2 28`} stroke={hair} strokeWidth="5" fill="none" strokeLinecap="round" />}
    {glasses && <path d={`M${x - 12} 70h8M${x + 4} 70h8M${x - 4} 70h8`} stroke={INK} strokeWidth="2.5" strokeLinecap="round" />}
    <circle cx={x - 7} cy="71" r="1.6" fill={INK} /><circle cx={x + 7} cy="71" r="1.6" fill={INK} />
  </g>;
  return <>
    <rect x="-10" y="-40" width="340" height="260" fill={SKY} />
    <rect y="158" width="320" height="62" fill={GRASS} />
    {kid(40, false, "#f2c14e", "#2b1d14")}{kid(280, true, "#5bb381", "#1f1a17")}
    <path d={loose ? "M86 80C130 118 190 118 234 80" : "M86 80H234"} stroke="#8a5a14" strokeWidth="2" fill="none" />
    <path d="M62 72h22l-4 16h-14z" fill="#ffffff" stroke={INK} strokeWidth="2" />
    <path d="M258 72h-22l4 16h14z" fill="#ffffff" stroke={INK} strokeWidth="2" />
    <At x={0} y={0} className="ki-say" snd="hum"><path d="M60 64a10 10 0 0 0 0 20M54 58a18 18 0 0 0 0 32" stroke="#2b6cb0" strokeWidth="2.5" fill="none" strokeLinecap="round" /></At>
    {[0, 1, 2].map(i => <At key={i} x={86} y={80} className={loose ? "ki-buzz-short" : "ki-buzz"} style={s(0.3 + i * 0.3)}><circle r="4" fill="#2b6cb0" /></At>)}
    {!loose && <At x={0} y={0} className="ki-hear" snd="chime3"><path d="M262 60a14 14 0 0 1 0 22M268 54a22 22 0 0 1 0 34" stroke="#2b6cb0" strokeWidth="2.5" fill="none" strokeLinecap="round" /></At>}
    {loose && <At x={160} y={132} className="ki-still"><path d="M-14 0h28" stroke="#8a96a3" strokeWidth="3" strokeLinecap="round" /></At>}
  </>;
}

function Drum() {
  const rice = [[112, 100], [138, 104], [162, 98], [186, 104], [208, 100], [150, 108]];
  return <>
    <rect x="-10" y="-40" width="340" height="260" fill={SKY} />
    <rect y="158" width="320" height="62" fill={GRASS} />
    <path d="M90 112v38a70 18 0 0 0 140 0v-38Z" fill="#c0643a" />
    <path d="M90 124h140M90 140h140" stroke="#8a4a24" strokeWidth="3" />
    <ellipse cx="160" cy="112" rx="70" ry="16" fill="#f2d19c" stroke="#8a5a2a" strokeWidth="3" />
    {rice.map(([x, y], i) => <At key={i} x={x} y={y} className="ki-hop" style={{ ...s(0.35 + (i % 3) * 0.04), "--h": `${-26 - (i % 3) * 10}px` } as CSSProperties}>
      <ellipse rx="3.2" ry="2" fill="#ffffff" stroke="#8a96a3" strokeWidth="1" />
    </At>)}
    <At x={248} y={74} className="ki-stick"><path d="M0 0L-52 28" stroke="#7a4a22" strokeWidth="5" strokeLinecap="round" /><circle cx="-54" cy="29" r="6" fill="#b07a3e" /></At>
    <At x={0} y={0} className="ki-waves"><path d="M84 96c-8 6-8 16 0 22M72 90c-14 10-14 28 0 38M236 96c8 6 8 16 0 22M248 90c14 10 14 28 0 38" stroke="#2b6cb0" strokeWidth="2.5" fill="none" strokeLinecap="round" /></At>
    <Ping snd="tap" at={0.35} /><Ping snd="tap" at={0.95} /><Ping snd="hop" at={0.4} /><Ping snd="hop" at={1.0} />
  </>;
}

const DRAW: Record<Item["scene"], (item: Item) => ReactNode> = {
  pond: item => <Pond item={item} />, ice: () => <Ice />, fall: item => <Fall item={item} />, moonfall: item => <Fall item={item} />,
  shadow: () => <Shadow />, seed: () => <Seed />, sky: () => <Sky />, sunset: () => <Sunset />, rain: () => <Rain />, moon: () => <Moon />,
  magnet: item => <Magnet item={item} />, phone: item => <Phone item={item} />, drum: () => <Drum />,
};

/**
 * One experiment. `playing` starts the animations (and the clock); `onEnd` fires once when the clock finishes; `onSound` hears each
 * `data-snd` start. `slow` plays everything at 0.6× (ধীরে খেলো); reduced motion is handled in CSS (it jumps to the last frame).
 */
export function SceneView({ item, playing, slow, onEnd, onSound }: { item: Item; playing: boolean; slow: boolean; onEnd: () => void; onSound: (name: string) => void }) {
  const svg = useRef<SVGSVGElement>(null);
  useLayoutEffect(() => {
    const node = svg.current;
    if (!playing || !node || !node.getAnimations) return;
    for (const animation of node.getAnimations({ subtree: true })) animation.updatePlaybackRate(slow ? 0.6 : 1);
  }, [playing, slow]);
  return <svg ref={svg} className={`ki-scene ki-s-${item.scene}${playing ? " is-play" : ""}`} viewBox="0 -30 320 240" preserveAspectRatio="xMidYMid slice" role="img" aria-label={playing ? item.result : item.ask}
    onAnimationStart={event => { const name = (event.target as Element).getAttribute?.("data-snd"); if (name) onSound(name); }}>
    {DRAW[item.scene](item)}
    {playing && <rect className="ki-clock" width="1" height="1" style={{ animationDuration: `${item.ms}ms` }} onAnimationEnd={event => { if (event.target === event.currentTarget) onEnd(); }} />}
  </svg>;
}

// ---- the title's own picture: a pond where the coconut floats and the brick sinks, under a big question mark ----
export function TitleArt() {
  return <svg className="ki-title-art" viewBox="0 0 300 200" aria-hidden="true">
    <rect width="300" height="200" fill={SKY} />
    <path d="M0 80H30L42 72H0ZM300 80H270L258 72H300Z" fill={GRASS} />
    <rect y="80" width="300" height="120" fill={WATER} opacity=".62" />
    <path d="M0 80H300" stroke="#e6f2fb" strokeWidth="2.5" />
    <rect y="190" width="300" height="10" fill="#6d5a3a" opacity=".5" />
    <At x={90} y={76} className="ki-t-bob"><PicG pic="coconut" size={74} /></At>
    <At x={210} y={150} className="ki-t-rest"><PicG pic="brick" size={70} /></At>
    {[200, 220, 238].map((x, i) => <At key={x} x={x} y={130} className="ki-t-bubble" style={s(i * 0.5)}><circle r="3.5" fill="none" stroke="#e6f2fb" strokeWidth="2" /></At>)}
    <At x={150} y={34} className="ki-t-q"><PicG pic="askWhy" size={58} /></At>
  </svg>;
}

// ---- icons, all drawn here ----
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 3.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** আবার খেলো: a circling arrow. */
export const AgainIcon = () => <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M38 24a14 14 0 1 1-4.5-10.3" {...stroke} /><path d="M35 5v9.5h-9.5" {...stroke} /></svg>;
/** শেষ: a closed book. */
export const DoneIcon = () => <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 9h22a4 4 0 0 1 4 4v26H14a4 4 0 0 1-4-4Z" {...stroke} /><path d="M10 35a4 4 0 0 1 4-4h22M18 17h10" {...stroke} /></svg>;
/** → : on. */
export const NextIcon = () => <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M9 24h28M26 12l12 12-12 12" {...stroke} /></svg>;
/** আবার দেখো: an eye with a circling arrow. */
export const ReplayIcon = () => <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M4 24c5-8 11-12 20-12s15 4 20 12c-5 8-11 12-20 12S9 32 4 24Z" {...stroke} strokeWidth="3" /><circle cx="24" cy="24" r="5" fill="currentColor" /></svg>;
/** A tick in a disc: the answer that happened. */
export const CheckBadge = () => <svg className="ki-mark ki-mark-yes" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" /><path d="M9 16.5l5 5 9-10" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
/** A hand: where your guess was. */
export const HandBadge = () => <svg className="ki-mark ki-mark-hand" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" /><path d="M13 22V9a1.8 1.8 0 0 1 3.6 0v7l4.2.8a2.4 2.4 0 0 1 2 2.8l-.6 3.2a5 5 0 0 1-4.9 4H15a4.5 4.5 0 0 1-3.6-1.8L8 19.4a1.7 1.7 0 0 1 2.6-2z" fill="#fff" /></svg>;
/** The "?" fold: why. */
export const WhyIcon = () => <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2.4" /><path d="M11.5 13a4.6 4.6 0 1 1 6.8 4c-1.6 1-2.3 2-2.3 3.8M16 24.5v.4" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" /></svg>;

export function Ghost() {
  return <svg className="ki-ghost" viewBox="0 0 48 60" aria-hidden="true">
    <path d="M14 30V8a5 5 0 0 1 10 0v16l12 2a6 6 0 0 1 5 7l-2 13a10 10 0 0 1-10 9H19a9 9 0 0 1-7-4L3 39a4.5 4.5 0 0 1 7-5z" fill="#fff" stroke="#1f2d4a" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>;
}

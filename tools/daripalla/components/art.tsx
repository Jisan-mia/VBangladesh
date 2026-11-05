// Our own code art: the shop balance's weights, fruits and a paper ঠোঙা. No photos, no characters.
import type { ReactNode } from "react";
import type { FruitId, Piece } from "../lib/puzzle";
import { bn } from "../lib/levels";

const art = (children: ReactNode) => <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false">{children}</svg>;

/** A cast-iron বাটখারা with a ring on top. The number is drawn by the caller in HTML so Bangla digits use the site font. */
export const WeightArt = () => art(<>
  <path d="M19 9a5 5 0 0 1 10 0" fill="none" stroke="#3b3f47" strokeWidth="3.4" strokeLinecap="round" />
  <path d="M12 13h24l6 28a3 3 0 0 1-3 3.5H9A3 3 0 0 1 6 41z" fill="#555b66" />
  <path d="M12 13h24l1 5H11z" fill="#6b7280" />
</>);

export const FRUIT_ART: Record<FruitId, () => ReactNode> = {
  lichu: () => art(<>
    <path d="M24 14c1-4 3-6 6-7" stroke="#6b4a1c" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    <circle cx="24" cy="28" r="14" fill="#c8323c" />
    {[[18, 22], [26, 20], [30, 28], [22, 31], [17, 33], [28, 36]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.8" fill="#9e1f2b" />)}
  </>),
  peyara: () => art(<>
    <path d="M24 8c-3 4-9 8-11 16-3 10 3 18 11 18s14-8 11-18C33 16 27 12 24 8z" fill="#9cc43c" />
    <path d="M24 9c3-3 7-4 10-3-2 4-6 5-10 3z" fill="#4f8f3a" />
    <circle cx="20" cy="27" r="1.4" fill="#7da22a" /><circle cx="28" cy="32" r="1.4" fill="#7da22a" />
  </>),
  aam: () => art(<>
    <path d="M14 18c4-8 17-9 22-1 5 9 0 22-11 24-9 1-15-7-13-14 1-4 3-5 2-9z" fill="#f4b53f" />
    <path d="M14 18c4-8 12-9 17-6-6 1-11 5-12 13-1 4 0 8 2 12-6-3-9-8-8-12 1-4 2-5 1-7z" fill="#9bbd3d" opacity=".8" />
    <path d="M27 11c3-5 8-6 12-5-2 5-7 7-12 5z" fill="#4f8f3a" />
  </>),
  pepe: () => art(<>
    <ellipse cx="24" cy="27" rx="12" ry="17" fill="#f39a2b" />
    <path d="M14 18c2-6 6-8 10-8s8 2 10 8c-3-2-6-3-10-3s-7 1-10 3z" fill="#6aa23c" />
    <path d="M19 26c1 6 2 10 5 13" stroke="#e07f1a" strokeWidth="2" fill="none" strokeLinecap="round" />
  </>),
  kola: () => art(<>
    <path d="M9 14c0 15 9 26 26 26 4 0 6-2 4-3-16-1-23-11-24-23z" fill="#f5d24a" />
    <path d="M15 14c1 12 8 22 24 23l-2 2C21 39 12 29 11 14z" fill="#e2b726" />
    <path d="M9 14l1-6 5 1-0 5z" fill="#6b5a1c" />
  </>),
  anaros: () => art(<>
    <path d="M24 17l-4-11 4 5 4-5-4 11zm-2 0L12 9l6 2zm4 0l10-8-6 2z" fill="#4f8f3a" />
    <ellipse cx="24" cy="31" rx="11" ry="14" fill="#e2a33a" />
    <path d="M15 24l18 14M15 32l14 11M18 19l15 12M33 24L15 38M33 32L19 43M30 19L15 31" stroke="#b97a1e" strokeWidth="1.6" />
  </>),
  komola: () => art(<>
    <circle cx="24" cy="28" r="15" fill="#f39a1e" />
    <path d="M24 13c3-5 8-6 11-5-2 5-7 6-11 5z" fill="#4f8f3a" />
    {[[19, 24], [28, 22], [30, 31], [21, 34], [25, 28]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.2" fill="#d97c0c" />)}
  </>),
  dab: () => art(<>
    <path d="M10 26c0-11 6-17 14-17s14 6 14 17-6 17-14 17-14-6-14-17z" fill="#4f8f3a" />
    <path d="M17 12c2-3 4-4 7-4s5 1 7 4c-2 1-4 2-7 2s-5-1-7-2z" fill="#d8c27a" />
    <path d="M16 22c-1 6 0 11 3 15" stroke="#6fae52" strokeWidth="2.4" fill="none" strokeLinecap="round" />
  </>),
};

/** A paper ঠোঙা with a star: the unknown in a picture equation. */
export const StarBagArt = () => art(<>
  <path d="M11 13h26l-3 31H14z" fill="#d8a965" />
  <path d="M11 13h26l-1 5H12z" fill="#b98845" />
  <path d="M24 22l2.6 5.4 5.9.8-4.3 4.1 1 5.8L24 35.3l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" fill="#fff6d8" stroke="#8a5d22" strokeWidth="1.2" strokeLinejoin="round" />
</>);

/** The three cords from the beam's hook down to a pan's rim. */
export const Strings = () => <svg className="dp-strings" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
  <path d="M3 100L50 0l47 100M50 0v100" fill="none" stroke="#3a2410" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
</svg>;

export function Ghost() {
  return <svg className="dp-ghost" viewBox="0 0 48 60" aria-hidden="true">
    <path d="M14 30V8a5 5 0 0 1 10 0v16l12 2a6 6 0 0 1 5 7l-2 13a10 10 0 0 1-10 9H19a9 9 0 0 1-7-4L3 39a4.5 4.5 0 0 1 7-5z" fill="#fff" stroke="#1d2b53" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>;
}

/**
 * Each world's shop wall, drawn once behind the balance (flat colours with one dark outline, like painted shop signs).
 * The colours come from the world's variables on `.dp`: मुদির দোকান shelves of jars, ফলের বাজার an awning and crates, ঠোঙার হাট lamps and paper bags.
 */
export function Backdrop({ world }: { world: 0 | 1 | 2 }) {
  return <svg className="dp-backdrop" viewBox="0 0 360 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
    <rect width="360" height="300" style={{ fill: "var(--w-wall)" }} />
    {world === 0 && <>
      <rect y="62" width="360" height="8" style={{ fill: "var(--w-wood)" }} /><rect y="132" width="360" height="8" style={{ fill: "var(--w-wood)" }} />
      {[14, 62, 118, 262, 306].map((x, at) => <g key={x}><rect x={x} y={at % 2 ? 38 : 34} width="32" height={at % 2 ? 24 : 28} rx="4" style={{ fill: ["#b3402a", "#e0a82e", "#4a7c59", "#e0a82e", "#b3402a"][at] }} /><rect x={x + 4} y={at % 2 ? 32 : 28} width="24" height="6" style={{ fill: "var(--w-ink)" }} /></g>)}
      {[30, 86, 280].map((x, at) => <g key={x}><rect x={x} y="104" width="30" height="28" rx="4" style={{ fill: ["#4a7c59", "#b3402a", "#e0a82e"][at] }} /><rect x={x + 3} y="98" width="24" height="6" style={{ fill: "var(--w-ink)" }} /></g>)}
      <path d="M0 258q0-34 28-34h26q28 0 28 34z" style={{ fill: "#d9c08a", stroke: "var(--w-ink)", strokeWidth: 3 }} />
    </>}
    {world === 1 && <>
      {Array.from({ length: 9 }, (_, at) => <rect key={at} x={at * 40} y="0" width="40" height="44" style={{ fill: at % 2 ? "#fff8e6" : "var(--w-accent)" }} />)}
      <path d="M0 44q20 22 40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0" style={{ fill: "#fff8e6", stroke: "var(--w-ink)", strokeWidth: 3 }} />
      <path d="M0 44h360" style={{ stroke: "var(--w-ink)", strokeWidth: 3 }} />
      {[8, 304].map((x, at) => <g key={x}>
        <rect x={x} y="236" width="48" height="26" style={{ fill: "var(--w-wood)", stroke: "var(--w-ink)", strokeWidth: 2.5 }} /><path d={`M${x} 249h48`} style={{ stroke: "var(--w-ink)", strokeWidth: 2 }} />
        {[0, 1, 2].map(k => <circle key={k} cx={x + 10 + k * 14} cy="230" r="8" style={{ fill: at ? ["#f5d24a", "#9cc43c", "#f39a1e"][k] : ["#f39a1e", "#c8323c", "#f5d24a"][k], stroke: "var(--w-ink)", strokeWidth: 2 }} />)}
      </g>)}
      <path d="M326 52c3 20 3 34 0 48M338 52c3 20 5 34 1 50" fill="none" style={{ stroke: "#f5d24a", strokeWidth: 8, strokeLinecap: "round" }} />
    </>}
    {world === 2 && <>
      <path d="M0 8Q180 44 360 8" fill="none" style={{ stroke: "var(--w-ink)", strokeWidth: 3 }} />
      {[30, 80, 130, 230, 280, 330].map(x => { const t = x / 360, y = 8 + 72 * t * (1 - t); return <g key={x}><path d={`M${x} ${y}v7`} style={{ stroke: "var(--w-ink)", strokeWidth: 2 }} /><circle cx={x} cy={y + 14} r="7" style={{ fill: "var(--w-lamp)", stroke: "var(--w-ink)", strokeWidth: 2 }} /></g>; })}
      <path d="M12 300l8-64h40l8 64z" style={{ fill: "#d8a965", stroke: "var(--w-ink)", strokeWidth: 3 }} /><path d="M296 300l8-52h36l8 52z" style={{ fill: "#c9954f", stroke: "var(--w-ink)", strokeWidth: 3 }} />
    </>}
    <rect y="262" width="360" height="38" style={{ fill: "var(--w-counter)" }} /><rect y="262" width="360" height="4" style={{ fill: "var(--w-ink)" }} />
  </svg>;
}

/** One piece drawn inside another svg: a weight with its number, a fruit with its tag, a ঠোঙা with its star. */
function PieceSvg({ piece, x, y, size, reveal = true }: { piece: Piece; x: number; y: number; size: number; reveal?: boolean }) {
  const scale = size / 48;
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    {piece.kind === "weight" ? <>{WeightArt()}</> : piece.kind === "star" ? <>{StarBagArt()}</> : <>{FRUIT_ART[piece.fruit]()}</>}
    {piece.kind !== "star" && (piece.kind === "weight" || reveal || !piece.hidden) && <text x="24" y={piece.kind === "weight" ? 39 : 46} textAnchor="middle" fontSize={piece.kind === "weight" ? 22 : 18} fontWeight="800" fill={piece.kind === "weight" ? "#fff" : "var(--w-ink)"} stroke={piece.kind === "weight" ? "none" : "#fff"} strokeWidth="3" paintOrder="stroke" style={{ fontFamily: "var(--font-display)" }}>{bn(piece.value)}</text>}
    {piece.kind !== "star" && piece.kind === "fruit" && piece.hidden && !reveal && <text x="24" y="46" textAnchor="middle" fontSize="20" fontWeight="800" fill="var(--w-accent)" stroke="#fff" strokeWidth="3" paintOrder="stroke" style={{ fontFamily: "var(--font-display)" }}>?</text>}
  </g>;
}

/**
 * The whole balance as one picture, for the title and the end page: the beam at `tilt` degrees, a few pieces on each pan.
 * `level` lights the gauge gold. Plain svg, so it needs no loop.
 */
export function MiniScale({ tilt, left, right, level }: { tilt: number; left: Piece[]; right: Piece[]; level?: boolean }) {
  const cx = 160, pivot = 74, arm = 104, rad = (tilt * Math.PI) / 180, dx = arm * Math.cos(rad), dy = arm * Math.sin(rad);
  const pan = (x: number, y: number, pieces: Piece[]) => <g transform={`translate(${x} ${y})`}>
    <path d="M-44 70L0 0l44 70M0 0v70" fill="none" stroke="#3a2410" strokeWidth="2.5" />
    {pieces.slice(0, 4).map((piece, at) => <PieceSvg key={at} piece={piece} x={-44 + (at % 2) * 44} y={20 - Math.floor(at / 2) * 38} size={44} reveal />)}
    <path d="M-52 70h104q-6 16-52 16t-52-16z" style={{ fill: "var(--w-brass)", stroke: "#3a2410", strokeWidth: 3 }} />
  </g>;
  return <svg className="dp-mini" viewBox="0 0 320 250" aria-hidden="true" focusable="false">
    <path d="M150 74h20l6 150h-32z" style={{ fill: "var(--w-wood)", stroke: "#3a2410", strokeWidth: 3 }} />
    <path d="M96 232q0-14 64-14t64 14v8H96z" style={{ fill: "var(--w-wood)", stroke: "#3a2410", strokeWidth: 3 }} />
    <g transform={`rotate(${tilt} ${cx} ${pivot})`}><rect x={cx - arm - 10} y={pivot - 7} width={2 * arm + 20} height="14" style={{ fill: "var(--w-brass)", stroke: "#3a2410", strokeWidth: 3 }} /></g>
    <path d={`M${cx - 18} ${pivot - 8}l18-34l18 34`} fill="none" style={{ stroke: level ? "#f2a900" : "#3a2410", strokeWidth: 4 }} />
    <circle cx={cx} cy={pivot} r="9" style={{ fill: level ? "#f2a900" : "var(--w-brass)", stroke: "#3a2410", strokeWidth: 3 }} />
    {pan(cx - dx, pivot - dy + 6, left)}{pan(cx + dx, pivot + dy + 6, right)}
  </svg>;
}

/** The old shop balance's stand (kept until the page switches to the new board). */
export const Stand = () => <svg className="dp-stand" viewBox="0 0 120 200" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">
  <path d="M46 2h28l-4 26H50z" fill="none" stroke="#8a5d22" strokeWidth="4" strokeLinejoin="round" />
  <path d="M60 4v6" stroke="#8a5d22" strokeWidth="3" strokeLinecap="round" />
  <rect x="55" y="28" width="10" height="150" rx="4" fill="#9a6a2c" />
  <path d="M20 196c0-14 18-20 40-20s40 6 40 20z" fill="#7a5222" />
</svg>;

import { FISH_BODY, FISH_EYE, FISH_FIN, FISH_TAIL, FISH_TINTS, MANGO_BODY, MANGO_LEAF } from "../lib/shapes";
import { PIPS, type Look } from "../lib/game";

export function Fish({ tint = 0, flip = false }: { tint?: number; flip?: boolean }) {
  const [body, line] = FISH_TINTS[tint % FISH_TINTS.length];
  return <svg className="gd-fish-art" viewBox="0 0 100 64" aria-hidden="true" style={flip ? { transform: "scaleX(-1)" } : undefined}>
    <path d={FISH_TAIL} fill={line} />
    <path d={FISH_FIN} fill={line} />
    <path d={FISH_BODY} fill={body} stroke={line} strokeWidth="3" />
    <path d="M30 40Q48 46 66 38" fill="none" stroke={line} strokeWidth="2.5" strokeLinecap="round" />
    <circle cx={FISH_EYE.x} cy={FISH_EYE.y} r={FISH_EYE.r} fill="#1f2a30" />
    <circle cx={FISH_EYE.x - 1.5} cy={FISH_EYE.y - 1.5} r="1.6" fill="#fff" />
  </svg>;
}

function Mango() {
  return <svg viewBox="0 0 64 64" aria-hidden="true">
    <path d={MANGO_LEAF} fill="#4f9a3a" />
    <path d={MANGO_BODY} fill="#f5b52e" stroke="#c98a12" strokeWidth="3" />
    <path d="M24 22Q20 30 24 38" fill="none" stroke="#fff6" strokeWidth="4" strokeLinecap="round" />
  </svg>;
}

/** One flashed group: dots, a die face, mangoes or fish in the dice layout for n (1–6). */
export function Pattern({ n, look }: { n: number; look: Look }) {
  return <div className={`gd-pattern gd-look-${look}`} aria-hidden="true">
    {PIPS[n].map(([x, y], index) => <span key={index} style={{ left: `${x * 100}%`, top: `${y * 100}%` }}>
      {look === "mango" ? <Mango /> : look === "fish" ? <Fish tint={index} /> : null}
    </span>)}
  </div>;
}

/** A quantity as a plain row of dots: the picture answer for the youngest, laid out unlike the flashed pattern. */
export function DotRow({ n }: { n: number }) {
  return <span className="gd-dotrow" aria-hidden="true">{Array.from({ length: n }, (_, index) => <i key={index} />)}</span>;
}

export function Ghost() {
  return <svg className="gd-ghost" viewBox="0 0 48 60" aria-hidden="true">
    <path d="M14 30V8a5 5 0 0 1 10 0v16l12 2a6 6 0 0 1 5 7l-2 13a10 10 0 0 1-10 9H19a9 9 0 0 1-7-4L3 39a4.5 4.5 0 0 1 7-5z" fill="#fff" stroke="#1d2b53" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>;
}

/** Mode icons for the three big tabs. */
export function ModeIcon({ mode }: { mode: "guni" | "nojor" | "beshi" }) {
  if (mode === "guni") return <span className="gd-mode-icon"><Fish /><b>১</b></span>;
  if (mode === "nojor") return <span className="gd-mode-icon"><Pattern n={3} look="dice" /></span>;
  return <span className="gd-mode-icon gd-two"><i><Fish tint={1} /></i><i><Fish tint={2} /><Fish tint={3} /></i></span>;
}

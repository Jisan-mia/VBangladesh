// All the game's pictures, drawn in code: fish and mangoes defined once as SVG symbols (so twenty fish cost one drawing),
// the dice and dot patterns, the ghost finger, and the icons of the picture buttons. No image files.
import { FISH_BODY, FISH_EYE, FISH_FIN, FISH_TAIL, FISH_TINTS, MANGO_BODY, MANGO_LEAF } from "../lib/shapes";
import { PIPS } from "../lib/items";
import type { Look, WorldId } from "../lib/levels";

/** Rendered once at the top of the game: every <Fish> and mango refers to these. */
export function Defs() {
  return <svg className="gd-defs" width="0" height="0" aria-hidden="true" focusable="false">
    <defs>
      {FISH_TINTS.map(([body, line], tint) => <symbol key={tint} id={`gd-fish-${tint}`} viewBox="0 0 100 64">
        <path d={FISH_TAIL} fill={line} />
        <path d={FISH_FIN} fill={line} />
        <path d={FISH_BODY} fill={body} stroke={line} strokeWidth="3" />
        <path d="M30 40Q48 46 66 38" fill="none" stroke={line} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={FISH_EYE.x} cy={FISH_EYE.y} r={FISH_EYE.r} fill="#1f2a30" />
        <circle cx={FISH_EYE.x - 1.5} cy={FISH_EYE.y - 1.5} r="1.6" fill="#fff" />
      </symbol>)}
      <symbol id="gd-mango" viewBox="0 0 64 64">
        <path d={MANGO_LEAF} fill="#4f9a3a" />
        <path d={MANGO_BODY} fill="#f5b52e" stroke="#c98a12" strokeWidth="3" />
        <path d="M24 22Q20 30 24 38" fill="none" stroke="#fff6" strokeWidth="4" strokeLinecap="round" />
      </symbol>
    </defs>
  </svg>;
}

export function Fish({ tint = 0, flip = false }: { tint?: number; flip?: boolean }) {
  return <svg className="gd-fish-art" viewBox="0 0 100 64" aria-hidden="true" style={flip ? { transform: "scaleX(-1)" } : undefined}><use href={`#gd-fish-${tint % FISH_TINTS.length}`} /></svg>;
}

/** One flashed group: dots, a die face, mangoes or fish in the dice layout for n (1–6). */
export function Pattern({ n, look }: { n: number; look: Look }) {
  return <span className={`gd-pattern gd-look-${look}`} aria-hidden="true">
    {PIPS[n].map(([x, y], index) => <span key={index} style={{ left: `${x * 100}%`, top: `${y * 100}%` }}>
      {look === "mango" ? <svg viewBox="0 0 64 64"><use href="#gd-mango" /></svg> : look === "fish" ? <Fish tint={index} /> : null}
    </span>)}
  </span>;
}

/** A quantity as a plain row of dots: the picture answer for the youngest, laid out unlike the flashed pattern. */
export function DotRow({ n }: { n: number }) {
  return <span className="gd-dotrow" aria-hidden="true">{Array.from({ length: n }, (_, index) => <i key={index} />)}</span>;
}

/** A ghost finger tapping, so a child who can't read yet sees the move. */
export function Finger() {
  return <svg className="gd-ghost" viewBox="0 0 48 64" aria-hidden="true">
    <circle className="gd-ripple" cx="20" cy="10" r="10" />
    <path d="M14 10a6 6 0 0 1 12 0v20l4-2a6 6 0 0 1 6 2l6 6a8 8 0 0 1 2 6v8c0 6-5 12-12 12H22c-5 0-9-3-11-7L4 40a5 5 0 0 1 8-6l2 3z" fill="#fff" stroke="#1d2b53" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>;
}

/** The three worlds' pictures: a fish, a die, two ponds. */
export function WorldIcon({ world }: { world: WorldId }) {
  if (world === 0) return <span className="gd-wicon"><Fish /></span>;
  if (world === 1) return <span className="gd-wicon"><Pattern n={3} look="dice" /></span>;
  return <span className="gd-wicon gd-two"><i><Fish tint={1} /></i><i><Fish tint={2} /><Fish tint={3} /></i></span>;
}

export const Eye = () => <svg className="gd-eye" viewBox="0 0 48 48" aria-hidden="true"><path d="M3 24c6-11 14-16 21-16s15 5 21 16c-6 11-14 16-21 16S9 35 3 24z" /><circle cx="24" cy="24" r="7" /></svg>;
export const AgainIcon = () => <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M38 24a14 14 0 1 1-4.1-9.9" /><path d="M35 6v9h-9" /></svg>;
export const DoneIcon = () => <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M9 25l10 10 20-22" /></svg>;
export const PlayIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z" /></svg>;
export const ListIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" /></svg>;
export const BackIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>;

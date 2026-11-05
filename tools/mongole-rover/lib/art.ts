// Our own pictures in a 64×64 box, as SVG markup: the same strings draw the board (inline SVG) and the parent card (as images).
import type { Dir } from "./rover";

/** A round, friendly rover: one camera eye on a mast, a blue solar panel, six wheels. Faces right. */
export const ROVER = `<g stroke="#3b2a24" stroke-width="2.5" stroke-linejoin="round">
<rect x="40" y="12" width="5" height="16" fill="#d9d2c6"/>
<rect x="32" y="3" width="22" height="13" rx="6" fill="#f6f2ea"/>
<circle cx="47" cy="9.5" r="4" fill="#24314f"/>
<rect x="9" y="20" width="30" height="6" rx="2" fill="#4f7fd0"/>
<rect x="8" y="26" width="48" height="18" rx="8" fill="#f6f2ea"/>
<path d="M14 35h24" stroke="#e07a3a" stroke-width="4" stroke-linecap="round"/>
<circle cx="16" cy="50" r="7" fill="#4a3a33"/><circle cx="32" cy="50" r="7" fill="#4a3a33"/><circle cx="48" cy="50" r="7" fill="#4a3a33"/>
</g>
<circle cx="48.5" cy="8" r="1.4" fill="#fff"/>
<circle cx="16" cy="50" r="2.2" fill="#c9bfb4"/><circle cx="32" cy="50" r="2.2" fill="#c9bfb4"/><circle cx="48" cy="50" r="2.2" fill="#c9bfb4"/>`;

/** A rock sample: a rounded stone with a bright vein, so it stands out from the sand. */
export const SAMPLE = `<path d="M14 44c-3-9 4-20 15-22 9-2 20 2 22 11 2 8-4 15-14 16-10 1-20 2-23-5z" fill="#7b5b8f" stroke="#3b2a24" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M22 38c5-6 12-8 20-6" fill="none" stroke="#ffd166" stroke-width="3.5" stroke-linecap="round"/>
<path d="M50 10l2.5 5.5L58 18l-5.5 2.5L50 26l-2.5-5.5L42 18l5.5-2.5z" fill="#ffd166"/>`;

/** A crater: a dark bowl with a lit rim. */
export const CRATER = `<ellipse cx="32" cy="36" rx="27" ry="19" fill="#b4542e"/>
<ellipse cx="32" cy="38" rx="20" ry="13" fill="#6e2a16"/>
<path d="M12 31c6-9 34-11 41-1" fill="none" stroke="#f0a77a" stroke-width="3" stroke-linecap="round"/>`;

/** A fat arrow pointing up; rotate it for the other directions. The card draws the same path with Path2D. */
export const ARROW_PATH = "M32 7 56 33H41v24H23V33H8z";
export const ARROW = `<path d="${ARROW_PATH}" fill="currentColor"/>`;
export const TURN: Record<Dir, number> = { U: 0, R: 90, D: 180, L: 270 };

/** Two curved arrows in a circle: the repeat block. */
export const REPEAT = `<g fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"><path d="M14 30a18 18 0 0 1 31-12"/><path d="M50 34a18 18 0 0 1-31 12"/></g>
<path d="M50 8v14H36z" fill="currentColor"/><path d="M14 56V42h14z" fill="currentColor"/>`;

export const svgDocument = (inner: string, box = 64) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${box} ${box}" width="256" height="256">${inner}</svg>`;


/** Earth as a small blue dot in the Mars sky. */
const earth = (cx: number, cy: number, r: number) => `<g stroke="#2d1f1a" stroke-width="2"><circle cx="${cx}" cy="${cy}" r="${r}" fill="#3f78c9"/>
<path d="M${cx - r * 0.6} ${cy - r * 0.2}q${r * 0.3}-${r * 0.5} ${r * 0.7}-${r * 0.4}q-${r * 0.1} ${r * 0.5}-${r * 0.5} ${r * 0.7}z" fill="#58a55c" stroke="none"/>
<path d="M${cx + r * 0.1} ${cy + r * 0.3}q${r * 0.4}-${r * 0.1} ${r * 0.6} ${r * 0.2}q-${r * 0.2} ${r * 0.3}-${r * 0.6} ${r * 0.1}z" fill="#58a55c" stroke="none"/>
<path d="M${cx - r * 0.8} ${cy + r * 0.1}q${r * 0.7} ${r * 0.5} ${r * 1.5} ${r * -0.3}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/></g>`;

const sky = `<rect width="320" height="200" fill="#f0b98a"/><rect y="104" width="320" height="96" fill="#d9773f"/>
<path d="M0 118q70-26 150-6t170-8v96H0z" fill="#c4622f"/><path d="M0 150q90-22 190-4t130-6v60H0z" fill="#b4532a"/>
<g fill="#fff6e6" opacity=".9"><circle cx="40" cy="26" r="1.6"/><circle cx="96" cy="14" r="1.2"/><circle cx="168" cy="30" r="1.5"/><circle cx="214" cy="12" r="1.2"/><circle cx="292" cy="30" r="1.6"/><circle cx="20" cy="64" r="1.2"/></g>`;
const dust = (x: number, y: number) => `<g fill="#e9a06d" opacity=".85"><circle cx="${x}" cy="${y}" r="6"/><circle cx="${x - 10}" cy="${y + 3}" r="4.5"/><circle cx="${x - 19}" cy="${y + 5}" r="3"/></g>`;
const block = (x: number, y: number, turn: number) => `<g transform="translate(${x} ${y})"><rect width="42" height="42" rx="6" fill="#fbefe4" stroke="#2d1f1a" stroke-width="2.5"/><g transform="translate(21 21) rotate(${turn}) scale(.5) translate(-32 -32)" fill="#b8461f">${ARROW}</g></g>`;

/** Three story panels (320×200), each readable without a word: land, find the rocks, plan before you run. */
export const STORY_ART: readonly string[] = [
  `${sky}${earth(246, 52, 15)}${dust(112, 160)}<g transform="translate(106 70) scale(1.5)">${ROVER}</g>`,
  `${sky}<g transform="translate(34 78) scale(1.4)">${ROVER}</g>
<g transform="translate(168 96) scale(.95)">${SAMPLE}</g><g transform="translate(226 126) scale(.8)">${SAMPLE}</g><g transform="translate(248 76) scale(.7)">${SAMPLE}</g>`,
  `${sky}${earth(52, 44, 22)}<path d="M76 54Q150 20 238 86" fill="none" stroke="#2d1f1a" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>
<g fill="none" stroke="#2d1f1a" stroke-width="2.5" stroke-linecap="round"><path d="M148 38q8 8 4 18"/><path d="M160 34q12 12 6 28"/></g>
<g transform="translate(220 72) scale(1.1)">${ROVER}</g>${block(66, 144, 0)}${block(116, 144, 90)}${block(166, 144, 90)}`,
];

/** The title's hill: Mars horizon, Earth in the sky, the rover on a rise. 320×200. */
export const TITLE_ART = `${sky}${earth(262, 40, 11)}<path d="M40 200q40-70 120-72t120 72z" fill="#b4532a"/>
<g transform="translate(112 62) scale(1.55)">${ROVER}</g>${dust(104, 150)}
<g transform="translate(230 128) scale(.55)">${SAMPLE}</g><g transform="translate(36 140) scale(.5)">${CRATER}</g>`;

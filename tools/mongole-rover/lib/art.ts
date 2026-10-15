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


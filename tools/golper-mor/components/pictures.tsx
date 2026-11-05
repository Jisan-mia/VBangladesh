// The book's buttons as pictures, so a child who can't read yet still knows what each one does. All drawn in code,
// 48 units wide, in the current text colour.

const base = { viewBox: "0 0 48 48", "aria-hidden": true, focusable: false, fill: "none", stroke: "currentColor", strokeWidth: 4, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** → the next picture. */
export const NextIcon = () => <svg {...base}><path d="M10 24h26M26 12l12 12-12 12" /></svg>;
/** ← the picture before. */
export const PrevIcon = () => <svg {...base}><path d="M38 24H12M22 12L10 24l12 12" /></svg>;
/** The story's last picture: a closed book with a tick. */
export const TheEndIcon = () => <svg {...base}><path d="M10 8h24a4 4 0 0 1 4 4v28H14a4 4 0 0 1-4-4z" /><path d="M16 17l5 5 9-9" strokeWidth="4.5" /></svg>;
/** The shelf: three books standing on a plank. */
export const ShelfIcon = () => <svg {...base} strokeWidth="3.6"><rect x="8" y="12" width="7" height="24" rx="1.5" /><rect x="18" y="8" width="8" height="28" rx="1.5" /><rect x="29" y="14" width="7" height="22" rx="1.5" transform="rotate(8 32 25)" /><path d="M5 41h38" /></svg>;
/** আবার পড়ো: an arrow that circles back. */
export const AgainIcon = () => <svg {...base}><path d="M38 24a14 14 0 1 1-4.5-10.3" /><path d="M36 6v9h-9" /></svg>;
/** অন্যটা বেছে দেখো: one road that splits in two. */
export const ForkIcon = () => <svg {...base} strokeWidth="3.6"><path d="M24 42V26M24 26L12 12M24 26l12-14" /><path d="M6 20l6-8 8 4M42 20l-6-8-8 4" /></svg>;
/** শেষ: the book closed and put away. */
export const DoneIcon = () => <svg {...base}><rect x="9" y="9" width="30" height="30" rx="5" /><path d="M17 24l5 5 9-10" /></svg>;
/** The big read button on the title. */
export const PlayIcon = () => <svg viewBox="0 0 48 48" aria-hidden focusable={false} fill="currentColor"><path d="M17 11.5v25a2 2 0 0 0 3 1.7l21-12.5a2 2 0 0 0 0-3.4L20 9.8a2 2 0 0 0-3 1.7z" /></svg>;
/** A bookmark: filled when a path was read. */
export const Ribbon = ({ on }: { on: boolean }) => <svg viewBox="0 0 16 22" aria-hidden focusable={false}><path d="M2 1h12v19l-6-4.5L2 20z" fill={on ? "#f2b632" : "#2b1d140f"} stroke={on ? "#a4720f" : "#2b1d1440"} strokeWidth="1.6" strokeLinejoin="round" /></svg>;
/** A lamp on the shelf: lit when all three stories were read. */
export const Lamp = ({ lit }: { lit: boolean }) => <svg viewBox="0 0 32 32" aria-hidden focusable={false}>
  {lit && <g stroke="#f2b632" strokeWidth="2" strokeLinecap="round"><path d="M16 2v3M5 7l2 2M27 7l-2 2M3 17h3M26 17h3" /></g>}
  <path d="M10 25h12l-1.5-9a4.5 4.5 0 0 0-9 0z" fill={lit ? "#ffd75e" : "#c9c1b0"} stroke={lit ? "#b8821a" : "#8d8574"} strokeWidth="1.6" strokeLinejoin="round" /><path d="M9 28h14" stroke="#8d8574" strokeWidth="2.4" strokeLinecap="round" />
</svg>;
/** A tap ring: the ghost finger. */
export const FINGER = <svg viewBox="0 0 40 40" aria-hidden focusable={false}><circle cx="20" cy="20" r="11" fill="#ffffffd9" stroke="currentColor" strokeWidth="3" /><circle cx="20" cy="20" r="4" fill="currentColor" /></svg>;

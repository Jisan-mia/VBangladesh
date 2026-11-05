// The game's own drawings that are not scenes: the ঢোল, its sticks, the ghost finger and the buttons as pictures, so a
// child who can't read yet still knows what each one does. All code, in the current text colour where they are icons.

import type { Ref } from "react";

const icon = { viewBox: "0 0 48 48", "aria-hidden": true, focusable: false, fill: "none", stroke: "currentColor", strokeWidth: 4, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** আবার খেলো: an arrow that circles back. */
export const AgainIcon = () => <svg {...icon}><path d="M38 24a14 14 0 1 1-4.5-10.3" /><path d="M36 6v9h-9" /></svg>;
/** শেষ: back to the drum, a small ঢোল seen from the side. */
export const DoneIcon = () => <svg {...icon} strokeWidth="3.4"><rect x="10" y="12" width="28" height="24" rx="9" /><ellipse cx="10" cy="24" rx="4.5" ry="12" fill="currentColor" stroke="none" opacity=".55" /><ellipse cx="38" cy="24" rx="4.5" ry="12" fill="currentColor" stroke="none" opacity=".55" /><path d="M16 14l4 20M24 14v20M32 14l-4 20" strokeWidth="2.2" /></svg>;
/** সব ছড়া: three lines in a list. */
export const ListIcon = () => <svg {...icon} strokeWidth="3"><path d="M7 11h34M7 24h34M7 37h34" /></svg>;
/** The big play mark on the title drum. */
export const PlayIcon = () => <svg viewBox="0 0 48 48" aria-hidden focusable={false} fill="currentColor"><path d="M17 11.5v25a2 2 0 0 0 3 1.7l21-12.5a2 2 0 0 0 0-3.4L20 9.8a2 2 0 0 0-3 1.7z" /></svg>;

/** The ঢুলি: a head in a turban. Lit when it is the ঢুলি's turn to drum. */
export const DhuliIcon = () => <svg viewBox="0 0 40 40" aria-hidden focusable={false}><circle cx="20" cy="23" r="10" fill="#c98f5e" stroke="#3a2a1c" strokeWidth="2.4" /><path d="M9 20q1-12 11-12t11 12q-11-6-22 0z" fill="#f2b632" stroke="#3a2a1c" strokeWidth="2.4" strokeLinejoin="round" /><circle cx="16.5" cy="24" r="1.4" fill="#3a2a1c" /><circle cx="23.5" cy="24" r="1.4" fill="#3a2a1c" /></svg>;
/** Your hand: an open palm. Lit when it is your turn. The same palm marks a rest. */
export const HandIcon = () => <svg viewBox="0 0 40 40" aria-hidden focusable={false} fill="#f0c9a0" stroke="#3a2a1c" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round"><path d="M12 22V10a2.2 2.2 0 0 1 4.4 0v8M16.4 18V7a2.2 2.2 0 0 1 4.4 0v11M20.8 18V8a2.2 2.2 0 0 1 4.4 0v11M25.2 18v-6a2.2 2.2 0 0 1 4.4 0v14c0 7-4 11-9.6 11-5 0-7-3-9-7l-3-6a2.2 2.2 0 0 1 3.8-2.2L12 22" /></svg>;

/** The ঢোল, seen from the side: a barrel with two skins and laces. It is the drum you tap. */
export function DrumArt({ className = "ct-drum-art" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 300 190" aria-hidden="true" focusable="false">
    <path d="M60 30c-8-8-4-22 8-24M240 30c8-8 4-22-8-24" fill="none" stroke="#c62828" strokeWidth="7" strokeLinecap="round" />
    <rect x="34" y="30" width="232" height="132" rx="54" fill="#b5651d" stroke="#3a2a1c" strokeWidth="5" />
    <path d="M62 36l18 120 18-120 18 120 18-120 18 120 18-120 18 120 18-120 18 120 14-100" fill="none" stroke="#f3e2c0" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
    <ellipse cx="36" cy="96" rx="24" ry="66" fill="#f3e2c0" stroke="#3a2a1c" strokeWidth="5" />
    <ellipse cx="264" cy="96" rx="24" ry="66" fill="#f3e2c0" stroke="#3a2a1c" strokeWidth="5" />
    <ellipse cx="36" cy="96" rx="9" ry="30" fill="#e0c690" />
    <ellipse cx="264" cy="96" rx="9" ry="30" fill="#e0c690" />
  </svg>;
}

/** A drumstick (কাঠি) standing on its handle; it swings from the bottom. */
export function StickArt() {
  return <svg viewBox="0 0 40 140" aria-hidden="true" focusable="false"><path d="M20 132V20" stroke="#3a2a1c" strokeWidth="11" strokeLinecap="round" /><path d="M20 132V20" stroke="#d9a35a" strokeWidth="6" strokeLinecap="round" /><circle cx="20" cy="16" r="11" fill="#f2b632" stroke="#3a2a1c" strokeWidth="4" /></svg>;
}

/** The ghost finger that taps the drum in time on the very first run, so a child who can't read yet sees what to do. */
export function Finger({ fingerRef }: { fingerRef?: Ref<HTMLSpanElement> }) {
  return <span className="ct-finger" ref={fingerRef} aria-hidden="true"><svg viewBox="0 0 40 52"><path d="M15 4a4 4 0 0 1 8 0v20l10 2a5 5 0 0 1 4 6l-3 14a6 6 0 0 1-6 5H17a6 6 0 0 1-5-3L4 34a4 4 0 0 1 6-5l5 5z" fill="#fff" stroke="#3a2a1c" strokeWidth="2.6" strokeLinejoin="round" /></svg></span>;
}

/** A line's rest: an open palm in a dashed ring (nobody taps). */
export const RestMark = () => <svg viewBox="0 0 40 40" aria-hidden focusable={false}><circle cx="20" cy="20" r="17" fill="#fff" stroke="currentColor" strokeWidth="2.6" strokeDasharray="5 4" /><g transform="translate(7 7) scale(.65)"><HandIcon /></g></svg>;

// Small drawn pieces: a doodle per chit (pen strokes, no uniforms or badges), the closed eyes on the hand-off screen.
import type { ReactNode } from "react";
import type { Role } from "../lib/game";

const doodles: Record<Role, ReactNode> = {
  // বাবু: a black umbrella
  0: <><path d="M5 24a19 19 0 0 1 38 0c-3-3-6-3-9.5 0-3-3-6.5-3-9.5 0-3-3-6.5-3-9.5 0-3.5-3-6.5-3-9.5 0z" /><path d="M24 5v32a4 4 0 0 1-8 0" /></>,
  // পুলিশ: a magnifying glass, for finding the thief
  1: <><circle cx="20" cy="20" r="11" /><path d="M28.5 28.5 41 41" strokeWidth="5" /></>,
  // ডাকাত: a big curled moustache
  2: <path d="M24 21c-3-4-8-6-13-3-3 2-4 6-8 5 2 6 10 7 15 4 3-2 5-4 6-5 1 1 3 3 6 5 5 3 13 2 15-4-4 1-5-3-8-5-5-3-10-1-13 3z" fill="currentColor" />,
  // চোর: a tied-up bundle (পোঁটলা)
  3: <><path d="M15 21c-7 6-8 20 9 20s16-14 9-20z" /><path d="M19 21l-5-9 7 4 3-7 3 7 7-4-5 9" /></>,
};

export function RoleDoodle({ role }: { role: Role }) {
  return <svg className="cp-doodle" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{doodles[role]}</svg>;
}

export function ClosedEyes() {
  return <svg className="cp-eyes" viewBox="0 0 120 34" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" aria-hidden="true">
    <path d="M6 10c10 13 34 13 44 0M70 10c10 13 34 13 44 0" />
    <path d="M12 18l-4 6M28 22v8M44 18l4 6M76 18l-4 6M92 22v8M108 18l4 6" />
  </svg>;
}

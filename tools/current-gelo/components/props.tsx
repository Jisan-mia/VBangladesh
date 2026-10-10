import { candleLeft } from "../lib/gelo";

/** The day's candle: it stands shorter the longer the day went without power, and burns while the power is out. */
export function Candle({ minutes, lit }: { minutes: number; lit: boolean }) {
  const height = Math.round(140 * candleLeft(minutes));
  const top = 196 - height;
  return (
    <svg className="cg-candle" viewBox="0 0 120 220" aria-hidden="true">
      <defs>
        <linearGradient id="cg-wax" x1="0" x2="1"><stop offset="0" stopColor="#fff9ee" /><stop offset=".6" stopColor="#f2e6cc" /><stop offset="1" stopColor="#d9c8a6" /></linearGradient>
        <linearGradient id="cg-fire" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#ff9f2e" /><stop offset=".55" stopColor="#ffd36b" /><stop offset="1" stopColor="#fff6d8" /></linearGradient>
        <radialGradient id="cg-halo"><stop offset="0" stopColor="#ffd682" stopOpacity=".85" /><stop offset="1" stopColor="#ffd682" stopOpacity="0" /></radialGradient>
      </defs>
      {lit && <circle className="cg-halo" cx="61" cy={top - 28} r="58" fill="url(#cg-halo)" />}
      <ellipse cx="60" cy="207" rx="54" ry="10" fill="#7f8b92" />
      <ellipse cx="60" cy="204" rx="50" ry="8" fill="#c3ccd1" />
      <ellipse cx="60" cy="201" rx={22 + Math.min(18, minutes / 30)} ry="5" fill="#f3e7cd" />
      <rect x="44" y={top} width="32" height={height} fill="url(#cg-wax)" />
      <ellipse cx="60" cy="196" rx="16" ry="4" fill="url(#cg-wax)" />
      {minutes > 0 && <path d={`M47 ${top}v${Math.min(height - 8, 10 + minutes / 18)}a3 3 0 0 0 6 0V${top}zM68 ${top}v${Math.min(height - 8, 6 + minutes / 30)}a3 3 0 0 0 6 0V${top}z`} fill="#fbf3e2" />}
      <ellipse cx="60" cy={top} rx="16" ry="4" fill="#f8eedb" />
      <path d={`M60 ${top - 1}q1 -5 2.5 -9`} stroke="#2b211a" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      {lit && <path className="cg-flame" d={`M62 ${top - 50}c13 19 11 38 0 38s-13-19 0-38z`} fill="url(#cg-fire)" />}
    </svg>
  );
}

/** A red tin হারিকেন: lit while the power is out, cold glass when it's back. */
export function Hurricane({ lit }: { lit: boolean }) {
  return (
    <svg className="cg-lamp" viewBox="0 0 90 150" aria-hidden="true">
      <path d="M24 34C24 6 66 6 66 34" fill="none" stroke="#35444a" strokeWidth="4" strokeLinecap="round" />
      <path d="M27 32h36l-5 10H32z" fill="#b8432f" />
      <path className="cg-lamp-glass" d="M33 42c-17 18-17 50 0 66h24c17-16 17-48 0-66z" stroke="#35444a" strokeWidth="2.5" />
      {lit && <path className="cg-flame" d="M45 64c8 11 7 22 0 22s-8-11 0-22z" fill="#ffc35a" />}
      <path d="M45 88v8" stroke="#35444a" strokeWidth="3" />
      <path d="M27 44v62M63 44v62" stroke="#35444a" strokeWidth="2" opacity=".5" />
      <path d="M22 108h46l6 10v18a6 6 0 0 1-6 6H22a6 6 0 0 1-6-6v-18z" fill="#b8432f" />
      <path d="M16 124h58" stroke="#8a2f20" strokeWidth="3" />
      <circle cx="72" cy="114" r="4" fill="#35444a" />
    </svg>
  );
}

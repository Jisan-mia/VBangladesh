"use client";
// The title inside the stage: the game's own river as one big start button (the চরকি, both boats at the jetty, খেলো).
// Under it, small: the level chip (opens the list) and, when a second boat races, the mode chips with one line saying what they change.
import type { ReactNode } from "react";
import { BOAT, BOATS, SECTORS, SECTOR_FILL } from "../lib/art";
import { bn, levelOf, placeOf, worldOf } from "../lib/levels";

function Scene({ faces }: { faces: 2 | 3 }) {
  const boat = (x: number, y: number, s: number, player: 0 | 1) => <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d={BOAT.roof} fill={BOATS[player].roof} /><path d={BOAT.hull} fill={BOATS[player].hull} /><path d={BOAT.pole} stroke="#5b4636" strokeWidth="2.5" /><path d={BOAT.flag} fill={BOATS[player].flag} />
  </g>;
  return <svg className="dg-scene" viewBox="0 0 320 270" aria-hidden="true">
    <defs><linearGradient id="dg-t-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: "var(--w-sky-top)" }} /><stop offset="1" style={{ stopColor: "var(--w-sky-low)" }} /></linearGradient></defs>
    <rect width="320" height="270" fill="url(#dg-t-sky)" />
    <circle cx="60" cy="48" r="22" style={{ fill: "var(--w-sun)" }} />
    <path d="M0 100Q50 70 110 92T230 86T320 98V140H0z" style={{ fill: "var(--w-hill-far)" }} />
    <path d="M0 114Q70 94 140 110T320 108V150H0z" style={{ fill: "var(--w-hill)" }} />
    <rect y="124" width="320" height="30" style={{ fill: "var(--w-bank)" }} />
    {[0, 1, 2].map(index => <g key={index}><rect x={10 + index * 60} y="118" width="54" height="34" rx="8" style={{ fill: "var(--w-tile)" }} /><text x={37 + index * 60} y="144" textAnchor="middle" fontSize="24" fontWeight="800" style={{ fill: "var(--w-ink)" }}>{bn(index + 1)}</text></g>)}
    <rect y="154" width="320" height="116" style={{ fill: "var(--w-water)" }} />
    <path d="M0 176q20-8 40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0" fill="none" strokeWidth="3" style={{ stroke: "var(--w-wave)" }} />
    <path d="M0 236q20-8 40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0" fill="none" strokeWidth="3" style={{ stroke: "var(--w-wave)" }} />
    {boat(22, 158, 0.6, 1)}{boat(34, 196, 0.95, 0)}
    <g transform="translate(196 44)">
      <circle cx="58" cy="64" r="58" fill="#0003" />
      <g transform="scale(1.16)">
        {SECTORS[faces].map((sector, index) => <path key={index} d={sector.path} fill={SECTOR_FILL[index]} stroke="#1d2b53" strokeWidth="1.5" />)}
        <circle cx="50" cy="50" r="46" fill="none" stroke="#1d2b53" strokeWidth="4" />
        {SECTORS[faces].map((sector, index) => sector.dots.map(([x, y], dot) => <circle key={`${index}-${dot}`} cx={x} cy={y} r={6} fill="#1d2b53" />))}
        <g transform="rotate(35 50 50)"><path d="M50 52V14" stroke="#c0392b" strokeWidth="6" strokeLinecap="round" /><path d="M50 5l-9 14h18z" fill="#c0392b" /><circle cx="50" cy="50" r="7" fill="#c0392b" /></g>
      </g>
    </g>
  </svg>;
}

export function Title({ level, duo, onStart, onLevels, onMode, children }: { level: number; duo: boolean; onStart: () => void; onLevels: () => void; onMode: (duo: boolean) => void; children?: ReactNode }) {
  const spec = levelOf(level), world = worldOf(level);
  const blurred = (action: () => void) => (event: { currentTarget: HTMLButtonElement }) => { event.currentTarget.blur(); action(); };
  return <div className="dg-title">
    <button type="button" className="dg-startbtn" onClick={blurred(onStart)} aria-label={`খেলো: লেভেল ${bn(placeOf(level))}, ${spec.title}`}>
      <Scene faces={spec.faces} />
      <span className="dg-startbtn-go" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z" /></svg>খেলো</span>
    </button>
    <button type="button" className="dg-chip" onClick={blurred(onLevels)} aria-label={`লেভেল ${bn(placeOf(level))}, ${spec.title}। সব লেভেল দেখো`}>
      <span className="dg-chip-n" aria-hidden="true">{bn(spec.n)}</span>
      <span><b>{spec.finale ? `ফিনালে · ${spec.title}` : spec.title}</b><small>{world.name} · লেভেল {bn(placeOf(level))}</small></span>
      <svg className="dg-chip-more" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" /></svg>
    </button>
    {spec.rival && <div className="dg-modes" role="group" aria-label="দ্বিতীয় নৌকা কে চালাবে">
      <button type="button" aria-pressed={!duo} onClick={blurred(() => onMode(false))}>
        <svg viewBox="0 0 40 24" aria-hidden="true"><rect x="12" y="2" width="16" height="20" rx="3" /><path d="M20 18h.1" /></svg>ফোন চালাবে</button>
      <button type="button" aria-pressed={duo} onClick={blurred(() => onMode(true))}>
        <svg viewBox="0 0 40 24" aria-hidden="true"><path d="M8 20v-5q0-4 4-4t4 4v5M24 20v-5q0-4 4-4t4 4v5" /><circle cx="12" cy="6" r="3" /><circle cx="28" cy="6" r="3" /></svg>পালা করে</button>
      <p>{duo ? "আরেকটা নৌকা বড়রা চালাবে, পালা করে।" : "আব্বুর নৌকা ফোন চালাবে, তোমার সাথে।"}</p>
    </div>}
    {children}
  </div>;
}

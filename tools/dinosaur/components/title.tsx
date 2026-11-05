"use client";
// The title inside the stage: a mound of sand with a skull showing through and a brush sweeping over it. The whole picture is the start
// button, the biggest thing on screen. Under it, small: the level chip (opens the list), the finder's book, and one line for a parent.
import type { ReactNode } from "react";
import { boneShapes } from "../lib/art";
import { bn } from "../../../shared/kids-kit";
import { dinosOf } from "../lib/round";
import { levelOf, placeOf, WORLDS } from "../lib/worlds";
import { DinoArt, Shapes } from "./pieces";

export function Title({ level, bookCount, bookTotal, onStart, onLevels, onBook, children }: { level: number; bookCount: number; bookTotal: number; onStart: () => void; onLevels: () => void; onBook: () => void; children?: ReactNode }) {
  const spec = levelOf(level), world = WORLDS[spec.world];
  return <div className="dn-title">
    <button type="button" className="dn-start" onClick={event => { event.currentTarget.blur(); onStart(); }} aria-label={`খুঁড়ি: লেভেল ${bn(placeOf(level))}, ${spec.title}`}>
      <svg className="dn-start-art" viewBox="0 0 300 200" aria-hidden="true" focusable="false">
        <rect className="dn-t-sky" width="300" height="200" />
        <circle className="dn-t-sun" cx="248" cy="40" r="20" />
        <rect className="dn-t-soil" y="150" width="300" height="50" />
        <path className="dn-t-sand" d="M0 152Q60 100 130 122T300 114V200H0Z" />
        <g transform="translate(118 112) rotate(-12) scale(1.9)"><Shapes shapes={boneShapes("skull")} /></g>
        <path className="dn-t-sand dn-t-front" d="M60 148Q112 112 168 130Q214 142 262 154V200H60Z" />
        <path className="dn-t-crack" d="M70 166L84 158L98 168L112 160" />
        <g className="dn-t-brush"><g transform="translate(180 30) rotate(34)">
          <rect x="0" y="0" width="14" height="70" fill="#8b5a2b" />
          <rect x="-2" y="64" width="18" height="12" fill="#b9bcc2" />
          <path d="M-3 76H17L20 100H-6Z" fill="#d9a441" />
          <path d="M-1 80V98M5 80V99M11 80V98" stroke="#a87a1f" strokeWidth="1.6" />
        </g></g>
        <g className="dn-t-grains">{[[96, 138], [150, 120], [188, 132], [214, 124]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.4" />)}</g>
      </svg>
      <span className="dn-start-go" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z" /></svg>খুঁড়ি</span>
    </button>
    <div className="dn-title-row">
      <button type="button" className="dn-chip" onClick={event => { event.currentTarget.blur(); onLevels(); }} aria-label={`লেভেল ${bn(placeOf(level))}, ${spec.title}। সব লেভেল দেখো`}>
        <span className="dn-chip-art">{dinosOf(level).map(dino => <span key={dino.id}><DinoArt dino={dino} /></span>)}</span>
        <span className="dn-chip-text"><b>{spec.title}</b><small>লেভেল {bn(placeOf(level))} · {world.name}</small></span>
        <svg className="dn-chip-more" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" /></svg>
      </button>
      <button type="button" className="dn-bookbtn" onClick={event => { event.currentTarget.blur(); onBook(); }} aria-label={`খোঁজার বই: ${bn(bookTotal)}টার ${bn(bookCount)}টা পেয়েছ`}>
        <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M4 7Q10 4 16 8Q22 4 28 7V26Q22 23 16 27Q10 23 4 26Z" /><path d="M16 8V27" /></svg>
        <span>{bn(bookCount)}/{bn(bookTotal)}</span>
      </button>
    </div>
    {children}
  </div>;
}

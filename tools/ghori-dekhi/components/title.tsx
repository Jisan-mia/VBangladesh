"use client";
// The title inside the stage: a clock with its hands turning, a sun at its shoulder, and ▶ খেলো across the bottom. The whole
// thing is the start button, the biggest thing on screen. Under it, small: the level chip (opens the list) and one line for a parent.
import type { ReactNode } from "react";
import { bn } from "../../../shared/kids-kit";
import { levelOf, placeOf, WORLDS } from "../lib/levels";
import { MiniClock, TitleClock } from "./face";

export function Title({ level, onStart, onLevels, children }: { level: number; onStart: () => void; onLevels: () => void; children?: ReactNode }) {
  const spec = levelOf(level), world = WORLDS[spec.world];
  return <div className="gd-title">
    <button type="button" className="gd-start" onClick={event => { event.currentTarget.blur(); onStart(); }} aria-label={`খেলো: লেভেল ${bn(placeOf(level))}, ${spec.title}`}>
      <span className="gd-start-art" aria-hidden="true">
        <svg className="gd-sun" viewBox="0 0 80 80"><circle cx="40" cy="40" r="20" />{Array.from({ length: 10 }, (_, i) => <line key={i} x1="40" y1="8" x2="40" y2="16" transform={`rotate(${i * 36} 40 40)`} />)}</svg>
        <TitleClock time={spec.example} />
      </span>
      <span className="gd-start-go" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z" /></svg>খেলো</span>
    </button>
    <button type="button" className="gd-chip" onClick={event => { event.currentTarget.blur(); onLevels(); }} aria-label={`লেভেল ${bn(placeOf(level))}, ${spec.title}। সব লেভেল দেখো`}>
      <MiniClock time={spec.example} size={44} />
      <span><b>লেভেল {bn(placeOf(level))} · {spec.finale ?? spec.title}</b><small>{world.name}</small></span>
      <svg className="gd-chip-more" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" /></svg>
    </button>
    <p className="gd-title-line">আকাশ দেখো, ঘড়ির কাঁটা মেলাও।</p>
    {children}
  </div>;
}

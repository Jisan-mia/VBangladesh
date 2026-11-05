"use client";
// The title inside the stage: the Mars hill with the rover and Earth overhead is the start button, the biggest thing on
// screen. Under it, small: the level chip (opens the list) and one line. The grown-ups' gate sits at the foot.
import type { ReactNode } from "react";
import { bn } from "../../../shared/kids-kit";
import { TITLE_ART } from "../lib/art";
import { badgeName, worldOf } from "../lib/levels";
import { ICONS, Scene } from "./pieces";

export function Title({ level, place, onStart, onLevels, children }: { level: number; place: number; onStart: () => void; onLevels: () => void; children?: ReactNode }) {
  const world = worldOf(level);
  return <div className="mr-title">
    <button type="button" className="mr-hill" onClick={event => { event.currentTarget.blur(); onStart(); }} aria-label={`রোভার চালাও: লেভেল ${bn(place)}, ${badgeName(level)}`}>
      <Scene svg={TITLE_ART} className="mr-hill-art" />
      <span className="mr-hill-go">{ICONS.play}রোভার চালাও</span>
    </button>
    <button type="button" className="mr-chip" onClick={event => { event.currentTarget.blur(); onLevels(); }} aria-label={`লেভেল ${bn(place)}, ${badgeName(level)}। সব লেভেল দেখো`}>
      <span className="mr-chip-n" aria-hidden="true">{bn(place)}</span>
      <span><b>{badgeName(level)}</b><small>{world.name}</small></span>
      <span className="mr-chip-more" aria-hidden="true">{ICONS.menu}</span>
    </button>
    <p className="mr-title-line">তীর সাজাও, তারপর চালাও।</p>
    {children}
  </div>;
}

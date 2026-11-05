"use client";
// The title inside the stage. The biggest thing is the activity's own picture in a round pool with a ▶ খেলো pill: one tap
// starts. Under it, three picture chips pick the activity (hands, tooth, clock). One line for the grown-up, and the gate.
import type { ReactNode } from "react";
import { Stars } from "../../../shared/game-ui";
import { BRUSH_READY, SCENES } from "../lib/art";
import { MODES, type ModeId } from "../lib/levels";
import { Finger } from "./finger";
import { Icon, Picture } from "./icon";

const HERO: Record<ModeId, string> = { hat: SCENES.wet, dat: BRUSH_READY, kokhon: SCENES.ask };
const CUE: Record<ModeId, string> = {
  hat: "হাত ভিজিয়ে সাবান নাও। তারপর খেলো চাপো।",
  dat: "ব্রাশে মটরদানার সমান পেস্ট নাও। তারপর খেলো চাপো।",
  kokhon: "ছবি দেখে বেছে নাও: কখন সাবান লাগে?",
};

export function Title({ mode, stars, ghost, onStart, onSelect, children }: { mode: ModeId; stars: Readonly<Record<number, number>>; ghost: boolean; onStart: () => void; onSelect: (id: ModeId) => void; children?: ReactNode }) {
  const current = MODES.find(item => item.id === mode)!;
  return <div className="hd-title">
    <button type="button" className="hd-hero" onClick={event => { event.currentTarget.blur(); onStart(); }} aria-label={`খেলো: ${current.bn}`}>
      <span className="hd-hero-pool"><Picture key={mode} svg={HERO[mode]} className="hd-hero-pic" /></span>
      <span className="hd-hero-go" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z" /></svg>খেলো</span>
      {ghost && <Finger />}
    </button>
    <p className="hd-cue">{CUE[mode]}</p>
    <ul className="hd-chips">
      {MODES.map((item, at) => <li key={item.id}>
        <button type="button" aria-pressed={item.id === mode} aria-label={`${item.bn}${item.id === mode ? ", বেছে নেওয়া" : ""}`} onClick={event => { event.currentTarget.blur(); onSelect(item.id); }}>
          <Icon id={`tab-${item.id}`} /><span>{item.bn}</span>
          <span className="hd-chip-stars"><Stars count={stars[item.level] ?? 0} label={false} /></span>
          <span className="hd-key" aria-hidden="true">{at + 1}</span>
        </button>
      </li>)}
    </ul>
    {children}
  </div>;
}

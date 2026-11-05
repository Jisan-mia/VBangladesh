"use client";
// The title inside the stage: the game's own shop as one big start button (the world's wall, the balance leaning toward its
// weights, খেলো). Under it, small: the level chip, which opens the list.
import type { ReactNode } from "react";
import { bn, levelOf, placeOf, worldOf } from "../lib/levels";
import type { Piece } from "../lib/puzzle";
import { Backdrop, MiniScale } from "./art";

const w = (value: number): Piece => ({ kind: "weight", value });
/** The first screen shows what the level is about: weights, a fruit with a ?, or a ★ bag. */
function sceneFor(level: number): { left: Piece[]; right: Piece[]; tilt: number } {
  const kind = levelOf(level).kind;
  if (kind === "find") return { left: [{ kind: "fruit", fruit: "kola", value: 4, hidden: true }], right: [w(2), w(1)], tilt: -9 };
  if (kind === "guess") return { left: [{ kind: "star", value: 3 }, { kind: "star", value: 3 }], right: [w(5), w(2)], tilt: -8 };
  return { left: [w(7)], right: [w(2), w(2)], tilt: -9 };
}

export function Title({ level, onStart, onLevels, children }: { level: number; onStart: () => void; onLevels: () => void; children?: ReactNode }) {
  const spec = levelOf(level), world = worldOf(level), scene = sceneFor(level);
  const blurred = (action: () => void) => (event: { currentTarget: HTMLButtonElement }) => { event.currentTarget.blur(); action(); };
  return <div className="dp-title">
    <button type="button" className="dp-startbtn" onClick={blurred(onStart)} aria-label={`খেলো: লেভেল ${bn(placeOf(level))}, ${spec.title}`}>
      <span className="dp-startscene" aria-hidden="true"><Backdrop world={spec.world} /><MiniScale {...scene} /></span>
      <span className="dp-startbtn-go" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z" /></svg>খেলো</span>
    </button>
    <button type="button" className="dp-chip" onClick={blurred(onLevels)} aria-label={`লেভেল ${bn(placeOf(level))}, ${spec.title}। সব লেভেল দেখো`}>
      <span className="dp-chip-n" aria-hidden="true">{bn(placeOf(level))}</span>
      <span><b>{spec.finale ? `ফিনালে · ${spec.title}` : spec.title}</b><small>{world.name}</small></span>
      <svg className="dp-chip-more" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" /></svg>
    </button>
    {children}
  </div>;
}

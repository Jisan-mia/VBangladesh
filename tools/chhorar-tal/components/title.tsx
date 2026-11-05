// The title inside the stage: the ঢোল is the start button and the biggest thing on screen. Under it, small: the ছড়া's name
// and world (opens the list), and one line for a parent. Nothing here needs reading to start.
import type { ReactNode } from "react";
import { bn } from "../../../shared/kids-kit";
import { levelOf, placeOf, rhymeForLevel, worldOf } from "../lib/levels";
import { DrumArt, Finger, ListIcon, PlayIcon, StickArt } from "./pictures";
import { Scene } from "./scene";

export function Title({ level, fresh, onStart, onLevels, children }: { level: number; fresh: boolean; onStart: () => void; onLevels: () => void; children?: ReactNode }) {
  const spec = levelOf(level), world = worldOf(level), rhyme = rhymeForLevel(level);
  return <div className="ct-title">
    <button type="button" className="ct-start" onClick={event => { event.currentTarget.blur(); onStart(); }} aria-label={`খেলো: ছড়া ${bn(placeOf(level))}, ${rhyme.name}`}>
      <span className="ct-start-stick l" aria-hidden="true"><StickArt /></span>
      <span className="ct-start-stick r" aria-hidden="true"><StickArt /></span>
      <DrumArt className="ct-start-drum" />
      <span className="ct-start-go" aria-hidden="true"><PlayIcon /></span>
      {fresh && <Finger />}
    </button>
    <button type="button" className="ct-chip" onClick={event => { event.currentTarget.blur(); onLevels(); }} aria-label={`ছড়া ${bn(placeOf(level))}, ${rhyme.name}। সব ছড়া দেখো`}>
      <span className="ct-chip-art" aria-hidden="true"><Scene id={spec.rhyme} full className="ct-chip-svg" /></span>
      <span className="ct-chip-text"><b>{rhyme.name}</b><small>{world.name} · {spec.finale ?? `ছড়া ${bn(placeOf(level))}`}</small></span>
      <span className="ct-chip-more" aria-hidden="true"><ListIcon /></span>
    </button>
    {children}
  </div>;
}

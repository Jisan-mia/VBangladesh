"use client";
// The first-run story: three panels, each a picture and one line. A tap shows the next; holding the corner button for 0.6 s
// skips them all, so a stray tap never skips. The hold is a CSS fill plus one timer, cleared on release, pause and unmount.
import { useEffect, useRef, useState } from "react";
import { useGamePlayer } from "../../../shared/game-player-client";
import { STORY_ART } from "../lib/art";
import { STORY } from "../lib/lines";
import { tap } from "../lib/sound";
import { Scene } from "./pieces";

const HOLD = 600;

export function Story({ onDone }: { onDone: () => void }) {
  const [at, setAt] = useState(0);
  const [holding, setHolding] = useState(false);
  const timer = useRef(0);
  const stopHold = () => { window.clearTimeout(timer.current); setHolding(false); };
  useGamePlayer({ onPause: stopHold });
  useEffect(() => { window.addEventListener("blur", stopHold); return () => { window.removeEventListener("blur", stopHold); window.clearTimeout(timer.current); }; }, []);
  const next = () => { tap(); if (at < STORY.length - 1) setAt(at + 1); else onDone(); };
  // Enter or Space shows the next panel (a fresh press only: a key held from the title never skips the story).
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      next();
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  });
  return (
    <div className="mr-story">
      <button type="button" className="mr-skip" data-holding={holding || undefined}
        onPointerDown={event => { event.stopPropagation(); try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a pointer the browser no longer knows */ } window.clearTimeout(timer.current); setHolding(true); timer.current = window.setTimeout(onDone, HOLD); }}
        onPointerUp={stopHold} onPointerCancel={stopHold} onLostPointerCapture={stopHold}
        onClick={event => { if (event.detail === 0) onDone(); }}>
        <span aria-hidden="true" />ধরে রাখো: বাদ দাও
      </button>
      <button type="button" className="mr-panel" key={at} onClick={event => { event.currentTarget.blur(); next(); }} aria-label={`${STORY[at]} পরেরটা দেখো`}>
        <Scene svg={STORY_ART[at]} className="mr-panel-art" />
        <p>{STORY[at]}</p>
        <span className="mr-dots" aria-hidden="true">{STORY.map((_, index) => <i key={index} data-on={index === at || undefined} />)}</span>
      </button>
    </div>
  );
}

"use client";
// The first-run story: three panels over the dark room. A tap shows the next; holding the corner button for 0.6 s skips
// them all, so a stray tap never skips. The hold is a CSS fill plus one timer, cleared on release, pause and unmount.
import { useEffect, useRef, useState } from "react";
import { useGamePlayer } from "../../../shared/game-player-client";
import { sfx } from "../../../shared/game-sound";
import { STORY } from "../lib/levels";

const HOLD = 600;

export function Story({ onDone }: { onDone: () => void }) {
  const [at, setAt] = useState(0);
  const [holding, setHolding] = useState(false);
  const timer = useRef(0);
  const stopHold = () => { window.clearTimeout(timer.current); setHolding(false); };
  useGamePlayer({ onPause: stopHold });
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const next = () => { sfx.tap(); if (at < STORY.length - 1) setAt(at + 1); else onDone(); };
  return (
    <div className="mr-story">
      <button type="button" className="mr-skip" data-holding={holding || undefined}
        onPointerDown={event => { event.stopPropagation(); try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a pointer the browser no longer knows */ } window.clearTimeout(timer.current); setHolding(true); timer.current = window.setTimeout(onDone, HOLD); }}
        onPointerUp={stopHold} onPointerCancel={stopHold} onLostPointerCapture={stopHold}
        onClick={event => { if (event.detail === 0) onDone(); }}>
        <span aria-hidden="true" />ধরে রাখো: বাদ দাও
      </button>
      <button type="button" className="mr-panel" key={at} onClick={event => { event.currentTarget.blur(); next(); }} aria-label={`${STORY[at]} পরেরটা দেখো`}>
        <p>{STORY[at]}</p>
        <span className="mr-dots" aria-hidden="true">{STORY.map((_, index) => <i key={index} data-on={index === at || undefined} />)}</span>
      </button>
    </div>
  );
}

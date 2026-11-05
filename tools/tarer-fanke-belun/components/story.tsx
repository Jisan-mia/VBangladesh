"use client";
// The first-run story: three panels drawn in code. A tap shows the next; holding the corner button for 0.6 s skips them
// all, so a stray tap never skips. The hold is a CSS fill plus one timer, cleared on release, pause and unmount.
import { useEffect, useRef, useState } from "react";
import { useGamePlayer } from "../../../shared/game-player-client";
import { sfx } from "../../../shared/game-sound";
import { drawStory } from "../lib/scenes";

const PANELS = [
  "লালবাগের গলি। মামার বাঁশে লাল-নীল বেলুন।",
  "দমকা হাওয়া! লাল বেলুনটা উড়ে গেল।",
  "চেপে রাখলে ওঠে, ছাড়লে নামে। তারে যেন না লাগে।",
];
const HOLD = 600;

export function Story({ onDone }: { onDone: () => void }) {
  const [at, setAt] = useState(0);
  const [holding, setHolding] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null), box = useRef<HTMLDivElement>(null), timer = useRef(0);
  const stopHold = () => { window.clearTimeout(timer.current); setHolding(false); };
  useGamePlayer({ onPause: stopHold });

  useEffect(() => {
    const element = box.current, target = canvas.current;
    if (!element || !target) return;
    const draw = () => {
      const width = Math.floor(Math.min(element.clientWidth, element.clientHeight * 1.5, 520));
      if (width < 40) return;
      target.style.width = `${width}px`; target.style.height = `${Math.round((width * 2) / 3)}px`;
      drawStory(target, width, Math.min(2, window.devicePixelRatio || 1), at);
    };
    const observer = new ResizeObserver(draw);
    observer.observe(element);
    void document.fonts?.ready.then(draw);
    return () => observer.disconnect();
  }, [at]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const next = () => { sfx.tap(); if (at < PANELS.length - 1) setAt(at + 1); else onDone(); };
  return (
    <div className="tb-story">
      <button type="button" className="tb-story-skip" data-holding={holding || undefined}
        onPointerDown={event => { event.stopPropagation(); try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a pointer the browser no longer knows */ } window.clearTimeout(timer.current); setHolding(true); timer.current = window.setTimeout(onDone, HOLD); }}
        onPointerUp={stopHold} onPointerCancel={stopHold} onLostPointerCapture={stopHold}
        onClick={event => { if (event.detail === 0) onDone(); }}>
        <span aria-hidden="true" />ধরে রাখো: বাদ দাও
      </button>
      <button type="button" className="tb-story-panel" onClick={event => { event.currentTarget.blur(); next(); }} aria-label={`${PANELS[at]} পরেরটা দেখো`}>
        <div className="tb-story-art" ref={box}><canvas ref={canvas} aria-hidden="true" /></div>
        <p>{PANELS[at]}</p>
        <span className="tb-story-dots" aria-hidden="true">{PANELS.map((_, index) => <i key={index} data-on={index === at} />)}</span>
      </button>
    </div>
  );
}

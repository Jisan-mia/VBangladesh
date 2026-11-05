"use client";
// The first-run story: three panels drawn with the real classroom renderer. A tap shows the next; holding the corner button for
// 0.6 s skips them all, so a stray tap never skips. The hold is a CSS fill plus one timer, cleared on release, pause and unmount.
import { useEffect, useRef, useState } from "react";
import { useGamePlayer } from "../../../shared/game-player-client";
import { sfx } from "../../../shared/game-sound";
import { drawStoryPanel, STORY_ASPECT } from "../lib/panels";

export const PANELS = [
  "সকালের প্রথম পিরিয়ড। স্যার বোর্ডে লিখছেন, পুরো ক্লাস চুপ।",
  "সামনের বেঞ্চ থেকে চিরকুট এল: ‘টিফিনে ঝালমুড়ি?’ পৌঁছাতে হবে শেষ বেঞ্চে।",
  "চক চললে চিরকুট চালাও। হাত নামলেই থামো।",
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
      const width = Math.floor(Math.min(element.clientWidth, element.clientHeight / STORY_ASPECT, 480));
      if (width < 40) return;
      target.style.width = `${width}px`; target.style.height = `${Math.round(width * STORY_ASPECT)}px`;
      drawStoryPanel(target, width, Math.min(2, window.devicePixelRatio || 1), at);
    };
    const observer = new ResizeObserver(draw);
    observer.observe(element);
    void document.fonts?.ready.then(draw);
    return () => observer.disconnect();
  }, [at]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Space or Enter shows the next panel too; holding Space skips, the same as the corner button.
  useEffect(() => {
    // Only a key pressed here counts: the key that started the game is released here, and must not turn a page.
    let held = 0, pressed = false;
    const down = (event: KeyboardEvent) => {
      if (event.key !== " " && event.key !== "Enter") return;
      event.preventDefault();
      if (event.repeat) { if (pressed && ++held === 8) onDone(); return; }
      held = 0; pressed = true;
    };
    const up = (event: KeyboardEvent) => { if ((event.key === " " || event.key === "Enter") && pressed && held < 8) next(); held = 0; pressed = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  });

  function next() { sfx.tap(); if (at < PANELS.length - 1) setAt(at + 1); else onDone(); }
  return (
    <div className="sg-story">
      <button type="button" className="sg-story-skip" data-holding={holding || undefined}
        onPointerDown={event => { event.stopPropagation(); try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a pointer the browser no longer knows */ } window.clearTimeout(timer.current); setHolding(true); timer.current = window.setTimeout(onDone, HOLD); }}
        onPointerUp={stopHold} onPointerCancel={stopHold} onLostPointerCapture={stopHold}
        onClick={event => { if (event.detail === 0) onDone(); }}>
        <span aria-hidden="true" />ধরে রাখো: বাদ দাও
      </button>
      <button type="button" className="sg-story-panel" onClick={event => { event.currentTarget.blur(); next(); }} aria-label={`${PANELS[at]} পরেরটা দেখো`}>
        <div className="sg-story-art" ref={box}><canvas ref={canvas} aria-hidden="true" /></div>
        <p>{PANELS[at]}</p>
        <span className="sg-story-dots" aria-hidden="true">{PANELS.map((_, index) => <i key={index} data-on={index === at} />)}</span>
      </button>
    </div>
  );
}

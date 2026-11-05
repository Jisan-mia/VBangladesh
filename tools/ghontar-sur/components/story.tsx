"use client";
// The first-run story: three panels drawn in code. A tap shows the next; holding the corner button for 0.6 s skips them
// all, so a stray tap never skips. The hold is a CSS fill plus one timer, cleared on release, pause and unmount.
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useGamePlayer } from "../../../shared/game-player-client";
import { sfx } from "../../../shared/game-sound";
import { BELL_COLORS } from "../lib/art";
import { BellArt } from "./bells";
import { sound } from "./sound";

export const PANELS = [
  "মেলার গেটে আজ ঘণ্টাঘর খুলেছে। বাঁশের আড়ায় পিতলের ঘণ্টা ঝুলছে।",
  "ঘণ্টাওয়ালা চাচা একটা সুর বাজান। একবারই, আর ঘণ্টাগুলো একটা একটা করে জ্বলে।",
  "তুমি শুনে রাখো, তারপর একই সুর বাজাও। ঠিক হলে সুর আরও লম্বা হবে।",
];
const HOLD = 600;
const LIT = [-1, 1, 2];

export function Story({ onDone }: { onDone: () => void }) {
  const [at, setAt] = useState(0);
  const [holding, setHolding] = useState(false);
  const timer = useRef(0);
  const stopHold = () => { window.clearTimeout(timer.current); setHolding(false); };
  useGamePlayer({ onPause: stopHold });
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => { if (LIT[at] >= 0) sound.bell(LIT[at], 0.7); }, [at]);

  // Space or Enter shows the next panel too; holding Space skips, the same as the corner button.
  useEffect(() => {
    // Only a key pressed here counts: the Enter that started the game is released here, and must not turn a page.
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
    <div className="gs-story">
      <button type="button" className="gs-story-skip" data-holding={holding || undefined}
        onPointerDown={event => { event.stopPropagation(); try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a pointer the browser no longer knows */ } window.clearTimeout(timer.current); setHolding(true); timer.current = window.setTimeout(onDone, HOLD); }}
        onPointerUp={stopHold} onPointerCancel={stopHold} onLostPointerCapture={stopHold}
        onClick={event => { if (event.detail === 0) onDone(); }}>
        <span aria-hidden="true" />ধরে রাখো: বাদ দাও
      </button>
      <button type="button" className="gs-story-panel" onClick={event => { event.currentTarget.blur(); next(); }} aria-label={`${PANELS[at]} পরেরটা দেখো`}>
        <div className="gs-story-art" data-panel={at} aria-hidden="true">
          <span className="gs-story-beam" />
          {[0, 1, 2].map(index => (
            <span key={index} className="gs-story-bell" data-lit={LIT[at] === index || undefined} data-swing={at === 2 && index === 0 || undefined} style={{ "--c": BELL_COLORS[index], "--s": [1, 0.93, 0.86][index] } as CSSProperties}>
              <BellArt index={index} />
            </span>
          ))}
          {at === 2 && <span className="gs-story-finger" />}
        </div>
        <p>{PANELS[at]}</p>
        <span className="gs-story-dots" aria-hidden="true">{PANELS.map((_, index) => <i key={index} data-on={index === at} />)}</span>
      </button>
    </div>
  );
}

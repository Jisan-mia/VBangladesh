"use client";
// The first-run story: three panels drawn with the stage plates. A tap shows the next; holding the corner button for
// 0.6 s skips them all, so a stray tap never skips. The hold is a CSS fill plus one timer, cleared on release, pause and unmount.
import { useEffect, useRef, useState } from "react";
import { useGamePlayer } from "../../../shared/game-player-client";
import { sfx } from "../../../shared/game-sound";
import { drawStage } from "../lib/art";

const HOLD = 600;
export const STORY = [
  "জ্যৈষ্ঠের দুপুর। আম খেয়ে আঁটিটা উঠোনে ছুড়ে দিলাম।",
  "বর্ষা এল। আঁটি ফেটে দুটো কচি পাতা।",
  "একই রকম দুটো মেলাও, বড় হবে। আঁটি থেকে বাগান বানাও।",
] as const;

function panel(c: CanvasRenderingContext2D, side: number, at: number) {
  c.fillStyle = at === 1 ? "#cfe0d6" : "#f6e7c1"; c.fillRect(0, 0, side, side * 0.75);
  c.fillStyle = "#7fb24a"; c.fillRect(0, side * 0.5, side, side * 0.25);
  if (at === 1) { c.strokeStyle = "#ffffff99"; c.lineWidth = 2; for (let i = 0; i < 26; i++) { const x = (i * 37) % side, y = (i * 23) % (side * 0.5); c.beginPath(); c.moveTo(x, y); c.lineTo(x - 4, y + 12); c.stroke(); } }
  if (at === 0) {
    c.fillStyle = "#f2b632"; c.beginPath(); c.arc(side * 0.82, side * 0.14, side * 0.07, 0, Math.PI * 2); c.fill();
    drawStage(c, 1, side * 0.36, side * 0.3, side * 0.28);
  } else if (at === 1) drawStage(c, 2, side * 0.33, side * 0.24, side * 0.34);
  else {
    drawStage(c, 1, side * 0.06, side * 0.3, side * 0.22);
    drawStage(c, 1, side * 0.3, side * 0.3, side * 0.22);
    c.fillStyle = "#2c2418"; c.font = `800 ${Math.round(side * 0.1)}px Display, Bangla, sans-serif`; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("→", side * 0.62, side * 0.41);
    drawStage(c, 2, side * 0.7, side * 0.28, side * 0.26);
  }
}

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
      const side = Math.floor(Math.min(element.clientWidth, element.clientHeight / 0.75, 440));
      if (side < 40) return;
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      target.width = Math.round(side * ratio); target.height = Math.round(side * 0.75 * ratio);
      target.style.width = `${side}px`; target.style.height = `${Math.round(side * 0.75)}px`;
      const c = target.getContext("2d");
      if (!c) return;
      c.setTransform(ratio, 0, 0, ratio, 0, 0);
      panel(c, side, at);
    };
    const observer = new ResizeObserver(draw);
    observer.observe(element);
    return () => observer.disconnect();
  }, [at]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const next = () => { sfx.tap(); if (at < STORY.length - 1) setAt(at + 1); else onDone(); };
  return (
    <div className="aa-story">
      <button type="button" className="aa-story-skip" data-holding={holding || undefined}
        onPointerDown={event => { event.stopPropagation(); try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a pointer the browser no longer knows */ } window.clearTimeout(timer.current); setHolding(true); timer.current = window.setTimeout(onDone, HOLD); }}
        onPointerUp={stopHold} onPointerCancel={stopHold} onLostPointerCapture={stopHold}
        onClick={event => { if (event.detail === 0) onDone(); }}>
        <span aria-hidden="true" />ধরে রাখো: বাদ দাও
      </button>
      <button type="button" className="aa-story-panel" onClick={event => { event.currentTarget.blur(); next(); }} aria-label={`${STORY[at]} পরেরটা দেখো`}>
        <div className="aa-story-art" ref={box}><canvas ref={canvas} aria-hidden="true" /></div>
        <p>{STORY[at]}</p>
        <span className="aa-story-dots" aria-hidden="true">{STORY.map((_, index) => <i key={index} data-on={index === at} />)}</span>
      </button>
    </div>
  );
}

"use client";
// The first-run story: three panels drawn with the bangles. A tap shows the next; holding the corner button for 0.6 s skips
// them all, so a stray tap never skips. The hold is a CSS fill plus one timer, cleared on release, pause and unmount.
import { useEffect, useRef, useState } from "react";
import { useGamePlayer } from "../../../shared/game-player-client";
import { sfx } from "../../../shared/game-sound";
import { drawBangle, GOLD, VELVET } from "../lib/art";
import { RAINBOW } from "../lib/board";

const HOLD = 600;
export const STORY = [
  "বৈশাখের মেলা। খালার দোকানে মখমলের ওপর কাচের চুড়ি।",
  "এক রঙের তিনটা পাশাপাশি এলে উঠে যায়। ওপর থেকে নতুন নামে।",
  "খালার বায়না তুলে দাও। দোকান থেকে দোকান, মেলা থেকে মেলা।",
] as const;

function panel(c: CanvasRenderingContext2D, side: number, at: number) {
  const w = side, h = side * 0.75, [light, dark] = VELVET[at === 2 ? 3 : at === 1 ? 1 : 0];
  const bg = c.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, light); bg.addColorStop(1, dark);
  c.fillStyle = bg; c.fillRect(0, 0, w, h);
  c.fillStyle = "#6b4220"; c.fillRect(0, h * 0.78, w, h * 0.06);
  c.fillStyle = "rgba(0,0,0,0.25)"; c.fillRect(0, h * 0.84, w, h * 0.16);
  const cell = side * 0.2;
  if (at === 0) {
    for (let i = 0; i < 4; i++) drawBangle(c, [0, 1, 2, 3][i], side * 0.1 + i * cell * 1.1, h * 0.5, cell);
    drawBangle(c, 4, side * 0.68, h * 0.12, cell * 1.2);
  } else if (at === 1) {
    drawBangle(c, 0, side * 0.12, h * 0.4, cell); drawBangle(c, 0, side * 0.12 + cell, h * 0.4, cell); drawBangle(c, 0, side * 0.12 + cell * 2, h * 0.4, cell);
    c.fillStyle = GOLD; c.font = `800 ${Math.round(side * 0.1)}px Display, Bangla, sans-serif`; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("→", side * 0.78, h * 0.55);
    drawBangle(c, 2, side * 0.62, h * 0.08, cell * 0.9);
  } else {
    drawBangle(c, RAINBOW, side * 0.5 - cell * 0.75, h * 0.3, cell * 1.5);
    drawBangle(c, 13, side * 0.12, h * 0.55, cell); drawBangle(c, 15, side * 0.68, h * 0.55, cell);
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
    <div className="cb-story">
      <button type="button" className="cb-story-skip" data-holding={holding || undefined}
        onPointerDown={event => { event.stopPropagation(); try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a pointer the browser no longer knows */ } window.clearTimeout(timer.current); setHolding(true); timer.current = window.setTimeout(onDone, HOLD); }}
        onPointerUp={stopHold} onPointerCancel={stopHold} onLostPointerCapture={stopHold}
        onClick={event => { if (event.detail === 0) onDone(); }}>
        <span aria-hidden="true" />ধরে রাখো: বাদ দাও
      </button>
      <button type="button" className="cb-story-panel" onClick={event => { event.currentTarget.blur(); next(); }} aria-label={`${STORY[at]} পরেরটা দেখো`}>
        <div className="cb-story-art" ref={box}><canvas ref={canvas} aria-hidden="true" /></div>
        <p>{STORY[at]}</p>
        <span className="cb-story-dots" aria-hidden="true">{STORY.map((_, index) => <i key={index} data-on={index === at} />)}</span>
      </button>
    </div>
  );
}

"use client";
// The ready card: each level's one new thing, with a small real picture of it, before a field you haven't met starts.
// Nothing moves until চলো.
import { useEffect, useRef } from "react";
import { WORLDS, defOfLevel } from "../lib/levels";
import { bn } from "../lib/link";
import { drawPreview, PREVIEW_ASPECT } from "../lib/title-art";

export function IntroCard({ level, onGo }: { level: number; onGo: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const def = defOfLevel(level);
  useEffect(() => {
    const target = canvas.current;
    if (!target) return;
    const draw = () => {
      const width = 156, ratio = Math.min(2, window.devicePixelRatio || 1);
      target.style.width = `${width}px`; target.style.height = `${Math.round(width * PREVIEW_ASPECT)}px`;
      drawPreview(target, width, ratio, level);
    };
    draw();
    const redo = () => draw();
    void document.fonts?.ready.then(redo);
  }, [level]);
  return (
    <div className="al-intro" role="group" aria-labelledby="al-intro-title">
      <div className="al-intro-body">
        <canvas ref={canvas} aria-hidden="true" />
        <div className="al-intro-text">
          <p className="al-intro-kicker">{WORLDS[def.world].name} · লেভেল {bn(level)}</p>
          <h2 id="al-intro-title">{def.name}{def.finale && <i>শেষ ধাপ</i>}</h2>
          <p>{def.teach}</p>
        </div>
      </div>
      <button type="button" className="al-go" onClick={event => { event.currentTarget.blur(); onGo(); }}>চলো</button>
    </div>
  );
}

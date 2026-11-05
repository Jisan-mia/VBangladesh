"use client";
// The first screen: the red balloon is the start button (big over the lane, ওড়াও on its rubber), then the level line,
// the three modes with the chosen one's promise, and সব লেভেল. A friend's challenge sits on top.
import { useEffect, useRef } from "react";
import { LEVEL_COUNT, levelDef, MODE_INFO, MODES, WORLDS, type Mode } from "../lib/levels";
import { bn, friendClaim, friendLine, type Shared } from "../lib/link";
import { drawTitle, TITLE_H, TITLE_W } from "../lib/scenes";

export function TitleScreen({ level, mode, friend, stars, slow, lockedMode, onStart, onMode, onLevels, onOwn }: {
  level: number; mode: Mode; friend: Shared | null; stars: number; slow: boolean; lockedMode: boolean;
  onStart: () => void; onMode: (mode: Mode) => void; onLevels: () => void; onOwn: () => void;
}) {
  const box = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const def = levelDef(level), world = def.world;

  useEffect(() => {
    const element = box.current, target = canvas.current;
    if (!element || !target) return;
    const draw = () => {
      const width = Math.floor(Math.min(element.clientWidth, element.clientHeight * TITLE_W / TITLE_H, 420));
      if (width < 40) return;
      target.style.width = `${width}px`;
      target.style.height = `${Math.round(width * TITLE_H / TITLE_W)}px`;
      drawTitle(target, width, Math.min(2, window.devicePixelRatio || 1), world, "ওড়াও");
    };
    const observer = new ResizeObserver(draw);
    observer.observe(element);
    void document.fonts?.ready.then(draw);
    return () => observer.disconnect();
  }, [world]);

  return (
    <div className="tb-title" data-world={world}>
      {friend && (
        <p className="tb-title-friend">
          <b>{friendLine(friend)}</b> <span>{friendClaim(friend)}</span>
          <button type="button" className="kit-link" onClick={event => { event.currentTarget.blur(); onOwn(); }}>নিজের মতো খেলো</button>
        </p>
      )}
      <div className="tb-title-art" ref={box}>
        <button type="button" className="tb-title-start" data-slow={slow || undefined} onClick={event => { event.currentTarget.blur(); onStart(); }}
          aria-label={`ওড়াও: ${level ? `লেভেল ${bn(level)}, ${def.name}` : "যত দূর পারো"}`}>
          <canvas ref={canvas} aria-hidden="true" />
        </button>
      </div>
      <p className="tb-title-level">
        <span>{level ? `${WORLDS[world].name} · লেভেল ${bn(level)}: ${def.title}` : "যত দূর পারো"}</span>
        <small>{def.finale ? "শেষ ধাপ। " : ""}{def.teach}</small>
      </p>
      {!lockedMode && (
        <div className="tb-modes" role="radiogroup" aria-label="কতটা কঠিন">
          {MODES.map(item => (
            <button key={item} type="button" role="radio" aria-checked={item === mode} onClick={event => { event.currentTarget.blur(); onMode(item); }}>{MODE_INFO[item].name}</button>
          ))}
        </div>
      )}
      <p className="tb-mode-line">{lockedMode ? `বন্ধুর মতোই ${MODE_INFO[mode].name}ে খেলবে।` : MODE_INFO[mode].line}</p>
      <button type="button" className="tb-title-levels" onClick={event => { event.currentTarget.blur(); onLevels(); }}>
        সব লেভেল <span aria-label={`মোট ${bn(stars)}টা তারা`}>★ {bn(stars)}/{bn(LEVEL_COUNT * 3)}</span>
      </button>
    </div>
  );
}

"use client";
// The first screen: your kite is the start button (big on the evening's sky, খেলো on its paper), then the level line,
// the three modes with the chosen one's promise, and সব লেভেল. A friend's challenge sits on top.
import { useEffect, useRef } from "react";
import { LEVEL_COUNT, levelDef, MODE_INFO, MODES, WORLDS, type Mode } from "../lib/levels";
import { bn, friendClaim, friendLine, type Look, type Shared } from "../lib/link";
import { drawTitle, TITLE_ASPECT } from "../lib/sky";

export function TitleScreen({ level, mode, friend, stars, look, slow, onStart, onMode, onLevels, onLook }: {
  level: number; mode: Mode; friend: Shared | null; stars: number; look: Look; slow: boolean;
  onStart: () => void; onMode: (mode: Mode) => void; onLevels: () => void; onLook: () => void;
}) {
  const box = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const def = levelDef(level), world = def.world;
  const lockedMode = friend !== null && !friend.old && friend.level === level;

  useEffect(() => {
    const element = box.current, target = canvas.current;
    if (!element || !target) return;
    const draw = () => {
      const width = Math.floor(Math.min(element.clientWidth, element.clientHeight / TITLE_ASPECT, 460));
      if (width < 40) return;
      target.style.width = `${width}px`;
      target.style.height = `${Math.round(width * TITLE_ASPECT)}px`;
      drawTitle(target, width, Math.min(2, window.devicePixelRatio || 1), world, look, "খেলো");
    };
    const observer = new ResizeObserver(draw);
    observer.observe(element);
    void document.fonts?.ready.then(draw);
    return () => observer.disconnect();
  }, [world, look]);

  return (
    <div className="vk-title" data-world={world}>
      {friend && <p className="vk-title-friend"><b>{friendLine(friend)}</b> <span>{friendClaim(friend)}</span></p>}
      <div className="vk-title-art" ref={box}>
        <button type="button" className="vk-title-start" data-slow={slow || undefined} onClick={event => { event.currentTarget.blur(); onStart(); }}
          aria-label={`খেলো: লেভেল ${bn(level)}, ${def.name}`}>
          <canvas ref={canvas} aria-hidden="true" />
        </button>
      </div>
      <p className="vk-title-level">
        <span>{WORLDS[world].name} · লেভেল {bn(level)}: {def.title}</span>
        <small>{def.finale ? "শেষ ধাপ। " : ""}{def.teach}</small>
      </p>
      {!lockedMode && (
        <div className="vk-modes" role="radiogroup" aria-label="কতটা কঠিন">
          {MODES.map(item => (
            <button key={item} type="button" role="radio" aria-checked={item === mode} onClick={event => { event.currentTarget.blur(); onMode(item); }}>{MODE_INFO[item].name}</button>
          ))}
        </div>
      )}
      <p className="vk-mode-line">{lockedMode ? `বন্ধুর মতোই ${MODE_INFO[mode].name}ে খেলবে।` : MODE_INFO[mode].line}</p>
      <p className="vk-title-links">
        <button type="button" className="vk-title-levels" onClick={event => { event.currentTarget.blur(); onLevels(); }}>
          সব লেভেল <span aria-label={`মোট ${bn(stars)}টা তারা`}>★ {bn(stars)}/{bn(LEVEL_COUNT * 3)}</span>
        </button>
        <button type="button" className="vk-title-look" onClick={event => { event.currentTarget.blur(); onLook(); }}>ঘুড়ি বদলাও</button>
      </p>
    </div>
  );
}

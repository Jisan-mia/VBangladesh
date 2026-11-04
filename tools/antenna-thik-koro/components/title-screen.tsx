"use client";
// The first screen: the set itself is the start button (snow over a faint picture, খেলো on the glass), then the level line,
// the three modes with the chosen one's promise, and সব লেভেল. A friend's challenge sits on top.
import { useEffect, useRef } from "react";
import { bn, friendClaim, friendLine, LEVEL_COUNT, levelDef, MODE_INFO, MODES, WORLDS, type Mode, type Shared } from "../lib/antenna";
import { drawTitleSet, TITLE_ASPECT } from "../lib/art";

export function TitleScreen({ level, mode, friend, stars, onStart, onMode, onLevels }: {
  level: number; mode: Mode; friend: Shared | null; stars: number;
  onStart: () => void; onMode: (mode: Mode) => void; onLevels: () => void;
}) {
  const box = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const old = friend !== null && friend.old && friend.level === level;
  const def = levelDef(level, old), picture = def.finale?.picture ?? "cricket";

  useEffect(() => {
    const element = box.current, target = canvas.current;
    if (!element || !target) return;
    const draw = () => {
      const width = Math.floor(Math.min(element.clientWidth, element.clientHeight / TITLE_ASPECT, 520));
      if (width < 40) return;
      target.style.width = `${width}px`;
      target.style.height = `${Math.round(width * TITLE_ASPECT)}px`;
      drawTitleSet(target, width, Math.min(2, window.devicePixelRatio || 1), picture, "খেলো");
    };
    const observer = new ResizeObserver(draw);
    observer.observe(element);
    void document.fonts?.ready.then(draw);
    return () => observer.disconnect();
  }, [picture]);

  return (
    <div className="at-title">
      {friend && (
        <p className="at-title-friend"><b>{friendLine(friend)}</b> <span>{friendClaim(friend)}</span></p>
      )}
      <div className="at-title-set" ref={box}>
        <button type="button" className="at-title-start" onClick={event => { event.currentTarget.blur(); onStart(); }} aria-label={`খেলো: লেভেল ${bn(level)}, ${def.name}`}>
          <canvas ref={canvas} aria-hidden="true" />
        </button>
      </div>
      <p className="at-title-level">
        <span>{old ? "বন্ধুর পুরোনো লেভেল" : WORLDS[def.world].name} · লেভেল {bn(level)}{old ? "" : `: ${def.name}`}</span>
        {!old && <small>{def.finale ? "শেষ ধাপ। " : ""}{def.teach}</small>}
      </p>
      {!old && (
        <div className="at-modes" role="radiogroup" aria-label="কতটা কঠিন">
          {MODES.map(item => (
            <button key={item} type="button" role="radio" aria-checked={item === mode} onClick={event => { event.currentTarget.blur(); onMode(item); }}>{MODE_INFO[item].name}</button>
          ))}
        </div>
      )}
      {!old && <p className="at-mode-line">{MODE_INFO[mode].line}</p>}
      <button type="button" className="at-title-levels" onClick={event => { event.currentTarget.blur(); onLevels(); }}>
        সব লেভেল <span aria-label={`মোট ${bn(stars)}টা তারা`}>★ {bn(stars)}/{bn(LEVEL_COUNT * 3)}</span>
      </button>
    </div>
  );
}

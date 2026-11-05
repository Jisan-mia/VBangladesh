"use client";
// The first screen: the pot itself on the stove is the start button (খেলো on its belly), then the level line with its one new
// thing, the three modes with the chosen one's promise and সব লেভেল. A friend's challenge sits on top.
import { useEffect, useRef } from "react";
import { bn, friendClaim, friendLine, whereText, type Shared } from "../lib/challenge";
import { LEVEL_COUNT, levelDef, MODE_INFO, MODES, WORLDS, type Mode } from "../lib/levels";
import { drawTitlePot, TITLE_ASPECT } from "../lib/panels";

export function TitleScreen({ level, old, mode, friend, stars, onStart, onMode, onLevels }: {
  level: number; old: boolean; mode: Mode; friend: Shared | null; stars: number;
  onStart: () => void; onMode: (mode: Mode) => void; onLevels: () => void;
}) {
  const box = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const def = levelDef(old ? 1 : level), world = old ? 0 : def.world;

  useEffect(() => {
    const element = box.current, target = canvas.current;
    if (!element || !target) return;
    const draw = () => {
      const width = Math.floor(Math.min(element.clientWidth, element.clientHeight / TITLE_ASPECT, 460));
      if (width < 40) return;
      target.style.width = `${width}px`;
      target.style.height = `${Math.round(width * TITLE_ASPECT)}px`;
      drawTitlePot(target, width, Math.min(2, window.devicePixelRatio || 1), "খেলো", old ? 1 : level);
    };
    const observer = new ResizeObserver(draw);
    observer.observe(element);
    void document.fonts?.ready.then(draw);
    return () => observer.disconnect();
  }, [level, old]);

  const done = (event: { currentTarget: HTMLElement }, run: () => void) => { event.currentTarget.blur(); run(); };
  return (
    <div className="du-title" data-world={world}>
      {friend && <p className="du-title-friend"><b>{friendLine(friend)}</b> <span>{friendClaim(friend)}।</span></p>}
      <div className="du-title-art" ref={box}>
        <button type="button" className="du-title-start" onClick={event => done(event, onStart)}
          aria-label={old && friend ? `খেলো: ${whereText(friend)}` : `খেলো: লেভেল ${bn(level)}, ${def.name}`}>
          <canvas ref={canvas} aria-hidden="true" />
        </button>
      </div>
      <p className="du-title-level">
        {old && friend
          ? <span>বন্ধুর {whereText(friend)}</span>
          : <span>{WORLDS[def.world].name} · লেভেল {bn(level)}: {def.name}</span>}
        {!old && <small>{def.boss ? `এই রান্নাঘরের শেষ ধাপ। শেষ পাতিল দুইবার গোনা হয়। ` : ""}{def.teach}</small>}
      </p>
      {!old && (
        <div className="du-modes" role="radiogroup" aria-label="কতটা কঠিন">
          {MODES.map(item => <button key={item} type="button" role="radio" aria-checked={item === mode} onClick={event => done(event, () => onMode(item))}>{MODE_INFO[item].name}</button>)}
        </div>
      )}
      {!old && <p className="du-mode-line">{MODE_INFO[mode].line}</p>}
      <div className="du-title-more">
        <button type="button" className="du-link" onClick={event => done(event, onLevels)}>
          সব লেভেল <span aria-label={`মোট ${bn(stars)}টা তারা`}>★ {bn(stars)}/{bn(LEVEL_COUNT * 3)}</span>
        </button>
      </div>
    </div>
  );
}

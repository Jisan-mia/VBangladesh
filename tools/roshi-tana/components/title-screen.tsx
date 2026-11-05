"use client";
// The first screen: the ঢোল itself is the start button (the rope and ribbon behind it, খেলো on the barrel), then the level
// line with its one new thing, the three modes with the chosen one's promise, সব লেভেল and the two-player chip. A friend's
// challenge sits on top.
import { useEffect, useRef } from "react";
import { LEVEL_COUNT, levelDef, MODE_INFO, MODES, WORLDS, type Mode } from "../lib/levels";
import { bannerNote, bn, feat, type Shared } from "../lib/link";
import { drawTitleDrum, TITLE_ASPECT } from "../lib/art";

export function TitleScreen({ level, mode, old, friend, stars, onStart, onMode, onLevels, onDuo }: {
  level: number; mode: Mode; old: boolean; friend: Shared | null; stars: number;
  onStart: () => void; onMode: (mode: Mode) => void; onLevels: () => void; onDuo: () => void;
}) {
  const box = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const def = levelDef(level, old);

  useEffect(() => {
    const element = box.current, target = canvas.current;
    if (!element || !target) return;
    const draw = () => {
      const width = Math.floor(Math.min(element.clientWidth, element.clientHeight / TITLE_ASPECT, 460));
      if (width < 40) return;
      target.style.width = `${width}px`;
      target.style.height = `${Math.round(width * TITLE_ASPECT)}px`;
      drawTitleDrum(target, width, Math.min(2, window.devicePixelRatio || 1), "খেলো", def.world);
    };
    const observer = new ResizeObserver(draw);
    observer.observe(element);
    void document.fonts?.ready.then(draw);
    return () => observer.disconnect();
  }, [def.world]);

  const done = (event: { currentTarget: HTMLElement }, run: () => void) => { event.currentTarget.blur(); run(); };
  return (
    <div className="rt-title">
      {friend && <p className="rt-title-friend"><b>{feat(friend)}।</b> <span>{bannerNote(friend.name)}</span></p>}
      <div className="rt-title-drum" ref={box}>
        <button type="button" className="rt-title-start" onClick={event => done(event, onStart)} aria-label={`খেলো: লেভেল ${bn(level)}, ${def.team}`}>
          <canvas ref={canvas} aria-hidden="true" />
        </button>
      </div>
      <p className="rt-title-level">
        <span>{old ? "বন্ধুর পুরোনো লেভেল" : WORLDS[def.world].name} · লেভেল {bn(level)}: {def.team}</span>
        {!old && <small>{def.surge ? "মাঠের শেষ দল। " : ""}{def.teach}</small>}
      </p>
      {!old && (
        <div className="rt-modes" role="radiogroup" aria-label="কতটা কঠিন">
          {MODES.map(item => <button key={item} type="button" role="radio" aria-checked={item === mode} onClick={event => done(event, () => onMode(item))}>{MODE_INFO[item].name}</button>)}
        </div>
      )}
      {!old && <p className="rt-mode-line">{MODE_INFO[mode].line}</p>}
      <div className="rt-title-more">
        <button type="button" className="rt-link" onClick={event => done(event, onLevels)}>
          সব লেভেল <span aria-label={`মোট ${bn(stars)}টা তারা`}>★ {bn(stars)}/{bn(LEVEL_COUNT * 3)}</span>
        </button>
        <button type="button" className="rt-link" onClick={event => done(event, onDuo)}>দুজনে এক ফোনে</button>
      </div>
    </div>
  );
}

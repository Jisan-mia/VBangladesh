"use client";
// The first screen: the shuttlecock under the bulb is the start button (খেলো on its cork), then the পাড়া and level with its one
// new thing, the neighbour's style, the three modes with the chosen one's promise, and সব লেভেল. A friend's challenge sits on top.
import { useEffect, useRef } from "react";
import { isFinale, levelDef, LEVEL_COUNT, MODE_INFO, MODES, WORLDS, type Mode } from "../lib/levels";
import { bannerNote, bn, feat } from "../lib/lines";
import type { Shared } from "../lib/challenge";
import { drawTitleArt, TITLE_ASPECT } from "../lib/scene";

export function TitleScreen({ level, mode, friend, stars, onStart, onMode, onLevels }: {
  level: number; mode: Mode; friend: Shared | null; stars: number;
  onStart: () => void; onMode: (mode: Mode) => void; onLevels: () => void;
}) {
  const box = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const def = levelDef(level);

  useEffect(() => {
    const element = box.current, target = canvas.current;
    if (!element || !target) return;
    const draw = () => {
      const width = Math.floor(Math.min(element.clientWidth, element.clientHeight / TITLE_ASPECT, 380));
      if (width < 40) return;
      target.style.width = `${width}px`;
      target.style.height = `${Math.round(width * TITLE_ASPECT)}px`;
      drawTitleArt(target, width, Math.min(2, window.devicePixelRatio || 1), "খেলো", def.world);
    };
    const observer = new ResizeObserver(draw);
    observer.observe(element);
    void document.fonts?.ready.then(draw);
    return () => observer.disconnect();
  }, [def.world]);

  const done = (event: { currentTarget: HTMLElement }, run: () => void) => { event.currentTarget.blur(); run(); };
  return (
    <div className="gb-title" data-world={def.world}>
      {friend && <p className="gb-title-friend"><b>{feat(friend)}।</b> <span>{bannerNote(friend.name)}</span></p>}
      <div className="gb-title-art" ref={box}>
        <button type="button" className="gb-title-start" onClick={event => done(event, onStart)} aria-label={`খেলো: লেভেল ${bn(level)}, ${def.rival.name}`}>
          <canvas ref={canvas} aria-hidden="true" />
        </button>
      </div>
      <p className="gb-title-level">
        <span>{WORLDS[def.world].name} · লেভেল {bn(level)}: {def.rival.name}</span>
        <small>{isFinale(def) ? <b>{def.move}। </b> : null}{def.teach}</small>
        <small className="gb-title-style">{def.rival.short}: {def.rival.style}</small>
      </p>
      <div className="gb-modes" role="radiogroup" aria-label="কতটা কঠিন">
        {MODES.map(item => <button key={item} type="button" role="radio" aria-checked={item === mode} onClick={event => done(event, () => onMode(item))}>{MODE_INFO[item].name}</button>)}
      </div>
      <p className="gb-mode-line">{MODE_INFO[mode].line}</p>
      <button type="button" className="gb-link" onClick={event => done(event, onLevels)}>
        সব লেভেল <span aria-label={`মোট ${bn(stars)}টা তারা`}>★ {bn(stars)}/{bn(LEVEL_COUNT * 3)}</span>
      </button>
    </div>
  );
}

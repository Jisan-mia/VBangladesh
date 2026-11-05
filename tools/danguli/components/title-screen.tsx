"use client";
// The first screen: the ডাং and কাঠি over the hole are the start button (খেলো on the board), then the মাঠ and level with its
// one new thing, the neighbour's score, the three modes with the chosen one's promise, and সব লেভেল. A friend's challenge sits on top.
import { useEffect, useRef } from "react";
import type { Shared } from "../lib/challenge";
import { isFinale, levelDef, LEVEL_COUNT, MODE_INFO, MODES, WORLDS, type Mode } from "../lib/levels";
import { bannerNote, bn, feat } from "../lib/lines";
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
      const width = Math.floor(Math.min(element.clientWidth, element.clientHeight / TITLE_ASPECT, 400));
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
    <div className="dg-title" data-world={def.world}>
      {friend && <p className="dg-title-friend"><b>{feat(friend)}।</b> <span>{bannerNote(friend.name)}</span></p>}
      <div className="dg-title-art" ref={box}>
        <button type="button" className="dg-title-start" onClick={event => done(event, onStart)} aria-label={`খেলো: লেভেল ${bn(level)}, ${def.rival.name}`}>
          <canvas ref={canvas} aria-hidden="true" />
        </button>
      </div>
      <p className="dg-title-level">
        <span>{WORLDS[def.world].name} · লেভেল {bn(level)}: {def.rival.name}</span>
        <small className="dg-title-target">{def.rival.short} মেরেছে <b>{bn(def.target)} ডাং</b>। তিন মারে এর বেশি মারো।</small>
        <small>{isFinale(def) ? <b>{def.move}। </b> : null}{def.teach}</small>
      </p>
      <div className="dg-modes" role="radiogroup" aria-label="কতটা কঠিন">
        {MODES.map(item => <button key={item} type="button" role="radio" aria-checked={item === mode} onClick={event => done(event, () => onMode(item))}>{MODE_INFO[item].name}</button>)}
      </div>
      <p className="dg-mode-line">{MODE_INFO[mode].line}</p>
      <button type="button" className="dg-link" onClick={event => done(event, onLevels)}>
        সব লেভেল <span aria-label={`মোট ${bn(stars)}টা তারা`}>★ {bn(stars)}/{bn(LEVEL_COUNT * 3)}</span>
      </button>
    </div>
  );
}

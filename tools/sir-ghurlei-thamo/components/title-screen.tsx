"use client";
// The first screen: the folded chit itself is the start button (the board and the teacher behind it, খেলো in pen), then the
// level line with its one new thing, the three modes with the chosen one's promise, সব লেভেল and the one-tap chip.
// A friend's challenge sits on top.
import { useEffect, useRef } from "react";
import type { Teacher } from "../lib/class";
import { bn, friendClaim, friendLine, type Shared } from "../lib/challenge";
import { oldName } from "../lib/legacy";
import { LEVEL_COUNT, levelDef, MODE_INFO, MODES, WORLDS, type Mode } from "../lib/levels";
import { drawTitleChit, TITLE_ASPECT } from "../lib/panels";

export function TitleScreen({ level, old, mode, friend, stars, tapMode, teacher, onStart, onMode, onLevels, onTap }: {
  level: number; old: boolean; mode: Mode; friend: Shared | null; stars: number; tapMode: boolean; teacher: Teacher;
  onStart: () => void; onMode: (mode: Mode) => void; onLevels: () => void; onTap: () => void;
}) {
  const box = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const def = levelDef(level), world = old ? 0 : def.world;

  useEffect(() => {
    const element = box.current, target = canvas.current;
    if (!element || !target) return;
    const draw = () => {
      const width = Math.floor(Math.min(element.clientWidth, element.clientHeight / TITLE_ASPECT, 460));
      if (width < 40) return;
      target.style.width = `${width}px`;
      target.style.height = `${Math.round(width * TITLE_ASPECT)}px`;
      drawTitleChit(target, width, Math.min(2, window.devicePixelRatio || 1), "খেলো", world, teacher);
    };
    const observer = new ResizeObserver(draw);
    observer.observe(element);
    void document.fonts?.ready.then(draw);
    return () => observer.disconnect();
  }, [world, teacher]);

  const done = (event: { currentTarget: HTMLElement }, run: () => void) => { event.currentTarget.blur(); run(); };
  return (
    <div className="sg-title" data-world={world}>
      {friend && (
        <p className="sg-title-friend"><b>{friendLine(friend)}</b> <span>{friendClaim(friend)}।</span></p>
      )}
      <div className="sg-title-art" ref={box}>
        <button type="button" className="sg-title-start" onClick={event => done(event, onStart)}
          aria-label={old ? `খেলো: বন্ধুর পুরোনো ক্লাস ${bn(level)}` : `খেলো: লেভেল ${bn(level)}, ${def.name}`}>
          <canvas ref={canvas} aria-hidden="true" />
        </button>
      </div>
      <p className="sg-title-level">
        {old
          ? <span>বন্ধুর পুরোনো ক্লাস {bn(level)}: {oldName(level)}</span>
          : <span>{WORLDS[def.world].name} · লেভেল {bn(level)}: {def.name}</span>}
        {!old && <small>{def.finale ? "এই ক্লাসের শেষ পিরিয়ড। তিনবার ধরা পড়লে চিরকুট জমা। " : ""}{def.teach}</small>}
      </p>
      {!old && (
        <div className="sg-modes" role="radiogroup" aria-label="কতটা কঠিন">
          {MODES.map(item => <button key={item} type="button" role="radio" aria-checked={item === mode} onClick={event => done(event, () => onMode(item))}>{MODE_INFO[item].name}</button>)}
        </div>
      )}
      {!old && <p className="sg-mode-line">{MODE_INFO[mode].line}</p>}
      <div className="sg-title-more">
        <button type="button" className="sg-link" onClick={event => done(event, onLevels)}>
          সব লেভেল <span aria-label={`মোট ${bn(stars)}টা তারা`}>★ {bn(stars)}/{bn(LEVEL_COUNT * 3)}</span>
        </button>
        <button type="button" className="sg-chip" aria-pressed={tapMode} onClick={event => done(event, onTap)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11V5a2 2 0 0 1 4 0v6m0-1a2 2 0 0 1 4 0v3a6 6 0 0 1-6 6h-1a5 5 0 0 1-4-2l-2-3a1.6 1.6 0 0 1 2.6-2L9 15" /></svg>
          এক চাপে চলা-থামা
        </button>
      </div>
    </div>
  );
}

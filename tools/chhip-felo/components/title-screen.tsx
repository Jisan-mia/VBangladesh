"use client";
// The first screen: the water with a giant float and ছিপ ফেলো on a bamboo plank is the start button. Under it, small:
// the level and its one new thing, the three modes with the chosen one's promise, সব লেভেল and the album. A friend's challenge sits on top.
import { useEffect, useRef } from "react";
import { drawTitle, TITLE_ASPECT } from "../lib/art";
import type { Shared } from "../lib/challenge";
import { LEVEL_COUNT, levelDef, MODE_INFO, MODES, WORLDS, type Mode } from "../lib/levels";
import { bn, feat, friendClaim } from "../lib/lines";

export function TitleScreen({ level, mode, friend, stars, fish, slow, onStart, onMode, onLevels, onAlbum }: {
  level: number; mode: Mode; friend: Shared | null; stars: number; fish: number; slow: boolean;
  onStart: () => void; onMode: (mode: Mode) => void; onLevels: () => void; onAlbum: () => void;
}) {
  const box = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const def = levelDef(level), world = def.world;
  const lockedMode = friend !== null && !friend.old && friend.level === level;

  useEffect(() => {
    const element = box.current, target = canvas.current;
    if (!element || !target) return;
    const draw = () => {
      const width = Math.floor(Math.min(element.clientWidth, element.clientHeight / TITLE_ASPECT, 440));
      if (width < 40) return;
      target.style.width = `${width}px`;
      target.style.height = `${Math.round(width * TITLE_ASPECT)}px`;
      drawTitle(target, width, Math.min(2, window.devicePixelRatio || 1), world, "ছিপ ফেলো");
    };
    const observer = new ResizeObserver(draw);
    observer.observe(element);
    void document.fonts?.ready.then(draw);
    return () => observer.disconnect();
  }, [world]);

  const blurThen = (run: () => void) => (event: { currentTarget: HTMLElement }) => { event.currentTarget.blur(); run(); };
  return (
    <div className="cf-title" data-world={world}>
      {friend && <p className="cf-title-friend"><b>{feat(friend)}।</b> <span>{friendClaim(friend)}</span></p>}
      <div className="cf-title-art" ref={box}>
        <button type="button" className="cf-title-start" data-slow={slow || undefined} onClick={blurThen(onStart)} aria-label={`ছিপ ফেলো: লেভেল ${bn(level)}, ${def.title}`}>
          <canvas ref={canvas} aria-hidden="true" />
        </button>
      </div>
      <p className="cf-title-level">
        <span>{WORLDS[world].name} · লেভেল {bn(level)}: {def.title}</span>
        <small>{def.boss >= 0 ? "শেষ ধাপ। " : ""}{def.teach}</small>
      </p>
      {!lockedMode && (
        <div className="cf-modes" role="radiogroup" aria-label="কতটা কঠিন">
          {MODES.map(item => <button key={item} type="button" role="radio" aria-checked={item === mode} onClick={blurThen(() => onMode(item))}>{MODE_INFO[item].name}</button>)}
        </div>
      )}
      <p className="cf-mode-line">{lockedMode ? `বন্ধুর মতোই ${MODE_INFO[mode].name} মোডে খেলবে।` : MODE_INFO[mode].line}</p>
      <p className="cf-title-links">
        <button type="button" onClick={blurThen(onLevels)}>সব লেভেল <span aria-label={`মোট ${bn(stars)}টা তারা`}>★ {bn(stars)}/{bn(LEVEL_COUNT * 3)}</span></button>
        <button type="button" onClick={blurThen(onAlbum)}>মাছের অ্যালবাম <span>{bn(fish)}/২০</span></button>
      </p>
    </div>
  );
}

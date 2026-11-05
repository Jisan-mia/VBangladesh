"use client";
// The first screen: the walker on the ridge with a bamboo signboard saying চলো is the start button (it sways gently), then the level
// line with its one new thing, the three modes with the chosen one's promise, and সব লেভেল. A friend's challenge sits on top.
import { useEffect, useRef } from "react";
import { LEVEL_COUNT, MODE_INFO, MODES, WORLDS, defOfLevel, specOfRun, type Mode, type Run } from "../lib/levels";
import { bn, feat, friendClaim, playLabel, type Card } from "../lib/link";
import { drawTitle, TITLE_ASPECT } from "../lib/title-art";
import { Star } from "./icons";

export function TitleScreen({ run, mode, friend, stars, best, onStart, onMode, onLevels }: {
  run: Run; mode: Mode; friend: Card | null; stars: number; best: number | null;
  onStart: () => void; onMode: (mode: Mode) => void; onLevels: () => void;
}) {
  const box = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const def = defOfLevel(run.level), scene = specOfRun(run).scene;

  useEffect(() => {
    const element = box.current, target = canvas.current;
    if (!element || !target) return;
    const draw = () => {
      const width = Math.floor(Math.min(element.clientWidth * 0.94, element.clientHeight / TITLE_ASPECT, 420));
      if (width < 40) return;
      target.style.width = `${width}px`;
      target.style.height = `${Math.round(width * TITLE_ASPECT)}px`;
      drawTitle(target, width, Math.min(2, window.devicePixelRatio || 1), scene, "চলো");
    };
    const observer = new ResizeObserver(draw);
    observer.observe(element);
    void document.fonts?.ready.then(draw);
    return () => observer.disconnect();
  }, [scene]);

  const fixed = run.kind === "old" || (friend !== null && friend.seed === run.seed);
  return (
    <div className="al-title" data-scene={scene}>
      {friend && <p className="al-title-friend"><b>{feat(friend)}।</b> <span>{friendClaim(friend.name)}</span></p>}
      <div className="al-title-hook" ref={box}>
        <button type="button" className="al-title-start" onClick={event => { event.currentTarget.blur(); onStart(); }} aria-label={`চলো: ${playLabel(run)}`}>
          <canvas ref={canvas} aria-hidden="true" />
        </button>
      </div>
      <div className="al-title-card">
        <p className="al-title-level">
          {run.kind === "level" ? (
            <>
              <span>{WORLDS[def.world].name} · লেভেল {bn(run.level)}: {def.name}</span>
              <small>{def.finale ? "শেষ ধাপ। " : ""}{def.teach}</small>
            </>
          ) : (
            <><span>বন্ধুর পুরোনো খেত · {playLabel(run)}</span><small>পুরোনো নিয়ম: তিনবার পিছলালে খেত শেষ। তারা জমে না।</small></>
          )}
        </p>
        {run.kind !== "old" && !fixed && (
          <>
            <div className="al-modes" role="radiogroup" aria-label="কতটা কঠিন">
              {MODES.map(item => <button key={item} type="button" role="radio" aria-checked={item === mode} onClick={event => { event.currentTarget.blur(); onMode(item); }}>{MODE_INFO[item].name}</button>)}
            </div>
            <p className="al-mode-line">{MODE_INFO[mode].line}</p>
          </>
        )}
        <div className="al-title-more">
          <button type="button" onClick={event => { event.currentTarget.blur(); onLevels(); }}>
            সব লেভেল <span aria-label={`মোট ${bn(stars)}টা তারা`}><Star /> {bn(stars)}/{bn(LEVEL_COUNT * 3)}</span>
          </button>
          {best !== null && <p className="al-best">টানা শুকনো হাঁটা: <b>{bn(best)} মিটার</b></p>}
        </div>
      </div>
    </div>
  );
}

"use client";
// The first screen: the sack on the crane hook is the start button (খেলো printed on it, swaying gently), then the level line
// with its one new thing and star target, the three modes with the chosen one's promise, সব লেভেল and খোলা ঘাট.
// A friend's challenge sits on top.
import { useEffect, useRef } from "react";
import { ENDLESS, LEVEL_COUNT, MODE_INFO, MODES, WORLDS, defOf, type Mode, type Run } from "../lib/levels";
import { bn, friendClaim, friendLine, playLabel, type Card } from "../lib/link";
import { drawTitleGround, drawTitleSack, TITLE_ASPECT } from "../lib/title-art";

export function TitleScreen({ run, mode, friend, stars, best, onStart, onMode, onLevels, onEndless }: {
  run: Run; mode: Mode; friend: Card | null; stars: number; best: number | null;
  onStart: () => void; onMode: (mode: Mode) => void; onLevels: () => void; onEndless: () => void;
}) {
  const box = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null), ground = useRef<HTMLCanvasElement>(null);
  const def = defOf(run), kind = def.heavy ? 2 : def.world === 2 ? 1 : 0;

  useEffect(() => {
    const element = box.current, target = canvas.current;
    if (!element || !target) return;
    const draw = () => {
      const width = Math.floor(Math.min(element.clientWidth * 0.86, element.clientHeight / TITLE_ASPECT, 380));
      if (width < 40) return;
      target.style.width = `${width}px`;
      target.style.height = `${Math.round(width * TITLE_ASPECT)}px`;
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      drawTitleSack(target, width, ratio, "খেলো", kind);
      const strip = ground.current, full = Math.round(strip?.getBoundingClientRect().width ?? 0);
      if (strip && full > 40) { strip.style.height = `${Math.round(full * 0.36)}px`; drawTitleGround(strip, full, ratio, def.world); }
    };
    const observer = new ResizeObserver(draw);
    observer.observe(element);
    void document.fonts?.ready.then(draw);
    return () => observer.disconnect();
  }, [kind, def.world]);

  const fixed = run.kind === "old" || (friend !== null && friend.seed === run.seed);
  return (
    <div className="bp-title">
      {friend && <p className="bp-title-friend"><b>{friendLine(friend)}</b> <span>{friendClaim(friend)}</span></p>}
      <div className="bp-title-jib" aria-hidden="true" />
      <div className="bp-title-hook" ref={box}>
        <button type="button" className="bp-title-start" onClick={event => { event.currentTarget.blur(); onStart(); }} aria-label={`খেলো: ${playLabel(run)}`}>
          <canvas ref={canvas} aria-hidden="true" />
        </button>
      </div>
      <canvas ref={ground} className="bp-title-ground" aria-hidden="true" />
      <div className="bp-title-card">
      <p className="bp-title-level">
        {run.kind === "level" ? (
          <>
            <span>{WORLDS[def.world].name} · লেভেল {bn(run.level)}: {def.name}</span>
            <small>{def.finale ? "শেষ ধাপ। " : ""}{def.teach}</small>
            <small className="bp-title-target">ট্রাক ভরে {bn(def.goal)}টায় · ★★ {bn(def.stars[0])}টা ঠিক মাঝে · ★★★ {bn(def.stars[1])}টা</small>
          </>
        ) : run.kind === "endless" ? (
          <><span>{ENDLESS.name}</span><small>{ENDLESS.teach}{best !== null && ` সেরা ${bn(best)}টা।`}</small></>
        ) : (
          <><span>বন্ধুর পুরোনো দোল · {playLabel(run)}</span><small>পুরোনো নিয়ম: পাহাড় দোলে না, একবার ফসকালেই শেষ।</small></>
        )}
      </p>
      {run.kind !== "old" && !fixed && (
        <div className="bp-modes" role="radiogroup" aria-label="কতটা কঠিন">
          {MODES.map(item => (
            <button key={item} type="button" role="radio" aria-checked={item === mode} onClick={event => { event.currentTarget.blur(); onMode(item); }}>{MODE_INFO[item].name}</button>
          ))}
        </div>
      )}
      {run.kind !== "old" && !fixed && <p className="bp-mode-line">{MODE_INFO[mode].line}</p>}
      <div className="bp-title-more">
        <button type="button" onClick={event => { event.currentTarget.blur(); onLevels(); }}>
          সব লেভেল <span aria-label={`মোট ${bn(stars)}টা তারা`}>★ {bn(stars)}/{bn(LEVEL_COUNT * 3)}</span>
        </button>
        {run.kind !== "endless" && <button type="button" onClick={event => { event.currentTarget.blur(); onEndless(); }}>খোলা ঘাট{best !== null && <span>সেরা {bn(best)}</span>}</button>}
      </div>
      </div>
    </div>
  );
}

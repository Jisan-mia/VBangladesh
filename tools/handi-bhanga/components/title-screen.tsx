"use client";
// The first screen: a painted pot hanging on its rope with খেলো on its belly is the start button (it sways gently), then
// the stall's line with its one new thing and the star rule, the three modes with the chosen one's promise, and সব লেভেল.
// A friend's challenge sits on top.
import { useEffect, useRef } from "react";
import { LEVELS, LEVEL_COUNT, MODE_INFO, MODES, OLD_STALLS, WORLDS, defOf, type Mode, type Run } from "../lib/levels";
import { bn, friendClaim, friendLine, playLabel, type Card } from "../lib/link";
import { drawTitlePot, drawTitleStrip, TITLE_ASPECT } from "../lib/title-art";

export function TitleScreen({ run, mode, friend, stars, onStart, onMode, onLevels }: {
  run: Run; mode: Mode; friend: Card | null; stars: number;
  onStart: () => void; onMode: (mode: Mode) => void; onLevels: () => void;
}) {
  const box = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null), strip = useRef<HTMLCanvasElement>(null);
  const def = defOf(run), kind = def.boss ? 2 : def.crackers ? 1 : 0, world = def.old ? 0 : def.world;

  useEffect(() => {
    const element = box.current, target = canvas.current;
    if (!element || !target) return;
    const draw = () => {
      const width = Math.floor(Math.min(element.clientWidth * 0.84, element.clientHeight / TITLE_ASPECT, 360));
      if (width < 40) return;
      target.style.width = `${width}px`;
      target.style.height = `${Math.round(width * TITLE_ASPECT)}px`;
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      drawTitlePot(target, width, ratio, "খেলো", kind);
      const ground = strip.current, full = Math.round(ground?.getBoundingClientRect().width ?? 0);
      if (ground && full > 40) { ground.style.height = `${Math.round(full * 0.3)}px`; drawTitleStrip(ground, full, ratio, world); }
    };
    const observer = new ResizeObserver(draw);
    observer.observe(element);
    void document.fonts?.ready.then(draw);
    return () => observer.disconnect();
  }, [kind, world]);

  const fixed = run.kind === "old" || (friend !== null && friend.seed === run.seed);
  const cap = MODE_INFO[mode].maxStars;
  return (
    <div className="hb-title" data-world={world}>
      {friend && <p className="hb-title-friend"><b>{friendLine(friend)}</b> <span>{friendClaim(friend)}</span></p>}
      <div className="hb-title-rope" ref={box}>
        <button type="button" className="hb-title-start" onClick={event => { event.currentTarget.blur(); onStart(); }} aria-label={`খেলো: ${playLabel(run)}`}>
          <canvas ref={canvas} aria-hidden="true" />
        </button>
      </div>
      <canvas ref={strip} className="hb-title-strip" aria-hidden="true" />
      <div className="hb-title-card">
        <p className="hb-title-level">
          {run.kind === "level" ? (
            <>
              <span>{WORLDS[LEVELS[run.level - 1].world].name} · লেভেল {bn(run.level)}: {def.name}</span>
              <small>{def.finale ? "শেষ দোকান। " : ""}{def.teach}</small>
              <small className="hb-title-target">সাফ করলে ★ · একটার বেশি বল না হারালে ★★{cap > 2 ? " · একটাও না হারালে ★★★" : ""}</small>
            </>
          ) : (
            <><span>বন্ধুর পুরোনো দোকান · {OLD_STALLS[run.level - 1].name}</span><small>পুরোনো নিয়ম: ৩৫টা হাঁড়ি, ৩টা বল, বল সবসময় ফিরে আসে।</small></>
          )}
        </p>
        {run.kind !== "old" && !fixed && (
          <div className="hb-modes" role="radiogroup" aria-label="কতটা কঠিন">
            {MODES.map(item => (
              <button key={item} type="button" role="radio" aria-checked={item === mode} onClick={event => { event.currentTarget.blur(); onMode(item); }}>{MODE_INFO[item].name}</button>
            ))}
          </div>
        )}
        {run.kind !== "old" && !fixed && <p className="hb-mode-line">{MODE_INFO[mode].line}</p>}
        <div className="hb-title-more">
          <button type="button" onClick={event => { event.currentTarget.blur(); onLevels(); }}>
            সব লেভেল <span aria-label={`মোট ${bn(stars)}টা তারা`}>★ {bn(stars)}/{bn(LEVEL_COUNT * 3)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

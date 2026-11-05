"use client";
// The first screen: a big velvet medallion with a bangle of the level's first goal in it and খেলো on a ribbon is the start
// button. Under it the level line (‹ ›), its one new thing, the goals and star numbers, the modes with the chosen one's promise,
// সব লেভেল. A friend's challenge sits on top.
import { useEffect, useRef, type RefObject } from "react";
import { cardSizes } from "../../../shared/card-canvas";
import { drawTitleBangle } from "../lib/art";
import { DUST_GOAL, FREE_GOAL, LOCK, RAINBOW, SPARKLE } from "../lib/board";
import type { Shared } from "../lib/challenge";
import { DEFS, finaleName, LEVEL_COUNT, MODE_INFO, MODES, WORLDS, worldOf, type Mode } from "../lib/ladder";
import { limitOf, specOf, type Run } from "../lib/rules";
import { bn, feat, friendClaim, goalLine, runLabel } from "../lib/words";

/** The bangle that stands for a level on its start button. */
export function titlePiece(run: Run) {
  const target = specOf(run).goals[0][0];
  return target === SPARKLE ? SPARKLE + 3 : target === RAINBOW ? RAINBOW : target === DUST_GOAL ? 2 : target === FREE_GOAL ? LOCK : target;
}

export function TitleScreen({ run, mode, friend, friendCanvas, stars, levelStars, canBack, canNext, onStart, onMode, onLevel, onLevels }: {
  run: Run; mode: Mode; friend: Shared | null; friendCanvas: RefObject<HTMLCanvasElement | null>;
  stars: number; levelStars: number; canBack: boolean; canNext: boolean;
  onStart: () => void; onMode: (mode: Mode) => void; onLevel: (level: number) => void; onLevels: () => void;
}) {
  const box = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const old = run.v === 1, piece = titlePiece(run), world = worldOf(run.level);
  const spec = specOf({ ...run, mode });

  useEffect(() => {
    const element = box.current, target = canvas.current;
    if (!element || !target) return;
    const draw = () => {
      const side = Math.floor(Math.min(element.clientWidth * 0.8, element.clientHeight / 1.02, 320));
      if (side < 40) return;
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      target.width = Math.round(side * ratio); target.height = Math.round(side * 1.02 * ratio);
      target.style.width = `${side}px`; target.style.height = `${Math.round(side * 1.02)}px`;
      const c = target.getContext("2d");
      if (!c) return;
      c.setTransform(ratio, 0, 0, ratio, 0, 0);
      drawTitleBangle(c, side, piece, "খেলো", world);
    };
    const observer = new ResizeObserver(draw);
    observer.observe(element);
    void document.fonts?.ready.then(draw);
    return () => observer.disconnect();
  }, [piece, world]);

  const tap = (go: () => void) => (event: { currentTarget: HTMLButtonElement }) => { event.currentTarget.blur(); go(); };
  const finale = !old ? finaleName(run.level) : "";
  return (
    <div className="cb-title">
      {friend && (
        <div className="cb-title-friend">
          <canvas ref={friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${feat(friend)}। বন্ধুর কার্ড।`} />
          <p><b>{feat(friend)}।</b> <span>{friendClaim(friend)}</span></p>
        </div>
      )}
      <div className="cb-title-plate" ref={box}>
        <button type="button" className="cb-title-start" onClick={tap(onStart)} aria-label={`খেলো: ${runLabel(run)}`}>
          <canvas ref={canvas} aria-hidden="true" />
        </button>
      </div>
      <div className="cb-title-card">
        <div className="cb-pick">
          {!old && <button type="button" className="cb-step" onClick={tap(() => onLevel(run.level - 1))} disabled={!canBack} aria-label="আগের লেভেল"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg></button>}
          <div className="cb-pick-name">
            {finale && <span className="cb-finale-badge">শেষ ধাপ</span>}
            <h2>{runLabel(run)}</h2>
            <p>{old ? "বন্ধুর পুরোনো লেভেল" : WORLDS[world].name}{levelStars ? ` · ${"★".repeat(levelStars)}` : ""}</p>
          </div>
          {!old && <button type="button" className="cb-step" onClick={tap(() => onLevel(run.level + 1))} disabled={!canNext || run.level >= LEVEL_COUNT} aria-label="পরের লেভেল"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg></button>}
        </div>
        <p className="cb-lesson">
          {old ? "পুরোনো নিয়মের লেভেল: তালা, ধুলো আর উপহার নেই।" : <><b>{finale ? "শেষ ধাপ" : run.level === 1 ? "শুরু" : "নতুন"}</b> {DEFS[run.level - 1].teach}</>}
        </p>
        <p className="cb-target">
          {goalLine(run, limitOf(spec, mode, run.gift))} · ★★★ {bn(spec.three)} পয়েন্ট · ★★ {bn(spec.two)}
        </p>
        {!old && (
          <>
            <div className="cb-modes" role="radiogroup" aria-label="কতটা কঠিন">
              {MODES.map(item => <button key={item} type="button" role="radio" aria-checked={item === mode} onClick={tap(() => onMode(item))}>{MODE_INFO[item].name}</button>)}
            </div>
            <p className="cb-mode-line">{MODE_INFO[mode].line}{finale ? " শুরুর আগে একটা উপহার বেছে নেবে।" : ""}</p>
          </>
        )}
        <div className="cb-title-more">
          <button type="button" onClick={tap(onLevels)}>সব লেভেল <span aria-label={`মোট ${bn(stars)}টা তারা`}>★ {bn(stars)}/{bn(LEVEL_COUNT * 3)}</span></button>
        </div>
      </div>
    </div>
  );
}

"use client";
// The first screen: a big clay plate holding the goal stage, with খেলো on its ribbon, is the start button. Under it the
// level line (‹ ›), its one new thing, the goal and star numbers, the modes with the chosen one's promise, সব লেভেল and
// খোলা বাগান. A friend's challenge sits on top.
import { useEffect, useRef, type RefObject } from "react";
import { cardSizes } from "../../../shared/card-canvas";
import { drawTitlePlate } from "../lib/art";
import type { Shared } from "../lib/challenge";
import { finaleName, GARDEN, LEVEL_COUNT, levelAt, MODE_INFO, MODES, WORLDS, worldOf, type Mode } from "../lib/levels";
import { limitOf, specOf, threeStar, twoStar, type Run } from "../lib/rules";
import { bn, feat, friendClaim, goalText, runLabel } from "../lib/words";

export function TitleScreen({ run, mode, friend, friendCanvas, stars, levelStars, best, canBack, canNext, onStart, onMode, onLevel, onLevels, onGarden }: {
  run: Run; mode: Mode; friend: Shared | null; friendCanvas: RefObject<HTMLCanvasElement | null>;
  stars: number; levelStars: number; best: number | null; canBack: boolean; canNext: boolean;
  onStart: () => void; onMode: (mode: Mode) => void; onLevel: (level: number) => void; onLevels: () => void; onGarden: () => void;
}) {
  const box = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const spec = specOf({ ...run, mode }), level = run.kind === "level", stage = level ? spec.target : 9;
  const fixed = friend !== null && friend.v === 1;

  useEffect(() => {
    const element = box.current, target = canvas.current;
    if (!element || !target) return;
    const draw = () => {
      const side = Math.floor(Math.min(element.clientWidth * 0.8, element.clientHeight / 1.08, 300));
      if (side < 40) return;
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      target.width = Math.round(side * ratio); target.height = Math.round(side * 1.08 * ratio);
      target.style.width = `${side}px`; target.style.height = `${Math.round(side * 1.08)}px`;
      const c = target.getContext("2d");
      if (!c) return;
      c.setTransform(ratio, 0, 0, ratio, 0, 0);
      drawTitlePlate(c, side, stage, "খেলো");
    };
    const observer = new ResizeObserver(draw);
    observer.observe(element);
    void document.fonts?.ready.then(draw);
    return () => observer.disconnect();
  }, [stage]);

  const tap = (go: () => void) => (event: { currentTarget: HTMLButtonElement }) => { event.currentTarget.blur(); go(); };
  const finale = level && run.v === 2 ? finaleName(run.level) : "";
  return (
    <div className="aa-title">
      {friend && (
        <div className="aa-title-friend">
          <canvas ref={friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${feat(friend)}। বন্ধুর কার্ড।`} />
          <p><b>{feat(friend)}।</b> <span>{friendClaim(friend)}</span></p>
        </div>
      )}
      <div className="aa-title-plate" ref={box}>
        <button type="button" className="aa-title-start" onClick={tap(onStart)} aria-label={`খেলো: ${runLabel(run)}`}>
          <canvas ref={canvas} aria-hidden="true" />
        </button>
      </div>
      <div className="aa-title-card">
        <div className="aa-pick">
          {level && !fixed && <button type="button" className="aa-step" onClick={tap(() => onLevel(run.level - 1))} disabled={!canBack} aria-label="আগের লেভেল"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg></button>}
          <div className="aa-pick-name">
            {finale && <span className="aa-finale-badge">শেষ ধাপ</span>}
            <h2>{level ? runLabel(run) : GARDEN.name}</h2>
            <p>{level ? `${run.v === 2 ? WORLDS[worldOf(run.level)].name : "বন্ধুর পুরোনো লেভেল"}${levelStars ? ` · ${"★".repeat(levelStars)}` : ""}` : best !== null ? `এই ফোনের সেরা ${bn(best)} পয়েন্ট` : "যতদূর পারো"}</p>
          </div>
          {level && !fixed && <button type="button" className="aa-step" onClick={tap(() => onLevel(run.level + 1))} disabled={!canNext || run.level >= LEVEL_COUNT} aria-label="পরের লেভেল"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg></button>}
        </div>
        <p className="aa-lesson">
          {level && run.v === 2 ? <><b>{finale ? "শেষ ধাপ" : run.level === 1 ? "শুরু" : "নতুন"}</b> {levelAt(run.level).teach}</> : level ? "পুরোনো নিয়মের লেভেল: আবহাওয়া নেই।" : GARDEN.teach}
        </p>
        {level && (
          <p className="aa-target">
            {goalText(spec.target, spec.count)} · {bn(limitOf(spec, mode))} চালের মধ্যে · ★★★ {bn(threeStar(spec))} চালে · ★★ {bn(twoStar(spec))}
          </p>
        )}
        {!fixed && (
          <>
            <div className="aa-modes" role="radiogroup" aria-label="কতটা কঠিন">
              {MODES.map(item => <button key={item} type="button" role="radio" aria-checked={item === mode} onClick={tap(() => onMode(item))}>{MODE_INFO[item].name}</button>)}
            </div>
            <p className="aa-mode-line">{mode === "n" && level && !spec.undo ? "আসল খেলা। ফেরত নাও খুলবে ৪ নম্বর লেভেলে।" : MODE_INFO[mode].line}</p>
          </>
        )}
        <div className="aa-title-more">
          <button type="button" onClick={tap(onLevels)}>সব লেভেল <span aria-label={`মোট ${bn(stars)}টা তারা`}>★ {bn(stars)}/{bn(LEVEL_COUNT * 3)}</span></button>
          {level && <button type="button" onClick={tap(onGarden)}>{GARDEN.name}{best !== null && <span>সেরা {bn(best)}</span>}</button>}
        </div>
      </div>
    </div>
  );
}

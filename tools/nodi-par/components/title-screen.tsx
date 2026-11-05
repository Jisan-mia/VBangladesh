"use client";
// The title, over the river: the biggest thing is the code-drawn boy on the ghat with a dotted hop to a ভেলা, which starts the crossing.
// Under it, small: which river and its one new thing, the three modes with what each means, the star marks, সব নদী.
import { useEffect, useRef } from "react";
import { possessive } from "../../../shared/bangla";
import { drawStartArt } from "../lib/art";
import { isFinale, lessonOf, riverName, MODES, WORLDS, worldOf } from "../lib/levels";
import { bn, banner } from "../lib/result";
import { PAR, mangoCount } from "../lib/river";
import type { Shared } from "../lib/result";

/** A canvas that redraws whenever its box changes size. */
export function ArtCanvas({ draw, className }: { draw: (context: CanvasRenderingContext2D, width: number, height: number) => void; className: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const paint = () => {
      const width = element.clientWidth, height = element.clientHeight, ratio = Math.min(2, window.devicePixelRatio || 1);
      if (!width || !height) return;
      element.width = Math.round(width * ratio); element.height = Math.round(height * ratio);
      const context = element.getContext("2d");
      if (!context) return;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      drawRef.current(context, width, height);
    };
    paint();
    const observer = new ResizeObserver(paint);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <canvas ref={ref} className={className} aria-hidden="true" />;
}

export type TitleProps = {
  level: number; stars: number; canPrev: boolean; canNext: boolean; mode: number;
  friend: Shared | null; friendHere: boolean;
  onStart: () => void; onPrev: () => void; onNext: () => void; onMode: (mode: number) => void; onList: () => void; onHome: () => void;
};

export function TitleScreen(props: TitleProps) {
  const { level, friend, friendHere } = props;
  const world = WORLDS[worldOf(level)], finale = isFinale(level);
  const blurAnd = (run: () => void) => (event: { currentTarget: HTMLElement }) => { event.currentTarget.blur(); run(); };
  const look = world.look, isNew = lessonOf(level).startsWith("নতুন: "), lesson = lessonOf(level).replace(/^নতুন: /, "");
  return (
    <section className="np-start" aria-labelledby="np-start-title" data-finale={finale || undefined}>
      {friend && friendHere && (
        <div className="np-friend">
          <p><b>{banner(friend)}</b> {possessive(friend.name || "বন্ধু")} নিজের ফোনের সময়।</p>
        </div>
      )}
      <button type="button" className="np-go" onClick={blurAnd(props.onStart)} aria-label={`লাফ দাও: নদী ${bn(level)}`}>
        <ArtCanvas draw={(context, width, height) => drawStartArt(context, width, height, look)} className="np-go-art" />
        <span>লাফ দাও</span>
      </button>

      <div className="np-pick">
        <button type="button" className="np-step" onClick={blurAnd(props.onPrev)} disabled={!props.canPrev} aria-label="আগের নদী">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <div className="np-pick-name">
          <p className="np-world-badge" data-finale={finale || undefined}>{finale ? `${world.name}: শেষ নদী` : world.name}</p>
          <h2 id="np-start-title">{finale ? riverName(level) : `নদী ${bn(level)} · ওপারে ${riverName(level)}`}</h2>
          {props.stars > 0 && <p className="np-got" aria-label={`তোমার ${bn(props.stars)} তারা`}>{"★".repeat(props.stars)}<span>{"★".repeat(3 - props.stars)}</span></p>}
        </div>
        <button type="button" className="np-step" onClick={blurAnd(props.onNext)} disabled={!props.canNext} aria-label="পরের নদী">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <p className="np-lesson"><b>{finale ? "শেষ নদী" : level === 1 ? "চাপো" : isNew ? "নতুন" : "এবার"}</b> {lesson}</p>

      <div className="np-modes" role="radiogroup" aria-label="পায়ের নিচে কতটা জায়গা">
        {MODES.map((each, index) => (
          <button key={each.name} type="button" role="radio" aria-checked={props.mode === index} onClick={blurAnd(() => props.onMode(index))}>{each.name}</button>
        ))}
      </div>
      <p className="np-mode-line">{MODES[props.mode].line}</p>
      <p className="np-targets">ওপারে ঘণ্টা ★ · {bn(PAR[level - 1])} সেকেন্ডে ★★ · {bn(mangoCount(level))}টা আম ★★★</p>

      <p className="np-start-foot">
        {friend && !friendHere ? <button type="button" className="kit-link" onClick={blurAnd(props.onHome)}>{friend.name ? `${possessive(friend.name)} নদীতে ফেরো` : "বন্ধুর নদীতে ফেরো"}</button>
          : <button type="button" className="kit-link" onClick={blurAnd(props.onList)}>সব নদী</button>}
        <span>চাপ দিলে লাফ · পাশে টানো · তীর আর Space</span>
      </p>
    </section>
  );
}

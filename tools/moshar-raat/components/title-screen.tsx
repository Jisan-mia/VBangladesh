"use client";
// The title, over the dark room: the biggest thing is the electric bat, its mesh crackling, which starts the night.
// Under it, small: which রাত and its one new thing, the three modes with what each means, the star targets, সব রাত.
import { useEffect, useRef } from "react";
import { possessive } from "../../../shared/bangla";
import { isFinale, levelOf, MODES, WORLDS, type Look } from "../lib/levels";
import { bannerNote, bn, feat, levelTitle } from "../lib/lines";
import { paintStartArt } from "../lib/paint";
import type { Shared } from "../lib/challenge";

/** A canvas that redraws whenever its box changes size. */
export function ArtCanvas({ draw, className }: { draw: (canvas: HTMLCanvasElement, width: number, height: number) => void; className: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const paint = () => { if (element.clientWidth) drawRef.current(element, element.clientWidth, element.clientHeight); };
    paint();
    const observer = new ResizeObserver(paint);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <canvas ref={ref} className={className} aria-hidden="true" />;
}

function drawStart(look: Look) {
  return (canvas: HTMLCanvasElement, width: number, height: number) => {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    paintStartArt(context, width, height, look);
  };
}

export type TitleProps = {
  level: number; stars: number; canPrev: boolean; canNext: boolean; mode: number; need: number; count: number;
  friend: Shared | null; friendHere: boolean;
  onStart: () => void; onPrev: () => void; onNext: () => void; onMode: (mode: number) => void; onList: () => void; onHome: () => void;
};

export function TitleScreen(props: TitleProps) {
  const { level, friend, friendHere } = props;
  const row = levelOf(level), world = WORLDS[row.world], finale = isFinale(level);
  const blurAnd = (run: () => void) => (event: { currentTarget: HTMLElement }) => { event.currentTarget.blur(); run(); };
  return (
    <section className="mr-start" aria-labelledby="mr-start-title" data-finale={finale || undefined}>
      {friend && friendHere && (
        <div className="mr-friend">
          <p><b>{feat(friend)}।</b> {bannerNote(friend)}</p>
        </div>
      )}
      <button type="button" className="mr-go" onClick={blurAnd(props.onStart)} aria-label={`রাত শুরু: ${levelTitle(level)}`}>
        <ArtCanvas draw={drawStart(world.look)} className="mr-go-art" />
        <span>রাত শুরু</span>
      </button>

      <div className="mr-pick">
        <button type="button" className="mr-step" onClick={blurAnd(props.onPrev)} disabled={!props.canPrev} aria-label="আগের রাত">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <div className="mr-pick-name">
          <p className="mr-world-badge" data-finale={finale || undefined}>{finale ? `${world.name}-এর শেষ রাত` : world.name}</p>
          <h2 id="mr-start-title">{levelTitle(level)}</h2>
          {props.stars > 0 && <p className="mr-got" aria-label={`তোমার ${bn(props.stars)} তারা`}>{"★".repeat(props.stars)}<span>{"★".repeat(3 - props.stars)}</span></p>}
        </div>
        <button type="button" className="mr-step" onClick={blurAnd(props.onNext)} disabled={!props.canNext} aria-label="পরের রাত">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <p className="mr-lesson"><b>{finale ? "শেষ রাত" : "নতুন"}</b> {row.line}</p>

      <div className="mr-modes" role="radiogroup" aria-label="কয় কামড়ে ঘুম ভাঙবে">
        {MODES.map((mode, index) => (
          <button key={mode.name} type="button" role="radio" aria-checked={props.mode === index} onClick={blurAnd(() => props.onMode(index))}>{mode.name}</button>
        ))}
      </div>
      <p className="mr-mode-line">{MODES[props.mode].line}</p>
      <p className="mr-targets">ভোর হলে ★ · {bn(props.need)}টা মশায় ★★ · কামড় ছাড়া ★★★ <span>({bn(props.count)}টা আসবে)</span></p>

      <p className="mr-start-foot">
        {friend && !friendHere ? <button type="button" className="kit-link" onClick={blurAnd(props.onHome)}>{friend.name ? `${possessive(friend.name)} রাতে ফেরো` : "বন্ধুর রাতে ফেরো"}</button>
          : <button type="button" className="kit-link" onClick={blurAnd(props.onList)}>সব রাত</button>}
        <span>মশার ওপর চাপো · তীর আর Space</span>
      </p>
    </section>
  );
}

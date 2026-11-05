"use client";
// The title, over the field: the biggest thing is the code-drawn কাকতাড়ুয়া over heavy শীষ with a sparrow taking off, which
// starts the afternoon. Under it, small: which ক্ষেত and its one new thing, the three modes with what each means, the marks, সব ক্ষেত.
import { useEffect, useRef } from "react";
import { possessive } from "../../../shared/bangla";
import { drawBird, drawPaddy, drawScarecrow, LOOKS, WINGS_UP } from "../lib/art";
import { isFinale, levelOf, MODES, WORLDS } from "../lib/levels";
import { bannerNote, bn, feat, levelTitle } from "../lib/lines";
import { PALETTES } from "../lib/paint";
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

const BOSS_LOOK = [LOOKS.godha, LOOKS.jhunti, LOOKS.parrot] as const;
const BIRD_LOOK = [LOOKS.sparrow, LOOKS.shalik, LOOKS.munia] as const;

function drawStart(world: number, finale: boolean) {
  return (canvas: HTMLCanvasElement, width: number, height: number) => {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    const c = canvas.getContext("2d");
    if (!c) return;
    const p = PALETTES[WORLDS[world].look];
    c.setTransform(ratio, 0, 0, ratio, 0, 0);
    c.clearRect(0, 0, width, height);
    const unit = Math.min(width / 300, height / 210), cx = width / 2, base = height - 8;
    // A warm glow behind, like the low sun.
    const reach = Math.max(20, Math.min(150 * unit, width / 2 - 1, base - 110 * unit - 1));
    const glow = c.createRadialGradient(cx, base - 110 * unit, 10, cx, base - 110 * unit, reach);
    glow.addColorStop(0, p.glow + "cc"); glow.addColorStop(1, p.glow + "00");
    c.fillStyle = glow; c.fillRect(0, 0, width, height);
    c.save(); c.translate(cx, base); drawScarecrow(c, 196 * unit, 0); c.restore();
    for (let i = 0; i < 9; i++) {
      c.save(); c.translate(cx + (i - 4) * 30 * unit, base + 4); drawPaddy(c, (44 + (i % 3) * 8) * unit, ((i % 5) - 2) * 0.16, i * 7 + 3, p.paddy); c.restore();
    }
    // The bird taking off with a হুশ, and (on a finale) the boss looking on.
    c.save(); c.translate(cx + 92 * unit, base - 150 * unit); c.rotate(-0.25); drawBird(c, 34 * unit, WINGS_UP, BIRD_LOOK[world]); c.restore();
    if (finale) { c.save(); c.translate(cx - 96 * unit, base - 46 * unit); c.scale(-1, 1); drawBird(c, 48 * unit, 0, BOSS_LOOK[world]); c.restore(); }
  };
}

export type TitleProps = {
  level: number; stars: number; canPrev: boolean; canNext: boolean; mode: number;
  friend: Shared | null; friendHere: boolean;
  onStart: () => void; onPrev: () => void; onNext: () => void; onMode: (mode: number) => void; onList: () => void; onHome: () => void;
};

export function TitleScreen(props: TitleProps) {
  const { level, friend, friendHere } = props;
  const row = levelOf(level), world = WORLDS[row.world], finale = isFinale(level);
  const blurAnd = (run: () => void) => (event: { currentTarget: HTMLElement }) => { event.currentTarget.blur(); run(); };
  return (
    <section className="ct-start" aria-labelledby="ct-start-title" data-finale={finale || undefined}>
      {friend && friendHere && (
        <div className="ct-friend">
          <p><b>{feat(friend)}।</b> {bannerNote(friend)}</p>
        </div>
      )}
      <button type="button" className="ct-go" onClick={blurAnd(props.onStart)} aria-label={`মাঠে নামো: ${levelTitle(level)}`}>
        <ArtCanvas draw={drawStart(row.world, finale)} className="ct-go-art" />
        <span>মাঠে নামো</span>
      </button>

      <div className="ct-pick">
        <button type="button" className="ct-step" onClick={blurAnd(props.onPrev)} disabled={!props.canPrev} aria-label="আগের ক্ষেত">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <div className="ct-pick-name">
          <p className="ct-world-badge" data-finale={finale || undefined}>{finale ? `${world.name}: শেষ ক্ষেত` : world.name}</p>
          <h2 id="ct-start-title">{levelTitle(level)}</h2>
          {props.stars > 0 && <p className="ct-got" aria-label={`তোমার ${bn(props.stars)} তারা`}>{"★".repeat(props.stars)}<span>{"★".repeat(3 - props.stars)}</span></p>}
        </div>
        <button type="button" className="ct-step" onClick={blurAnd(props.onNext)} disabled={!props.canNext} aria-label="পরের ক্ষেত">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <p className="ct-lesson"><b>{finale ? "শেষ ক্ষেত" : "নতুন"}</b> {row.line}</p>

      <div className="ct-modes" role="radiogroup" aria-label="এক ঠোকরে কত ধান যাবে">
        {MODES.map((mode, index) => (
          <button key={mode.name} type="button" role="radio" aria-checked={props.mode === index} onClick={blurAnd(() => props.onMode(index))}>{mode.name}</button>
        ))}
      </div>
      <p className="ct-mode-line">{MODES[props.mode].line}</p>
      <p className="ct-targets">সন্ধ্যায় ধান থাকলে: {bn(row.pass)}% ★ · {bn(row.two)}% ★★ · {bn(row.three)}% ★★★</p>

      <p className="ct-start-foot">
        {friend && !friendHere ? <button type="button" className="kit-link" onClick={blurAnd(props.onHome)}>{friend.name ? `${possessive(friend.name)} ক্ষেতে ফেরো` : "বন্ধুর ক্ষেতে ফেরো"}</button>
          : <button type="button" className="kit-link" onClick={blurAnd(props.onList)}>সব ক্ষেত</button>}
        <span>পাখির ওপর চাপো · তীর আর Space</span>
      </p>
    </section>
  );
}

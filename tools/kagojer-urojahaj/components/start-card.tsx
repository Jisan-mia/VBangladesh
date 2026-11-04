"use client";
// The title, over the classroom (or the roofs, or the river): the biggest thing is the folded plane itself, which throws.
// Under it, small: which flight and its one new thing, the পাতা chips with what each means, the star targets, সব লেভেল.
import { useEffect, useRef, type RefObject } from "react";
import { cardSizes } from "../../../shared/card-canvas";
import { isFinale, levelOf, MODES, WORLDS } from "../lib/levels";
import { bn, friendLine, friendNote, levelLabel, type Shared } from "../lib/link";
import { paintCandy, paintPlane } from "../lib/paint";

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

/** The start art: the plane, nose up, on a dotted throw line, with a লজেন্স waiting along it. */
function drawStartArt(canvas: HTMLCanvasElement, width: number, height: number) {
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const context = canvas.getContext("2d")!;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);
  const size = Math.min(width * 0.62, height * 1.35);
  context.strokeStyle = "#ffffffb0"; context.lineWidth = 3; context.lineCap = "round"; context.setLineDash([2, 12]);
  context.beginPath(); context.moveTo(width * 0.06, height * 0.92); context.quadraticCurveTo(width * 0.3, height * 0.42, width * 0.5, height * 0.48); context.stroke();
  context.setLineDash([]);
  context.save(); context.translate(width * 0.86, height * 0.3); paintCandy(context, Math.max(7, size * 0.07)); context.restore();
  context.save(); context.translate(width * 0.52, height * 0.5); context.rotate(-0.28);
  context.fillStyle = "#00000026"; context.beginPath(); context.ellipse(4, size * 0.3, size * 0.32, size * 0.05, 0, 0, Math.PI * 2); context.fill();
  paintPlane(context, size);
  context.restore();
}

export type StartProps = {
  level: number;
  targets: { goal: number; candies: number };
  stars: number;
  canPrev: boolean; canNext: boolean;
  mode: number;
  friend: Shared | null; friendHere: boolean; friendCanvas: RefObject<HTMLCanvasElement | null>;
  onStart: () => void; onPrev: () => void; onNext: () => void; onMode: (mode: number) => void; onList: () => void;
};

export function StartCard(props: StartProps) {
  const { level, targets, friend, friendHere } = props;
  const row = levelOf(level), finale = isFinale(level);
  return (
    <section className="ku-start" aria-labelledby="ku-start-title" data-finale={finale || undefined}>
      {friend && friendHere && (
        <div className="ku-friend">
          <canvas ref={props.friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.name || "বন্ধুর"} কার্ড: ${bn(friend.score)} পয়েন্ট`} />
          <p><b>{friendLine(friend)}</b> {friendNote(friend)}</p>
        </div>
      )}

      <button type="button" className="ku-go" onClick={props.onStart} data-first>
        <ArtCanvas draw={drawStartArt} className="ku-go-art" />
        <span>ছোড়ো</span>
      </button>

      <div className="ku-pick">
        <button type="button" className="ku-step" onClick={props.onPrev} disabled={!props.canPrev} aria-label="আগের লেভেল">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <div className="ku-pick-name">
          {finale && <p className="ku-finale-badge">{WORLDS[row.world].name}-এর শেষ লেভেল</p>}
          <h2 id="ku-start-title">{levelLabel(level)}</h2>
          {props.stars > 0 && <p className="ku-got" aria-label={`তোমার ${bn(props.stars)} তারা`}>{"★".repeat(props.stars)}<span>{"★".repeat(3 - props.stars)}</span></p>}
        </div>
        <button type="button" className="ku-step" onClick={props.onNext} disabled={!props.canNext} aria-label="পরের লেভেল">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <p className="ku-lesson"><b>{finale ? "শেষ লেভেল" : "নতুন"}</b> {row.line.replace(/^শেষ লেভেল: /, "")}</p>

      <div className="ku-modes" role="radiogroup" aria-label="কয়টা পাতা">
        {MODES.map((mode, index) => (
          <button key={mode.name} type="button" role="radio" aria-checked={props.mode === index} onClick={() => props.onMode(index)}>{mode.name}</button>
        ))}
      </div>
      <p className="ku-mode-line">{MODES[props.mode].line}</p>

      <p className="ku-targets">★ নামলে · ★ {bn(targets.goal)}টা লজেন্সে <span>({bn(targets.candies)}টার মধ্যে)</span> · ★ লাল দাগে নামলে</p>

      <p className="ku-start-foot">
        <button type="button" className="kit-link" onClick={props.onList}>সব লেভেল</button>
        <span>চেপে ধরো: নাক ওঠে · ছাড়ো: নামে · স্পেস বা ↑</span>
      </p>
    </section>
  );
}

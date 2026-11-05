"use client";
// The title, over the dimmed road: the biggest thing is the পিয়ন on his bike, which sets off. Under it, small: which route
// and its one new thing, the ধাক্কা chips with what each means, the star targets, সব লেভেল.
import { useEffect, useRef, type RefObject } from "react";
import { cardSizes } from "../../../shared/card-canvas";
import { C, drawBike, drawLetter } from "../lib/art";
import { isFinale, levelOf, MODES, WORLDS } from "../lib/levels";
import { bn, friendLine, friendNote, levelLabel, type Shared } from "../lib/link";

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

/** The start art: the পিয়ন on his bike, nose up the road, a letter in the air, the bell's rings. */
function drawStartArt(canvas: HTMLCanvasElement, width: number, height: number) {
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const context = canvas.getContext("2d")!;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);
  const scale = Math.max(1.4, Math.min(height / 78, width / 140));
  // dotted road line
  context.strokeStyle = "#ffffffb0"; context.lineWidth = 3; context.lineCap = "round"; context.setLineDash([2, 12]);
  context.beginPath(); context.moveTo(width * 0.5, height); context.lineTo(width * 0.5, height * 0.08); context.stroke();
  context.setLineDash([]);
  // letters in the air
  for (const [dx, dy, r, s] of [[-0.3, 0.2, -0.4, 1.5], [0.3, 0.12, 0.3, 1.3], [-0.2, 0.5, 0.5, 1.1]] as const) {
    context.save(); context.translate(width * (0.5 + dx), height * (0.45 - dy * 0.6)); context.rotate(r); context.scale(s * scale * 0.6, s * scale * 0.6); drawLetter(context, 1); context.restore();
  }
  // shadow and the bike
  context.save(); context.translate(width * 0.5, height * 0.12); context.rotate(-0.06); context.scale(scale, scale);
  drawBike(context, 1);
  context.restore();
  context.strokeStyle = C.terracotta; context.lineWidth = 3; context.lineCap = "round";
  for (const r of [10, 18]) { context.beginPath(); context.arc(width * 0.5 + 9 * scale, height * 0.12 + 13.6 * scale, r, -1.1, 0.5); context.stroke(); }
}

export type StartProps = {
  level: number;
  meters: number;
  targets: { goal: number; houses: number };
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
    <section className="pc-start" aria-labelledby="pc-start-title" data-finale={finale || undefined}>
      {friend && friendHere && (
        <div className="pc-friend">
          <canvas ref={props.friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.name || "বন্ধুর"} কার্ড: ${bn(friend.score)} পয়েন্ট`} />
          <p><b>{friendLine(friend)}</b> {friendNote(friend)}</p>
        </div>
      )}

      <button type="button" className="pc-go" onClick={props.onStart} data-first>
        <ArtCanvas draw={drawStartArt} className="pc-go-art" />
        <span>রওনা দাও</span>
      </button>

      <div className="pc-pick">
        <button type="button" className="pc-step" onClick={props.onPrev} disabled={!props.canPrev} aria-label="আগের লেভেল">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <div className="pc-pick-name">
          {finale && <p className="pc-finale-badge">{WORLDS[row.world].name}-এর শেষ লেভেল</p>}
          <h2 id="pc-start-title">{levelLabel(level)}</h2>
          <p className="pc-place">{row.place} · {bn(props.meters)} মিটার{props.stars > 0 && <span className="pc-got" aria-label={`তোমার ${bn(props.stars)} তারা`}> {"★".repeat(props.stars)}<span>{"★".repeat(3 - props.stars)}</span></span>}</p>
        </div>
        <button type="button" className="pc-step" onClick={props.onNext} disabled={!props.canNext} aria-label="পরের লেভেল">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <p className="pc-lesson"><b>{finale ? "শেষ লেভেল" : "নতুন"}</b> {row.line.replace(/^শেষ লেভেল: /, "")}</p>

      <div className="pc-modes" role="radiogroup" aria-label="কয়টা ধাক্কা সইবে">
        {MODES.map((mode, index) => (
          <button key={mode.name} type="button" role="radio" aria-checked={props.mode === index} onClick={() => props.onMode(index)}>{mode.name}</button>
        ))}
      </div>
      <p className="pc-mode-line">{MODES[props.mode].line}</p>

      <p className="pc-targets">★ পৌঁছালে · ★ {bn(targets.goal)}টা চিঠিতে <span>({bn(targets.houses)}টার মধ্যে)</span> · ★ সব চিঠিতে</p>

      <p className="pc-start-foot">
        <button type="button" className="kit-link" onClick={props.onList}>সব লেভেল</button>
        <span>বাঁয়ে-ডানে চাপো · ← → বা A D</span>
      </p>
    </section>
  );
}

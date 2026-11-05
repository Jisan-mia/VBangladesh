"use client";
// The title, over the waiting frame: the biggest thing is a rolled শীতলপাটি, which starts the পাটি. Under it, small: which
// পাটি and its one new thing, the গোটানো chips with what each means, the star targets, সব পাটি, and how to play.
import { useEffect, useRef, type RefObject } from "react";
import { cardSizes } from "../../../shared/card-canvas";
import { possessive } from "../../../shared/bangla";
import { drawStartArt } from "../lib/art";
import { isFinale, levelOf, MODES, WORLDS } from "../lib/levels";
import { bn, type Shared } from "../lib/link";

/** A canvas that redraws whenever its box changes size. */
function ArtCanvas({ draw, className }: { draw: (canvas: HTMLCanvasElement, width: number, height: number) => void; className: string }) {
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

export type StartProps = {
  level: number; stars: number; mode: number;
  canPrev: boolean; canNext: boolean;
  friend: Shared | null; friendHere: boolean; friendCanvas: RefObject<HTMLCanvasElement | null>;
  best: number | null;
  onStart: () => void; onPrev: () => void; onNext: () => void; onMode: (mode: number) => void; onList: () => void; onHome: () => void;
};

export function StartCard(props: StartProps) {
  const { level, friend, friendHere } = props;
  const row = levelOf(level), finale = isFinale(level), world = WORLDS[row.world];
  return (
    <section className="pb-start" aria-labelledby="pb-start-title" data-finale={finale || undefined}>
      {friend && friendHere && (
        <div className="pb-friend">
          <canvas ref={props.friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.name || "বন্ধুর"} কার্ড: ${bn(friend.rows)} সারি, ${bn(friend.score)} পয়েন্ট`} />
          <p><b>{friend.name || "তোমার বন্ধু"} {bn(friend.score)} পয়েন্ট করেছে।</b> একই ফালি একই ক্রমে, এবার তোমার পালা। স্কোরটা {friend.name ? possessive(friend.name) : "বন্ধুর"} নিজের ফোনের।</p>
        </div>
      )}

      <button type="button" className="pb-go" onClick={props.onStart} data-first>
        <ArtCanvas draw={(canvas, width, height) => drawStartArt(canvas, width, height, world.motif)} className="pb-go-art" />
        <span>বোনা শুরু</span>
      </button>

      <div className="pb-pick">
        <button type="button" className="pb-step" onClick={props.onPrev} disabled={!props.canPrev} aria-label="আগের পাটি">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <div className="pb-pick-name">
          {finale && <p className="pb-finale-badge">{world.name}-এর শেষ পাটি</p>}
          <h2 id="pb-start-title">{level ? `পাটি ${bn(level)} · ${row.name}` : row.name}</h2>
          {props.stars > 0 && <p className="pb-got" aria-label={`তোমার ${bn(props.stars)} তারা`}>{"★".repeat(props.stars)}<span>{"★".repeat(3 - props.stars)}</span></p>}
        </div>
        <button type="button" className="pb-step" onClick={props.onNext} disabled={!props.canNext} aria-label="পরের পাটি">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <p className="pb-lesson"><b>{finale ? "শেষ পাটি" : level ? "নতুন" : "যত পারো"}</b> {row.line.replace(/^শেষ পাটি: /, "")}</p>

      {level > 0 ? (
        <>
          <div className="pb-modes" role="radiogroup" aria-label="কতবার গোটানো যাবে">
            {MODES.map((mode, index) => (
              <button key={mode.name} type="button" role="radio" aria-checked={props.mode === index} onClick={() => props.onMode(index)}>{mode.name}</button>
            ))}
          </div>
          <p className="pb-mode-line">{MODES[props.mode].line}</p>
          <p className="pb-targets">{row.three <= row.goal * 10 ? `${bn(row.goal)} সারি বুনলেই ★★★` : `${bn(row.goal)} সারিতে ★ · ${bn(row.two)} পয়েন্টে ★★ · ${bn(row.three)}-এ ★★★`}</p>
        </>
      ) : (
        <p className="pb-targets">{props.best ? `এই ফোনে সেরা ${bn(props.best)} পয়েন্ট। ` : ""}গোটানো নেই, ফ্রেম ভরলেই শেষ।</p>
      )}

      <p className="pb-start-foot">
        <button type="button" className="kit-link" onClick={props.onList}>সব পাটি</button>
        {friend && !friendHere && <button type="button" className="kit-link" onClick={props.onHome}>বন্ধুর পাটিতে ফেরো</button>}
        <span>◀ ▶ সরাও · ঘোরাও · নামাও</span>
      </p>
    </section>
  );
}

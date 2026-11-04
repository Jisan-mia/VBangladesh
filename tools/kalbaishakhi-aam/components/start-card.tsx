"use client";
// The title, over the gathering storm: the biggest thing is the ডালা heaped with mangoes, which starts the storm.
// Under it, small: which storm and its one new thing, the জান chips with what each means, the star targets, সব ঝড়.
import { useEffect, useRef, type RefObject } from "react";
import { cardSizes } from "../../../shared/card-canvas";
import { possessive } from "../../../shared/bangla";
import { drawStartArt } from "../lib/art";
import { isFinale, levelOf, MODES, WORLDS } from "../lib/levels";
import { bn, stormLabel, type Shared } from "../lib/link";
import type { StormRef } from "../lib/gen";

/** A canvas that redraws whenever its box changes size. */
export function ArtCanvas({ draw, className, label }: { draw: (canvas: HTMLCanvasElement, width: number, height: number) => void; className: string; label?: string }) {
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
  return <canvas ref={ref} className={className} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} />;
}

export type StartProps = {
  storm: StormRef;
  targets: { pass: number; two: number; three: number; mangoes: number };
  stars: number;
  canPrev: boolean; canNext: boolean;
  mode: number;
  friend: Shared | null; friendHere: boolean; friendCanvas: RefObject<HTMLCanvasElement | null>;
  onStart: () => void; onPrev: () => void; onNext: () => void; onMode: (mode: number) => void; onList: () => void; onHome: () => void;
};

export function StartCard(props: StartProps) {
  const { storm, targets, friend, friendHere } = props;
  const level = "level" in storm ? storm.level : 0;
  const row = level ? levelOf(level) : null, finale = level ? isFinale(level) : false;
  return (
    <section className="ka-start" aria-labelledby="ka-start-title" data-finale={finale || undefined}>
      {friend && friendHere && (
        <div className="ka-friend">
          <canvas ref={props.friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.name || "বন্ধুর"} কার্ড: ${bn(friend.count)}টা আম, ${bn(friend.score)} পয়েন্ট`} />
          <p><b>{friend.name || "তোমার বন্ধু"} {bn(friend.score)} পয়েন্ট করেছে।</b> একই ঝড়, এবার তোমার পালা। স্কোরটা {friend.name ? possessive(friend.name) : "বন্ধুর"} নিজের ফোনের।</p>
        </div>
      )}

      <button type="button" className="ka-go" onClick={props.onStart} data-first>
        <ArtCanvas draw={drawStartArt} className="ka-go-art" />
        <span>ঝড় শুরু</span>
      </button>

      <div className="ka-pick">
        <button type="button" className="ka-step" onClick={props.onPrev} disabled={!props.canPrev} aria-label="আগের ঝড়">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <div className="ka-pick-name">
          {finale && <p className="ka-finale-badge">{WORLDS[row!.world].name}-এর শেষ ঝড়</p>}
          <h2 id="ka-start-title">{stormLabel(storm)}</h2>
          {props.stars > 0 && <p className="ka-got" aria-label={`তোমার ${bn(props.stars)} তারা`}>{"★".repeat(props.stars)}<span>{"★".repeat(3 - props.stars)}</span></p>}
        </div>
        <button type="button" className="ka-step" onClick={props.onNext} disabled={!props.canNext} aria-label="পরের ঝড়">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <p className="ka-lesson">
        {row ? <><b>{finale ? "শেষ ঝড়" : "নতুন"}</b> {row.line.replace(/^শেষ ঝড়: /, "")}</> : <><b>বন্ধুর ঝড়</b> আগের সংস্করণের ঝড়, ৪৫ সেকেন্ড। টিকে থাকলেই এক তারা।</>}
      </p>

      <div className="ka-modes" role="radiogroup" aria-label="কয়টা জান">
        {MODES.map((mode, index) => (
          <button key={mode.name} type="button" role="radio" aria-checked={props.mode === index} onClick={() => props.onMode(index)}>{mode.name}</button>
        ))}
      </div>
      <p className="ka-mode-line">{MODES[props.mode].line}</p>

      <p className="ka-targets">
        {targets.pass > 0 && <>{bn(targets.pass)}টা আমে ★ · </>}{bn(targets.two)}টায় ★★ · {bn(targets.three)}টায় ★★★ <span>({bn(targets.mangoes)}টা পড়বে)</span>
      </p>

      <p className="ka-start-foot">
        {level > 0 ? <button type="button" className="kit-link" onClick={props.onList}>সব ঝড়</button> : <button type="button" className="kit-link" onClick={props.onHome}>তোমার ঝড়ে ফেরো</button>}
        <span>টেনে সরাও, বা বাঁয়ে-ডানে চাপো · ← →</span>
      </p>
    </section>
  );
}

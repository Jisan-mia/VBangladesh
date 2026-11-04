"use client";
// The title, over the floor's first ledges: the biggest thing is a glass marble on a step with গড়াও, which starts the floor.
// Under it, small: which floor and its one new thing, the সুযোগ chips with what each means, the open marbles, সব তলা.
import { useEffect, useRef } from "react";
import { possessive } from "../../../shared/bangla";
import { totalStars, type LevelStars } from "../../../shared/game-core";
import { isFinale, levelOf, LEVEL_COUNT, MARBLES, MODES, WORLDS } from "../lib/levels";
import { bn, floorLabel, friendBanner, seconds, stageName, type Shared } from "../lib/link";
import { paintTitle, type Look } from "../lib/art";

/** A canvas that repaints whenever its box changes size. */
function ArtCanvas({ paint, className }: { paint: (c: CanvasRenderingContext2D, width: number, height: number) => void; className: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const paintRef = useRef(paint);
  paintRef.current = paint;
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const draw = () => {
      const width = element.clientWidth, height = element.clientHeight;
      if (!width || !height) return;
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      element.width = Math.round(width * ratio); element.height = Math.round(height * ratio);
      const c = element.getContext("2d");
      if (!c) return;
      c.setTransform(ratio, 0, 0, ratio, 0, 0);
      paintRef.current(c, width, height);
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <canvas ref={ref} className={className} aria-hidden="true" />;
}

export type StartProps = {
  level: number; oldStage: number; look: Look; stars: LevelStars; best: number;
  canPrev: boolean; canNext: boolean; mode: number; colour: number; open: boolean[];
  friend: Shared | null; friendHere: boolean;
  onStart: () => void; onPrev: () => void; onNext: () => void; onMode: (mode: number) => void; onColour: (colour: number) => void;
  onList: () => void; onHome: () => void;
};

export function StartCard(props: StartProps) {
  const { level, friend, friendHere } = props;
  const row = level ? levelOf(level) : null, finale = level ? isFinale(level) : false, earned = level ? props.stars[level] ?? 0 : 0;
  const tap = (run: () => void) => (event: { currentTarget: HTMLElement }) => { event.currentTarget.blur(); run(); };
  return (
    <section className="ms-start" aria-labelledby="ms-start-title" data-finale={finale || undefined}>
      {friend && friendHere && (
        <p className="ms-friend"><b>{friendBanner(friend)}</b> <span>স্কোরটা {friend.name ? possessive(friend.name) : "বন্ধুর"} নিজের ফোনের।</span></p>
      )}

      <button type="button" className="ms-go" onClick={tap(props.onStart)} data-first aria-label={`গড়াও: ${level ? floorLabel(level) : "বন্ধুর সিঁড়ি"}`}>
        <ArtCanvas paint={(c, width, height) => paintTitle(c, width, height, props.colour, props.look)} className="ms-go-art" />
        <span>গড়াও</span>
      </button>

      <div className="ms-pick">
        <button type="button" className="ms-step" onClick={tap(props.onPrev)} disabled={!props.canPrev} aria-label="আগের তলা">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <div className="ms-pick-name">
          {finale && <p className="ms-finale-badge">{WORLDS[row!.world].name}-এর শেষ তলা</p>}
          <h2 id="ms-start-title">{level ? floorLabel(level) : "বন্ধুর পুরোনো সিঁড়ি"}</h2>
          {earned > 0 && <p className="ms-got" aria-label={`তোমার ${bn(earned)} তারা`}>{"★".repeat(earned)}<span>{"★".repeat(3 - earned)}</span>{props.best > 0 && <small> · সেরা {seconds(props.best)} সে</small>}</p>}
        </div>
        <button type="button" className="ms-step" onClick={tap(props.onNext)} disabled={!props.canNext} aria-label="পরের তলা">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <p className="ms-lesson">
        {row ? <><b>{finale ? "শেষ তলা" : "নতুন"}</b> {row.line.replace(/^শেষ তলা: /, "")} <small>{bn(row.steps)} ধাপ</small></>
          : <><b>বন্ধুর সিঁড়ি</b> আগের সংস্করণের সিঁড়ি, শুরু {stageName(props.oldStage - 1)} থেকে। যতক্ষণ পারো নামো।</>}
      </p>

      <div className="ms-modes" role="radiogroup" aria-label="কয়টা সুযোগ">
        {MODES.map((mode, index) => (
          <button key={mode.name} type="button" role="radio" aria-checked={props.mode === index} onClick={tap(() => props.onMode(index))}>{mode.name}</button>
        ))}
      </div>
      <p className="ms-mode-line">{MODES[props.mode].line}</p>

      <ul className="ms-colours" aria-label="কোন মার্বেল গড়াবে">
        {MARBLES.map((marble, index) => props.open[index] && (
          <li key={marble.name}>
            <button type="button" aria-pressed={props.colour === index} onClick={tap(() => props.onColour(index))} aria-label={marble.name} title={marble.name}>
              <span className="ms-swatch" style={{ backgroundColor: marble.glass, color: marble.eye }} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      <p className="ms-start-foot">
        {level > 0
          ? <button type="button" className="kit-link" onClick={tap(props.onList)}>সব তলা <span>★ {bn(totalStars(props.stars))}/{bn(LEVEL_COUNT * 3)}</span></button>
          : <button type="button" className="kit-link" onClick={tap(props.onHome)}>তোমার তলায় ফেরো</button>}
        <span>পাশ চেপে ধরো · ← →</span>
      </p>
    </section>
  );
}

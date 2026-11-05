// The end screen: the stars, a swatch for each picture (the face in its colour), counts that tick up, one thing to do away from
// the screen, and two big picture buttons of equal size. Nothing starts on its own.
import { useEffect, useRef } from "react";
import { StarReveal } from "../../../shared/game-ui";
import { ShowParentButton } from "../../../shared/kids-kit";
import { FEELINGS, type Feeling } from "../lib/faces";
import { bn } from "../lib/lines";
import { AgainIcon, DoneIcon, Face } from "./art";
import { COUNT_FRAMES, COUNT_MS, paintCount, type CountUp } from "./count.hot";

const still = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches || localStorage.getItem("ektukhani-slow") === "1"; } catch { return false; } };

export type Result = { level: number; stars: number; found: Feeling[]; colors: number; title: string; away: string; finale: string | null };

export function EndScreen({ result, onAgain, onDone, onShow }: { result: Result; onAgain: () => void; onDone: () => void; onShow: () => void }) {
  const pictures = useRef<HTMLElement>(null), colors = useRef<HTMLElement>(null);
  useEffect(() => {
    const values = [result.found.length, result.colors];
    const count: CountUp = {
      nodes: [pictures.current, colors.current],
      frames: values.map(value => Array.from({ length: COUNT_FRAMES }, (_, frame) => bn(Math.round(value * frame / (COUNT_FRAMES - 1))))),
      last: new Int16Array(2).fill(-1),
    };
    if (still()) { paintCount(count, 1); return; }
    let raf = 0;
    const began = performance.now();
    const tick = (now: number) => {
      const t = (now - began) / COUNT_MS;
      paintCount(count, t);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [result]);

  const blurAfter = (run: () => void) => (event: { currentTarget: HTMLElement }) => { event.currentTarget.blur(); run(); };
  return <div className="mr-end" role="status">
    <StarReveal count={result.stars} />
    <h2>{result.finale ? <><small>{result.finale}</small>{result.title}</> : result.title}</h2>
    <ul className="mr-swatches" data-count={result.found.length}>
      {result.found.map((feeling, index) => <li key={index} style={{ animationDelay: `${index * 90}ms`, "--feel": FEELINGS[feeling].color } as React.CSSProperties}>
        <span className="mr-swatch" style={{ background: FEELINGS[feeling].light }}><Face feeling={feeling} fill={FEELINGS[feeling].light} /></span>
        <small>{FEELINGS[feeling].word}</small>
      </li>)}
    </ul>
    <p className="mr-counts">
      <span><b ref={pictures}>{bn(0)}</b>টা ছবি</span>
      <span><b ref={colors}>{bn(0)}</b>টা রং</span>
    </p>
    <p className="mr-away">{result.away}</p>
    <div className="mr-end-actions">
      <button type="button" className="mr-big" onClick={blurAfter(onAgain)}><AgainIcon /><span>আবার খেলো</span></button>
      <button type="button" className="mr-big mr-big-done" onClick={blurAfter(onDone)}><DoneIcon /><span>শেষ</span></button>
    </div>
    <ShowParentButton onClick={onShow} />
  </div>;
}

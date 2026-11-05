// The end screen: the stars, a tile for each experiment (what happened, with a tick where your guess matched), counts that tick
// up, one thing to do away from the screen, and two big picture buttons of equal size. Nothing starts on its own.
import { useEffect, useRef } from "react";
import { StarReveal } from "../../../shared/game-ui";
import { ShowParentButton } from "../../../shared/kids-kit";
import type { Pic } from "../lib/art";
import { bn } from "../lib/lines";
import { AgainIcon, CheckBadge, DoneIcon, Pics } from "./art";
import { COUNT_FRAMES, COUNT_MS, paintCount, type CountUp } from "./count.hot";

const still = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches || localStorage.getItem("ektukhani-slow") === "1"; } catch { return false; } };

export type Result = { level: number; stars: number; right: number; total: number; title: string; away: string; finale: string | null; rows: { pics: readonly Pic[]; matched: boolean }[] };

export function EndScreen({ result, onAgain, onDone, onShow }: { result: Result; onAgain: () => void; onDone: () => void; onShow: () => void }) {
  const seen = useRef<HTMLElement>(null), hit = useRef<HTMLElement>(null);
  useEffect(() => {
    const values = [result.total, result.right];
    const count: CountUp = {
      nodes: [seen.current, hit.current],
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
  return <div className="ki-end" role="status">
    <StarReveal count={result.stars} />
    <h2>{result.finale ? <><small>{result.finale}</small>{result.title}</> : result.title}</h2>
    <ul className="ki-tiles">
      {result.rows.map((row, index) => <li key={index} style={{ animationDelay: `${index * 70}ms` }}>
        <Pics pics={row.pics} height={44} />{row.matched && <CheckBadge />}
      </li>)}
    </ul>
    <p className="ki-counts">
      <span><b ref={seen}>{bn(0)}</b>টা পরীক্ষা</span>
      <span><b ref={hit}>{bn(0)}</b>টা মিলল</span>
    </p>
    <p className="ki-away">{result.away}</p>
    <div className="ki-end-actions">
      <button type="button" className="ki-big" onClick={blurAfter(onAgain)}><AgainIcon /><span>আবার খেলো</span></button>
      <button type="button" className="ki-big ki-big-done" onClick={blurAfter(onDone)}><DoneIcon /><span>শেষ</span></button>
    </div>
    <ShowParentButton onClick={onShow} />
  </div>;
}

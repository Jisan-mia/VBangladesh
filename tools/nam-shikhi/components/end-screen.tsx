// The end screen: the full page (every sticker with both names), the stars, counts that tick up, one thing to do away from
// the screen, and two big picture buttons of equal size. Nothing starts on its own.
import { useEffect, useRef } from "react";
import { StarReveal } from "../../../shared/game-ui";
import { ShowParentButton, bn } from "../../../shared/kids-kit";
import type { Cell } from "../lib/draw-card";
import { AgainIcon, CellPic, DoneIcon } from "./pictures";
import { COUNT_FRAMES, COUNT_MS, paintCount, type CountUp } from "./count.hot";

const still = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches || localStorage.getItem("ektukhani-slow") === "1"; } catch { return false; } };

export type Result = { level: number; stars: number; first: number; cells: Cell[]; title: string; away: string; finale: string | null };

export function EndScreen({ result, onAgain, onDone, onShow }: { result: Result; onAgain: () => void; onDone: () => void; onShow: () => void }) {
  const placed = useRef<HTMLElement>(null), first = useRef<HTMLElement>(null);
  useEffect(() => {
    const values = [result.cells.length, result.first];
    const count: CountUp = {
      nodes: [placed.current, first.current],
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
  return <div className="ns-end" role="status">
    <StarReveal count={result.stars} />
    <h2>{result.finale ? <><small>{result.finale}</small>{result.title}</> : result.title}</h2>
    <ul className="ns-page" data-count={result.cells.length}>
      {result.cells.map((cell, index) => <li key={`${cell.top}${index}`} style={{ animationDelay: `${index * 70}ms` }}>
        <CellPic art={cell.art} spot={cell.spot} />
        <b>{cell.top}</b><small lang={/[A-Za-z]/.test(cell.bottom) ? "en" : undefined}>{cell.bottom}</small>
      </li>)}
    </ul>
    <p className="ns-counts">
      <span><b ref={placed}>{bn(0)}</b>টা নাম খাতায়</span>
      <span><b ref={first}>{bn(0)}</b>টা প্রথমবারেই</span>
    </p>
    <p className="ns-away">{result.away}</p>
    <div className="ns-end-actions">
      <button type="button" className="ns-big" onClick={blurAfter(onAgain)}><AgainIcon /><span>আবার খেলো</span></button>
      <button type="button" className="ns-big ns-big-done" onClick={blurAfter(onDone)}><DoneIcon /><span>শেষ</span></button>
    </div>
    <ShowParentButton onClick={onShow} />
  </div>;
}

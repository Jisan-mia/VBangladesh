// The end of a ছড়া: the picture it built, stars popping in, counts that tick up, the finale's name, and two picture buttons
// at least 96 px wide. The buttons wait out a short guard (dimmed until live), so the tap that was still drumming when the
// ছড়া ended never lands on আবার খেলো. Nothing starts on its own.
import { useEffect, useRef } from "react";
import { StarReveal } from "../../../shared/game-ui";
import { ShowParentButton, bn } from "../../../shared/kids-kit";
import { levelOf, rhymeForLevel } from "../lib/levels";
import { COUNT_FRAMES, COUNT_MS, paintCount, type CountUp } from "./count.hot";
import { AgainIcon, DoneIcon } from "./pictures";
import { Scene } from "./scene";

export type Result = { level: number; stars: number; hits: number; words: number; clapped: number; best: number; whole: boolean };

const still = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches || localStorage.getItem("ektukhani-slow") === "1"; } catch { return false; } };

export function EndScreen({ result, resting, onAgain, onDone, onShow }: { result: Result; resting: boolean; onAgain: () => void; onDone: () => void; onShow: () => void }) {
  const level = levelOf(result.level), rhyme = rhymeForLevel(result.level);
  const claps = useRef<HTMLElement>(null), words = useRef<HTMLElement>(null), best = useRef<HTMLElement>(null);
  useEffect(() => {
    const values = [result.clapped, result.hits, result.best];
    const count: CountUp = {
      nodes: [claps.current, words.current, best.current],
      frames: values.map(value => Array.from({ length: COUNT_FRAMES }, (_, frame) => bn(Math.round(value * frame / (COUNT_FRAMES - 1))))),
      last: new Int16Array(3).fill(-1),
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
  return <div className="ct-end" role="status">
    <div className="ct-end-pic"><Scene id={level.rhyme} full className="ct-end-svg" /></div>
    <p className="ct-end-name">{level.finale ? <><span className="ct-stamp">ফাইনাল</span>{level.finale}</> : rhyme.name}</p>
    <div className="ct-end-stars"><StarReveal count={result.stars} /></div>
    <p className="ct-end-count">
      <span>তালি <b ref={claps}>{bn(0)}</b></span>
      <span>তালে শব্দ <b ref={words}>{bn(0)}</b>/{bn(result.words)}</span>
      <span>টানা <b ref={best}>{bn(0)}</b></span>
    </p>
    <div className={`ct-end-actions${resting ? " one" : ""}`}>
      {!resting && <button type="button" className="ct-big ct-big-main" onClick={blurAfter(onAgain)} aria-label="আবার খেলো"><AgainIcon /><span>আবার</span></button>}
      <button type="button" className="ct-big ct-big-done" onClick={blurAfter(onDone)} aria-label="শেষ"><DoneIcon /><span>শেষ</span></button>
    </div>
    <ShowParentButton onClick={onShow} />
  </div>;
}

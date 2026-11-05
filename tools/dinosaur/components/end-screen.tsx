"use client";
// The end of a round: the dinosaurs found standing on the ground, the stars, the counts ticking up, what the child can do now, a task
// off the screen, then আবার খেলো and শেষ as two equal picture buttons, and আব্বু-আম্মুকে দেখাও. A finale adds the world's medal.
import { useEffect, useRef } from "react";
import { COUNT_FRAMES, COUNT_MS, paintCount, type CountUp } from "./count.hot";
import { Stars } from "../../../shared/game-ui";
import { bn, ShowParentButton } from "../../../shared/kids-kit";
import { dinoOf } from "../lib/dinos";
import { doneLine, type Result } from "../lib/round";
import { levelOf, WORLDS } from "../lib/worlds";
import { DinoArt } from "./pieces";

const countFrames = (to: number) => Array.from({ length: COUNT_FRAMES }, (_, frame) => bn(Math.round(to * frame / (COUNT_FRAMES - 1))));

export function EndScreen({ result, slow, onAgain, onDone, onShow }: { result: Result; slow: boolean; onAgain: () => void; onDone: () => void; onShow: () => void }) {
  const spec = levelOf(result.level), found = result.dinos.map(id => dinoOf(id)!).filter(Boolean);
  const bones = useRef<HTMLElement>(null), first = useRef<HTMLElement>(null);
  useEffect(() => {
    const count: CountUp = { nodes: [bones.current, first.current], frames: [countFrames(result.bones), countFrames(result.firstTry)], last: new Int16Array(2).fill(-1) };
    if (slow) { paintCount(count, 1); return; }
    paintCount(count, 0);
    let raf = 0;
    const started = performance.now() + 450;
    const frame = (now: number) => { paintCount(count, (now - started) / COUNT_MS); if (now - started < COUNT_MS) raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [result, slow]);
  const done = (action: () => void) => (event: { currentTarget: HTMLButtonElement }) => { event.currentTarget.blur(); action(); };
  return <div className="dn-end" data-finale={spec.finale || undefined} data-slow={slow || undefined}>
    {spec.finale && <p className="dn-end-medal"><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="26" r="16" /><path d="M16 4L24 18L32 4" /><path d="M24 17l3 6.4 7 .9-5.1 4.8 1.3 7-6.2-3.4-6.2 3.4 1.3-7-5.1-4.8 7-.9z" /></svg>{WORLDS[spec.world].name}</p>}
    <div className="dn-end-finds" data-n={found.length} role="img" aria-label={found.map(dino => dino.name).join(", ")}>
      {found.map((dino, index) => <span key={dino.id} style={{ animationDelay: `${index * 120}ms` }}><DinoArt dino={dino} /></span>)}
    </div>
    <p className="dn-end-line">{doneLine(result.level)}।</p>
    <div className="dn-end-stars"><Stars count={result.stars} /></div>
    <p className="dn-end-count"><span><b ref={bones}>{bn(result.bones)}</b>টা হাড়</span><span aria-hidden="true">·</span><span><b ref={first}>{bn(result.firstTry)}</b>টা প্রথমবারেই বসেছে</span></p>
    <p className="dn-end-news">{spec.news}</p>
    <p className="dn-end-off">{spec.off}</p>
    <div className="dn-end-actions">
      <button type="button" className="dn-big" onClick={done(onAgain)}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M38 24a14 14 0 1 1-4.1-9.9" /><path d="M35 6v9h-9" /></svg>
        <span>আবার খেলো</span>
      </button>
      <button type="button" className="dn-big dn-big-done" onClick={done(onDone)}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 24L24 8L42 24" /><path d="M11 21V40H20V30H28V40H37V21" /></svg>
        <span>শেষ</span>
      </button>
    </div>
    <ShowParentButton onClick={onShow} />
  </div>;
}

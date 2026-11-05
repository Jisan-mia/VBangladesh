// The end page: the other child's face with their feeling as a picture, one question to talk about, counts that tick up,
// and picture buttons at least 96 px wide. Past today's limit the page still shows (the question stays) but offers only
// শেষ, so no new story can start. Nothing starts on its own.
import { useEffect, useRef } from "react";
import { ShowParentButton, bn } from "../../../shared/kids-kit";
import { PEOPLE, STORIES, lastMood, whose, worldOf, type Side } from "../lib/stories";
import { Portrait } from "./art";
import { COUNT_FRAMES, COUNT_MS, paintCount, type CountUp } from "./count.hot";
import { AgainIcon, DoneIcon, ForkIcon, Lamp } from "./pictures";

const still = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches || localStorage.getItem("ektukhani-slow") === "1"; } catch { return false; } };

export type EndInfo = { id: string; side: Side; today: number; total: number; both: number; otherUnread: boolean; lit: boolean };

export function EndScreen({ info, resting, onOther, onAgain, onDone, onShow }: {
  info: EndInfo; resting: boolean; onOther: () => void; onAgain: () => void; onDone: () => void; onShow: () => void;
}) {
  const story = STORIES.find(item => item.id === info.id)!, other = PEOPLE[story.other], world = worldOf(story.id);
  const today = useRef<HTMLElement>(null), total = useRef<HTMLElement>(null), both = useRef<HTMLElement>(null);
  useEffect(() => {
    const values = [info.today, info.total, info.both];
    const count: CountUp = {
      nodes: [today.current, total.current, both.current],
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
  }, [info]);

  const blurAfter = (run: () => void) => (event: { currentTarget: HTMLElement }) => { event.currentTarget.blur(); run(); };
  return <div className="gm-end" role="status">
    <p className="gm-end-title">{story.title}</p>
    <Portrait who={story.other} mood={lastMood(story, info.side)} className="gm-portrait" />
    <p className="gm-talk-label">{whose(other.name)} মুখটা দেখো। একসাথে ভাবো:</p>
    <p className="gm-talk">{story.choices[info.side].talk}</p>
    {info.lit && <p className="gm-lit" style={{ color: world.deep }}><span className="gm-lamp"><Lamp lit /></span>{world.name} তাকের বাতি জ্বলল</p>}
    <p className="gm-counts">
      <span>আজ <b ref={today}>{bn(0)}</b>টা</span>
      <span>৯টার মধ্যে <b ref={total}>{bn(0)}</b>টা</span>
      <span>দুই মোড়ই <b ref={both}>{bn(0)}</b>টা</span>
    </p>
    <div className={`gm-actions${resting ? " one" : ""}`}>
      {!resting && <button type="button" className={`gm-big gm-big-main${info.otherUnread ? " glow" : ""}`} onClick={blurAfter(onOther)} aria-label={info.otherUnread ? "অন্যটা বেছে দেখো" : "অন্য মোড়টা আবার দেখো"}><ForkIcon /><span>অন্যটা</span></button>}
      {!resting && <button type="button" className="gm-big" onClick={blurAfter(onAgain)} aria-label="আবার পড়ো"><AgainIcon /><span>আবার</span></button>}
      <button type="button" className="gm-big gm-big-done" onClick={blurAfter(onDone)} aria-label="শেষ"><DoneIcon /><span>শেষ</span></button>
    </div>
    <ShowParentButton onClick={onShow} />
  </div>;
}

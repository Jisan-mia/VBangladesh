"use client";
// The timed routine at the real sink: a calm ring fills while the steps change, germs pop off, a soft beat keeps time.
// Works fully on mute. Pauses itself when the tab is hidden, and keeps the screen awake while it runs.

import { useEffect, useRef, useState } from "react";
import { soundOn, useGameLoop } from "../../../shared/game-kit";
import { bn, speak } from "../../../shared/kids-kit";
import { BRUSH_READY, POSES, SCENES, ZONE_GERMS, germ, mouth, toothSide } from "../lib/art";
import { BRUSH_ZONES, WASH_STEPS, stepAt, progressAt, type Zone } from "../lib/routines";
import { BRUSH_BEAT, WASH_BEAT, brushStroke, germBye, germPop, startChime, washBeat } from "../lib/sound";
import { Finger } from "./finger";

const RADIUS = 94, ROUND = 2 * Math.PI * RADIUS;
type State = "ready" | "run" | "pause" | "end";

function germsOf(wash: boolean, index: number, cls: string) {
  const spots = wash ? POSES[WASH_STEPS[index].id].germs : ZONE_GERMS[BRUSH_ZONES[index].row];
  return spots.map(([x, y], i) => germ(x, y, wash ? 0.72 : 0.52, index * 2 + i, cls)).join("");
}

export function Routine({ wash, ghost, onDone }: { wash: boolean; ghost: boolean; onDone: () => void }) {
  const steps = wash ? WASH_STEPS : BRUSH_ZONES;
  const [state, setState] = useState<State>("ready");
  const [index, setIndex] = useState(0);
  const elapsed = useRef(0), beat = useRef(-1), shown = useRef(0), ring = useRef<SVGCircleElement>(null), root = useRef<HTMLDivElement>(null);
  const lock = useRef<WakeLockSentinel | null>(null);
  const finished = useRef(false), done = useRef(onDone);
  done.current = onDone;

  const awake = () => { navigator.wakeLock?.request("screen").then(sentinel => { lock.current = sentinel; }, () => { /* not allowed: fine */ }); };
  const sleep = () => { void lock.current?.release().catch(() => {}); lock.current = null; };
  useEffect(() => sleep, []);
  useEffect(() => {
    if (state !== "run") return;
    // The phone drops the wake lock when the tab hides; take it back on return.
    const back = () => { if (!document.hidden) awake(); };
    document.addEventListener("visibilitychange", back);
    return () => document.removeEventListener("visibilitychange", back);
  }, [state]);

  const say = (text: string) => { if (soundOn()) speak(text); };

  useGameLoop(dt => {
    if (finished.current) return;
    elapsed.current += dt;
    const t = elapsed.current, now = Math.floor(t / (wash ? WASH_BEAT : BRUSH_BEAT));
    if (now !== beat.current) { beat.current = now; if (wash) washBeat(now); else brushStroke(now); }
    const at = stepAt(steps, t);
    if (at.done) {
      finished.current = true;
      setState("end"); setIndex(steps.length); sleep();
      if (wash) germPop(); else germBye();
      setTimeout(() => done.current(), 700);
      return;
    }
    if (at.index !== shown.current) {
      shown.current = at.index; setIndex(at.index);
      if (wash) germPop(); else germBye();
      say(steps[at.index].bn);
    }
  }, () => { if (ring.current) ring.current.style.strokeDashoffset = String(ROUND * (1 - progressAt(steps, elapsed.current))); }, state === "run");

  const start = () => {
    startChime(); awake(); setState("run"); say(steps[0].bn);
    // At the sink the picture should fill the screen: bring the stage to the top.
    requestAnimationFrame(() => root.current?.scrollIntoView({ block: "start" }));
  };
  const pause = () => { setState("pause"); sleep(); };
  const resume = () => { startChime(); awake(); setState("run"); };

  const current = Math.min(index, steps.length - 1);
  const zone = wash ? null : (steps[current] as Zone);
  const ready = state === "ready";
  let art: string;
  if (ready) art = wash ? SCENES.wet : BRUSH_READY;
  else {
    const live = state === "end" ? "" : germsOf(wash, current, "hd-live");
    const gone = index > 0 ? germsOf(wash, index - 1, wash ? "hd-pop" : "hd-bye") : "";
    art = (wash ? POSES[WASH_STEPS[current].id].art : mouth(zone)) + live + gone;
  }

  return <div ref={root} className={`hd-routine${state === "pause" ? " paused" : ""}${ready ? " is-ready" : ""}`}>
    <div className="hd-stage" role="progressbar" aria-label={wash ? "হাত ধোয়া" : "দাঁত মাজা"} aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={ready ? 0 : Math.min(index + 1, steps.length)} aria-valuetext={ready ? "শুরু হয়নি" : steps[current].bn}>
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <defs><clipPath id="hd-clip"><circle cx="100" cy="100" r="88" /></clipPath></defs>
        <circle cx="100" cy="100" r="88" className="hd-pool" />
        <circle cx="100" cy="100" r={RADIUS} className="hd-track" />
        <circle ref={ring} cx="100" cy="100" r={RADIUS} className="hd-ring" strokeDasharray={ROUND} strokeDashoffset={state === "end" ? 0 : ROUND} transform="rotate(-90 100 100)" />
        <g clipPath="url(#hd-clip)" dangerouslySetInnerHTML={{ __html: art }} />
      </svg>
    </div>

    {ready
      ? <div className="hd-under">
          <p className="hd-cue">{wash ? "হাত ভিজিয়ে সাবান নাও। তারপর চাপো।" : "ব্রাশে মটরদানার সমান পেস্ট নাও। তারপর চাপো।"}</p>
          <button type="button" className="kit-primary hd-go" onClick={start}>
            <span aria-hidden="true">▶</span> শুরু করো{ghost && <Finger />}
          </button>
        </div>
      : <div className="hd-under">
          <ol className="hd-dots" aria-hidden="true">{steps.map((step, i) => <li key={step.id} className={i < index ? "done" : i === index ? "now" : ""} />)}</ol>
          <p className="hd-step" aria-live="polite">
            {zone && <svg className="hd-side-icon" viewBox="0 0 64 64" aria-hidden="true" dangerouslySetInnerHTML={{ __html: toothSide(zone.face) }} />}
            <span>{state === "end" ? (wash ? "হয়ে গেছে" : "দুই মিনিট হলো") : steps[current].bn}</span>
          </p>
          {state !== "end" && <button type="button" className="kit-secondary hd-pause" onClick={state === "run" ? pause : resume}>
            {state === "run" ? "একটু থামাও" : "আবার চালাও"}
          </button>}
          {state === "pause" && <p className="hd-small">{bn(Math.round(elapsed.current))} সেকেন্ড হয়েছে। চাপলে ওখান থেকেই চলবে।</p>}
        </div>}
  </div>;
}

"use client";
// The timed routine at the real sink. A ring fills round the pool while the picture shows what the hands (or brush) do now,
// suds grow on top, two germs pop at every step, and a half-moon badge cheers at the middle. No buttons: ⏸ is the player's.
// Works fully on mute. The clock (lib/run.ts) moves only in the step, and the step never runs while paused, hidden or blurred.
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { fitCanvas, useGameLoop } from "../../../shared/game-kit";
import { bn } from "../../../shared/kids-kit";
import { POSES, SCENES, ZONE_GERMS, germ, mouth, toothSide } from "../lib/art";
import { burst, popAt, stepFoam } from "../lib/foam.hot";
import { createFoam } from "../lib/foam";
import { createRun, halfShowing, ringAt } from "../lib/run";
import { FINISHED, HALFWAY, STEP_CHANGED, advance } from "../lib/run.hot";
import { clockMayRun, type Session } from "../lib/session";
import { BRUSH_ZONES, GERMS_EACH, WASH_STEPS, type Zone } from "../lib/routines";
import * as sound from "../lib/sound";
import { drawFoam } from "./foam-draw.hot";
import { Icon } from "./icon";
import { useWakeLock } from "./wake";

const RADIUS = 94, ROUND = 2 * Math.PI * RADIUS;

function germsOf(wash: boolean, index: number, cls: string) {
  const spots = wash ? POSES[WASH_STEPS[index].id].germs : ZONE_GERMS[BRUSH_ZONES[index].row];
  return spots.map(([x, y], i) => germ(x, y, wash ? 0.72 : 0.52, index * 2 + i, cls)).join("");
}

export type RoutineProps = {
  wash: boolean;
  session: Session;
  seed: number;
  slow: boolean;
  paused: boolean;
  /** The ring closed at this step: record the round (stars, atBreak) and arm the end screen. */
  onFinish: () => void;
  /** A finger on the pool: true when it counts (not the tap that only wakes the game). */
  onPoke: () => boolean;
};

export function RoutineView({ wash, session, seed, slow, paused, onFinish, onPoke }: RoutineProps) {
  const steps = wash ? WASH_STEPS : BRUSH_ZONES;
  const run = useRef(createRun(steps)), foam = useRef(createFoam(seed));
  const [index, setIndex] = useState(0), [done, setDone] = useState(false), [halfOn, setHalfOn] = useState(false), [halfDone, setHalfDone] = useState(false);
  const ring = useRef<SVGCircleElement>(null), canvas = useRef<HTMLCanvasElement>(null), pool = useRef<HTMLDivElement>(null);
  const paint = useRef<{ ctx: CanvasRenderingContext2D; size: number } | null>(null);
  const beat = useRef(-1), pops = useRef(0), halfShown = useRef(false);
  const live = useRef({ onFinish, slow, wash, onPoke });
  live.current = { onFinish, slow, wash, onPoke };
  useWakeLock(!paused && !done);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read and fast-forward the clock; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    Object.assign(window, { __hatRun: run.current, __hatFoam: foam.current });
  }, []);

  // The suds canvas matches the pool's size (sharp at DPR 2) and is drawn once at a time.
  useEffect(() => {
    const node = canvas.current, box = pool.current;
    if (!node || !box) return;
    const fit = () => {
      const size = Math.round(box.clientWidth);
      if (size < 40) return;
      paint.current = { ctx: fitCanvas(node, size, size), size };
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  useGameLoop(dt => {
    const { slow: still, wash: washing } = live.current;
    const sim = run.current;
    const may = clockMayRun(session);
    let events = 0;
    if (may) {
      events = advance(sim, dt);
      const length = washing ? sound.WASH_BEAT : sound.BRUSH_BEAT, now = Math.floor(sim.t / length);
      if (now !== beat.current) { beat.current = now; if (washing) sound.washBeat(now); else sound.brushStroke(now); }
    }
    // Suds grow as the soap builds up; they keep rising after the ring closes, so the last flourish isn't frozen.
    const rate = may ? (still ? 1.5 : 3) + ringAt(sim) * (still ? 2 : 5) : 0;
    stepFoam(foam.current, dt, rate, still ? 0.35 : 1, ringAt(sim));
    if (events & STEP_CHANGED) {
      if (events & FINISHED) { burst(foam.current, 14, 1); sound.clean(); }
      else { burst(foam.current, 6, ringAt(sim)); if (washing) sound.germPop(); else sound.germBye(); }
      setIndex(sim.index);
    }
    if (events & HALFWAY) { sound.halfway(); burst(foam.current, 8, 1); setHalfDone(true); }
    if (may && sim.halfFired) { const showing = halfShowing(sim); if (showing !== halfShown.current) { halfShown.current = showing; setHalfOn(showing); } }
    if (events & FINISHED) { halfShown.current = false; setDone(true); setHalfOn(false); live.current.onFinish(); }
  }, () => {
    const sim = run.current, drawn = paint.current;
    if (ring.current) ring.current.style.strokeDashoffset = String(ROUND * (1 - ringAt(sim)));
    if (drawn) drawFoam(drawn.ctx, foam.current, drawn.size, wash ? "#8ccbd9" : "#8fd0c4");
  }, !paused);

  const poke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    if (!live.current.onPoke()) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width * 200, y = (event.clientY - box.top) / box.height * 200;
    if (popAt(foam.current, x, y)) sound.bubble(pops.current++);
    else burst(foam.current, 2, 0.5);
  };

  const current = Math.min(index, steps.length - 1);
  const zone = wash ? null : (steps[current] as Zone);
  const art = (done ? (wash ? SCENES.clean : mouth(null)) : (wash ? POSES[WASH_STEPS[current].id].art : mouth(zone)))
    + (done ? "" : germsOf(wash, current, "hd-live")) + (!done && index > 0 ? germsOf(wash, index - 1, wash ? "hd-pop" : "hd-bye") : "");
  const gone = done ? steps.length * GERMS_EACH : index * GERMS_EACH;

  return <div className={`hd-routine${paused ? " paused" : ""}`} data-done={done || undefined}>
    <div className="hd-hud">
      <ol className="hd-pips" aria-hidden="true">{steps.map((step, i) => <li key={step.id} className={done || i < index ? "done" : i === index ? "now" : ""} />)}</ol>
      <p className="hd-germ-count" aria-label={`${bn(gone)}টা জীবাণু পালিয়েছে`}><Icon id="germ" className="hd-germ-icon" /><b key={gone} className="hd-bump">{bn(gone)}</b></p>
    </div>

    <div className="hd-pool" ref={pool} role="progressbar" aria-label={wash ? "হাত ধোয়া" : "দাঁত মাজা"} aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={done ? steps.length : index + 1} aria-valuetext={done ? "হয়ে গেছে" : steps[current].bn}>
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <defs><clipPath id="hd-clip"><circle cx="100" cy="100" r="88" /></clipPath></defs>
        <circle cx="100" cy="100" r="88" className="hd-water" />
        <circle cx="100" cy="100" r={RADIUS} className="hd-track" />
        <circle ref={ring} cx="100" cy="100" r={RADIUS} className="hd-ring" strokeDasharray={ROUND} strokeDashoffset={ROUND} transform="rotate(-90 100 100)" />
        <circle cx="100" cy="194" r="6.5" className={`hd-mid${halfDone ? " on" : ""}`} />
        <g clipPath="url(#hd-clip)"><g key={done ? "done" : index} className="hd-art" dangerouslySetInnerHTML={{ __html: art }} /></g>
      </svg>
      <canvas ref={canvas} className="hd-foam" aria-hidden="true" onPointerDown={poke} />
      {halfOn && <div className="hd-half" aria-hidden="true"><Icon id="half" className="hd-half-icon" /></div>}
    </div>

    <p className="hd-step" aria-live="polite">
      {zone && <svg className="hd-side-icon" viewBox="0 0 64 64" aria-hidden="true" dangerouslySetInnerHTML={{ __html: toothSide(zone.face) }} />}
      <span key={done ? "done" : index} className="hd-step-text">{done ? (wash ? "হয়ে গেছে" : "দুই মিনিট হলো") : steps[current].bn}</span>
    </p>
  </div>;
}

"use client";
// The pit on screen, bottom to top: the soil (darkened where you have brushed), the bones and not-bones, deep sand's wet layer, the
// sand itself (this canvas hears the finger), the rocks, the flying dust. Drawn once, then only erased, so it stays fast on cheap phones.
// The finger: nothing brushes without a press. A press lost in another window, a hover, a cancel or a new tab ends the stroke.
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { boneShapes, type BoneKind } from "../lib/art";
import { BRUSH_R, KEY_R, makePit, PIT, TAP_R, type Pit, type PitSpec } from "../lib/pit";
import { sweep } from "../lib/pit.hot";
import { createHand, drag, lift, press, release, strokeOf } from "../lib/stroke";
import { sound } from "../lib/sound";
import { decoyShapes, rockShapes, sparkleShape } from "../lib/things";
import type { WorldId } from "../lib/worlds";
import { paintStamp, puff, stepDust } from "./sand.hot";
import { LOOKS, makeDust, paintPit, SCALE } from "./sand-paint";
import { GhostFinger, Shapes } from "./pieces";

export type SandApi = { key: () => void; release: () => void };
export type Touch = "ignored" | "woke" | "counts";

type Props = {
  kinds: readonly BoneKind[]; spec: PitSpec; world: WorldId; marks: boolean; seed: number;
  /** The kinds already found (in this pit), so they show lifted. */
  found: readonly BoneKind[];
  slow: boolean;
  /** Asked at every press and key: only "counts" brushes. "woke" is the first tap back after being away. */
  gate: () => Touch;
  /** After each stamp that changed something (the pit is already updated: read pit.fresh*, pit.hitRock). */
  onStamp: (pit: Pit) => void;
  /** Which bone to point at with a sparkle (a hint after a quiet while), or -1. */
  hint: number;
  api: MutableRefObject<SandApi | null>;
  /** A pit that isn't shown or is paused still keeps its sand, but ignores the finger. */
  live: boolean;
  /** A ghost finger showing the first move: one swipe, or two with a lift between (deep sand). */
  demo: null | "one" | "two";
};

export function SandLayer({ kinds, spec, world, marks, seed, found, slow, gate, onStamp, hint, api, live, demo }: Props) {
  const pit = useMemo(() => makePit(kinds, spec, seed), [kinds, spec, seed]);
  const top = useRef<HTMLCanvasElement>(null), mid = useRef<HTMLCanvasElement>(null), halo = useRef<HTMLCanvasElement>(null), dustCanvas = useRef<HTMLCanvasElement>(null);
  const ctx = useRef<{ top: CanvasRenderingContext2D; mid: CanvasRenderingContext2D | null; halo: CanvasRenderingContext2D; dust: CanvasRenderingContext2D } | null>(null);
  const hand = useRef(createHand());
  const dust = useRef(makeDust());
  const raf = useRef(0);
  const lastHiss = useRef(0), lastKnock = useRef(0);
  const rockNodes = useRef<(SVGGElement | null)[]>([]);
  const [decoysShown, setDecoysShown] = useState<number[]>([]);
  const latest = useRef({ gate, onStamp, slow, live });
  latest.current = { gate, onStamp, slow, live };
  const look = LOOKS[world];

  // Paint the pit once: sand, wet layer, soil, and a mound and crack over each bone when the level shows them.
  useEffect(() => {
    const t = top.current?.getContext("2d"), h = halo.current?.getContext("2d"), d = dustCanvas.current?.getContext("2d"), m = mid.current?.getContext("2d") ?? null;
    if (!t || !h || !d) return;
    ctx.current = { top: t, mid: m, halo: h, dust: d };
    paintPit(pit, world, marks, seed, t, spec.depth === 2 ? m : null, h);
    hand.current = createHand();
    setDecoysShown([]);
    if (process.env.NODE_ENV !== "production") Object.assign(window, { __dinoPit: pit }); // dev only: lets an in-page autopilot read the pit
    return () => { cancelAnimationFrame(raf.current); raf.current = 0; ctx.current = null; };
  }, [pit, world, marks, seed, spec.depth]);

  const runDust = () => {
    if (raf.current) return;
    const frame = () => {
      const c = ctx.current;
      if (!c) { raf.current = 0; return; }
      raf.current = stepDust(dust.current, c.dust, look.dust) > 0 ? requestAnimationFrame(frame) : 0;
    };
    raf.current = requestAnimationFrame(frame);
  };

  // A stamp has changed the pit: paint it, spray a few grains, knock a rock, then tell the game what showed.
  const after = useMemo(() => (p: Pit) => {
    const c = ctx.current;
    if (!c) return;
    if (p.nChanged > 0) paintStamp(p, c.top, c.mid, c.halo);
    if (p.hitRock) {
      const now = performance.now();
      let best = -1, near = Infinity;
      p.rocks.forEach((rock, i) => { const d = Math.hypot(rock.x - p.sx, rock.y - p.sy); if (d < near) { near = d; best = i; } });
      if (now - lastKnock.current > 220 && best >= 0) {
        lastKnock.current = now;
        sound.rock();
        if (!latest.current.slow) rockNodes.current[best]?.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(-5deg)" }, { transform: "rotate(4deg)" }, { transform: "rotate(0deg)" }], { duration: 260, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
      }
    }
    latest.current.onStamp(p);
    if (p.nFreshDecoy > 0) setDecoysShown(list => [...list, ...Array.from(p.freshDecoy.subarray(0, p.nFreshDecoy))]);
  }, []);

  const at = (event: { clientX: number; clientY: number }) => {
    const box = top.current!.getBoundingClientRect();
    return { x: (event.clientX - box.left) / box.width * PIT.width, y: (event.clientY - box.top) / box.height * PIT.height };
  };
  const brushed = (x0: number, y0: number, x1: number, y1: number, r: number) => {
    const changed = sweep(pit, x0, y0, x1, y1, r, strokeOf(hand.current), after);
    if (changed > 0 && !latest.current.slow) {
      puff(dust.current, x1, y1, x1 - x0, y1 - y0, 2);
      runDust();
    }
    const now = performance.now();
    if (changed > 0 && now - lastHiss.current > 110) { lastHiss.current = now; sound.brush(pit.depth === 2 ? 2 : 1, Math.min(1, Math.hypot(x1 - x0, y1 - y0) / 40)); }
  };

  // Nothing is held while away: blur, a hidden tab and the pause menu all end a stroke (a stuck "finger" was bug 1).
  useEffect(() => {
    const drop = () => release(hand.current);
    const hidden = () => { if (document.hidden) drop(); };
    window.addEventListener("blur", drop);
    document.addEventListener("visibilitychange", hidden);
    return () => { window.removeEventListener("blur", drop); document.removeEventListener("visibilitychange", hidden); };
  }, []);
  useEffect(() => { if (!live) release(hand.current); }, [live]);

  useEffect(() => {
    api.current = {
      key: () => {
        if (latest.current.gate() !== "counts") return;
        const next = pit.bones.find((_, i) => !pit.foundBone[i]);
        if (!next) return;
        hand.current.n += 1; // a key press is its own stroke
        brushed(next.x, next.y, next.x, next.y, KEY_R);
      },
      release: () => release(hand.current),
    };
    return () => { api.current = null; };
  });

  return <div className="dn-pit" data-world={world} data-depth={spec.depth}>
    <canvas ref={halo} className="dn-halo" width={PIT.width} height={PIT.height} aria-hidden="true" />
    <svg className="dn-under" viewBox={`0 0 ${PIT.width} ${PIT.height}`} aria-hidden="true" focusable="false">
      {pit.bones.map((bone, i) => <g key={bone.kind} className={found.includes(bone.kind) ? "dn-found" : ""} transform={`translate(${bone.x} ${bone.y}) rotate(${bone.rot})`}>
        {found.includes(bone.kind) && <circle className="dn-found-ring" r="34" />}
        <g className="dn-lift" style={{ animationDelay: `${i * 0}ms` }}><g transform="scale(1.15)"><Shapes shapes={boneShapes(bone.kind)} /></g></g>
      </g>)}
      {pit.decoys.map((decoy, i) => <g key={i} transform={`translate(${decoy.x} ${decoy.y}) rotate(${decoy.rot}) scale(1.1)`}>
        <g className={decoysShown.includes(i) ? "dn-decoy dn-decoy-shown" : "dn-decoy"}><Shapes shapes={decoyShapes(decoy.kind)} /></g>
      </g>)}
    </svg>
    {spec.depth === 2 && <canvas ref={mid} className="dn-mid" width={PIT.width * SCALE} height={PIT.height * SCALE} aria-hidden="true" />}
    <canvas ref={top} className="dn-sand" width={PIT.width * SCALE} height={PIT.height * SCALE} tabIndex={live ? 0 : -1} role="button" aria-label="বালু সরাও"
      onPointerDown={event => {
        if (!latest.current.live) return;
        const where = at(event);
        if (!press(hand.current, event, where.x, where.y)) return;
        if (latest.current.gate() !== "counts") { release(hand.current); return; }
        try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* synthetic or finished pointer */ }
        brushed(where.x, where.y, where.x, where.y, BRUSH_R);
      }}
      onPointerMove={event => {
        if (!latest.current.live) return;
        const from = { x: hand.current.x, y: hand.current.y }, where = at(event), length = drag(hand.current, event, where.x, where.y);
        if (length <= 0) return;
        brushed(from.x, from.y, where.x, where.y, BRUSH_R);
      }}
      onPointerUp={event => {
        const what = lift(hand.current, event), where = at(event);
        if (what === "tap" && latest.current.live) brushed(where.x, where.y, where.x, where.y, TAP_R);
      }}
      onPointerCancel={() => release(hand.current)}
      onLostPointerCapture={() => release(hand.current)} />
    <svg className="dn-rocks" viewBox={`0 0 ${PIT.width} ${PIT.height}`} aria-hidden="true" focusable="false">
      {pit.rocks.map((rock, i) => <g key={i} transform={`translate(${rock.x} ${rock.y}) rotate(${rock.rot})`}><g ref={node => { rockNodes.current[i] = node; }} className="dn-rock"><Shapes shapes={rockShapes(rock.r)} /></g></g>)}
      {hint >= 0 && pit.bones[hint] && !pit.foundBone[hint] && <g transform={`translate(${pit.bones[hint].x} ${pit.bones[hint].y})`}><g className="dn-glint"><Shapes shapes={[sparkleShape(13)]} /></g></g>}
    </svg>
    <canvas ref={dustCanvas} className="dn-dust" width={PIT.width} height={PIT.height} aria-hidden="true" />
    {demo && pit.bones[0] && <span className={`dn-ghost dn-swipe-${demo}`} style={{ left: `${pit.bones[0].x / PIT.width * 100}%`, top: `${pit.bones[0].y / PIT.height * 100}%` }}><GhostFinger /></span>}
  </div>;
}

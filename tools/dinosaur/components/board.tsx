"use client";
// The skeleton board (bones go to their places) and the standing dinosaur (the bones turn into it), in one 240×213 frame so the
// dinosaur stands exactly where its skeleton was. The ground is at y = 148; the sky above it carries a sun.
import { useRef } from "react";
import { boneShapes, BOX, dinoShapes, type BoneKind } from "../lib/art";
import { nearestSlot } from "../lib/skeleton";
import { bn, type Dino, type Part } from "../lib/dinos";
import { Mouth, Shapes } from "./pieces";

export const FRAME = { top: -53, height: 213 } as const;
const VIEW = `0 ${FRAME.top} ${BOX.width} ${FRAME.height}`;
export type Fly = { kind: BoneKind; dx: number; dy: number; n: number };

function Ground() {
  return <>
    <rect className="dn-sky" x="0" y={FRAME.top} width={BOX.width} height={FRAME.height} />
    <circle className="dn-sun" cx="206" cy="-20" r="15" />
    <rect className="dn-ground" y={BOX.ground} width={BOX.width} height={BOX.height - BOX.ground} />
  </>;
}

export function Skeleton({ dino, parts, placed, picked, glow, ghost, wobble, slow, fly, onSlot }: {
  dino: Dino; parts: readonly Part[]; placed: readonly BoneKind[]; picked: BoneKind | null; glow: boolean; ghost: boolean;
  wobble: { key: string; n: number } | null; slow: boolean; fly: Fly | null; onSlot: (slot: Part | null) => void;
}) {
  const flown = useRef(0);
  const wobbleClass = (key: string) => wobble?.key === key && !slow ? ` dn-wobble dn-w${wobble.n % 2}` : "";
  return <svg className="dn-skeleton" viewBox={VIEW} role="group" aria-label={`${dino.name}-এর কঙ্কাল`}
    onClick={event => {
      const box = event.currentTarget.getBoundingClientRect();
      onSlot(nearestSlot(parts, (event.clientX - box.left) / box.width * BOX.width, (event.clientY - box.top) / box.height * FRAME.height + FRAME.top, placed));
    }}>
    <Ground />
    <g opacity=".16"><Shapes shapes={dinoShapes(dino.look)} tint="#2b1d12" /></g>
    {parts.map(([kind, x, y, rot, scale], i) => {
      const done = placed.includes(kind);
      return <g key={kind} data-kind={kind} transform={`translate(${x} ${y})`} className={done ? "dn-placed" : `dn-slot${wobbleClass(kind)}`}
        role={done ? undefined : "button"} tabIndex={done ? undefined : 0} aria-label={done ? undefined : `জায়গা ${bn(i + 1)}`}
        onClick={event => { event.stopPropagation(); onSlot(parts[i]); }}
        onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSlot(parts[i]); } }}>
        {!done && <circle className="dn-hit" r={26 * scale + 10} />}
        {!done && picked === kind && glow && <circle r={26 * scale + 6} className="dn-glow" />}
        <g className="dn-snap"><g ref={node => {
          // The bone that just landed flies in from the tray's spot, once.
          if (!node || !done || !fly || fly.kind !== kind || flown.current === fly.n) return;
          flown.current = fly.n;
          if (!slow) node.animate([{ transform: `translate(${fly.dx}px, ${fly.dy}px) scale(0.8)` }, { transform: "translate(0px, 0px) scale(1)" }], { duration: 260, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
        }}>
          <g transform={`rotate(${rot}) scale(${scale})`} opacity={done ? 1 : ghost ? 0.5 : 0}><Shapes shapes={boneShapes(kind)} tint={done ? undefined : "#2b1d12"} /></g>
        </g></g>
      </g>;
    })}
  </svg>;
}

/** The last bone has landed: the bones fade out as the dinosaur fades in and settles, and a ring of dust goes out along the ground. */
export function Stand({ dino, parts, mouth }: { dino: Dino; parts: readonly Part[]; mouth: boolean }) {
  return <>
    <svg className="dn-scene" viewBox={VIEW} role="img" aria-label={dino.name}>
      <Ground />
      <g className="dn-bones-out">{parts.map(([kind, x, y, rot, scale]) => <g key={kind} transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}><Shapes shapes={boneShapes(kind)} /></g>)}</g>
      <ellipse className="dn-dust-ring" cx={BOX.width / 2 - 10} cy={BOX.ground} rx="60" ry="6" />
      <g className="dn-flesh-in"><Shapes shapes={dinoShapes(dino.look)} /></g>
    </svg>
    {mouth && <div className="dn-mouth" aria-hidden="true"><Mouth dino={dino} /></div>}
  </>;
}

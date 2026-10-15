"use client";
// The clock face: Bangla numbers, the two hands, and a finger-friendly way to turn them.
// Drag grabs the nearer hand and turns it in clicks; a plain tap moves the chosen hand to the number tapped.
import { useRef, type PointerEvent } from "react";
import { bn, dragHour, dragMinute, hands, mod, tapHour, tapMinute, type Time } from "../lib/time";
import { GhostFingerPath } from "./art";

export type Hand = "hour" | "minute";
const C = 150, R = 144, NUM_R = 103;
// Rounded so the server and the phone print the same numbers (Math.sin can differ in the last digit, which breaks hydration).
const round2 = (value: number) => Math.round(value * 100) / 100;
const point = (angle: number, r: number) => ({ x: round2(C + r * Math.sin(angle * Math.PI / 180)), y: round2(C - r * Math.cos(angle * Math.PI / 180)) });
/** A hand drawn pointing at 12, turned by `angle`. */
function HandShape({ angle, hand, ghost = false, still }: { angle: number; hand: Hand; ghost?: boolean; still?: boolean }) {
  const long = hand === "minute", length = long ? 112 : 70, width = long ? 7 : 11;
  return <g className={`gd-hand gd-${hand}${ghost ? " gd-ghost-hand" : ""}${still ? " still" : ""}`} style={{ transform: `rotate(${angle}deg)` }}>
    <path d={`M ${C - width / 2} ${C + 14} L ${C - width / 2} ${C - length + width} L ${C} ${C - length} L ${C + width / 2} ${C - length + width} L ${C + width / 2} ${C + 14} Z`} />
  </g>;
}

export function ClockFace({ total, target, ghost, demo, slow, chosen, step = 5, onTurn, onChoose, label }: {
  total?: number; target?: Time; ghost?: boolean; demo?: { hand: Hand; angle: number } | null; slow?: boolean; chosen?: Hand; step?: number;
  onTurn?: (total: number, how: "drag" | "tap") => void; onChoose?: (hand: Hand) => void; label: string;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const gesture = useRef<{ id: number; x: number; y: number; hand: Hand | null; moved: boolean } | null>(null);
  const live = onTurn && total !== undefined;

  const where = (event: PointerEvent) => {
    const box = svg.current!.getBoundingClientRect(), scale = 300 / box.width;
    const dx = (event.clientX - box.left) * scale - C, dy = (event.clientY - box.top) * scale - C;
    return { angle: mod(Math.atan2(dx, -dy) * 180 / Math.PI, 360), r: Math.hypot(dx, dy) };
  };
  /** The hand nearer the finger by angle; when both are close, the long one if the finger is far out. */
  const grab = (angle: number, r: number): Hand => {
    const { hour, minute } = hands(total!), off = (a: number) => Math.abs(mod(angle - a + 180, 360) - 180);
    const dh = off(hour), dm = off(minute);
    if (dh < 25 && dm < 25) return r > 80 ? "minute" : "hour";
    return dm <= dh ? "minute" : "hour";
  };

  const down = (event: PointerEvent<SVGSVGElement>) => {
    if (!live || gesture.current || !event.isPrimary) return;
    try { svg.current!.setPointerCapture(event.pointerId); } catch { /* pointer already gone */ }
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, hand: null, moved: false };
  };
  const move = (event: PointerEvent<SVGSVGElement>) => {
    const g = gesture.current;
    if (!g || g.id !== event.pointerId) return;
    const { angle, r } = where(event);
    if (!g.moved) {
      if (Math.hypot(event.clientX - g.x, event.clientY - g.y) < 8) return;
      g.moved = true;
      g.hand = grab(angle, r);
      onChoose?.(g.hand);
    }
    const next = g.hand === "minute" ? dragMinute(total!, angle, step) : dragHour(total!, angle);
    if (next !== total) onTurn!(next, "drag");
  };
  const up = (event: PointerEvent<SVGSVGElement>) => {
    const g = gesture.current;
    if (!g || g.id !== event.pointerId) return;
    gesture.current = null;
    if (g.moved) return;
    const { angle, r } = where(event);
    if (r < 40) return;
    onTurn!(chosen === "minute" ? tapMinute(total!, angle, step) : tapHour(total!, angle), "tap");
  };
  const cancel = () => { gesture.current = null; };

  const targetHands = target && hands(target.h * 60 + target.m);
  const dragging = Boolean(gesture.current?.moved);
  // The demo always starts from 12, where every "set" item starts.
  const arc = demo && (() => {
    const r = demo.hand === "minute" ? 100 : 62, start = point(0, r), end = point(demo.angle, r);
    return { d: `M ${start.x} ${start.y} A ${r} ${r} 0 ${demo.angle > 180 ? 1 : 0} 1 ${end.x} ${end.y}`, end };
  })();

  return <svg ref={svg} className={`gd-clock${live ? " live" : ""}`} viewBox="0 0 300 300" role="img" aria-label={label}
    onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel} onLostPointerCapture={cancel}>
    <circle cx={C} cy={C} r={R} className="gd-rim" />
    <circle cx={C} cy={C} r={R - 7} className="gd-dial" />
    {Array.from({ length: 60 }, (_, i) => {
      const big = i % 5 === 0, a = point(i * 6, R - 10), b = point(i * 6, R - (big ? 20 : 15));
      return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={big ? "gd-tick big" : "gd-tick"} />;
    })}
    {Array.from({ length: 12 }, (_, i) => {
      const n = i + 1, at = point(n * 30, NUM_R);
      return <text key={n} x={at.x} y={at.y} className="gd-num" textAnchor="middle" dominantBaseline="central">{bn(n)}</text>;
    })}
    {ghost && targetHands && <>
      <HandShape angle={targetHands.hour} hand="hour" ghost />
      <HandShape angle={targetHands.minute} hand="minute" ghost />
    </>}
    {total !== undefined && <>
      <HandShape angle={hands(total).hour} hand="hour" still={dragging} />
      <HandShape angle={hands(total).minute} hand="minute" still={dragging} />
    </>}
    <circle cx={C} cy={C} r={total === undefined ? 5 : 9} className="gd-pin" />
    {arc && <g className="gd-finger" aria-hidden="true">
      <path d={arc.d} className="gd-finger-path" />
      {slow ? <g transform={`translate(${arc.end.x} ${arc.end.y})`}><GhostFingerPath /></g> : <g>
        <GhostFingerPath />
        <animateMotion path={arc.d} dur="2.2s" repeatCount="indefinite" keyPoints="0;1;1" keyTimes="0;0.75;1" calcMode="linear" />
      </g>}
    </g>}
  </svg>;
}

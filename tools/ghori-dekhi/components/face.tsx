"use client";
// The clock face. The big one (ClockFace) takes a finger: the nearer hand follows it smoothly, a dot marks the click spot, a soft
// tick sounds as it passes each one, and on release the hand eases into the click. A plain tap sends the chosen hand to the
// number tapped. The small one (MiniClock) is a picture: the target, a card, the end screen.
// Hands are painted straight to the DOM while a finger moves (no React render per move); React only hears the click.
import { useEffect, useLayoutEffect, useRef, type PointerEvent } from "react";
import { down, drop, move, up, type Holder } from "../lib/drag";
import { CLICK_MS, ease, follow, hourAt, minuteAt, pickHand, pulled, snapHourTotal, snapMinuteTotal, wrapTotal, type Hand } from "../lib/hands";
import { bn, hands, mod, ringNumbers, tapHour, tapMinute, type Time } from "../lib/time";
import { GhostFingerPath } from "./art";

const C = 150, R = 144, NUM_R = 100, PIE_R = 118;
// Rounded so the server and the phone print the same numbers (Math.sin can differ in the last digit, which breaks hydration).
const round2 = (value: number) => Math.round(value * 100) / 100;
const point = (angle: number, r: number) => ({ x: round2(C + r * Math.sin(angle * Math.PI / 180)), y: round2(C - r * Math.cos(angle * Math.PI / 180)) });
const useLayout = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** A hand drawn pointing at 12 (turned by a transform set elsewhere). */
function handPath(hand: Hand) {
  const long = hand === "minute", length = long ? 112 : 70, width = long ? 8 : 12;
  return `M ${C - width / 2} ${C + 16} L ${C - width / 2} ${C - length + width} L ${C} ${C - length} L ${C + width / 2} ${C - length + width} L ${C + width / 2} ${C + 16} Z`;
}

/** The wedge from 12 to `deg` (clockwise), radius PIE_R. Empty at the top. */
function wedge(deg: number, from = 0) {
  const a = mod(deg, 360), start = point(from, PIE_R), end = point(a, PIE_R);
  if (a < 0.6) return "";
  return `M ${C} ${C} L ${start.x} ${start.y} A ${PIE_R} ${PIE_R} 0 ${a - from > 180 ? 1 : 0} 1 ${end.x} ${end.y} Z`;
}

function Dial({ numbers = true, ticks = true }: { numbers?: boolean; ticks?: boolean }) {
  return <>
    <circle cx={C} cy={C} r={R} className="gd-rim" />
    <circle cx={C} cy={C} r={R - 7} className="gd-dial" />
    {ticks && Array.from({ length: 60 }, (_, i) => {
      const big = i % 5 === 0, a = point(i * 6, R - 10), b = point(i * 6, R - (big ? 21 : 15));
      return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={big ? "gd-tick big" : "gd-tick"} />;
    })}
    {numbers && Array.from({ length: 12 }, (_, i) => {
      const n = i + 1, at = point(n * 30, NUM_R);
      return <text key={n} x={at.x} y={at.y} className="gd-num" textAnchor="middle" dominantBaseline="central">{bn(n)}</text>;
    })}
  </>;
}

/** A static picture clock for a time or a `total`. `small` drops the ticks and all but 12·3·6·9. */
export function MiniClock({ time, total, size = 64, label, tone = "plain" }: { time?: Time; total?: number; size?: number; label?: string; tone?: "plain" | "ghost" | "good" }) {
  const t = total ?? (time ? time.h * 60 + time.m : 0), { hour, minute } = hands(t);
  return <svg className={`gd-mini ${tone}`} width={size} height={size} viewBox="0 0 300 300" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false">
    <circle cx={C} cy={C} r={R} className="gd-rim" />
    <circle cx={C} cy={C} r={R - 14} className="gd-dial" />
    {[0, 3, 6, 9].map(i => { const a = point(i * 30, R - 14), b = point(i * 30, R - 44); return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="gd-tick big" />; })}
    {[1, 2, 4, 5, 7, 8, 10, 11].map(i => { const a = point(i * 30, R - 14), b = point(i * 30, R - 30); return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="gd-tick" />; })}
    <g className="gd-hand gd-hour" transform={`rotate(${round2(hour)} ${C} ${C})`}><path d={handPath("hour")} /></g>
    <g className="gd-hand gd-minute" transform={`rotate(${round2(minute)} ${C} ${C})`}><path d={handPath("minute")} /></g>
    <circle cx={C} cy={C} r="13" className="gd-pin" />
  </svg>;
}

/** An empty dial for the print sheet. */
export function BlankClock({ label }: { label: string }) {
  return <svg className="gd-clock" viewBox="0 0 300 300" role="img" aria-label={label}><Dial /><circle cx={C} cy={C} r="9" className="gd-pin" /></svg>;
}

/** The title's clock: the hands turn slowly by themselves (still in ধীরে খেলো). */
export function TitleClock({ time }: { time: Time }) {
  const { hour, minute } = hands(time.h * 60 + time.m);
  return <svg className="gd-clock gd-title-clock" viewBox="0 0 300 300" aria-hidden="true" focusable="false">
    <Dial />
    <g transform={`rotate(${round2(hour)} ${C} ${C})`}><g className="gd-hand gd-hour gd-sweep-hour"><path d={handPath("hour")} /></g></g>
    <g transform={`rotate(${round2(minute)} ${C} ${C})`}><g className="gd-hand gd-minute gd-sweep-minute"><path d={handPath("minute")} /></g></g>
    <circle cx={C} cy={C} r="13" className="gd-pin" />
  </svg>;
}

export type FaceProps = {
  /** The hands, minutes since 12:00. */
  total: number;
  /** Changes with each item: the hands jump instead of easing, and any turn in flight is dropped. */
  itemKey: string;
  /** A finger may turn the hands. */
  live: boolean;
  /** Level ১: only the short hand moves. */
  lockMinute: boolean;
  step: number;
  chosen: Hand;
  slow: boolean;
  /** The wedge from 12 to the long hand, with its minutes. */
  pie: boolean;
  /** The target, drawn as ghost hands. */
  ghost?: Time | null;
  /** The hand to fix after a slip, and the number(s) to ring. */
  wrongHand?: Hand | null;
  ring?: Time | null;
  /** Right: the hands stop, the pie shows. */
  solved?: boolean;
  /** The demo for the first item: where the ghost finger goes. */
  demo?: { hand: Hand; from: number; to: number } | null;
  /** The player's menu is open, or the window is away: any turn is over. */
  away?: boolean;
  label: string;
  /** Asked at each press: false when the game is covered or the press only wakes it (the first tap back from away). */
  gate?: () => boolean;
  onTurn?: (total: number, how: "drag" | "tap") => void;
  onChoose?: (hand: Hand) => void;
  /** A hand passed a click spot / a hand clicked in. */
  onClick?: () => void;
  onSeat?: () => void;
};

export function ClockFace(props: FaceProps) {
  const { total, itemKey, live, lockMinute, step, chosen, slow, pie, ghost, wrongHand, ring, solved, demo, away, label } = props;
  const svg = useRef<SVGSVGElement>(null);
  const hourG = useRef<SVGGElement>(null), minuteG = useRef<SVGGElement>(null), pieP = useRef<SVGPathElement>(null), restP = useRef<SVGPathElement>(null);
  const pieText = useRef<SVGTextElement>(null), dot = useRef<SVGCircleElement>(null);
  const holder = useRef<Holder>({ current: null });
  const latest = useRef(props);
  latest.current = props;
  // What is painted now, the grab in flight, the click-in animation, and the item the hands were last jumped for.
  const shown = useRef({ hour: 0, minute: 0 });
  const grab = useRef({ hand: "hour" as Hand, total0: 0, deg0: 0, deg: 0, snapped: 0 });
  const anim = useRef(0);
  const lastKey = useRef("");

  const paint = (hour: number, minute: number) => {
    shown.current.hour = hour; shown.current.minute = minute;
    hourG.current?.setAttribute("transform", `rotate(${round2(hour)} ${C} ${C})`);
    minuteG.current?.setAttribute("transform", `rotate(${round2(minute)} ${C} ${C})`);
    const d = wedge(minute), p = pieP.current, t = pieText.current;
    p?.setAttribute("d", d);
    const a = mod(minute, 360);
    restP.current?.setAttribute("d", a > 190 ? wedge(360, a) : "");
    if (t) {
      if (a < 20) t.textContent = "";
      else { const at = point(a / 2, 62); t.setAttribute("x", String(at.x)); t.setAttribute("y", String(at.y)); t.textContent = bn(Math.round(a / 6)); }
    }
  };
  const stopAnim = () => { if (anim.current) cancelAnimationFrame(anim.current); anim.current = 0; };
  /** Ease the painted hands to the angles of `to` (a short click into place); jumps in ধীরে খেলো. */
  const ease$ = (toHour: number, toMinute: number) => {
    stopAnim();
    const from = { hour: shown.current.hour, minute: shown.current.minute };
    if (latest.current.slow || (Math.abs(from.hour - toHour) < 0.05 && Math.abs(from.minute - toMinute) < 0.05)) { paint(toHour, toMinute); latest.current.onSeat?.(); return; }
    const started = performance.now();
    const frame = (now: number) => {
      const p = (now - started) / CLICK_MS, e = ease(p);
      paint(from.hour + (toHour - from.hour) * e, from.minute + (toMinute - from.minute) * e);
      if (p < 1) anim.current = requestAnimationFrame(frame); else { anim.current = 0; paint(toHour, toMinute); latest.current.onSeat?.(); }
    };
    anim.current = requestAnimationFrame(frame);
  };

  // The props decide the hands when nothing else is moving them: jump for a new item, ease for a change from outside (a key).
  useLayout(() => {
    const fresh = lastKey.current !== itemKey;
    lastKey.current = itemKey;
    if (fresh) { stopAnim(); drop(holder.current); dot.current?.setAttribute("opacity", "0"); const h = hands(total); paint(h.hour, h.minute); return; }
    if (holder.current.current || anim.current) return;
    const h = hands(total);
    if (Math.abs(mod(shown.current.hour - h.hour + 180, 360) - 180) < 0.05 && Math.abs(mod(shown.current.minute - h.minute + 180, 360) - 180) < 0.05) return;
    // An outside change (an arrow key) is a keyboard action, repeated all day: it jumps, with no easing.
    paint(shown.current.hour + mod(h.hour - shown.current.hour + 180, 360) - 180, shown.current.minute + mod(h.minute - shown.current.minute + 180, 360) - 180);
  }, [total, itemKey]);
  useEffect(() => () => { stopAnim(); }, []);

  const where = (event: { clientX: number; clientY: number }) => {
    const box = svg.current!.getBoundingClientRect(), scale = 300 / box.width;
    const dx = (event.clientX - box.left) * scale - C, dy = (event.clientY - box.top) * scale - C;
    return { angle: mod(Math.atan2(dx, -dy) * 180 / Math.PI, 360), r: Math.hypot(dx, dy) };
  };
  const spot = (hand: Hand, snapped: number) => {
    const node = dot.current;
    if (!node) return;
    const at = point(hand === "minute" ? snapped * 6 : snapped * 0.5, hand === "minute" ? 126 : 82);
    node.setAttribute("cx", String(at.x)); node.setAttribute("cy", String(at.y)); node.setAttribute("opacity", "1");
  };

  /** The turn is over (up, cancel, lost, blur, pause): the hand clicks into place and the click is told. */
  const finish = (moved: boolean) => {
    const g = grab.current, p = latest.current;
    dot.current?.setAttribute("opacity", "0");
    if (!moved) return;
    const snapped = g.snapped, final = hands(snapped);
    ease$(final.hour, g.hand === "hour" ? g.total0 * 6 : final.minute);
    p.onTurn?.(wrapTotal(snapped), "drag");
  };
  const stopTurn = () => { const g = drop(holder.current); if (g?.moved) finish(true); else if (g) dot.current?.setAttribute("opacity", "0"); };

  // A press lost to another window, the player's menu, or an item that moved on ends the turn where the hand is.
  useEffect(() => { if (away) stopTurn(); }, [away]);
  useEffect(() => {
    const out = () => stopTurn();
    window.addEventListener("blur", out);
    document.addEventListener("visibilitychange", out);
    return () => { window.removeEventListener("blur", out); document.removeEventListener("visibilitychange", out); };
  }, []);
  useEffect(() => { drop(holder.current); }, [itemKey]);

  const onDown = (event: PointerEvent<SVGSVGElement>) => {
    const p = latest.current;
    if (!p.live || p.solved || p.away || (p.gate && !p.gate())) return;
    if (!down(holder.current, { pointerId: event.pointerId, isPrimary: event.isPrimary, button: event.button, clientX: event.clientX, clientY: event.clientY })) return;
    try { svg.current!.setPointerCapture(event.pointerId); } catch { /* pointer already gone */ }
    stopAnim();
    const { angle, r } = where(event), g = holder.current.current!, h = hands(p.total);
    g.hand = pickHand(p.total, angle, r, p.lockMinute);
    const deg0 = g.hand === "minute" ? h.minute : h.hour;
    grab.current = { hand: g.hand, total0: p.total, deg0, deg: deg0, snapped: p.total };
  };
  const onMove = (event: PointerEvent<SVGSVGElement>) => {
    const g = holder.current.current;
    if (!g) return;
    const kind = move(holder.current, { pointerId: event.pointerId, buttons: event.buttons, clientX: event.clientX, clientY: event.clientY });
    if (kind === "lost") { if (g.moved) finish(true); else dot.current?.setAttribute("opacity", "0"); return; }
    if (kind === "none") return;
    const p = latest.current, k = grab.current, { angle } = where(event);
    if (kind === "begin") p.onChoose?.(k.hand);
    k.deg = follow(k.deg, angle);
    const raw = k.hand === "minute" ? minuteAt(k.total0, k.deg0, k.deg) : hourAt(k.total0, k.deg0, k.deg);
    const snapped = k.hand === "minute" ? snapMinuteTotal(raw, p.step) : snapHourTotal(raw, k.total0);
    const shownTotal = pulled(raw, snapped, k.hand);
    if (snapped !== k.snapped) { k.snapped = snapped; p.onClick?.(); }
    spot(k.hand, snapped);
    if (k.hand === "minute") paint(shownTotal * 0.5, shownTotal * 6); else paint(shownTotal * 0.5, k.total0 * 6);
  };
  const onUp = (event: PointerEvent<SVGSVGElement>) => {
    const g = up(holder.current, event.pointerId);
    if (!g) return;
    dot.current?.setAttribute("opacity", "0");
    if (g.moved) { finish(true); return; }
    const p = latest.current, { angle, r } = where(event);
    if (r < 40 || !p.live || p.solved) return;
    const hand: Hand = p.lockMinute ? "hour" : p.chosen;
    const to = hand === "minute" ? tapMinute(p.total, angle, p.step) : tapHour(p.total, angle);
    if (to === p.total) return;
    const final = hands(to);
    ease$(final.hour, hand === "hour" ? hands(p.total).minute : final.minute);
    p.onTurn?.(wrapTotal(to), "tap");
  };
  const onCancel = () => { stopTurn(); };

  const ghostHands = ghost && hands(ghost.h * 60 + ghost.m);
  const rings = ring && wrongHand ? ringNumbers(ring, wrongHand) : [];
  const arc = demo && (() => {
    const r = demo.hand === "minute" ? 100 : 62, start = point(demo.from, r), end = point(demo.to, r);
    return { d: `M ${start.x} ${start.y} A ${r} ${r} 0 ${mod(demo.to - demo.from, 360) > 180 ? 1 : 0} 1 ${end.x} ${end.y}`, end };
  })();

  return <svg ref={svg} className={`gd-clock${live && !solved ? " live" : ""}${solved ? " solved" : ""}`} viewBox="0 0 300 300" role="img" aria-label={label}
    onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onCancel} onLostPointerCapture={onCancel}>
    {pie && <>
      <path ref={pieP} className="gd-pie" d="" />
      <path ref={restP} className="gd-pie-rest" d="" />
    </>}
    <Dial />
    {pie && <text ref={pieText} className="gd-pie-text" textAnchor="middle" dominantBaseline="central" />}
    {rings.map(n => { const at = point(n * 30, NUM_R); return <circle key={n} cx={at.x} cy={at.y} r="21" className="gd-ring" />; })}
    {ghostHands && !solved && <>
      <g className="gd-hand gd-hour gd-ghost-hand" transform={`rotate(${ghostHands.hour} ${C} ${C})`}><path d={handPath("hour")} /></g>
      <g className="gd-hand gd-minute gd-ghost-hand" transform={`rotate(${ghostHands.minute} ${C} ${C})`}><path d={handPath("minute")} /></g>
    </>}
    <g ref={hourG} className={`gd-hand gd-hour${wrongHand === "hour" ? " wrong" : ""}${solved ? " ok" : ""}`}><path d={handPath("hour")} /></g>
    <g ref={minuteG} className={`gd-hand gd-minute${wrongHand === "minute" ? " wrong" : ""}${solved ? " ok" : ""}${lockMinute ? " locked" : ""}`}><path d={handPath("minute")} /></g>
    <circle cx={C} cy={C} r="13" className="gd-pin" />
    <circle ref={dot} className="gd-snap" r="7" cx={C} cy={C} opacity="0" />
    {arc && !solved && <g className="gd-finger" aria-hidden="true">
      <path d={arc.d} className="gd-finger-path" />
      {slow ? <g transform={`translate(${arc.end.x} ${arc.end.y})`}><GhostFingerPath /></g> : <g>
        <GhostFingerPath />
        <animateMotion path={arc.d} dur="2.2s" repeatCount="indefinite" keyPoints="0;1;1" keyTimes="0;0.75;1" calcMode="linear" />
      </g>}
    </g>}
  </svg>;
}

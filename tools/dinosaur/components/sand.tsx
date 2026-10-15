"use client";
// The sand over the dig: brush with a finger, or tap to clear a round patch. Drawn once, then only erased, so it stays fast on cheap phones.
import { useEffect, useRef } from "react";
import { makeRng } from "../../../shared/game-core";
import { BRUSH_R, DIG, KEY_R, TAP_R, type Buried } from "../lib/dig";

const SCALE = 2;

export function SandLayer({ bones, seed, onBrush, onKey }: { bones: readonly Buried[]; seed: number; onBrush: (x: number, y: number, r: number) => void; onKey: () => { x: number; y: number } | null }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stroke = useRef<{ id: number; x: number; y: number; moved: number } | null>(null);

  useEffect(() => {
    const c = canvas.current?.getContext("2d");
    if (!c) return;
    c.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    c.globalCompositeOperation = "source-over";
    const sand = c.createLinearGradient(0, 0, 0, DIG.height);
    sand.addColorStop(0, "#f0d9a4"); sand.addColorStop(1, "#e2c283");
    c.fillStyle = sand; c.fillRect(0, 0, DIG.width, DIG.height);
    const rng = makeRng(seed);
    for (let i = 0; i < 420; i++) {
      c.fillStyle = i % 3 ? "#d4b273" : "#f8e8c0";
      c.beginPath(); c.arc(rng() * DIG.width, rng() * DIG.height, 0.8 + rng() * 1.8, 0, Math.PI * 2); c.fill();
    }
    // A little mound and a crack over each bone, so even the youngest know where to brush.
    for (const bone of bones) {
      c.fillStyle = "#d6b574"; c.beginPath(); c.ellipse(bone.x, bone.y + 4, 24, 12, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "#b8955a"; c.lineWidth = 1.6; c.lineCap = "round";
      c.beginPath(); c.moveTo(bone.x - 10, bone.y); c.lineTo(bone.x - 2, bone.y + 4); c.lineTo(bone.x + 6, bone.y - 1); c.lineTo(bone.x + 12, bone.y + 3); c.stroke();
    }
    c.globalCompositeOperation = "destination-out";
  }, [bones, seed]);

  const erase = (x: number, y: number, r: number) => {
    const c = canvas.current?.getContext("2d");
    if (c) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
    onBrush(x, y, r);
  };
  const at = (event: React.PointerEvent) => {
    const box = canvas.current!.getBoundingClientRect();
    return { x: (event.clientX - box.left) / box.width * DIG.width, y: (event.clientY - box.top) / box.height * DIG.height };
  };

  return <canvas ref={canvas} className="dn-sand" width={DIG.width * SCALE} height={DIG.height * SCALE} tabIndex={0} role="button" aria-label="বালু সরাও"
    onPointerDown={event => {
      if (stroke.current) return; // first finger only; a palm or second finger is ignored
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* synthetic or finished pointer */ }
      const { x, y } = at(event);
      stroke.current = { id: event.pointerId, x, y, moved: 0 };
      erase(x, y, BRUSH_R);
    }}
    onPointerMove={event => {
      const now = stroke.current;
      if (!now || now.id !== event.pointerId) return;
      const { x, y } = at(event), length = Math.hypot(x - now.x, y - now.y);
      if (length < 6) return;
      // Fill the gap between two moves, so a quick swipe leaves a clean path.
      for (let step = 6; step <= length; step += 6) erase(now.x + (x - now.x) * step / length, now.y + (y - now.y) * step / length, BRUSH_R);
      stroke.current = { ...now, x, y, moved: now.moved + length };
    }}
    onPointerUp={event => {
      const now = stroke.current;
      if (!now || now.id !== event.pointerId) return;
      if (now.moved < 12) erase(now.x, now.y, TAP_R);
      stroke.current = null;
    }}
    onPointerCancel={() => { stroke.current = null; }}
    onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); const next = onKey(); if (next) erase(next.x, next.y, KEY_R); } }} />;
}

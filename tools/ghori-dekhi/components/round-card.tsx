"use client";
// The parent card inside ShowParent: a clock at the day's last time, the day's times in order, the stars. No name, no photo.
import { useEffect, useRef } from "react";
import { loadCardFonts } from "../../../shared/card-canvas";
import { doneLine, drawCard } from "../lib/draw-card";
import { levelOf } from "../lib/levels";
import { say, type Result } from "../lib/round";

export function RoundCard({ result }: { result: Result }) {
  const card = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    const spec = levelOf(result.level);
    loadCardFonts(`${doneLine(result.count)} ঘড়ি দেখি ${result.items.map(entry => `${say(entry.time, spec)} ${entry.activity.name}`).join(" ")}`).catch(() => undefined).then(() => {
      if (live && card.current) drawCard(card.current, result, location.host);
    });
    return () => { live = false; };
  }, [result]);
  return <>
    <figure className="kit-card"><canvas ref={card} width={1080} height={1350} role="img" aria-label={`ঘড়ি দেখির কার্ড: ${doneLine(result.count)}।`} /></figure>
    <p>{doneLine(result.count)}।</p>
  </>;
}

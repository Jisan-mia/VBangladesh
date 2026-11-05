"use client";
// The parent card inside ShowParent: what was found, the stars, the finder's book so far. No name, no photo.
import { useEffect, useRef } from "react";
import { loadCardFonts } from "../../../shared/card-canvas";
import { drawCard } from "../lib/card";
import { dinoOf } from "../lib/dinos";
import { doneLine, type Result } from "../lib/round";

export function RoundCard({ result, bookCount }: { result: Result; bookCount: number }) {
  const card = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    loadCardFonts(`${doneLine(result.level)} ডাইনোসর খুঁজি ${result.dinos.map(id => dinoOf(id)?.name ?? "").join(" ")} পাখিরা আসলে এখনকার`).catch(() => undefined).then(() => {
      if (live && card.current) drawCard(card.current, result, bookCount, location.host);
    });
    return () => { live = false; };
  }, [result, bookCount]);
  return <>
    <figure className="kit-card"><canvas ref={card} width={1080} height={1350} role="img" aria-label={`ডাইনোসর খুঁজির কার্ড: ${doneLine(result.level)}।`} /></figure>
    <p>{doneLine(result.level)}: {result.dinos.map(id => dinoOf(id)?.name).filter(Boolean).join(", ")}।</p>
  </>;
}

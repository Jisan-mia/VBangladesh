"use client";
// The start card: a magazine's puzzle page over the stage. The biggest thing on it is the start itself, drawn as the game's own
// art: the first picture under a magnifier, ringed in red ink. The second picture stays hidden, so nothing is found before the clock.
import { useEffect, useRef } from "react";
import { fitCanvas } from "../../../shared/game-kit";
import { drawScene } from "../lib/draw";
import { WORLDS, type Stage } from "../lib/levels";
import type { Puzzle } from "../lib/puzzle";
import { SCENE_H, SCENE_W } from "../lib/shapes";
import { bannerNote, bn, clockText, feat, placeOf, type Shared } from "../lib/challenge";
import { WRONG_FOR } from "../lib/levels";
import { KindIcon } from "./kind-icon";

const FRESH_WORD: Readonly<Record<Stage["fresh"], string>> = {
  missing: "নেই", color: "রং", count: "কম", flip: "উল্টো", size: "ছোট", shift: "সরে গেছে", turn: "বাঁকা", text: "লেখা", shade: "হালকা রং", still: "স্থির",
  more: "আরও অমিল", small: "ছোট জিনিস", moving: "নড়ছে", dark: "লোডশেডিং", finale: "শেষ ছবি",
};

function Preview({ puzzle }: { puzzle: Puzzle }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const width = canvas.clientWidth || 280, height = Math.round((width * SCENE_H) / SCENE_W);
    drawScene(fitCanvas(canvas, width, height), puzzle, 0, 0, 0, width / SCENE_W);
  }, [puzzle]);
  return <canvas ref={ref} className="bk-start-pic" aria-hidden="true" />;
}

export type StartProps = {
  level: number; legacy: boolean; stage: Stage; puzzle: Puzzle; stars: number; canPrev: boolean; canNext: boolean;
  friend: Shared | null; friendHere: boolean;
  onStart: () => void; onLevel: (level: number) => void; onSheet: () => void;
};

export function StartCard({ level, legacy, stage, puzzle, stars, canPrev, canNext, friend, friendHere, onStart, onLevel, onSheet }: StartProps) {
  const world = WORLDS[stage.world], finale = stage.finale;
  return (
    <section className="bk-start" aria-labelledby="bk-start-title" data-finale={finale ? "" : undefined} data-dark={stage.dark || undefined}>
      <p className="bk-mast">একটুখানি <span aria-hidden="true">·</span> ভুল কোথায়?</p>

      {friend && friendHere && (
        <p className="bk-friend"><b>{feat(friend)}।</b> {bannerNote(friend)}</p>
      )}

      <div className="bk-pick">
        {!legacy && (
          <button type="button" className="bk-step" onClick={() => onLevel(level - 1)} disabled={!canPrev} aria-label="আগের লেভেল">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
        )}
        <div className="bk-pick-name">
          {finale && <p className="bk-badge-finale">শেষ ছবি</p>}
          <h2 id="bk-start-title">{legacy ? `পুরোনো লেভেল ${bn(level)}` : finale || `লেভেল ${bn(level)}`}</h2>
          <p>{legacy ? placeOf(level, true) : [finale ? `লেভেল ${bn(level)}` : "", world.name, placeOf(level) === world.name ? "" : placeOf(level)].filter(Boolean).join(" · ")}</p>
        </div>
        {!legacy && (
          <button type="button" className="bk-step" onClick={() => onLevel(level + 1)} disabled={!canNext} aria-label="পরের লেভেল">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        )}
      </div>

      <p className="bk-lesson"><KindIcon kind={stage.fresh} /><span><b>{legacy ? "বন্ধুর লিংক" : finale ? "শেষ ছবি" : `নতুন: ${FRESH_WORD[stage.fresh]}`}</b> {stage.lesson}</span></p>

      <button type="button" className="bk-go" onClick={onStart} data-first>
        <span className="bk-go-art" aria-hidden="true">
          <Preview puzzle={puzzle} />
          <svg className="bk-go-lens" viewBox="0 0 100 100">
            <circle cx="44" cy="44" r="27" className="glass" />
            <circle cx="44" cy="44" r="27" className="rim" />
            <path d="M64 64 88 88" className="handle" />
            <ellipse cx="44" cy="44" rx="36" ry="31" className="ring" pathLength={1} />
          </svg>
        </span>
        <span className="bk-go-label">খোঁজা শুরু<small>{friendHere ? "বন্ধুর দুটো ছবি" : `${bn(stage.count)}টা অমিল`}</small></span>
      </button>

      <p className="bk-par">
        <span className="bk-par-stars" aria-hidden="true">★★★</span> {clockText(stage.three)}-এর মধ্যে, ভুল চাপ বড়জোর {bn(WRONG_FOR.three)}টা
        {stars > 0 && <span className="bk-got"> · তোমার {bn(stars)} তারা</span>}
      </p>
      <p className="bk-start-foot">
        <button type="button" className="kit-link" onClick={onSheet}>সব লেভেল</button>
        <span className="bk-keys" aria-hidden="true">Enter শুরু · H হিন্ট · P থামো</span>
      </p>
    </section>
  );
}

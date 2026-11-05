"use client";
// সব নদী: the choice screen. Three worlds as tabs, ten numbered rows each (keys 1–9 and 0; ← → change the world), every row with its
// one new thing, its best time and stars; the recommended river wears এটা খেলো. Opening it pauses a round in progress (the caller's job).
import { useEffect, useRef, useState } from "react";
import type { LevelStars } from "../../../shared/game-core";
import { isFinale, lessonOf, riverName, LEVEL_COUNT, PER_WORLD, WORLDS } from "../lib/levels";
import { bn, secs } from "../lib/result";

export const LIST_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"] as const;

export function RiverList({ stars, bests, playable, current, recommended, onPick, onClose }: {
  stars: LevelStars; bests: Readonly<Record<number, number>>; playable: (level: number) => boolean; current: number; recommended: number;
  onPick: (level: number) => void; onClose: () => void;
}) {
  const [world, setWorld] = useState(Math.floor((current - 1) / PER_WORLD));
  const total = Object.values(stars).reduce((sum, earned) => sum + earned, 0);
  const box = useRef<HTMLDivElement>(null);
  const shown = useRef(world);
  shown.current = world;
  useEffect(() => { box.current?.querySelector<HTMLElement>("[data-next]")?.scrollIntoView({ block: "nearest" }); }, [world]);
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
      if (event.key === "ArrowLeft") { event.preventDefault(); setWorld(Math.max(0, shown.current - 1)); return; }
      if (event.key === "ArrowRight") { event.preventDefault(); setWorld(Math.min(WORLDS.length - 1, shown.current + 1)); return; }
      const index = LIST_KEYS.indexOf(event.key as typeof LIST_KEYS[number]);
      const level = shown.current * PER_WORLD + index + 1;
      if (index >= 0 && playable(level)) { event.preventDefault(); onPick(level); }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [playable, onPick]);
  return (
    <div className="np-sheet" role="dialog" aria-modal="true" aria-labelledby="np-sheet-title">
      <div className="np-sheet-card" ref={box}>
        <header>
          <h2 id="np-sheet-title">সব নদী</h2>
          <p>★ {bn(total)}/{bn(LEVEL_COUNT * 3)} · খেলা থেমে আছে</p>
          <button type="button" className="np-sheet-close" onClick={onClose} aria-label="বন্ধ করো, খেলায় ফেরো">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </header>
        <div className="np-tabs" role="tablist" aria-label="কোন জায়গার নদী">
          {WORLDS.map((each, w) => (
            <button key={each.name} type="button" role="tab" aria-selected={w === world} data-look={each.look} onClick={event => { event.currentTarget.blur(); setWorld(w); }}>{each.name}</button>
          ))}
        </div>
        <section className="np-world" data-look={WORLDS[world].look}>
          <h3><i aria-hidden="true" />{WORLDS[world].name} <small>{WORLDS[world].tag}</small></h3>
          <ol>
            {Array.from({ length: PER_WORLD }, (_, i) => {
              const level = world * PER_WORLD + i + 1, open = playable(level), earned = stars[level] ?? 0, best = bests[level];
              return (
                <li key={level}>
                  <button type="button" disabled={!open} onClick={event => { event.currentTarget.blur(); onPick(level); }}
                    aria-current={level === current ? "true" : undefined} data-next={level === recommended || undefined} data-finale={isFinale(level) || undefined}
                    aria-label={`নদী ${bn(level)}, ওপারে ${riverName(level)}${open ? "" : ", বন্ধ"}${earned ? `, ${bn(earned)} তারা` : ""}${level === recommended ? ", এটা খেলো" : ""}. ${lessonOf(level)}`}>
                    <kbd aria-hidden="true">{LIST_KEYS[i]}</kbd>
                    <span className="np-row-name"><b>{bn(level)} · {riverName(level)}</b>{level === recommended && <em>এটা খেলো</em>}</span>
                    <span className="np-row-line">{open ? lessonOf(level) : "আগের নদীটা পার হলে খুলবে।"}</span>
                    <span className="np-row-stars" aria-hidden="true">
                      {open ? <>{best ? <small>{secs(best)} সে</small> : null}{[0, 1, 2].map(s => <i key={s} data-on={s < earned || undefined}>★</i>)}</> : <svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </div>
  );
}

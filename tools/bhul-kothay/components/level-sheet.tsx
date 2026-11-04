"use client";
// সব লেভেল: six worlds of five, numbered, with stars, locks, finales and the one to play next. Opening it stops the clock
// (the caller's job); a pick that would throw away a started level goes through the ask card first.
import type { CSSProperties } from "react";
import type { LevelStars } from "../../../shared/game-core";
import { PER_WORLD, STAGE_COUNT, WORLDS, stageAt, worldStart } from "../lib/levels";
import { bn } from "../lib/challenge";
import { KindIcon } from "./kind-icon";

export function LevelSheet({ stars, open, visit, current, next, onPick, onClose }: {
  stars: LevelStars; open: number; visit: number; current: number; next: number;
  onPick: (level: number) => void; onClose: () => void;
}) {
  let total = 0;
  for (const earned of Object.values(stars)) total += earned;
  return (
    <div className="bk-sheet" role="dialog" aria-modal="true" aria-labelledby="bk-sheet-title">
      <div className="bk-sheet-card">
        <header>
          <h2 id="bk-sheet-title">সব লেভেল</h2>
          <p>★ {bn(total)}/{bn(STAGE_COUNT * 3)} · এখন খেলো: লেভেল {bn(next)}</p>
          <button type="button" className="bk-sheet-close" onClick={onClose} aria-label="বন্ধ করো, খেলায় ফেরো">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </header>
        {WORLDS.map((world, index) => (
          <section key={world.name} className="bk-world" style={{ "--world": world.ink, "--world-paper": world.paper } as CSSProperties}>
            <h3><span>{bn(index + 1)}. {world.name}</span> <small>{world.twist}</small></h3>
            <ol>
              {Array.from({ length: PER_WORLD }, (_, i) => {
                const level = worldStart(index) + i, stage = stageAt(level), earned = stars[level] ?? 0, locked = level > open && level !== visit;
                return (
                  <li key={level}>
                    <button type="button" disabled={locked} aria-current={level === current ? "true" : undefined}
                      data-finale={stage.finale ? "" : undefined} data-next={level === next || undefined}
                      aria-label={`লেভেল ${bn(level)}${stage.finale ? `, ${stage.finale}` : ""}${locked ? ", বন্ধ" : earned ? `, ${bn(earned)} তারা` : ""}${level === next ? ", এটা খেলো" : ""}`}
                      onClick={() => onPick(level)}>
                      <b>{locked ? <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg> : bn(level)}</b>
                      {!locked && <KindIcon kind={stage.fresh} />}
                      {!locked && <span className="bk-mini" aria-hidden="true">{[0, 1, 2].map(s => <i key={s} data-on={s < earned || undefined}>★</i>)}</span>}
                      {level === next && <em aria-hidden="true">এটা খেলো</em>}
                    </button>
                  </li>
                );
              })}
            </ol>
            <p className="bk-world-finale">শেষ ছবি: {world.finale}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

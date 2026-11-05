"use client";
// সব জ্যাম: four streets, each jam numbered with its stars, a lock shape on closed ones, the finale marked, and এটা খেলো on the
// recommended jam. Opening it pauses play (the caller's job).
import type { LevelStars } from "../../../shared/game-core";
import { bn } from "../lib/link";
import { playable } from "../lib/progress";
import { LEVEL_COUNT, LEVEL_INFO, WORLDS } from "../lib/worlds";

export function LevelSheet({ stars, unlock, visit, current, recommended, onPick, onClose }: {
  stars: LevelStars; unlock: number; visit: number; current: number; recommended: number;
  onPick: (level: number) => void; onClose: () => void;
}) {
  const total = Object.values(stars).reduce((sum, earned) => sum + earned, 0);
  return (
    <div className="jc-sheet" role="dialog" aria-modal="true" aria-labelledby="jc-sheet-title">
      <div className="jc-sheet-card">
        <header>
          <h2 id="jc-sheet-title">সব জ্যাম</h2>
          <p>★ {bn(total)}/{bn(LEVEL_COUNT * 3)} · পরামর্শ: জ্যাম {bn(recommended)}</p>
          <button type="button" className="jc-sheet-close" onClick={onClose} aria-label="বন্ধ করো, খেলায় ফেরো">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </header>
        {WORLDS.map((world, index) => (
          <section key={world.name} className="jc-world" data-world={index}>
            <h3><i aria-hidden="true" />{world.name} <span>নতুন: {world.adds}</span></h3>
            <ol>
              {Array.from({ length: world.to - world.from + 1 }, (_, i) => {
                const level = world.from + i, info = LEVEL_INFO[level - 1], earned = stars[level] ?? 0;
                const locked = !playable(level, unlock, stars, visit);
                return (
                  <li key={level}>
                    <button type="button" disabled={locked} aria-current={level === current ? "true" : undefined}
                      data-finale={info.finale || undefined} data-next={level === recommended || undefined} title={locked ? undefined : `${info.name}: ${info.teach}`}
                      aria-label={`জ্যাম ${bn(level)}, ${info.name}${info.finale ? ", শেষ জ্যাম" : ""}${locked ? ", বন্ধ" : earned ? `, ${bn(earned)} তারা` : ""}${level === recommended ? ", এটা খেলো" : ""}`}
                      onClick={() => onPick(level)}>
                      <b>{locked ? <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg> : bn(level)}</b>
                      {!locked && <span className="jc-mini" aria-hidden="true">{[0, 1, 2].map(s => <i key={s} data-on={s < earned || undefined}>★</i>)}</span>}
                      {level === recommended && !locked && <em aria-hidden="true">এটা খেলো</em>}
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}

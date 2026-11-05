"use client";
// সব লেভেল: three worlds, each level numbered with its stars, a lock shape on closed ones, the finale marked, and এটা খেলো on
// the recommended level. Opening it pauses play (the caller's job).
import type { LevelStars } from "../../../shared/game-core";
import { planOf } from "../lib/game";
import { LEVEL_INFO, WORLDS } from "../lib/levels";
import { bn } from "../lib/link";
import { playable } from "../lib/progress";

export function LevelSheet({ stars, unlock, visit, current, recommended, onPick, onClose }: {
  stars: LevelStars; unlock: number; visit: number; current: number; recommended: number;
  onPick: (level: number) => void; onClose: () => void;
}) {
  const total = Object.values(stars).reduce((sum, earned) => sum + earned, 0);
  return (
    <div className="ct-sheet" role="dialog" aria-modal="true" aria-labelledby="ct-sheet-title">
      <div className="ct-sheet-card">
        <header>
          <h2 id="ct-sheet-title">সব লেভেল</h2>
          <p>★ {bn(total)}/{bn(LEVEL_INFO.length * 3)} · পরামর্শ: লেভেল {bn(recommended)}</p>
          <button type="button" className="ct-sheet-close" onClick={onClose} aria-label="বন্ধ করো, খেলায় ফেরো">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </header>
        {WORLDS.map((world, index) => (
          <section key={world.name} className="ct-world" data-world={index}>
            <h3><i aria-hidden="true" />{world.name} <span>{world.place} · নতুন: {world.idea}</span></h3>
            <ol>
              {Array.from({ length: world.to - world.from + 1 }, (_, i) => {
                const level = world.from + i, info = LEVEL_INFO[level - 1], earned = stars[level] ?? 0, { n, rotate } = planOf(level);
                const locked = !playable(level, unlock, stars, visit);
                return (
                  <li key={level}>
                    <button type="button" disabled={locked} aria-current={level === current ? "true" : undefined}
                      data-finale={info.finale || undefined} data-next={level === recommended || undefined} title={locked ? undefined : `${info.name}: ${info.teach}`}
                      aria-label={`লেভেল ${bn(level)}, ${info.name}, ${bn(n)}×${bn(n)}${rotate ? ", ঘোরানো" : ""}${info.finale ? ", শেষ ছবি" : ""}${locked ? ", বন্ধ" : earned ? `, ${bn(earned)} তারা` : ""}${level === recommended ? ", এটা খেলো" : ""}`}
                      onClick={() => onPick(level)}>
                      <b>{locked ? <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg> : bn(level)}</b>
                      {!locked && <span className="ct-mini" aria-hidden="true">{[0, 1, 2].map(s => <i key={s} data-on={s < earned || undefined}>★</i>)}</span>}
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

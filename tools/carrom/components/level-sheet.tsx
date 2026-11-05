"use client";
// সব বোর্ড: the three worlds, each board numbered with its stars and its one new thing. Opening it pauses play (the caller's job).
import type { LevelStars } from "../../../shared/game-core";
import { LEVELS, WORLDS } from "../lib/levels";
import { bn } from "../lib/link";

export function LevelSheet({ stars, open, visit, current, recommended, onPick, onClose }: {
  stars: LevelStars; open: number; visit: number; current: number; recommended: number;
  onPick: (level: number) => void; onClose: () => void;
}) {
  const total = Object.values(stars).reduce((sum, earned) => sum + earned, 0);
  return (
    <div className="cr-sheet" role="dialog" aria-modal="true" aria-labelledby="cr-sheet-title" onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); onClose(); } }}>
      <div className="cr-sheet-card">
        <header>
          <h2 id="cr-sheet-title">সব বোর্ড</h2>
          <p>★ {bn(total)}/{bn(LEVELS.length * 3)} · এটা খেলো: বোর্ড {bn(recommended)}</p>
          <button type="button" className="cr-sheet-close" onClick={onClose} aria-label="বন্ধ করো, খেলায় ফেরো" data-first>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </header>
        {WORLDS.map((world, index) => (
          <section key={world.name} className="cr-world" data-world={index}>
            <h3><i aria-hidden="true" />{world.name} <span>{world.line}</span></h3>
            <ol>
              {LEVELS.map((spec, i) => ({ spec, level: i + 1 })).filter(({ spec }) => spec.world === index).map(({ spec, level }) => {
                const earned = stars[level] ?? 0, locked = level > open && level !== visit;
                return (
                  <li key={level}>
                    <button type="button" disabled={locked} aria-current={level === current ? "true" : undefined}
                      data-finale={spec.boss ? "" : undefined} data-next={level === recommended || undefined}
                      aria-label={`বোর্ড ${bn(level)}, ${spec.name}${locked ? ", বন্ধ" : earned ? `, ${bn(earned)} তারা` : ""}${level === recommended ? ", এটা খেলো" : ""}`}
                      onClick={() => onPick(level)}>
                      <b>{locked ? <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg> : bn(level)}</b>
                      <span className="cr-sheet-name">{spec.name}</span>
                      {!locked && <span className="cr-mini" aria-hidden="true">{[0, 1, 2].map(s => <i key={s} data-on={s < earned || undefined}>★</i>)}</span>}
                      {level === recommended && <em aria-hidden="true">এটা খেলো</em>}
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

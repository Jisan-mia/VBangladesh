"use client";
// সব লেভেল: three worlds of four, each level numbered with its stars, its name and the one new thing. Opening it mid-game holds
// play (the caller's flow.sheet); closing it lets play go on.
import type { LevelStars } from "../../../shared/game-core";
import { LADDER_LEVELS, PER_WORLD, WORLDS, isFinale } from "../lib/levels";
import { bn } from "../lib/challenge";

export function LevelSheet({ stars, open, visit, current, recommended, onPick, onClose }: {
  stars: LevelStars; open: number; visit: number; current: number; recommended: number;
  onPick: (level: number) => void; onClose: () => void;
}) {
  const total = Object.values(stars).reduce((sum, earned) => sum + earned, 0);
  return (
    <div className="cj-sheet" role="dialog" aria-modal="true" aria-labelledby="cj-sheet-title">
      <div className="cj-sheet-card">
        <header>
          <h2 id="cj-sheet-title">সব লেভেল</h2>
          <p>★ {bn(total)}/{bn(LADDER_LEVELS.length * 3)} · পরামর্শ: লেভেল {bn(recommended)}</p>
          <button type="button" className="cj-sheet-close" onClick={onClose} aria-label="বন্ধ করো, খেলায় ফেরো">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </header>
        {WORLDS.map((world, index) => (
          <section key={world.name} className="cj-world" data-world={index}>
            <h3><i aria-hidden="true" />{world.name} <span>{world.time} · {world.motif}</span></h3>
            <ol>
              {LADDER_LEVELS.slice(index * PER_WORLD, (index + 1) * PER_WORLD).map((info, i) => {
                const level = index * PER_WORLD + i + 1, earned = stars[level] ?? 0, locked = level > open && level !== visit;
                return (
                  <li key={level}>
                    <button type="button" disabled={locked} aria-current={level === current ? "true" : undefined}
                      data-finale={isFinale(level) || undefined} data-next={level === recommended || undefined}
                      aria-label={`লেভেল ${bn(level)}, ${info.finale ?? info.name}${locked ? ", বন্ধ" : earned ? `, ${bn(earned)} তারা` : ""}${level === recommended ? ", এটা খেলো" : ""}`}
                      onClick={() => onPick(level)}>
                      <b>{locked ? <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg> : bn(level)}</b>
                      <span className="cj-sheet-name">{info.finale ?? info.name}</span>
                      {!locked && <span className="cj-mini" aria-hidden="true">{[0, 1, 2].map(s => <i key={s} data-on={s < earned || undefined}>★</i>)}</span>}
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

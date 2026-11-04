"use client";
// সব লেভেল: the three worlds, each level numbered with its stars, a lock on closed ones, and এটা খেলো on the recommended one.
// It opens only from the title and end screens, so nothing is in play behind it.
import type { LevelStars } from "../../../shared/game-core";
import { LEVELS, WORLDS } from "../lib/levels";
import { bn } from "../lib/result";

const SIZE = ["৫×৫", "৭×৭", "১০×১০"];

export function LevelSheet({ stars, open, visit, current, recommended, onPick, onClose }: {
  stars: LevelStars; open: number; visit: number; current: number; recommended: number;
  onPick: (level: number) => void; onClose: () => void;
}) {
  const total = Object.values(stars).reduce((sum, earned) => sum + earned, 0);
  return (
    <div className="sl-sheet" role="dialog" aria-modal="true" aria-labelledby="sl-sheet-title">
      <div className="sl-sheet-card">
        <header>
          <h2 id="sl-sheet-title">সব লেভেল</h2>
          <p>★ {bn(total)}/{bn(LEVELS.length * 3)} · পরামর্শ: লেভেল {bn(recommended)}</p>
          <button type="button" className="sl-sheet-close" onClick={onClose} aria-label="বন্ধ করো">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </header>
        {WORLDS.map((world, index) => (
          <section key={world.name} className="sl-world" data-world={index}>
            <h3><i aria-hidden="true" />{world.name} <span>{world.place} · {SIZE[index]}</span></h3>
            <ol>
              {LEVELS.filter(level => level.world === index).map(level => {
                const earned = stars[level.id] ?? 0, locked = level.id > open && level.id !== visit;
                return (
                  <li key={level.id}>
                    <button type="button" disabled={locked} aria-current={level.id === current ? "true" : undefined}
                      data-finale={level.boss ? "" : undefined} data-next={level.id === recommended || undefined}
                      aria-label={`লেভেল ${bn(level.id)}, ${level.name}${locked ? ", বন্ধ" : earned ? `, ${bn(earned)} তারা` : ""}${level.id === recommended ? ", এটা খেলো" : ""}`}
                      onClick={() => onPick(level.id)}>
                      <b>{locked ? <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg> : bn(level.id)}</b>
                      <span className="sl-sheet-name">{level.name}</span>
                      {!locked && <span className="sl-mini" aria-hidden="true">{[0, 1, 2].map(s => <i key={s} data-on={s < earned || undefined}>★</i>)}</span>}
                      {level.id === recommended && <em aria-hidden="true">এটা খেলো</em>}
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

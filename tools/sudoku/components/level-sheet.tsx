"use client";
// সব লেভেল: the four worlds, each level numbered with its stars. Opening it mid-puzzle stops the clock (the caller's job).
import type { LevelStars } from "../../../shared/game-core";
import { LESSONS, WORLDS, isFinale } from "../lib/levels";
import { bn } from "../lib/link";

const SIZE = ["৪×৪", "৬×৬", "৯×৯", "৯×৯"];

export function LevelSheet({ stars, open, visit, current, recommended, onPick, onClose }: {
  stars: LevelStars; open: number; visit: number; current: number; recommended: number;
  onPick: (level: number) => void; onClose: () => void;
}) {
  const total = Object.values(stars).reduce((sum, earned) => sum + earned, 0);
  return (
    <div className="sd-sheet" role="dialog" aria-modal="true" aria-labelledby="sd-sheet-title">
      <div className="sd-sheet-card">
        <header>
          <h2 id="sd-sheet-title">সব লেভেল</h2>
          <p>★ {bn(total)}/{bn(WORLDS.length * 30)} · পরামর্শ: লেভেল {bn(recommended)}</p>
          <button type="button" className="sd-sheet-close" onClick={onClose} aria-label="বন্ধ করো, খেলায় ফেরো">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </header>
        {WORLDS.map((world, index) => (
          <section key={world.name} className="sd-world" data-world={index}>
            <h3><i aria-hidden="true" />{world.name} <span>{world.paper} · {SIZE[index]}</span></h3>
            <ol>
              {Array.from({ length: 10 }, (_, i) => {
                const level = world.from + i, earned = stars[level] ?? 0, locked = level > open && level !== visit;
                return (
                  <li key={level}>
                    <button type="button" disabled={locked} aria-current={level === current ? "true" : undefined}
                      data-finale={isFinale(level) || undefined} data-next={level === recommended || undefined}
                      title={locked ? undefined : LESSONS[level - 1]}
                      aria-label={`লেভেল ${bn(level)}${locked ? ", বন্ধ" : earned ? `, ${bn(earned)} তারা` : ""}${level === recommended ? ", এটা খেলো" : ""}`}
                      onClick={() => onPick(level)}>
                      <b>{locked ? <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg> : bn(level)}</b>
                      {!locked && <span className="sd-mini" aria-hidden="true">{[0, 1, 2].map(s => <i key={s} data-on={s < earned || undefined}>★</i>)}</span>}
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

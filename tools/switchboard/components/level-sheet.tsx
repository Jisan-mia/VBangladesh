"use client";
// সব লেভেল: three houses of ten, each level numbered with its stars and its name; finales in red. Opening it mid-board holds
// play and the clock (the caller's flow.sheet); closing it lets play go on.
import type { LevelStars } from "../../../shared/game-core";
import { PER_WORLD, WORLDS, isFinale, levelOf } from "../lib/levels";
import { bn } from "../lib/link";

const SIZES = ["৩×৩ থেকে ৪×৪", "৪×৪ থেকে ৫×৫", "৫×৫, লম্বা সুইচ"];

export function LevelSheet({ stars, open, visit, current, recommended, onPick, onClose }: {
  stars: LevelStars; open: number; visit: number; current: number; recommended: number;
  onPick: (level: number) => void; onClose: () => void;
}) {
  const total = Object.values(stars).reduce((sum, earned) => sum + earned, 0);
  return (
    <div className="sb-sheet" role="dialog" aria-modal="true" aria-labelledby="sb-sheet-title">
      <div className="sb-sheet-card">
        <header>
          <h2 id="sb-sheet-title">সব লেভেল</h2>
          <p>★ {bn(total)}/{bn(WORLDS.length * PER_WORLD * 3)} · পরামর্শ: লেভেল {bn(recommended)}</p>
          <button type="button" className="sb-sheet-close" onClick={onClose} aria-label="বন্ধ করো, খেলায় ফেরো">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </header>
        {WORLDS.map((world, index) => (
          <section key={world.name} className="sb-world" data-world={index}>
            <h3><i aria-hidden="true" />{world.name} <span>{world.ruleName ?? "সোজা তার"} · {SIZES[index]}</span></h3>
            <ol>
              {Array.from({ length: PER_WORLD }, (_, i) => {
                const level = index * PER_WORLD + i + 1, earned = stars[level] ?? 0, locked = level > open && level !== visit, info = levelOf(level);
                return (
                  <li key={level}>
                    <button type="button" disabled={locked} aria-current={level === current ? "true" : undefined}
                      data-finale={isFinale(level) || undefined} data-next={level === recommended || undefined}
                      aria-label={`লেভেল ${bn(level)}, ${info.finale ?? info.name}${locked ? ", বন্ধ" : earned ? `, ${bn(earned)} তারা` : ""}${level === recommended ? ", এটা খেলো" : ""}`}
                      onClick={() => onPick(level)}>
                      <b>{locked ? <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg> : bn(level)}</b>
                      <span className="sb-sheet-name">{info.finale ?? info.name}</span>
                      {!locked && <span className="sb-mini" aria-hidden="true">{[0, 1, 2].map(s => <i key={s} data-on={s < earned || undefined}>★</i>)}</span>}
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

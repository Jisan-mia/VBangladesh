"use client";
// সব লেভেল: three orchards of ten, each level numbered with its stars and its name; finales in red, the recommended level
// marked "এটা খেলো". Opening it mid-orchard holds play and the clock (the caller's flow.sheet); 1–9 pick in the current world.
import type { LevelStars } from "../../../shared/game-core";
import { PER_WORLD, WORLDS, isFinale, levelName } from "../lib/levels";
import { bn } from "../lib/challenge";

export function LevelSheet({ stars, reach, current, recommended, onPick, onClose }: {
  stars: LevelStars; reach: (level: number) => boolean; current: number; recommended: number;
  onPick: (level: number) => void; onClose: () => void;
}) {
  const total = Object.values(stars).reduce((sum, earned) => sum + earned, 0);
  return (
    <div className="bc-sheet" role="dialog" aria-modal="true" aria-labelledby="bc-sheet-title">
      <div className="bc-sheet-card">
        <header>
          <h2 id="bc-sheet-title">সব লেভেল</h2>
          <p>★ {bn(total)}/{bn(WORLDS.length * PER_WORLD * 3)} · এটা খেলো: লেভেল {bn(recommended)}</p>
          <button type="button" className="bc-sheet-close" onClick={onClose} aria-label="বন্ধ করো, খেলায় ফেরো">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </header>
        {WORLDS.map((world, index) => (
          <section key={world.name} className="bc-world" data-world={index + 1}>
            <h3><i aria-hidden="true" />{world.long} <span>{world.ruleName ?? "সংখ্যা আর গামছা"}</span></h3>
            <ol>
              {Array.from({ length: PER_WORLD }, (_, i) => {
                const level = index * PER_WORLD + i + 1, earned = stars[level] ?? 0, locked = !reach(level), name = levelName(level);
                return (
                  <li key={level}>
                    <button type="button" disabled={locked} aria-current={level === current ? "true" : undefined}
                      data-finale={isFinale(level) || undefined} data-next={level === recommended || undefined}
                      aria-label={`লেভেল ${bn(level)}, ${name}${locked ? ", বন্ধ" : earned ? `, ${bn(earned)} তারা` : ""}${level === recommended ? ", এটা খেলো" : ""}`}
                      onClick={() => onPick(level)}>
                      <b>{locked ? <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg> : bn(level)}</b>
                      <span className="bc-sheet-name">{name}</span>
                      {!locked && <span className="bc-mini" aria-hidden="true">{[0, 1, 2].map(s => <i key={s} data-on={s < earned || undefined}>★</i>)}</span>}
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

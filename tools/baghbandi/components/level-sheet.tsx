"use client";
// সব লেভেল: one side's ladder, three worlds of four, each level numbered with its stars and its one new thing. Opening it
// mid-game holds play (the caller's flow.sheet), closing it lets play go on.
import type { LevelStars } from "../../../shared/game-core";
import type { Side } from "../lib/game";
import { LADDERS, PER_WORLD, WORLDS, isFinale } from "../lib/levels";
import { bn, sideWord } from "../lib/link";

export function LevelSheet({ side, stars, open, visit, current, recommended, onPick, onSide, onClose }: {
  side: Side; stars: LevelStars; open: number; visit: number; current: number; recommended: number;
  onPick: (level: number) => void; onSide: (side: Side) => void; onClose: () => void;
}) {
  const ladder = LADDERS[side];
  const total = Object.values(stars).reduce((sum, earned) => sum + earned, 0);
  return (
    <div className="bb-sheet" role="dialog" aria-modal="true" aria-labelledby="bb-sheet-title">
      <div className="bb-sheet-card">
        <header>
          <h2 id="bb-sheet-title">সব লেভেল</h2>
          <p>★ {bn(total)}/{bn(ladder.length * 3)} · পরামর্শ: লেভেল {bn(recommended)}</p>
          <button type="button" className="bb-sheet-close" onClick={onClose} aria-label="বন্ধ করো, খেলায় ফেরো">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </header>
        <div className="bb-sheet-sides" role="tablist" aria-label="কোন দিকের লেভেল">
          {([1, 0] as const).map(choice => (
            <button key={choice} type="button" role="tab" aria-selected={side === choice} onClick={() => onSide(choice)}>{sideWord(choice)} হয়ে</button>
          ))}
        </div>
        {WORLDS.map((world, index) => (
          <section key={world.name} className="bb-world" data-world={index}>
            <h3><i aria-hidden="true" />{world.name} <span>{world.time}{index === 0 ? " · ছোট ছক, শেখার পালা" : " · পুরো খেলা"}</span></h3>
            <ol>
              {ladder.slice(index * PER_WORLD, (index + 1) * PER_WORLD).map((info, i) => {
                const level = index * PER_WORLD + i + 1, earned = stars[level] ?? 0, locked = level > open && level !== visit;
                return (
                  <li key={level}>
                    <button type="button" disabled={locked} aria-current={level === current ? "true" : undefined}
                      data-finale={isFinale(level) || undefined} data-next={level === recommended || undefined}
                      aria-label={`লেভেল ${bn(level)}${info.finale ? `, ${info.finale}` : ""}${locked ? ", বন্ধ" : earned ? `, ${bn(earned)} তারা` : ""}${level === recommended ? ", এটা খেলো" : ""}`}
                      onClick={() => onPick(level)}>
                      <b>{locked ? <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg> : bn(level)}</b>
                      <span className="bb-sheet-name">{info.finale ?? (index === 0 ? info.name : info.line)}</span>
                      {!locked && <span className="bb-mini" aria-hidden="true">{[0, 1, 2].map(s => <i key={s} data-on={s < earned || undefined}>★</i>)}</span>}
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

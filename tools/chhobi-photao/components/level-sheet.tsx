"use client";
// সব লেভেল: three worlds, each level numbered with its stars, a lock on closed ones, cleared ones wearing their picture,
// the finale marked, and এটা খেলো on the recommended level. Opening it pauses play (the caller's job).
import { useEffect, useRef } from "react";
import type { LevelStars } from "../../../shared/game-core";
import { paintCanvas } from "../lib/art";
import { LEVEL_INFO, WORLDS } from "../lib/levels";
import { bn, pictureName } from "../lib/link";
import { sizeText } from "../lib/levels";
import { playable } from "../lib/progress";

/** A cleared level's picture, small: the same stitched renderer as the end screen. */
function Thumb({ level }: { level: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1), side = Math.round(44 * ratio);
    canvas.width = canvas.height = side;
    canvas.getContext("2d")?.drawImage(paintCanvas(level, side), 0, 0);
  }, [level]);
  return <canvas ref={ref} className="cp-thumb" aria-hidden="true" />;
}

export function LevelSheet({ stars, unlock, visit, current, recommended, onPick, onClose }: {
  stars: LevelStars; unlock: number; visit: number; current: number; recommended: number;
  onPick: (level: number) => void; onClose: () => void;
}) {
  const total = Object.values(stars).reduce((sum, earned) => sum + earned, 0);
  return (
    <div className="cp-sheet" role="dialog" aria-modal="true" aria-labelledby="cp-sheet-title">
      <div className="cp-sheet-card">
        <header>
          <h2 id="cp-sheet-title">সব লেভেল</h2>
          <p>★ {bn(total)}/{bn(LEVEL_INFO.length * 3)} · পরামর্শ: লেভেল {bn(recommended)}</p>
          <button type="button" className="cp-sheet-close" onClick={onClose} aria-label="বন্ধ করো, খেলায় ফেরো">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </header>
        {WORLDS.map((world, index) => (
          <section key={world.name} className="cp-world" data-world={index}>
            <h3><i aria-hidden="true" />{world.name} <span>{world.place} · {world.idea}</span></h3>
            <ol>
              {Array.from({ length: world.to - world.from + 1 }, (_, i) => {
                const level = world.from + i, info = LEVEL_INFO[level - 1], earned = stars[level] ?? 0;
                const locked = !playable(level, unlock, stars, visit);
                return (
                  <li key={level}>
                    <button type="button" disabled={locked} aria-current={level === current ? "true" : undefined}
                      data-finale={info.finale || undefined} data-next={level === recommended || undefined} title={locked ? undefined : info.teach}
                      aria-label={`লেভেল ${bn(level)}, ${sizeText(level)}${earned ? `, ${pictureName(level)}` : ""}${info.finale ? ", শেষ ছবি" : ""}${locked ? ", বন্ধ" : earned ? `, ${bn(earned)} তারা` : ""}${level === recommended ? ", এটা খেলো" : ""}`}
                      onClick={() => onPick(level)}>
                      {locked
                        ? <b><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg></b>
                        : earned ? <><Thumb level={level} /><small className="cp-n" aria-hidden="true">{bn(level)}</small></> : <b>{bn(level)}</b>}
                      {!locked && <span className="cp-mini" aria-hidden="true">{[0, 1, 2].map(s => <i key={s} data-on={s < earned || undefined}>★</i>)}</span>}
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

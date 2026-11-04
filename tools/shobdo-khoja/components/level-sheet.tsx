"use client";
// সব লেভেল: the eight worlds with their levels and stars, plus free play's packs and difficulty. Opening it stops the
// clock (the caller's job); a pick that would throw away a started page goes through the ask card first.
import type { CSSProperties } from "react";
import type { LevelStars } from "../../../shared/game-core";
import { type Level } from "../lib/grid";
import { PER_WORLD, STAGES, WORLDS, isFinale, worldStart } from "../lib/levels";
import { bn, levelName } from "../lib/link";
import { PACKS, type PackId } from "../lib/packs";
import { PALETTES } from "../lib/art";
import { Motif } from "./motif";
import { FREE_LINES } from "./start-card";

export function LevelSheet({ stars, open, visit, current, recommended, free, onPick, onFree, onClose }: {
  stars: LevelStars; open: number; visit: number; current: number; recommended: number;
  free: { pack: PackId; level: Level } | null;
  onPick: (page: number) => void; onFree: (pack: PackId, level: Level) => void; onClose: () => void;
}) {
  const total = Object.values(stars).reduce((sum, earned) => sum + earned, 0);
  return (
    <div className="sk-sheet" role="dialog" aria-modal="true" aria-labelledby="sk-sheet-title">
      <div className="sk-sheet-card">
        <header>
          <h2 id="sk-sheet-title">সব লেভেল</h2>
          <p>★ {bn(total)}/{bn(STAGES.length * 3)} · এখন খেলো: লেভেল {bn(recommended)}</p>
          <button type="button" className="sk-sheet-close" onClick={onClose} aria-label="বন্ধ করো, খেলায় ফেরো">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </header>
        {WORLDS.map((world, index) => {
          const palette = PALETTES[world.pack], from = worldStart(index);
          return (
            <section key={world.pack} className="sk-world" style={{ "--world": palette.ink, "--world-paper": palette.paper } as CSSProperties}>
              <h3><Motif pack={world.pack} />{bn(index + 1)}. {world.page} <span>{world.finale}</span></h3>
              <ol>
                {Array.from({ length: PER_WORLD }, (_, i) => {
                  const page = from + i, earned = stars[page] ?? 0, locked = page > open && page !== visit;
                  return (
                    <li key={page}>
                      <button type="button" disabled={locked} aria-current={page === current ? "true" : undefined}
                        data-finale={isFinale(page) || undefined} data-next={page === recommended || undefined}
                        aria-label={`লেভেল ${bn(page)}${isFinale(page) ? `, ${world.finale}` : ""}${locked ? ", বন্ধ" : earned ? `, ${bn(earned)} তারা` : ""}${page === recommended ? ", এটা খেলো" : ""}`}
                        onClick={() => onPick(page)}>
                        <b>{locked ? <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg> : bn(page)}</b>
                        {!locked && <span className="sk-mini" aria-hidden="true">{[0, 1, 2].map(s => <i key={s} data-on={s < earned || undefined}>★</i>)}</span>}
                        {page === recommended && <em aria-hidden="true">এটা খেলো</em>}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
        <section className="sk-free-sheet">
          <h3>নিজের মতো <span>৭×৭ পাতা, ছয়টা শব্দ, তারা নেই</span></h3>
          <div className="sk-chips" role="radiogroup" aria-label="কোন প্যাক">
            {PACKS.map(pack => (
              <button key={pack.id} type="button" role="radio" aria-checked={free?.pack === pack.id}
                style={{ "--chip": PALETTES[pack.id].paper } as CSSProperties} onClick={() => onFree(pack.id, free?.level ?? 0)}>{pack.name}</button>
            ))}
          </div>
          <div className="sk-kinds" role="radiogroup" aria-label="কতটা কঠিন">
            {([0, 1] as const).map(level => (
              <button key={level} type="button" role="radio" aria-checked={free?.level === level} onClick={() => onFree(free?.pack ?? "phul", level)}>
                <b>{levelName(level)}</b><small>{FREE_LINES[level]}</small>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

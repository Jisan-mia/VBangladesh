"use client";
// The level list, a choice screen with nothing running behind it: three পাড়া of four neighbours, numbered, each with its one
// new thing and its stars. The next to play is marked এটা খেলো; locked rows are dim and carry a lock shape, not only a colour.
import { useEffect, useRef } from "react";
import type { LevelStars } from "../../../shared/game-core";
import { isFinale, LEVELS, LEVEL_COUNT, MODE_INFO, MODES, PER_WORLD, WORLDS, type Mode } from "../lib/levels";
import { bn } from "../lib/lines";
import { playable } from "../lib/progress";

const Lock = () => <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg>;
/** 1–9, then 0, - and = for 10–12, as the rows say. */
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="];

export function LevelSheet({ stars, unlock, friendLevel, current, next, mode, onMode, onPick, onClose }: {
  stars: LevelStars; unlock: number; friendLevel: number; current: number; next: number; mode: Mode;
  onMode: (mode: Mode) => void; onPick: (level: number) => void; onClose: () => void;
}) {
  const sheet = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sheet.current?.querySelector<HTMLElement>("[data-next]")?.focus({ preventScroll: true });
    const key = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === "Escape") return;
      const level = KEYS.indexOf(event.key) + 1;
      if (level && playable(level, unlock, stars, friendLevel)) { event.preventDefault(); onPick(level); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [unlock, stars, friendLevel, onPick]);

  return (
    <div className="gb-sheet" ref={sheet} role="dialog" aria-modal="true" aria-labelledby="gb-sheet-title">
      <div className="gb-sheet-head">
        <h2 id="gb-sheet-title">সব লেভেল</h2>
        <button type="button" className="gb-sheet-close" onClick={onClose} aria-label="বন্ধ করো">✕</button>
      </div>
      <div className="gb-modes" role="radiogroup" aria-label="কতটা কঠিন">
        {MODES.map(item => <button key={item} type="button" role="radio" aria-checked={item === mode} onClick={() => onMode(item)}>{MODE_INFO[item].name}</button>)}
      </div>
      {WORLDS.map((world, worldIndex) => (
        <section key={world.name} className="gb-sheet-world" data-world={worldIndex}>
          <h3>{world.name} <small>{world.line}</small></h3>
          <ol>
            {LEVELS.slice(worldIndex * PER_WORLD, worldIndex * PER_WORLD + PER_WORLD).map((def, index) => {
              const level = worldIndex * PER_WORLD + index + 1, locked = !playable(level, unlock, stars, friendLevel), earned = stars[level] ?? 0;
              return (
                <li key={level}>
                  <button type="button" disabled={locked} data-next={level === next ? "" : undefined} aria-current={level === current ? "true" : undefined} onClick={() => onPick(level)}
                    aria-label={`লেভেল ${bn(level)}, ${def.rival.name}${locked ? ", বন্ধ" : earned ? `, ${bn(earned)} তারা` : ""}`}>
                    <b className="gb-sheet-num">{locked ? <Lock /> : bn(level)}</b>
                    <span className="gb-sheet-name">{def.rival.name}{isFinale(def) && <i>শেষ খেলা</i>}{level === next && !locked && <em>এটা খেলো</em>}</span>
                    <span className="gb-sheet-teach">{def.teach}</span>
                    <span className="gb-sheet-stars" aria-hidden="true">{[0, 1, 2].map(star => <span key={star} data-on={star < earned}>★</span>)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      <p className="gb-sheet-note">একজনকে হারালেই পরের জন খোলে। মোট {bn(LEVEL_COUNT)} জন।</p>
    </div>
  );
}

"use client";
// The level list, a choice screen with nothing running behind it: three places of four courtyards, numbered, each with its one
// new thing, the seconds to clear it and its stars; then the milestones. The next to play is marked এটা খেলো; locked rows are
// dim and carry a lock shape.
import { useEffect, useRef } from "react";
import type { LevelStars } from "../../../shared/game-core";
import { BADGE_IDS, BADGES, type Badge } from "../lib/badges";
import { isFinale, LEVELS, LEVEL_COUNT, MODE_INFO, MODES, PER_WORLD, WORLDS, type Mode } from "../lib/levels";
import { bn } from "../lib/lines";
import { playable } from "../lib/progress";
import { Cross, Star } from "./icons";

const Lock = () => <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg>;
/** 1–9, then 0, - and = for 10–12, as the rows say. */
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="];

export function LevelSheet({ stars, unlock, friendLevel, current, next, mode, owned, onMode, onPick, onClose }: {
  stars: LevelStars; unlock: number; friendLevel: number; current: number; next: number; mode: Mode; owned: Badge[];
  onMode: (mode: Mode) => void; onPick: (level: number) => void; onClose: () => void;
}) {
  const sheet = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sheet.current?.querySelector<HTMLElement>("[data-next]")?.focus({ preventScroll: true });
    const key = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      const level = KEYS.indexOf(event.key) + 1;
      if (level && playable(level, unlock, stars, friendLevel)) { event.preventDefault(); onPick(level); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [unlock, stars, friendLevel, onPick]);

  return (
    <div className="lt-sheet" ref={sheet} role="dialog" aria-modal="true" aria-labelledby="lt-sheet-title">
      <div className="lt-sheet-head">
        <h2 id="lt-sheet-title">সব লেভেল</h2>
        <button type="button" className="lt-sheet-close" onClick={onClose} aria-label="বন্ধ করো"><Cross /></button>
      </div>
      <div className="lt-modes" role="radiogroup" aria-label="কতটা কঠিন">
        {MODES.map(item => <button key={item} type="button" role="radio" aria-checked={item === mode} onClick={() => onMode(item)}>{MODE_INFO[item].name}</button>)}
      </div>
      {WORLDS.map((world, worldIndex) => (
        <section key={world.name} className="lt-sheet-world" data-world={worldIndex}>
          <h3>{world.name} <small>{world.line}</small></h3>
          <ol>
            {LEVELS.slice(worldIndex * PER_WORLD, worldIndex * PER_WORLD + PER_WORLD).map((def, index) => {
              const level = worldIndex * PER_WORLD + index + 1, locked = !playable(level, unlock, stars, friendLevel), earned = stars[level] ?? 0;
              return (
                <li key={level}>
                  <button type="button" disabled={locked} data-next={level === next ? "" : undefined} aria-current={level === current ? "true" : undefined} onClick={() => onPick(level)}
                    aria-label={`লেভেল ${bn(level)}, ${def.name}, ${bn(def.stars[0])} সেকেন্ডে পার${locked ? ", বন্ধ" : earned ? `, ${bn(earned)} তারা` : ""}`}>
                    <b className="lt-sheet-num">{locked ? <Lock /> : bn(level)}</b>
                    <span className="lt-sheet-name">{def.name}{isFinale(def) && <i>শেষ খেলা</i>}{level === next && !locked && <em>এটা খেলো</em>}</span>
                    <span className="lt-sheet-teach">{bn(def.stars[0])} সেকেন্ডে পার · {def.teach}</span>
                    <span className="lt-sheet-stars" aria-hidden="true">{[0, 1, 2].map(star => <span key={star} data-on={star < earned}><Star /></span>)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      <p className="lt-sheet-note">একটা লেভেল পার হলেই পরেরটা খোলে। মোট {bn(LEVEL_COUNT)}টা।</p>
      <ul className="lt-badges" aria-label="পদক">
        {BADGE_IDS.map(id => <li key={id} data-on={owned.includes(id)}><span aria-hidden="true">{owned.includes(id) ? "●" : "○"}</span>{BADGES[id]}<span className="lt-sr">{owned.includes(id) ? ", পেয়েছ" : ", এখনো পাওনি"}</span></li>)}
      </ul>
    </div>
  );
}

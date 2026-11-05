"use client";
// The level list, a choice screen with nothing moving behind it: three worlds of four, numbered, each with its one new
// thing and its stars, then যত দূর পারো. The next unplayed level is marked এটা খেলো; locked rows carry a lock shape.
import { useEffect, useRef } from "react";
import type { LevelStars } from "../../../shared/game-core";
import { ENDLESS, LEVEL_COUNT, LEVELS, MODE_INFO, MODES, WORLDS, type Mode } from "../lib/levels";
import { bn } from "../lib/link";

const Lock = () => <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg>;
/** Keys for rows 1–12: the digits, then 0, - and =. */
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="];

export function LevelSheet({ stars, open, current, mode, best, onMode, onPick, onClose }: {
  stars: LevelStars; open: number; current: number; mode: Mode; best: number | null;
  onMode: (mode: Mode) => void; onPick: (level: number) => void; onClose: () => void;
}) {
  const sheet = useRef<HTMLDivElement>(null);
  const next = LEVELS.findIndex((_, index) => index + 1 <= open && !stars[index + 1]) + 1 || open;

  useEffect(() => {
    sheet.current?.querySelector<HTMLElement>("[data-next]")?.focus({ preventScroll: true });
    const key = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === "Escape") return;
      const level = KEYS.indexOf(event.key) + 1;
      if (level > 0 && level <= open) { event.preventDefault(); onPick(level); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open, onPick]);

  return (
    <div className="dh-sheet" ref={sheet} role="dialog" aria-modal="true" aria-labelledby="dh-sheet-title">
      <div className="dh-sheet-head">
        <h2 id="dh-sheet-title">সব লেভেল</h2>
        <button type="button" className="dh-sheet-close" onClick={onClose} aria-label="বন্ধ করো">✕</button>
      </div>
      <div className="dh-modes" role="radiogroup" aria-label="কতটা কঠিন">
        {MODES.map(item => <button key={item} type="button" role="radio" aria-checked={item === mode} onClick={() => onMode(item)}>{MODE_INFO[item].name}</button>)}
      </div>
      <p className="dh-sheet-mode">{MODE_INFO[mode].line}</p>
      {WORLDS.map((world, worldIndex) => (
        <section key={world.name} className="dh-sheet-world" data-world={worldIndex}>
          <h3>{world.name} · {world.time} <small>নতুন: {world.adds}</small></h3>
          <ol>
            {LEVELS.map((def, index) => ({ def, level: index + 1 })).filter(({ def }) => def.world === worldIndex).map(({ def, level }) => {
              const locked = level > open, earned = stars[level] ?? 0;
              return (
                <li key={level}>
                  <button type="button" disabled={locked} data-next={level === next ? "" : undefined} aria-current={level === current ? "true" : undefined} onClick={() => onPick(level)}
                    aria-label={`লেভেল ${bn(level)}, ${def.name}: ${def.title}${locked ? ", বন্ধ" : earned ? `, ${bn(earned)} তারা` : ""}`}>
                    <b className="dh-sheet-num">{locked ? <Lock /> : bn(level)}</b>
                    <span className="dh-sheet-name">{def.finale ? def.title : `${def.name} · ${def.title}`}{def.finale && <i>শেষ ধাপ</i>}{level === next && !locked && <em>এটা খেলো</em>}</span>
                    <span className="dh-sheet-teach">{def.teach}</span>
                    <span className="dh-sheet-stars" aria-hidden="true">{[0, 1, 2].map(star => <span key={star} data-on={star < earned}>★</span>)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      <button type="button" className="dh-sheet-endless" aria-current={current === 0 ? "true" : undefined} onClick={() => onPick(0)}>
        <b>{ENDLESS.title}</b><span>{ENDLESS.teach}{best !== null ? ` এই ফোনে সেরা ${bn(best)} মিটার।` : ""}</span>
      </button>
      <p className="dh-sheet-note">একটা লেভেল পার হলেই পরেরটা খোলে। মোট {bn(LEVEL_COUNT)}টা।</p>
    </div>
  );
}

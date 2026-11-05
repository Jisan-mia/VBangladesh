"use client";
// Under the rack on the start screen: which mode, which level (‹ ›), what is new in it (before → after), the facts,
// and সব লেভেল. The start action itself is the big bell above, the biggest thing on the screen.
import type { RefObject } from "react";
import { cardSizes } from "../../../shared/card-canvas";
import { LEVEL_COUNT, WORLDS, changes, finaleName, isFinale, levelAt, worldOf } from "../lib/levels";
import { bn, feat, bannerNote, type Shared } from "../lib/links";

export type Mode = "ladder" | "endless" | "daily";
const MODES: { id: Mode; label: string; line: string }[] = [
  { id: "ladder", label: "লেভেল", line: "২৪টা সুর, তিন আসরে। প্রতি লেভেলে একটা করে নতুন কিছু।" },
  { id: "endless", label: "অন্তহীন", line: "প্রতিবার একটা করে সুর বাড়ে। তিনটা ভুলে শেষ।" },
  { id: "daily", label: "রোজের সুর", line: "আজকের তারিখের সুর, সবার জন্য এক। তিনটা ভুলে শেষ।" },
];

export function StartCard({ mode, level, stars, canBack, canNext, friend, friendCanvas, onMode, onLevel, onSheet }: {
  mode: Mode; level: number; stars: number; canBack: boolean; canNext: boolean;
  friend: Shared | null; friendCanvas: RefObject<HTMLCanvasElement | null>;
  onMode: (mode: Mode) => void; onLevel: (level: number) => void; onSheet: () => void;
}) {
  const tap = (run: () => void) => (event: { currentTarget: HTMLButtonElement }) => { event.currentTarget.blur(); run(); };
  const spec = levelAt(level), finale = finaleName(level), chips = changes(level);
  return (
    <div className="gs-start">
      {friend && (
        <div className="gs-friend">
          <canvas ref={friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${feat(friend)}। বন্ধুর কার্ড।`} />
          <p><b>{feat(friend)}।</b> {bannerNote(friend)}</p>
        </div>
      )}
      {mode === "ladder" ? (
        <>
          <div className="gs-pick">
            <button type="button" className="gs-step" onClick={tap(() => onLevel(level - 1))} disabled={!canBack} aria-label="আগের লেভেল">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <div className="gs-pick-name">
              {finale && <span className="gs-finale-badge">শেষ সুর</span>}
              <h2>লেভেল {bn(level)}{finale ? `: ${finale}` : ""}</h2>
              <p>{WORLDS[worldOf(level)].name} · {bn(spec.phrases * spec.size)}টা সুর · {bn(spec.bells)}টা ঘণ্টা{stars ? ` · ${"★".repeat(stars)}` : ""}</p>
            </div>
            <button type="button" className="gs-step" onClick={tap(() => onLevel(level + 1))} disabled={!canNext || level >= LEVEL_COUNT} aria-label="পরের লেভেল">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <p className="gs-lesson">
            <b>{isFinale(level) ? "শেষ সুর" : level === 1 ? "শুরু" : "নতুন"}</b> {spec.lesson}
            {chips.length > 0 && <span className="gs-chips">{chips.slice(0, 2).map(chip => <i key={chip}>{chip}</i>)}</span>}
          </p>
          <button type="button" className="kit-link gs-all" onClick={tap(onSheet)}>সব লেভেল</button>
        </>
      ) : (
        <p className="gs-lesson">{MODES.find(item => item.id === mode)?.line}</p>
      )}
      <div className="gs-modes" role="radiogroup" aria-label="কীভাবে খেলবে">
        {MODES.map(item => (
          <button key={item.id} type="button" role="radio" aria-checked={mode === item.id} className="gs-chip" onClick={tap(() => onMode(item.id))}>{item.label}</button>
        ))}
      </div>
    </div>
  );
}

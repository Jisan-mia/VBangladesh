"use client";
// Under the shop on the start screen: which level (‹ ›), what is new in it (before → after), the facts, and সব লেভেল.
// The start action itself is the shop's tin shutter above (shop-game.tsx), the biggest thing on the screen.
import type { RefObject } from "react";
import { cardSizes } from "../../../shared/card-canvas";
import { changes, finaleName, isFinale, LEVEL_COUNT, WORLDS, worldOf } from "../lib/levels";
import { bn, feat, friendClaim, type Shared } from "../lib/link";
import type { Spec } from "../lib/levels";

export function StartInfo({ level, spec, lesson, old, stars, canBack, canNext, friend, friendCanvas, onLevel, onSheet }: {
  level: number; spec: Spec; lesson: string; old: boolean; stars: number; canBack: boolean; canNext: boolean;
  friend: Shared | null; friendCanvas: RefObject<HTMLCanvasElement | null>;
  onLevel: (level: number) => void; onSheet: () => void;
}) {
  const finale = old ? "" : finaleName(level);
  const chips = old ? [] : changes(level);
  const tap = (run: () => void) => (event: { currentTarget: HTMLButtonElement }) => { event.currentTarget.blur(); run(); };
  return (
    <div className="kn-start">
      {friend && (
        <div className="kn-friend">
          <canvas ref={friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${feat(friend)}। বন্ধুর কার্ড।`} />
          <p><b>{feat(friend)}।</b> {friendClaim(friend)}</p>
        </div>
      )}
      <div className="kn-pick">
        <button type="button" className="kn-step" onClick={tap(() => onLevel(level - 1))} disabled={!canBack} aria-label="আগের লেভেল">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <div className="kn-pick-name">
          {finale && <span className="kn-finale-badge">শেষ তাক</span>}
          <h2>লেভেল {bn(level)}{finale ? `: ${finale}` : ""}</h2>
          <p>{old ? "বন্ধুর পুরোনো লেভেল" : WORLDS[worldOf(level)].name} · {bn(spec.count)}টা জিনিস · {bn(spec.view)} সেকেন্ড দেখা{stars ? ` · ${"★".repeat(stars)}` : ""}</p>
        </div>
        <button type="button" className="kn-step" onClick={tap(() => onLevel(level + 1))} disabled={!canNext || level >= LEVEL_COUNT} aria-label="পরের লেভেল">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      {!old && (
        <p className="kn-lesson">
          <b>{isFinale(level) ? "শেষ তাক" : level === 1 ? "শুরু" : "নতুন"}</b> {lesson}
          {chips.length > 0 && <span className="kn-chips">{chips.slice(0, 2).map(chip => <i key={chip}>{chip}</i>)}</span>}
        </p>
      )}
      <button type="button" className="kit-link kn-all" onClick={tap(onSheet)}>সব লেভেল</button>
    </div>
  );
}

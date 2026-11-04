"use client";
// Under the cash box on the start screen: which level (‹ ›), what is new in it (before → after), the star targets, and
// সব লেভেল. The start action itself is the cash box above (hisab-play.tsx), the biggest thing on the screen.
import type { RefObject } from "react";
import { cardSizes } from "../../../shared/card-canvas";
import { finaleName, isFinale, LEVEL_COUNT, WORLD, worldOf, type Level } from "../lib/levels";
import { bn, feat, friendClaim, type Shared } from "../lib/link";

export function StartCard({ level, spec, stars, canBack, canNext, friend, friendCanvas, onLevel, onSheet }: {
  level: number; spec: Level; stars: number; canBack: boolean; canNext: boolean;
  friend: Shared | null; friendCanvas: RefObject<HTMLCanvasElement | null>;
  onLevel: (level: number) => void; onSheet: () => void;
}) {
  const finale = finaleName(level), world = WORLD[worldOf(level)];
  const tap = (run: () => void) => (event: { currentTarget: HTMLButtonElement }) => { event.currentTarget.blur(); run(); };
  return (
    <div className="mh-start">
      {friend && (
        <div className="mh-friend">
          <canvas ref={friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${feat(friend)}। বন্ধুর কার্ড।`} />
          <p><b>{feat(friend)}, {bn(friend.score)} পয়েন্ট।</b> {friendClaim(friend)}</p>
        </div>
      )}
      <div className="mh-pick">
        <button type="button" className="mh-step" onClick={tap(() => onLevel(level - 1))} disabled={!canBack} aria-label="আগের লেভেল">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <div className="mh-pick-name">
          {finale && <span className="mh-finale-badge">শেষ পাতা</span>}
          <h2>লেভেল {bn(level)}: {finale || spec.label}</h2>
          <p>{world.name} · ৬০ সেকেন্ড{stars ? ` · ${"★".repeat(stars)}` : ""}</p>
        </div>
        <button type="button" className="mh-step" onClick={tap(() => onLevel(level + 1))} disabled={!canNext || level >= LEVEL_COUNT} aria-label="পরের লেভেল">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <p className="mh-lesson">
        <b>{isFinale(level) ? "শেষ পাতা" : level === 1 ? "শুরু" : "নতুন"}</b> {spec.lesson}
        {spec.chip && <span className="mh-chips"><i>{spec.chip}</i></span>}
      </p>
      <p className="mh-targets" aria-label={`${bn(spec.stars[0])}টা ঠিক হলে লেভেল পার, ${bn(spec.stars[1])}টায় ২ তারা, ${bn(spec.stars[2])}টায় ৩ তারা`}>
        <span>★ {bn(spec.stars[0])}</span><span>★★ {bn(spec.stars[1])}</span><span>★★★ {bn(spec.stars[2])}</span><small>টা ঠিক · ভুলে ৩ সেকেন্ড কাটে</small>
      </p>
      <button type="button" className="kit-link mh-all" onClick={tap(onSheet)}>সব লেভেল</button>
    </div>
  );
}

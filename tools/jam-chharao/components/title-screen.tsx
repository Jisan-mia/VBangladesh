"use client";
// The title: the jam itself, drawn in code, is the start button, with a number-plate stamp খেলো across its foot. Under it,
// small: ‹ jam › with its name, what is new and the three-star target, and সব জ্যাম. A friend's card sits on top on a link.
import type { RefObject } from "react";
import { cardSizes } from "../../../shared/card-canvas";
import { layoutOf, parOf } from "../lib/game";
import { bn, feat, jamLabel, type Shared } from "../lib/link";
import { drawPoster } from "../lib/story-art";
import { infoOf, isFinale, worldIndex, worldOf } from "../lib/worlds";
import { ArtCanvas } from "./art-canvas";

export function TitleScreen({ level, legacy, stars, friend, friendCanvas, allStars, total, prev, next, onStart, onLevel, onSheet }: {
  level: number; legacy: boolean; stars: number; friend: Shared | null; friendCanvas: RefObject<HTMLCanvasElement | null>;
  allStars: number; total: number; prev: number; next: number;
  onStart: () => void; onLevel: (level: number) => void; onSheet: () => void;
}) {
  const lay = layoutOf(level, legacy), par = parOf(level, legacy), index = legacy ? 0 : worldIndex(level);
  const info = legacy ? null : infoOf(level), world = legacy ? null : worldOf(level);
  const firstOfStreet = world !== null && level === world.from;
  return (
    <div className="jc-title">
      {friend && (
        <section className="jc-friend" aria-labelledby="jc-friend-title">
          <canvas ref={friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${feat(friend)}। বন্ধুর কার্ড।`} />
          <div>
            <h2 id="jc-friend-title">{feat(friend)}।</h2>
            <p>একই জ্যাম, এবার তোমার পালা। চালগুলো মিলিয়ে দেখেছি, হিসাব সত্যি।</p>
          </div>
        </section>
      )}
      <button type="button" className="jc-start" onClick={onStart} aria-label={`খেলো: ${jamLabel(level, legacy)}`}>
        <ArtCanvas className="jc-start-art" deps={`${level}-${legacy}`} label="জ্যামে আটকা রাস্তা, সবুজ CNG আছে মাঝে" draw={(canvas, width, height) => drawPoster(canvas, width, height, lay, index)} />
        <span aria-hidden="true">খেলো</span>
      </button>
      <div className="jc-pick">
        <button type="button" onClick={() => onLevel(prev)} disabled={!prev || legacy} aria-label="আগের জ্যাম">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <b>{jamLabel(level, legacy)}{stars ? <i aria-label={`${bn(stars)} তারা`}> {"★".repeat(stars)}</i> : null}</b>
        <button type="button" onClick={() => onLevel(next)} disabled={!next || legacy} aria-label="পরের জ্যাম">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <p className="jc-line">
        {legacy ? (<><b>বন্ধুর পাঠানো পুরোনো জ্যাম</b><span>৩ তারা: {bn(par)} চালের মধ্যে</span></>) : (<>
          {isFinale(level) && <em className="jc-finale-tag">শেষ জ্যাম</em>}
          <b>{info!.name}</b>{firstOfStreet ? <> · <span className="jc-new">নতুন: {world!.adds}</span></> : null}
          <span>{info!.teach}</span>
          <span>৩ তারা: {bn(par)} চালের মধ্যে · {world!.name}</span>
        </>)}
      </p>
      <button type="button" className="kit-link jc-all" onClick={onSheet}>সব জ্যাম · ★ {bn(allStars)}/{bn(total)}</button>
    </div>
  );
}

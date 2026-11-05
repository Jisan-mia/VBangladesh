"use client";
// The title: the level's cloth patch, drawn in code, is the start button. Under it, small: ‹ level ›, the one new thing,
// নানির ফোঁড় when there are some, and সব লেভেল. A friend's card sits on top on a challenge link.
import type { RefObject } from "react";
import { cardSizes } from "../../../shared/card-canvas";
import { drawPatchTitle } from "../lib/art";
import { infoOf, sizeText, worldIndex, worldInfo } from "../lib/levels";
import { bn, feat, pictureName, type Shared } from "../lib/link";
import { ArtCanvas } from "./art-canvas";

export function TitleScreen({ level, stars, friend, friendCanvas, slow, allStars, total, prev, next, onStart, onLevel, onSheet }: {
  level: number; stars: number; friend: Shared | null; friendCanvas: RefObject<HTMLCanvasElement | null>;
  slow: boolean; allStars: number; total: number; prev: number; next: number;
  onStart: () => void; onLevel: (level: number) => void; onSheet: () => void;
}) {
  const info = infoOf(level), world = worldInfo(level), index = worldIndex(level), cleared = stars > 0;
  return (
    <div className="cp-title">
      {friend && (
        <section className="cp-friend" aria-labelledby="cp-friend-title">
          <canvas ref={friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${feat(friend)}। বন্ধুর কার্ড।`} />
          <div>
            <h2 id="cp-friend-title">{feat(friend)}।</h2>
            <p>একই ছবির ধাঁধা, এবার তোমার পালা। সময়টা বন্ধুর নিজের ফোনের হিসাব।</p>
          </div>
        </section>
      )}
      <button type="button" className="cp-start" onClick={onStart}>
        <ArtCanvas className="cp-start-art" draw={(canvas, width, height) => drawPatchTitle(canvas, width, height, level, index, cleared)} deps={`${level}:${cleared}`}
          label={cleared ? `কাঁথার টুকরোয় ফোটা ছবি: ${pictureName(level)}` : `কাঁথার খালি টুকরো, ${sizeText(level)} ঘর`} />
        <span>ফোটাও</span>
      </button>
      <div className="cp-pick" role="group" aria-label="লেভেল বাছো">
        <button type="button" onClick={() => onLevel(prev)} disabled={!prev} aria-label="আগের লেভেল">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <b>লেভেল {bn(level)} · {sizeText(level)}</b>
        <button type="button" onClick={() => onLevel(next)} disabled={!next} aria-label="পরের লেভেল">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <p className="cp-line">
        {info.finale ? <em className="cp-tag cp-tag-finale">শেষ ছবি</em> : info.fresh ? <em className="cp-tag">নতুন: {info.fresh}</em> : null}
        {info.teach}
        <span>
          {world.name}{cleared ? ` · ${pictureName(level)} · তোমার ${"★".repeat(stars)}` : ""}
          {info.given ? ` · নানির ফোঁড় ${bn(info.given)}টা` : ""}
        </span>
      </p>
      <p className="cp-three">৩ তারা: একটাও ভুল ঘর না ভরে, হিন্ট ছাড়া।</p>
      {slow && <p className="cp-calm">ধীরে খেলো চালু: ঝলক আর কাঁপুনি নেই, তারার নিয়ম একই।</p>}
      <button type="button" className="kit-link cp-all" onClick={onSheet}>সব লেভেল · ★ {bn(allStars)}/{bn(total)}</button>
    </div>
  );
}

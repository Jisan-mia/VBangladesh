"use client";
// The title: the level's finished painting, in the lid of a cardboard box, is the start button. Under it, small: ‹ level ›,
// the one new thing and the three-star time, and সব লেভেল. A friend's card sits on top on a challenge link.
import type { RefObject } from "react";
import { cardSizes } from "../../../shared/card-canvas";
import { drawLid } from "../lib/art";
import { parFor, planOf } from "../lib/game";
import { infoOf, worldIndex, worldInfo } from "../lib/levels";
import { bn, feat, paintingName, sizeText, timeText, type Shared } from "../lib/link";
import { ArtCanvas } from "./art-canvas";

export function TitleScreen({ level, stars, friend, friendCanvas, slow, allStars, total, prev, next, onStart, onLevel, onSheet }: {
  level: number; stars: number; friend: Shared | null; friendCanvas: RefObject<HTMLCanvasElement | null>;
  slow: boolean; allStars: number; total: number; prev: number; next: number;
  onStart: () => void; onLevel: (level: number) => void; onSheet: () => void;
}) {
  const info = infoOf(level), world = worldInfo(level), index = worldIndex(level), { n, rotate } = planOf(level);
  return (
    <div className="ct-title">
      {friend && (
        <section className="ct-friend" aria-labelledby="ct-friend-title">
          <canvas ref={friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${feat(friend)}। বন্ধুর কার্ড।`} />
          <div>
            <h2 id="ct-friend-title">{feat(friend)}।</h2>
            <p>একই ছবি, একই টুকরো, এবার তোমার পালা। সময়টা বন্ধুর নিজের ফোনের হিসাব।</p>
          </div>
        </section>
      )}
      <button type="button" className="ct-start" onClick={onStart}>
        <ArtCanvas className="ct-start-art" draw={(canvas, width, height) => drawLid(canvas, width, height, level, index)} deps={String(level)}
          label={`বাক্সের ঢাকনায় ছবি: ${paintingName(level)}, ${bn(n * n)} টুকরো`} />
        <span>খেলো</span>
      </button>
      <div className="ct-pick" role="group" aria-label="লেভেল বাছো">
        <button type="button" onClick={() => onLevel(prev)} disabled={!prev} aria-label="আগের লেভেল">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <b>লেভেল {bn(level)} · {sizeText(level)}{rotate ? " · ঘোরানো" : ""}</b>
        <button type="button" onClick={() => onLevel(next)} disabled={!next} aria-label="পরের লেভেল">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <p className="ct-line">
        {info.finale ? <em className="ct-tag ct-tag-finale">শেষ ছবি</em> : info.fresh ? <em className="ct-tag">নতুন</em> : null}
        <b>{info.name}।</b> {info.teach}
        <span>{world.name} · {timeText(parFor(level))}ের মধ্যে ৩ তারা{stars ? ` · তোমার ${"★".repeat(stars)}` : ""}</span>
      </p>
      {slow && <p className="ct-calm">ধীরে খেলো চালু: টুকরো উড়ে আসে না, তারার নিয়ম একই।</p>}
      <button type="button" className="kit-link ct-all" onClick={onSheet}>সব লেভেল · ★ {bn(allStars)}/{bn(total)}</button>
    </div>
  );
}

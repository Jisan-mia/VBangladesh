"use client";
// The title: the world's plate, solved, is the start button. Under it, small: ‹ level ›, one line on what's new and the
// three-star target, and সব লেভেল. A friend's card sits on top on a challenge link.
import type { RefObject } from "react";
import { cardSizes } from "../../../shared/card-canvas";
import { solvedBoard } from "../lib/board";
import { drawTitlePlate, paletteOf } from "../lib/art";
import { threeStar } from "../lib/game";
import { infoOf, worldIndex, worldOf } from "../lib/levels";
import { bn, feat, sizeLabel, type Shared } from "../lib/link";
import { ArtCanvas } from "./art-canvas";

export function TitleScreen({ level, stars, sheet, friend, friendCanvas, slow, allStars, total, prev, next, onStart, onLevel, onSheet }: {
  level: number; stars: number; sheet: HTMLCanvasElement | null; friend: Shared | null; friendCanvas: RefObject<HTMLCanvasElement | null>;
  slow: boolean; allStars: number; total: number; prev: number; next: number;
  onStart: () => void; onLevel: (level: number) => void; onSheet: () => void;
}) {
  const info = infoOf(level), world = worldOf(level), index = worldIndex(level), size = world.size;
  const draw = (canvas: HTMLCanvasElement, width: number, height: number) =>
    drawTitlePlate(canvas, width, height, solvedBoard(size), paletteOf(index), info.look === "digits" ? null : sheet, info.look);
  return (
    <div className="pg-title">
      {friend && (
        <section className="pg-friend" aria-labelledby="pg-friend-title">
          <canvas ref={friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${feat(friend)}। বন্ধুর কার্ড।`} />
          <div>
            <h2 id="pg-friend-title">{feat(friend)}।</h2>
            <p>একই এলোমেলো প্লেট, এবার তোমার পালা। চালগুলো মিলিয়ে দেখেছি, হিসাব সত্যি।</p>
          </div>
        </section>
      )}
      <button type="button" className="pg-start" onClick={onStart}>
        <ArtCanvas className="pg-start-art" draw={draw} deps={`${level}|${index}|${info.look}|${sheet ? 1 : 0}`}
          label={`${world.tin}ের ${sizeLabel(level)} প্লেট${info.look === "digits" ? "" : `, ছবিতে ${world.thing}`}`} />
        <span>খেলো</span>
      </button>
      <div className="pg-pick" role="group" aria-label="লেভেল বাছো">
        <button type="button" onClick={() => onLevel(prev)} disabled={!prev} aria-label="আগের লেভেল">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <b>লেভেল {bn(level)} · {sizeLabel(level)}</b>
        <button type="button" onClick={() => onLevel(next)} disabled={!next} aria-label="পরের লেভেল">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <p className="pg-line">
        {info.finale && <em className="pg-finale-tag">শেষ প্লেট</em>}
        <b>{info.name}।</b> {info.teach}
        <span>{bn(threeStar(level))} চালের মধ্যে ৩ তারা{stars ? ` · তোমার ${"★".repeat(stars)}` : ""}</span>
      </p>
      {slow && <p className="pg-calm">ধীরে খেলো চালু: ঘুঁটি উড়ে আসে না, তারার নিয়ম একই।</p>}
      <button type="button" className="kit-link pg-all" onClick={onSheet}>সব লেভেল · ★ {bn(allStars)}/{bn(total)}</button>
    </div>
  );
}

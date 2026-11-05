"use client";
// The start card over the stage. The biggest thing on it is the level's own orchard, every bush still covered, with the
// wooden sign "বাগানে ঢোকো" across it: pressing it is the start, and the gardener's path opens. Above it: ‹ level › with its
// name and orchard, the world's new kind of bush, and the level's one new thing. A friend's claim sits on top.
import { WORLDS, isFinale, levelOf, worldOf } from "../lib/levels";
import { bannerNote, bn, feat, sizeLabel, timeText, type Shared } from "../lib/challenge";
import type { Puzzle } from "../lib/play";
import { OrchardView } from "./orchard-view";

export function StartCard({ puzzle, stars, total, of, reach, friend, onLevel, onStart, onSheet, onHome }: {
  puzzle: Puzzle; stars: number; total: number; of: number;
  reach: (level: number) => boolean;
  friend: Shared | null;
  onLevel: (level: number) => void; onStart: () => void; onSheet: () => void; onHome: () => void;
}) {
  const { level, legacy, orchard, par } = puzzle;
  const info = legacy ? null : levelOf(level), world = legacy ? 1 : worldOf(level), house = WORLDS[world - 1];
  const finale = !legacy && isFinale(level) ? info?.finale : undefined;
  return (
    <section className="bc-start" aria-labelledby="bc-start-title">
      <header className="bc-mast">
        <p>ভিমরুলের চাক</p>
        <p className="bc-mast-stars" aria-label={`মোট ${bn(total)}টা তারা, ${bn(of)}টার মধ্যে`}>★ {bn(total)}/{bn(of)}</p>
      </header>

      {friend && (
        <div className="bc-friend">
          <p><b>{feat(friend)}।</b></p>
          <p>{bannerNote(friend)}</p>
        </div>
      )}

      <div className="bc-pick">
        {legacy ? <span /> : (
          <button type="button" className="bc-step" onClick={() => onLevel(level - 1)} disabled={!reach(level - 1)} aria-label="আগের লেভেল">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
        )}
        <div className="bc-pick-name">
          {finale && <p className="bc-finale-badge">শেষ বাগান</p>}
          <h2 id="bc-start-title">{legacy ? "বন্ধুর বাগান" : finale ?? info?.name}</h2>
          <p>{legacy ? `পুরোনো লেভেল ${bn(level)}` : `লেভেল ${bn(level)} · ${house.name}`}{stars ? ` · ${"★".repeat(stars)}${"☆".repeat(3 - stars)}` : ""}</p>
        </div>
        {legacy ? <span /> : (
          <button type="button" className="bc-step" onClick={() => onLevel(level + 1)} disabled={!reach(level + 1)} aria-label="পরের লেভেল">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        )}
      </div>

      <button type="button" className="bc-go" onClick={onStart} data-first>
        <span className="bc-go-board"><OrchardView orchard={orchard} cells={new Uint8Array(orchard.cols * orchard.rows)} status="ready" preview /></span>
        <span className="bc-go-sign"><b>বাগানে ঢোকো</b><kbd aria-hidden="true">Enter</kbd></span>
      </button>

      {!legacy && house.rule && (
        <p className="bc-rule" data-world={world}>
          <i className="bc-rule-ico" data-kind={world === 2 ? "mango" : "post"} aria-hidden="true">{world === 3 ? bn(1) : null}</i>
          <span><b>{house.ruleName}:</b> {house.rule}</span>
        </p>
      )}
      <p className="bc-lesson">
        {legacy ? <><b>পুরোনো বাগান</b> তোমার বন্ধু যেখানে প্রথম চেপেছিল, পথ সেখান থেকে খোলে।</>
          : <><b>{finale ? "শেষ বাগান" : "নতুন"}</b> {info?.line}</>}
      </p>
      <p className="bc-start-foot">
        <span>{sizeLabel(level, legacy)} · ৩ তারা {timeText(par)}ে</span>
        {legacy ? <button type="button" className="kit-link" onClick={onHome}>নিজের লেভেলে ফেরো</button>
          : <button type="button" className="kit-link" onClick={onSheet}>সব লেভেল</button>}
      </p>
    </section>
  );
}

"use client";
// The start card over the stage. The biggest thing on it is the level's own board, still dark, with the brass main switch
// across it: pressing it is the start. Above: ‹ level › with its name and house, the house's rule, and the one new thing.
import type { RefObject } from "react";
import { cardSizes } from "../../../shared/card-canvas";
import { WORLDS, isFinale, worldOf, type Level } from "../lib/levels";
import { bn, feat, type Shared } from "../lib/link";
import { starLimits, type Puzzle } from "../lib/play";
import { BoardView } from "./board-view";

export type StartProps = {
  puzzle: Puzzle;
  info: Level | null;
  stars: number;
  /** Your own open level, and a friend's level you may visit. */
  open: number;
  visit: number;
  total: number;
  of: number;
  friend: Shared | null;
  friendCanvas: RefObject<HTMLCanvasElement | null>;
  onLevel: (level: number) => void;
  onStart: () => void;
  onSheet: () => void;
  onHome: () => void;
};

export function StartCard(props: StartProps) {
  const { puzzle, info } = props;
  const level = puzzle.level, legacy = puzzle.legacy;
  const world = legacy ? 0 : worldOf(level) - 1, house = WORLDS[world];
  const reach = (to: number) => to >= 1 && to <= 30 && (to <= props.open || to === props.visit);
  const { three, two } = starLimits(puzzle.par);
  const finale = !legacy && isFinale(level) ? info?.finale : undefined;
  return (
    <section className="sb-start" aria-labelledby="sb-start-title">
      <header className="sb-mast">
        <p>সুইচবোর্ড <span aria-hidden="true">·</span> বাতি জ্বালানোর ধাঁধা</p>
        <p className="sb-mast-stars" aria-label={`মোট ${bn(props.total)}টা তারা, ${bn(props.of)}টার মধ্যে`}>★ {bn(props.total)}/{bn(props.of)}</p>
      </header>

      {props.friend && (
        <div className="sb-friend">
          <canvas ref={props.friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${feat(props.friend)}। বন্ধুর কার্ড।`} />
          <p><b>{feat(props.friend)}।</b> চালগুলো মিলিয়ে দেখেছি, সংখ্যাটা সত্যি। একই বোর্ড, এবার তোমার পালা।</p>
        </div>
      )}

      {legacy ? (
        <div className="sb-pick">
          <span />
          <div className="sb-pick-name">
            <h2 id="sb-start-title">বন্ধুর বোর্ড</h2>
            <p>পুরোনো লেভেল {bn(level)} · {bn(puzzle.board.size)}×{bn(puzzle.board.size)}</p>
          </div>
          <span />
        </div>
      ) : (
        <div className="sb-pick">
          <button type="button" className="sb-step" onClick={() => props.onLevel(level - 1)} disabled={!reach(level - 1)} aria-label="আগের লেভেল">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <div className="sb-pick-name">
            {finale && <p className="sb-badge-finale">শেষ বোর্ড</p>}
            <h2 id="sb-start-title">{finale ?? info?.name}</h2>
            <p>লেভেল {bn(level)} · {house.name}{props.stars ? ` · ${"★".repeat(props.stars)}${"☆".repeat(3 - props.stars)}` : ""}</p>
          </div>
          <button type="button" className="sb-step" onClick={() => props.onLevel(level + 1)} disabled={!reach(level + 1)} aria-label="পরের লেভেল">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}

      {!legacy && house.rule && (
        <p className="sb-rule" data-world={world}>
          <svg viewBox="0 0 40 40" aria-hidden="true">{world === 1
            ? <><circle cx="20" cy="20" r="14" className="sb-rule-plate" /><path d="M3 15.5 37 12.5 38 26 4 28.5Z" className="sb-rule-tape" /></>
            : <><rect x="4" y="8" width="10" height="24" rx="4" className="sb-rule-plate" /><path d="M14 20h24" className="sb-rule-wire" />{[20, 27, 34].map(x => <circle key={x} cx={x} cy="20" r="3.4" className="sb-rule-bulb" />)}</>}
          </svg>
          <span><b>{house.of} নিয়ম:</b> {house.rule}</span>
        </p>
      )}
      <p className="sb-lesson">{legacy ? <><b>পুরোনো বোর্ড</b> সোজা তার: একটা সুইচ ওর বাতি আর চার পাশের বাতি উল্টায়।</> : <><b>{finale ? "চ্যালেঞ্জ" : "নতুন"}</b> {info?.line}</>}</p>

      <button type="button" className="sb-go" onClick={props.onStart} data-first>
        <span className="sb-go-board"><BoardView board={puzzle.board} lit={0} moves={[]} preview /></span>
        <span className="sb-go-label"><span className="sb-mains" aria-hidden="true"><i /></span>শুরু করো<kbd aria-hidden="true">Enter</kbd></span>
      </button>

      <p className="sb-start-foot">
        <span>সেরা {bn(three)} চাল · {bn(two)} পর্যন্ত ★★</span>
        {legacy
          ? <button type="button" className="kit-link" onClick={props.onHome}>নিজের লেভেলে ফেরো</button>
          : <button type="button" className="kit-link" onClick={props.onSheet}>সব লেভেল</button>}
      </p>
    </section>
  );
}

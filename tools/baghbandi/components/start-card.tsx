"use client";
// The start card over the stage. The biggest thing on it is the level's own first position on its world's clay, and it is the
// start button. Under the title: the three sides (numbered, each with what it means), then ‹ level › with its one new thing.
import type { RefObject } from "react";
import { cardSizes } from "../../../shared/card-canvas";
import type { Game, Mode } from "../lib/game";
import { WORLDS, worldOf, type Level } from "../lib/levels";
import { bn, feat, type Shared } from "../lib/link";
import { starRule } from "../lib/result";
import { Seed, Tiger, YardPreview } from "./yard";

export const SIDES: ReadonlyArray<{ mode: Mode; label: string; line: string }> = [
  { mode: 1, label: "বাঘ হয়ে", line: "তুমি বাঘ, ছাগল চালাবে বট। লাফ দিয়ে ছাগল ধরো।" },
  { mode: 2, label: "ছাগল হয়ে", line: "তুমি ছাগল, বাঘ চালাবে বট। ঘিরে ধরে বাঘ আটকাও।" },
  { mode: 0, label: "দুজনে", line: "এক ফোনে দুজন। পালা করে চালো, ফোন হাতবদল করো।" },
];

export type StartProps = {
  game: Game;
  mode: Mode;
  level: number;
  info: Level | null;
  stars: number;
  /** Your own open level on this side, and a friend's level you may visit. */
  open: number;
  visit: number;
  total: number;
  of: number;
  newcomer: boolean;
  friend: Shared | null;
  friendCanvas: RefObject<HTMLCanvasElement | null>;
  onMode: (mode: Mode) => void;
  onLevel: (level: number) => void;
  onStart: () => void;
  onSheet: () => void;
};

export function StartCard(props: StartProps) {
  const { game, mode, level, info } = props;
  const world = mode === 0 ? 1 : worldOf(level) - 1;
  const side = SIDES.find(choice => choice.mode === mode)!;
  const reach = (to: number) => to >= 1 && to <= 12 && (to <= props.open || to === props.visit);
  const rule = starRule(game);
  return (
    <section className="bb-start" data-world={world} aria-labelledby="bb-start-title">
      <header className="bb-mast">
        <p>বাঘবন্দি <span aria-hidden="true">·</span> উঠোনের খেলা</p>
        {mode !== 0 && <p className="bb-mast-stars" aria-label={`মোট ${bn(props.total)}টা তারা, ${bn(props.of)}টার মধ্যে`}>★ {bn(props.total)}/{bn(props.of)}</p>}
      </header>

      {props.friend && (
        <div className="bb-friend">
          <canvas ref={props.friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${feat(props.friend)}। বন্ধুর শেষ উঠোন।`} />
          <p><b>{feat(props.friend)}।</b> চালগুলো মিলিয়ে দেখেছি, ফলটা সত্যি। একই শুরু, একই বট, এবার তোমার পালা।</p>
        </div>
      )}

      <div className="bb-sides" role="radiogroup" aria-label="কী হয়ে খেলবে">
        {SIDES.map((choice, index) => (
          <button key={choice.mode} type="button" role="radio" aria-checked={mode === choice.mode} onClick={() => props.onMode(choice.mode)}>
            <small aria-hidden="true">{bn(index + 1)}</small>
            <svg viewBox="-40 -40 80 80" aria-hidden="true">{choice.mode === 2 ? <Seed /> : <Tiger />}</svg>
            {choice.label}
            {props.newcomer && choice.mode === 1 && <em>প্রথমবার? এখান থেকে</em>}
          </button>
        ))}
      </div>
      <p className="bb-side-line">{side.line}</p>

      {info ? (
        <div className="bb-pick">
          <button type="button" className="bb-step" onClick={() => props.onLevel(level - 1)} disabled={!reach(level - 1)} aria-label="আগের লেভেল">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <div className="bb-pick-name">
            {info.finale && <p className="bb-badge-finale">শেষ ধাপ</p>}
            <h2 id="bb-start-title">{info.finale ?? info.name}</h2>
            <p>{info.finale ? `${info.name} · ` : `লেভেল ${bn(level)} · `}{WORLDS[worldOf(level) - 1].name}{props.stars ? ` · ${"★".repeat(props.stars)}${"☆".repeat(3 - props.stars)}` : ""}</p>
          </div>
          <button type="button" className="bb-step" onClick={() => props.onLevel(level + 1)} disabled={!reach(level + 1)} aria-label="পরের লেভেল">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      ) : <h2 id="bb-start-title" className="bb-pick-two">পুরো খেলা, দুজনে</h2>}
      <p className="bb-lesson">{info ? <><b>{info.finale ? "চ্যালেঞ্জ" : "নতুন"}</b> {info.line}</> : "ছাগল আগে চালে। বাঘ ৮টা ধরলে বাঘের জিত, আটকা পড়লে বা ১২০ চাল টিকে গেলে ছাগলের।"}</p>

      <button type="button" className="bb-go" onClick={props.onStart} data-first>
        <span className="bb-go-yard"><YardPreview game={game} world={world} /></span>
        <span className="bb-go-label">শুরু করো<kbd aria-hidden="true">Enter</kbd></span>
      </button>

      <p className="bb-start-foot">
        {rule && <span>{rule}</span>}
        {mode !== 0 && <button type="button" className="kit-link" onClick={props.onSheet}>সব লেভেল</button>}
      </p>
    </section>
  );
}

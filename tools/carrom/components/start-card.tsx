"use client";
// The start card over the board. The biggest thing on it is the striker itself, drawn as the button that starts play.
// Under it, small: the way to play, the difficulty with its one-line promise, and the board with its lesson and par.
import type { RefObject } from "react";
import { cardSizes } from "../../../shared/card-canvas";
import { possessive } from "../../../shared/bangla";
import { HAND_LINE, HAND_NAME, HANDS } from "../lib/guide";
import { LEVEL_COUNT, LEVELS, WORLDS } from "../lib/levels";
import { banner, bn, RULES, SOLO_RULE, type Shared } from "../lib/link";
import type { Hand, Mode } from "../lib/game";

const MODES: ReadonlyArray<{ mode: Mode; name: string }> = [
  { mode: "level", name: "একা" },
  { mode: "board", name: "দশ চাল" },
  { mode: "duo", name: "দুজনে" },
];

/** The striker, seen from above: cream with its green turned rings, a coin dropping into the pocket beside it. */
function StrikerArt() {
  return (
    <svg className="cr-start-art" viewBox="0 0 200 200" aria-hidden="true">
      <circle cx="174" cy="26" r="20" className="pocket" />
      <circle cx="162" cy="40" r="11" className="coin" />
      <circle cx="162" cy="40" r="5.5" className="coin-ring" />
      <path d="M146 58 L132 74" className="trail" />
      <circle cx="94" cy="116" r="64" className="shadow" />
      <circle cx="88" cy="110" r="64" className="disc" />
      <circle cx="88" cy="110" r="60" className="edge" />
      <circle cx="88" cy="110" r="44" className="ring" />
      <circle cx="88" cy="110" r="26" className="ring thin" />
      <circle cx="88" cy="110" r="10" className="dot" />
      <path d="M48 74 A52 52 0 0 1 76 56" className="shine" />
    </svg>
  );
}

export type StartProps = {
  mode: Mode;
  level: number;
  hand: Hand;
  stars: number;
  /** The previous and next boards you may play (0: none). */
  prev: number;
  next: number;
  friend: Shared | null;
  friendHere: boolean;
  friendCanvas: RefObject<HTMLCanvasElement | null>;
  onStart: () => void;
  onMode: (mode: Mode) => void;
  onHand: (hand: Hand) => void;
  onLevel: (level: number) => void;
  onSheet: () => void;
};

export function StartCard(props: StartProps) {
  const { mode, level, hand, friend, friendHere } = props;
  const spec = mode === "level" ? LEVELS[level - 1] : null;
  const title = spec ? spec.name : mode === "board" ? "দশ চাল" : "দুজনে, এক ফোনে";
  const lesson = spec ? spec.lesson : mode === "board" ? SOLO_RULE : "সাদা আগে মারে, নিচে থেকে। পালা বদলালে বোর্ড ঘুরে যায়, ফোনটা অন্যজনের হাতে দাও।";
  return (
    <section className="cr-start" aria-labelledby="cr-start-title" data-finale={spec?.boss ? "" : undefined}>
      {friend && friendHere && (
        <div className="cr-friend">
          <canvas ref={props.friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label="বন্ধুর কার্ড" />
          <p><b>{banner(friend)}</b> {friend.mode !== "duo" && <span>{possessive(friend.name || "বন্ধু")} নিজের ফোনের ফল।</span>}</p>
        </div>
      )}

      <div className="cr-start-head">
        {spec ? (
          <p className="cr-where">
            <button type="button" className="cr-step" onClick={() => props.onLevel(props.prev)} disabled={!props.prev} aria-label="আগের বোর্ড">‹</button>
            <span>{WORLDS[spec.world].name} · বোর্ড {bn(level)}/{bn(LEVEL_COUNT)}</span>
            <button type="button" className="cr-step" onClick={() => props.onLevel(props.next)} disabled={!props.next} aria-label="পরের বোর্ড">›</button>
          </p>
        ) : <p className="cr-where"><span>ক্যারম</span></p>}
        {spec?.boss && <p className="cr-boss-tag">শেষ বোর্ড</p>}
        <h2 id="cr-start-title">{title}</h2>
        <p className="cr-lesson">{spec?.boss ? spec.boss.line : lesson}</p>
        {spec?.boss && <p className="cr-lesson cr-small">{spec.lesson}</p>}
      </div>

      <button type="button" className="cr-start-go" onClick={props.onStart} data-first>
        <StrikerArt />
        <span>শুরু করো</span>
      </button>

      {spec && (
        <p className="cr-par" aria-label={`তিন তারা ${bn(spec.par)} চালে, দুই তারা ${bn(spec.two)} চালে, মোট ${bn(spec.strikes)} চাল`}>
          <span>★★★ {bn(spec.par)} চালে</span><span>★★ {bn(spec.two)} চালে</span><span>মোট {bn(spec.strikes)} চাল</span>
          {props.stars > 0 && <b>তোমার {"★".repeat(props.stars)}</b>}
        </p>
      )}

      <div className="cr-chips" role="group" aria-label="কীভাবে খেলবে">
        {MODES.map(item => (
          <button key={item.mode} type="button" aria-pressed={mode === item.mode} onClick={() => props.onMode(item.mode)}>
            {item.name}{item.mode === "level" && <small>সুপারিশ</small>}
          </button>
        ))}
      </div>
      <div className="cr-chips cr-hands" role="group" aria-label="কতটা সাহায্য">
        {HANDS.map((item, index) => (
          <button key={item} type="button" aria-pressed={hand === item} onClick={() => props.onHand(item)}>
            <kbd aria-hidden="true">{bn(index + 1)}</kbd>{HAND_NAME[item]}
          </button>
        ))}
      </div>
      <p className="cr-hand-line">{HAND_LINE[hand]}</p>
      {mode === "duo" && (
        <details className="cr-rules">
          <summary>আমাদের নিয়ম</summary>
          <ol>{RULES.map(rule => <li key={rule}>{rule}</li>)}</ol>
        </details>
      )}
      <button type="button" className="kit-link cr-all" onClick={props.onSheet}>সব বোর্ড</button>
    </section>
  );
}

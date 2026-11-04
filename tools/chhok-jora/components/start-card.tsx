"use client";
// The start card over the stage. The biggest thing on it is the level's own cloth, with its opening stitches and a needle,
// and it is the start button. Above it: the three modes (numbered, each with one line), then ‹ level › with its one new thing.
import type { RefObject } from "react";
import { cardSizes } from "../../../shared/card-canvas";
import { MAX_NAME } from "../../../shared/game-core";
import { LOOKS } from "../lib/art";
import { PAIR_SIZES, WORLDS, worldOf, type Level, type PairSize } from "../lib/levels";
import { bn, feat, type Shared } from "../lib/challenge";
import { starRule } from "../lib/result";
import type { Game } from "../lib/quilt";
import type { Mode } from "../lib/save";
import { ClothBoard, Motif } from "./cloth";

export const MODES: ReadonlyArray<{ mode: Mode; label: string; line: string }> = [
  { mode: "solo", label: "একা", line: "লেভেল ধরে এগোও। প্রতি লেভেলে নতুন একটা কিছু।" },
  { mode: "pair", label: "দুজনে", line: "এক ফোনে দুজন। পালা এলে ফোনটা হাতবদল করো।" },
  { mode: "kata", label: "কাটাকুটি", line: "৩×৩ ঘরে ✕ আর ○, তিন রকম বটের সাথে।" },
];
const SIZE_WORDS: Record<PairSize, string> = { 3: "ছোট", 4: "চেনা", 5: "বড়" };

export type StartProps = {
  mode: Mode;
  level: number;
  info: Level | null;
  game: Game;
  stars: number;
  open: number;
  visit: number;
  total: number;
  of: number;
  newcomer: boolean;
  size: PairSize;
  names: readonly [string, string];
  friend: Shared | null;
  friendCanvas: RefObject<HTMLCanvasElement | null>;
  onMode: (mode: Mode) => void;
  onLevel: (level: number) => void;
  onSize: (size: PairSize) => void;
  onNames: (names: [string, string]) => void;
  onStart: () => void;
  onSheet: () => void;
};

/** কাটাকুটি's own start picture: a 3×3 patch with a cross and a ring. */
function KataPatch() {
  const look = LOOKS[0];
  return (
    <svg className="cj-svg" viewBox="0 0 300 300" aria-hidden="true">
      <rect width="300" height="300" rx="14" fill={look.cloth} />
      {[1, 2].map(line => <g key={line} stroke={look.thread} strokeWidth="5" strokeDasharray="10 9" strokeLinecap="round">
        <line x1={100 * line} y1="22" x2={100 * line} y2="278" /><line x1="22" y1={100 * line} x2="278" y2={100 * line} />
      </g>)}
      <g transform="translate(150 150)" stroke={look.players[0]} strokeWidth="9" strokeLinecap="round" strokeDasharray="13 6"><line x1="-26" y1="-26" x2="26" y2="26" /><line x1="26" y1="-26" x2="-26" y2="26" /></g>
      <circle cx="50" cy="50" r="27" fill="none" stroke={look.players[1]} strokeWidth="8" strokeDasharray="11 7" strokeLinecap="round" />
    </svg>
  );
}

export function StartCard(props: StartProps) {
  const { mode, level, info } = props;
  const world = mode === "solo" ? worldOf(level) - 1 : 0;
  const chosen = MODES.find(choice => choice.mode === mode)!;
  const reach = (to: number) => to >= 1 && to <= 12 && (to <= props.open || to === props.visit);
  return (
    <section className="cj-start" data-world={world} aria-labelledby="cj-start-title">
      <header className="cj-mast">
        <p>ছক-জোড়া <span aria-hidden="true">·</span> নকশিকাঁথার খেলা</p>
        {mode === "solo" && <p className="cj-mast-stars" aria-label={`মোট ${bn(props.total)}টা তারা, ${bn(props.of)}টার মধ্যে`}>★ {bn(props.total)}/{bn(props.of)}</p>}
      </header>

      {props.friend && (
        <div className="cj-friend">
          <canvas ref={props.friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${feat(props.friend)}। বন্ধুর পুরো কাঁথা।`} />
          <p><b>{feat(props.friend)}।</b> চালগুলো মিলিয়ে দেখেছি, ফলটা সত্যি। {props.friend.level ? "একই শুরু, একই প্রতিপক্ষ, এবার তোমার পালা।" : "একই শুরু থেকে এবার তোমরা খেলো।"}</p>
        </div>
      )}

      <div className="cj-modes" role="radiogroup" aria-label="কীভাবে খেলবে">
        {MODES.map((choice, index) => (
          <button key={choice.mode} type="button" role="radio" aria-checked={mode === choice.mode} onClick={() => props.onMode(choice.mode)}>
            <small aria-hidden="true">{bn(index + 1)}</small>
            {choice.label}
            {props.newcomer && choice.mode === "solo" && <em>প্রথমবার? এখান থেকে</em>}
          </button>
        ))}
      </div>
      <p className="cj-mode-line">{chosen.line}</p>

      {mode === "solo" && info && <>
        <div className="cj-pick">
          <button type="button" className="cj-step" onClick={() => props.onLevel(level - 1)} disabled={!reach(level - 1)} aria-label="আগের লেভেল">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <div className="cj-pick-name">
            {info.finale && <p className="cj-badge-finale">শেষ ধাপ</p>}
            <h2 id="cj-start-title">{info.finale ?? info.name}</h2>
            <p>লেভেল {bn(level)} · {WORLDS[world].name}{props.stars ? ` · ${"★".repeat(props.stars)}${"☆".repeat(3 - props.stars)}` : ""}</p>
          </div>
          <button type="button" className="cj-step" onClick={() => props.onLevel(level + 1)} disabled={!reach(level + 1)} aria-label="পরের লেভেল">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        <p className="cj-lesson"><b>{info.finale ? "চ্যালেঞ্জ" : "নতুন"}</b> {info.line}</p>
      </>}

      {mode === "pair" && <>
        <h2 id="cj-start-title" className="cj-pick-two">দুজনে, এক ফোনে</h2>
        <div className="cj-sizes" role="radiogroup" aria-label="কাঁথা কত বড়">
          {PAIR_SIZES.map(size => (
            <button key={size} type="button" role="radio" aria-checked={props.size === size} onClick={() => props.onSize(size)}>
              <b>{bn(size)}×{bn(size)}</b><span>{SIZE_WORDS[size]}</span>
            </button>
          ))}
        </div>
        <div className="cj-pair-names">
          {([0, 1] as const).map(player => (
            <label key={player} data-player={player}>
              <svg viewBox="-40 -40 80 80" aria-hidden="true"><Motif world={0} player={player} mark="" look={LOOKS[0]} /></svg>
              <span className="cj-sr">{player ? "নীল সুতোর নাম" : "লাল সুতোর নাম"}</span>
              <input value={props.names[player]} maxLength={MAX_NAME} placeholder={player ? "নীল সুতো" : "লাল সুতো"} autoComplete="off"
                onChange={event => props.onNames(player ? [props.names[0], event.target.value] : [event.target.value, props.names[1]])} />
            </label>
          ))}
        </div>
      </>}

      {mode === "kata" && <h2 id="cj-start-title" className="cj-pick-two">কাটাকুটি</h2>}

      <button type="button" className="cj-go" onClick={props.onStart}>
        <span className="cj-go-cloth">{mode === "kata" ? <KataPatch /> : <ClothBoard game={props.game} world={world} marks={["", ""]} hint={-1} />}
          <svg className="cj-needle" viewBox="0 0 100 100" aria-hidden="true"><path d="M18 82 80 20" stroke="#8c8c8c" strokeWidth="5" strokeLinecap="round" /><circle cx="76" cy="24" r="4" fill="none" stroke="#5c5c5c" strokeWidth="2.4" /><path d="M76 24C90 34 70 52 86 64" stroke={LOOKS[world].players[0]} strokeWidth="3" fill="none" strokeLinecap="round" /></svg>
        </span>
        <span className="cj-go-label">{mode === "kata" ? "খেলা শুরু" : "সেলাই শুরু"}<kbd aria-hidden="true">Enter</kbd></span>
      </button>

      <p className="cj-start-foot">
        {mode === "solo" && <span>{starRule(level)}</span>}
        {mode === "solo" && <button type="button" className="kit-link" onClick={props.onSheet}>সব লেভেল</button>}
      </p>
    </section>
  );
}

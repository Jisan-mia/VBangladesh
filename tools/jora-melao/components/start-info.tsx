"use client";
// Under the board on the start screen: which level (‹ ›), what is new in it (before → after), the facts, সব লেভেল, and
// the mode (একা or দুজনে). The start action itself is the fair sign across the board (jora-game.tsx), the biggest thing here.
import type { RefObject } from "react";
import { cardSizes } from "../../../shared/card-canvas";
import { MAX_NAME } from "../../../shared/game-core";
import { DUO_SIZES, LEVEL_COUNT, WORLDS, changes, finaleName, isFinale, lesson, worldOf, type DuoSize, type Spec } from "../lib/levels";
import { DEFAULT_NAMES, bn, friendBanner, friendNote, type Card } from "../lib/link";
import { PLAYER_COLORS } from "../lib/draw-card";
import type { CSSProperties } from "react";

export type Mode = "solo" | "duo";

export function StartInfo({ level, spec, old, mode, duoCards, stars, canBack, canNext, friend, friendCanvas, names, onLevel, onSheet, onMode, onDuoCards, onName }: {
  level: number; spec: Spec; old: boolean; mode: Mode; duoCards: DuoSize; stars: number; canBack: boolean; canNext: boolean;
  friend: Card | null; friendCanvas: RefObject<HTMLCanvasElement | null>; names: readonly [string, string];
  onLevel: (level: number) => void; onSheet: () => void; onMode: (mode: Mode) => void; onDuoCards: (cards: DuoSize) => void; onName: (seat: 0 | 1, value: string) => void;
}) {
  const finale = !old && mode === "solo" ? finaleName(level) : "";
  const ladder = !old && mode === "solo";
  const tap = (run: () => void) => (event: { currentTarget: HTMLButtonElement }) => { event.currentTarget.blur(); run(); };
  return (
    <div className="jm-start">
      {friend && (
        <div className="jm-friend">
          <canvas ref={friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label="বন্ধুর কার্ড" />
          <p><b>{friendBanner(friend)}</b> {friendNote(friend)}</p>
        </div>
      )}
      {ladder ? (
        <>
          <div className="jm-pick">
            <button type="button" className="jm-step" onClick={tap(() => onLevel(level - 1))} disabled={!canBack} aria-label="আগের লেভেল">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <div className="jm-pick-name">
              {finale && <span className="jm-finale-badge">শেষ বোর্ড</span>}
              <h2>{isFinale(level) ? finale : `লেভেল ${bn(level)}`}</h2>
              <p>{WORLDS[worldOf(level)].name} · {bn(spec.pairs)} জোড়া{stars ? ` · ${"★".repeat(stars)}` : ""}</p>
            </div>
            <button type="button" className="jm-step" onClick={tap(() => onLevel(level + 1))} disabled={!canNext || level >= LEVEL_COUNT} aria-label="পরের লেভেল">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <p className="jm-lesson">
            <b>{isFinale(level) ? "শেষ বোর্ড" : level === 1 ? "শুরু" : "নতুন"}</b> {lesson(level)}
            <span className="jm-chips">{changes(level).slice(0, 3).map(chip => <i key={chip}>{chip}</i>)}</span>
          </p>
          <p className="jm-facts">৩ তারা {bn(spec.three)} চালে · ২ তারা {bn(spec.two)} চালে</p>
          <button type="button" className="jm-link jm-all" onClick={tap(onSheet)}>সব লেভেল</button>
        </>
      ) : (
        <p className="jm-lesson">
          <b>{old ? "পুরোনো বোর্ড" : "দুজনে"}</b> {old ? `${bn(spec.pairs)} জোড়া, আগের মতো। এতে তারা জমে না।` : "পালা করে খোলো। না মিললে পালা বদলায়, মিললে আবার নিজের পালা। যার জোড়া বেশি, সে জেতে।"}
        </p>
      )}
      <div className="jm-modes" role="group" aria-label="কে খেলবে">
        <button type="button" aria-pressed={mode === "solo"} onClick={tap(() => onMode("solo"))}><kbd aria-hidden="true">১</kbd>একা</button>
        <button type="button" aria-pressed={mode === "duo"} onClick={tap(() => onMode("duo"))}><kbd aria-hidden="true">২</kbd>দুজনে</button>
        {mode === "duo" && DUO_SIZES.map(cards => (
          <button key={cards} type="button" className="jm-size" aria-pressed={duoCards === cards} onClick={tap(() => onDuoCards(cards))}>{bn(cards / 2)} জোড়া</button>
        ))}
      </div>
      {mode === "duo" && (
        <div className="jm-names">
          {([0, 1] as const).map(seat => (
            <label key={seat} style={{ "--who": PLAYER_COLORS[seat] } as CSSProperties}>
              <i aria-hidden="true" />
              <input value={names[seat]} maxLength={MAX_NAME} placeholder={DEFAULT_NAMES[seat]} aria-label={`${DEFAULT_NAMES[seat]} খেলোয়াড়ের নাম, না দিলেও চলবে`} autoComplete="off" onChange={event => onName(seat, event.target.value)} />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

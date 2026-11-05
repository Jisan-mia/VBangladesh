"use client";
// The title screen: the board behind, and on it the big die, the biggest thing on screen. Under the board, small: one
// chip for একা (the level ladder) or সবাই মিলে (one phone, 2–4 seats), and that mode's few choices, each said in one line.
import type { CSSProperties, RefObject } from "react";
import { cardSizes } from "../../../shared/card-canvas";
import type { LevelStars } from "../../../shared/game-core";
import { LEVEL_COUNT, levelOf, RIVALS, WORLDS } from "../lib/levels";
import { bn, friendBanner, friendNote, headline, MAX_PLAYER_NAME, SEAT_NAMES, type Result } from "../lib/result";
import type { Prefs } from "../lib/save";
import { SEATS } from "../lib/art";
import { Die } from "./die";

export function Shape({ seat, size = 18 }: { seat: number; size?: number }) {
  const { color, deep, shape } = SEATS[seat];
  const body = shape === "circle" ? <circle cx="12" cy="12" r="8" /> : shape === "square" ? <rect x="4.5" y="4.5" width="15" height="15" rx="3.5" />
    : shape === "triangle" ? <path d="M12 3.5 21 19.5H3Z" /> : <path d="M12 2.5 20.5 12 12 21.5 3.5 12Z" />;
  return <svg className="sl-shape" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill={color} stroke={deep} strokeWidth="2" strokeLinejoin="round">{body}</g></svg>;
}

const starRow = (earned: number) => [0, 1, 2].map(index => <i key={index} data-on={index < earned || undefined}>★</i>);

/** The big die on the board: tap it and the first roll is thrown at once. */
export function StartDie({ label, sub, slow, onStart }: { label: string; sub: string; slow: boolean; onStart: () => void }) {
  return (
    <div className="sl-title-cover">
      <button type="button" className="sl-go" onClick={onStart} data-first>
        <Die value={0} spin={0} slow={slow} idle />
        <span className="sl-go-label">{label}</span>
        <small>{sub}</small>
      </button>
    </div>
  );
}

export type SetupProps = {
  prefs: Prefs;
  open: number;
  visit: number;
  stars: LevelStars;
  names: string[];
  friend: Result | null;
  friendCanvas: RefObject<HTMLCanvasElement | null>;
  onMode: (mode: Prefs["mode"]) => void;
  onLevel: (level: number) => void;
  onSheet: () => void;
  onSeats: (seats: Prefs["seats"]) => void;
  onBot: (seat: number) => void;
  onTwo: () => void;
  onName: (seat: number, name: string) => void;
};

export function StartSetup(props: SetupProps) {
  const { prefs, friend } = props;
  const level = levelOf(prefs.level), world = WORLDS[level.world], earned = props.stars[level.id] ?? 0;
  const canNext = level.id < LEVEL_COUNT && (level.id + 1 <= props.open || level.id + 1 === props.visit);
  const seatList = Array.from({ length: prefs.seats }, (_, seat) => seat);
  const isBot = (seat: number) => seat > 0 && ((prefs.bots >> seat) & 1) === 1;
  const who = seatList.map(seat => isBot(seat) ? RIVALS[seat - 1].name : props.names[seat].trim() || SEAT_NAMES[seat]);
  const press = (run: () => void) => (event: { currentTarget: HTMLElement }) => { event.currentTarget.blur(); run(); };
  return (
    <div className="sl-setup">
      {friend && (
        <section className="sl-friend" aria-labelledby="sl-friend-title">
          <canvas ref={props.friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`বন্ধুর কার্ড: ${headline(friend)}`} />
          <div>
            <h2 id="sl-friend-title">{friendBanner(friend)}</h2>
            <p>{friendNote(friend)}</p>
          </div>
        </section>
      )}
      <div className="sl-modes" role="radiogroup" aria-label="কীভাবে খেলবে">
        <button type="button" role="radio" aria-checked={prefs.mode === "solo"} onClick={press(() => props.onMode("solo"))}>
          <b>একা</b><small>লেভেল {bn(level.id)} · {world.name}</small>
        </button>
        <button type="button" role="radio" aria-checked={prefs.mode === "group"} onClick={press(() => props.onMode("group"))}>
          <b>সবাই মিলে</b><small>এক ফোনে ২–৪ জন</small>
        </button>
      </div>

      {prefs.mode === "solo" ? (
        <div className="sl-level" data-finale={level.boss ? "" : undefined}>
          <button type="button" className="sl-step" onClick={press(() => props.onLevel(level.id - 1))} disabled={level.id <= 1} aria-label="আগের লেভেল">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <div className="sl-level-text">
            <p className="sl-level-name">{level.boss && <em>শেষ খেলা</em>}লেভেল {bn(level.id)} · <b>{level.name}</b></p>
            <p className="sl-lesson">{level.boss ? level.boss.line : level.lesson}</p>
            <p className="sl-stars-line" aria-label={`তারা: ঘরে ফেরো, সবার আগে, ${bn(level.par)} চালের মধ্যে${earned ? `। তোমার ${bn(earned)} তারা` : ""}`}>
              <span aria-hidden="true">★ ঘরে ফেরো · ★ সবার আগে · ★ {bn(level.par)} চালের মধ্যে</span>
              {earned > 0 && <span className="sl-got" aria-hidden="true">{starRow(earned)}</span>}
            </p>
          </div>
          <button type="button" className="sl-step" onClick={press(() => props.onLevel(level.id + 1))} disabled={!canNext} aria-label="পরের লেভেল">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
          <button type="button" className="kit-link sl-all" onClick={press(props.onSheet)}>সব লেভেল</button>
        </div>
      ) : (
        <div className="sl-group">
          <div className="sl-seg" role="radiogroup" aria-label="কয়জন খেলবে">
            {([2, 3, 4] as const).map(count => (
              <button key={count} type="button" role="radio" aria-checked={prefs.seats === count} onClick={press(() => props.onSeats(count))}>{bn(count)} জন</button>
            ))}
          </div>
          <ul className="sl-seat-setup">
            {seatList.map(seat => (
              <li key={seat} style={{ "--seat": SEATS[seat].color } as CSSProperties}>
                <Shape seat={seat} />
                {isBot(seat)
                  ? <span className="sl-bot-name">{RIVALS[seat - 1].name}<small>{RIVALS[seat - 1].line}</small></span>
                  : <input value={props.names[seat]} maxLength={MAX_PLAYER_NAME} placeholder={SEAT_NAMES[seat]} aria-label={`${SEAT_NAMES[seat]} গুটির খেলোয়াড়ের নাম`} autoComplete="off" onChange={event => props.onName(seat, event.target.value)} />}
                {seat > 0 && (
                  <button type="button" className="sl-kind" aria-pressed={isBot(seat)} onClick={press(() => props.onBot(seat))} aria-label={`${SEAT_NAMES[seat]} গুটি: ${isBot(seat) ? "কম্পিউটার" : "মানুষ"}। বদলাতে চাপো`}>
                    {isBot(seat) ? "কম্পিউটার" : "মানুষ"}
                  </button>
                )}
              </li>
            ))}
          </ul>
          <div className="sl-group-row">
            <button type="button" className="sl-toggle" aria-pressed={prefs.two} onClick={press(props.onTwo)}><i aria-hidden="true" />দুই গুটি</button>
            <p className="sl-lesson">{prefs.two ? "প্রত্যেকের দুটো গুটি, যেকোনো একটা আগে ১০০-তে তুললেই জিত।" : `${who.join(", ")}: যে আগে ঠিক ১০০-তে ওঠে, সে জিতবে।`}</p>
          </div>
        </div>
      )}
    </div>
  );
}

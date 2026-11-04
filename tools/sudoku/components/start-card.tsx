"use client";
// The start card: a folded puzzle page over the stage. The biggest thing on it is the ink stamp that starts the clock.
// The grid stays hidden until then, so nobody solves it for free while the clock reads zero.
import type { RefObject } from "react";
import { cardSizes } from "../../../shared/card-canvas";
import { possessive } from "../../../shared/bangla";
import { DAILIES, DAILY_ORDER, LESSONS, LEVELS, type DailyKind } from "../lib/levels";
import { tierOf, type Puzzle } from "../lib/game";
import { bn, clock, dayLabel, duration, feat, finaleName, type Shared } from "../lib/link";

const WEEKDAYS = ["র", "সো", "ম", "বু", "বৃ", "শু", "শ"];

/** The start card's art: this puzzle's empty frame (no digits, so nothing is solved before the clock runs) and a pen. */
function GridArt({ n, rows, cols }: { n: number; rows: number; cols: number }) {
  const step = 100 / n, lines = [];
  for (let i = 1; i < n; i++) {
    const at = i * step;
    lines.push(<path key={`r${i}`} d={`M0 ${at}H100`} className={i % rows ? "thin" : "thick"} />);
    lines.push(<path key={`c${i}`} d={`M${at} 0V100`} className={i % cols ? "thin" : "thick"} />);
  }
  return (
    <svg className="sd-art" viewBox="-4 -4 108 108" aria-hidden="true">
      <rect x="0" y="0" width="100" height="100" className="sheet" />
      <rect x={step} y={step} width={step} height={step} className="marker" />
      {lines}
      <rect x="0" y="0" width="100" height="100" className="frame" />
      <g className="pen" transform="translate(64 60) rotate(-35)"><rect x="0" y="-3" width="40" height="6" rx="2" /><path d="M0 -3 L-7 0 L0 3z" /></g>
    </svg>
  );
}

export type StartProps = {
  puzzle: Puzzle;
  stars: number;
  open: number;
  visit: number;
  saved: { seconds: number; filled: number } | null;
  friend: Shared | null;
  friendHere: boolean;
  friendCanvas: RefObject<HTMLCanvasElement | null>;
  week: { day: number; done: boolean }[];
  streak: number;
  today: number;
  kind: DailyKind;
  onStart: () => void;
  onFresh: () => void;
  onLevel: (level: number) => void;
  onDaily: (kind: DailyKind) => void;
  onLevels: () => void;
  onSheet: () => void;
};

export function StartCard(props: StartProps) {
  const { puzzle, saved, friend, friendHere } = props;
  const level = "level" in puzzle ? puzzle.level : 0;
  const daily = "day" in puzzle ? puzzle : null;
  const { n } = puzzle.shape;
  const finale = finaleName(level);
  const tier = level ? tierOf(level) : null;
  const next = level + 1, nextOpen = level > 0 && next <= LEVELS.length && (next <= props.open || next === props.visit);
  // What the next level changes, when it starts a new world: the grid's size, or else the paper.
  const nextWorld = level && next <= LEVELS.length && tierOf(next).from === next ? tierOf(next) : null;
  const change = !nextWorld ? "" : LEVELS[next - 1][0] !== n ? `${bn(LEVELS[next - 1][0])}×${bn(LEVELS[next - 1][0])} ছক` : nextWorld.paper;

  return (
    <section className="sd-start" aria-labelledby="sd-start-title" data-finale={finale ? "" : undefined}>
      <header className="sd-mast">
        <p>একটুখানি <span aria-hidden="true">·</span> ধাঁধার পাতা</p>
        <nav className="sd-tabs" aria-label="কোন ধাঁধা">
          <button type="button" aria-pressed={level > 0} onClick={props.onLevels}>লেভেল</button>
          <button type="button" aria-pressed={level === 0} onClick={() => props.onDaily(props.kind)}>আজকের ধাঁধা</button>
        </nav>
      </header>

      {friend && friendHere && (
        <div className="sd-friend">
          <canvas ref={props.friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${feat(friend)}। বন্ধুর কার্ড।`} />
          <p><b>{feat(friend)}।</b> একই ছক, এবার তোমার পালা। সময়টা {friend.name ? possessive(friend.name) : "বন্ধুর"} নিজের ফোনের হিসাব।</p>
        </div>
      )}

      {level ? (
        <div className="sd-pick">
          <button type="button" className="sd-step" onClick={() => props.onLevel(level - 1)} disabled={level <= 1} aria-label="আগের লেভেল">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <div className="sd-pick-name">
            {finale && <p className="sd-badge-finale">শেষ ধাঁধা</p>}
            <h2 id="sd-start-title">{finale || `লেভেল ${bn(level)}`}</h2>
            <p>{finale ? `লেভেল ${bn(level)} · ` : ""}{tier?.paper} · {bn(n)}×{bn(n)}</p>
          </div>
          <button type="button" className="sd-step" onClick={() => props.onLevel(next)} disabled={!nextOpen} aria-label={change ? `পরের লেভেল, এবার ${change}` : "পরের লেভেল"}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      ) : (
        <div className="sd-pick sd-pick-day">
          <div className="sd-pick-name">
            <h2 id="sd-start-title">{daily ? dayLabel(daily.day) : ""}{!daily || daily.day === props.today ? "" : " (পুরোনো)"}</h2>
            <p>রোজের ধাঁধা · {bn(n)}×{bn(n)}</p>
          </div>
        </div>
      )}

      {level ? (
        <p className="sd-lesson"><b>{finale ? "চ্যালেঞ্জ" : "নতুন"}</b> {LESSONS[level - 1]}</p>
      ) : (
        <>
          <div className="sd-kinds" role="radiogroup" aria-label="কতটা কঠিন">
            {DAILY_ORDER.map((kind, index) => (
              <button key={kind} type="button" role="radio" aria-checked={daily?.kind === kind} onClick={() => props.onDaily(kind)}>
                <small aria-hidden="true">{bn(index + 1)}</small>{DAILIES[kind].name}
              </button>
            ))}
          </div>
          <p className="sd-lesson">{DAILIES[daily?.kind ?? "h"].line}</p>
          <ol className="sd-week" aria-label={`গত সাত দিন, টানা ${bn(props.streak)} দিন`}>
            {props.week.map(({ day, done }) => (
              <li key={day} data-done={done || undefined} data-today={day === props.today || undefined}
                aria-label={`${dayLabel(day)}${done ? ", মেলানো" : ""}`}>{WEEKDAYS[new Date(Date.UTC(Math.floor(day / 10000), Math.floor(day / 100) % 100 - 1, day % 100)).getUTCDay()]}</li>
            ))}
            <li className="sd-streak" aria-hidden="true">{props.streak ? `টানা ${bn(props.streak)} দিন` : "আজ প্রথম দিন"}</li>
          </ol>
        </>
      )}

      <GridArt n={n} rows={puzzle.shape.rows} cols={puzzle.shape.cols} />

      <p className="sd-par">
        <span className="sd-par-stars" aria-hidden="true">★★★</span> {duration(puzzle.par)}ের মধ্যে
        {level > 0 && props.stars > 0 && <span className="sd-got"> · তোমার {bn(props.stars)} তারা</span>}
      </p>

      <button type="button" className="sd-go" onClick={props.onStart} data-first>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1-5L16 4l4 4L9 19z" /><path d="M14 6l4 4" /></svg>
        <span>{saved ? "চালিয়ে যাও" : "শুরু করো"}{saved && <small>{clock(saved.seconds)} · {bn(saved.filled)}/{bn(puzzle.empty)} ঘর</small>}</span>
      </button>
      <p className="sd-start-foot">
        {saved && <button type="button" className="kit-link" onClick={props.onFresh}>নতুন করে শুরু</button>}
        {level > 0 && <button type="button" className="kit-link" onClick={props.onSheet}>সব লেভেল</button>}
        {change && nextOpen && <span>পরের লেভেলে নতুন: {change}</span>}
      </p>
    </section>
  );
}

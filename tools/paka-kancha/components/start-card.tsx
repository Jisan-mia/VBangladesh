"use client";
// The start card over the stage. The biggest thing on it is the level's own picture (a basket of mangoes, or the boss's lock)
// with শুরু করো across it. Above: the mode, ‹ level › with its name and world, the world's twist and the one new thing.
import type { RefObject } from "react";
import { cardSizes } from "../../../shared/card-canvas";
import { WORLDS, isFinale, worldOf, type Level } from "../lib/levels";
import { badge, friendBanner, type Shared } from "../lib/link";
import { limitsOf, rulesOf } from "../lib/play";
import { bn, type Mark, type Puzzle } from "../lib/rules";
import { Row } from "./board-view";
import { Mango } from "./mango";
import { BasketArt, LockArt } from "./start-art";

export type StartProps = {
  puzzle: Puzzle;
  today: string;
  info: Level | null;
  mode: "level" | "day" | "other";
  stars: number;
  /** Your own open level, a friend's level you may visit, and the stars so far. */
  open: number;
  visit: number;
  total: number;
  of: number;
  /** Tries already made on a saved game of today's code. */
  saved: number;
  friend: Shared | null;
  friendCanvas: RefObject<HTMLCanvasElement | null>;
  onMode: (mode: "level" | "day") => void;
  onLevel: (level: number) => void;
  onStart: () => void;
  onSheet: () => void;
  onMake: () => void;
  onHome: () => void;
};

const EXAMPLE: { guess: string; marks: Mark[] } = { guess: "5281", marks: ["p", "a", "k", "k"] };

export function Legend({ basket }: { basket: boolean }) {
  return <ul className="pk-legend">
    {([["p", "ঠিক ঘরে"], ["a", "আছে, অন্য ঘরে"], ["k", basket ? "পড়ে না" : "নেই"]] as const).map(([mark, hint]) => <li key={mark}><Mango mark={mark} /><span><b>{{ p: "পাকা", a: "আধপাকা", k: "কাঁচা" }[mark]}</b> {hint}</span></li>)}
  </ul>;
}

export function StartCard(props: StartProps) {
  const { puzzle, info, today } = props;
  const level = puzzle.kind === "level" ? puzzle.level : 0, legacy = puzzle.kind === "level" && Boolean(puzzle.legacy);
  const ladder = level > 0 && !legacy;
  const rules = rulesOf(puzzle);
  const basket = rules.feedback === "basket";
  const world = ladder ? worldOf(level) - 1 : 0, house = WORLDS[world];
  const finale = ladder && isFinale(level) ? info?.finale : undefined;
  const reach = (to: number) => to >= 1 && to <= 18 && (to <= props.open || to === props.visit);
  const limits = limitsOf(puzzle);
  const tag = badge(puzzle, today);
  const banner = props.friend ? friendBanner(props.friend, today) : null;
  return (
    <section className="pk-start" aria-labelledby="pk-start-title">
      <header className="pk-mast">
        <p>পাকা-কাঁচা <span aria-hidden="true">·</span> কোড ধরার ধাঁধা</p>
        <p className="pk-mast-stars" aria-label={`মোট ${bn(props.total)}টা তারা, ${bn(props.of)}টার মধ্যে`}>★ {bn(props.total)}/{bn(props.of)}</p>
      </header>

      <div className="pk-modes" role="group" aria-label="কোন খেলা">
        <button type="button" aria-pressed={props.mode === "level"} onClick={() => props.onMode("level")}>লেভেল</button>
        <button type="button" aria-pressed={props.mode === "day"} onClick={() => props.onMode("day")}>আজকের কোড</button>
      </div>

      {props.friend && banner && (
        <div className="pk-friend" data-invite={!props.friend.rows.length || undefined}>
          {props.friend.rows.length > 0 && <canvas ref={props.friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${banner.title} শুধু আম, কোনো অঙ্ক নেই।`} />}
          <p><b>{banner.title}</b> {banner.sub}</p>
        </div>
      )}

      {ladder ? (
        <div className="pk-pick">
          <button type="button" className="pk-step" onClick={() => props.onLevel(level - 1)} disabled={!reach(level - 1)} aria-label="আগের লেভেল">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <div className="pk-pick-name">
            {finale && <p className="pk-badge-finale">শেষ কোড</p>}
            <h2 id="pk-start-title">{finale ?? info?.name}</h2>
            <p>লেভেল {bn(level)} · {house.name}{props.stars ? ` · ${"★".repeat(props.stars)}${"☆".repeat(3 - props.stars)}` : ""}</p>
          </div>
          <button type="button" className="pk-step" onClick={() => props.onLevel(level + 1)} disabled={!reach(level + 1)} aria-label="পরের লেভেল">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      ) : (
        <div className="pk-pick" data-plain>
          <span />
          <div className="pk-pick-name">
            <h2 id="pk-start-title">{tag.main}</h2>
            <p>{puzzle.kind === "day" ? `${tag.sub} · ` : ""}{rules.digits >= 10 ? "০ থেকে ৯" : `১ থেকে ${bn(rules.digits)}`} · সুযোগ {bn(rules.tries)} বার</p>
          </div>
          <span />
        </div>
      )}

      {ladder && house.rule && (
        <p className="pk-rule" data-world={world}><span><b>{house.twist}:</b> {house.rule}</span></p>
      )}
      {ladder
        ? <p className="pk-lesson"><b>{finale ? "চ্যালেঞ্জ" : "নতুন"}</b> {info?.line}</p>
        : <p className="pk-lesson"><b>{legacy ? "পুরোনো লেভেল" : puzzle.kind === "day" ? "রোজ নতুন" : "কোড"}</b> {legacy ? "বন্ধুর পাঠানো লেভেল, আগের নিয়মে।" : "চারটা অঙ্কই আলাদা। ক্রমটাও মিলতে হবে।"}</p>}

      {ladder && level === 1
        ? <div className="pk-example"><p>এভাবে বুঝবে <span>(উদাহরণ)</span></p><ol className="pk-rows"><Row guess={EXAMPLE.guess} marks={EXAMPLE.marks} /></ol><Legend basket={false} /></div>
        : <Legend basket={basket} />}

      <button type="button" className="pk-go" onClick={props.onStart} data-first>
        <span className="pk-go-art">{finale ? <LockArt /> : <BasketArt />}</span>
        <span className="pk-go-label">{props.saved ? "চালিয়ে যাও" : "শুরু করো"}<kbd aria-hidden="true">Enter</kbd></span>
      </button>

      <p className="pk-start-foot">
        <span>{limits ? `★★★ ${bn(limits.three)} বারে · ★★ ${bn(limits.two)} পর্যন্ত` : props.saved ? `${bn(props.saved)} বার হয়ে গেছে` : "কম বারে ধরলে সেরা"}</span>
        {legacy || !ladder
          ? <button type="button" className="kit-link" onClick={props.onHome}>নিজের লেভেলে ফেরো</button>
          : <button type="button" className="kit-link" onClick={props.onSheet}>সব লেভেল</button>}
        <button type="button" className="kit-link" onClick={props.onMake}>বন্ধুর জন্য কোড বানাও</button>
      </p>
    </section>
  );
}

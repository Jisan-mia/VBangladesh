"use client";
// The picture of the job (the sky and one object) beside the target: the small clock, the words. For "read" items the same card
// asks the question, and the choices are cards with their own small clock and words.
import type { ReactNode } from "react";
import { bn } from "../../../shared/kids-kit";
import { cardKey, say, type Item, type Round } from "../lib/round";
import type { Level } from "../lib/levels";
import { partOf } from "../lib/time";
import { Scene } from "./art";
import { MiniClock } from "./face";

/** Set: the target as a picture clock, its words and the sky. Read: the question. In the last world the small clock comes after a first slip. */
export function AskCard({ item, level, showClock, solved }: { item: Item; level: Level; showClock: boolean; solved: boolean }) {
  const set = item.mode === "set";
  return <div className={`gd-ask${solved ? " alive" : ""}`}>
    <Scene activity={item.activity.id} part={partOf(item.time.h)} />
    <div className="gd-ask-text">
      <p className="gd-words">{set || solved ? say(item.time, level) : "কয়টা বাজে?"}</p>
      <p className="gd-what">{item.activity.name}</p>
    </div>
    {set
      ? (showClock ? <MiniClock time={item.time} size={76} label={`লক্ষ্য: ${say(item.time, level)}`} tone="ghost" /> : <span className="gd-mini-empty" aria-hidden="true">?</span>)
      : <span className="gd-mini-empty gd-q" aria-hidden="true">?</span>}
  </div>;
}

/** The "কয়টা বাজে?" cards. Number keys 1–4 pick them. */
export function ReadCards({ round, level, glow, onPick, setNode, after }: {
  round: Round; level: Level; glow: boolean; onPick: (time: { h: number; m: number }, card: HTMLButtonElement) => void; setNode: (at: number, node: HTMLButtonElement | null) => void; after?: ReactNode;
}) {
  const item = round.items[round.index], target = cardKey(item.time);
  // Once it is right, only the right card stays, with ▶ beside it: the row keeps its height.
  return <div className={`gd-cards n${round.solved ? 2 : round.choices.length}`}>
    {round.choices.map((time, at) => {
      if (round.solved && cardKey(time) !== target) return null;
      const id = cardKey(time), ok = id === target, tried = round.tried.includes(id);
      // Pictures show on every card in the early worlds; later a card shows its clock once it has been tried, or when it glows.
      const clock = level.pickClock === "always" || tried || (ok && (glow || round.solved)) || round.solved;
      return <button key={`${round.index}-${id}`} ref={node => setNode(at, node)} type="button" disabled={tried || (round.solved && !ok)}
        className={`gd-pick${ok && glow ? " glow" : ""}${ok && round.solved ? " right" : ""}${tried ? " tried" : ""}`}
        aria-label={`${bn(at + 1)}: ${say(time, level)}`}
        onPointerDown={event => { if (!event.isPrimary || event.button !== 0) return; event.preventDefault(); onPick(time, event.currentTarget); }}
        onClick={event => { if (event.detail === 0) onPick(time, event.currentTarget); }}>
        <span className="gd-key" aria-hidden="true">{bn(at + 1)}</span>
        {clock && <MiniClock time={time} size={round.choices.length >= 4 ? 48 : 64} />}
        <span className="gd-pick-words">{say(time, level)}</span>
      </button>;
    })}
    {round.solved && after}
  </div>;
}

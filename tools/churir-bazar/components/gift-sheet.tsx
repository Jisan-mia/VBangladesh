"use client";
// The finale's gift: a choice that pauses play before the last tray of a মেলা. Three numbered cards, each with its real
// effect (before → after) and one marked এটা ভালো হবে. Keys 1–3 pick; a fourth line starts without a gift.
import { useEffect } from "react";
import { GIFTS } from "../lib/ladder";
import type { Spec } from "../lib/ladder";
import { baseLimit, type Run } from "../lib/rules";
import { bn } from "../lib/words";

/** The gift that helps most: a tight level wants the moves, otherwise a রংধনু. */
export const recommendedGift = (spec: Spec) => (spec.bot / spec.moves > 0.62 ? 3 : spec.goals.some(goal => goal[0] === 20) ? 2 : 1);
/** "০ → ১" and the like, from the level itself. */
export function giftChange(gift: number, run: Run, spec: Spec) {
  if (gift === 1) return `রংধনু ০ → ১`;
  if (gift === 2) return `ঝিকমিক ০ → ২`;
  const base = baseLimit(spec, run.mode);
  return `চাল ${bn(base)} → ${bn(base + 3)}`;
}

export function GiftSheet({ run, spec, name, onPick, onSkip }: { run: Run; spec: Spec; name: string; onPick: (gift: number) => void; onSkip: () => void }) {
  const best = recommendedGift(spec);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      const digit = /^[1-3]$/.test(event.key) ? Number(event.key) : "১২৩".indexOf(event.key) + 1;
      if (digit >= 1 && digit <= 3) { event.preventDefault(); onPick(digit); }
      else if (event.key === "Enter" || event.key === " ") event.preventDefault();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onPick]);
  return (
    <div className="cb-gift" role="dialog" aria-modal="true" aria-labelledby="cb-gift-title">
      <p className="cb-gift-kicker">শেষ ধাপ · {name}</p>
      <h2 id="cb-gift-title">খালা একটা উপহার দিচ্ছেন</h2>
      <ol>
        {GIFTS.map((gift, index) => (
          <li key={gift.name}>
            <button type="button" data-best={index + 1 === best ? "" : undefined} onClick={event => { event.currentTarget.blur(); onPick(index + 1); }}>
              <kbd aria-hidden="true">{bn(index + 1)}</kbd>
              <b>{gift.name}</b>
              <i>{giftChange(index + 1, run, spec)}</i>
              <span>{gift.line}</span>
              {index + 1 === best && <em>এটা ভালো হবে</em>}
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="cb-gift-skip" onClick={event => { event.currentTarget.blur(); onSkip(); }}>উপহার ছাড়াই খেলব</button>
    </div>
  );
}

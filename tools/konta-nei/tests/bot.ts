// A headless player for the difficulty tests. It looks at the shelf for the level's time and remembers each thing with a
// chance that grows with the time per thing; names on the tags, look-alikes and a reshuffled shelf make that harder.
// When the eyes open it rules out every picture still on the shelf (it can see them), picks the gone thing if it
// remembers it, and otherwise guesses among the pictures that are left. Now and then it slips and taps a picture that is
// on the shelf (a newcomer most of all). Answer times have human reaction and scanning. Seeded, so the rates are exact.
import { makeRng, pick } from "../../../shared/game-core";
import type { Spec } from "../lib/levels";
import type { Round } from "../lib/shelf";
import type { Answer } from "../lib/score";
import type { ItemId } from "../lib/items";

/** `rate` remembering per second per thing, `react` s to start, `scan` s per picture, `think` s when unsure, `slip` chance of a careless tap. */
export type Skill = { rate: number; react: number; scan: number; think: number; slip: number };
export const PLAYERS = {
  casual: { rate: 1.5, react: 1.1, scan: 0.7, think: 2.2, slip: 0.03 },
  steady: { rate: 2.1, react: 0.8, scan: 0.48, think: 1.5, slip: 0.015 },
  strong: { rate: 3.2, react: 0.55, scan: 0.3, think: 1, slip: 0.005 },
} as const satisfies Record<string, Skill>;

/** How hard the shelf is to hold in mind: things, less without names, more with look-alikes or a reshuffle. */
export function load(spec: Spec) {
  return spec.count * (spec.plain ? 1.15 : 1) * (spec.alike ? 1.2 : 1) * (spec.twist === "move" ? 1.15 : spec.twist === "swap" ? 1.05 : 1) * (spec.two ? 1.1 : 1);
}

/** One shelf, played. */
export function playRound(spec: Spec, round: Round, rng: () => number, skill: Skill): Answer {
  const remember = 1 - Math.exp(-skill.rate * spec.view / load(spec));
  const visible = new Set(round.after.filter((id): id is ItemId => id !== null));
  const candidates = round.choices.filter(id => !visible.has(id));
  const picks: ItemId[] = [];
  let seconds = skill.react + skill.scan * round.choices.length + (spec.twist === "move" ? 0.5 : 0);
  for (let k = 0; k < round.gone.length; k++) {
    const target = round.gone.find(id => !picks.includes(id))!;
    const left = candidates.filter(id => !picks.includes(id));
    let choice: ItemId;
    if (rng() < skill.slip * (round.newcomers.length ? 3 : 1)) {
      const onShelf = round.choices.filter(id => visible.has(id));
      choice = onShelf.length ? onShelf[pick(rng, onShelf.length)] : left[pick(rng, left.length)];
      seconds += skill.think * 0.3;
    } else if (rng() < remember) choice = target;
    else { choice = left[pick(rng, left.length)]; seconds += skill.think * (left.length > 1 ? 1 : 0.2); }
    picks.push(choice);
    if (k > 0) seconds += 0.6;
    if (!round.gone.includes(choice)) break;
  }
  seconds += (rng() - 0.5) * 0.4;
  return { picks, ms: Math.max(300, Math.round(seconds * 1000)) };
}

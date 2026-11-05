// Headless players for the difficulty tests. Each one reads a sum, works it out in a time that grows with how hard the
// sum is (carrying, borrowing, the bigger tables, a long bazaar list), taps one of four answers or types the digits, and
// now and then slips. The round runs on the real session reducer, so the penalties and the held clock are the game's.
// The masher taps a random answer as fast as a finger can. Seeded, so the rates are exact.
import { makeRng, pick } from "../../../shared/game-core";
import { answerRun, freshRun, makeDeck, starsOf, sumAt, ROUND_SECONDS, type Question } from "../lib/game";
import * as session from "../lib/session";

export type Skill = { react: number; speed: number; scan: number; typeMs: number; slip: number; err: number };
export const PLAYERS = {
  /** A child of 7 or 8 on world 1: slower to read, scan and work it out, slips more. */
  child: { react: 0.9, speed: 2.1, scan: 0.6, typeMs: 0.5, slip: 0.06, err: 0.04 },
  casual: { react: 0.5, speed: 1.2, scan: 0.3, typeMs: 0.3, slip: 0.04, err: 0.025 },
  steady: { react: 0.42, speed: 0.95, scan: 0.25, typeMs: 0.24, slip: 0.025, err: 0.016 },
  strong: { react: 0.34, speed: 0.68, scan: 0.18, typeMs: 0.18, slip: 0.012, err: 0.008 },
} as const satisfies Record<string, Skill>;

const B = (text: string) => Number(text.replace(/[০-৯]/g, d => String(d.charCodeAt(0) - 0x09e6)));
const digitsOf = (n: number) => String(Math.abs(n)).length;

/** Seconds of thinking for an average adult, before skill: how hard the sum is to hold and work out. */
export function effort(q: Question) {
  if (q.bazar) {
    const chars = q.lines.join("").length + q.ask.length;
    return 1.3 + chars * 0.035 + (q.lines.length - 1) * 0.9 + digitsOf(q.answer) * 0.35 + (/আধা|দেড়|আড়াই|ডজন .*হালি|বন্ধু|ফেরত/.test(q.lines.join() + q.ask) ? 0.9 : 0);
  }
  const parts = q.lines[0].split(" "), a = B(parts[0]), op = parts[1], b = B(parts[2]);
  if (parts.length > 3) return 3.2;
  if (op === "+") return 0.45 + ((a % 10) + (b % 10) >= 10 ? 0.6 : 0) + 0.35 * (Math.min(digitsOf(a), digitsOf(b)) - 1) + 0.15 * (Math.max(digitsOf(a), digitsOf(b)) - 1);
  if (op === "−") return 0.6 + ((a % 10) < (b % 10) ? 0.8 : 0) + 0.45 * (digitsOf(b) - 1) + 0.15 * (digitsOf(a) - 1);
  if (op === "×") { const m = Math.min(a, b), o = Math.max(a, b); return o > 10 ? 2.4 : 0.55 + (m >= 6 || o >= 7 ? 0.55 : 0) + (m === 1 || m === 2 || o === 10 ? -0.2 : 0); }
  return 1.2;
}

export type Played = { right: number; wrong: number; score: number; stars: number; firstStarAt: number };

/** One 60-second round of a level, played by `skill` (or the masher), on seed `seed`. */
export function playRound(level: number, seed: number, skill: Skill | "masher", t = session.TIMING): Played {
  const deck = makeDeck(level, seed), rng = makeRng((seed * 7919 + level) >>> 0);
  let s = session.begin(session.ready(ROUND_SECONDS * 1000), 0, t), now = t.drawer, run = freshRun(), firstStarAt = -1;
  const settle = () => { for (let k = 0; k < 4; k++) { const next = session.tick(s, now); if (next === s) break; s = next; } };
  settle();
  while (s.phase !== "over") {
    const q = sumAt(deck, run.index);
    let ok: boolean;
    if (skill === "masher") {
      now += 150 + 60 * rng();
      ok = q.choices ? q.choices[pick(rng, 4)] === q.answer : rng() < 0.001;
    } else {
      const think = skill.react + effort(q) * skill.speed * (0.7 + 0.6 * rng()) + (q.choices ? skill.scan : digitsOf(q.answer) * skill.typeMs);
      now += think * 1000;
      ok = rng() >= skill.slip + skill.err * effort(q);
    }
    settle();
    if (s.phase !== "play") break;
    run = answerRun(run, ok);
    s = ok ? session.right(s, now) : session.wrong(s, now, t);
    if (ok && firstStarAt < 0 && starsOf(level, run.right) >= 1) firstStarAt = session.roundMs(s, now) / 1000;
    if (s.phase === "lesson") { now += t.lesson; settle(); }
  }
  return { right: run.right, wrong: run.wrong, score: run.score, stars: starsOf(level, run.right), firstStarAt };
}

/** The share of seeds on which `test` holds. */
export function rate(level: number, skill: Skill | "masher", seeds: number, test: (p: Played) => boolean) {
  let hits = 0;
  for (let k = 0; k < seeds; k++) if (test(playRound(level, 1 + ((k * 2654435761) >>> 0) % 999_999_937, skill))) hits++;
  return hits / seeds;
}

// The evening's sounds, all synthesized through shared/game-sound.ts. Every later note is scheduled on the audio clock
// with tone(…, delay), never with setTimeout, so silenceScheduled() (the player's pause, a reset) can cut it.
import { buzz, hiss, tone } from "../../../shared/game-sound";
import { FLIP_GAP_MS } from "../lib/levels";

const GAP = FLIP_GAP_MS / 1000;

/** The signature: a brass থালা set down on the mat, ঠুং. */
export function clink() {
  tone(1480, 0.55, 0.06, "sine");
  tone(2230, 0.4, 0.035, "sine", 0.004);
  tone(745, 0.35, 0.05, "triangle");
  buzz(8);
}

/** A folded paper chit: one dry rustle for every role, so the sound never gives a chit away. */
export function rustle() { hiss(0.08, 0.1, 3600, "highpass"); hiss(0.1, 0.07, 2400, "bandpass", 0.06); }

/** Chits opening on the table, `count` of them, `gap` seconds apart. */
export function flips(count: number, gap = GAP, from = 0) {
  for (let index = 0; index < count; index++) hiss(0.07, 0.12, 5200, "highpass", from + index * gap);
}

/** Quick low taps that speed up, the way a reveal is drummed on a table. The finale drums longer. */
export function drumroll(finale: boolean) {
  let at = 0;
  const hits = finale ? 17 : 12;
  for (let hit = 0; hit < hits; hit++) { tone(120 + hit * 6, 0.07, 0.11, "triangle", at); at += Math.max(0.035, 0.085 - hit * 0.004); }
}

/** The reveal: the named chit flips, then the other, then the verdict. */
export function verdict(caught: boolean) {
  flips(2);
  const at = GAP * 2;
  if (caught) { tone(988, 0.09, 0.09, "triangle", at); tone(1319, 0.16, 0.08, "triangle", at + 0.07); }
  // The police named the ডাকাত: a falling whistle, a joke on the police, not a buzzer.
  else tone(620, 0.42, 0.09, "triangle", at, 240);
  buzz(caught ? 12 : 30);
}

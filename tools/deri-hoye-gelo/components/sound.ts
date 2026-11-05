// The road's sounds, all made in code by the shared kit. Anything longer than a blip is scheduled with tone()'s
// delay, so the player's pause (silenceScheduled) cuts it. Each has a visible twin, named beside it.
import { buzz, hiss, sfx, tone } from "../../../shared/game-kit";

/** A world's four-note motif at a level start, pitched per world. */
const MOTIF = [392, 494, 587, 784];
const WORLD_PITCH = [1, 1.12, 0.84];

export const sound = {
  /** Soft footsteps each stride (the legs). */
  step: (left: boolean) => tone(left ? 150 : 135, 0.05, 0.035, "sine", 0, 80),
  /** A hop (the stretch and the dust) and a landing (the squash). */
  hop: () => tone(380, 0.09, 0.05, "triangle", 0, 620),
  land: () => tone(120, 0.06, 0.06, "sine", 0, 70),
  /** ছপাৎ into a puddle or mud (the splash drops, the red edge). */
  splash: () => { sfx.splash(); buzz(30); },
  /** A trip over anything else (the kid in the dust, the shake, the red edge). */
  bump: () => { sfx.thud(); tone(196, 0.16, 0.06, "square", 0.05, 150); },
  /** A page caught: a note that climbs with each page (it flies to its HUD slot). */
  page: (count: number) => { sfx.pick(); sfx.combo(2 + count * 2); },
  tiffin: () => sfx.coin(),
  saved: () => { sfx.pop(); hiss(0.2, 0.12, 900); },
  /** A tyre's pointer at the right edge. */
  whoosh: () => sfx.whoosh(),
  /** Each second while you're running late (the orange edge). */
  tick: () => tone(1500, 0.03, 0.05, "square"),
  /** A finale notch (the bar loses one). */
  notch: () => { tone(523, 0.08, 0.06, "triangle"); tone(784, 0.14, 0.06, "triangle", 0.07); },
  milestone: () => sfx.tick(),
  /** The signature: the brass school bell. Bright and quick at the gate; slow and heavy when you're late. */
  bell: (late: boolean) => {
    for (let ring = 0; ring < (late ? 2 : 3); ring++) {
      const at = ring * (late ? 0.7 : 0.32), base = late ? 660 : 880;
      tone(base, late ? 1.2 : 0.8, 0.1, "triangle", at); tone(base * 1.5, 0.6, 0.045, "sine", at); tone(base * 2.51, 0.35, 0.025, "sine", at);
    }
    buzz(late ? [40, 60, 40] : [20, 40, 20]);
  },
  motif: (world: number) => MOTIF.forEach((note, at) => tone(note * WORLD_PITCH[world], 0.14, 0.07, "triangle", 0.05 + at * 0.12)),
  /** The end: the stars' chimes and a fanfare on three stars or a record, or a falling three when late. */
  stars: (count: number, party: boolean) => {
    for (let star = 0; star < count; star++) tone([1047, 1319, 1568][star], 0.18, 0.09, "triangle", 0.4 + star * 0.28);
    if (party) [784, 988, 1175, 1568].forEach((note, at) => tone(note, 0.16, 0.08, "triangle", 1.3 + at * 0.06));
  },
  lose: () => [392, 330, 262].forEach((note, at) => tone(note, 0.24, 0.08, "triangle", 0.5 + at * 0.14)),
};
